/**
 * `StereotypeDecoration` — the resolved `<<...>>` blob a {@link Stereotype}
 * wraps: the raw label text plus any circled-character/circled-sprite
 * decoration (`<<(X,red)Foo>>` / `<<($name,red)Foo>>`) folded out of it.
 *
 * Additive sibling of `Stereotype.ts`, ported for the same reason T8 ported
 * `Sea`/`Position` as `SheetBlock1`'s own siblings: `Stereotype.java`'s
 * private constructor takes a `StereotypeDecoration` and virtually every
 * public method on `Stereotype` delegates to one — it cannot be faithfully
 * ported without it. Single caller in the Java (`grep -rn "StereotypeDecoration"`
 * across `~/git/plantuml` hits only `stereo/Stereotype.java`), so this stays
 * in the same package/directory rather than widening scope.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypeDecoration.java
 *
 * Adaptations from the Java (all forced by dependencies this port has
 * already, deliberately, not built — not new decisions made here):
 * - `HColor htmlColor` -> `ResolvedColor | undefined`
 *   (`klimt/color/HColorSet.ts#ResolvedColor` — this port never built an
 *   `HColor` value type; every other color-bearing port in this codebase
 *   resolves eagerly to `ResolvedColor`/a raw hex string instead, see
 *   `HColorSet.ts`'s own file doc on "stored verbatim, interpreted late").
 *   `StereotypeDecoration` resolves EAGERLY at construction, matching
 *   upstream's own `buildComplex` (`htmlColorSet.getColor(colName)` is
 *   called once, at build time, not deferred) — so eager `ResolvedColor`
 *   resolution here is the faithful adaptation, not a new design choice.
 * - `HColorSet htmlColorSet` parameter -> a plain resolver function
 *   `(name: string) => ResolvedColor | undefined`, matching
 *   `HColorSet.ts#parseSimpleColor`'s own exact signature — callers pass
 *   that function directly. Argument name/position preserved.
 * - `throws NoSuchColorException` -> NOT propagated. This port's only
 *   color resolver (`parseSimpleColor`) never throws — an unresolvable
 *   name returns `undefined`, matching HColorSet.ts's own established,
 *   already-documented never-throw convention. Reintroducing a throwing
 *   path here would diverge from every other color call site in this
 *   codebase, not converge with them.
 * - `net.sourceforge.plantuml.regex.*` (RegexComposed/RegexConcat/RegexLeaf/
 *   Matcher2/Pattern2) -> native JS `RegExp`, one literal translation per
 *   upstream pattern (named capture groups replace `RegexResult.get(name,
 *   occurrence)`). This is this port's ESTABLISHED convention for every
 *   upstream regex-combinator pattern (see `class-stereotype.ts`,
 *   `creole-atoms.ts`, `sprite-commands.ts`'s own file docs) — porting the
 *   `net.sourceforge.plantuml.regex` DSL itself would be an unrelated,
 *   large, cross-cutting subsystem port, out of scope for this task and
 *   contrary to how every other file in this codebase already handles the
 *   identical translation problem.
 * - `RegexLeaf.spaceZeroOrMore()` (`"[%s]*"`) -> `\s*`, the same mapping
 *   this codebase already uses at every other `<<...>>`-decoration call
 *   site (`class-stereotype.ts`'s own gap patterns).
 * - `klimt.creole.Parser#getScale` (a single 10-line static method on an
 *   otherwise unrelated, much larger legacy-parser class) -> ported as the
 *   local {@link parseScaleOrDefault}, cited to its own Java lines, rather
 *   than porting the whole `Parser` class (out of scope: its other methods
 *   serve the full creole legacy parser front end, not this file).
 * - `SpriteUtils.SPRITE_NAME` (`"[-\\p{L}0-9_/]+"`, one `static final`
 *   constant on an otherwise unrelated sprite-loading class) -> inlined
 *   directly into {@link CIRCLE_SPRITE_SOURCE} rather than porting
 *   `SpriteUtils` for one constant.
 * - `Guillemet#manageGuillemetStrict` (needed by {@link cutLabels}) has no
 *   port anywhere in this codebase (`core/text/Guillemet.ts` only ports
 *   `manageGuillemet`, its sibling). Ported here as a local, self-contained
 *   function (not added to `Guillemet.ts`, which is outside this task's
 *   write-set) — see {@link manageGuillemetStrict}'s own doc comment.
 */

import type { ResolvedColor } from '../klimt/color/HColorSet.js';

// ---------------------------------------------------------------------------
// Guillemet pair + manageGuillemetStrict (local; see file doc)
// ---------------------------------------------------------------------------

/** Mirrors `core/text/Guillemet.ts#GuillemetPair` exactly — kept as a local
 *  structural type (not imported) so this file has no dependency on that
 *  module's exports beyond the shape itself. */
export interface GuillemetPair {
  readonly start: string;
  readonly end: string;
}

/** `Guillemet.NONE` (`Guillemet.java:44`). */
export const GUILLEMET_NONE: GuillemetPair = { start: '', end: '' };

/** `Guillemet.DOUBLE_COMPARATOR` (`Guillemet.java:45`) — the `<<`/`>>`
 *  identity pair; `manageGuillemet`/`manageGuillemetStrict` both short-
 *  circuit on it. */
export const GUILLEMET_DOUBLE_COMPARATOR: GuillemetPair = { start: '<<', end: '>>' };

/**
 * `Guillemet#manageGuillemetStrict` (java:87-100): rewrites a SINGLE
 * `<<...>>`-wrapped token's own opening/closing delimiters (with or
 * without the one-space padding `<< `/` >>`) to `pair`'s start/end —
 * unlike `manageGuillemet`, this does not scan for a run of `<<...>>`
 * occurrences inside arbitrary text; it assumes `st` IS one such token.
 * Identity when `pair` is the `<<`/`>>` pair itself (matches
 * `core/text/Guillemet.ts#manageGuillemet`'s own by-VALUE identity check,
 * not upstream's by-REFERENCE `this == DOUBLE_COMPARATOR`, since `pair`
 * here is a plain value object, not a singleton).
 */
function manageGuillemetStrict(st: string, pair: GuillemetPair): string {
  if (pair.start === '<<' && pair.end === '>>') return st;
  let s = st;
  if (s.startsWith('<< ')) s = pair.start + s.slice(3);
  else if (s.startsWith('<<')) s = pair.start + s.slice(2);
  if (s.endsWith(' >>')) s = s.slice(0, -3) + pair.end;
  else if (s.endsWith('>>')) s = s.slice(0, -2) + pair.end;
  return s;
}

// ---------------------------------------------------------------------------
// Regex patterns (string-built, see file doc: no `{`/`[`/`]`/`\p{}` inside
// `/regex/` literals per this project's complexity-hook convention).
// ---------------------------------------------------------------------------

/** `StereotypeDecoration.circleChar` (java:59-74): `<<(CHAR[,COLOR])[,]LABEL>>`. */
const CIRCLE_CHAR_SOURCE =
  '<<\\s*\\((?<CHAR>\\S)(?:\\s*,\\s*(?<COLOR>#[0-9a-fA-F]{6}|\\w+)\\s*)?\\)(?:[,]?(?<LABEL>.*?))?>>';
const CIRCLE_CHAR_RE = new RegExp(CIRCLE_CHAR_SOURCE);

/** `StereotypeDecoration.circleSprite` (java:76-92): `<<($NAME{scale=N}[,COLOR])[),]LABEL>>`.
 *  `NAME`'s charset inlines `SpriteUtils.SPRITE_NAME` (see file doc). */
const CIRCLE_SPRITE_SOURCE =
  '<<\\s*\\(?\\$(?<NAME>[-\\p{L}0-9_/]+)(?<SCALE>(?:\\{scale=|\\*)[0-9.]+\\}?)?' +
  '\\s*(?:,\\s*(?<COLOR>#[0-9a-fA-F]{6}|\\w+))?\\s*(?:[),](?<LABEL>.*?))?>>';
const CIRCLE_SPRITE_RE = new RegExp(CIRCLE_SPRITE_SOURCE, 'u');

/** `StereotypeDecoration.p` (java:185): a bracketed `<<...>>`/`<<<...>>>` run. */
const CUT_LABELS_RE = /<{2,3}.*?>{2,3}/g;

/** `klimt.creole.Parser.SCALE` + `#getScale` (`Parser.java:67-78`) — ported
 *  as a local function rather than the whole `Parser` class (see file doc). */
const SCALE_NUMBER_RE = /(?:scale=|\*)([0-9.]+)/;
function parseScaleOrDefault(text: string | undefined, def: number): number {
  if (text === undefined) return def;
  const m = SCALE_NUMBER_RE.exec(text);
  return m !== null ? Number.parseFloat(m[1]!) : def;
}

/** `StringUtils.isNotEmpty` (java, common utility). */
function isNotEmpty(s: string | undefined): s is string {
  return s !== undefined && s.length > 0;
}

// ---------------------------------------------------------------------------
// StereotypeDecoration
// ---------------------------------------------------------------------------

/** Package-private in the Java (no `public` modifier); this port keeps it
 *  exported since TS has no package-private, but only `Stereotype.ts`
 *  constructs or reads it. */
export class StereotypeDecoration {
  readonly label: string;
  readonly htmlColor: ResolvedColor | undefined;
  /** `''` stands in for the Java `'\0'` sentinel ("no circled character"). */
  readonly character: string;
  readonly spriteName: string | undefined;
  readonly spriteScale: number;

  /** java:120-127. */
  private constructor(
    label: string,
    htmlColor: ResolvedColor | undefined,
    character: string,
    spriteName: string | undefined,
    spriteScale: number,
  ) {
    this.label = label;
    this.htmlColor = htmlColor;
    this.character = character;
    this.spriteName = spriteName;
    this.spriteScale = spriteScale;
  }

  /** java:102-105. */
  toString(): string {
    return `label='${this.label}' spriteName='${this.spriteName ?? ''}'`;
  }

  /** `StereotypeDecoration#getStyleNames` (java:107-118). */
  getStyleNames(): string[] {
    const result: string[] = [...cutLabels(this.label, GUILLEMET_NONE)];
    if (this.spriteName === undefined) return result;
    const idx = this.spriteName.lastIndexOf('/');
    if (idx !== -1) result.push(this.spriteName.slice(idx + 1));
    return result;
  }

  /** `StereotypeDecoration#buildSimple` (java:129-141). */
  static buildSimple(name: string): StereotypeDecoration {
    let spriteName: string | undefined;
    let spriteScale: number;
    if (name.startsWith('<<$') && name.endsWith('>>')) {
      const m = CIRCLE_SPRITE_RE.exec(name);
      spriteName = m?.groups?.['NAME'];
      spriteScale = parseScaleOrDefault(m?.groups?.['SCALE'], 1);
    } else {
      spriteName = undefined;
      spriteScale = 0;
    }
    return new StereotypeDecoration(name, undefined, '', spriteName, spriteScale);
  }

  /**
   * `StereotypeDecoration#buildComplex` (java:143-183). `htmlColorSet` is a
   * plain resolver function (see file doc) — see that doc for why this
   * port never throws where upstream declares `throws NoSuchColorException`.
   */
  static buildComplex(
    full: string,
    htmlColorSet: (name: string) => ResolvedColor | undefined,
  ): StereotypeDecoration {
    let label = '';
    let htmlColor: ResolvedColor | undefined;
    let character = '';
    let spriteName: string | undefined;
    let spriteScale = 0;

    const list = cutLabels(full, GUILLEMET_DOUBLE_COMPARATOR);
    for (let name of list) {
      const mCircleSprite = CIRCLE_SPRITE_RE.exec(name);
      const mCircleChar = CIRCLE_CHAR_RE.exec(name);

      if (mCircleSprite !== null) {
        const spriteLabel = mCircleSprite.groups?.['LABEL'];
        name = isNotEmpty(spriteLabel) ? `<<${spriteLabel}>>` : '';

        const colName = mCircleSprite.groups?.['COLOR'];
        const col = colName === undefined ? undefined : htmlColorSet(colName);
        // `HColors.BLACK` (java:164) — the fallback when COLOR was present
        // in the markup but did not resolve to a known color.
        htmlColor = col ?? { r: 0, g: 0, b: 0, a: 255 };
        character = '';
        spriteName = mCircleSprite.groups?.['NAME'];
        spriteScale = parseScaleOrDefault(mCircleSprite.groups?.['SCALE'], 1);
      } else if (mCircleChar !== null) {
        const charLabel = mCircleChar.groups?.['LABEL'];
        name = isNotEmpty(charLabel) ? `<<${charLabel}>>` : '';

        const colName = mCircleChar.groups?.['COLOR'];
        htmlColor = colName === undefined ? undefined : htmlColorSet(colName);
        character = mCircleChar.groups?.['CHAR']?.charAt(0) ?? '';
      }

      label = label + name;
    }

    return new StereotypeDecoration(label, htmlColor, character, spriteName, spriteScale);
  }
}

/**
 * `StereotypeDecoration#cutLabels` (java:187-196): splits `label` back into
 * its individual `<<...>>`/`<<<...>>>` bracket runs, dropping any 3-bracket
 * (invisible-style-tag) run, then strict-rewrites each survivor's
 * delimiters per `guillemet`.
 */
export function cutLabels(label: string, guillemet: GuillemetPair): string[] {
  const result: string[] = [];
  CUT_LABELS_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CUT_LABELS_RE.exec(label)) !== null) {
    const group = m[0];
    if (!group.startsWith('<<<')) result.push(manageGuillemetStrict(group, guillemet));
  }
  return result;
}
