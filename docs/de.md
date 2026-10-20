# RappelConso

Produktrückrufe in Frankreich, in Gladys Assistant: Lebensmittel, Babyartikel, Kosmetik, Geräte,
Autos… so wie sie [RappelConso](https://rappel.conso.gouv.fr) veröffentlicht, die offizielle
Rückruf-Website der französischen Verwaltung (DGCCRF, DGAL und weitere). Werde informiert, wenn ein
Produkt der Kategorien, Marken oder Barcodes, die du verfolgst, zurückgerufen wird. Kein Konto, kein
API-Schlüssel.

Eine Ergänzung, kein offizielles Warnsystem: Prüfe immer das Rückrufblatt und befolge seine
Hinweise. Nicht mit der französischen Verwaltung verbunden.

## Was du bekommst

- Ein **Gerät „Produktrückrufe“**: Rückrufe des Tages und der letzten 7 Tage in deiner Auswahl, der
  neueste Rückruf mit Datum und die Zahl der laufenden Rückrufe, die einen deiner Barcodes nennen.
- Ein **Szenenauslöser** „neuer Rückruf in meiner Auswahl“, nach Kategorie filterbar, mit Produkt,
  Marke, Grund, Risiken und Link des Rückrufs als Szenenvariablen.
- Ein **vorrangiger Szenenauslöser** „einer meiner Barcodes wird zurückgerufen“, für die Produkte,
  die du zu Hause hast, auch wenn der Rückruf vor dem Hinzufügen des Barcodes veröffentlicht wurde.
- Eine **Szenenaktion**, die die Rückrufe der Woche in einem Satz liest.
- Ein **Dashboard-Widget** mit den neuesten Rückrufen, deine Barcodes zuerst, und Links zu den
  offiziellen Blättern.

## Voraussetzungen

- Gladys Assistant 5.1.0 oder neuer (Widgets, Szenenauslöser und -aktionen).
- Internetzugang von Gladys zu `data.economie.gouv.fr`.
- Sonst nichts: Die Daten sind offen und werden ohne Konto gelesen.

## Konfiguration

### Einstellungen

| Einstellung              | Wirkung                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kategorien               | Die Rückrufe dieser Kategorien werden verfolgt. Standardmäßig alle; etwa 90 Rückrufe pro Woche, zu drei Vierteln Lebensmittel.                             |
| Marken oder Wörter       | Optional. Nur die Rückrufe, die eines davon nennen (Marke, Produkt oder Referenzen), durch Kommas getrennt. Ganze Wörter; Akzente und Großschreibung egal. |
| Barcodes deiner Produkte | Optional. Die Ziffern unter den Barcodes (EAN, 8 bis 14 Ziffern), durch Kommas getrennt. In allen Kategorien verfolgt.                                     |
| Aktualisierungsintervall | 15 Minuten bis 6 Stunden; standardmäßig 1 Stunde.                                                                                                          |
| Sprache der Texte        | Namen der Funktionen (bei ihrer Erstellung) und Texte für die Szenen. Die Rückrufblätter selbst bleiben auf Französisch.                                   |

Speichere und lege dann das Gerät im Tab **Entdecken** der Integration an. Die Schaltfläche
**Rückrufe der Woche anzeigen** liest RappelConso erneut und zeigt, was deine Auswahl enthält.

### Die verfolgte Auswahl

Ein Rückruf ist in deiner Auswahl, wenn seine Kategorie verfolgt wird **und**, falls du Marken oder
Wörter eingegeben hast, er eines davon nennt. Zum Beispiel verfolgen die Kategorien „Babys und
Kinder“ und „Lebensmittel“ mit den Wörtern `lait infantile, petit pot` Babynahrung und alle
Babyartikel. Die Blätter sind auf Französisch: Gib französische Wörter ein.

Die Barcodes werden **unabhängig von den Kategorien** verfolgt: Ein Rückruf, der einen davon nennt,
ist immer in deiner Auswahl. Gesucht wird auch in der **gesamten Historie** von RappelConso:
Ein vor Monaten veröffentlichter, noch laufender Rückruf zählt ebenfalls. Ein Rückruf läuft bis zum
Enddatum seines Verfahrens; RappelConso füllt dieses Datum seit Juli 2026 nicht mehr aus, sodass die
meisten neueren Rückrufe gezählt bleiben.

## Gerät

| Funktion                 | Typ    | Wert                                                                   |
| ------------------------ | ------ | ---------------------------------------------------------------------- |
| Rückrufe heute           | Zähler | Heute veröffentlichte Rückrufe deiner Auswahl (Zeitzone von Gladys).   |
| Rückrufe in 7 Tagen      | Zähler | Dasselbe über die letzten 7 Tage.                                      |
| Neuester Rückruf         | Text   | Der neueste, z. B. `20.10. · Confit de canard 1240g (Jean larnaudie)`. |
| Rückrufe meiner Barcodes | Zähler | Laufende Rückrufe beliebigen Datums, die einen deiner Barcodes nennen. |

Die Zähler behalten ihren Verlauf. „Rückrufe heute“ geht bei der ersten Aktualisierung nach
Mitternacht auf 0 zurück.

## Dashboard-Widget

**Produktrückrufe**: die Zahl der Rückrufe der Woche, dann bis zu 8 Rückrufe: zuerst die, die deine
Barcodes nennen (rotes Abzeichen „Dein Produkt“), dann die neuesten deiner Auswahl (oranges
Abzeichen: die Kategorie). Tippe auf eine Zeile für Grund, Risiken, was zu tun ist und die Links zum
Rückrufblatt und seinem druckbaren Aushang.

## Szenenauslöser

**RappelConso: neuer Rückruf in meiner Auswahl.** Ein Rückrufblatt, das zum ersten Mal gesehen wird,
in deiner Auswahl. Filter: die Kategorien (leer: alle). Ein korrigiertes Blatt (neue Version eines
älteren Rückrufs) löst ihn nicht aus, ebenso wenig die bereits veröffentlichten Rückrufe der Woche,
wenn du deine Auswahl erweiterst, oder die beim allerersten Start gefundenen.

**RappelConso: einer meiner Barcodes wird zurückgerufen.** Ein laufender Rückruf nennt zum ersten
Mal einen deiner Barcodes. Optionaler Filter: ein Barcode, so eingegeben wie in den Einstellungen.
Er wird auch ausgelöst, wenn du den Barcode eines bereits zurückgerufenen Produkts hinzufügst.

Variablen beider Auslöser: Produkt, Marke, Kategorie (fester Schlüssel wie `food`), Kategorie
ausgeschrieben, Grund, Risiken, Link zum Rückrufblatt, eine Zusammenfassung in einem Satz und der
Barcode beim zweiten Auslöser. Produkt, Marke, Grund und Risiken sind auf Französisch, so wie
RappelConso sie veröffentlicht.

## Szenenaktion

**RappelConso: Rückrufe der Woche lesen.** Ausgaben: die Rückrufe deiner Auswahl der letzten
7 Tage in einem Satz (höchstens 5 genannt, dann die Rückrufe deiner Barcodes), ihre Anzahl und die
Zahl der laufenden Rückrufe deiner Barcodes. Wurde RappelConso nie erreicht, schlägt die Aktion mit
einer klaren Meldung fehl.

## Szenenbeispiele

- **Dein Produkt wird zurückgerufen**: Auslöser „einer meiner Barcodes wird zurückgerufen“, dann
  eine Nachricht `{{triggerEvent.data.summary}} {{triggerEvent.data.url}}` senden und eine Lampe rot
  blinken lassen.
- **Babyartikel**: Auslöser „neuer Rückruf in meiner Auswahl“ mit der Kategorie „Babys und Kinder“,
  dann eine Nachricht mit Produkt, Grund und Link senden.
- **Wochenrückblick**: jeden Samstag um 10:00 die Aktion „Rückrufe der Woche lesen“, dann ihren Text
  per Nachricht senden oder vorlesen lassen.

## Datenquellen, Bedingungen und Kontingente

Die Rückrufe stammen aus dem offenen Datensatz
[RappelConso V2](https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces/) des
französischen Wirtschaftsministeriums, veröffentlicht unter der
[Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/): Die
Weiterverwendung ist frei, mit Quellenangabe. Quelle: RappelConso, DGCCRF und die anderen dort
veröffentlichenden Behörden.

Jede Aktualisierung sendet eine Anfrage (zwei mit Barcodes) an die Opendatasoft-API. Das anonyme
Kontingent beträgt 50.000 Anfragen pro Tag und Adresse: Einmal pro Stunde sind etwa 50 Anfragen am
Tag. Der Datensatz wird mehrmals täglich aktualisiert.

## Fehlerbehebung

- **Das Gerät erscheint nicht**: Speichere die Konfiguration und öffne dann den Tab „Entdecken“ der
  Integration.
- **„RappelConso antwortet nicht“**: data.economie.gouv.fr ist nicht erreichbar oder überlastet. Die
  letzten Rückrufe bleiben angezeigt, und die Integration versucht es bei jeder Aktualisierung
  erneut.
- **„Ignoriert (kein Barcode mit 8 bis 14 Ziffern)“**: Ein Code der Liste enthält Buchstaben oder zu
  wenige Ziffern; gib die unter den Strichen gedruckten Ziffern ein.
- **Ein erwarteter Rückruf fehlt**: Prüfe seine Kategorie auf dem Blatt und die eingegebenen Wörter
  (ganze Wörter: `lait` findet nicht `laitier`).
- **Mehr Details**: Setze `LOG_LEVEL=debug` in der Integration und lies ihre Protokolle.

## Grenzen

- Nur Frankreich, und nur, was RappelConso veröffentlicht: Ein zuerst anderswo angekündigter Rückruf
  kann später erscheinen.
- Ein Rückruf wird über Kategorie, Wörter und Barcodes gefunden; ein Produkt unter anderem Namen oder
  ohne Barcode auf dem Blatt kann durchrutschen. Prüfe immer das Blatt, bevor du ein Produkt
  wegwirfst.
- Die Texte der Blätter sind auf Französisch.
- „Rückrufe heute“ wird bei der ersten Aktualisierung nach Mitternacht aktualisiert.
- Nicht mit der französischen Verwaltung verbunden. Daten: RappelConso, Licence Ouverte 2.0.
