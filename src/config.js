// -----------------------------------------------------------------------------
// Integration configuration: defaults (they mirror the `default` values of the
// manifest `config_schema`, see test/manifest.test.js) and normalization, so
// the rest of the code never deals with strings, blanks or `undefined`.
// -----------------------------------------------------------------------------

export const LANGUAGES = ['en', 'fr', 'de', 'es'];

// The product categories of RappelConso. `key` is the stable English word the
// manifest, the scene triggers and the docs use; `source` is the value of the
// `categorie_produit` column of the open data (lower case, as published).
// A category RappelConso would add later is filed under `other`.
export const CATEGORIES = [
  { key: 'food', source: 'alimentation' },
  { key: 'baby_child', source: 'bébés-enfants (hors alimentaire)' },
  { key: 'hygiene_beauty', source: 'hygiène-beauté' },
  { key: 'home', source: 'maison-habitat' },
  { key: 'electrical', source: 'appareils électriques, outils' },
  { key: 'vehicles', source: 'automobiles et moyens de déplacement' },
  { key: 'clothing', source: 'vêtements, mode, epi' },
  { key: 'sports_leisure', source: 'sports-loisirs' },
  { key: 'communication', source: 'equipements de communication' },
  { key: 'other', source: 'autres' },
];
export const CATEGORY_KEYS = CATEGORIES.map((category) => category.key);

/** The stable key of a `categorie_produit` value. */
export function categoryKey(source) {
  const text = String(source ?? '')
    .trim()
    .toLowerCase();
  return CATEGORIES.find((category) => category.source === text)?.key ?? 'other';
}

// Minutes between two readings. RappelConso publishes a few recalls an hour
// on working days: faster would only ask the same thing again.
export const REFRESH_INTERVALS = ['15', '30', '60', '180', '360'];

// Bounds of the free-text lists: they become one API query, and a scene that
// follows 200 brands would be better served by a category.
export const MAX_KEYWORDS = 30;
export const MAX_BARCODES = 30;

export const DEFAULT_CONFIG = {
  categories: CATEGORY_KEYS,
  keywords: '',
  barcodes: '',
  refresh_interval: '60',
  language: 'fr',
};

/** Lower case, without accents nor punctuation: "Bébé-Confort" → "bebe confort". */
export function fold(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Brands or words, separated by commas, semicolons or new lines. */
export function parseKeywords(text) {
  const keywords = [];
  for (const part of String(text ?? '').split(/[,;\n]+/)) {
    const keyword = fold(part);
    if (keyword !== '' && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  return keywords.slice(0, MAX_KEYWORDS);
}

/**
 * GTIN barcodes (EAN-8, UPC-A, EAN-13, GTIN-14), separated by commas,
 * semicolons or new lines; spaces inside a code are ignored ("3 017620 422003").
 * `invalid` lists what is not 8 to 14 digits.
 */
export function parseBarcodes(text) {
  const codes = [];
  const invalid = [];
  for (const part of String(text ?? '').split(/[,;\n]+/)) {
    const code = part.replace(/[\s.-]+/g, '');
    if (code === '') {
      continue;
    }
    if (!/^\d{8,14}$/.test(code)) {
      invalid.push(part.trim());
    } else if (!codes.includes(code)) {
      codes.push(code);
    }
  }
  return { codes: codes.slice(0, MAX_BARCODES), invalid };
}

/** A GTIN without its leading zeros: "03017620422003" and "3017620422003" are one product. */
export const barcodeKey = (code) => String(code).replace(/^0+/, '');

function categories(value) {
  // A multi_select is stored as an array; an unset field keeps the default.
  if (!Array.isArray(value)) {
    return [...CATEGORY_KEYS];
  }
  return CATEGORY_KEYS.filter((key) => value.includes(key));
}

/**
 * @param {Record<string, unknown>} raw the configuration returned by the SDK
 */
export function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const barcodes = parseBarcodes(source.barcodes);
  const refresh = String(source.refresh_interval ?? '');
  return {
    categories: categories(source.categories),
    keywords: parseKeywords(source.keywords),
    barcodes: barcodes.codes,
    invalidBarcodes: barcodes.invalid,
    refreshMinutes: Number(
      REFRESH_INTERVALS.includes(refresh) ? refresh : DEFAULT_CONFIG.refresh_interval,
    ),
    language: LANGUAGES.includes(source.language) ? source.language : DEFAULT_CONFIG.language,
  };
}
