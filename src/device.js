// -----------------------------------------------------------------------------
// The one Gladys device of the integration: the product recalls of the
// followed selection (categories, brands or words, and the user's barcodes).
//
// Features (couples checked against the Gladys front, see
// test/gladys-rules.test.js):
//   - recalls_today    counter-sensor/integer: recalls published today (time
//                      zone of Gladys) in the selection;
//   - recalls_week     counter-sensor/integer: the same over the last 7 days;
//   - latest_recall    text/text: the newest one, with its date;
//   - barcode_recalls  counter-sensor/integer: recalls still running (of any
//                      date) that name one of the user's barcodes. The core
//                      has no date type: the date of the latest recall is in
//                      its text.
//
// Published with should_poll: false: the refresh runs in the container
// (src/monitor.js). The platform id is fixed: there is one selection per Gladys.
// -----------------------------------------------------------------------------

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES as TYPES,
} from '@gladysassistant/integration-sdk';

export const DEVICE_TYPE = 'recalls';
export const PLATFORM_ID = 'selection';
export const FEATURE_KEYS = {
  TODAY: 'recalls_today',
  WEEK: 'recalls_week',
  LATEST: 'latest_recall',
  BARCODES: 'barcode_recalls',
};

export const MAX_COUNT = 10000;

// Feature names, frozen at creation in Gladys (language of the configuration).
export const NAMES = {
  en: {
    device: 'Product recalls',
    recalls_today: 'Recalls today',
    recalls_week: 'Recalls in 7 days',
    latest_recall: 'Latest recall',
    barcode_recalls: 'Recalls of my barcodes',
  },
  fr: {
    device: 'Rappels de produits',
    recalls_today: 'Rappels du jour',
    recalls_week: 'Rappels sur 7 jours',
    latest_recall: 'Dernier rappel',
    barcode_recalls: 'Rappels de mes codes-barres',
  },
  de: {
    device: 'Produktrückrufe',
    recalls_today: 'Rückrufe heute',
    recalls_week: 'Rückrufe in 7 Tagen',
    latest_recall: 'Neuester Rückruf',
    barcode_recalls: 'Rückrufe meiner Barcodes',
  },
  es: {
    device: 'Retiradas de productos',
    recalls_today: 'Retiradas de hoy',
    recalls_week: 'Retiradas en 7 días',
    latest_recall: 'Última retirada',
    barcode_recalls: 'Retiradas de mis códigos',
  },
};

/** External ids of the device and of its features. */
export function deviceIds(gladys) {
  const ids = gladys.externalIds(DEVICE_TYPE, PLATFORM_ID);
  return {
    device: ids.device,
    today: ids.feature(FEATURE_KEYS.TODAY),
    week: ids.feature(FEATURE_KEYS.WEEK),
    latest: ids.feature(FEATURE_KEYS.LATEST),
    barcodes: ids.feature(FEATURE_KEYS.BARCODES),
  };
}

const sensor = (name, externalId, category, type, extra) => ({
  name,
  external_id: externalId,
  category,
  type,
  read_only: true,
  has_feedback: false,
  ...extra,
});

const counter = (name, externalId) =>
  sensor(name, externalId, DEVICE_FEATURE_CATEGORIES.COUNTER_SENSOR, TYPES.SENSOR.INTEGER, {
    keep_history: true,
    min: 0,
    max: MAX_COUNT,
  });

/** The discovery payload of the device. */
export function buildDevice(gladys, language = 'fr') {
  const ids = deviceIds(gladys);
  const names = NAMES[language] ?? NAMES.fr;
  return {
    name: names.device,
    external_id: ids.device,
    model: 'RappelConso',
    should_poll: false,
    params: [],
    features: [
      counter(names.recalls_today, ids.today),
      counter(names.recalls_week, ids.week),
      sensor(names.latest_recall, ids.latest, DEVICE_FEATURE_CATEGORIES.TEXT, TYPES.TEXT.TEXT, {
        keep_history: false,
        min: 0,
        max: 0,
      }),
      counter(names.barcode_recalls, ids.barcodes),
    ],
  };
}
