# T3e — hnote shape, box stereotype, note colour refusal, transparent paint

Agent: `typescript-pro`, worktree `sdd1-T3e`. Added 2026-10-20 from T2e's
and T2a's re-slots (journal rows 30, 34). One commit per item.
**Read [../batch-2/family-contract.md](../batch-2/family-contract.md) first —
it is part of this prompt.**

## Items
1. **hnote is a hexagon.** The port draws `hnote` as a rect; the jar draws a
   7-point `UPolygon` with `textHeight / 2` as INTEGER division
   (`ComponentRoseNoteHexagonal.java:96-103`), 23 fixtures. `NoteGeo.shape`
   has only `'rect'` and `NoteEvent.shape` lumps rnote with hnote. Split the
   AST shape (`ast.ts`, the note command factory), carry it on `NoteGeo`
   (`geo-annotation.ts`), size it as the Java does, draw it in
   `renderer-note.ts`. Element order and attribute form per a golden
   `in.svg`.
2. **Box stereotype.** `command-grouping.ts` drops the `box` stereotype, so
   `dollStyle(b, stereotype, boxColor)` gets none (jinaxe-58, xonedu-05).
   Read `CommandBoxStart.java` for how the stereotype is parsed; carry it on
   `BoxGroup` and pass it in `sequence-layout-box.ts`.
3. **Note colour refusal.** A compound or unknown note colour
   (`note left #pink;line:green` on an arrow) now throws
   `NoSuchColorException` in layout. Upstream throws in the command, so the
   sequence parse fails (the jar then falls through to another diagram
   type). Make the note command refuse, as the Java does
   (`FactorySequenceNoteOnArrowCommand.java:223-225` and siblings); 0 corpus
   rows affected — prove it with the classify.
4. **Transparent paint.** `paintOf`'s `svgPaint` writes transparent as
   `#00000000`; klimt's convention is `'none'`. T2a mapped it locally in
   `renderer-participant-symbol.ts#klimtPaint`. Fix it once in
   `sequence-skin-param.ts` (read how upstream's `SvgGraphics` emits a
   transparent colour) and remove the local mapping.

5. **`hide stereotype` drops style** (T2f open 4; secida-27, xuxugi-47).
   `applyHideStereotype` (`sequence-hide-passes.ts:45-48`) deletes
   `Participant.stereotype`; upstream hides only the DISPLAYED stereotype
   (`Participant.java:125-135`), so `.alice { lifeline {…} }` styles must
   still reach lifelines, activations and heads.
6. **Lifeline `<title>`.** The jar's lifeline tooltip is `getDisplay()`,
   stereotype line first (`Participant.java:125-135`; probe shows
   `<title>..foo..</title>`); the port uses the name. 93 fixtures carry
   `svg/g/g/title/text()` diffs: attribute how many this explains.
7. **Small follow-ups from T3b** (journal row 38): `renderer-lifeline.ts`
   has a private `activationShadow` duplicating
   `sequence-shadow.ts#activationShadowFilter` — import the shared one;
   fix the stale comments in `sequence-layout-note.ts:207-209` (points at
   the deleted `sequence-layout-note-shadow.ts`) and
   `geo-annotation.ts:34-35` / `geo-participant.ts:49-50` (shadow now comes
   from the element's paint, `Style.java:109-115`).

8. **Gradient on a divider rule** (sedule-54, journal row 40).
   `renderer-divider.ts` strokes the rule `<line>`s with the gradient's
   `url(#…)`; `DriverLineSvg.java:76-80` strokes a line with
   `HColorGradient#getColor1()`. T2f applied this to lifelines only.

## Write-set
`src/diagrams/sequence/{ast,command-note-factory,command-grouping,
geo-annotation,renderer-note,sequence-layout-note,sequence-layout-box,
sequence-skin-param,renderer-participant-symbol,sequence-hide-passes,sequence-layout-participants,sequence-layout-lifeline,renderer-lifeline,geo-participant,renderer-divider}.ts` (`MessageEvent.destroys` is T3d's to set; leave that field alone), plus any `command-*.ts`
that builds `NoteEvent`s (list them), their tests under `tests/unit/sequence/`.
`scale-geo.ts` only if the hexagon adds a scaled field.

## Acceptance
- An `hnote` draws the jar's 7-point polygon; the 23 hnote fixtures' note
  diffs fall (report the number); integer `textHeight / 2` has a test.
- `box "B" <<S>>` with `<style> .S { BackGroundColor red }` paints the box
  red (jar-verified).
- `note left #pink;line:green` on an arrow refuses at parse; the corpus
  classify shows no row changing cohort to error.
- `grep -rn 00000000 src/diagrams/sequence` finds no local mapping.
- Every riser vs your start has a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A.
Rollback: Reversible.
