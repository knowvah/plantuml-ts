# T1 — diagnose the `if` port gap and write the element templates

**Agent:** `debugger` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java is the spec — read the method
body and quote `file:line` for every claim. Read
[`../README.md`](../README.md), [`../decisions.md`](../decisions.md) D1–D9
(locked), [`../fixtures.md`](../fixtures.md) and
`.agent-notes/aicdo-planning.md` (the planning evidence: what our `if`
emits today, the four jar builders, the sibling-link finding). Follow
`~/.claude/rules/diagnosis.md`: instrument before hypothesising; every answer
states **Mechanism**, **Origin** (`file:line`), **Causal chain** and a
non-empty **Ruled out**.

Our live `if` is `tile-layout.ts#tileIf` (`:115-136`, always a `null`
merge) -> `tiles/gtile-if.ts` -> `tile-coordinates.ts` `'gtile-if'`
(`:184-232`; the `mergeDiamond` branches are production-dead). The renderer
draws `''` for `if-merge` (`activity-renderer-shapes.ts:539-540`). The jar
dispatches per D1 and draws per D7. Java paths are under
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

## Method

No `src/` edits (stop 4). Throwaway probing only in a scratch worktree
(`git worktree add ../aitp-t1-scratch HEAD`) with `node_modules` AND
`assets/stdlib` symlinked from the main checkout. Confirm the probe reports
aggregate **52067** before anything else. Remove the worktree at the end.

Measure with `npx tsx scripts/activity-probe.ts` (`--json`, `--dump`); render
jar oracles only through `scripts/oracle-render.sh`. Synthetic markup is
allowed for templates ONLY where no baseline fixture isolates a builder; say
so when used.

## Questions

**Q0 — dispatch contract.** Port `ConditionalBuilder.create`'s predicate
(`vcompact/cond/ConditionalBuilder.java:144-168`) and
`InstructionList.isOnlySingleStopOrSpot` (`InstructionList.java:90-106`:
exactly one instruction, a killed `InstructionSimple`, an `InstructionSpot`,
or a note-less `InstructionStop`/`InstructionEnd`) onto our AST
(`src/diagrams/activity/ast.ts` `ActivityIf`, `ActivityNode` kinds `stop`,
`end`, `kill`, `detach`, `break`?) as a pure function contract:

```ts
type IfBuilder = 'down' | 'with-links' | 'long-horizontal';
// which jar builder an ActivityIf takes, and for 'down' which branch is
// the then-block and whether the other is an optionalStop
function ifBuilderOf(node: ActivityIf): { builder: IfBuilder; swapped?: boolean; optionalStop?: boolean };
```

State which of our node kinds satisfy "killed" and "stop or end" with the
jar's parser cite (`ActivityDiagram3.java` — where `kill`/`detach`/`stop`/
`end` construct their instructions). Rewrite `fixtures.md` from a scratch
classifier implementing this contract: one row per baseline fixture that
contains an `if`, columns `slug | builders (per if, in source order) | pin |
laned`. A fixture may list several builders.

**Q1 — element templates (the T3–T5 acceptance oracle).** For each builder
pick three baseline fixtures (prefer unlaned, smallest pin; candidates:
`down` `nijipa-25-pede639`, `vaxiki-78-nice114`, `fonabu-93-xama593`;
`with-links` `carapo-31-bisi880`, `rerovo-62-nazo755`, `vimako-25-mega336`;
`long-horizontal` `lifeve-53-zubi598`, `pekefu-66-mepa144`,
`sofoje-37-tila554` — verify each with Q0 first). Dump the jar golden
(`--dump`) and name every `<polygon>`/`<line>`/`<text>` of the `if` by its
Java class: `diamond1` hexagon, `diamond2` rhombus, each label, and each
`Connection` with its `line` count and arrowhead `polygon`s (an
`emphasizeDirection` mid-arrow is a second polygon). Write one template per
builder as a table `element | Java class | file:line | count`, plus the
node draw order (`drawU`: `FtileIfDown.java:524-537`, `cond/
FtileIfWithDiamonds.java:200-218`, `FtileIfLongHorizontal.java:671-677`) and
the conns order (`FtileIfDown.java:135-157`, `cond/FtileIfWithLinks.java:
531-560`, `FtileIfLongHorizontal.java:203-255`). Record each fixture's
current (tag, lane) alignment and per-tag counts as the base figure.

**Q2 — `GtileDiamond` vs `FtileDiamondInside`.** On a labelled hexagon
(a `while` fixture's header, jar `FtileWhile` also uses
`FtileDiamondInside`), compare our polygon's width/height with
`calculateDimensionAlone` (`vertical/FtileDiamondInside.java:104-116`:
`max(label, 24x24) + (24, 0)`). Equal or not, with numbers. This decides
whether T7 files a while/repeat sizing follow-on (D2, stop 13). Also state
what `bounder.getDimension` returns for the label vs the jar's
`TextBlock.calculateDimension` (padding? line height?) — T3 needs the exact
mapping to reproduce `dimLabel`.

**Q3 — mid-arrow placement (D6 safety).** `Worm.java:138-139,178-183`: the
FIRST segment in the emphasized direction, arrow at its midpoint. Ours:
`renderer.ts:176-195`, longest segment. On every baseline fixture with a
`repeat` (grep `repeat` under `tests/corpus/activity/` restricted to
baseline slugs), state whether the back-edge's first UP segment is also its
longest, so T2's migration to `emphasize: 'up'` moves no pin. List any
exception.

**Q4 — cross-lane middle rules.** `swimlane-placement.ts:348-389`
(`crossLaneMiddleY` per `EdgeShape`): what it does for `'default'` today,
and which new `EdgeShape` tags T3–T5 need to reproduce `ConnectionIn/
Out.drawTranslate` (`FtileIfDown.java:225-238,286-301`: middle `(y1+y2)/2`)
and `ConnectionVerticalIn.drawTranslate` (`FtileIfLongHorizontal.java:
419-435`: `y1 + 4`). Name the laned `fixtures.md` slugs that exercise each.

**Q5 — label font and text placement.** `getLabelPositive` uses the arrow
style's font (`ConditionalBuilder.java:117,280-283`; `plantuml.skin`'s
`activityDiagram arrow FontSize`). State the size our `activityFontSize
(theme, 'arrow')` (`activity-style-defaults.ts:154`) resolves to, and how
`renderLabel` (`activity-renderer-shapes.ts`) positions text relative to a
top-left `TextBlock.drawU` origin (baseline offset), so T3 can place
`if-label` nodes at the jar's translates.

**Q6 — `--align` flag.** Add `--align <slug>` to `scripts/activity-probe.ts`:
prints per-tag counts (ours / jar) for `polygon`, `line`, `text`, `rect` and
the (tag, lane) positional alignment `n/N`, the same figures Q1 records by
hand. Unit-test the pure part in `tests/unit/scripts/activity-probe.test.ts`.
This is tooling, not `src/`.

## Read-set

- `src/diagrams/activity/layout/tile-layout.ts:115-136`
- `src/diagrams/activity/layout/tile-coordinates.ts:158-232`
- `src/diagrams/activity/tiles/gtile-if.ts`, `gtile-diamond.ts:15-29`
- `src/diagrams/activity/activity-renderer-shapes.ts:372-400,505-545`
- `src/diagrams/activity/renderer.ts:153-205`
- `src/diagrams/activity/layout/swimlane-placement.ts:63-74,348-389`
- `scripts/activity-probe.ts` (whole; ~440 lines)
- Java: `vcompact/FtileFactoryDelegatorIf.java:70-92`;
  `vcompact/cond/ConditionalBuilder.java:131-311`;
  `vcompact/FtileIfDown.java:124-158,524-537`;
  `vcompact/cond/FtileIfWithLinks.java:531-560`;
  `vcompact/FtileIfLongHorizontal.java:151-258,671-677`;
  `vertical/FtileDiamondInside.java:84-125`; `vertical/FtileDiamond.java:
  85-112`; `Worm.java:120-183`; `InstructionList.java:86-106`

## Write-set

`.agent-notes/aitp-T1.md`; `plans/activity-if-tile-port/fixtures.md`
(rewrite); `plans/activity-if-tile-port/measurements/base.json`;
`scripts/activity-probe.ts` and `tests/unit/scripts/activity-probe.test.ts`;
`plans/activity-if-tile-port/decision-journal.md` (rows).

## Interface contract (consumed by T2–T7)

The note has sections `## Q0` … `## Q6`. Q0 ends with the `ifBuilderOf`
contract above. Q1 holds three tables named `### Template: down`,
`### Template: with-links`, `### Template: long-horizontal`, each followed
by the three slugs and their base `--align` figures. `fixtures.md` keeps
the column shape `slug | builders | pin | laned`.

## Acceptance criteria

- Given the note, when Q0–Q5 are read, then each states Mechanism, Origin
  (`file:line`), Causal chain and a non-empty Ruled out
- Given Q0, then every `fixtures.md` row's `builders` column comes from the
  ported predicate, not from markup regexes, and the `mixed` guess is gone
- Given Q1, then every template element names a Java class and line, and
  `--align` on each representative slug reproduces the base figures
- Given `measurements/base.json`, then `aggregate` is 52067 and every
  `delta` is 0
- Given Q3, then every baseline `repeat` fixture is listed with the answer
- Given the scratch worktree, then it is removed and `git status` shows no
  `src/` change

## Observability / Rollback

N/A — no new observable operations / **Reversible** (documents + tooling).

## Quality bar

`npm run typecheck`, `npm run lint`, `npm test` green (the probe's own
tests included); `git diff --name-only HEAD~1` lists only the write-set.
Stage explicit paths; never `git add -A`.

## Commit

`docs(aitp-T1): diagnose the activity if port gap and write element templates`
