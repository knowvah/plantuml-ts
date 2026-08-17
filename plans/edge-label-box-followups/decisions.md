# Architecture decisions — edge-label-box-followups

Every constant carries its upstream `file:line`. Paths under `~/git/plantuml/
src/main/java/net/sourceforge/plantuml/` unless stated.

## D1 — Description `note on link` is an AST field, not label text

`description/parse-state.ts:367-371` (`attachNoteToLastLink`) appends the note
text to `link.label`. Upstream keeps `Link#getNote()` separate and
`SvekEdge.java:306-325` merges an `EntityImageNoteLink` into the label block.
**Decision:** add `DescriptiveLink.linkNote?: string`,
`linkNotePosition?: NotePosition` (mirror `class-relationship-ast.ts:151-161`,
`state/ast.ts`); the parser stops folding. `note-grammar.ts#matchOnLink`
currently captures **neither position nor colour** — the same trap T10 hit in
the class engine (`plans/edge-label-box-backlog/batch-5/overview.md`, write-set
correction #1). Capture the position; a hard-coded `'bottom'` would be a
fitted value. **Consequence:** description SVG rendering of the note text must
be re-plumbed (D2) in the same task.

## D2 — The description SVG keeps the note text visible; the note *shape* is a separate mission

No engine draws `EntityImageNoteLink` in SVG — class's `lozego-15-coci435`
renders no "Note on rel" text; description shows "Link note" today only because
it is folded into the label. **Decision:** after D1 the description renderer
draws `linkNote` text lines beneath the main label inside the merged box —
what the user sees today, positioned by the now-correct DOT box. Do not mirror
class/state's silent drop; do not build the polygon here (that is
`svek/image/EntityImageNoteLink` draw for three engines, queued in
`planning/next-missions.md` by T8). Gate: `shape-match-report` no fixture rises;
stop condition 9 if D2 and the gate conflict.

## D3 — One arrow-label font resolver, mirroring `GraphvizImageBuilder.java:234-235`

Upstream: `labelFont = getDefaultStyleDefinitionArrow(stereotype)
.getMergedStyle(...).getFontConfiguration(...)` — the `arrow` style cascade,
with `skinparam arrowFont*` bridged through `FromSkinparamToStyle`
(`ClassArrowFontSize` → `arrowfontsize` via `SkinParam.cleanForKeySlow`,
already ported in `core/skinparam-key-normalize.ts`). Here it is a hardcoded
`ARROW_LABEL_FONT_SIZE` (13, `klimt/font/FontParam.java:54`) at ~12 sites and
`theme.colors.graph.arrowFontSize` (skinparam-only) read by exactly one
(`description/layout.ts:354`). **Decision:** extend `colors.graph` in place
with `arrowFontFamily`, `arrowFontStyle`; add `computeArrowFontOverride
(styleMap)` beside `computeCardinalityFontOverride` (`style-cascade-class.ts
:238`, `ARROW_SNAMES` fontsize/fontname/fontstyle) writing the same fields via
`style-map-theme.ts`; add `arrowfontname`/`arrowfontstyle` skinparam handlers
beside `arrowfontsize` (`skinparam-key-handlers.ts:104-110`); one
`resolveArrowLabelFont(theme): FontSpec` in `src/core/arrow-label-font.ts` is
the only reader. `FontStyle bold/italic` maps to `FontSpec.weight/style`
(`core/measurer.ts:12-17`). Rejected: new top-level `Theme.arrowFont*` like
`cardinalityFont*` — would retire a public field for symmetry alone.

## D4 — Per engine, measurement font and SVG text font change in the same commit

If the DOT box moves to 14/bold and the SVG `<text>` stays `font-size="13"`,
layout and ink disagree — a new class of the exact bug `labelSizeOk` exists to
catch. **Decision:** T5 (class), T6 (description), T7 (state, optional, no
backlog slug) each wire `resolveArrowLabelFont` into both the DOT-measurement
site and the SVG renderer site. T7's bar is zero movement with no override.

## D5 — Description's note-operand sizing consumes a shared Rose helper

`pureText + (6+15) + 2×5` wide / `+ (5+5) + 2×5` tall (`skin/rose/Rose.java
:65-66`, `ComponentRoseNote.java:82-91`; Opale margins `Opale.ts`) is already
copied in `state-dot-graph.ts:178`, `state-composite-edge-label.ts:49`,
`class-note-link-box.ts:70`. **Decision:** add `roseNoteDim(pure)` to
`src/core/edge-label-box.ts` (the merge model owns its operand's padding);
description consumes it; the three existing copies are **left untouched** —
write-set discipline; `shared-seam-extraction` collapses them. Description's
"pure text" comes from its real creole `TextBlock` (`leaf-sizing.ts
#buildNoteBody`), the closest thing in the port to upstream's operand.

## D6 — Per-line magic arrows follow `hasSeveralGuideLines`

`SvekEdge.java:290-297`: the per-line path
(`descdiagram/command/StringWithArrow.java:115-127`,
`addSeveralMagicArrows` — per line `create9` then `mergeLR` a
`TextBlockArrow2`, `mergeTB` the lines) runs only when
`Display.hasSeveralGuideLines` (`klimt/creole/Display.java:715-740`: ≥ 2
lines and some line **starts with** `"< "` or `"> "`); otherwise the whole-
label `addMagicArrow` (:304, T12c's path). **Decision:** port the predicate and
both branches. Rejected: scan every label per line — changes single-line and
non-guide-line labels that are correct today.

## Inherited from SI23, restated not re-decided

Shrink-only backlogs; no fixture rises; every constant cites `file:line`;
never fit a value; `computeMergedLabelBox`/`computeQuantifierBox` are the
shared arithmetic — engines consume, never re-derive.

## Mechanisms

### Quantifier visibility strip (`focaci`)
`SvekEdge.java:329-351`: `startTailText = Display.getWithNewlines(pragma,
link.getQuantifier1()).create(cardinalityFont, CENTER, skinParam)` —
`Display`'s own per-line strip (`Display.java:413-419`, T12a's citation)
applies; `addVisibilityModifier` (`SvekEdge.java:302, 363-`) is called only
on the main label block. Arithmetic at SI23 close-out: `~* initiators` = 61.1
→ strip `~` → 53.46 → **53** = oracle headlabel `53x13`.

### Arrow main-label font (`camuna`, `zosuje`, `ticuxa`)
`camuna`: `<style> arrow { FontSize 14  FontStyle bold }`, oracle 29x16 vs
ours 27x15. `zosuje`: `arrow { FontSize 10  FontStyle bold }`, oracle
5x12/9x12/12x12 vs 6x15/11x15/15x15. `ticuxa`: `skinparam ClassArrowFontSize
58` + `ClassArrowFontName Courier` + `ClassArrowFontStyle Italic`; `toto` at
58 = 96.425 + 2 = **98**, height 58 + 2 = **60** = oracle (measured with
`WidthTableMeasurer` during planning). Verify bold/italic width handling
against upstream `StringBounderFromWidthTable` before relying on it (stop 10).

### Description M2 (`dikexa`, `fogiku`, `jafuke`, `zavitu`)
`fogiku`/`jafuke`: `note bottom on|of link` "Link note" — oracle 80x33, ours
51x15 (bare label). `dikexa`: `note on link #red: note red` + `note left on
link #blue` block — 75x48 / 174x46. `zavitu`: three `note on link:` singles,
one `#gray` — 268/272/393 x 48. Same `SvekEdge.java:306-325` merge T8 ported.

### Inline creole in the class multi-line branch (`vuresa`)
`<b>Person-Meeting</b>\nMeetings/Person\nFk=Meeting.PersonID`. Literal
`<b>Person-Meeting</b>` = 140.32 + 2 = **142** (ours). Longest real line
`Fk=Meeting.PersonID` = 126.1 + 2 = **128** = oracle. `stripCreoleMarkup`
(`core/edge-label-box.ts:71`) exists; the multi-line branch of
`class-layout-edge-labels.ts` (~:255-270) never calls it.

### Per-line magic arrows (`gobuco`, `lapoma`)
Label `ab >\ncd <\n< ef\n> gh` — lines 3–4 start with `< `/`> ` ⇒
`hasSeveralGuideLines` ⇒ per-line `TextBlockArrow2` (13×13,
`TextBlockArrow2.java:57,87`) merged LR per line, TB across. Oracle 29x54, ours
24x54 (T12c's whole-label path finds no leading token on line 1).

## The two formerly undiagnosed slugs

SI23's close-out labelled `vuresa` and `ticuxa` "undiagnosed". Planning
diagnosed both (above). **The `vuresa` note in SI23's README is wrong in
sign**: it says "failing to strip `<b>` would make us *narrower*" — not
stripping keeps 7 extra glyphs and makes us **wider**, which is what we are
(142 vs 128). T8 corrects that line in `plans/edge-label-box-backlog/README.md`.
