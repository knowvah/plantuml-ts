# Task contract (every sdd3 task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec (grep `src/main/java/net/`,
never just `net/sourceforge/plantuml/` — it misses `net/atmp/`). **The
sequence jar is always teoz** (`SequenceDiagram.java:311-312`,
`GlobalConfig.java:47` `FORCE_TEOZ = true`): cite `sequencediagram/teoz/` and
`skin/rose/`, never `sequencediagram/graphic/` (dead upstream). Read the
method body that draws or sizes your element and the constructor that built
its inputs; quote `file:line` for every value. Never fit a number (stop 11).
Mirror the jar exactly — every element it draws and nothing it doesn't.

Every sequence component reads its `Style` through
`src/diagrams/sequence/sequence-skin-param.ts`; geo nodes carry `paint`;
paint is scaled at emission by `theme.scaleK`. Do not reintroduce theme reads.

Your spec names the mechanism sdd2 filed for each target row
(`../sequence-divergence-drive-2/fixtures.md`, column `final`). Treat it as
a lead: re-read the Java it cites before you write code. If the Java
disagrees, the Java wins — say so in your hand-back.

## Measuring
- One fixture: `npx tsx plans/sequence-divergence-drive-3/tools/diff-one.mts
  <slug> [filter]` (ratchet path, `sequenceFixtureOptions()`).
- All rows: `npx tsx plans/sequence-divergence-drive-3/tools/classify.mts
  <worktree>/cls.json`; compare per-row `ws` with `measurements/b<prev>-
  classify.json`. Report every fixture that fell to zero and every riser
  with its mechanism.
- A core task (any write under `src/core/` or `src/index.ts`) also reports
  the all-engine effect: `npm run svg:survey -- <engine> --out <wt>/p.json`
  for the engines its change can reach, diffed with `$T/verdict-diff.mjs`.
- Oracle renders only via `scripts/oracle-render.sh <out-dir> <puml>`.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1: report,
  do not edit. Exception: a 500-line split of a file in your write-set
  (journal the new file in your hand-back).
- Never dot-engine or the plantuml fork; never the oracle jar or cached
  oracle bytes; never `oracle/accepted-divergences.json`.
- No Serena edit tools (they write the MAIN checkout); no `git stash`.
- No baseline or golden writes — the orchestrator re-pins and pins at close.
- No new runtime dependency (only T4a adds `@xmldom/xmldom`); `src/` never
  imports a Node built-in, `process.env`, DOM or network APIs, except
  `src/image-providers/` (D3).
- Tests first: one unit test per mechanism whose expected values cite the
  Java (`file:line`) or a golden `in.svg` value; plus the fixture rows your
  spec names going to zero in classify.
- Quality bar: targeted vitest (your files' tests +
  `tests/oracle/svg-conformance/sequence.*`), `npm run typecheck`, eslint on
  your files; coverage 90/90/90 on what you touch.
- Observability: N/A — no new observable operations (except where the spec
  says otherwise). Rollback: Reversible (revert the task commit).

## Commit
One commit, Conventional Commits, ≤72-char subject, body explains why and
lists the Java read; no attribution lines. Commit unsigned in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (with line counts) · Java read (`file:line` each)
· classify movement (to-zero list; fell; rose with mechanism) · non-sequence
movers (core tasks) · filed mechanism confirmed / contradicted · open questions.
