# SEDAP-Express-WebValidator

Webtool for generating and validating SEDAP Express messages (ICD v1.4.8).

Two browser pages share one schema registry, so the generator and the validator
can never drift apart:

- `generator.html` – build any message type field by field, in ICD order, with
  live checks and validation of the result.
- `validator.html` – paste one or more messages; every finding names the field,
  the position, what was expected, and quotes the ICD section it is based on.
- `index.html` – minimal entry page linking both tools.

All 14 message types of ICD §6.1–§6.14 are covered. KEYEXCHANGE is intentionally
not supported.

## Run locally

Plain ES modules, no build step. The pages must be served over HTTP:

```
npm run serve      # http://localhost:8080/
npm test           # node --test, no dependencies (Node >= 20)
```

## Deploy

Copy `index.html`, `validator.html`, `generator.html` and the `src/` folder to
the web server, keeping the directory structure. `test/`, `package.json` and the
Markdown files are not needed on the server.

## Project layout

```
src/schema/        field definitions per message type, header, check rules
src/core/          parse / validate / build (schema-driven)
src/ui/            pages' scripts and stylesheet
test/              roundtrip, ICD fixtures, negative cases, robustness
```

Design rules, decisions on ICD ambiguities and the current project status are
documented in `CLAUDE.md`. The ICD used as the single source of truth is
`SEDAP-Express-ICD-for-AI-v1.4.8.md`.

## License

BSD 2-Clause, see `LICENSE`.
