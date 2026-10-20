// -----------------------------------------------------------------------------
// What the integration writes to `docker logs`: at info, only the lifecycle
// (the start, a recalled barcode, RappelConso lost and back, a user action),
// never one line per refresh cycle nor per ordinary recall; a failure that
// repeats at every cycle is logged once, plus one line when it is over.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../src/config.js';
import {
  CONFIT,
  CONFIT_BARCODE,
  captureLogs,
  create,
  createApi,
  createWorld,
  cycle,
} from './helpers/world.js';

const strip = (line) => line.text.replace(/^\[[^\]]+\] /, '');

async function world(t, config = {}, options = {}) {
  const w = await createWorld({ config, ...options });
  t.after(() => w.app.stop());
  return w;
}

test('the start is one info line', async (t) => {
  const lines = captureLogs(t, 'info');
  await world(t);
  assert.deepEqual(lines.map(strip), [
    '[INFO] [rappelconso] Started: RappelConso read every 60 min',
  ]);
});

test('normal refresh cycles write nothing at info, new recalls included', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  await create(w);
  const lines = captureLogs(t, 'info');
  api.publish(CONFIT, { key: '2026-10-0400', date: w.clock.time + 1000 });
  for (let i = 0; i < 4; i += 1) {
    await cycle(w);
  }
  assert.equal(w.fake.sceneEvents.length, 1);
  assert.deepEqual(lines, []);
});

test('a recalled barcode is one info line', async (t) => {
  const w = await world(t);
  const lines = captureLogs(t, 'info');
  await w.monitor.reconfigure(normalizeConfig({ barcodes: CONFIT_BARCODE }));
  await cycle(w);
  assert.deepEqual(lines.map(strip), [
    '[INFO] [rappelconso] Configuration saved',
    `[INFO] [rappelconso] Barcode ${CONFIT_BARCODE} recalled: sheet ${CONFIT}`,
  ]);
});

test('LOG_LEVEL=debug shows the cycles', async (t) => {
  const lines = captureLogs(t, 'debug');
  const w = await world(t);
  await cycle(w);
  assert.ok(
    lines.some((line) =>
      /Refresh cycle: 94 recall\(s\) in 8 days, 80 selected in 7 days, 0 naming a barcode/.test(
        line.text,
      ),
    ),
  );
});

test('RappelConso down at every cycle: one warning, then one line at recovery', async (t) => {
  const api = createApi();
  const w = await world(t, {}, { api });
  const lines = captureLogs(t, 'info');
  api.down = 503;
  for (let i = 0; i < 4; i += 1) {
    await cycle(w);
  }
  assert.deepEqual(
    lines.map((line) => [line.level, strip(line).replace(/^\[\w+\] /, '')]),
    [['warn', '[rappelconso] RappelConso unreachable: data.economie.gouv.fr: HTTP 503']],
  );
  api.down = false;
  await cycle(w);
  assert.deepEqual(lines.slice(1).map(strip), ['[INFO] [rappelconso] RappelConso answers again']);
});

test('states refused at every cycle: one warning, then one line at recovery', async (t) => {
  const w = await world(t);
  await create(w);
  const lines = captureLogs(t, 'info');
  const publish = t.mock.method(w.gladys, 'publishChangedStates', async () => {
    throw new Error('Gladys unreachable');
  });
  for (let i = 0; i < 3; i += 1) {
    await cycle(w);
  }
  assert.ok(publish.mock.callCount() >= 3);
  assert.deepEqual(
    lines.map((line) => [line.level, strip(line).replace(/^\[\w+\] /, '')]),
    [['warn', '[rappelconso] Publishing the states failed: Gladys unreachable']],
  );
  publish.mock.restore();
  await cycle(w);
  assert.match(lines.at(-1).text, /\[INFO\].*Publishing the states works again/);
});

test('a configuration problem is said once, at the start or the save', async (t) => {
  const lines = captureLogs(t, 'info');
  const w = await world(t, { categories: [], barcodes: '123' });
  for (let i = 0; i < 3; i += 1) {
    await cycle(w);
  }
  assert.deepEqual(lines.map(strip), [
    '[WARN] [rappelconso] Not a barcode, ignored: 123',
    '[WARN] [rappelconso] No category selected: only the barcodes are followed',
    '[INFO] [rappelconso] Started: RappelConso read every 60 min',
  ]);
});
