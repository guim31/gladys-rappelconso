// -----------------------------------------------------------------------------
// RappelConso client: the product recalls published in France, read from the
// open data of the French administration (data.economie.gouv.fr, Opendatasoft
// Explore API v2.1, dataset `rappelconso-v2-gtin-espaces`, Licence Ouverte
// v2.0). Public and keyless: no header carries a secret.
//
// Facts measured on 20/10/2026:
//   - about 90 recalls a week (three quarters of them food), so the recalls of
//     the last 8 days fit in one page of 100;
//   - the dataset keeps only the latest version of a recall sheet: a corrected
//     sheet comes back with `numero_version` 2 and a new `date_publication`;
//     the sheets of vehicles are published with version 0;
//   - `identification_produits` is a flat list, four cells a product (barcode,
//     batch, kind of date, date), the barcode of the second product onwards
//     prefixed with "|". It also holds batch numbers and free text: a barcode
//     is a token of 8 to 14 digits. `like "<code>"` finds a code wherever it
//     is in the list (`in (...)` misses the prefixed ones);
//   - the anonymous quota is 50,000 requests a day, shared by the IP address.
// -----------------------------------------------------------------------------

import { barcodeKey, categoryKey } from './config.js';

export const API_URL =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records';
export const SITE_URL = 'https://rappel.conso.gouv.fr';
export const USER_AGENT =
  'gladys-rappelconso (Gladys Assistant integration; +https://github.com/guim31/gladys-rappelconso)';

export const PAGE_SIZE = 100;
// 500 recalls in 8 days would be five times the usual flow: enough room, and a
// bound on what one cycle can cost the API.
export const MAX_PAGES = 5;
export const WINDOW_DAYS = 8;

// Only the columns the integration shows: the sheets also hold the phone
// number of the manufacturer and the list of distributors, not needed here.
export const FIELDS = [
  'id',
  'numero_fiche',
  'numero_version',
  'categorie_produit',
  'sous_categorie_produit',
  'marque_produit',
  'libelle',
  'modeles_ou_references',
  'identification_produits',
  'motif_rappel',
  'risques_encourus',
  'conduites_a_tenir_par_le_consommateur',
  'date_publication',
  'date_de_fin_de_la_procedure_de_rappel',
  'lien_vers_la_fiche_rappel',
  'lien_vers_affichette_pdf',
];

const DAY = 24 * 60 * 60 * 1000;

export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {number|null} status HTTP status, null for a network error or a bad body
   */
  constructor(message, status = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/** GET `url` and parse its JSON body. */
export async function getJson(fetchImpl, url, { timeoutMs = 30000 } = {}) {
  const host = new URL(url).host;
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason =
      err?.name === 'TimeoutError' ? `no answer in ${timeoutMs / 1000} s` : err.message;
    throw new HttpError(`${host}: ${reason}`);
  }
  if (response.status !== 200) {
    throw new HttpError(`${host}: HTTP ${response.status}`, response.status);
  }
  try {
    const body = JSON.parse(await response.text());
    if (!Array.isArray(body?.results)) {
      throw new Error('no results');
    }
    return body;
  } catch {
    throw new HttpError(`${host}: unexpected answer`, response.status);
  }
}

/** The URL of one page of records matching `where`, newest first. */
export function recordsUrl(where, page = 0) {
  const params = new URLSearchParams({
    select: FIELDS.join(','),
    where,
    order_by: 'date_publication desc, id desc',
    limit: String(PAGE_SIZE),
    offset: String(page * PAGE_SIZE),
  });
  return `${API_URL}?${params}`;
}

async function fetchAll(fetchImpl, where) {
  const recalls = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = await getJson(fetchImpl, recordsUrl(where, page));
    recalls.push(...body.results.map(normalizeRecall).filter(Boolean));
    if (body.results.length < PAGE_SIZE || (page + 1) * PAGE_SIZE >= body.total_count) {
      return { recalls, truncated: false };
    }
  }
  return { recalls, truncated: true };
}

const day = (time) => new Date(time).toISOString().slice(0, 10);

/** The recalls published (or corrected) in the last WINDOW_DAYS days. */
export function fetchRecent(fetchImpl, { now }) {
  return fetchAll(fetchImpl, `date_publication >= date'${day(now - WINDOW_DAYS * DAY)}'`);
}

/** Every variant a barcode may be written with in the dataset (with or without leading zeros). */
export function barcodeVariants(codes) {
  const variants = new Set();
  for (const code of codes) {
    const key = barcodeKey(code);
    variants.add(code);
    variants.add(key);
    for (const length of [8, 12, 13, 14]) {
      if (key.length < length) {
        variants.add(key.padStart(length, '0'));
      }
    }
  }
  return [...variants];
}

/** Every recall, of any date, naming one of the barcodes. */
export async function fetchByBarcodes(fetchImpl, codes) {
  if (codes.length === 0) {
    return { recalls: [], truncated: false };
  }
  // Codes are digits only (config.js): nothing to escape in the query.
  const where = barcodeVariants(codes)
    .map((code) => `identification_produits like "${code}"`)
    .join(' or ');
  return fetchAll(fetchImpl, where);
}

const text = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
const https = (value) => (/^https:\/\/\S+$/.test(text(value)) ? text(value) : null);

/** The barcodes of a sheet, without their leading zeros. */
export function barcodesOf(record) {
  const cells = Array.isArray(record.identification_produits)
    ? record.identification_produits
    : String(record.identification_produits ?? '').split('$');
  const codes = new Set();
  for (const cell of cells) {
    const token = String(cell).replace(/^\|/, '').trim();
    if (/^\d{8,14}$/.test(token)) {
      codes.add(barcodeKey(token));
    }
  }
  // The references often repeat the barcode of each model ("… 1240g\t3113010173927¤").
  for (const match of String(record.modeles_ou_references ?? '').matchAll(
    /(?<!\d)\d{8,14}(?!\d)/g,
  )) {
    codes.add(barcodeKey(match[0]));
  }
  return [...codes];
}

/** One sheet of the dataset as a plain object; null when it cannot be used. */
export function normalizeRecall(record) {
  const key = text(record?.numero_fiche);
  const publishedAt = Date.parse(record?.date_publication);
  if (key === '' || Number.isNaN(publishedAt)) {
    return null;
  }
  const endsOn = text(record.date_de_fin_de_la_procedure_de_rappel);
  return {
    key,
    version: Number.isInteger(record.numero_version) ? record.numero_version : 1,
    category: categoryKey(record.categorie_produit),
    subcategory: text(record.sous_categorie_produit),
    brand: text(record.marque_produit),
    product: text(record.libelle) || text(record.modeles_ou_references).replace(/¤/g, ' '),
    references: text(record.modeles_ou_references).replace(/¤/g, ' '),
    barcodes: barcodesOf(record),
    reason: text(record.motif_rappel),
    risks: text(record.risques_encourus),
    instructions: String(record.conduites_a_tenir_par_le_consommateur ?? '')
      .split('|')
      .map(text)
      .filter(Boolean),
    publishedAt,
    endsOn: /^\d{4}-\d{2}-\d{2}$/.test(endsOn) ? endsOn : null,
    url: https(record.lien_vers_la_fiche_rappel) ?? SITE_URL,
    poster: https(record.lien_vers_affichette_pdf),
  };
}
