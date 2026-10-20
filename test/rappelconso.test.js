// -----------------------------------------------------------------------------
// The RappelConso client and the configuration parsing, on the recorded
// answers of the open data API (test/fixtures/rappelconso, see its README).
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryKey, normalizeConfig, parseBarcodes, parseKeywords } from '../src/config.js';
import {
  barcodeVariants,
  fetchByBarcodes,
  fetchRecent,
  normalizeRecall,
  recordsUrl,
} from '../src/rappelconso.js';
import { START, SPORTS_RUNNING, createApi, fixture } from './helpers/world.js';

const week = fixture('rappelconso/week-2026-10-20.json').results;

test('every recorded sheet is read, with its stable category', () => {
  const recalls = week.map(normalizeRecall);
  assert.ok(recalls.every(Boolean));
  assert.deepEqual([...new Set(recalls.map((recall) => recall.category))].sort(), [
    'baby_child',
    'clothing',
    'electrical',
    'food',
    'sports_leisure',
    'vehicles',
  ]);
  for (const recall of recalls) {
    assert.match(recall.url, /^https:\/\/rappel\.conso\.gouv\.fr\//);
    assert.ok(recall.product.length > 0, recall.key);
  }
  assert.equal(categoryKey('une catégorie de 2027'), 'other');
});

test('a sheet: barcodes of every product, instructions, dates', () => {
  const sports = fixture('rappelconso/barcodes-2026-10-20.json').results.find(
    (record) => record.numero_fiche === SPORTS_RUNNING,
  );
  const recall = normalizeRecall(sports);
  // Four products; the barcodes of the second one onwards are prefixed with "|".
  assert.deepEqual(recall.barcodes, [
    '3608391661410',
    '3608391173227',
    '3608392200106',
    '3608391671181',
  ]);
  assert.equal(recall.endsOn, '2026-12-29');
  assert.equal(recall.category, 'sports_leisure');
  const confit = normalizeRecall(week.find((record) => record.numero_fiche === '2026-10-0199'));
  // Batch numbers (10 digits) are kept too: harmless, a GTIN never equals one by chance.
  assert.ok(confit.barcodes.includes('3113010173927'));
  assert.ok(confit.instructions.includes('ne plus consommer'));
  assert.equal(confit.publishedAt, Date.parse('2026-10-20T10:10:32Z'));
  assert.equal(normalizeRecall({ numero_fiche: '' }), null);
});

test('the queries: 8 days of recalls, and barcodes with their zero-padded forms', async () => {
  const api = createApi();
  const recent = await fetchRecent(api.fetch, { now: START });
  assert.equal(recent.recalls.length, 94);
  assert.equal(recent.truncated, false);
  assert.match(api.requests[0].searchParams.get('where'), /^date_publication >= date'2026-10-12'$/);
  assert.deepEqual(barcodeVariants(['03017620422003']), ['03017620422003', '3017620422003']);
  assert.deepEqual(barcodeVariants(['12345678']), [
    '12345678',
    '000012345678',
    '0000012345678',
    '00000012345678',
  ]);
  const found = await fetchByBarcodes(api.fetch, ['3608391173227']);
  assert.deepEqual(
    found.recalls.map((recall) => recall.key),
    [SPORTS_RUNNING],
  );
  assert.deepEqual(await fetchByBarcodes(api.fetch, []), { recalls: [], truncated: false });
  assert.match(recordsUrl('x', 2), /offset=200/);
});

test('API errors become one short message, without the query', async () => {
  const api = createApi();
  api.down = 'network';
  await assert.rejects(
    fetchRecent(api.fetch, { now: START }),
    /^HttpError: data\.economie\.gouv\.fr: fetch failed$/,
  );
  const html = async () => ({ status: 200, text: async () => '<html>' });
  await assert.rejects(fetchRecent(html, { now: START }), /unexpected answer/);
});

test('configuration: keywords folded, barcodes checked, defaults', () => {
  assert.deepEqual(parseKeywords('Bébé-Confort, LAIT ;; lait\nPeg Pérego'), [
    'bebe confort',
    'lait',
    'peg perego',
  ]);
  assert.deepEqual(parseBarcodes('3 017620 422003, 123, abc;3017620422003\n12345678'), {
    codes: ['3017620422003', '12345678'],
    invalid: ['123', 'abc'],
  });
  const config = normalizeConfig({ categories: ['food', 'bogus'], refresh_interval: '7' });
  assert.deepEqual(config.categories, ['food']);
  assert.equal(config.refreshMinutes, 60);
  assert.equal(config.language, 'fr');
  assert.equal(normalizeConfig(null).categories.length, 10);
});
