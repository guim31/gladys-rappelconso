// -----------------------------------------------------------------------------
// The `recalls` widget and the two actions: contents within the core budget
// (validateWidgetContent: an empty array means rendered as sent), the order of
// the rows, the texts of every language, and the sentence of the scene action
// and of the configuration action.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { LANGUAGES } from '../src/config.js';
import { MAX_ITEMS } from '../src/widgets.js';
import { CONFIT_BARCODE, createApi, createWorld } from './helpers/world.js';

async function world(t, config = {}, options = {}) {
  const w = await createWorld({ config, ...options });
  t.after(() => w.app.stop());
  return w;
}

const content = async (w, language) =>
  (await w.fake.widgetGet('recalls', { settings: {}, language })).data.content;

test('the widget lists the recalls, your barcodes first, within the budget', async (t) => {
  const w = await world(t, { barcodes: CONFIT_BARCODE });
  for (const language of LANGUAGES) {
    const widget = await content(w, language);
    assert.deepEqual(validateWidgetContent(widget), [], language);
    const list = widget.components.find((c) => c.type === 'card-list');
    assert.equal(list.items.length, MAX_ITEMS);
    assert.equal(list.items[0].badge.color, 'danger');
    assert.equal(list.items[1].badge.color, 'warning');
    assert.equal(
      list.items[0].links[0].url,
      'https://rappel.conso.gouv.fr/fiche-rappel/23871/interne',
    );
    assert.match(list.items[0].links[1].url, /^https:\/\/rappel\.conso\.gouv\.fr\/affichettepdf\//);
  }
  const fr = await content(w, 'fr');
  assert.equal(fr.components[0].text, '80 rappels cette semaine');
  const [confit, mussels] = fr.components.find((c) => c.type === 'card-list').items;
  assert.equal(confit.title, 'Confit de canard fr le gourmand 1240g (Jean larnaudie)');
  assert.equal(confit.badge.text, 'Votre produit');
  assert.equal(mussels.title, 'Moules de bouchot stg mytilus edulis');
  assert.equal(mussels.subtitle, "20/10 · Produits de la pêche et d'aquaculture");
  assert.equal(mussels.badge.text, 'Alimentation');
  assert.match(
    mussels.description,
    /^Motif : Resultat analyse non conforme\nRisques : Escherichia coli/,
  );
  assert.match(
    fr.components.find((c) => c.variant === 'caption').text,
    /^Source : RappelConso · 20\/10/,
  );
});

test('no recall, and RappelConso never reached: a heading, no empty list', async (t) => {
  const quiet = await world(t, { categories: ['communication'] });
  const none = await content(quiet, 'de');
  assert.deepEqual(validateWidgetContent(none), []);
  assert.equal(none.components[0].text, 'Kein Rückruf diese Woche');
  assert.ok(!none.components.some((c) => c.type === 'card-list'));
  const api = createApi();
  api.down = 'network';
  const down = await world(t, {}, { api });
  const waiting = await content(down, 'es');
  assert.deepEqual(validateWidgetContent(waiting), []);
  assert.equal(waiting.components[0].text, 'Esperando a RappelConso…');
});

test('the scene action reads the week in one sentence', async (t) => {
  const w = await world(t, { keywords: 'auchan', barcodes: CONFIT_BARCODE, language: 'en' });
  const { data } = await w.fake.sceneAction('read_recalls', {});
  assert.deepEqual(data.outputs, {
    text:
      '3 product recalls this week: Confit de canard fr le gourmand 1240g (Jean larnaudie); ' +
      'Crevette entière cuite réfrigérée penaeus monodon (Auchan le poissonnier); ' +
      'Auchan baby bio croissance 6x1l. ' +
      '1 recall names your barcodes: Confit de canard fr le gourmand 1240g (Jean larnaudie).',
    count: 3,
    barcode_count: 1,
  });
});

test('the scene action fails clearly when RappelConso never answered', async (t) => {
  const api = createApi();
  api.down = 503;
  const w = await world(t, {}, { api });
  const answer = await w.fake.sceneAction('read_recalls', {});
  assert.equal(answer.success, false);
  assert.match(JSON.stringify(answer), /RappelConso ne répond pas/);
});

test('the configuration action answers in the four languages', async (t) => {
  const w = await world(t, { categories: ['clothing'] });
  const { data } = await w.fake.action('check_now', {});
  const message = data.message ?? data;
  assert.deepEqual(Object.keys(message).sort(), [...LANGUAGES].sort());
  assert.equal(
    message.fr,
    '1 rappel de produit cette semaine : Sandales femme en cuir (Free monday). Vérifié à 17:30.',
  );
});
