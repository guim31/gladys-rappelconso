// -----------------------------------------------------------------------------
// A complete test world: the SDK's fake Gladys, a fake RappelConso API serving
// the recorded sheets of test/fixtures (filtered and paged the way the real
// API does), a manual clock, a temporary /data, and the integration wired on
// top through registerHandlers. Nothing touches the network.
// -----------------------------------------------------------------------------

import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';
import { Store } from '../../src/store.js';

process.env.LOG_LEVEL ??= 'silent';
process.env.TZ = 'Europe/Paris';

export const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));

// The sheets were recorded on 20/10/2026 around 15:10 UTC.
export const START = Date.parse('2026-10-20T15:30:00Z');

// Sheets of the recording.
export const MUSSELS = '2026-10-0202'; // food, 20/10 12:25 (Paris), the newest
export const CONFIT = '2026-10-0199'; // food, 20/10, barcode 3113010173927
export const CONFIT_BARCODE = '3113010173927';
export const BABY_CARRIER = '2026-10-0171'; // baby_child, 19/10, Hamax
export const FORD_TRANSIT = 'sr/02824/26'; // vehicles, version 0, 13/10
export const AUCHAN_MILK = '2026-10-0112'; // food, version 2 (corrected sheet), 16/10
// Older sheets, only in barcodes-2026-10-20.json.
export const SPORTS_RUNNING = '2026-06-0239'; // ends 2026-12-29, fourth product of the sheet
export const SPORTS_BARCODE = '3608391173227';
// The same trout recalled twice: the first sheet ended on 2026-07-15, the
// second one has no end date (RappelConso no longer fills it since July 2026).
export const TROUT_ENDED = '2026-06-0256';
export const TROUT_RUNNING = '2026-07-0047';
export const TROUT_BARCODE = '5400742903204';

const cellsOf = (record) =>
  (record.identification_produits ?? []).map((cell) => String(cell).replace(/^\|/, ''));

/**
 * Fake RappelConso. `api.down`: 'network' (connection refused), a status (503) or false.
 */
export function createApi() {
  const byKey = new Map();
  for (const name of ['rappelconso/barcodes-2026-10-20.json', 'rappelconso/week-2026-10-20.json']) {
    for (const record of fixture(name).results) {
      byKey.set(record.numero_fiche, record);
    }
  }
  const api = {
    records: structuredClone([...byKey.values()]),
    down: false,
    requests: [],

    record(key) {
      return api.records.find((record) => record.numero_fiche === key);
    },

    /** A new sheet, copied from a recorded one. */
    publish(fromKey, { key, date, ...fields }) {
      const record = { ...structuredClone(api.record(fromKey)), ...fields };
      record.numero_fiche = key;
      record.id = 900000 + api.records.length;
      record.date_publication = new Date(date).toISOString().replace('.000Z', '+00:00');
      api.records.push(record);
      return key;
    },

    search(url) {
      const where = url.searchParams.get('where');
      const since = /date_publication >= date'(\d{4}-\d{2}-\d{2})'/.exec(where);
      const codes = [...where.matchAll(/identification_produits like "(\d+)"/g)].map((m) => m[1]);
      return api.records
        .filter((record) =>
          since
            ? record.date_publication.slice(0, 10) >= since[1]
            : codes.some(
                (code) =>
                  cellsOf(record).includes(code) ||
                  String(record.modeles_ou_references).includes(code),
              ),
        )
        .sort(
          (a, b) =>
            b.date_publication.localeCompare(a.date_publication) || Number(b.id) - Number(a.id),
        );
    },

    async fetch(input) {
      const url = new URL(input);
      api.requests.push(url);
      if (api.down === 'network') {
        throw new TypeError('fetch failed');
      }
      if (api.down) {
        return { status: api.down, text: async () => 'Service Unavailable' };
      }
      if (!url.pathname.endsWith('/rappelconso-v2-gtin-espaces/records')) {
        return { status: 404, text: async () => '{"error_code":"NotFound"}' };
      }
      const matching = api.search(url);
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      const body = {
        total_count: matching.length,
        results: matching.slice(offset, offset + limit),
      };
      return { status: 200, text: async () => JSON.stringify(body) };
    },
  };
  return api;
}

/** A manual clock. */
export function createClock(start = START) {
  const clock = {
    time: start,
    now: () => clock.time,
    advance(ms) {
      clock.time += ms;
    },
  };
  return clock;
}

/**
 * @param {object} [options]
 * @param {object} [options.config] raw integration config
 * @param {Array} [options.devices] devices already created in Gladys
 * @param {object} [options.api] from createApi
 * @param {boolean} [options.connect]
 * @param {boolean} [options.timers] true: the monitor's own timer runs (mock it)
 */
export async function createWorld({
  config = {},
  devices = [],
  api = createApi(),
  connect = true,
  timers = false,
  clock = createClock(),
  dataDir = mkdtempSync(join(tmpdir(), 'gladys-rappelconso-')),
} = {}) {
  const gladys = createFakeGladys({ config, devices });
  const store = new Store(dataDir);
  const app = registerHandlers(gladys, { store, fetch: api.fetch, timers, now: clock.now });
  if (connect) {
    await gladys.connect();
    await app.ready;
    await app.monitor.running;
  }
  return { gladys, fake: gladys.fake, app, monitor: app.monitor, api, clock, store, dataDir };
}

/** Create the device in Gladys, as the user would. */
export async function create(world) {
  const [device] = world.fake.discoveredDevices;
  await world.fake.deviceCreated(device);
  return device;
}

/** External id of one feature of a device. */
export const featureId = (device, key) =>
  device.features.find((feature) => feature.external_id.endsWith(`:${key}`))?.external_id;

/** Run one refresh cycle, `minutes` later. */
export async function cycle(world, minutes = 60) {
  world.clock.advance(minutes * 60 * 1000);
  await world.monitor.runCycle();
}

/** Keys of the selected recalls, newest first. */
export const selectedKeys = (world) => world.monitor.recalls.map((recall) => recall.key);

/**
 * Capture the integration's log lines at `level` and above (LOG_LEVEL is read
 * at every call). Returns the lines as `{ level, text }`.
 */
export function captureLogs(t, level = 'info') {
  const previous = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = level;
  const lines = [];
  const record = (...args) => {
    const text = args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' ');
    const match = /^\[[^\]]+\] \[(\w+)\]/.exec(text);
    lines.push({ level: match ? match[1].toLowerCase() : 'raw', text });
  };
  t.mock.method(console, 'log', record);
  t.mock.method(console, 'error', record);
  t.after(() => {
    process.env.LOG_LEVEL = previous;
  });
  return lines;
}
