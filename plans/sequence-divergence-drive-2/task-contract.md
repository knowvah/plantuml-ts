# Task contract (every sdd2 task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. **The sequence jar is
always teoz** (`SequenceDiagram.java:311-312`, `GlobalConfig.java:47`
`FORCE_TEOZ = true`): cite `sequencediagram/teoz/` and `skin/rose/`, never
`sequencediagram/graphic/` (dead upstream). Read the method body that
draws or sizes your element and the constructor that built its inputs;
quote `file:line` for every value. Never fit a number (stop 12). Mirror
the jar's output exactly — every element it draws and nothing it doesn't.

sdd1 landed the style seam: every component reads its `Style` through
`src/diagrams/sequence/sequence-skin-param.ts`; geo nodes carry `paint`;
paint is scaled at emission by `theme.scaleK`. Do not reintroduce theme
reads.

Your task's mechanism is already explained in `research/` (the section is
named in your spec). Treat it as a lead, not a fact: re-read the Java it
cites before you write code. If the Java disagrees with the research,
the Java wins — say so in your hand-back.

## Measuring
- One fixture: `npx tsx plans/sequence-divergence-drive-2/tools/diff-one.mts
  <slug> [filter]` (ratchet path).
- All rows: `npx tsx plans/sequence-divergence-drive-2/tools/classify.mts
  <worktree>/cls.json`; compare per-row `ws` with `measurements/b<prev>-
  classify.json`. Report every fixture that fell to zero and every riser
  with its mechanism.
- Oracle renders only via `scripts/oracle-render.sh <out-dir> <puml>`.
- Prototype reference (vertical tasks): `prototypes/m_<mech>.patch` shows
  where a working change touched; `prototypes/loo_<MECH>.json` lists the
  fixtures that need your mechanism to reach zero. Never apply a patch
  (D2).

## Boundaries
- Write only your write-set. A needed file outside it is stop 1: report,
  do not edit. Exception: a 500-line split of a file in your write-set
  (journal the new file in your hand-back).
- No edit under `src/core/style/**` or `src/core/klimt/**` unless your spec
  grants an additive change; never dot-engine or the plantuml fork.
- No Serena edit tools (they write the MAIN checkout); no `git stash`.
- No baseline or golden writes — the orchestrator re-pins and pins at close.
- Tests first: one unit test per mechanism whose expected values cite the
  Java (`file:line`) or a golden `in.svg` value; plus the fixture rows your
  spec names going to zero in classify.
- Quality bar: targeted vitest (`tests/unit/sequence/**` for your files +
  `tests/oracle/svg-conformance/sequence.*`), `npm run typecheck`, eslint
  on your files; coverage 90/90/90 on what you touch.
- Observability: N/A — no new observable operations. Rollback: Reversible
  (revert the task commit).

## Commit
One commit, Conventional Commits, ≤72-char subject, body explains why and
lists the Java read; no attribution lines. Commit unsigned in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (with line counts) · Java read (`file:line`
each) · classify movement (to-zero list; fell; rose with mechanism) ·
research claims confirmed / contradicted · open questions.
