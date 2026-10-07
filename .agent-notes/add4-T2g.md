# add4-T2g — COMPOSITE-NOTE + composite canvas bounds

Branch `add4/T2g`, base `a22d86954`. No Serena, no stash, no `&`; no golden/baseline edits.

## Commits (probe Σ over the 34 baseline rows; base 2493)
| sha | subject | Σ |
|---|---|---|
| b6b858735 | fix(activity): forward a note after a closed group into the group | 2137 |
| 94630e39a | fix(activity): make a while's leading and trailing notes its own | 1978 |
| 02d2ebdde | fix(activity): pad a package frame and end a card hline in the canvas | 1765 |
| (this) | docs(add4-T2g): report + catalog regen | 1765 |

## Java -> ours
- Group: `InstructionList.java:190-196` (`addNote` -> `getLast().addNote`) +
  `InstructionGroup.java:125-131` (own note while `list.isEmpty()`, later one overwrites; else
  `list.addNote` = the group's last instruction). Ours: `note-dispatch.ts#redirectNoteOntoGroup`,
  called from `node-dispatch.ts#pushNode` (a wrapper over `pushParsedNode`, passed as the
  recursion's `push`, so nested groups/ifs/switches get their redirects). Note goes before trailing
  `arrow-label`s. Empty group -> `ActivityGroup.note` (existing GROUPNOTE field).
- While: `InstructionWhile.java:162-167` (own note while `repeatList.isEmpty()`, else forward to the
  list) + `:126-127` (`FtileWithNoteOpale.create(tmp, notes, false, CENTER)`: withLink=false).
  Ours: `node-dispatch.ts#tryWhile` splits the body's leading notes via `extractLeadingCaseNotes`
  (stops at any instruction and at `backward`), new `ActivityWhile.notes` (`ast.ts`),
  `note-dispatch.ts#redirectNoteOntoWhile` for a note after `endwhile`,
  `tile-layout-structural.ts#wrapWhileNotes` (generalised `wrapSwitchNotes` into `wrapOwnNotes`) called
  from `tile-layout.ts#tileNode`.
- Canvas: `LimitFinder.java:168-177` (UPolygon: +-10 X only, Y exact), `:179-182` (ULine end exact),
  `:184-188` (URectangle -1). `USymbolFolder.java:84-93,123` (package = UPolygon when roundCorner 0 +
  inside hline; our package is always the polygon branch, `activity-renderer-composite-symbols.ts:75`),
  `USymbolCard.java:61-67` (URectangle + `hline(width)`: far X exact, near X the rect's),
  `USymbolRectangle.java:65-71` and `USymbolFrame.java:68-74` (URectangle, the frame's UPath lies inside
  it) keep the rect fudge. Ours: `layout/canvas-origin.ts#compositeFudge` (package X {10,10} Y {0,0};
  card X {near 1, far 0} Y rect). Y for the package is exact too, which the T2b sandbox did not do.

## Rows before -> after (probe score; element delta vs jar)
| row | before | after | element delta |
|---|---|---|---|
| tozecu-08-ride878 | 504 | 0 | {polygon+5,line+5} -> {} (b1 was {polygon+4,line+2}) |
| somome-34-nori033 | 65 | 0 | {} -> {} |
| lebile-91-veto202 | 223 | 64 | {polygon+1,line+1} -> {}; residual named below |
Every other row unchanged (probe diff after each commit lists only these three).

## Risers
None: no row rose after any commit; no element count moved away from the jar.

## Census movers (style/text/swimlane; ratchet, harness-parity, compress invariant, all green)
- tozecu style: strokeWidth{1: 12->7}, h 923->708 = the pin's `jar` column. text: inset{10: 8->7; 78.221: 0->1} = `jar`.
- somome style: w 99->119 = `jar` (T2b noted 119).
- lebile style: strokeWidth{1: 14->13} = `jar`, h 326->272 = `jar`, w 419->524 (`jar` 530, the 6 px residual).
- swimlane census: no mover. The 3 style + 1 text pins need the orchestrator re-pin.

## Fixtures / tests (jar renders via `scripts/oracle-render.sh`)
`tests/fixtures/activity/add4-T2g/{group-note-after,group-note-nested,group-note-empty,
while-note-own,while-note-after,while-note-empty}`, `tests/diagrams/activity/composite-note.test.ts`
(6 cases, all `compareSvg` diffs `[]`). `group-usymbol-fixtures.test.ts` (T2b) pinned the card/package
canvas residual; it now asserts all four USymbol cases jar-exact.

## Not done + why
- **lebile 64 = `FtileGroup#getInnerDimensionSlow` (`FtileGroup.java:176-182`), unported.** Bisected
  with jar renders: `partition { while (true) :x; end while }` alone is 3 (frame 6 px narrow); with an
  `if` around it every edge right of the frame shifts 6 px, which is the whole 64. `repeat` in a group
  is exact. The jar widens `inner` by `missingWidth + 5` when a `LimitFinder` scan of `inner.drawU`
  exceeds `orig.width`; the jar's frame is `orig + 6` for a while (so maxX = orig.width + 1), a
  constant in every variant tried (notes, widths). I could not derive the +1 from `Worm`/`Snake`/
  `UGraphicForSnake`/`FtileWhile.ConnectionBack` (loop line at xx = tile width, arrowhead +-4, polygon
  pad 10 gives +4 by hand, not +1), so I did not fit it. Port needs the inner draw scan at tile
  construction (`tiles/gtile-group.ts` takes an ink-width option from `tileGroup`); `edgeInkX` /
  `extendForNode` already emulate `LimitFinder`. Owner: a GROUP-INK task (gtile-group + tileGroup).
- `layout/swimlane-context.ts#measureLaneExtents` still uses `fudgeX(item.kind)`; a package/card inside a
  swimlane lane would under-measure the lane (no corpus row has both; `caburo-70-buki284` has neither
  together). One-line fix there when a row appears: use a node-aware fudge (`compositeFudge`).
- A group-in-switch-case last-instruction note still misses the group redirect: `redirectNoteOntoSwitch`
  recurses with `pushParsedNode`, not `pushNode`. One wiring line in `list-backward-dispatch.ts`
  (T2f/T1f territory): pass the group-aware push, or move `pushNode` there.
- Repeat (`InstructionRepeat.java:220-228`: own note unless `backward` set, else `backwardNotes`) and
  `InstructionFork`/`Split` closed-state forwarding are not touched; no row exercises them.

## Out-of-write-set edits (each additive, one hunk)
- `src/diagrams/activity/ast.ts`: `ActivityWhile.notes`.
- `src/diagrams/activity/layout/tile-layout.ts`: import + `case 'while'` wraps with `wrapWhileNotes`.
- `docs/catalog.md`: regenerated (3 exports added).

## Observation: a note after a container belongs to its last instruction
- **Context**: tozecu drew a note after each group stacked below it with edges.
- **Finding**: `InstructionList#addNote` always forwards to `getLast()`; a group/while hand it down to their own last instruction, so the note sits beside that action INSIDE the frame.
- **Impact**: any new container kind needs the same redirect in `pushNode`; the node-level redirect covers nesting.
- **Confidence**: High (6 authored oracle fixtures, 0 diffs)

## Observation: LimitFinder fudge differs per USymbol
- **Context**: somome 65 and tozecu's canvas.
- **Finding**: package = UPolygon (X +-10, Y exact), card = URectangle + full-width ULine (far X exact), partition/group/rectangle = URectangle.
- **Impact**: swimlane lane extents use `fudgeX(kind)` and do not see the USymbol.
- **Confidence**: High
