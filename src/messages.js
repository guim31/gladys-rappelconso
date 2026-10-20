// -----------------------------------------------------------------------------
// Texts sent from the container (feature values, connection status, action and
// scene messages, scene variables), in the four languages of the Gladys
// interface. Entries are strings or functions of one parameter object. German
// says "du", Spanish "usted". Product names, brands, reasons and risks come
// from RappelConso, in French: they are not translated.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { LANGUAGES } from './config.js';

// Short enough for a widget badge (16 characters).
export const CATEGORY_NAMES = {
  en: {
    food: 'Food',
    baby_child: 'Baby & child',
    hygiene_beauty: 'Hygiene & beauty',
    home: 'Home',
    electrical: 'Electrical',
    vehicles: 'Vehicles',
    clothing: 'Clothing',
    sports_leisure: 'Sports & leisure',
    communication: 'Communication',
    other: 'Other',
  },
  fr: {
    food: 'Alimentation',
    baby_child: 'Bébé-enfant',
    hygiene_beauty: 'Hygiène-beauté',
    home: 'Maison-habitat',
    electrical: 'Électrique',
    vehicles: 'Automobile',
    clothing: 'Vêtements',
    sports_leisure: 'Sports-loisirs',
    communication: 'Communication',
    other: 'Autres',
  },
  de: {
    food: 'Lebensmittel',
    baby_child: 'Baby & Kind',
    hygiene_beauty: 'Körperpflege',
    home: 'Haus & Wohnen',
    electrical: 'Elektrogeräte',
    vehicles: 'Fahrzeuge',
    clothing: 'Kleidung',
    sports_leisure: 'Sport & Freizeit',
    communication: 'Kommunikation',
    other: 'Sonstiges',
  },
  es: {
    food: 'Alimentación',
    baby_child: 'Bebés y niños',
    hygiene_beauty: 'Higiene, belleza',
    home: 'Hogar',
    electrical: 'Eléctricos',
    vehicles: 'Vehículos',
    clothing: 'Ropa',
    sports_leisure: 'Deporte y ocio',
    communication: 'Comunicación',
    other: 'Otros',
  },
};

// The colour of a recall in the widget: a recall naming one of the user's
// barcodes is the one thing that calls for action.
export const COLORS = { barcode: WIDGET_COLORS.DANGER, recall: WIDGET_COLORS.WARNING };

// Values of the "Latest recall" feature, and pieces of sentences.
export const PHRASES = {
  en: {
    none: 'No recall in the last 7 days',
    recalls: ({ count }) =>
      count === 1 ? '1 product recall this week' : `${count} product recalls this week`,
    noRecall: 'No product recall in your selection this week.',
    list: ({ head, items }) => `${head}: ${items.join('; ')}.`,
    more: ({ count }) => `and ${count} more`,
    barcodes: ({ count, items }) =>
      `${count === 1 ? '1 recall names' : `${count} recalls name`} your barcodes: ${items.join('; ')}.`,
    summary: ({ name, reason }) => `Product recall: ${name}. Reason: ${reason}.`,
    barcodeSummary: ({ barcode, name, reason }) =>
      `Your product ${barcode} is recalled: ${name}. Reason: ${reason}.`,
  },
  fr: {
    none: 'Aucun rappel ces 7 derniers jours',
    recalls: ({ count }) =>
      count === 1
        ? '1 rappel de produit cette semaine'
        : `${count} rappels de produits cette semaine`,
    noRecall: 'Aucun rappel de produit dans votre sélection cette semaine.',
    list: ({ head, items }) => `${head} : ${items.join(' ; ')}.`,
    more: ({ count }) => `et ${count} de plus`,
    barcodes: ({ count, items }) =>
      `${count === 1 ? '1 rappel concerne' : `${count} rappels concernent`} vos codes-barres : ${items.join(' ; ')}.`,
    summary: ({ name, reason }) => `Rappel de produit : ${name}. Motif : ${reason}.`,
    barcodeSummary: ({ barcode, name, reason }) =>
      `Votre produit ${barcode} est rappelé : ${name}. Motif : ${reason}.`,
  },
  de: {
    none: 'Kein Rückruf in den letzten 7 Tagen',
    recalls: ({ count }) =>
      count === 1 ? '1 Produktrückruf diese Woche' : `${count} Produktrückrufe diese Woche`,
    noRecall: 'Kein Produktrückruf in deiner Auswahl diese Woche.',
    list: ({ head, items }) => `${head}: ${items.join('; ')}.`,
    more: ({ count }) => `und ${count} weitere`,
    barcodes: ({ count, items }) =>
      `${count === 1 ? '1 Rückruf betrifft' : `${count} Rückrufe betreffen`} deine Barcodes: ${items.join('; ')}.`,
    summary: ({ name, reason }) => `Produktrückruf: ${name}. Grund: ${reason}.`,
    barcodeSummary: ({ barcode, name, reason }) =>
      `Dein Produkt ${barcode} wird zurückgerufen: ${name}. Grund: ${reason}.`,
  },
  es: {
    none: 'Ninguna retirada en los últimos 7 días',
    recalls: ({ count }) =>
      count === 1
        ? '1 retirada de producto esta semana'
        : `${count} retiradas de productos esta semana`,
    noRecall: 'Ninguna retirada de producto en su selección esta semana.',
    list: ({ head, items }) => `${head}: ${items.join('; ')}.`,
    more: ({ count }) => `y ${count} más`,
    barcodes: ({ count, items }) =>
      `${count === 1 ? '1 retirada afecta' : `${count} retiradas afectan`} a sus códigos de barras: ${items.join('; ')}.`,
    summary: ({ name, reason }) => `Retirada de producto: ${name}. Motivo: ${reason}.`,
    barcodeSummary: ({ barcode, name, reason }) =>
      `Su producto ${barcode} ha sido retirado: ${name}. Motivo: ${reason}.`,
  },
};

// Connection status of the Configuration screen, and messages of the actions.
export const STATUS = {
  en: {
    initFailed: 'Initialization failed, check the integration logs.',
    apiDown: 'RappelConso does not answer: the recalls are not updated.',
    invalidBarcodes: ({ values }) => `Ignored (not a barcode of 8 to 14 digits): ${values}.`,
    noCategory: 'No category selected: only your barcodes are followed.',
    truncated: 'Too many recalls this week: the oldest ones are not shown.',
    summary: ({ text, time }) => `${text} Checked at ${time}.`,
  },
  fr: {
    initFailed: "L'initialisation a échoué, consultez les logs de l'intégration.",
    apiDown: 'RappelConso ne répond pas : les rappels ne sont pas mis à jour.',
    invalidBarcodes: ({ values }) => `Ignoré (pas un code-barres de 8 à 14 chiffres) : ${values}.`,
    noCategory: 'Aucune catégorie choisie : seuls vos codes-barres sont suivis.',
    truncated: 'Trop de rappels cette semaine : les plus anciens ne sont pas affichés.',
    summary: ({ text, time }) => `${text} Vérifié à ${time}.`,
  },
  de: {
    initFailed: 'Initialisierung fehlgeschlagen, sieh dir die Protokolle der Integration an.',
    apiDown: 'RappelConso antwortet nicht: Die Rückrufe werden nicht aktualisiert.',
    invalidBarcodes: ({ values }) => `Ignoriert (kein Barcode mit 8 bis 14 Ziffern): ${values}.`,
    noCategory: 'Keine Kategorie gewählt: Nur deine Barcodes werden verfolgt.',
    truncated: 'Zu viele Rückrufe diese Woche: Die ältesten werden nicht angezeigt.',
    summary: ({ text, time }) => `${text} Geprüft um ${time}.`,
  },
  es: {
    initFailed: 'La inicialización ha fallado, consulte los registros de la integración.',
    apiDown: 'RappelConso no responde: las retiradas no se actualizan.',
    invalidBarcodes: ({ values }) =>
      `Ignorado (no es un código de barras de 8 a 14 cifras): ${values}.`,
    noCategory: 'Ninguna categoría elegida: solo se siguen sus códigos de barras.',
    truncated: 'Demasiadas retiradas esta semana: las más antiguas no se muestran.',
    summary: ({ text, time }) => `${text} Comprobado a las ${time}.`,
  },
};

/** One entry of a message table, in every language: `{ en, fr, de, es }`. */
export function render(table, key, params = {}) {
  return Object.fromEntries(
    LANGUAGES.map((language) => {
      const entry = table[language][key];
      return [language, typeof entry === 'function' ? entry(params) : entry];
    }),
  );
}

/** Several multi-language texts joined, language by language. */
export function join(...messages) {
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      messages
        .filter(Boolean)
        .map((message) => message[language])
        .join(' '),
    ]),
  );
}

const locale = (language) => (language === 'en' ? 'en-GB' : language);

/** A day in the user's time zone (TZ, set by the Gladys supervisor), e.g. "20/10". */
export function formatDay(time, language) {
  return new Intl.DateTimeFormat(locale(language), { day: '2-digit', month: '2-digit' }).format(
    new Date(time),
  );
}

/** A date and a time, e.g. "20/10 12:25". */
export function formatDate(time, language) {
  return new Intl.DateTimeFormat(locale(language), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time));
}

/** A time of day, e.g. "18:35". */
export function formatTime(time, language) {
  return new Intl.DateTimeFormat(locale(language), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time));
}

/** The calendar day of a time in the user's time zone, "2026-10-20". */
export function localDay(time) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(time));
}

// RappelConso publishes everything in lower case.
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export const clip = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1)}…`);

/** "Confit de canard fr le gourmand 1240g (Jean larnaudie)". */
export function nameOf(recall) {
  const product = capitalize(recall.product);
  const brand = capitalize(recall.brand);
  if (!brand || product.toLowerCase().includes(recall.brand.toLowerCase())) {
    return product || brand;
  }
  return `${product} (${brand})`;
}

/** The value of the "Latest recall" feature: "20/10 · Confit de canard … (Jean larnaudie)". */
export function describe(recall, language) {
  return clip(`${formatDay(recall.publishedAt, language)} · ${nameOf(recall)}`, 200);
}

// Recalls named in one sentence: a scene that reads it aloud stays short.
export const SENTENCE_RECALLS = 5;

/**
 * The recalls of the week as one sentence, newest first, then the recalls
 * naming the user's barcodes (of any date) when there are some.
 */
export function sentence(recalls, barcodeRecalls, language) {
  const p = PHRASES[language];
  const parts = [];
  if (recalls.length === 0) {
    parts.push(p.noRecall);
  } else {
    const items = recalls.slice(0, SENTENCE_RECALLS).map(nameOf);
    const rest = recalls.length - SENTENCE_RECALLS;
    if (rest > 0) {
      items.push(p.more({ count: rest }));
    }
    parts.push(p.list({ head: p.recalls({ count: recalls.length }), items }));
  }
  if (barcodeRecalls.length > 0) {
    parts.push(
      p.barcodes({
        count: barcodeRecalls.length,
        items: barcodeRecalls.slice(0, SENTENCE_RECALLS).map(nameOf),
      }),
    );
  }
  return parts.join(' ');
}
