# T3c — retire the sequence theme path

Agent: `typescript-pro`, worktree `sdd1-T3c`. Commit:
`refactor(sequence): delete the theme fields the style path replaced`.

## Context
plantuml-ts ports PlantUML faithfully. sdd1 moved every sequence component's
style onto the per-event `StyleBuilder` (D1). D5: a superseded path is
deleted, not kept — two paths for one property mean a skinparam applied twice
or inconsistently. Batches 2–3 deleted their own reads; family hand-backs and
`decision-journal.md` list the fields they left without a reader. One whole
module is superseded: `src/core/sequence-shadowing.ts` (+ its test), wired
through `src/core/build-theme.ts:22,84-86` into
`theme.colors.graph.sequenceShadowing` (`theme-graph-colors-c.ts`).

## Task
1. Grep every `theme.colors.*` / `theme.sequence.*` read left under
   `src/diagrams/sequence/`. For each: style-owned (a `plantuml.skin` /
   `Style` property upstream) ⇒ migrate it here (the remaining sites are
   `sequence-layout-shared.ts`, `text-block-geo.ts`, `layout.ts`, `scale-geo`
   is T1c's and must already be clean) or report it as stop 1 if it sits in
   a family file; not style-owned (e.g. `scaleK`, chrome) ⇒ keep, list it.
2. Delete each `Theme` field with no reader left in any engine (grep all of
   `src/` and `tests/`). Before deleting, check whether an exported type
   reaches it (`src/index.ts` exports, `docs/catalog.md`) — if yes, stop 11.
   `Theme` itself is not re-exported from `src/index.ts` at planning; verify.
3. Delete `src/core/sequence-shadowing.ts`, its `build-theme.ts` hook, the
   `sequenceShadowing` field, and `tests/unit/core/sequence-shadowing.test.ts`
   once T3b's grep shows no reader; port any case that test covers and no
   sdd1 test does into `tests/unit/sequence/`.
4. Every skinparam that used to set a deleted field must still take effect
   through `FromSkinparamToStyle` — one test per deleted field proving it.

## Write-set
`src/core/{theme-sequence-fields,sequence-shadowing,build-theme,
theme-graph-colors-c}.ts`, any `src/core/theme*.ts` / `skinparam*.ts` /
`style-map-*.ts` a field deletion reaches (journal each), `src/diagrams/
sequence/{sequence-layout-shared,text-block-geo,layout}.ts`, the matching
tests, `tests/unit/core/sequence-shadowing.test.ts` (delete).

## Read-set
`decisions.md#d5`; `decision-journal.md` (batch 2–3 hand-back rows);
`src/core/theme.ts:1-80`; `src/core/theme-sequence-fields.ts` (whole);
`src/core/build-theme.ts:1-120`; `src/core/sequence-shadowing.ts` (whole).

## Acceptance
- Given `grep -rn "theme\.\(colors\|sequence\)\." src/diagrams/sequence`,
  then every remaining match is a non-style property listed in the commit
  body.
- Given `grep -rn "sequenceShadowing\|sequence-shadowing" src tests`, then
  nothing matches.
- Given every deleted field's skinparam, then a test shows it still lands
  through the Style path.
- Given the all-engine survey at the b3 close, then 0 conformant losses in
  any engine (stop 4).

Quality bar: full `tests/unit/core/**` + `tests/unit/sequence/**` +
`tests/oracle/svg-conformance/*.ratchet.test.ts` + typecheck + eslint (a
`Theme` change reaches every engine). Boundaries: no edit under
`src/core/style/**` or `src/core/klimt/**`; no family file (stop 1); no
Serena edit tools. Observability: N/A — no new observable operations.
Rollback: Reversible.
