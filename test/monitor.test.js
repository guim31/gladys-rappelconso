// -----------------------------------------------------------------------------
// The monitor on the recorded RappelConso sheets: the selection, the states of
// the device, the scene triggers (and when they must stay silent), the
// barcodes, the timer of the container and the persistence under /data.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../src/config.js';
import { TRIGGERS } from '../src/monitor.js';
import {
  AUCHAN_MILK,
  BABY_CARRIER,
  CONFIT,
  CONFIT_BARCODE,
  FORD_TRANSIT,
  MUSSELS,
  SPORTS_BARCODE,
  SPORTS_RUNNING,
  TROUT_BARCODE,
  TROUT_RUNNING,
  create,
  createApi,
  createWorld,
  cycle,
  featureId,
  selectedKeys,
} from './helpers/world.js';

async function world(t, config = {}, options = {}) {
  const w = await createWorld({ config, ...options });
  t.after(() => w.app.stop());
  return w;
}

const HOUR = 60 * 60 * 1000;
const events = (w, key) => w.fake.sceneEvents.filter((event) => event.key === key);

test('the selection: every category over 7 days, newest first', async (t) => {
  const w = await world(t);
  assert.equal(w.monitor.recalls.length, 80);
  assert.equal(selectedKeys(w)[0], MUSSELS);
  // Published on 13/10 at 10:47 (Paris), more than 7 days before 20/10 17:30.
  assert.ok(!selectedKeys(w).includes(FORD_TRANSIT));
  assert.deepEqual(w.monitor.barcodeRecalls, []);
});

test('the selection: categories, brands and words (accents and case ignored)', async (t) => {
  const vehicles = await world(t, { categories: ['vehicles'] });
  assert.equal(vehicles.monitor.recalls.length, 7);
  const auchan = await world(t, { keywords: 'AUCHAN' });
  assert.deepEqual(selectedKeys(auchan), ['2026-10-0178', AUCHAN_MILK]);
  const carrier = await world(t, { keywords: 'porte bébé; hamax' });
  assert.deepEqual(selectedKeys(carrier), [BABY_CARRIER]);
  // Whole words only: "lait" is not "laitier", and the category still applies.
  const milk = await world(t, { keywords: 'lait', categories: ['food'] });
  assert.deepEqual(selectedKeys(milk), [
    '2026-10-0155',
    '2026-10-0153',
    '2026-10-0123',
    '2026-10-0103',
  ]);
  const babyMilk = await world(t, { keywords: 'lait', categories: ['baby_child'] });
  assert.deepEqual(selectedKeys(babyMilk), []);
});

test('the states of the device, once it is created', async (t) => {
  const w = await world(t, { barcodes: `${CONFIT_BARCODE}, ${SPORTS_BARCODE}, ${TROUT_BARCODE}` });
  assert.deepEqual(w.fake.states, [], 'nothing published before the device exists');
  const device = await create(w);
  assert.equal(w.fake.lastState(featureId(device, 'recalls_today')), 4);
  assert.equal(w.fake.lastState(featureId(device, 'recalls_week')), 80);
  assert.equal(
    w.fake.lastState(featureId(device, 'latest_recall')),
    '20/10 · Moules de bouchot stg mytilus edulis',
  );
  // The confit, the second trout sheet and the sports recall; the first trout sheet ended in July.
  assert.equal(w.fake.lastState(featureId(device, 'barcode_recalls')), 3);
});

test('"today" follows the time zone of Gladys, at the next cycle', async (t) => {
  const w = await world(t);
  const device = await create(w);
  // 20/10 23:30 in Paris, then 21/10 00:30: the recalls of the 20th are yesterday's.
  await cycle(w, 6 * 60);
  assert.equal(w.fake.lastState(featureId(device, 'recalls_today')), 4);
  await cycle(w, 60);
  assert.equal(w.fake.lastState(featureId(device, 'recalls_today')), 0);
});

test('the first start fires nothing; a new sheet fires new_recall once', async (t) => {
  const api = createApi();
  const w = await world(t, { language: 'en' }, { api });
  assert.deepEqual(w.fake.sceneEvents, []);
  api.publish(CONFIT, { key: '2026-10-0300', date: w.clock.time + HOUR });
  await cycle(w);
  await cycle(w);
  const [event] = events(w, TRIGGERS.NEW);
  assert.equal(events(w, TRIGGERS.NEW).length, 1);
  assert.deepEqual(event.data, {
    category: 'food',
    category_name: 'Food',
    product: 'confit de canard fr le gourmand 1240g',
    brand: 'jean larnaudie',
    reason: 'suspicion de défaut de conditionnement',
    risks: event.data.risks,
    url: 'https://rappel.conso.gouv.fr/fiche-rappel/23871/interne',
    summary:
      'Product recall: Confit de canard fr le gourmand 1240g (Jean larnaudie). Reason: suspicion de défaut de conditionnement.',
  });
  assert.ok(event.data.risks.length > 0);
});

test('no new_recall out of the selection, nor for a corrected sheet', async (t) => {
  const api = createApi();
  const w = await world(t, { categories: ['baby_child'] }, { api });
  api.publish(CONFIT, { key: '2026-10-0301', date: w.clock.time + HOUR });
  api.publish(BABY_CARRIER, { key: '2026-03-0100', date: w.clock.time + HOUR, numero_version: 2 });
  await cycle(w);
  assert.deepEqual(w.fake.sceneEvents, []);
  // Vehicles come with version 0: a new one is news.
  api.publish(FORD_TRANSIT, {
    key: 'sr/09999/26',
    date: w.clock.time + HOUR,
    categorie_produit: 'bébés-enfants (hors alimentaire)',
  });
  await cycle(w);
  assert.equal(events(w, TRIGGERS.NEW).length, 1);
});

test('widening the selection fires nothing for the recalls already published', async (t) => {
  const w = await world(t, { categories: ['vehicles'] });
  await w.monitor.reconfigure(normalizeConfig({}));
  await cycle(w);
  assert.equal(w.monitor.recalls.length, 80);
  assert.deepEqual(w.fake.sceneEvents, []);
});

test('barcodes: running recalls of any date, fired once, even at the first start', async (t) => {
  const config = { barcodes: `0${CONFIT_BARCODE}; ${SPORTS_BARCODE}, ${TROUT_BARCODE}` };
  const w = await world(t, config);
  const fired = events(w, TRIGGERS.BARCODE);
  assert.deepEqual(
    fired.map((event) => event.data.barcode),
    [CONFIT_BARCODE, TROUT_BARCODE, SPORTS_BARCODE],
  );
  assert.equal(fired[2].data.category, 'sports_leisure');
  assert.match(fired[0].data.summary, /^Votre produit 3113010173927 est rappelé : Confit/);
  // The barcode recall is also in the selection, whatever the categories.
  assert.deepEqual(
    w.monitor.barcodeRecalls.map((recall) => recall.key),
    [CONFIT, TROUT_RUNNING, SPORTS_RUNNING],
  );
  await cycle(w);
  assert.equal(events(w, TRIGGERS.BARCODE).length, 3);
  // The sports recall ends on 29/12: after that, it is no longer counted.
  w.clock.time = Date.parse('2026-12-30T10:00:00Z');
  await w.monitor.runCycle();
  assert.deepEqual(
    w.monitor.barcodeRecalls.map((recall) => recall.key),
    [CONFIT, TROUT_RUNNING],
  );
});

test('a barcode added later fires for a recall already known', async (t) => {
  const w = await world(t, { categories: [] });
  assert.deepEqual(w.monitor.recalls, []);
  await w.monitor.reconfigure(normalizeConfig({ categories: [], barcodes: CONFIT_BARCODE }));
  assert.deepEqual(selectedKeys(w), [CONFIT]);
  assert.equal(events(w, TRIGGERS.BARCODE).length, 1);
  assert.equal(events(w, TRIGGERS.NEW).length, 0);
});

test('a restart fires nothing again (what was seen is under /data)', async (t) => {
  const api = createApi();
  const config = { barcodes: CONFIT_BARCODE };
  const first = await world(t, config, { api });
  api.publish(MUSSELS, { key: '2026-10-0302', date: first.clock.time + HOUR });
  await cycle(first);
  assert.equal(first.fake.sceneEvents.length, 2);
  await first.app.stop();
  const again = await world(t, config, { api, dataDir: first.dataDir });
  await cycle(again, 120);
  assert.deepEqual(again.fake.sceneEvents, []);
});

test('RappelConso down: the status says it, the last recalls stay, then it recovers', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  assert.equal(w.fake.connectionStatus.connected, true);
  api.down = 503;
  await cycle(w);
  assert.equal(w.fake.connectionStatus.connected, false);
  assert.match(w.fake.connectionStatus.message.fr, /RappelConso ne répond pas/);
  assert.equal(w.monitor.recalls.length, 80);
  api.down = false;
  await cycle(w);
  assert.equal(w.fake.connectionStatus.connected, true);
  assert.equal(w.fake.connectionStatus.message, undefined);
});

test('the configuration problems are shown in the Configuration screen', async (t) => {
  const w = await world(t, { categories: [], barcodes: '123, 3017620422003' });
  assert.match(w.fake.connectionStatus.message.en, /only your barcodes are followed/);
  assert.match(
    w.fake.connectionStatus.message.en,
    /Ignored \(not a barcode of 8 to 14 digits\): 123/,
  );
});

test('the container refreshes by itself, at the chosen interval', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const api = createApi();
  const w = await world(t, { refresh_interval: '30' }, { api, timers: true });
  const before = api.requests.length;
  t.mock.timers.tick(30 * 60 * 1000);
  await w.monitor.running;
  assert.equal(api.requests.length, before + 1);
  // One request a cycle without barcodes, two with.
  await w.monitor.reconfigure(
    normalizeConfig({ refresh_interval: '30', barcodes: CONFIT_BARCODE }),
  );
  assert.equal(api.requests.length, before + 3);
});

test('onPoll is only a fallback: no new request within half an interval', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  const device = await create(w);
  const before = api.requests.length;
  await w.fake.poll(device);
  assert.equal(api.requests.length, before);
  w.clock.advance(31 * 60 * 1000);
  await w.fake.poll(device);
  assert.equal(api.requests.length, before + 1);
});

test('a scene event Gladys refused is sent again at the next cycle', async (t) => {
  const w = await world(t);
  const publish = t.mock.method(w.gladys, 'publishSceneEvent', async () => {
    throw new Error('HTTP 429');
  });
  await w.monitor.reconfigure(normalizeConfig({ barcodes: CONFIT_BARCODE }));
  assert.equal(publish.mock.callCount(), 1);
  publish.mock.restore();
  await cycle(w);
  assert.equal(events(w, TRIGGERS.BARCODE).length, 1);
  await cycle(w);
  assert.equal(events(w, TRIGGERS.BARCODE).length, 1);
});

test('a barcode removed then added again fires again', async (t) => {
  const w = await world(t, { barcodes: CONFIT_BARCODE });
  assert.equal(events(w, TRIGGERS.BARCODE).length, 1);
  await w.monitor.reconfigure(normalizeConfig({}));
  await w.monitor.reconfigure(normalizeConfig({ barcodes: CONFIT_BARCODE }));
  assert.equal(events(w, TRIGGERS.BARCODE).length, 2);
});
