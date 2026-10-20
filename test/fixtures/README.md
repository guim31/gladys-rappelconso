# Test fixtures

- `gladys-feature-table.json`: the category/type couples, units and poll frequencies the Gladys
  core knows, extracted from its code (see `test/gladys-rules.test.js`).
- `rappelconso/week-2026-10-20.json`: the 94 recall sheets published from 12/10/2026, as returned by
  the Opendatasoft Explore API (`rappelconso-v2-gtin-espaces/records`, the columns of
  `FIELDS` in `src/rappelconso.js`) on 20/10/2026 around 15:10 UTC, unmodified.
- `rappelconso/barcodes-2026-10-20.json`: the 4 sheets naming the barcodes 3608391173227,
  3113010173927 or 5400742903204 (`identification_produits like "…"`), same day: a running recall
  of four scooters (the barcode of the second product onwards prefixed with "|"), and the same trout
  recalled twice, the first sheet ended in July.

Public open data of the French administration (Licence Ouverte 2.0). The columns holding the phone
number of the manufacturers and the distributors are not requested; no personal data. The fake API
of `test/helpers/world.js` serves them, filtered and paged like the real one.
