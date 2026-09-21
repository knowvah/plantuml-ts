# T15 — qualifier box (`Kal`)

**Agent:** typescript-pro (opus) · **Depends on:** —

## Context

A qualified association (`class1 [Qualifier] --> class2`) makes upstream
build a `Kal` per qualified end: a `UDrawable` drawing a
`URectangle(textDim.delta(4,2))` filled with the `class.qualified` style's
BackGroundColor, stroked `UStroke.withThickness(0.5)`, text at
`UTranslate(2,1)` — the jar's `<rect …stroke-width:0.5>` + `<text>` pair
inside the link group, drawn last before `ug.closeGroup()`
(`classdiagram/command/CommandLinkClass.java:345-353` builds `kal1`/`kal2`;
`svek/SvekEdge.java:242-246` construct, `:1015-1019` draw, `:1069-1077`
`computeKal` placement, `:540-562` `getExtremitySimplier`'s
`translateForKal` pushes the arrow decoration out by the box width/height;
`svek/Kal.java:126-140` `drawU` — rect+text; `:104-121` `position` +
`entity.ensureMargins`). This port parses the qualifier
(`class-relationship-parser.ts:307-308`) into `fromQualifier`/`toQualifier`
and uses it for exactly one purpose: the DOT `:h` shield flag
(`class-shield-helpers.ts:118-126`, `class-port-rows.ts:216`,
`src/core/svek-dot-emit.ts:118`). No `Kal` equivalent exists (`diagnosis/
A2a-link-groups.md` M1; D6 locks this as a faithful port including margins).
`Kal#drawU`/`SvekEdge:1015-1019` also call `entity.ensureMargins(...)` and
shift the extremity by `getTranslateForDecoration()` — node positions move
for every qualifier fixture, confirmed by their large numeric deltas. The
report is a lead: re-read `Kal.java` and `SvekEdge.java`'s three cited
regions before editing.

## Task

1. Before editing: `grep -rl '\[.*\]' test-results/dot-cache/class/*/in.puml
   | xargs grep -l -- '-->\|--\|\.\.>' ` (refine until it isolates lines
   with a qualifier bracket on a link, not an array/generic type) to bound
   the blast radius beyond the 19 named fixtures. Journal the count in
   `.agent-notes/cdd-T15.md`.
2. Tests first: `class-kal.test.ts` for the box's measure/position (rect
   dims from `textDim.delta(4,2)`, text offset `(2,1)`, stroke-width 0.5)
   against `baneru-00-kuro607`'s cached `in.svg` values; a margin/extremity
   test against `camuna-58-veca254`'s node-size shift in its `svek-N.dot`.
3. New `src/diagrams/class/class-kal.ts`: measure (text dims + `delta(4,2)`
   padding), margin computation (`ensureMargins` port), extremity translate
   (`translateForKal`/`getTranslateForDecoration`), emit (rect + text).
4. Wire margins into `class-layout-edge-labels.ts` / `class-dot-graph.ts`
   (node-size side — DOT margins widen for a qualified end).
5. Wire the box anchor + extremity translate into `class-edge-geo.ts`.
6. Emit from `renderer-edge.ts` (rect + text, last in the link group, before
   `closeGroup`).
7. Theme: add a `class.qualified` style signature (`Kal.java:90-96`) to
   `src/core/style-cascade-class.ts` / the relevant `theme-graph-colors-
   *.ts` file — `camuna-58-veca254`/`nafiki-56-jixu680`'s `<style>` blocks
   prove it is a real style block (`#008000` background, `ivory` text);
   resolve BackGroundColor from it, falling back to the jar's Kal default
   when no `<style>` overrides it.
8. Verify DOT node sizes: for all 19 fixtures (`baneru-00-kuro607`,
   `comaxe-39-goza236`, `goloxu-09-nero458`, `kadifi-56-bili996`, `kopida-
   02-vaje995`, `mucoti-34-seve858`, `pumocu-32-fiji248`, `rilali-81-
   gifu188`, `sefazi-02-defe499`, `tikovu-50-gale862`, `vileca-45-melo541`,
   `vorimi-67-gudu296`, `vuzoro-99-kizi978`, `xoxega-30-vuju324`, `coxose-
   20-nifu136`, `ririlu-13-zipi740`, `camuna-58-veca254`, `nafiki-56-
   jixu680`, `rifuzu-80-nixo780`), diff the emitted DOT node sizes against
   each fixture's cached `svek-N.dot`; confirm the DOT-parity gate stays
   710/711.
9. `.agent-notes/cdd-T15.md`: blast-radius grep result, and the DOT-gate
   confirmation from step 8.

## Read-set

Java: `classdiagram/command/CommandLinkClass.java:345-353`; `svek/
SvekEdge.java:242-246,540-562,1015-1019,1069-1077`; `svek/Kal.java` (whole
file, especially `:90-96` style, `:104-121` position/margins, `:126-140`
drawU). TS: `src/diagrams/class/class-relationship-parser.ts:300-310`;
`src/diagrams/class/class-shield-helpers.ts:110-130`;
`src/diagrams/class/class-port-rows.ts:210-220`;
`src/core/svek-dot-emit.ts:110-125`; `src/diagrams/class/class-layout-edge-
labels.ts` (margin computation entry points);
`src/diagrams/class/class-dot-graph.ts` (node-size assembly);
`src/diagrams/class/class-edge-geo.ts` (whole, for the new anchor/
translate); `src/diagrams/class/renderer-edge.ts` (link-group emission
order); `src/core/style-cascade-class.ts` (existing signature pattern).
Diagnosis: `diagnosis/A2a-link-groups.md` M1 (whole section);
`decisions.md` D6.

## Write-set

`src/diagrams/class/class-kal.ts` (new), `class-kal.test.ts`,
`src/diagrams/class/class-layout-edge-labels.ts`,
`src/diagrams/class/class-dot-graph.ts`,
`src/diagrams/class/class-edge-geo.ts`,
`src/diagrams/class/renderer-edge.ts`, `src/core/style-cascade-class.ts`
and/or `src/core/theme-graph-colors-a.ts`/`theme-graph-colors-b.ts` (the
`class.qualified` signature — pick whichever file already hosts sibling
class-diagram style signatures), their `*.test.ts` files,
`.agent-notes/cdd-T15.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T16)

`class-edge-geo.ts`'s per-edge geo record gains a `kalBox?: { start?:
KalBox; end?: KalBox }` (or equivalent) that T16's suppression logic must
leave untouched when deciding sametail decor/dash — a qualified end and a
grouped-inheritance end are independent features on the same edge.

## Acceptance criteria

- Given `baneru-00-kuro607`, when rendered, then its link group holds a
  `<rect … stroke-width:0.5>` + `<text>` at the jar's position for the
  qualified end
- Given `camuna-58-veca254` / `nafiki-56-jixu680`, when rendered, then the
  qualifier box uses the `<style>` `class { qualified { … } }` colours
  (`#008000` background, `ivory` text)
- Given all 19 fixtures, when the DOT is emitted, then every node size still
  matches its cached `svek-N.dot`
- Given the DOT-parity gate (`tests/oracle/class-dot-parity.test.ts`), then
  it stays 710/711
- Given the step-1 blast-radius grep, then every additional fixture it
  surfaces (beyond the 19) is checked for a mover and journaled if it
  regresses

## Observability

N/A — no new observable operations; render/layout fix only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts` on all 19 named fixtures before/after with
structural+numeric counts in the commit body. `tests/oracle/class-dot-
parity.test.ts` re-run explicitly (710/711 or the exact new count named).
Files ≤500 lines, functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: run the step-1 blast-radius grep before editing (D6 flags this as
the highest-risk task in the batch). Ask first: any stop condition in
`../README.md`; a DOT node-size change outside the 19+grep-found fixtures.
Never: fit a margin/translate constant without an upstream citation; edit
outside the write-set; special-case a fixture's Kal box position instead of
using the ported formula.

## Commit

`feat(cdd-T15): draw the Kal qualifier box on qualified association ends`

Body: why — M1/D6, a faithful port including margins, so node positions
move for every qualifier fixture; cite the step-1 blast-radius grep result.
