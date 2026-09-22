# T10 — creole horizontal rule and table in notes/labels

## The brief's read-set pointed at the wrong mechanism for notes (READ THE JAVA FIRST)

`AtomHorizontalTexts.java`/`StripeSimple.java`'s `HORIZONTAL_LINE` branch/
`CreoleHorizontalLine.java` are the DESCRIPTION/legend engine's mechanism
(`classifyStripeLine` -> `StripeSimple.ts:154-155` construction site,
already ported at `src/core/klimt/creole/CreoleHorizontalLine.ts`, marked
"unreachable in practice" by its own doc comment). A NOTE's `----` line
never reaches that classifier at all: `note-layout-measure.ts#measureNote`
splits on `isNoteBlockSeparator` (`BodyEnhancedAbstract.java:67-77`) at the
DISPLAY-LINE level, before any per-line creole classification runs. The
real upstream mechanism for a note's `----` is `BodyEnhanced2.java#getArea`
+ `BodyEnhancedAbstract.java#decorate` + `TextBlockLineBefore.java` +
`UHorizontalLine.java` — already partially ported (`class-body-enhanced-
geometry.ts`/`class-body-enhanced-layout.ts`/`renderer-body-enhanced.ts`,
for CLASS BODY dividers only) but never wired for NOTES until this task.
Confirmed no note/legend fixture in the whole `class-divergence-drive`
corpus has a note-body TITLED separator (`--Header--`) — every non-empty-
captured `--...--`/`==...==` line in the corpus is a CLASS BODY separator
(`begico-70-guva302`, `fecolo-08-gepu579`, `gadufu-56-votu808`,
`lasave-44-dofa269`, `pacagu-24-nune023`).

## `ClassifierBodyGeometry.deriveHeightOffsets`'s `contentTop` silently reads 0 for a NOTE

Root cause of the `sodizo-26-salo123` Δ4-per-row Y drift (fixed this task):
the shared probe's dummy content block hardcodes `calculateDimension`'s
WIDTH to 0 (`class-body-enhanced-geometry.ts:174-179`). `TextBlockMarged
#drawU`'s `if (dim.getWidth() > 0)` guard (`TextBlockMarged.java:82`) then
skips calling that dummy's own `drawU` — the probe's ONLY way to record
`contentTop` — whenever `dim.getWidth()` stays 0, i.e. whenever `marginX
=== 0`. `class-body-enhanced-layout.ts`'s `CLASS_BODY_GEOMETRY` passes
`marginX = 6` (nonzero — `BODY_ENHANCED_MARGIN_X`), so the guard passes
and `contentTop` is correct there (byte-exact jar-verified, unaffected).
`note-layout-measure.ts`'s `NOTE_BODY_GEOMETRY` passes `marginX = 0`
(`BodyEnhanced2#getMarginX` returns 0 — correct upstream value, not a
bug), so for a NOTE the guard always fails and `contentTop` silently stays
its initialized `0` — verified directly:
`NOTE_BODY_GEOMETRY.deriveHeightOffsets(13, '-', undefined)` returns
`{"contentTop":0,"dividerY":0,"totalHeight":21}`; the real (jar-derived)
`contentTop` is `4` (`BodyEnhancedAbstract.java:112`'s own `withMargin
(block, marginX, 4)` literal). `totalHeight`/`dividerY` come from
`calculateDimension`/the divider's own unconditional `drawMe` call,
neither gated by that guard, so both stay correct regardless — this
task's fix (`note-layout-measure.ts#UNTITLED_SEPARATOR_MARGIN`) uses the
Java literal `4` directly rather than the broken probe read, and leaves
`deriveHeightOffsets` itself untouched (fixing the probe's own guard would
also be correct, but touches shared `class-body-enhanced-geometry.ts`,
outside this task's write-set, and the class-body callers don't need it).
**Flag for whoever next touches `ClassifierBodyGeometry`**: this same
under-read would bite ANY future caller instantiating it with `marginX ===
0`, not just notes.

## `AtomHorizontalTexts`/`StripeTable` trigger conditions (as read, step 2)

- `AtomHorizontalTexts.java` (whole, 85 lines): a generic "lay N atoms out
  side-by-side, starting altitude = first atom's own" container — NOT
  specific to horizontal rules despite the name; it is the multi-run
  line-layout primitive `StripeSimple`'s per-line atom builder uses for
  ANY creole line with more than one styled run (bold+plain, etc), matching
  what this port's OWN `class-member-creole.ts#resolveMemberAtoms` already
  does structurally (a different, independently-built adapter over the
  same shared primitives, per that file's own doc comment).
- `StripeSimple.java:154-155`: `style.getType() == HORIZONTAL_LINE` ->
  `atoms.add(CreoleHorizontalLine.create(...))` — the trigger for an actual
  `<line>` in the DESCRIPTION/legend engine specifically. Upstream:
  `CreoleStripeSimpleParser.java:92-159`'s four bracket patterns (`--x--`,
  `==x==`, `===*==`, `..x..`) with an EMPTY capture classify
  `HORIZONTAL_LINE`; a non-empty capture (a titled rule) ALSO classifies
  `HORIZONTAL_LINE` upstream (this port's own `CreoleStripeSimpleParser.ts`
  narrows that to `LITERAL`, a scoped, pre-existing, documented gap — not
  touched by T10).
- `StripeTable.java` (whole, 220 lines read): a table STRIPE is triggered
  by `CreoleParser.isTableLine` (a raw `|`-containing line) grouping
  consecutive such lines into ONE `StripeTable`; its ctor reads an optional
  `<#color>` line-color override (`getBackOrFrontColor(line, 1)`, checked
  against the FIRST run line only — zero corpus reach, not built) then
  tokenizes every line on `|` (`analyzeAndAddInternal`, java:130-163),
  building one `AtomTable` grid cell per token (header `=`-prefix -> bold,
  `\|` hidden behind `StringUtils.PRIVATE_BLOCK`, `<r>` -> right-align
  (STILL unapplied at draw time in this port, a PRE-EXISTING gap this task
  did not touch), per-cell literal-`\n` split). `AtomTable.java`'s own
  `drawU` (already ported, `src/core/klimt/creole/atom/AtomTable.ts`,
  never previously CALLED from anywhere) draws cells THEN the grid
  (`nbRows+1` horizontal rules THEN `nbCols+1` vertical, each FULL span,
  zero cell padding beyond the column's own max cell width) — this task's
  `renderer-note-lines.ts#renderTableCells`/`renderTableGrid` mirror that
  draw order and geometry exactly for the class-side flat-string renderer
  (jar-verified byte-exact against `jovigo-38-tuni063`'s ONLY table).

## Existing creole layer — what already existed vs. what T10 added

`get_symbols_overview`/`find`d `src/core/klimt/creole/` BEFORE writing
anything: `CreoleHorizontalLine.ts`, `atom/AtomTable.ts`,
`legacy/StripeSimple.ts`, `legacy/StripeTable.ts`,
`legacy/CreoleStripeSimpleParser.ts` all ALREADY EXIST and are fully
ported (klimt/`UGraphic` object-model layer, description/legend engine).
None of them are directly callable from class's flat-string renderer
(same "second adapter, don't re-port" split `class-member-creole.ts`
already established) — T10 added NO new file under `src/core/klimt/
creole/` (none of the missing behavior lives at that layer for notes; it
was a class-side wiring gap, not a creole-engine gap) and instead added:
`src/diagrams/class/renderer-note-lines.ts` (new render module) plus
draw-metadata types/builders in `note-layout-measure-rows.ts`
(`NoteDividerDraw`, `NoteTableCell`, `NoteTableDraw`, `buildDividerDraw`)
threaded through `note-layout-measure.ts` -> `note-layout-types.ts`
(`NoteGeo.lineDividers`/`.lineTables`) -> `note-layout-tip.ts` (both
`NoteGeo` construction sites).

## Not wired — the stop condition

`renderer.ts`'s note dispatch and `renderer-note.ts`'s three note-kind
exports (`renderNote`/`renderTipNote`/`renderOpaleNote`) are the only
callers of the note-rendering pipeline; all three are outside this task's
write-set. `renderer-note-lines.ts` exports drop-in wrappers
(`renderPlainNoteWithLines`, `renderTipNoteWithLines`,
`renderOpaleNoteWithLines`) verified byte-exact against jar in isolation
(`tests/unit/class/renderer-note-lines.test.ts`) but NOTHING calls them in
production yet — see the task report for the exact call-site edits.

## For the B7 creole batch (per the task's own step 6)

If B7 needs the LEGEND/link-label `----`/table path (the `classifyStripeLine`
-> `HORIZONTAL_LINE`/`StripeSimple`/`StripeTable` mechanism this task did
NOT touch, e.g. `kacico-91-bati232`'s legend — table AND tree list, `xicipi
-57-bibe032` — creole `<u>`/`<w>`/`<s>` possibly drawing as `<line>`
elements not yet diagnosed, `gujigi-63-roki030`'s constraint labels, memory:
"gujigi also carries the dormant constraint mechanism, do not chase"): that
is a DIFFERENT render path (`EntityImageDescriptionSupport.ts`/
`EntityImageDescriptionTextBlock.ts`/`class-layout-header-creole.ts` for
legends), already wired for `HORIZONTAL_LINE` per grep (`class-layout-
header-creole.ts:47`), genuinely unexplored by this task beyond the file
read above — do not assume it shares NOTE's `isNoteBlockSeparator` bug or
fix.
