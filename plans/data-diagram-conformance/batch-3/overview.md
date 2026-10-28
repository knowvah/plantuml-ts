# Batch 3 — extensions (OPTIONAL; D8)

Runs only if batches 1–2 closed with session budget left (push-forward:
journal a skip; the exit bar does not depend on this batch). Two parallel
worktrees; disjoint write-sets. Both edit `tests/fixtures/extensions/` but
different file prefixes (`json-/yaml-/hcl-` vs `files-`). `DIVERGENCES.md`
is orchestrator-owned at the close. Stop 17 governs: jar-compatible mode
must stay byte-identical (the full conformance set proves it at the close).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-json-family-defaultfontcolor.md) | `skinparam defaultFontColor` honoured by json/yaml/hcl in extended mode | typescript-pro (sonnet), ddc-T3a | `src/diagrams/json/renderer-style.ts`, `tests/unit/json/renderer-style-extension.test.ts`, `tests/fixtures/extensions/{json,yaml,hcl}-defaultfontcolor.puml` | — | [ ] |
| [T3b](T3b-files-extensions.md) | files honours `defaultFontName/Size/Color`, `shadowing`, `lineColor`, `handwritten` in extended mode | typescript-pro (sonnet), ddc-T3b | `src/diagrams/files/*` (style resolution only), `tests/unit/files/extensions.test.ts`, `tests/fixtures/extensions/files-*.puml` (new rows) | T2c | [ ] |
| close | merges; gates `b3`; chain vs b2 (0 movers expected anywhere); `DIVERGENCES.md` Extensions rows; `fixtures.md` b3 row | orchestrator | per close-procedure + `DIVERGENCES.md` | T3a, T3b | [ ] |
