# SEDAP Express — Validator & Generator

Web-Tooling zur Prüfung und Erzeugung von SEDAP-Express-Nachrichten.
Zielgruppe: technische Ansprechpartner teilnehmender Systeme, die ihr
Nachrichtenformat vor der Anbindung an die Übungsinfrastruktur selbst
verifizieren wollen.

## Wahrheitsquelle

`SEDAP-Express-ICD-for-AI-v1.4.8.md` ist die **einzige** Quelle für
Nachrichtenaufbau, Feldnamen, Feldreihenfolge, Pflichtfelder und
Wertebereiche.

Verbindliche Regeln:

- Felder werden **nie** ergänzt, umbenannt oder umsortiert, wenn sie nicht
  exakt so im ICD stehen.
- Feldreihenfolge wird **nie** aus dem Kontext erraten. Die Position eines
  Feldes ergibt sich ausschließlich aus dem ICD-Abschnitt des jeweiligen Typs.
- Wenn das ICD an einer Stelle mehrdeutig oder unvollständig ist: **nachfragen**,
  nicht plausibel ergänzen.
- Wenn Code und ICD sich widersprechen, hat das ICD recht — auch wenn der
  Code funktioniert.

Hintergrund: In einer früheren Implementierung wurden Felder (`YawRate`,
`ClimbRate`) erfunden, die es im ICD nicht gibt, und `SIDC` landete auf dem
falschen Index. Das ist der teuerste Fehlermodus in diesem Projekt, weil er
sich still fortpflanzt.

## Entscheidungen (Stand 2026-09-10, abgestimmt mit dem Auftraggeber)

Diese Punkte sind im ICD mehrdeutig oder nicht ausformuliert. Sie wurden
explizit entschieden und gelten bis auf Widerruf:

1. **Enum-Codes** (TEXT Type, EMISSION FreqAgility/PRFAgility/Function,
   GRAPHIC GraphicType, COMMAND CmdFlag/CmdType, STATUS CmdState) sind
   zweistellige Hex-Codes ohne `0x`, **mit führender Null** (`01`, nicht `1`).
   Einstellige Schreibweise ist ein `error`. TecStatus/OpsStatus sind laut
   ICD-Tabelle einstellige Ziffern (`0`–`4`) und bleiben so.
2. **Header Number**: exakt zwei Hex-Zeichen `00`–`7F` (`error`), Kleinschreibung
   ist `warn`.
3. **CONTACT/POINT Position**: entweder Latitude+Longitude **oder**
   relX+relY+relZ (alle drei, 3D-Vektor). Keine der Gruppen gefüllt oder eine
   Gruppe unvollständig ist `error`. Beide Gruppen gefüllt ist `warn`.
4. **OWNUNIT Sender**: optional, leer ist `warn`.
5. **SIDC**: fest 15 Zeichen (`error`). CONTACT beginnt mit `s`, POINT mit `g`.
6. **MMSI**: 9 Ziffern. **ICAO**: 24-Bit-Adresse, 6 Hex-Zeichen.
7. **COMMAND CmdType**: Pflicht, außer CmdFlag ist `03` (Cancel all).
8. **KEYEXCHANGE** wird weder validiert noch generiert. Der Typ ist in der
   Registry nicht eingetragen; der Validator meldet ihn als nicht unterstützt.
9. Fehlerhafte **Beispielnachrichten im ICD** (z. B. EMISSION mit `SA-8` im
   BASE64-Feld, Codes ohne führende Null) bleiben als Fixtures unverändert.
   Die erwarteten Befunde sind in `test/fixtures/icdSampleIssues.js`
   dokumentiert und werden vom Auftraggeber im ICD korrigiert.

Weitere Ableitungen, die nicht wörtlich im ICD stehen (bei Bedarf rückfragen):

- Bearing, Azimuth, Direction und HeadingAngle nutzen die Kurs-Regel
  `0 … 359.999°` aus §2. Elevation, Rotation, Start-/EndAngle sind nur Float.
- Parameter der GRAPHIC- und COMMAND-Varianten sind optional, außer die im ICD
  mit `(M)` markierten (Engagement-Ziel bei CmdType 54–56).
- Unbenannte Varianten-Parameter tragen Anzeigenamen: GRAPHIC-Listen heißen
  `Coordinates`, das Lat,Lon,Alt-Tripel des Rechtecks `Position`, bei COMMAND
  `<ON|OFF>` → `OnOff`, Engagement-Ziel → `TargetID`, NTP → `NTPServer`.
- Textfelder ohne eigene Längenangabe nutzen die 256 Bytes aus §2 (auch Sender).

## Infrastruktur

- Reines Browser-JavaScript als **ES-Module**, kein Build-Schritt. Die Seiten
  müssen per HTTP ausgeliefert werden (`npm run serve` startet einen lokalen
  Server auf Port 8080), `file://` funktioniert nicht.
- Tests laufen mit Node ≥ 20 über `npm test` (`node --test`), ohne
  Abhängigkeiten. Browser und Tests laden dieselben Schema-Dateien.
- UI-Sprache ist Englisch, weil `icdHint` wörtlich aus dem englischen ICD kommt.
- Das Stylesheet ist `src/ui/style.css`. Die Tool-Seiten verlinken auf
  `index.html` zurück; im Repo ist das ein Minimalbeispiel, auf dem Server das
  Exercise Portal.
- Repo: https://github.com/UNIITY-Team/SEDAP-Express-WebValidator (Branch `main`).

## Architektur

Validator und Generator teilen sich eine **Schema-Registry**. Es gibt keine
typspezifischen Parser- oder Formularfunktionen.

```
validator.html / generator.html   # Seiten, laden src/ui/*/main.js als Modul
src/
  schema/
    index.js             # Registry: Typ -> Felddefinitionen, resolveFields()
    types/               # eine Datei pro Nachrichtentyp, inkl. ICD-Samples
    header.js            # gemeinsamer Header (alle Typen) + Header-Regeln
    fieldTypes.js        # wiederverwendbare Prüfregeln (hex, lat, lon, ...)
  core/
    parse.js             # Nachricht -> Felder (schema-getrieben)
    validate.js          # Felder -> Befunde, wertet benannte Regeln aus
    build.js             # Felder -> Nachricht
  ui/
    common.js            # Theme, Nav, gemeinsamer Ergebnis-Renderer
    style.css
    validator/main.js
    generator/main.js
test/
  roundtrip.test.js      # parse -> build -> validate je ICD-Sample und Typ
  fixtures.test.js       # ICD-Samples unverändert, erwartete Befunde
  fieldTypes.test.js     # Negativfall je Prüfregel
  robustness.test.js     # kurze Nachrichten, CRLF, Buffer, unbekannte Typen
```

### Felddefinition

Jedes Feld beschreibt sich selbst vollständig:

```
{
  name:      "Latitude",
  mandatory: "conditional",     // true | false | "conditional"
  condition: "position",        // Name der Regel, s.u.
  check:     "lat",             // Schlüssel aus fieldTypes
  icdRef:    "4.3.2",           // Abschnitt im ICD
  icdHint:   "..."              // 1-2 Sätze, wörtlich aus dem ICD
}
```

`icdHint` wird **aus dem ICD übernommen, nicht selbst formuliert**. Der
Nutzer soll im Fehlerfall den Originaltext sehen, nicht eine Umschreibung,
die vom Dokument abweicht.

### Konditionale Pflichtfelder

Manche Typen haben Feldgruppen, von denen mindestens eine gefüllt sein muss.
Bekanntes Beispiel: Bei `CONTACT` und `POINT` muss entweder Latitude/Longitude
**oder** relX/relY/relZ gesetzt sein — nicht beides (s. Entscheidung 3).

Solche Regeln werden als benannte Gruppen im Schema abgelegt und zentral
ausgewertet. Sie werden **nicht** als Sonderfall in den Parser gehängt.
Beim Durcharbeiten des ICD ist gezielt darauf zu achten, ob weitere Typen
vergleichbare Regeln haben.

Regelarten in `rules` eines Typs (Auswertung in `core/validate.js`):

| kind | Bedeutung |
|---|---|
| `oneOf` | genau eine der `groups` muss vollständig gefüllt sein (`name` = `condition` der Felder) |
| `mandatoryUnless` | Feld ist Pflicht, außer ein anderes Feld hat einen der `values` |
| `recommended` | leeres Feld ist `warn` |
| `forbidden` | Feld darf keinen der `values` haben |
| `requires` | wenn Feld einen der `whenValues` hat, muss `requires` gesetzt sein |
| `checkIf` | zusätzliche Prüfregel `check`, wenn `when.field` einen der `when.values` hat |

### Varianten (GRAPHIC, COMMAND)

Typen mit typabhängigen Parametern tragen `variants: { discriminator, options }`.
`options[code].fields` ist die Feldliste, die hinter den festen Feldern folgt.
Parser, Builder und Generator lösen die Variante über den Wert des
Diskriminators auf; ein unbekannter Code lässt die restlichen Felder als
"nicht zuordenbar" stehen.

## Projektstand (2026-09-10)

Die Umstellung auf die Schema-Registry ist **abgeschlossen und im Browser
geprüft**. Alle 14 Nachrichtentypen aus ICD §6.1–§6.14 sind implementiert,
KEYEXCHANGE bewusst nicht. `npm test` läuft mit 165 Tests grün.

Was in dieser Session passiert ist:

- Alte `validator.html`/`generator.html` (Inline-Skripte, nur OWNUNIT und
  CONTACT, erfundene Regeln wie Sender ≤ 32, ICAO 4 Zeichen, Kurs bis 360)
  vollständig ersetzt.
- Die `index.html` **im Repo ist ein Minimalbeispiel** (Einstiegsseite mit
  zwei Tool-Karten, nutzt `src/ui/style.css`). Das echte Exercise Portal
  (REPMUS 2026, mit eigenem `style.css`, Bildern, FAQ, Impressum) liegt nur
  auf dem Webserver und im lokalen Arbeitsordner, nicht im Repo. Beim Deploy
  die Portal-`index.html` **nicht** mit der Minimalversion überschreiben.
- Der Nav-Link `index.html#cc-review` wurde aus beiden Tool-Seiten entfernt,
  weil der Anker im Portal nicht existiert.

### Deployment

Kein Build. Auf den Webserver kopieren, Verzeichnisstruktur beibehalten:

```
rsync -av validator.html generator.html src user@server:/pfad/zum/webroot/
```

Nicht nötig auf dem Server: `test/`, `package.json`, `CLAUDE.md`, ICD-Markdown.
Der Server muss `.js` als `text/javascript` ausliefern (Standard). Bei
Cache-Problemen an die `<script type="module">`-Tags `?v=N` anhängen wie beim
Stylesheet.

### Lokal arbeiten

```
npm test          # alle Tests
npm run serve     # http://localhost:8080/validator.html bzw. generator.html
```

### Offene Punkte / mögliche nächste Schritte

- **CmdFlag 02 (Cancel last)** verlangt aktuell noch einen CmdType; nur `03`
  ist ausgenommen (Entscheidung 7 wörtlich). Falls 02 ebenfalls ohne CmdType
  gültig sein soll: in `src/schema/types/COMMAND.js` bei der Regel
  `mandatoryUnless` die `values` auf `['02', '03']` erweitern.
- **STATUS CmdState 05** ("Will be executed at ;<timestamp>") deutet auf ein
  zusätzliches Timestamp-Feld hin, das im Feldschema von §6.9 nicht
  vorkommt. Nicht umgesetzt, beim Auftraggeber klären.
- **ICD-Korrekturen** stehen aus (Entscheidung 9). Sobald das ICD-Markdown
  aktualisiert wird: Samples in den Typdateien nachziehen und Einträge in
  `test/fixtures/icdSampleIssues.js` entfernen, die dann nicht mehr zutreffen.
- Die Ableitungen unter "Weitere Ableitungen" (Winkelregel für Bearing/Azimuth,
  optionale Varianten-Parameter, Anzeigenamen) sind noch nicht explizit
  bestätigt.
- Validator-Deep-Link: `validator.html?msg=<urlencoded>` wird vom Generator
  über "open in Validator" genutzt.

## Fehlerausgabe

Ziel ist, dass der Nutzer seinen Fehler selbst versteht, ohne das ICD
aufzuschlagen. Jeder Befund enthält:

1. Feldname und Position
2. Was erwartet wurde (kurz, konkret)
3. `icdHint` — der Originaltext aus dem ICD
4. `icdRef` — Abschnitt zum Nachschlagen

Status pro Feld: `ok` | `error` | `warn` | `empty`.
`empty` bei optionalen Feldern ist kein Fehler und wird visuell klar von
`error` unterschieden.

## Robustheit beim Parsen

- Nachrichten dürfen **kürzer** sein als das Schema (fehlende optionale
  Felder am Ende). Ein Zugriff auf einen nicht vorhandenen Index muss zu `""`
  normalisiert werden, **bevor** eine Prüfregel darauf läuft — sonst laufen
  Regex-Checks gegen `undefined` und melden falsche Fehler.
- Eingaben können mit `\r\n` enden, Whitespace enthalten oder als Buffer
  ankommen. Vor dem Split normalisieren.
- Ein unbekannter Nachrichtentyp ist ein sauberer, verständlicher Fehler —
  kein Crash und kein stiller Fallback auf einen anderen Typ.

## Einen neuen Nachrichtentyp hinzufügen

1. Den zugehörigen ICD-Abschnitt lesen und die Felder in exakter Reihenfolge
   nach `src/schema/types/<TYP>.<ext>` übertragen, inkl. `icdRef` und `icdHint`.
2. Prüfregeln, die es noch nicht gibt, in `fieldTypes` ergänzen — nicht inline
   im Typ.
3. Typ in der Registry eintragen.
4. Roundtrip-Test läuft automatisch mit, weil er über die Registry iteriert.
   Jede Datei braucht mindestens ein `samples`-Element (ICD-Beispiel, wörtlich).
   Kein Anfassen von Parser, Validator, Generator oder UI nötig. **Wenn doch, ist das ein Signal, dass das Schema
   nicht ausdrucksstark genug ist — dann melden, nicht umgehen.**

## Tests

- **Roundtrip:** Für jeden Typ eine Nachricht generieren, durch den Validator
  schicken, muss `ok` sein. Fängt Drift zwischen Generator und Validator.
- **Negativfälle:** Pro Prüfregel mindestens ein bewusst kaputter Wert.
- **Kurze Nachrichten:** Abgeschnittene optionale Felder am Ende.
- **Beispielnachrichten aus dem ICD** als Fixtures, unverändert.

## Arbeitsweise

- Schrittweise vorgehen. Nach jedem Typ bzw. jeder abgeschlossenen Einheit
  kurz zusammenfassen, was geändert wurde, und auf Rückmeldung warten.
- Keine großflächigen Refactorings ohne Rücksprache.
- Bestehende Prüflogik und CSS-Anpassungen nicht "nebenbei" mit aufräumen.

<!-- TODO: ergänzen -->
<!-- Stack / Build / Dev-Server -->
<!-- Deployment-Ziel und Pfade -->
<!-- Liste der zu unterstützenden Nachrichtentypen aus dem ICD -->