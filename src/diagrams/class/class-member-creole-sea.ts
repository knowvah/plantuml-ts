/**
 * class-member-creole-sea.ts — the `Sea`-placement math `class-member-
 * creole.ts#resolveMemberAtoms` consumes (SI30 `decisions.md#D2/#D3`), split
 * out purely to keep that file under the project's 500-line cap (same
 * precedent as `class-member-display.ts`'s own module doc comment: "moved to
 * ... 500-line cap -- re-exported so every pre-existing import site keeps
 * working unchanged").
 *
 * `core/svek/image/creole-sea-line.ts` already ports the general form of
 * this (`layoutLineThroughSea`/`measurerSeaLineOps`, driving the real `Sea`
 * class over every `Atom#getStartingAltitude` kind: text, emoji, inline,
 * latex). This module is a DELIBERATELY narrower, closed-form
 * specialization for the class engine: altitude is 0 for every atom EXCEPT
 * a `'text'` one carrying a non-NORMAL `FontPosition` -- `decisions.md#D2`'s
 * literal scope ("Text atoms report the getStartingAltitude"). Emoji/image/
 * vector/bullet atoms keep the class engine's PRE-SI30 altitude-0 treatment
 * unchanged (member rows never threaded emoji's own `-3*factor` altitude
 * before this mission, and note rows explicitly excluded 'vector' pending
 * verification, `note-layout-measure-rows.ts#noteLineHeight`'s own doc
 * comment) -- reusing the general `Sea` class here would silently widen that
 * scope as an unrequested side effect. For an all-NORMAL line every
 * atom's altitude is 0 and this reduces to the identical flat-MAX height /
 * zero-dy behavior every consumer already had, so adopting it is additive.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/Sea.java:72-91
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:213-215,321-323
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle, getFont } from '../../core/klimt/shape/UText.js';
import { FontPosition, fontPositionSpace } from '../../core/klimt/font/FontPosition.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';

/** The atom's own DECLARED (unmuted) font spec -- `family`/`weight`/`style`
 *  plus the `FontConfiguration`'s raw `size` (`D1`: never eagerly muted). */
export function atomFontSpec(font: FontConfiguration): FontSpec {
  return {
    family: font.family,
    size: font.size,
    ...(font.styles.has(FontStyle.BOLD) ? { weight: 'bold' as const } : {}),
    ...(font.styles.has(FontStyle.ITALIC) ? { style: 'italic' as const } : {}),
  };
}

/** SI30 D1: the atom's EFFECTIVE (muted) font spec -- `getFont(fc)`
 *  (`FontConfiguration.java:98-104`) shrinks a `<sup>`/`<sub>` run by 3
 *  (floor 2) before either measurement or drawing sees it; identical to
 *  {@link atomFontSpec} for every NORMAL run. This is what the sizer must
 *  measure and the renderer must draw at -- the "SAME numbers" this task's
 *  own acceptance criteria name. */
export function mutedAtomFontSpec(font: FontConfiguration): FontSpec {
  return { ...atomFontSpec(font), size: getFont(font).size };
}

/** SI30 D2/D3: `Sea`'s height reduction for one already-resolved line,
 *  algebraically closed-formed from `Sea.java:72-91` (`doAlign` sets each
 *  atom's top to `altitude - height`, `translateMinYto(0)` then shifts every
 *  position by `max(height - altitude)` so the least top lands at 0, and
 *  `getHeight` is the resulting `maxY - minY`) -- `max(altitude) +
 *  max(height - altitude)`. `maxSpan` (the shift `translateMinYto` applies)
 *  is returned alongside `height` because {@link textAtomDy} needs it too;
 *  keeping both in one pass avoids computing the reduction twice. Entries
 *  are never empty in practice (`buildStripeAtoms`'s own "empty stripe -> one
 *  space atom" fallback), but an all-unresolved line (implausible) falls
 *  back to the pre-SI30 default of 0. */
export function seaLineHeightAndSpan(entries: readonly { readonly altitude: number; readonly height: number }[]): {
  readonly height: number;
  readonly maxSpan: number;
} {
  if (entries.length === 0) return { height: 0, maxSpan: 0 };
  let maxAltitude = -Infinity;
  let maxSpan = -Infinity;
  for (const e of entries) {
    if (e.altitude > maxAltitude) maxAltitude = e.altitude;
    const span = e.height - e.altitude;
    if (span > maxSpan) maxSpan = span;
  }
  return { height: maxAltitude + maxSpan, maxSpan };
}

/**
 * SI30 D2/D3: one text atom's baseline correction -- `dy = baseline -
 * reference`, `baseline = top + drawHeight - descent`, `top = altitude -
 * height + maxSpan` (the atom's own final `Sea` position, the closed-form
 * specialization of `core/svek/image/creole-sea-line.ts#layoutLineThroughSea`
 * for this engine's text-only altitude scope, see this module's own doc
 * comment). `descent`/`drawHeight` are measured at the EFFECTIVE (muted)
 * size (`AtomText#drawU`, `AtomText.java:213-215`).
 *
 * `reference` is `class-member-rows.ts#buildSectionRows`'s own PRE-EXISTING
 * `row.y` baseline (`class-object-map-header.ts#baselineOffsetFor`:
 * `baseFont.size - descent(baseFont.size)`) -- a CONSTANT for the whole
 * row, derived from the row's own base font, NOT this line's `Sea` height.
 * This is the load-bearing difference from `renderer-note.ts`'s sibling
 * formula: a note's pre-existing baseline genuinely tracks its OWN line's
 * `Sea` height (`note-layout-measure-rows.ts#noteLineHeight`'s per-line
 * value, threaded into `NoteRow.height`), so `dy` there corrects against
 * that per-line height; a member row's pre-existing baseline is a flat
 * per-CLASSIFIER constant that never varied with row content, so `dy` here
 * must correct against THAT constant instead -- reusing the `Sea`-height
 * reference (as an earlier draft of this function did) silently reintroduced
 * a wrong offset on every row containing a `<sup>`/`<sub>` run, jar-verified
 * wrong against `exposant-01-class`'s `x<sup>2</sup>`/`H<sub>2</sub>O` member
 * rows (own `in.svg`/`svek-1.dot` golden). `decisions.md#D2`'s "must not be
 * applied twice" rule holds either way: whichever reference the renderer's
 * OWN pre-existing formula uses is the one `dy` must correct against.
 */
export function textAtomDy(
  atom: Extract<MemberRenderAtom, { kind: 'text' }>,
  entry: { readonly altitude: number; readonly height: number },
  maxSpan: number,
  baseFont: FontConfiguration,
  measurer: StringMeasurer,
): number {
  const mutedSpec = mutedAtomFontSpec(atom.font);
  const top = entry.altitude - entry.height + maxSpan;
  const drawHeight = measurer.measure(atom.text, mutedSpec).height;
  const descent = measurer.getDescent(mutedSpec, atom.text);
  const baseline = top + drawHeight - descent;
  const baseSpec = atomFontSpec(baseFont);
  const reference = baseSpec.size - measurer.getDescent(baseSpec, atom.text);
  return baseline - reference;
}

/**
 * cdd3-T22 (E1-3/E2-3): a NON-text atom's own `Sea` box top, expressed
 * against the SAME row reference {@link textAtomDy} corrects against
 * (`class-object-map-header.ts#baselineOffsetFor`: `size - descent`), so the
 * renderer draws it at `rowBaseline + dy` exactly as it draws text.
 * `top = altitude - height + maxSpan` is `Sea#doAlign` then
 * `translateMinYto(0)` (`Sea.java:72-89`), the position
 * `SheetBlock1#drawU` translates the `UGraphic` to before `Atom#drawU`
 * (`SheetBlock1.java:212-217`); `AtomOpenIconic#drawU` paints its glyph
 * from that corner (`AtomOpenIconic.java:76-83`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Sea.java:72-89
 */
export function atomTopDy(
  entry: { readonly altitude: number; readonly height: number },
  maxSpan: number,
  baseFont: FontConfiguration,
  measurer: StringMeasurer,
): number {
  const baseSpec = atomFontSpec(baseFont);
  const reference = baseSpec.size - measurer.getDescent(baseSpec, '');
  return entry.altitude - entry.height + maxSpan - reference;
}

/**
 * lozego-15-coci435 (T13r residual, journal row 24): one already-resolved
 * atom's `{altitude, height}` FOR THE NOTE ENGINE'S OWN `Sea` reduction --
 * `text` + `image` counted (altitude 0 either way; height `atomTextLineHeight
 * (size)`/`atom.height`), matching `note-layout-measure-rows.ts
 * #noteLineHeight`'s OWN inclusion set EXACTLY (that function already counts
 * an `'image'` atom's raw height at altitude 0 -- `AtomImg`/`AtomSprite`'s
 * `getStartingAltitude == 0`, java-cited there). 0/0 for every other kind
 * (`'vector'`/`'bullet'`), same excluded set `noteLineHeight` itself
 * documents (vector pending verification, bullet capped under the text row).
 *
 * This function REPLACES the pre-fix inline reduction {@link noteLineAtomDy}
 * used to build (altitude-0-HEIGHT-0 for every non-`'text'` atom, image
 * included) -- that reduction had exactly ONE caller (this module's own
 * `noteLineAtomDy`; grep-verified zero other references anywhere in `src/`),
 * so "member-row-shaped" was this formula's INTENDED future shape, not an
 * actual shared consumer this fix had to protect. Mechanism (lozego's
 * `<$test>Note on rel`, a 100px sprite atom sharing a line with 13px text):
 * `noteLineHeight` correctly sizes the ROW at 100 (image included) and
 * `lineHeight` carries that in; but the pre-fix reduction reported the SAME
 * sprite atom as height 0, so the text-only `maxSpan` it computed was 13,
 * not 100 -- the text atom's own `top`/`baseline` came out as though it were
 * alone on a 13px line, then `dy = baseline - reference` (reference built
 * from the REAL 100px `lineHeight`) was a large NEGATIVE correction that
 * pulled the drawn text back up near the line's TOP instead of leaving it at
 * the bottom of the sprite (jar: text baseline sits at the bottom of the
 * tallest atom on the line, `Sea.java:72-91`'s `translateMinYto` shifts
 * every atom by the SAME amount, so a short text atom's own bottom edge
 * lands on the line's shared bottom). Hand-verified against the golden
 * (`oracle/goldens/class/lozego-15-coci435/`): pre-fix `dy = 10.111 -
 * 97.111 = -87.0`, `y = lineTop + 100 - 2.889 - 87.0 = lineTop + 10.111`
 * (act `262.803` -> `lineTop = 252.692`); with `dy = 0` (this fix), `y =
 * lineTop + 100 - 2.889 = lineTop + 97.111 = 349.803`, matching the jar's
 * `349.801` to within float rounding.
 */
function noteAtomSeaEntry(atom: MemberRenderAtom): { readonly altitude: number; readonly height: number } {
  if (atom.kind === 'text') {
    return {
      altitude: fontPositionSpace(atom.font.fontPosition ?? FontPosition.NORMAL),
      height: atomTextLineHeight(getFont(atom.font).size),
    };
  }
  if (atom.kind === 'image') return { altitude: 0, height: atom.height };
  return { altitude: 0, height: 0 };
}

/**
 * SI30 D2/D3, note engine: per-atom `dy` against a NOTE's own pre-existing
 * reference -- `renderer-note.ts#renderNoteLineAtoms`'s `lineTop + lineHeight
 * - atom.font.size / 4.5` (the atom's OWN UNMUTED size, and the LINE's own
 * `Sea` height, `note-layout-measure-rows.ts#noteLineHeight`'s per-line
 * value) -- the SAME `baseline - reference` shape {@link textAtomDy} uses,
 * with a DIFFERENT reference (see that function's own doc comment for why
 * notes and members cannot share one: a note's reference genuinely tracks
 * its own line's `Sea` height; a member row's does not). Consumes only
 * `MemberRenderAtom[]` (no raw `CreoleAtom`, no `StringMeasurer` -- the note
 * render path has neither in scope) because `FontPosition`/`size` alone are
 * sufficient (see {@link noteAtomSeaEntry}). `lineHeight` is the CALLER's own
 * already-computed `NoteRow.height` (`noteLineHeight`'s return) -- passing a
 * different value than what sized the line would silently desync sizer and
 * renderer, so callers must reuse the SAME value, never recompute it here.
 */
export function noteLineAtomDy(atoms: readonly MemberRenderAtom[], lineHeight: number): readonly number[] {
  const entries = atoms.map(noteAtomSeaEntry);
  // SI30 D2 / lozego-15 fix: the REDUCTION (`maxSpan`) below must see every
  // atom `noteLineHeight` itself counted (text + image, {@link
  // noteAtomSeaEntry}'s own doc comment) so it stays consistent with the
  // CALLER's `lineHeight` -- but only a `'text'` atom is positioned through
  // this correction at all; an img/sprite/vector atom draws via its own
  // independent rule (`renderNoteLineAtoms`'s `legacyY`/bullet branches
  // never read `dy`), so the RETURNED array stays 0 for every non-text kind.
  const { maxSpan } = seaLineHeightAndSpan(entries);
  return atoms.map((atom, i) => {
    if (atom.kind !== 'text') return 0;
    const entry = entries[i]!;
    const top = entry.altitude - entry.height + maxSpan;
    const mutedSize = getFont(atom.font).size;
    const baseline = top + mutedSize - mutedSize / 4.5;
    const reference = lineHeight - atom.font.size / 4.5;
    return baseline - reference;
  });
}
