/**
 * Shared `#color`/`#back:color;...` background-override extraction — split
 * out of `renderer-classifier-box.ts` (G2 N34) so `renderer-note.ts` can
 * reuse the SAME bare/`back:`-component grammar for a note's own `#color`
 * override (`ClassNote.color`) instead of re-deriving it, then promoted to
 * `core/` (T4, SI27 D1) once `state/state-render-colors.ts`'s
 * `resolveStateFill`/`resolveStateFillBucketed` picked up the SAME
 * extraction for `State.color` — three call sites across two engines
 * (class classifier/note, state) all resolving the identical grammar is
 * the shared-not-class-owned signal, matching D1's "upstream keeps it in
 * ONE place" placement rule even though upstream's one place happens to be
 * a shared PARSER class, not a diagram package. Upstream mirror:
 * `ColorParser.simpleColor(ColorType.BACK)` (klimt/color/ColorParser.java:
 * 70-76, `mainType` = `ColorType.BACK`) — `Classifier`'s, `ClassNote`'s and
 * `State`'s color decorations all run through the identical parser
 * (`CommandCreateClassMultilines`/`CommandFactoryNoteOnEntity`/
 * `CommandCreateState`'s own `color()` helper), so one extraction function
 * correctly serves all three engines.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorParser.java:70-76
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:95-124
 */

/**
 * G2 N31 (classifier) / G2 N34 (note) / mission G4 S2 (state): a bare token
 * (`#f00`) IS the background per `ColorParser`'s own `simpleColor(BACK)`
 * default (`Colors.java:100-103` — a token with no `:` and no `.` is put
 * under `mainType`, i.e. `ColorType.BACK`), a compound token
 * (`#back:blue;text:red`) needs its explicit `back:` part
 * (`Colors.java:105-115` — a `name:value` token is keyed by
 * `ColorType.getType(name)`, so only a `back:` name lands under
 * `ColorType.BACK`), and a LINECOLOR-only token (`##red`, no COLOR half)
 * carries no background at all — NOT because `Colors.java` special-cases
 * `##`, but because the grammar never hands it one: `##[style]color` is a
 * SEPARATE `LINECOLOR` capture group disjoint from the `COLOR` group
 * `color()`/`ColorParser.simpleColor` produces (`CommandCreateClassMulti
 * lines.java:115-118` — `color().getRegex()` then, independently, a
 * `RegexOptional(RegexConcat(new RegexLeaf("##"), LINECOLOR))`), so a
 * `geo.color`/`node.color` string that is `##red` ALONE (no space-joined
 * COLOR half) never reaches `ColorParser`/`Colors` as background input in
 * the first place — this function's `startsWith('##')` guard mirrors that
 * grammar-level exclusion at the TS layer, where both captures are joined
 * into one field (`class-declaration-extractors.ts#extractDecorations`'s
 * own doc comment). Returns `undefined` (caller falls back to its own
 * default) for every other compound part (`text:`/`line:`/`shadowing`) —
 * named remainder, not yet consumed by any render-side field (`Classifier
 * .color`'s, `ClassNote.color`'s and `State.color`'s own doc comments
 * repeat this caveat).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateClassMultilines.java:115-118
 */
export function resolveBareOrBackColor(color: string | undefined): string | undefined {
  if (color === undefined) return undefined;
  const colorToken = color.split(' ')[0];
  if (colorToken === undefined || colorToken.startsWith('##')) return undefined;
  if (!colorToken.includes(';') && !colorToken.includes(':')) return colorToken;
  const backMatch = /(?:^#|;)back:([^;]+)/i.exec(colorToken);
  return backMatch?.[1];
}
