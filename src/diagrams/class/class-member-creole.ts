/**
 * class-member-creole.ts — routes ONE classifier member row's display text
 * through the shared creole atom engine (`core/klimt/creole/`, built for
 * description by mission E2r) instead of drawing it as a single plain
 * `<text>` element.
 *
 * Upstream mirror: `cucadiagram/MethodsOrFieldsArea#createTextBlock` (java
 * :238-267) builds EVERY member row via `Display.getWithNewlines(pragma,
 * s).create8(config, align, skinParam, CreoleMode.SIMPLE_LINE,
 * style.wrapWidth())` — the SAME `Display`/creole machinery
 * `EntityImageDescription` uses for entity labels (`CreoleMode.FULL`), just a
 * narrower mode. `CreoleMode.SIMPLE_LINE` differs from `FULL` ONLY by
 * skipping the `*`-bullet-list and `#`-heading patterns
 * (`CreoleStripeSimpleParser.java:119-147`, both gated `if (mode ==
 * CreoleMode.FULL)`) — this port's own `classifyStripeLine` never ported
 * those two patterns for EITHER mode (zero known reach, `CreoleStripeSimple
 * Parser.ts`'s own doc comment), so reusing the description engine's exact
 * classify/build functions here reproduces `SIMPLE_LINE` semantics exactly,
 * with no new parsing logic needed — "REUSE the engine, don't re-port" per
 * this iteration's own charter.
 *
 * What's DIFFERENT from `core/svek/image/EntityImageDescriptionSupport.ts
 * #buildTextBlock` (description's own adapter over the same shared engine):
 * class's renderer is a pure-string SVG builder (`core/svg.ts`), not klimt's
 * `UGraphic`/`StringBounder`/`TextBlock` object model — so this file is a
 * SECOND, structurally different adapter over the SAME shared atom
 * primitives (`classifyStripeLine`, `buildStripeAtoms`, `buildLiteralAtoms`,
 * `measureInlineAtom`), matching the CLAUDE.md instruction to build a
 * class-local seam rather than force class onto klimt's drawing model.
 *
 * Physical lines (A2s F-B B5): upstream routes every member row through
 * `Display.getWithNewlines` (MethodsOrFieldsArea.java:255,264), which
 * splits at literal backslash-n/-r/-l escapes BEFORE creole classification
 * — {@link splitMemberDisplayLines} ports that splitter and
 * {@link buildWrappedMemberRows} applies it (one `MemberRowBuild` per
 * physical line); {@link buildMemberRow} (the body-tree/enhanced-body
 * single-row-per-cell entry point) does NOT split. Jar evidence:
 * julixi-10-jide878, rulite-35-muno361.
 *
 * Measurement-identity guarantee (mission HARD BOUNDARY): for a row with NO
 * creole markup, `classifyStripeLine` returns `{type:'NORMAL', content:
 * text}` (content === the untouched input) and `buildStripeAtoms` -- when it
 * recognizes no command/atom anywhere in the line -- returns EXACTLY one
 * `{kind:'text', text, font}` atom carrying that same untouched string
 * (`StripeSimple.ts#StripeAtomBuilder#modifyStripe`: every character with no
 * command/atom match accumulates into `pending`, flushed as ONE atom at EOL).
 * `measureMemberAtoms` then measures that lone atom with `measurer.measure
 * (text, {family, size})` -- byte-identical to the pre-cutover
 * `measurer.measure(text, fontSpec).width` call this file's callers replace.
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { FontPosition, fontPositionSpace } from '../../core/klimt/font/FontPosition.js';
import { mutedAtomFontSpec, seaLineHeightAndSpan, textAtomDy } from './class-member-creole-sea.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';
import { splitMemberDisplayLines } from './class-member-display.js';
import {
  resolveEmojiAtom,
  resolveInlineAtom,
  resolveLatexAtom,
  resolveOpenIconicAtom,
  type ResolvedMemberAtom,
} from './class-member-atom-resolve.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import { classifyStripeLine } from '../../core/klimt/creole/legacy/CreoleStripeSimpleParser.js';
import {
  buildStripeAtoms,
  buildLiteralAtoms,
  fontConfigurationForHeading,
} from '../../core/klimt/creole/legacy/StripeSimple.js';
import { type SpriteDimsLookup } from '../../core/creole-atoms.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import { manageGuillemet } from '../../core/text/Guillemet.js';
import { textRenderOverride, resolveTabbedTextRuns } from './class-member-creole-render-text.js';

export type { MemberRenderAtom, MemberRowBuild } from './class-member-render-atom.js';
import type { MemberRenderAtom, MemberRowBuild } from './class-member-render-atom.js';

/**
 * The base `FontConfiguration` a member row's creole build starts from --
 * `color: null` (renders as the classifier box's own hardcoded `#000000`
 * default, `renderer-classifier-box.ts#renderRowText`'s existing rule,
 * unless a `<color:...>` command overrides it) plus upstream's own
 * member-level modifier styling (`MethodsOrFieldsArea#createTextBlock`,
 * java :249-253): `{abstract}` -> italic, `{static}` -> underline. Both
 * fields are parsed onto every `Member` already (`class-member-parser.ts
 * #stripModifiers`) but were never consumed by rendering before this
 * mission -- a THIRD, smaller dead-field gap discovered while building this
 * file's font-configuration seam, landed alongside the primary creole-atom
 * mechanism since it shares the exact same code path.
 */
export function memberBaseFont(
  fontSpec: {
    readonly family: string;
    readonly size: number;
    /** G2 N32: `skinparam classAttributeFontStyle` -- forces BOLD/ITALIC
     *  onto EVERY member row's base font, independent of (unioned with) the
     *  per-member `{abstract}`/`{static}` modifiers below -- see
     *  `theme.ts#classAttributeFontBold`'s doc comment. Absent for every
     *  classifier with no such skinparam override (zero behavior change). */
    readonly bold?: boolean;
    readonly italic?: boolean;
  },
  member: { readonly isAbstract?: boolean; readonly isStatic?: boolean },
): FontConfiguration {
  const styles = new Set<FontStyle>();
  if (member.isAbstract === true || fontSpec.italic === true) styles.add(FontStyle.ITALIC);
  if (member.isStatic === true) styles.add(FontStyle.UNDERLINE);
  if (fontSpec.bold === true) styles.add(FontStyle.BOLD);
  // cdd-B7FU-R1: upstream seeds the two INDEPENDENTLY. `FontConfiguration
  // #create(UFont, …)` bakes the skinparam's weight/slant into `styles` via
  // `getStyles(font)` (`FontConfiguration.java:65-73`, reading
  // `font.getFontFace().isBold()/isItalic()`) while `currentFont` — hence
  // `getFontFace()` — keeps that same face in its own right. Only the FIRST
  // is clearable: `add(FontStyle.PLAIN)` (java:301-309) clears `styles` and
  // passes `currentFont` through, which is why `<plain>` cannot unbold a
  // `skinparam classFontStyle bold` header (`diseka-11-gozu390`, journal
  // rows 119-121). The ITALIC seed is the same `isItalic()` half of that
  // face; `{abstract}`/`{static}` are per-MEMBER creole-level styles, not
  // face properties, so they stay out of it.
  const fontFace = { cssWeight: fontSpec.bold === true ? 700 : 400, italic: fontSpec.italic === true };
  return { family: fontSpec.family, size: fontSpec.size, color: null, styles, fontFace };
}

/**
 * Classify + build one member row's flat `CreoleAtom` sequence -- the
 * class-side mirror of `EntityImageDescriptionSupport.ts`'s private
 * `buildLine` helper (not reused directly: that function also handles the
 * `HORIZONTAL_LINE` classification by returning `atoms: []` for its
 * caller's separate separator-drawing branch, a description-only concept
 * with no member-row analogue).
 */
export function buildMemberAtoms(text: string, font: FontConfiguration): readonly CreoleAtom[] {
  // A4 4: `manageGuillemet` runs on EVERY creole line upstream, before
  // classification (`CreoleParser.java:175-176`: `createStripes(skinParam
  // .guillemet().manageGuillemet(cs.toString()), …)`) -- this port's
  // member-row seam skipped it entirely, so a `<<Name>>` role/stereotype
  // marker in member text never became `«Name»` (padapo-73-beke177). No
  // skinparam-guillemet threading here (matches this seam's existing
  // no-`skinParam`-parameter shape) -- `manageGuillemet`'s own default
  // param is upstream's `Guillemet.GUILLEMET` default pair, the correct
  // fallback absent a `skinparam guillemet` override.
  const managed = manageGuillemet(text);
  const cls = classifyStripeLine(managed);
  if (cls.type === 'NORMAL') return buildStripeAtoms(cls.content, font);
  if (cls.type === 'HEADING') return buildStripeAtoms(cls.content, fontConfigurationForHeading(font, cls.order));
  if (cls.type === 'LITERAL') return buildLiteralAtoms(cls.content, font);
  // HORIZONTAL_LINE: a member row shaped EXACTLY like a bare `----`/`====`/
  // `....` separator (empty capture) has no MethodsOrFieldsArea analogue --
  // that shape only exists for description's block-level separator stripe.
  // Zero corpus reach for a class member declaration (grep-verified); fall
  // back to ONE plain atom of the untouched (guillemet-managed) text so
  // this unreachable-in-practice case still measures/renders exactly as it
  // did before this mission, rather than silently losing the text.
  return [{ kind: 'text', text: managed, font }];
}

/** Bundled resolver inputs -- {@link resolveAtomEntries}'s own params would
 *  otherwise exceed this project's per-function param cap (mirrors
 *  `SectionRowContext`'s identical rationale in `class-member-rows.ts`). */
interface ResolveContext {
  readonly baseFont: FontConfiguration;
  readonly measurer: StringMeasurer;
  readonly sprites: SpriteRegistry | undefined;
  readonly spriteDims: SpriteDimsLookup | undefined;
  readonly expandTabs: boolean;
}

/** One input `CreoleAtom` resolved to ZERO OR MORE `ResolvedMemberAtom`s --
 *  zero for an atom that contributes nothing (dropped sprite/latex), one for
 *  the common case, or several for a tab-bearing `'text'` atom under
 *  `ctx.expandTabs` (T26, {@link resolveTabbedTextRuns}'s own doc comment).
 *  Factored out of {@link resolveMemberAtoms} purely to keep that function's
 *  own NLOC/CCN under this project's complexity cap. */
function resolveAtomEntries(atom: CreoleAtom, ctx: ResolveContext): readonly ResolvedMemberAtom[] {
  if (ctx.expandTabs && atom.kind === 'text') {
    const many = resolveTabbedTextRuns(atom.text, atom.font, atom.url, ctx.measurer);
    if (many !== undefined) return many;
  }
  const single = resolveOneAtom(atom, ctx.baseFont, ctx.measurer, ctx.sprites, ctx.spriteDims);
  return single === undefined ? [] : [single];
}

/**
 * Resolves a raw `CreoleAtom[]` (from `buildMemberAtoms`) into render-ready
 * `MemberRenderAtom[]` + their summed width -- text atoms measure via the
 * SAME `StringMeasurer` every other class text measurement uses; inline
 * (img/sprite) atoms resolve via {@link resolveInlineAtom} when a
 * `SpriteRegistry` is supplied (`ast.sprites` -- `undefined` for a diagram
 * with no `sprite` definitions at all); a `latex` atom resolves to the image
 * `AtomMath` measures and draws (see `MemberRenderAtom`'s own doc comment).
 */
/** {@link resolveMemberAtoms}'s per-atom accumulation loop, factored out
 *  purely to keep that function's own NLOC under this project's complexity
 *  cap (T26 added the inner {@link resolveAtomEntries} fan-out). */
function accumulateResolvedAtoms(
  atoms: readonly CreoleAtom[],
  ctx: ResolveContext,
): { rendered: MemberRenderAtom[]; heightEntries: { altitude: number; height: number }[]; width: number } {
  const rendered: MemberRenderAtom[] = [];
  // SI30 D2/D3: each kept atom's own `{altitude, height}` for the line's
  // `Sea` reduction (`seaLineHeightAndSpan`). Altitude is 0 for every
  // non-`'text'` atom and for a `'text'` atom with no `FontPosition` (or
  // NORMAL) -- the pre-SI30 flat-MAX height this reduces to when no
  // `<sup>`/`<sub>` shares the line.
  const heightEntries: { altitude: number; height: number }[] = [];
  let width = 0;
  for (const atom of atoms) {
    for (const resolved of resolveAtomEntries(atom, ctx)) {
      rendered.push(resolved.atom);
      width += resolved.width;
      const altitude =
        resolved.atom.kind === 'text' ? fontPositionSpace(resolved.atom.font.fontPosition ?? FontPosition.NORMAL) : 0;
      heightEntries.push({ altitude, height: resolved.lineHeight });
    }
  }
  return { rendered, heightEntries, width };
}

export function resolveMemberAtoms(
  atoms: readonly CreoleAtom[],
  baseFont: FontConfiguration,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
  // T26 (gekope-01-ricu859): opt-in tab-stop expansion
  // (`class-member-creole-render-text.ts#resolveTabbedTextRuns`) -- default
  // OFF so `class-object-member-creole.ts#buildObjectMemberRow` (the ONE
  // other caller of this shared function that ALREADY re-tokenizes a
  // tab-bearing atom itself, with its own skinparam-tabSize-aware stop) and
  // `class-map-sizing.ts`/`class-json-sizing.ts`/`note-layout-measure*.ts`
  // (untouched by this mission) keep their exact pre-existing behavior.
  // `buildMemberRow`/`buildWrappedMemberRows` -- the CLASS engine's own two
  // entry points, which have no tab handling of their own -- opt in.
  expandTabs = false,
): MemberRowBuild {
  const ctx: ResolveContext = {
    baseFont,
    measurer,
    sprites,
    spriteDims: sprites !== undefined ? spriteDimsLookupFor(sprites) : undefined,
    expandTabs,
  };
  const { rendered, heightEntries, width } = accumulateResolvedAtoms(atoms, ctx);
  const { height } = seaLineHeightAndSpan(heightEntries);
  // SI30 D2: `dy`'s own `maxSpan` reduction is TEXT-ONLY -- an img/sprite/
  // vector atom is drawn via its own INDEPENDENT placement rule
  // (`renderer-classifier-rows.ts#renderRowAtoms`'s image/vector branches
  // never read `dy`), never through the text-baseline `Sea` stack, so a
  // tall icon sharing a row must not perturb its text siblings' baseline
  // (jar-verified regression: `rotisi-30-loge424`/`cuzoga-39-tufu259`'s
  // `<&x{scale=2.25}> someBadField`-shaped rows moved when the FULL
  // (all-kind) `maxSpan` was used, `<sup>`/`<sub>`-free). The row's own
  // `height` above still uses every kind (correct, DOT-parity-verified);
  // only the per-atom `top` computation is restricted.
  const textEntries = heightEntries.filter((_, i) => rendered[i]!.kind === 'text');
  const { maxSpan: textMaxSpan } = seaLineHeightAndSpan(textEntries);
  // SI30 D2: `dy` corrects against the ROW's own pre-existing baseline
  // reference (`baseFont`, a per-classifier constant), NOT this line's own
  // `Sea` height -- see `textAtomDy`'s own doc comment for why the two
  // diverge and which one member rows need.
  const withDy = rendered.map((atom, i) => {
    if (atom.kind !== 'text') return atom;
    const dy = textAtomDy(atom, heightEntries[i]!, textMaxSpan, baseFont, measurer);
    return { ...atom, dy };
  });
  return { atoms: withDy, width, height };
}

/** One loop-body iteration of {@link resolveMemberAtoms} -- factored out to
 *  keep that function's own NLOC/CCN under this project's complexity cap.
 *  Returns `undefined` for an atom that contributes nothing (an unresolved
 *  sprite name, or a dropped `latex` atom). */
// CDD B7FU-R2 item (d): exported (was private) -- `class-layout-header-
// creole.ts#buildWrappedHeaderLine` needs the SAME per-atom width
// callback `buildWrappedMemberRows` below passes to `getSplitted`, to
// wrap a classifier NAME line through the real creole/sprite atom
// pipeline instead of a synthetic plain-text stand-in (see that
// function's own doc comment).
export function resolveOneAtom(
  atom: CreoleAtom,
  baseFont: FontConfiguration,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
  spriteDims: SpriteDimsLookup | undefined,
): ResolvedMemberAtom | undefined {
  if (atom.kind === 'emoji') return resolveEmojiAtom(atom);
  if (atom.kind === 'text') {
    // SI30 D1: measure at the EFFECTIVE (muted) size -- `getFont(atom.font)`
    // shrinks a `<sup>`/`<sub>` run by 3 (floor 2) before either the layout
    // width or the drawn glyph sees it; identical to the pre-SI30
    // `atomFontSpec` for every NORMAL run.
    const spec = mutedAtomFontSpec(atom.font);
    const width = measurer.measure(atom.text, spec).width;
    // A4 2a / G2 N57 item 38: `DriverTextSvg.java:112-125`'s RENDER-time
    // text override (NBSP for whitespace-only, leading-space-strip + `trin`
    // for mixed) -- see `class-member-creole-render-text.ts
    // #textRenderOverride`'s own doc comment for the full derivation and
    // why it is gated off a raw tab. `width` above (the LAYOUT value) stays
    // the RAW measurement always -- see `MemberRenderAtom`'s own doc
    // comment for why that is correct, not a bug.
    const renderText = textRenderOverride(atom.text);
    const renderWidth = renderText !== undefined ? measurer.measure(renderText, spec).width : undefined;
    // Per-atom width stored on the atom itself (not just summed into the row
    // total) so `renderer-classifier-box.ts` can emit each atom's OWN
    // `<text textLength>` and x-advance -- matches jar's real one-`<text>`-
    // per-styled-run SVG output (this file's module doc comment). `font`
    // stays the atom's UNMUTED `FontConfiguration` (D1: mute at read time,
    // never eagerly) -- `dy` is filled in by `resolveMemberAtoms`'s own
    // Sea pass below, after every atom on the line is known.
    return {
      atom: {
        kind: 'text',
        text: atom.text,
        font: atom.font,
        width,
        ...(renderText !== undefined ? { renderText, renderWidth: renderWidth! } : {}),
        ...(atom.url !== undefined ? { url: atom.url } : {}),
      },
      width,
      lineHeight: atomTextLineHeight(spec.size),
    };
  }
  if (atom.kind === 'inline') {
    if (atom.atom.kind === 'openiconic') {
      const resolved = resolveOpenIconicAtom(atom.atom, atom.ambientFont, baseFont);
      return resolved === undefined
        ? undefined
        : { atom: resolved, width: resolved.width, lineHeight: resolved.height };
    }
    const resolved = resolveInlineAtom(atom.atom, baseFont, sprites, spriteDims);
    return resolved === undefined ? undefined : { atom: resolved, width: resolved.width, lineHeight: resolved.height };
  }
  // 'latex': `AtomMath`, a measured+drawn image at altitude 0 -- see
  // `resolveLatexAtom`'s own doc comment. Anything else contributes nothing.
  // #lizard forgives -- pre-existing 5 PARAM/35 NLOC (unchanged by A2s F-B).
  return atom.kind === 'latex' ? resolveLatexAtom(atom) : undefined;
}

/** One-stop build for a member row: classify + build + resolve + measure --
 *  the function `class-member-rows.ts#buildSectionRows`/`sectionWidth`'s
 *  shared precompute pass calls once per member (see those functions' own
 *  doc comments for why the result is computed ONCE and reused for both the
 *  section max-width scan and the stored row). */
export function buildMemberRow(
  text: string,
  member: { readonly isAbstract?: boolean; readonly isStatic?: boolean },
  fontSpec: { readonly family: string; readonly size: number; readonly bold?: boolean; readonly italic?: boolean },
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): MemberRowBuild {
  const font = memberBaseFont(fontSpec, member);
  const atoms = buildMemberAtoms(text, font);
  // T26: the CLASS engine's own entry point opts into tab-stop expansion --
  // see `resolveMemberAtoms`'s own `expandTabs` param doc comment.
  return resolveMemberAtoms(atoms, font, measurer, sprites, true);
}

/**
 * G2 N65 item 35: word-wraps ONE member row into ONE OR MORE
 * `MemberRowBuild`s via the SAME Fission engine E2r built for description
 * word-wrap (`Fission.ts#getSplitted`, "REUSE the engine, don't re-port" --
 * this file's own doc comment) -- upstream mirror:
 * `MethodsOrFieldsArea#createTextBlock` (java:255-256/264-265) passes
 * `style.wrapWidth()` (`Style#wrapWidth`, `PName.MaximumWidth` resolved
 * against `EntityImageClass.getStyleSignature()` == `{root,element,
 * classDiagram,class_}` -- the SAME `CLASS_SNAMES` signature `style-cascade-
 * class.ts` already uses for `RoundCorner`) into the SAME `Display#create8`
 * call `buildMemberAtoms` mirrors -- so a member row wraps at WORD
 * boundaries exactly like a description body line, operating on the row's
 * OWN already-built `CreoleAtom[]` (not a synthetic single-text atom -- a
 * `**bold**`-marked member line's bold run stays a distinct atom through the
 * wrap, matching `nucite-98-kuga991`'s own `**Method()**` reach target).
 * `maxWidth<=0` (no `MaximumWidth` cascade in effect -- the overwhelming
 * majority of classifiers) short-circuits to the SAME single-row result
 * {@link buildMemberRow} returns, byte-identical (zero behavior change).
 *
 * The Fission `measureAtomWidth` callback reuses {@link resolveOneAtom}
 * directly (not a second, parallel width formula) -- it is already the
 * single source of truth for "how wide does this raw `CreoleAtom` render",
 * and calling it here (pre-wrap, measurement-only) is cheap and cannot
 * drift from the SAME call `resolveMemberAtoms` makes per wrapped sub-line
 * just below (a sprite/openiconic atom resolves identically both times --
 * these resolvers are pure functions of their inputs).
 */
export function buildWrappedMemberRows(
  text: string,
  member: { readonly isAbstract?: boolean; readonly isStatic?: boolean },
  fontSpec: { readonly family: string; readonly size: number; readonly bold?: boolean; readonly italic?: boolean },
  measurer: StringMeasurer,
  maxWidth: number,
  sprites?: SpriteRegistry,
): readonly MemberRowBuild[] {
  const font = memberBaseFont(fontSpec, member);
  const rows: MemberRowBuild[] = [];
  // B5: getWithNewlines splits FIRST (MethodsOrFieldsArea.java:255,264).
  for (const line of splitMemberDisplayLines(text)) {
    const atoms = buildMemberAtoms(line, font);
    if (maxWidth <= 0) {
      // T26: opt into tab-stop expansion (`resolveMemberAtoms`'s own
      // `expandTabs` param doc comment).
      rows.push(resolveMemberAtoms(atoms, font, measurer, sprites, true));
      continue;
    }
    const spriteDims: SpriteDimsLookup | undefined = sprites !== undefined ? spriteDimsLookupFor(sprites) : undefined;
    const wrappedLines = getSplitted(
      atoms,
      maxWidth,
      (a) => resolveOneAtom(a, font, measurer, sprites, spriteDims)?.width ?? 0,
    );
    for (const lineAtoms of wrappedLines) rows.push(resolveMemberAtoms(lineAtoms, font, measurer, sprites, true));
  }
  // #lizard forgives -- pre-existing 6 PARAM (unchanged by A2s F-B).
  return rows;
}

// A2s R2i: `splitMemberDisplayLines`/`atomsToPlainText` moved to
// ./class-member-display.ts (500-line cap) -- re-exported so every
// pre-existing import site keeps working unchanged.
export { splitMemberDisplayLines, atomsToPlainText } from './class-member-display.js';
