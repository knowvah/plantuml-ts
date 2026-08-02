# Batch 3 — Give the path a regression guard it has never had

One task. Depends on T2 — the measurement is only meaningful once the routing
has changed.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Author class usecase/actor fixtures, capture jar oracles, MEASURE the delta | typescript-pro | `oracle/goldens/svg-class/<new-slugs>/**`, `tests/oracle/svg-conformance/class-usecase-actor.test.ts` | T2 | [ ] |

## Why this batch exists

**Zero of 310 class goldens contain `usecase`, `actor` or `allowmixing`.**
The path T1 and T2 just changed has no regression guard whatsoever. That is
the precise hole through which `svg-sprite-nanoparser` shipped sprites
rendering as NOTHING while `npm test`, every golden and the size-delta script
stayed green. `CLAUDE.md` is explicit that an uncovered feature means author
fixtures, not verify synthetically.

## What this task may and may not claim — read ADR-4

Class conformance is low (the census went `0/718 → 29/718`), so a new usecase
fixture arriving **zero-diff is optimistic, not assumable**. And authored
class fixtures **cannot be ratcheted**: `dot-sync-fixtures.ts`'s `GOLDEN_DIR`
is hardcoded to `oracle/goldens/svg-description` and expects a
`<type>/<slug>/` shape, so no `parity-class.json` entry can exist for them —
the eligibility rule in `oracle/goldens/svg-class/README.md` cannot be met.

So: **measure and state**. Do not force a conformance claim, and never
present our own output as a jar oracle.

## Batch exit criteria

- Fixtures authored and jar oracles captured with the pinned
  `oracle/dist/plantuml-oracle.jar`
- The measured delta per fixture RECORDED in the decision journal
- A guard test that fails if our output changes
- All quality gates green; `widened` still 0; 395 existing goldens
  byte-identical
