// -----------------------------------------------------------------------------
// The monitor: reads the RappelConso recalls every `refresh_interval` minutes,
// keeps those of the followed selection, publishes the states of the device,
// fires the scene triggers and serves the widget and the actions.
//
// Selection: a recall whose category is followed and, when brands or words are
// given, that names one of them (brand, product or references); plus, whatever
// its category, every recall naming one of the user's barcodes.
//
// Triggers:
//   - `new_recall`: a recall sheet seen for the first time, in the selection.
//     Every sheet read is remembered, in the selection or not: widening the
//     selection later fires nothing for the recalls of the week already
//     published. A corrected sheet (version 2 and up) is not a new recall.
//     The first start ever fires nothing: what is listed then is not news.
//   - `barcode_recalled`: a running recall (of any date) names one of the
//     user's barcodes, for the first time. Fired at the first start too, and
//     when a barcode is added: it is the point of following one.
// What was seen is kept under /data, so a restart fires nothing again.
//
// States: `publishChangedStates` sends only what changed, plus a heartbeat every
// 12 hours.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { barcodeKey, fold } from './config.js';
import { buildDevice, deviceIds } from './device.js';
import {
  CATEGORY_NAMES,
  PHRASES,
  STATUS,
  clip,
  describe,
  join,
  localDay,
  nameOf,
  render,
} from './messages.js';
import { fetchByBarcodes, fetchRecent } from './rappelconso.js';

const logger = createLogger({ name: 'rappelconso' });

export const WIDGET_KEY = 'recalls';
export const TRIGGERS = { NEW: 'new_recall', BARCODE: 'barcode_recalled' };

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export const WEEK_MS = 7 * DAY;

export const DEFAULT_TIMINGS = {
  heartbeatMs: 12 * HOUR,
  // A sheet out of the 8-day window for this long is forgotten.
  forgetAfterMs: 30 * DAY,
  // requestWidgetRefresh is rate-limited to one call every 10 s by the core.
  widgetRefreshMs: 10000,
};

// Scene events fired by one cycle at most: the core takes 300 a minute, and a
// burst (back after a long outage) is better summed up by the device.
export const MAX_EVENTS_PER_CYCLE = 20;
// Texts of the scene variables (the core takes 1000 characters).
const MAX_VARIABLE = 500;

const newestFirst = (a, b) => b.publishedAt - a.publishedAt || b.key.localeCompare(a.key);

export class Monitor {
  /**
   * @param {object} options
   * @param {object} options.gladys GladysIntegration (or the SDK fake)
   * @param {object} options.store see src/store.js
   * @param {Function} [options.fetch] fetch
   * @param {boolean} [options.timers] false: no background timer (tests drive the cycles)
   * @param {Function} [options.now] clock in ms
   * @param {object} [options.timings] overrides of DEFAULT_TIMINGS
   */
  constructor({ gladys, store, fetch: fetchImpl, timers = true, now, timings }) {
    this.gladys = gladys;
    this.store = store;
    this.fetch = fetchImpl ?? ((...args) => fetch(...args));
    this.timers = timers;
    this.now = now ?? (() => Date.now());
    this.timings = { ...DEFAULT_TIMINGS, ...timings };
    this.config = null;
    this.data = emptyData();
    // The recalls of the last successful cycle: the selection of the last 7
    // days, and the running recalls naming a barcode, newest first.
    this.recalls = [];
    this.barcodeRecalls = [];
    this.lastSuccessAt = null;
    this.lastCycleAt = -Infinity;
    this.truncated = false;
    this.statusMessage = undefined;
    this.cycleTimer = null;
    this.running = null;
    this.lastRefreshAt = -Infinity;
    this.refreshTimer = null;
    // null: the first successful cycle always nudges the widget.
    this.signature = null;
    this.stopped = false;
    // Keys of the failures already logged, so a repeated one is not logged again.
    this.failing = new Set();
  }

  /** Log a failure once (warn or error), then at debug until `recovered(key)`. */
  failed(key, level, message, err) {
    const details = err ? [message, err] : [message];
    if (this.failing.has(key)) {
      logger.debug(...details);
      return;
    }
    this.failing.add(key);
    logger[level](...details);
  }

  /** One line when a failure logged by `failed(key)` is over. */
  recovered(key, message) {
    if (this.failing.delete(key)) {
      logger.info(message);
    }
  }

  // --- Lifecycle -------------------------------------------------------------

  async start(config) {
    this.config = config;
    const saved = await this.store.load();
    if (saved?.version === 1) {
      this.data = { ...emptyData(), ...saved };
    }
    await this.publishDiscovered();
    this.warnAboutConfig();
    logger.info(`Started: RappelConso read every ${config.refreshMinutes} min`);
    this.schedule();
    this.runCycle();
  }

  /** Reconnection: Gladys may have restarted, publish everything again. */
  async resync(config) {
    this.config = config;
    await this.publishDiscovered();
    this.statusMessage = undefined;
    await this.updateConnectionStatus();
    this.gladys.forgetPublishedStates?.();
    await this.publishStates();
    this.requestRefresh();
  }

  async reconfigure(config) {
    // A cycle already running finishes with the old configuration.
    await this.running;
    const languageChanged = config.language !== this.config?.language;
    this.config = config;
    logger.info('Configuration saved');
    this.warnAboutConfig();
    if (languageChanged) {
      await this.publishDiscovered();
    }
    this.schedule();
    await this.runCycle();
    this.requestRefresh();
  }

  async stop() {
    this.stopped = true;
    clearInterval(this.cycleTimer);
    clearTimeout(this.refreshTimer);
    this.cycleTimer = null;
    await this.running?.catch(() => {});
    await this.store.flush();
  }

  schedule() {
    if (!this.timers || this.stopped) {
      return;
    }
    clearInterval(this.cycleTimer);
    this.cycleTimer = setInterval(() => this.runCycle(), this.config.refreshMinutes * MINUTE);
    this.cycleTimer.unref?.();
  }

  warnAboutConfig() {
    const { invalidBarcodes, categories } = this.config;
    if (invalidBarcodes.length > 0) {
      logger.warn(`Not a barcode, ignored: ${invalidBarcodes.join(', ')}`);
    }
    if (categories.length === 0) {
      logger.warn('No category selected: only the barcodes are followed');
    }
  }

  async publishDiscovered() {
    await this.gladys.publishDiscoveredDevices([buildDevice(this.gladys, this.config.language)]);
  }

  isCreated() {
    const id = deviceIds(this.gladys).device;
    return (this.gladys.devices ?? []).some((device) => device.external_id === id);
  }

  // --- Selection ---------------------------------------------------------------

  /** The followed barcodes a recall names. */
  barcodesOf(recall) {
    return this.config.barcodes.filter((code) => recall.barcodes.includes(barcodeKey(code)));
  }

  /** In the followed categories, and naming a followed brand or word if any. */
  inCategories(recall) {
    const { categories, keywords } = this.config;
    if (!categories.includes(recall.category)) {
      return false;
    }
    if (keywords.length === 0) {
      return true;
    }
    const words = ` ${fold(`${recall.brand} ${recall.product} ${recall.references}`)} `;
    return keywords.some((keyword) => words.includes(` ${keyword} `));
  }

  selected(recall) {
    return this.inCategories(recall) || this.barcodesOf(recall).length > 0;
  }

  /** A recall still running: no end date, or an end date not passed yet. */
  stillRunning(recall) {
    return recall.endsOn === null || recall.endsOn >= localDay(this.now());
  }

  // --- Cycles ------------------------------------------------------------------

  runCycle() {
    if (this.running || this.stopped) {
      return this.running;
    }
    this.running = this.cycle()
      .catch((err) => this.failed('cycle', 'error', 'Refresh cycle failed', err))
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  async cycle() {
    this.lastCycleAt = this.now();
    let recent;
    let byBarcode;
    try {
      recent = await fetchRecent(this.fetch, { now: this.now() });
      byBarcode = await fetchByBarcodes(this.fetch, this.config.barcodes);
      this.recovered('api', 'RappelConso answers again');
    } catch (err) {
      this.failed('api', 'warn', `RappelConso unreachable: ${err.message}`);
      await this.updateConnectionStatus();
      return;
    }
    this.truncated = recent.truncated;
    const since = this.now() - WEEK_MS;
    this.recalls = recent.recalls
      .filter((recall) => recall.publishedAt >= since && this.selected(recall))
      .sort(newestFirst);
    const byKey = new Map(
      [...byBarcode.recalls, ...recent.recalls].map((recall) => [recall.key, recall]),
    );
    this.barcodeRecalls = [...byKey.values()]
      .filter((recall) => this.barcodesOf(recall).length > 0 && this.stillRunning(recall))
      .sort(newestFirst);
    logger.debug(
      `Refresh cycle: ${recent.recalls.length} recall(s) in 8 days, ${this.recalls.length} selected in 7 days, ${this.barcodeRecalls.length} naming a barcode`,
    );
    await this.detectChanges(recent.recalls);
    this.lastSuccessAt = this.now();
    this.recovered('cycle', 'Refresh cycles work again');
    await this.publishStates();
    await this.updateConnectionStatus();
    const signature = [...this.recalls, ...this.barcodeRecalls]
      .map((recall) => `${recall.key}:${recall.version}`)
      .join(',');
    if (signature !== this.signature) {
      this.signature = signature;
      this.requestRefresh();
    }
  }

  /** Fire the scene triggers, and remember what was seen. */
  async detectChanges(recent) {
    const now = this.now();
    const { known, matches } = this.data;
    const seed = !this.data.seeded;
    const fired = [];
    // Barcodes first: they are the high-priority news.
    for (const recall of this.barcodeRecalls) {
      for (const barcode of this.barcodesOf(recall)) {
        const pair = `${recall.key}:${barcodeKey(barcode)}`;
        if (!matches[pair]) {
          fired.push({ key: TRIGGERS.BARCODE, recall, barcode });
        }
        matches[pair] = now;
      }
    }
    // Oldest first, so the scenes hear them in the order of publication.
    for (const recall of [...recent].sort(newestFirst).reverse()) {
      if (!known[recall.key] && !seed && recall.version <= 1 && this.selected(recall)) {
        fired.push({ key: TRIGGERS.NEW, recall });
      }
      known[recall.key] = now;
    }
    for (const table of [known, matches]) {
      for (const [key, seenAt] of Object.entries(table)) {
        if (now - seenAt > this.timings.forgetAfterMs) {
          delete table[key];
        }
      }
    }
    this.data.seeded = true;
    this.store.save(this.data);
    if (seed) {
      logger.debug(`${recent.length} recall(s) taken as known`);
    }
    for (const [index, change] of fired.entries()) {
      if (index >= MAX_EVENTS_PER_CYCLE) {
        logger.debug(`${fired.length - index} more recall(s) not sent to the scenes`);
        break;
      }
      await this.fire(change);
    }
  }

  async fire({ key, recall, barcode }) {
    if (key === TRIGGERS.BARCODE) {
      logger.info(`Barcode ${barcode} recalled: sheet ${recall.key}`);
    } else {
      // About 90 recalls a week: the logs do not keep them.
      logger.debug(`New recall: sheet ${recall.key}`);
    }
    try {
      await this.gladys.publishSceneEvent(key, this.eventData(recall, barcode));
      this.recovered('scene', 'Scene triggers work again');
    } catch (err) {
      this.failed('scene', 'warn', `Firing the scene trigger failed: ${err.message}`);
    }
  }

  /** The flat data of a scene event (fields, then variables of the manifest). */
  eventData(recall, barcode) {
    const language = this.config.language;
    const p = PHRASES[language];
    const name = nameOf(recall);
    const reason = clip(recall.reason, 300);
    const data = {
      category: recall.category,
      category_name: CATEGORY_NAMES[language][recall.category],
      product: clip(recall.product, MAX_VARIABLE),
      brand: clip(recall.brand, MAX_VARIABLE),
      reason: clip(recall.reason, MAX_VARIABLE),
      risks: clip(recall.risks, MAX_VARIABLE),
      url: recall.url,
      summary: clip(
        barcode ? p.barcodeSummary({ barcode, name, reason }) : p.summary({ name, reason }),
        MAX_VARIABLE * 2,
      ),
    };
    if (barcode) {
      data.barcode = barcode;
    }
    return data;
  }

  // --- States ------------------------------------------------------------------

  statesOf() {
    if (this.lastSuccessAt === null) {
      return [];
    }
    const ids = deviceIds(this.gladys);
    const language = this.config.language;
    const today = localDay(this.now());
    const [latest] = this.recalls;
    return [
      {
        device_feature_external_id: ids.today,
        state: this.recalls.filter((recall) => localDay(recall.publishedAt) === today).length,
      },
      { device_feature_external_id: ids.week, state: this.recalls.length },
      {
        device_feature_external_id: ids.latest,
        text: latest ? describe(latest, language) : PHRASES[language].none,
      },
      { device_feature_external_id: ids.barcodes, state: this.barcodeRecalls.length },
    ];
  }

  async publishStates() {
    if (!this.isCreated()) {
      return;
    }
    const states = this.statesOf();
    if (states.length === 0) {
      return;
    }
    try {
      await this.gladys.publishChangedStates(states, { heartbeat: this.timings.heartbeatMs });
      this.recovered('publish', 'Publishing the states works again');
    } catch (err) {
      // Sent again at the next cycle (the SDK forgets what Gladys refused).
      this.failed('publish', 'warn', `Publishing the states failed: ${err.message}`);
    }
  }

  async updateConnectionStatus() {
    const parts = [];
    if (this.failing.has('api')) {
      parts.push(render(STATUS, 'apiDown'));
    }
    if (this.config.categories.length === 0) {
      parts.push(render(STATUS, 'noCategory'));
    }
    if (this.config.invalidBarcodes.length > 0) {
      parts.push(
        render(STATUS, 'invalidBarcodes', { values: this.config.invalidBarcodes.join(', ') }),
      );
    }
    if (this.truncated) {
      parts.push(render(STATUS, 'truncated'));
    }
    const message = parts.length > 0 ? join(...parts) : undefined;
    const connected = !this.failing.has('api') && this.lastSuccessAt !== null;
    const key = JSON.stringify([connected, message]);
    if (key === this.statusMessage) {
      return;
    }
    this.statusMessage = key;
    await this.gladys.setConnectionStatus(connected, message).catch(() => {});
  }

  // --- Gladys events -----------------------------------------------------------

  async onDeviceCreated(device) {
    if (device?.external_id !== deviceIds(this.gladys).device) {
      return;
    }
    if (this.lastSuccessAt === null) {
      await this.runCycle();
    }
    // The SDK forgot the states of the device: everything is published again.
    await this.publishStates();
    this.requestRefresh();
  }

  /** onPoll fallback: should_poll is false, but a Gladys polling anyway gets an answer. */
  async poll(device) {
    if (device?.external_id !== deviceIds(this.gladys).device) {
      return;
    }
    // Read again only if the last cycle is older than half the interval.
    if (this.now() - this.lastCycleAt >= (this.config.refreshMinutes * MINUTE) / 2) {
      await this.runCycle();
    } else {
      await this.publishStates();
    }
  }

  /** The recalls, read again if the last cycle is older than one interval. */
  async fresh() {
    if (this.now() - this.lastCycleAt >= this.config.refreshMinutes * MINUTE) {
      await this.runCycle();
    } else {
      await this.running;
    }
    return {
      recalls: this.recalls,
      barcodeRecalls: this.barcodeRecalls,
      ok: this.lastSuccessAt !== null,
    };
  }

  // --- Widget -------------------------------------------------------------------

  requestRefresh() {
    if (this.stopped) {
      return;
    }
    const now = this.now();
    const wait = this.lastRefreshAt + this.timings.widgetRefreshMs - now;
    if (wait <= 0) {
      this.lastRefreshAt = now;
      this.gladys.requestWidgetRefresh(WIDGET_KEY);
    } else if (this.timers && !this.refreshTimer) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTimer = null;
        this.requestRefresh();
      }, wait);
      this.refreshTimer.unref?.();
    }
  }
}

function emptyData() {
  return { version: 1, seeded: false, known: {}, matches: {} };
}
