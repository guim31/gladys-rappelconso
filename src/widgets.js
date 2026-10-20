// -----------------------------------------------------------------------------
// Dashboard widget (manifest `widgets`, Gladys 5.1+): `recalls`.
//
// A heading with the number of recalls of the week, then the latest recalls as
// a `card-list` (8 rows at most, the core's cap): the running recalls naming
// one of the user's barcodes first (red badge), then the selection of the last
// 7 days, newest first (orange badge: the category). Tapping a row opens the
// core's detail panel: reason, risks, what to do, and links to the official
// sheet and its printable poster. The footer gives the source and the time of
// the last reading, and a link to rappel.conso.gouv.fr.
// Budget: 2 texts, 1 card-list, 1 button.
// -----------------------------------------------------------------------------

import { CATEGORY_NAMES, COLORS, clip, formatDate, formatDay, nameOf } from './messages.js';
import { WIDGET_KEY } from './monitor.js';
import { SITE_URL } from './rappelconso.js';

export const MAX_ITEMS = 8;
export const TTL_SECONDS = 600;

export const TEXT = {
  waiting: {
    en: 'Waiting for RappelConso…',
    fr: 'En attente de RappelConso…',
    de: 'Warte auf RappelConso…',
    es: 'Esperando a RappelConso…',
  },
  none: {
    en: 'No recall this week',
    fr: 'Aucun rappel cette semaine',
    de: 'Kein Rückruf diese Woche',
    es: 'Ninguna retirada esta semana',
  },
  one: {
    en: '1 recall this week',
    fr: '1 rappel cette semaine',
    de: '1 Rückruf diese Woche',
    es: '1 retirada esta semana',
  },
  many: {
    en: ' recalls this week',
    fr: ' rappels cette semaine',
    de: ' Rückrufe diese Woche',
    es: ' retiradas esta semana',
  },
  barcode: {
    en: 'Your product',
    fr: 'Votre produit',
    de: 'Dein Produkt',
    es: 'Su producto',
  },
  source: {
    en: 'Source: RappelConso',
    fr: 'Source : RappelConso',
    de: 'Quelle: RappelConso',
    es: 'Fuente: RappelConso',
  },
  sheet: {
    en: 'Recall sheet',
    fr: 'Fiche de rappel',
    de: 'Rückrufblatt',
    es: 'Ficha de retirada',
  },
  poster: {
    en: 'Poster (PDF)',
    fr: 'Affichette (PDF)',
    de: 'Aushang (PDF)',
    es: 'Cartel (PDF)',
  },
  reason: { en: 'Reason', fr: 'Motif', de: 'Grund', es: 'Motivo' },
  risks: { en: 'Risks', fr: 'Risques', de: 'Risiken', es: 'Riesgos' },
  todo: { en: 'What to do', fr: 'Que faire', de: 'Was tun', es: 'Qué hacer' },
  published: { en: 'Published', fr: 'Publié', de: 'Veröffentlicht', es: 'Publicada' },
  site: { en: 'RappelConso', fr: 'RappelConso', de: 'RappelConso', es: 'RappelConso' },
};

const t = (text, language) => text[language] ?? text.en;
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

function heading(count, language) {
  if (count === 0) {
    return t(TEXT.none, language);
  }
  return count === 1 ? t(TEXT.one, language) : `${count}${t(TEXT.many, language)}`;
}

/** One row of the list, and its detail panel. */
export function itemOf(recall, language, { barcode = false } = {}) {
  const colon = language === 'fr' ? ' : ' : ': ';
  const field = (label, value) => (value ? `${t(label, language)}${colon}${value}` : null);
  const links = [{ url: recall.url, label: t(TEXT.sheet, language) }];
  if (recall.poster) {
    links.push({ url: recall.poster, label: t(TEXT.poster, language) });
  }
  return {
    title: clip(nameOf(recall), 60),
    subtitle: clip(
      [formatDay(recall.publishedAt, language), capitalize(recall.subcategory)]
        .filter(Boolean)
        .join(' · '),
      60,
    ),
    badge: barcode
      ? { text: t(TEXT.barcode, language), color: COLORS.barcode }
      : { text: CATEGORY_NAMES[language][recall.category], color: COLORS.recall },
    // RappelConso writes its sheets in French: shown as they are.
    description: clip(
      [
        field(TEXT.reason, capitalize(recall.reason)),
        field(TEXT.risks, capitalize(recall.risks)),
        field(TEXT.todo, capitalize(recall.instructions.join(', '))),
        field(TEXT.published, formatDate(recall.publishedAt, language)),
      ]
        .filter(Boolean)
        .join('\n'),
      2000,
    ),
    links,
  };
}

export const WIDGETS = {
  [WIDGET_KEY]: {
    async get(monitor, { language = 'en' } = {}) {
      const lang = CATEGORY_NAMES[language] ? language : 'en';
      const updated = monitor.lastSuccessAt;
      const source = t(TEXT.source, lang);
      const components = [
        {
          type: 'text',
          variant: 'heading',
          text: updated === null ? t(TEXT.waiting, lang) : heading(monitor.recalls.length, lang),
        },
      ];
      const barcodeKeys = new Set(monitor.barcodeRecalls.map((recall) => recall.key));
      const rows = [
        ...monitor.barcodeRecalls.map((recall) => itemOf(recall, lang, { barcode: true })),
        ...monitor.recalls
          .filter((recall) => !barcodeKeys.has(recall.key))
          .map((recall) => itemOf(recall, lang)),
      ].slice(0, MAX_ITEMS);
      if (rows.length > 0) {
        components.push({ type: 'card-list', display: 'list', items: rows });
      }
      components.push(
        {
          type: 'text',
          variant: 'caption',
          text: updated === null ? source : `${source} · ${formatDate(updated, lang)}`,
        },
        {
          type: 'button',
          label: t(TEXT.site, lang),
          icon: 'external-link',
          link: { url: SITE_URL },
        },
      );
      return { ttl_seconds: TTL_SECONDS, components };
    },
  },
};
