# RappelConso for Gladys Assistant

Product recalls in France in [Gladys Assistant](https://gladysassistant.com): food, baby items,
cosmetics, appliances, cars… as published by [RappelConso](https://rappel.conso.gouv.fr), the
official recall website of the French administration. Be told when a product of the categories,
brands or barcodes you follow is recalled. Open data, no account, no API key.

A complement, not an official alert system: always check the recall sheet. Not affiliated with the
French administration (DGCCRF, DGAL, Ministry of the Economy).

## Features

- **A "Product recalls" device**: recalls of the day and of the last 7 days in your selection, the
  latest recall with its date, and the running recalls naming one of your barcodes; with history.
- **The followed selection**: product categories, optional brands or words, and the barcodes of
  the products you have at home (searched in the whole history of RappelConso).
- **Scene triggers**: a new recall in your selection (filtered by category), and, high priority,
  one of your barcodes recalled; with product, brand, reason, risks and link as scene variables.
- **Scene action**: the recalls of the week as one sentence, to send by message or read aloud.
- **Dashboard widget**: the latest recalls, your barcodes first, each with its official sheet and
  printable poster.
- Texts in English, French, German and Spanish (the recall sheets themselves are in French).

## Requirements

- Gladys Assistant 5.1 or later.
- Internet access from the Gladys host (`data.economie.gouv.fr`).

## Installation

1. In Gladys, open **Integrations → Install from GitHub** and enter
   `https://github.com/guim31/gladys-rappelconso` (or install it from the catalog once it is
   listed).
2. In **Configuration**, choose the categories, and optionally brands, words and barcodes, then
   save. **Show the recalls of the week** lists what your settings catch.
3. Open the **Discover** tab and add the **Product recalls** device.

The user guide is in [`docs/en.md`](docs/en.md) ([français](docs/fr.md), [Deutsch](docs/de.md),
[español](docs/es.md)); Gladys links it from the Configuration screen.

## How it works

```
Integration container ──HTTPS──▶ data.economie.gouv.fr   Opendatasoft Explore API v2.1
      │ SDK (WebSocket + host API)                       dataset rappelconso-v2-gtin-espaces
      ▼
Gladys core ── device, states, scene events, scene action, widget
```

- Every 15 minutes to 6 hours (1 hour by default) the container reads the recalls of the last
  8 days (about 90 a week: one page of 100), and, when barcodes are set, every recall of any date
  naming one of them. The device is published with `should_poll: false`: the core does not poll
  external devices reliably (GladysAssistant/Gladys#3198).
- The selection (categories, whole words without accents, barcodes with or without leading zeros)
  is computed in the container.
- The recall sheets seen and the barcode matches already announced are kept under `/data`, so a
  restart fires no trigger twice; the recalls listed at the very first start are not news.

## Limitations

- France only, and only what RappelConso publishes. Matching relies on the category, the words and
  the barcodes printed on the sheet: a product without its barcode on the sheet can be missed.
- RappelConso stopped filling the end date of the recall procedures in July 2026: a recall naming
  one of your barcodes stays counted as running.
- Tested against the real RappelConso open data and the SDK's fake Gladys; not yet on a real Gladys
  instance: feedback welcome.

## Development

```bash
npm ci
npm run format:check && npm run lint && npm test
npx -y github:GladysAssistant/integration-store --skip-image-check .
```

The tests run against the SDK's fake Gladys and a fake API serving real sheets recorded on
20/10/2026 (`test/fixtures/rappelconso/`): never the network.

## Credits

- Data: [RappelConso](https://rappel.conso.gouv.fr) (DGCCRF, DGAL, DGEC, DGPR), open dataset
  [RappelConso V2](https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces/) of
  the French Ministry of the Economy, under the
  [Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
- Built on the [Gladys integration SDK](https://github.com/GladysAssistant/integration-sdk-js) and
  the official JavaScript template.

## License

[Apache 2.0](LICENSE).
