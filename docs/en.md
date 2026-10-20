# RappelConso

Product recalls in France, in Gladys Assistant: food, baby items, cosmetics, appliances, cars…
as published by [RappelConso](https://rappel.conso.gouv.fr), the official recall website of the
French administration (DGCCRF, DGAL and others). Be told when a product of the categories, brands
or barcodes you follow is recalled. No account, no API key.

A complement, not an official alert system: always check the recall sheet, and follow its
instructions. Not affiliated with the French administration.

## What you get

- A **"Product recalls" device**: recalls of the day and of the last 7 days in your selection,
  the latest recall with its date, and the number of running recalls naming one of your barcodes.
- A **scene trigger** "new recall in my selection", filtered by category, with the product, brand,
  reason, risks and link of the recall as scene variables.
- A **high-priority scene trigger** "one of my barcodes is recalled", for the products you have at
  home, even when the recall was published before you added the barcode.
- A **scene action** reading the recalls of the week in one sentence.
- A **dashboard widget** with the latest recalls, your barcodes first, and links to the official
  sheets.

## Requirements

- Gladys Assistant 5.1.0 or later (widgets, scene triggers and actions).
- Internet access from Gladys to `data.economie.gouv.fr`.
- Nothing else: the data is open, read without an account.

## Configuration

### Settings

| Setting                   | What it does                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Categories                | Recalls of these categories are followed. All by default; about 90 recalls a week, three quarters of them food.                           |
| Brands or words           | Optional. Only the recalls naming one of them (brand, product or references), separated by commas. Whole words; accents and case ignored. |
| Barcodes of your products | Optional. The numbers under the barcodes (EAN, 8 to 14 digits), separated by commas. Followed in every category.                          |
| Refresh interval          | 15 minutes to 6 hours; 1 hour by default.                                                                                                 |
| Language of the texts     | Names of the features (at their creation) and texts sent to the scenes. The recall sheets themselves stay in French.                      |

Save, then create the device in the **Discover** tab of the integration. The button **Show the
recalls of the week** reads RappelConso again and shows what your selection holds.

### The followed selection

A recall is in your selection when its category is followed **and**, if you typed brands or words,
it names one of them. For example, the categories "Babies and children" and "Food" with the words
`lait infantile, petit pot` follow baby food and every baby item.

The barcodes are followed **whatever the categories**: a recall naming one of them is always in
your selection. They are also looked for in the **whole history** of RappelConso: a recall
published months ago that is still running counts too. A recall is running until the end date of
its procedure; RappelConso has stopped filling that date since July 2026, so most recent recalls
stay counted.

## Device

| Feature                | Type    | Value                                                                   |
| ---------------------- | ------- | ----------------------------------------------------------------------- |
| Recalls today          | Counter | Recalls of your selection published today (time zone of Gladys).        |
| Recalls in 7 days      | Counter | The same over the last 7 days.                                          |
| Latest recall          | Text    | The newest one, e.g. `20/10 · Confit de canard 1240g (Jean larnaudie)`. |
| Recalls of my barcodes | Counter | Running recalls, of any date, naming one of your barcodes.              |

The counters keep their history. "Recalls today" goes back to 0 at the first refresh after
midnight.

## Dashboard widget

**Product recalls**: the number of recalls of the week, then up to 8 recalls: those naming your
barcodes first (red badge "Your product"), then the newest of your selection (orange badge: the
category). Tap a row for the reason, the risks, what to do, and the links to the recall sheet and
its printable poster.

## Scene triggers

**RappelConso: new recall in my selection.** A recall sheet seen for the first time, in your
selection. Filter: the categories (empty: all). A corrected sheet (a new version of an older
recall) does not fire it, nor do the recalls of the week already published when you widen your
selection, nor those found at the very first start.

**RappelConso: one of my barcodes is recalled.** A running recall names one of your barcodes, for
the first time. Optional filter: one barcode, typed as in the settings. It also fires when you add
the barcode of a product already recalled.

Variables of both triggers: product, brand, category (stable key such as `food`), category in
words, reason, risks, link to the recall sheet, a summary in one sentence, and the barcode for the
second trigger. The product, brand, reason and risks are in French, as RappelConso publishes them.

## Scene action

**RappelConso: read the recalls of the week.** Outputs: the recalls of your selection over 7 days
in one sentence (5 named at most, then the recalls of your barcodes), their number, and the number
of running recalls of your barcodes. If RappelConso was never reached, the action fails with a
clear message.

## Scene examples

- **Your product is recalled**: trigger "one of my barcodes is recalled", then send a message
  `{{triggerEvent.data.summary}} {{triggerEvent.data.url}}` and blink a lamp red.
- **Baby items**: trigger "new recall in my selection" with the category "Babies and children",
  then send a message with the product, the reason and the link.
- **Weekly digest**: every Saturday at 10:00, the action "read the recalls of the week", then send
  its text by message or have it read aloud.

## Data sources, terms and quotas

The recalls come from the open dataset
[RappelConso V2](https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces/) of the
French Ministry of the Economy, published under the
[Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/): reuse is
free, with the source cited. Source: RappelConso, DGCCRF and the other administrations publishing
on it.

Each refresh sends one request (two with barcodes) to the Opendatasoft API. The anonymous quota is
50,000 requests a day per address: once an hour is about 50 requests a day. The dataset is updated
several times a day.

## Troubleshooting

- **The device does not appear**: save the configuration, then open the Discover tab of the
  integration.
- **"RappelConso does not answer"**: data.economie.gouv.fr is unreachable or overloaded. The last
  recalls stay shown and the integration tries again at every refresh.
- **"Ignored (not a barcode of 8 to 14 digits)"**: a barcode of the list holds letters or too few
  digits; type the numbers printed under the bars.
- **A recall I expected is missing**: check its category on the sheet, and the words you typed (whole
  words: `lait` does not match `laitier`).
- **More details**: set `LOG_LEVEL=debug` in the integration and read its logs.

## Limits

- France only, and only what RappelConso publishes: a recall announced elsewhere first may appear
  later.
- A recall is matched by category, words and barcodes; a product sold under another name or without
  a barcode on the sheet can be missed. Always check the sheet before throwing a product away.
- The texts of the sheets are in French.
- "Recalls today" is updated at the next refresh after midnight.
- Not affiliated with the French administration. Data: RappelConso, Licence Ouverte 2.0.
