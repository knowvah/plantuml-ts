# T1p-b — FtileIfLongVertical (`!pragma useVerticalIf`)

Final state after orchestrator decision-journal row 16 (structural-cast
rejected; real `Pragma` threading required). Supersedes the earlier,
now-stale version of this note (which still described the `theme`
structural-cast workaround — that workaround is removed).

## Commits (branch `add2/T1p-b`, worktree `.claude/worktrees/add2-T1p-b`)
- `62fb7ed0a` — `feat(activity): port FtileIfLongVertical (!pragma useVerticalIf)`
- `5b65f488a` — `docs(agent-notes): T1p-b findings and blocker report` (superseded by this file)
- `523e4f288` — `feat(activity): port CommandPragma, thread real Pragma to if-dispatch`
- `79d4919ee` — `test(activity): author T1p-b useVerticalIf fixtures with jar oracles`

Not merged, not pushed.

## What changed in round 2 (the real Pragma mechanism)

**`CommandPragma` ported**: `net/sourceforge/plantuml/command/CommandPragma.java`
(regex `getRegexConcat()`: `!pragma NAME [VALUE]`, `executeArg`'s
`name.toLowerCase()` + `system.getPragma().define(name, value)`, the
`svgsize` special case that never reaches `Pragma#define`) →
`src/diagrams/activity/dispatch-common-commands.ts#tryPragma`. `RE_PRAGMA`
lives in `dispatch-support.ts` alongside the other shared regex constants.

**Storage**: a `Pragma` field on `ParseContext` (`dispatch-support.ts`,
mutated in place by `tryPragma` during `parseNodes`, mirrors
`TitledDiagram#getPragma()`'s single per-diagram instance) and on
`ActivityDiagramAST` (`ast.ts`, optional — set by `parser.ts` from
`Pragma.createEmpty()`, same convention as `annotations?`/`sprites?`).

**Threading**: `layoutActivity` reads `ast.pragma ?? Pragma.createEmpty()`
once and threads it through `tileNodes`/`tileNode`/`tileIf`/`tileWhile`/
`tileRepeat`/`tileRepeatEntry`/`tileFork`/`tileSplit`/`tileSwitch`/
`tileGroup` — the EXACT same pattern `laneOrder` (`ast.swimlanes`)
already uses (`tile-layout.ts`). `conditional-builder.ts#buildIf` reads
`pragma.isTrue(PragmaKey.USE_VERTICAL_IF)` directly in `ifBuilderOf`
(`FtileFactoryDelegatorIf.java:86`'s exact call site) — the
`readUseVerticalIf`/`ThemeWithVerticalIfPragma` structural-cast from
round 1 is fully removed.

**File-cap consequences** (mechanical splits, no behavior change):
- `node-dispatch.ts` was already at the exact 500-line cap.
  `tryAnnotation`/`trySprite`/`tryScale` moved out alongside the new
  `tryPragma` into `dispatch-common-commands.ts`.
- `tile-layout.ts` crossed the cap once `pragma` was threaded through
  every `tileX` builder. `tileFork`/`tileSplit`/`tileSwitch`/`tileGroup`
  moved to a new `tile-layout-structural.ts`.
- `conditional-builder.ts`'s `buildIfDown`/`buildIfWithLinks`/
  `buildIfLongHorizontal`/`buildIfLongVertical` were already at or near
  the 5-param cap; they now take a small `IfLayoutCtx { laneOrder,
  pragma }` bundle instead of two separate trailing params.

**Verified**: `tests/unit/activity/parser-pragma.test.ts` (10 tests) —
real `!pragma` lines parse (previously refused the whole document, since
`node-dispatch.ts` had NO pragma recognizer at all, unlike class/
sequence/state/description's own command tables), case-insensitive name
matching, a bare `!pragma teoz` (default value applied), an unrecognised
name (no-op, no refusal), `!pragma svgsize W H` (recognised, no observable
effect), and `!pragma layout smetana` (another real pragma — confirmed
NOT specially broken by this task's wiring).

## Probe Σ before/after round 2 — zero movement
`npx tsx scripts/activity-probe.ts` run against the current working tree
(tsx resolves `src/` live, not a committed snapshot): `aggregate=31230`,
`risers (0)`, `fallers (5)` — byte-identical to the round-1 measurement
(itself verified byte-identical against a pre-T1p-b `git worktree add
--detach HEAD~1` snapshot). Every existing corpus row is unaffected:
`pragma.isTrue(...)` on an empty `Pragma` is always `false`, so every
caller that never sets the pragma behaves exactly as before.

**Other `!pragma` names in the corpus**: grepped every activity fixture's
`in.puml` for `pragma` — exactly one hit, `dulate-94-bupu593`, and its
pragma line is commented out (`'!pragma useVerticalIf on`, a PlantUML
comment, per connection-census.md §0) — inert either way. No corpus
fixture exercises a REAL `!pragma layout smetana` (or any other pragma)
for activity; that case is covered by the dedicated unit test above
instead.

## Fixtures authored: `tests/fixtures/activity/T1p-b/`
Five `.puml` + jar-oracle `.svg` pairs (`scripts/oracle-render.sh`,
deterministic text), per the task brief: `vertical-if-2way` (if + 1
elseif + else), `vertical-if-3way` (if + 2 elseif + else),
`vertical-if-elseif-labels` (elseif branches with explicit `then
(LABEL)` positive labels), `vertical-if-nested` (an ordinary if/else
nested inside one branch), `vertical-if-swimlanes` (the whole chain
inside one `|Lane1|`). Not added to the gated corpus (memory:
`new-corpus-tree-trips-two-gates`).

## Residual — diagnosed, not fixed (out of this task's scope)

**Observed**: every one of the five fixtures diverges from its jar
oracle by the EXACT SAME delta: `childCount +2`, `viewBox height +20`,
regardless of branch count, nesting, or swimlanes (measured precisely,
not estimated — see the table below). This uniformity across five
structurally different fixtures rules out five independent defects; it
is one mechanism.

**Mechanism**: `connectionIn` (`walk-if-long-vertical.ts`) and the
generic `GtileTopDown` sibling edge (`tile-coordinates.ts
#pushTopDownSiblingEdge`, the plain arrow PlantUML draws between any two
sequential top-level steps) are two SEPARATE `Snake`s in this port. Their
shared point — the if-tile's own composite `NORTH_HOOK` — is EXACTLY
equal between the two (both reference the same absolute coordinate).
Upstream's `PendingSnake.merge`/`Snake.merge`
(`svek/UGraphicForSnake.java:111-122`, `activitydiagram3/ftile/
Snake.java:303-327`, `same()` within `0.001`, decisions.md D1) fuses any
two Snakes meeting that condition into ONE combined Snake, dropping the
EARLIER Snake's own end decoration (`removeEndDecorationIfTouches`) —
upstream therefore draws ONE arrowhead/line run for this pair, with a
single, corner-collapsed point list. This port has no
`layout/snake-merge.ts` anywhere (grepped, repo-wide: zero hits) — both
edges draw independently, in full, each with its own end decoration.

**Causal chain to the observed symptom**:
1. Two un-merged Snakes → one extra arrowhead decoration (and the
   corner-collapse upstream's merge would have applied never runs) →
   `childCount +2` (confirmed: every one of the five fixtures shows
   `actual - expected = 2`, exactly).
2. The SAME un-merged structure leaves TWO independently-compressible,
   ink-free Y-bands where upstream's single merged Snake leaves one: the
   generic sibling gap (`SEQUENTIAL_ASSEMBLY_GAP = 35`, documented own
   "35 → 20" compression rule in `activity-layout-constants.ts`) AND
   `FtileIfLongVertical`'s own `marginy1 = 30` entry margin, contiguous
   with it. Each compresses independently (down toward `2×margin = 10`
   plus its own trailing arrowhead ink) instead of as one combined band
   → a constant, uniform `height +20` (confirmed: every one of the five
   fixtures shows `viewBox[3] actual - expected = 20`, exactly).
3. The `childCount` mismatch cascades into `compareSvg`'s positional
   (index-based) element comparison: once ours has 2 more elements than
   the jar's, every element AFTER the merge point compares against the
   WRONG index, producing a large wave of "unrelated-looking" text/
   attribute diffs (observed directly: `text[1]` compared `"yes"` against
   the jar's `"action one"` — a pure index-shift artifact, not a real
   content mismatch).

**Ruled out** (with evidence, not assumption):
- `GtileIfLongVertical`'s own width/height/branch-placement formulas —
  independently verified byte-exact against the Java source via
  isolated unit construction (`gtile-if-long-vertical.test.ts`, 14
  tests, every expected value hand-derived from the Java BEFORE running,
  matching on the first run).
- `walkIfLongVertical`'s own connector point math — independently
  verified via isolated integration (`walk-if-long-vertical.test.ts`, 9
  tests: exact node order, edge count/order, point counts, elseLabel
  threading, branch-ends-in-stop skip).
- A scalar/off-by-one in `MARGIN_Y1` or any other builder constant —
  ruled out directly: in isolated construction (no compression pass
  engaged), `branches[0].diamondY` is exactly `30` as the Java specifies;
  the discrepancy appears ONLY once the full render pipeline's
  compression step runs, and ONLY on the entry side (the exit side has
  zero internal gap between `lastDiamond`'s own bottom and the
  composite's own `SOUTH_HOOK`, and shows no equivalent discrepancy) —
  consistent with a merge-dependent mechanism, not a general geometry
  fault.
- A second, distinct defect — ruled out by the exact `+2`/`+20`
  UNIFORMITY across all five fixtures despite their different branch
  counts, nesting, and swimlane use; a second independent defect would
  almost certainly produce a DIFFERENT delta on at least one of them.

**Why this is not fixed here**: `layout/snake-merge.ts` (decisions.md
D1) is an explicit, separate, cross-cutting mission task — it affects
every if/while/fork/switch builder's own entry/exit connector
identically (any two Snakes anywhere in the diagram that touch
end-to-start), not something specific to `FtileIfLongVertical`.
Implementing a LOCAL, builder-specific merge just for this one
connector pair would be exactly the "patch with special cases" CLAUDE.md
forbids in favor of re-mirroring upstream's real architecture. It is
also well outside this task's write-set (a new pure module over the
WHOLE ordered edge list, invoked before `compressGeometry`, per D1's own
description — a different task's deliverable, not a one-file add here).

**Measured per fixture** (`tests/oracle/svg-conformance/
activity-vertical-if-t1pb.test.ts`, pinned and asserted, not estimated):

| fixture | diffCount | weightedScore | childCount Δ | height Δ |
|---|---|---|---|---|
| vertical-if-2way | 164 | 267 | +2 | +20 |
| vertical-if-3way | 210 | 347 | +2 | +20 |
| vertical-if-elseif-labels | 168 | 271 | +2 | +20 |
| vertical-if-nested | 222 | 339 | +2 | +20 |
| vertical-if-swimlanes | 164 | 267 | +2 | +20 |

## Quality bar — all green
`tests/diagrams/activity` + `tests/unit/activity` + the two new
oracle/conformance test files (1450 tests), `activity.golden.ratchet`
(68/68), `activity.harness-parity` (59/59), `activity.diff-baseline.ratchet`
(same 4 pre-existing, unrelated `fork ... end merge` failures — T1p-c's
already-merged feature, its own ratchet JSON not yet re-pinned; present
already before this task, confirmed via the same before/after worktree
technique). `npm run typecheck`, `npx eslint src tests`, `npm run build`,
`npm run catalog` (regenerated, 3 new modules, committed) all clean.

## Self-correction (carried from round 1, for the record)
Used Serena MCP tools (`search_for_pattern`/`get_symbols_overview`/
`list_dir`) during early investigation in round 1, before fully
internalizing `common.md`'s explicit "Never: Serena MCP tools" ban for
this mission. Caught mid-task, stopped immediately; every investigation
step since (including this entire round 2) used Read/Grep/Bash only.
Read-only calls, no output affected.

## Still open (if anyone picks this up next)
Only `layout/snake-merge.ts` (D1) itself — once it exists and is wired
before `compressGeometry`, re-run `activity-vertical-if-t1pb.test.ts`;
the pinned deltas (`childCountDelta: 2, heightDelta: 20`) should drop to
`0, 0` and the `diffCount`/`weightedScore` assertions should be
re-measured and re-pinned at that point (they will very likely become
`0`/`0` too, since the diagnosed mechanism accounts for the entire
observed difference in all five fixtures).
