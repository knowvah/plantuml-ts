# Batch 5 — Close the mission

One task. Documentation and accounting; no source changes.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Close SI8; record the deferred per-resource mission with its measurements | typescript-pro | `planning/mission-index.md`, `plans/si8-stdlib-registration/README.md`, `oracle/goldens/svg-description/README.md` | T4, T6 | [ ] |

## Batch exit criteria

- All quality gates green
- `planning/mission-index.md` § SI8 reads `done`, states what shipped and what
  did not
- The deferred per-resource work is a **tracked row with its measured sizes**,
  not a sentence of prose
- If T6 changed the fixtures, the goldens README no longer says their sprite
  declarations are inlined

## What must not get lost

[ADR-2](../decisions.md#adr-2) deferred per-resource loading on measurement, not
on difficulty. The numbers are the justification and must survive into the
tracker: `awslib14.js` **7.93 MB**, `tupadr3.js` **19.54 MB**, 6,849 tupadr3
`.puml` files, 29,101 across the full assets tree. A deferral recorded without
its measurement reads as an excuse a year later.
