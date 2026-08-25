/**
 * stereotype-decoration.ts — the port of `StereotypeDecoration#buildComplex`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/
 * StereotypeDecoration.java:143-182`): how a `<<...>>` run splits into the
 * label(s) a diagram DISPLAYS and the circled-character / sprite BADGE it
 * draws beside them.
 *
 * Lifted out of `diagrams/class/class-stereotype.ts` unchanged. That
 * decomposition is upstream's, not the class engine's — `buildComplex` runs
 * for every entity kind — and the sequence engine needs the same split for a
 * participant's `<< ($sprite, #color) Name >>`. Reaching across an engine
 * boundary to get it would have been the divergence; this is the move SI27
 * made for the creole atom seam, for the same reason.
 *
 * `class-stereotype.ts` re-exports every public name below, so its own call
 * sites and importers are untouched; the class-specific half (measurement,
 * header rows, hide/show over a `ClassDiagramAST`) stays there.
 */

import { getScale } from './klimt/creole/Parser.js';
import { SPRITE_NAME_PATTERN_SOURCE } from './creole-atoms.js';

/**
 * G2 N27: `skinparam guillemet <value>` (`Guillemet.fromDescription`) --
 * the wrapper strings a stereotype label draws with. Optional/additive
 * (defaults to `«`/`»`, the same literal default this module previously
 * hardcoded) so every pre-existing call site stays behavior-identical when
 * no override is threaded through. `class-object-map-sizing.ts#
 * wrapGuillemet` (object/map leaves) keeps its own separate, still-unwired
 * copy -- shared with `state-sizing.ts` (a DIFFERENT diagram type), out of
 * this class-only iteration's scope (see that module's own doc comment).
 */
export interface GuillemetPair {
  start: string;
  end: string;
}

export const DEFAULT_GUILLEMET: GuillemetPair = { start: '«', end: '»' };

export function wrapGuillemet(label: string, guillemet: GuillemetPair = DEFAULT_GUILLEMET): string {
  return `${guillemet.start}${label}${guillemet.end}`;
}

/**
 * `StereotypeDecoration#buildComplex`'s `circleChar`/`circleSprite`
 * sub-pattern: a label chunk starting with `(CHAR[,COLOR])` or
 * `($sprite[,COLOR])` is a CIRCLED-CHARACTER/sprite BADGE override, not
 * displayed text -- upstream strips the `(...)` prefix and keeps only
 * whatever residual text follows (possibly none, e.g. `<<(?, red)>>` has
 * NO visible label at all -- jar-verified `bejeli-39-sina124`'s
 * `ColoredCircle`/`PlainCircle`, both `<<(...)>>`-only, draw ZERO
 * stereotype text rows; `NamedStereotype`/`PlainCircleStereotype`, both
 * `<<(...)[,] Stereotype>>`, draw exactly one row reading `«Stereotype»`
 * regardless of the comma). The custom badge letter/color override itself
 * (`CHAR`/`COLOR` -- `class-badge.ts#badgeFill`/`badgeLetter`'s existing
 * kind-only dispatch) is a SEPARATE, unbuilt mechanism, out of this
 * function's scope -- this only prevents the paren-decoration syntax
 * itself from being drawn as garbage literal text.
 */
// String-built (not a regex literal) purely so the complexity hook's lizard
// parser doesn't mis-tokenize the literal and swallow the rest of the file
// (see .agent-notes / memory: complexity-hook workarounds). Same pattern.
const STRIP_CIRCLED_CHAR_RE = new RegExp(
  String.raw`^\(\s*\S\s*(?:,\s*(?:#[0-9a-fA-F]{6}|\w+)\s*)?\)\s*,?\s*(.*)$`,
);

/** A2s R2i (rotisi-30-loge424): `StereotypeDecoration`'s `circleSprite`
 *  sub-pattern (java:76-92), applied to one trimmed `<<...>>` chunk's inner
 *  text: `\(?\$(NAME)(SCALE)?[\s]*(,COLOR)?[\s]*([),]LABEL)?` where NAME is
 *  `SpriteUtils.SPRITE_NAME` (reused via `creole-atoms.ts#
 *  SPRITE_NAME_PATTERN_SOURCE` -- the single sprite-name char class under
 *  src/, si11b ADR-4/AC4) and SCALE is `(?:\{scale=|\*)[0-9.]+\}?` -- the
 *  SPRITE-badge twin of {@link CIRCLE_CHAR_RE}'s char form. Groups: 1=name,
 *  2=raw scale text (fed to `getScale`), 3=color, 4=residual label. */
const CIRCLE_SPRITE_RE = new RegExp(
  String.raw`^\(?\$(` + SPRITE_NAME_PATTERN_SOURCE + String.raw`)((?:\{scale=|\*)[0-9.]+\}?)?` +
    String.raw`\s*(?:,\s*(#[0-9a-fA-F]{6}|\w+))?\s*(?:[),](.*))?$`,
  'u',
);

function stripCircledCharDecoration(label: string): string {
  // Sprite form first -- `buildComplex` tries `mCircleSprite` before
  // `mCircleChar` (StereotypeDecoration.java:190-206); its visible residue
  // is the LABEL group after the closing `)`/`,`.
  const sm = CIRCLE_SPRITE_RE.exec(label);
  if (sm !== null) return (sm[4] ?? '').trim();
  const m = STRIP_CIRCLED_CHAR_RE.exec(label);
  return m === null ? label : m[1]!.trim();
}

/**
 * `StereotypeDecoration#cutLabels`: splits a `Classifier.stereotype` blob
 * back into its individual per-stereotype label TOKENS, trimmed, then
 * strips any `(CHAR[,COLOR])` circled-character decoration prefix ({@link
 * stripCircledCharDecoration}) and drops tokens that are empty afterward
 * (a pure spot-color/letter override with no visible text). The greedy
 * declaration-parser capture (`class-declaration-parser.ts#
 * extractDecorations`'s own doc comment) absorbs STACKED `<<A>><<B>>`
 * markup into one string spanning the first `<<` to the last `>>` — e.g.
 * `"Singleton >>  << Startup >>  << Stateless Session Bean"` — so
 * reconstructing `<<${stereotype}>>` and re-splitting on each `<<...>>`
 * occurrence recovers jar's own per-label list exactly (mirrors
 * `StereotypeDecoration.java`'s identical two-step: the declaration grammar
 * captures the whole blob once, `cutLabels` re-parses it into labels at
 * render time).
 *
 * G2 N37: a TRIPLE-bracket label (`<<<mystyle>>>`, e.g. `class Foo
 * <<<mystyle>>>`) carries a `visible: false` flag -- jar-verified
 * `dozude-05-jeve029`: `AliceMyStyle <<<mystyle>>>` draws NO `«mystyle»`
 * stereotype text row (unlike the 2-bracket `AliceMyStyleStereo
 * <<mystyle>>`, which does) and its header box height matches the
 * NO-stereotype case exactly, yet the `.mystyle { ... }` `<style>`
 * declaration's BackgroundColor/RoundCorner/FontStyle/FontColor STILL
 * apply to it (cyan fill, `rx="2.5"`, bold red text) -- i.e. the tag is
 * INVISIBLE for display but still ACTIVE for style-cascade matching. Two
 * separate consumers read this token list for their own purpose:
 * {@link splitStereotypeLabels} (visible-only, feeds the RENDERED stacked
 * stereotype row(s)) and {@link splitStereotypeStyleTags} (every token
 * regardless of bracket count, feeds `.tagname` style-cascade matching --
 * `style-map-element.ts#resolveStyleCascade`'s `stereotypeTags` param).
 */
function splitStereotypeTokens(
  stereotype: string,
): Array<{ label: string; visible: boolean }> {
  const reconstructed = `<<${stereotype}>>`;
  const tokens: Array<{ label: string; visible: boolean }> = [];
  const re = /(<{2,3})(.*?)>{2,3}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reconstructed)) !== null) {
    const stripped = stripCircledCharDecoration(m[2]!.trim());
    if (stripped !== '') tokens.push({ label: stripped, visible: m[1]!.length === 2 });
  }
  return tokens;
}

/** Visible-only labels (2-bracket `<<X>>`) -- feeds the RENDERED stacked
 *  stereotype row(s) ({@link buildStereoRows}) and header-height sizing
 *  ({@link stereoBlockDim}). See {@link splitStereotypeTokens}'s own doc
 *  comment for the 3-bracket-invisible derivation. */
export function splitStereotypeLabels(stereotype: string): string[] {
  return splitStereotypeTokens(stereotype)
    .filter((t) => t.visible)
    .map((t) => t.label);
}

/** EVERY label regardless of bracket count (2 OR 3) -- feeds `.tagname`
 *  `<style>` cascade matching, which is INDEPENDENT of display visibility
 *  (see {@link splitStereotypeTokens}'s own doc comment). G2 N37. */
export function splitStereotypeStyleTags(stereotype: string): string[] {
  return splitStereotypeTokens(stereotype).map((t) => t.label);
}

export interface CircledCharDecoration {
  char: string;
  color?: string;
}

/**
 * `StereotypeDecoration#buildComplex`'s CHAR/COLOR capture (java:143-183) --
 * the badge-customization HALF of the `(CHAR[,COLOR])` decoration
 * {@link stripCircledCharDecoration} strips as plain text (G2 N26; that
 * function's own doc comment names this as the "separate, unbuilt
 * mechanism"). Scans every `<<...>>` chunk in declaration order, like
 * {@link splitStereotypeLabels}; unlike that function, a LATER matching
 * chunk OVERWRITES the running result entirely (upstream's own loop
 * reassigns `htmlColor`/`character` unconditionally on each match, java:
 * 174-176 -- not merged/accumulated), so only the LAST `(CHAR[,COLOR])`
 * chunk in a stacked stereotype wins. `color` is `undefined` when the
 * bracket carries no COLOR group (`EntityImageClassHeader.java:180-182`:
 * `stereotype.getHtmlColor() == null ? spotBackColor : ...` -- the caller
 * falls back to the kind's own default spot color in that case, so this
 * function deliberately leaves it unset rather than guessing one). Returns
 * `undefined` when no chunk carries the decoration at all.
 * @see ~/git/plantuml/.../stereo/StereotypeDecoration.java:58-183
 */
const CIRCLE_CHAR_RE = /^\(\s*(\S)\s*(?:,\s*(#[0-9a-fA-F]{6}|\w+)\s*)?\)/;

export function parseCircledCharDecoration(
  stereotype: string | undefined,
): CircledCharDecoration | undefined {
  if (stereotype === undefined) return undefined;
  const reconstructed = `<<${stereotype}>>`;
  const re = /<{2,3}(.*?)>{2,3}/g;
  let result: CircledCharDecoration | undefined;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reconstructed)) !== null) {
    const cm = CIRCLE_CHAR_RE.exec(m[1]!.trim());
    if (cm === null) continue;
    const char = cm[1]!;
    const color = cm[2];
    result = color !== undefined ? { char, color } : { char };
  }
  return result;
}

/** A2s R2i (rotisi-30-loge424): the `<<($sprite[,color])>>` SPRITE badge
 *  override -- `StereotypeDecoration#buildComplex`'s `mCircleSprite` branch
 *  (java:190-201): `spriteName`/`spriteScale` reassigned unconditionally on
 *  each matching chunk (last wins, mirroring {@link
 *  parseCircledCharDecoration}); `scale` via `Parser.getScale(SCALE, 1)`.
 *  The badge box the header sizes from is the sprite's own dims * scale
 *  (`Stereotype#getSprite` -> `tmp.asTextBlock(..., decoration.spriteScale,
 *  null)`, Stereotype.java:108-117 -- NOT font-relative) wrapped in the
 *  SAME `withMargin(4, 0, 5, 5)` every circled-character badge gets
 *  (EntityImageClassHeader.java:158-159); the dims lookup itself lives with
 *  the caller (`class-layout-header-geo.ts`), which has the registry. */
export interface CircledSpriteDecoration {
  name: string;
  scale: number;
  color?: string;
}

export function parseCircledSpriteDecoration(
  stereotype: string | undefined,
): CircledSpriteDecoration | undefined {
  if (stereotype === undefined) return undefined;
  const reconstructed = `<<${stereotype}>>`;
  const re = /<{2,3}(.*?)>{2,3}/g;
  let result: CircledSpriteDecoration | undefined;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reconstructed)) !== null) {
    const sm = CIRCLE_SPRITE_RE.exec(m[1]!.trim());
    if (sm === null) continue;
    const color = sm[3];
    result = { name: sm[1]!, scale: getScale(sm[2], 1), ...(color !== undefined ? { color } : {}) };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Badge GEOMETRY — SkinParam#getCircledCharacterRadius
// ---------------------------------------------------------------------------

/** `FontParam.CIRCLED_CHARACTER`'s own default size
 *  (`klimt/font/FontParam.java:55`). */
export const DEFAULT_CIRCLED_CHARACTER_FONT_SIZE = 17;

/**
 * The circled-character badge's radius.
 *
 * `SkinParam#getCircledCharacterRadius()` returns the explicit
 * `circledCharacterRadius` skinparam when set, and otherwise derives one from
 * the CIRCLED_CHARACTER font size: `getFontSize(...) / 3 + 6` -- integer
 * division, hence the floor (`skin/SkinParam.java:548-551`).
 *
 * Lifted here from `diagrams/class/class-badge.ts`, which keeps re-exporting
 * it: the formula is `SkinParam`'s, not the class engine's, and the sequence
 * participant badge needs the same radius. Jar-verified there on 12 corpus
 * samples, and again by two sequence goldens whose radii differ only because
 * their font sizes do -- `nimoxu-60-xale291` (rx=11) and
 * `fakova-98-suze610` (rx=9).
 */
export function resolveBadgeRadius(
  circledCharacterFontSize?: number,
  circledCharacterRadiusOverride?: number,
): number {
  if (circledCharacterRadiusOverride !== undefined) return circledCharacterRadiusOverride;
  const fontSize = circledCharacterFontSize ?? DEFAULT_CIRCLED_CHARACTER_FONT_SIZE;
  return Math.floor(fontSize / 3) + 6;
}
