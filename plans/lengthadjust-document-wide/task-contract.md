# Task contract (every lad task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec (grep `src/main/java/net/`,
never just `net/sourceforge/plantuml/` — it misses `net/atmp/`). Read the
method body that applies `lengthAdjust` and the constructor that built its
inputs; quote `file:line` for every value. Never fit a number (stop 11).
Mirror the jar exactly — every attribute it writes and nothing it doesn't.

The mechanism, once, for every task (cite these lines in your commit body):
- `TextBlockExporter.java:306-307`: `option.withLengthAdjust(skinParam.
  getlengthAdjust())` for every titled diagram with a SkinParam.
- `SkinParam.java:1258-1269`: `spacingAndGlyphs` / `spacing` / `none`
  (`equalsIgnoreCase`), else `LengthAdjust.defaultValue()` = SPACING.
- `SvgGraphics.java:155-158`: root `<g>` gets `lengthAdjust="spacing"` for
  SPACING, `spacingAndGlyphs` for that value, nothing for NONE.
- `SvgGraphics.java:699-705`: `textLength` per `<text>` only when
  `text.length() > 1` and the option is SPACING or SPACING_AND_GLYPHS.

In the port, all of that already exists; your task is wiring at one seam:
- `theme.lengthAdjust?: RootLengthAdjust` (`src/core/theme.ts:194`), fed by
  `skinparam-key-handlers-table-c.ts:14-18,48-58` (lookup over the three
  names; anything else is `undefined` = spacing).
- `RenderFragment.lengthAdjust` (`src/core/dispatcher-types.ts:210-211`),
  consumed by the document shell: `withRootGroupAttributes`
  (`src/core/klimt/document-shell.ts:139-142`) writes the root `<g>` via
  `rootGroupOpen` (`src/core/svg.ts:305-308`), `withLengthAdjustApplied`
  (`:159-162`) strips `textLength` under `none`; both at `:304-305`.
- klimt `SvgOption.lengthAdjust` (`src/core/klimt/drawing/svg/svg-option.ts:
  33,56`, default SPACING), honoured by `svg-graphics-core.ts:126-131` and
  `svg-graphics-elements.ts:242-252`.
- The sequence precedent: `src/diagrams/sequence/renderer.ts:206-208` spreads
  `{ lengthAdjust: theme.lengthAdjust }` only when defined (D4).

## Measuring
- Authored rows: `npx vitest run tests/oracle/svg-conformance/lengthadjust.
  authored.ratchet.test.ts` in your worktree (after T0c). Report which of
  your engine's four rows became `rootExact` / `textLengthMatch`.
- Your engine's pins: its golden ratchet (`tests/oracle/svg-conformance/
  <engine>.golden.ratchet.test.ts` where one exists) and
  `npm run svg:survey -- <engine> --out <wt>/p.json` diffed against
  `plans/lengthadjust-document-wide/measurements/b0-eng/parity-<engine>.json`
  with `node plans/lengthadjust-document-wide/tools/verdict-diff.mjs`.
- A core task (any write under `src/core/`) also surveys every engine its
  change can reach.
- Oracle renders only via `scripts/oracle-render.sh <out-dir> <puml>`.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1: report, do
  not edit. Exceptions: a 500-line split of a file in your write-set (journal
  the new file in your hand-back); the harness mirror T0d named for your
  engine (D6).
- Never dot-engine or the plantuml fork; never the oracle jar or cached
  oracle bytes; never `oracle/accepted-divergences.json`; never a golden,
  pin or baseline file (the orchestrator rebuilds them at close).
- No Serena edit tools (they write the MAIN checkout); no `git stash`.
- No new runtime dependency; `src/` never imports a Node built-in,
  `process.env`, DOM or network APIs.
- Never write `lengthAdjust: 'spacing'` explicitly (D4); unset output must stay
  byte-identical — prove it with a test that renders without the skinparam and
  compares to the pre-change string.
- Tests first: one unit test per mechanism whose expected values cite the
  Java (`file:line`) or the authored oracle.
- Quality bar: targeted vitest (your files' tests + the authored gate + your
  engine's golden ratchet), `npm run typecheck`, eslint on your files;
  coverage 90/90/90 on what you touch.
- Observability: N/A — no new observable operations. Rollback: Reversible
  (revert the task commit).

## Commit
One commit, Conventional Commits, ≤72-char subject, body explains why and
lists the Java read; no attribution lines. Commit unsigned in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (with line counts) · Java read (`file:line` each)
· authored rows moved (slug → rootExact / textLengthMatch) · engine survey vs
b0 (movers with mechanism) · pins green (ratchet names) · open questions.
