# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

## [1.0.0] - 2026-10-20

### Added

- A "Product recalls" device fed by the RappelConso open data: recalls of the day and of the last
  7 days in your selection, the latest recall with its date, and the running recalls naming one of
  your barcodes.
- The followed selection: product categories, optional brands or words, and the barcodes of your
  products, searched in the whole history of RappelConso.
- Scene triggers "new recall in my selection" (filtered by category) and "one of my barcodes is
  recalled", with product, brand, reason, risks and link as variables.
- Scene action "read the recalls of the week", and a configuration button showing them.
- Dashboard widget with the latest recalls, your barcodes first, and links to the official sheets.
- Texts and documentation in English, French, German and Spanish.

[Unreleased]: https://github.com/guim31/gladys-rappelconso/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/guim31/gladys-rappelconso/releases/tag/v1.0.0
