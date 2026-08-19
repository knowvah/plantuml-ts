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
export function seaLineHeightAndSpan(
  entries: readonly { readonly altitude: number; readonly height: number }[],
): { readonly height: number; readonly maxSpan: number } {
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

/** One already-resolved atom's `{altitude, height}` -- pure function of its
 *  own `FontConfiguration.fontPosition`/`size`, no measurer needed (every
 *  `StringMeasurer` in this codebase already hardcodes `height === size` and
 *  `getDescent === size / 4.5` for a `FontSpec`, `measurer.ts`'s own four
 *  implementations). 0/0 for a non-`'text'` atom, matching {@link
 *  resolveMemberAtoms}'s identical altitude-0 treatment. */
function textAtomSeaEntry(atom: MemberRenderAtom): { readonly altitude: number; readonly height: number } {
  if (atom.kind !== 'text') return { altitude: 0, height: 0 };
  return {
    altitude: fontPositionSpace(atom.font.fontPosition ?? FontPosition.NORMAL),
    height: atomTextLineHeight(getFont(atom.font).size),
  };
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
 * sufficient (see {@link textAtomSeaEntry}). `lineHeight` is the CALLER's own
 * already-computed `NoteRow.height` (`noteLineHeight`'s return) -- passing a
 * different value than what sized the line would silently desync sizer and
 * renderer, so callers must reuse the SAME value, never recompute it here.
 */
export function noteLineAtomDy(atoms: readonly MemberRenderAtom[], lineHeight: number): readonly number[] {
  const entries = atoms.map(textAtomSeaEntry);
  // SI30 D2: TEXT-ONLY, same reasoning as `resolveMemberAtoms`'s own
  // `textEntries` filter -- an img/sprite/vector atom is positioned via its
  // own independent rule (`renderNoteLineAtoms`'s `legacyY`/bullet
  // branches never read `dy`), so it must not perturb a text sibling's
  // baseline through this reduction.
  const textEntries = entries.filter((_, i) => atoms[i]!.kind === 'text');
  const { maxSpan } = seaLineHeightAndSpan(textEntries);
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
