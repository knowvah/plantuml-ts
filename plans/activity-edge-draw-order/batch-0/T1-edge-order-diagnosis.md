# T1 — diagnose edge draw order (no `src/` edits)

**Agent:** `debugger` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java is the spec — read the method
body and quote `file:line` for every claim. Read
[`../README.md`](../README.md), [`../decisions.md`](../decisions.md) D1–D7
(locked) and [`../fixtures.md`](../fixtures.md). Follow
`~/.claude/rules/diagnosis.md`: instrument before hypothesising; every answer
states **Mechanism**, **Origin** (`file:line`), **Causal chain** and a
non-empty **Ruled out**.

Our edges are emitted in walk order (`layout/tile-coordinates.ts:66-75`
`pushEdge`), carried as two index-aligned arrays (`Out.edges` /
`Out.edgeMeta`), mapped through `placeSwimlanes`
(`layout/swimlane-placement.ts:443-469`), compressed, and drawn last by
`renderer.ts:234-247`. The jar buffers connections as Snakes and flushes them
at the end (`svek/UGraphicForSnake.java:137-165`), so its edge run is ordered
by lane pass (`ftile/Swimlanes.java:318-355`) and, inside a parallel, by
`doStep1`/`doStep2` (`ftile/vcompact/AbstractParallelFtilesBuilder.java
:166-169`).

## Method

Throwaway edits ONLY in a scratch worktree
(`git worktree add ../aedo-t1-scratch HEAD`), with `node_modules` AND
`assets/stdlib` symlinked from the main checkout (vitest's global setup fails
without the latter). Confirm the probe reports aggregate **52673** there
before any edit. Remove the worktree at the end. Never commit `src/`.

Measure with `npx tsx scripts/activity-probe.ts` (`--json`, `--dump`,
`--lanes`). Render jar oracles only through `scripts/oracle-render.sh`.

## Questions

**Q1 — where does a lane-less edge go? (D2, stop 4.)** Find a laned baseline
fixture with an edge whose `EdgeMeta.lane1` or `lane2` is `undefined` (add a
temporary dump in the scratch worktree). `UGraphicInterceptorOneSwimlane
.java:92-103` admits it to EVERY pass; `Swimlanes.Cross` (`:178-216`) admits
only ends that differ. Dump the jar's SVG for that fixture and state where
its element actually lands, and whether it appears once or more than once.
Answer as a rule a function can implement.

**Q2 — re-measure both rules with the D1 permutation.** In the scratch
worktree, permute `edges` AND `edgeMeta` together (D1's shape: last step of
`assignCoordinatesFull`). Measure three states with
`--json`: (b) alone → `measurements/scratch-b.json`; (a) alone →
`scratch-a.json`; (a)+(b) → `scratch-ab.json`. The union of movers becomes
the rewritten `fixtures.md`, one row per slug with its pin and each rule's
delta. Report how the numbers differ from the misaligned planning run
(52616 / 52074 / 52066).

**Q3 — snake merging (D5).** `UGraphicForSnake#addPendingSnake` merges a new
Snake into an earlier one (`:147-157`, `PendingSnake.merge`). On at least
three `fixtures.md` slugs, compare our edge count with the jar's and state
whether merging explains any residual count or order gap. Do not port it.

**Q4 — other compounds (D7).** Does `if`/`while`/`repeat` also draw its
internals before its connectors in the jar, and do we match? One paragraph
per kind, with a cite; no fix.

**Q5 — riser mechanisms.** For every riser in Q2's three runs — at minimum
`misiji-27-buje656`, which rises +32 under (a) alone and falls −32 under (b)
— state the mechanism from `--dump` ours vs jar. Name which rule owns it and
whether landing both rules removes it.

## Read-set

- `src/diagrams/activity/layout/tile-coordinates.ts:48-75` (`Out`, `pushEdge`)
- `src/diagrams/activity/layout/swimlane-placement.ts:63-70,443-469`
- `src/diagrams/activity/layout/assign-coordinates-full.ts:150-213`
- `src/diagrams/activity/layout/walk-fork-branches.ts:81-129`
- `src/diagrams/activity/renderer.ts:214-248`
- `src/diagrams/activity/layout/compress/shapes-of.ts:370-382`
- Java: `ftile/Swimlanes.java:116-124,178-216,318-355`;
  `ftile/vcompact/UGraphicInterceptorOneSwimlane.java:92-103`;
  `svek/UGraphicForSnake.java:137-165`;
  `ftile/vcompact/ParallelBuilderSplit.java:77-179`;
  `ftile/FtileWithConnection.java:69-74`

## Write-set

`.agent-notes/aedo-T1.md`; `plans/activity-edge-draw-order/fixtures.md`
(rewrite); `plans/activity-edge-draw-order/measurements/base.json`,
`scratch-a.json`, `scratch-b.json`, `scratch-ab.json`;
`plans/activity-edge-draw-order/decision-journal.md` (rows).

## Interface contract (consumed by T2 and T3)

The note has sections `## Q1` … `## Q5`, and Q1 ends with the pass-membership
rule written as a function contract:

```ts
// returns the lane whose pass draws this edge, or null for the cross pass
function passOf(meta: EdgeMeta, laneNames: readonly string[]): string | null;
```

`fixtures.md` keeps its current column shape (`slug | pin | a | b`).

## Acceptance criteria

- Given the note, when Q1, Q3 and Q5 are read, then each states Mechanism,
  Origin (`file:line`), Causal chain and a non-empty Ruled out
- Given Q1, then the pass-membership rule is stated as the contract above and
  is backed by a jar dump, not by reading the interceptor alone
- Given `measurements/base.json`, then `aggregate` is 52673 and every `delta`
  is 0
- Given the rewritten `fixtures.md`, then every row's pin matches
  `diff-baseline.json` and the file lists only baseline fixtures
- Given a finding that contradicts D1–D7, then `decisions.md` is amended and
  the executor halts (stop 3)
- Given the scratch worktree, then it is removed and `git status` shows no
  `src/` change

## Observability / Rollback

N/A — no new observable operations / **Reversible** (documents only).

## Quality bar

`npm run typecheck` and `npm run lint` green; `git diff --name-only HEAD~1`
lists only the write-set. Stage explicit paths; never `git add -A`.

## Commit

`docs(aedo-T1): diagnose the activity edge draw order`
