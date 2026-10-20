// -----------------------------------------------------------------------------
// The scene action `read_recalls` and the configuration action `check_now`.
// Both read RappelConso again when the last cycle is older than one interval,
// and answer with the recalls of the week as one sentence: something a scene
// can send by message or read aloud, newest first, then the running recalls
// naming one of the user's barcodes.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { LANGUAGES } from './config.js';
import { STATUS, formatTime, render, sentence } from './messages.js';

const logger = createLogger({ name: 'rappelconso-actions' });

export const SCENE_ACTION = 'read_recalls';
export const CONFIG_ACTION = 'check_now';

/** Scene action: outputs `text`, `count` and `barcode_count`; throws if RappelConso never answered. */
export async function readRecalls(monitor) {
  const { recalls, barcodeRecalls, ok } = await monitor.fresh();
  if (!ok) {
    throw new Error(render(STATUS, 'apiDown')[monitor.config.language]);
  }
  return {
    text: sentence(recalls, barcodeRecalls, monitor.config.language),
    count: recalls.length,
    barcode_count: barcodeRecalls.length,
  };
}

/** Configuration action: the recalls of the selection now, in every language. */
export async function checkNow(monitor) {
  const { recalls, barcodeRecalls, ok } = await monitor.fresh();
  logger.info(
    `Check requested: ${ok ? `${recalls.length} recall(s) this week, ${barcodeRecalls.length} naming a barcode` : 'RappelConso unreachable'}`,
  );
  if (!ok) {
    return render(STATUS, 'apiDown');
  }
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      render(STATUS, 'summary', {
        text: sentence(recalls, barcodeRecalls, language),
        time: formatTime(monitor.lastSuccessAt, language),
      })[language],
    ]),
  );
}
