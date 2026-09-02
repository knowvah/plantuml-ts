/**
 * sequence-creole.ts — routes ONE sequence display line through the shared
 * creole atom engine (`core/klimt/creole/`) instead of drawing it as a single
 * plain `<text>`, producing the placed, measured `TextRun[]` the sequence
 * geometry already carries.
 *
 * ## Upstream mirror
 *
 * Every label a sequence component draws is built by one constructor:
 *
 * ```java
 * final FontConfiguration fc = getFontConfiguration();
 * ...
 * textBlock = display.create0(fc, horizontalAlignment, skinParam, maxMessageSize,
 *         CreoleMode.FULL, fontForStereotype, htmlColorForStereotype,
 *         padding.getLeft(), padding.getRight());
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:80-92
 *
 * `create0` is `Display` -> `Creole` -> `Stripe` -> `Atom`: one `Atom` per
 * styled run, and `DriverTextSvg#draw` emits ONE `<text>` for each, advancing
 * x by the run's own measured width. There is no `<tspan>` anywhere on that
 * path (jar-verified, `object/linazi-45-gevo553`). So the shape this module
 * produces — a flat, left-to-right array of independently styled, measured
 * runs — is upstream's own emitted shape, not an approximation of it.
 *
 * ## Why the engine is reused rather than re-ported (D1, stop condition 8)
 *
 * `Display.create0` -> `TextBlock` -> `UGraphic` is the literal port, and it
 * is rejected: a `TextBlock`'s contract is `drawU(ug: UGraphic)`, and this
 * engine renders SVG strings through `core/svg.ts`, not through `UGraphic`.
 * Adopting `UGraphic` here would bypass the `sequenceText` seam and the
 * carried-metrics rule (D5) for no output difference. `core/creole.ts
 * #parseCreole` is rejected too: its `CreoleSpan` carries no url and no atoms.
 *
 * What is left is what `class` already did for the same reason, with the same
 * charter: a diagram-local ADAPTER over the SHARED atom primitives
 * (`classifyStripeLine` + `buildLineAtoms`, measured through
 * `core/creole-atoms-measure.ts`). `class-member-creole.ts` is that adapter
 * for member rows; this is it for sequence labels. Nothing under
 * `core/klimt/creole/` is modified, forked, or duplicated.
 *
 * `CreoleMode.FULL` per `AbstractTextualComponent.java:90` (D2). It differs
 * from `SIMPLE_LINE` only by the `*`-bullet and `#`-heading patterns
 * (`CreoleStripeSimpleParser.java:119-147`, both gated on FULL), neither of
 * which this port has ported for either mode — so the mode costs nothing
 * today and is recorded so that whoever ports them knows sequence wants them.
 *
 * ## Measurement identity — the property C2-C6 depend on
 *
 * For a line with NO creole markup, `classifyStripeLine` returns `{type:
 * 'NORMAL', content: line}` (the untouched input) and `buildStripeAtoms`
 * accumulates every unmatched character into one `pending` run flushed at
 * EOL (`StripeSimple.ts#StripeAtomBuilder#modifyStripe`). The result is
 * exactly ONE `'text'` atom carrying the original string at the original
 * font, so {@link sequenceCreoleRuns} measures `measurer.measure(line, spec)`
 * — byte-identical to the raw call each C2-C6 cutover replaces. That identity
 * is what makes those cutovers zero-diff, and it is pinned by this module's
 * own test rather than assumed.
 *
 * ## Named remainders
 *
 * A non-`'text'` atom — `<img>`/`<$sprite>`/`<&openiconic>` (`'inline'`),
 * `<:emoji:>`, `<latex>` — produces NO run: a `TextRun` is a `<text>`, and an
 * image is an `<image>` that sequence geometry has nowhere to put yet. Each
 * still ADVANCES x by its own measured width ({@link nonTextAdvance}), so the
 * text runs around it stay where the jar puts them rather than sliding left
 * over a gap. Giving those atoms real sequence geometry needs a new geo kind
 * and a renderer branch in files this task does not own.
 *
 * A `HORIZONTAL_LINE` line (a bare `----`/`====`/`....`) yields no atoms at
 * all upstream — it becomes a `CreoleHorizontalLine` stripe, a drawn rule.
 * Sequence has no rule geometry either, so the line stays the literal text it
 * renders as today (the same fallback `class-member-creole.ts#buildMemberAtoms`
 * makes, for the same reason): a remainder loses a rule, never a string.
 */

import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle, getFont } from '../../core/klimt/shape/UText.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { measureInlineAtom } from '../../core/creole-atoms-measure.js';
import { emojiBoxDim } from '../../core/klimt/creole/atom/AtomEmoji.js';
import { CharHidder } from '../../core/utils/CharHidder.js';
import type { TextRun } from './text-block-geo.js';

/** Where a line's first run starts: `DriverTextSvg`'s own `x` (a LEFT edge)
 *  and `y` (a BASELINE), the same two quantities a `TextRun` carries. Every
 *  run of the line shares the baseline; only x advances. */
export interface CreoleOrigin {
  readonly leftX: number;
  readonly baselineY: number;
}

/**
 * The base `FontConfiguration` a sequence line's creole build starts from —
 * the port of `AbstractTextualComponent`'s own `final FontConfiguration fc =
 * getFontConfiguration()` (`java:80`), which resolves the component's style
 * bucket into the font every atom on the line inherits before any nested
 * `<b>`/`<i>`/`""…""` run modifies it.
 *
 * The two `FontSpec` flags map onto the two `FontStyle`s that mean the same
 * thing, exactly as `class-member-creole.ts#memberBaseFont` maps `{abstract}`
 * / `{static}` / `classAttributeFontStyle` onto theirs. `color` defaults to
 * `null` — `FontConfiguration.color === null` is upstream's transparent/unset
 * case, and a run whose colour is unset inherits the caller's ambient text
 * colour rather than hardcoding one here.
 */
export function sequenceCreoleFont(fontSpec: FontSpec, color: string | null = null): FontConfiguration {
  const styles = new Set<FontStyle>();
  if (fontSpec.weight === 'bold') styles.add(FontStyle.BOLD);
  if (fontSpec.style === 'italic') styles.add(FontStyle.ITALIC);
  return { family: fontSpec.family, size: fontSpec.size, color, styles };
}

/**
 * The `FontSpec` one atom is MEASURED at — its own family and its EFFECTIVE
 * (muted) size.
 *
 * `getFont` applies `FontPosition.mute` at READ time, upstream's own
 * `FontConfiguration#getFont()` behaviour (`FontConfiguration.java:98-104`),
 * so a `<sup>`/`<sub>` run measures 3 smaller while the stored configuration
 * keeps the size a nested `<size:N>` set. Identical to the stored size for
 * every NORMAL run, which is all of them until `<sup>`/`<sub>` appears.
 */
function atomFontSpec(font: FontConfiguration): FontSpec {
  return {
    family: font.family,
    size: getFont(font).size,
    ...(font.styles.has(FontStyle.BOLD) ? { weight: 'bold' as const } : {}),
    ...(font.styles.has(FontStyle.ITALIC) ? { style: 'italic' as const } : {}),
  };
}

/**
 * The whole `text-decoration` attribute for one run's style flags — a port of
 * `DriverTextSvg`'s own `StringBuilder decorations` cascade, in its order:
 *
 * ```java
 * if (fontConfiguration.containsStyle(FontStyle.UNDERLINE) ...) decorations.append("underline ");
 * if (fontConfiguration.containsStyle(FontStyle.STRIKE))        decorations.append("line-through ");
 * if (fontConfiguration.containsStyle(FontStyle.WAVE))          decorations.append("wavy underline ");
 * final String textDecoration = decorations.length() > 0 ? decorations.toString().trim() : null;
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:139-160
 *
 * The `getUnderlineStroke().getThickness() > 0` guard and the
 * `getExtendedColor()` branches (which draw separate `<line>`s instead of a
 * decoration) have no counterpart on this port's minimal `FontConfiguration`
 * — `UText.ts`'s own doc comment records that deferral.
 */
function creoleDecoration(styles: ReadonlySet<FontStyle>): string | undefined {
  const parts: string[] = [];
  if (styles.has(FontStyle.UNDERLINE)) parts.push('underline');
  if (styles.has(FontStyle.STRIKE)) parts.push('line-through');
  if (styles.has(FontStyle.WAVE)) parts.push('wavy underline');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * One `'text'` atom as a placed, measured `TextRun`.
 *
 * The three metrics are the MEASURER's answer at this atom's OWN font (D5) —
 * `DriverTextSvg` resolves the same quantities from its `StringBounder`
 * before emitting (`DriverTextSvg.java:125-126,179`). `textAscent` is
 * measured rather than derived from the font size for the reason
 * `TextRun.textAscent` records: the `size - size/4.5` shorthand disagrees
 * with `FixedMeasurer`.
 */
function textAtomRun(
  atom: Extract<CreoleAtom, { kind: 'text' }>,
  x: number,
  baselineY: number,
  measurer: StringMeasurer,
): TextRun {
  const spec = atomFontSpec(atom.font);
  // `AtomText.java:79` unhides in the CONSTRUCTOR — i.e. per atom, after the
  // command scan has already resolved against the hidden text, and BEFORE the
  // atom is measured or drawn. So the tile-escaped character is restored here
  // and every metric below is taken from the restored string.
  const shown = CharHidder.unhide(atom.text);
  const dim = measurer.measure(shown, spec);
  const decoration = creoleDecoration(atom.font.styles);
  return {
    text: shown,
    x,
    y: baselineY,
    textWidth: dim.width,
    textAscent: dim.height - measurer.getDescent(spec, shown),
    textLineHeight: dim.height,
    fontFamily: spec.family,
    fontSize: spec.size,
    ...(atom.font.styles.has(FontStyle.BOLD) ? { bold: true } : {}),
    ...(atom.font.styles.has(FontStyle.ITALIC) ? { italic: true } : {}),
    ...(atom.font.color !== null ? { color: atom.font.color } : {}),
    ...(decoration !== undefined ? { decoration } : {}),
    ...(atom.url !== undefined ? { url: atom.url } : {}),
  };
}

/**
 * How far a non-`'text'` atom pushes the runs after it (see the module's
 * named remainders). `'inline'` measures through the SAME
 * `measureInlineAtom` every sizer in this port uses, at the atom's own
 * ambient font size; a sprite name this diagram never defined contributes 0,
 * which is `StripeSimple.addSprite`'s own rule (`java:228-236`). `'emoji'`
 * advances by `AtomEmoji#calculateDimensionSlow`'s `36 * factor` square
 * (`AtomEmoji.java:57-59`). `'latex'` advances 0: it needs a rendered
 * formula's dimensions, which this port resolves nowhere on a text path.
 */
function nonTextAdvance(atom: Exclude<CreoleAtom, { kind: 'text' }>, base: FontConfiguration): number {
  if (atom.kind === 'inline') {
    return measureInlineAtom(atom.atom, undefined, atom.ambientFont?.size ?? base.size).width;
  }
  if (atom.kind === 'emoji') return emojiBoxDim(atom.factor).width;
  return 0;
}

/**
 * ONE display line -> its placed, measured runs, left to right.
 *
 * `buildLineAtoms` is the shared "line -> visible atoms" lexer: it classifies
 * the raw line (`classifyStripeLine`), decodes `<U+XXXX>`/`&#NNN;` escapes per
 * atom, applies the `==`-heading font cascade, and returns the flat atom
 * sequence. Everything this function adds is PLACEMENT and MEASUREMENT — the
 * two things the engine deliberately does not do, because they belong to
 * whichever diagram is drawing.
 *
 * `line` is ONE physical line: `\n` splitting happens upstream of here
 * (upstream's own `Display.getWithNewlines`, which runs BEFORE creole
 * classification), so a caller with a multi-line display calls this once per
 * line and advances the baseline itself.
 */
export function sequenceCreoleRuns(
  line: string,
  font: FontConfiguration,
  origin: CreoleOrigin,
  measurer: StringMeasurer,
): readonly TextRun[] {
  // The `~` TILE ESCAPE, which upstream applies inside the engine and this
  // port makes the caller's job.
  //
  // Upstream hides before the command scan and unhides per atom:
  // `StripeSimple.java:150` is `line = CharHidder.hide(line)` immediately
  // before `modifyStripe(line)`, and `AtomText.java:79` is
  // `String s = CharHidder.unhide(text)` in the constructor. This port did not
  // port the `hide` half into `StripeSimple.ts` — its own doc comment records
  // the deferral — so every caller of the shared engine performs it, and
  // `class-object-member-creole.ts:100,122` is the existing caller that does.
  //
  // Hiding runs BEFORE classification here, as it does there: `~""mono""`
  // must keep its quotes UNSTYLED, and classifying the raw line would consume
  // them before the scan ever saw the tile. Without this, `~[[Double]]` reaches
  // `CommandCreoleUrl` with a live `[[` and draws a link the jar does not
  // (`mufomi-43-vaso140`).
  const built = buildLineAtoms(CharHidder.hide(line), font, CreoleMode.FULL);
  // HORIZONTAL_LINE yields no atoms at all — see the module's named
  // remainders for why the line stays its own literal text here.
  const atoms: readonly CreoleAtom[] =
    built.classification.type === 'HORIZONTAL_LINE'
      ? [{ kind: 'text', text: line, font: built.lineFont }]
      : built.atoms;

  const runs: TextRun[] = [];
  let x = origin.leftX;
  for (const atom of atoms) {
    if (atom.kind !== 'text') {
      x += nonTextAdvance(atom, font);
      continue;
    }
    const run = textAtomRun(atom, x, origin.baselineY, measurer);
    runs.push(run);
    x += run.textWidth;
  }
  return runs;
}
