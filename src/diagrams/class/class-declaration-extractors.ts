/**
 * Classifier-declaration field extractors (body / decorations / inheritance /
 * generic / id-display) for the class parser. Split out of
 * `class-declaration-parser.ts` (line cap); the three the main
 * `parseClassifierDecl` consumes are exported.
 */

import { GENERIC_BODY_PATTERN, GENERIC_CLAUSE_RE, splitTopLevelCommas } from './class-namespace.js';
import { parseUrlBracket, URL_BRACKET_RE, type UrlInfo } from './class-url.js';

const TAG_TOKEN_RE = /(?<=^|\s)\$[^\s{}"'<>$]+(?=\s|$)/g;

/** Extract a same-line `{ … }` inline body or a trailing `{` opener. */
export function extractBody(rest: string): {
  rest: string;
  inlineMembers: string[];
  opensBody: boolean;
} {
  const inlineBodyMatch = /\{([^}]*)\}\s*$/.exec(rest);
  if (inlineBodyMatch !== null) {
    const bodyContent = inlineBodyMatch[1]!.trim();
    const inlineMembers =
      bodyContent.length > 0
        ? bodyContent.split(';').map((s) => s.trim()).filter((s) => s !== '')
        : [];
    return {
      rest: rest.slice(0, inlineBodyMatch.index).trimEnd(),
      inlineMembers,
      opensBody: false,
    };
  }
  if (rest.endsWith('{'))
    return { rest: rest.slice(0, -1).trimEnd(), inlineMembers: [], opensBody: true };
  return { rest, inlineMembers: [], opensBody: false };
}

/**
 * Trailing background/border-color spec on a classifier declaration: either a
 * bare `#colorname` or a compound `#part:color;part2;...` form built from the
 * `text|back|header|line|line.dashed|line.dotted|line.bold|shadowing`
 * keywords (each with an optional `:color`, `;`-separated) — e.g.
 * `#line:red;line.bold;text:red`. A `-`/`\`/`|`/`/` separator inside a color
 * name is PlantUML's two-color gradient syntax. This is `ColorParser`'s
 * `simpleColor(ColorType.BACK)` COLOR group — it never matches a doubled
 * `##`, which is the separate LINECOLOR group below.
 * @see ~/git/plantuml/.../klimt/color/ColorParser.java:43-46 (COLOR_REGEXP, PART2)
 */
const COLOR_RE = new RegExp(
  String.raw`(?:#(?:\w+[-\\|/]?\w+;)?(?:(?:text|back|header|line|line\.dashed|line\.dotted|line\.bold|shadowing)(?::\w+[-\\|/]?\w+)?(?:;|(?![\w;:.])))+|#\w+[-\\|/]?\w+)$`,
);

/**
 * Trailing `##[dotted|dashed|bold]colorname` line-color spec — a SEPARATE
 * optional grammar group from COLOR above, to its right (COLOR is checked
 * first, then LINECOLOR, then EXTENDS, then IMPLEMENTS — so callers must
 * strip LINECOLOR before COLOR when working back-to-front from the end of
 * the declaration).
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClass.java:99-102
 */
const LINECOLOR_RE = /##(?:\[(?:dotted|dashed|bold)\])?\w*$/;

/** Strip a `[[url]]` (G2 N15: captured and parsed, not just discarded — see
 *  {@link parseUrlBracket}), a `<< stereotype >>`, any `$tag` tokens (the
 *  TAGS1/TAGS2 slots — see {@link TAG_TOKEN_RE}), and a trailing color spec
 *  (either or both of the `##linecolor` / `#color` forms) off a declaration
 *  remainder (the URL link carries no DOT structure). Must run on a
 *  remainder that has already had its trailing extends/implements clause
 *  removed (see {@link extractInheritance}) — those sit to the right of the
 *  color spec in the grammar. */
export function extractDecorations(rest: string): {
  rest: string;
  stereotype: string | undefined;
  color: string | undefined;
  tags: string[];
  url: UrlInfo | undefined;
} {
  const urlMatch = URL_BRACKET_RE.exec(rest);
  const url = urlMatch !== null ? parseUrlBracket(urlMatch[0]) : undefined;
  let out = rest.replace(/\s*\[\[[^\]]*\]\]/g, '').trim();
  let stereotype: string | undefined;
  // Greedy — stacked stereotypes (`<<A>><<B>>`) capture to the LAST `>>` as one blob, else the mis-split id spawns phantom nodes (gabejo-44-juki791).
  const stereoMatch = /<<\s*(.+)\s*>>/.exec(out);
  if (stereoMatch !== null) {
    stereotype = stereoMatch[1]!.trim(); // greedy `.+` can absorb trailing `\s*`
    out = (
      out.slice(0, stereoMatch.index) +
      out.slice(stereoMatch.index + stereoMatch[0].length)
    ).trim();
  }
  // Tags are stripped after the stereotype (so its `<< >>` delimiters no
  // longer shield an adjacent tag from the token-boundary lookarounds) and
  // before the color specs (a TAGS2 tag may sit between stereotype and color).
  const tags: string[] = [];
  out = out
    .replace(TAG_TOKEN_RE, (m) => {
      tags.push(m.slice(1));
      return '';
    })
    .replace(/\s+/g, ' ')
    .trim();
  let color: string | undefined;
  const lineColorMatch = LINECOLOR_RE.exec(out);
  if (lineColorMatch !== null) {
    color = lineColorMatch[0];
    out = out.slice(0, -lineColorMatch[0].length).trimEnd();
  }
  const colorMatch = COLOR_RE.exec(out);
  if (colorMatch !== null) {
    color = color === undefined ? colorMatch[0] : `${colorMatch[0]} ${color}`;
    out = out.slice(0, -colorMatch[0].length).trimEnd();
  }
  // #lizard forgives — four independent strip stages (url, stereotype, tags,
  // color) mirroring upstream's four optional grammar groups on one regex row.
  return { rest: out, stereotype, color, tags, url };
}

/**
 * A separator character usable INSIDE a parent code, independent of the
 * diagram's actually-configured `set namespaceSeparator` value: mirrors
 * upstream `CommandLinkClass.getSeparator()`, which is a generic,
 * any-separator-shaped-character grammar rule, not parameterized by the
 * diagram's configured separator — the CODE grammar accepts any of them, and
 * the *configured* separator only decides how the resolved id later splits
 * into namespaces (`splitOnSeparator`/`resolveReference` in
 * class-namespace.ts). Matches a literal double-backslash or `::`
 * (`SEPARATOR_CHAR_DOUBLE`), or else any single character that is not a
 * Unicode letter/digit, whitespace, `_`, `$`, `#`, `:`, a brace/angle
 * bracket, or a quote/guillemet (`SEPARATOR_CHAR_SINGLE`) — so custom
 * separators like `\\`, `-`, `/`, `!`, or a Unicode symbol (`∘`, `∷`) all
 * parse as CODE separators, not just `.`/`::`.
 * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:87-95
 */
// Lizard-safe: \x22 below is a hex escape for a literal double-quote
// character (not the glyph itself) — an unescaped double-quote glyph inside
// this pattern (or its surrounding comments) desyncs lizard's naive
// quote-tracking for the rest of the file, inflating an unrelated later
// function's reported CCN/NLOC. The regex engine resolves \x22 to the
// double-quote character when this string is compiled via new RegExp in
// buildInheritanceRe.
const INHERITANCE_SEP =
  '(?:\\\\{2}|::|[^\\p{L}\\p{N}\\s_$#:{}<>\\x22\'‘’“”])';
/**
 * A parent code: an optional namespace-separator-joined chain of
 * word/`$`/digit segments (mirrors upstream CODE — `Instruction$Visitor`,
 * `a.b.C`, `App\\Http\\Controllers\\Controller` under a custom `\\`
 * separator — `CommandCreateClassMultilines.CODE`).
 */
const INHERITANCE_CODE =
  INHERITANCE_SEP + '?[\\p{L}\\p{N}_$]+(?:' + INHERITANCE_SEP + '[\\p{L}\\p{N}_$]+)*';
/** Comma-separated parent codes (upstream CommandCreateClassMultilines.CODES). */
const INHERITANCE_CODES = INHERITANCE_CODE + '(?:\\s*,\\s*' + INHERITANCE_CODE + ')*';

/**
 * Match a trailing ` extends <codes>` / ` implements <codes>` clause, where
 * `<codes>` is either the comma-separated CODES list or a single quoted name.
 * `raw` is capture group 1 (unquoted CODES) or group 2 (quoted, unsplit). A
 * trailing `<generic>` on the parent reference itself (`extends BaseChat<A>`)
 * is matched and discarded, never part of the parent id — mirrors upstream's
 * anonymous optional GENERIC leaf appended after EXTENDS/IMPLEMENTS codes.
 * `u` flag required for the `\p{L}`/`\p{N}` Unicode property classes in
 * {@link INHERITANCE_SEP}/{@link INHERITANCE_CODE}.
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java:119-124
 */
function buildInheritanceRe(keyword: 'extends' | 'implements'): RegExp {
  return new RegExp(
    `\\s+${keyword}\\s+(?:(${INHERITANCE_CODES})|"([^"]+)")` +
      `(?:\\s*<${GENERIC_BODY_PATTERN}>)?\\s*$`,
    'iu',
  );
}
const EXTENDS_RE = buildInheritanceRe('extends');
const IMPLEMENTS_RE = buildInheritanceRe('implements');

function splitCodes(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter((s) => s !== '');
}

/**
 * Strip a trailing `extends <codes>` and/or `implements <codes>` clause off a
 * declaration remainder, leaving the plain `id [as alias]` for
 * {@link parseIdDisplay}. IMPLEMENTS is stripped first — it is the rightmost
 * clause in the source order (`... extends A implements B`), so removing it
 * first exposes the EXTENDS clause at the new end of the string.
 * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClass.java:103-108
 */
export function extractInheritance(rest: string): {
  rest: string;
  extendsIds: string[];
  implementsIds: string[];
} {
  let out = rest;
  let implementsIds: string[] = [];
  let extendsIds: string[] = [];

  const implementsMatch = IMPLEMENTS_RE.exec(out);
  if (implementsMatch !== null) {
    implementsIds = splitCodes(implementsMatch[2] ?? implementsMatch[1]!);
    out = out.slice(0, implementsMatch.index).trimEnd();
  }
  const extendsMatch = EXTENDS_RE.exec(out);
  if (extendsMatch !== null) {
    extendsIds = splitCodes(extendsMatch[2] ?? extendsMatch[1]!);
    out = out.slice(0, extendsMatch.index).trimEnd();
  }
  return { rest: out, extendsIds, implementsIds };
}

/**
 * Parse the trailing `id / display [as alias] [<generics>]` of a declaration.
 *
 * Upstream recognizes exactly two `as`-alias forms — the display side is
 * ALWAYS quoted: `"DISPLAY" as CODE` or `CODE as "DISPLAY"`
 * (`command/NameAndCodeParser.java:52-67` nameAndCodeForClassWithGeneric).
 * Bareword-both-sides (`class Foo as Bar`) is a SYNTAX ERROR upstream
 * (live-oracle-verified: renders "Syntax Error?"). The `unquotedAlias`
 * fallback below is kept anyway as a deliberate, documented leniency
 * divergence (no corpus fixture depends on it either way) rather than
 * surfacing a parse error our parser has no mechanism to report.
 */
/**
 * G2 N32: the SAME `id<generic>` extraction `idThenGeneric` below applies to
 * a BAREWORD declaration, but jar-verified to ALSO apply when the generic
 * clause arrives via a QUOTED display (`class "Foo<int>" as Foo_int` --
 * `zaxate-23-xifa551`'s cached oracle: header shows bare "Foo", plus its OWN
 * generic tag box reading "int", not the literal string "Foo<int>") --
 * `entity.getGeneric()`'s extraction is a single upstream chokepoint applied
 * to the resolved DISPLAY text regardless of which declaration syntax
 * produced it. Returns `typeParams: []` (display unchanged) when `display`
 * carries no trailing `<...>` clause -- zero behavior change for the
 * overwhelmingly common case.
 */
function extractGenericFromDisplay(
  display: string,
): { display: string; typeParams: string[]; typeParamsRawText?: string } {
  const m = /^([^\s<>]+)(<.*>)$/.exec(display.trim());
  if (m === null) return { display, typeParams: [] };
  const genericMatch = GENERIC_CLAUSE_RE.exec(m[2]!);
  if (genericMatch === null) return { display, typeParams: [] };
  return {
    display: m[1]!,
    typeParams: splitTopLevelCommas(genericMatch[1]!),
    typeParamsRawText: genericMatch[1]!,
  };
}

export function parseIdDisplay(rest: string): {
  id: string;
  display: string;
  typeParams: string[];
  typeParamsRawText?: string;
} {
  // A2s R2i (curupe-50-kibu120): upstream's DISPLAY_WITH_GENERIC is a LAZY
  // any-char capture (`[%g](.+?)...[%g]`, NameAndCodeParser.java:48), so a
  // display may itself CONTAIN quotes: `class ""Test"" as foo4` -> display
  // `"Test"` (regex backtracks to the LAST quote whose remainder still
  // matches ` as CODE$`), and `class "REST resource\n""url""" as foo6` ->
  // display `REST resource\n""url""` + id foo6 (golden: foo6's node width
  // 3.324653in equals foo3's mono-url line exactly). The previous `[^"]+`
  // content class rejected any inner quote, falling through to the bareword
  // branch which kept the raw quotes in the display. CODE is upstream's own
  // `[^\s{}%g<>]+` (NameAndCodeParser.java:49), not `\S+` -- a quoted
  // alias (`a as "b"`) must fall through to the CODE-as-DISPLAY branch.
  const quotedAlias = /^"(.+?)"\s+as\s+([^\s{}"<>]+)$/.exec(rest);
  if (quotedAlias !== null) {
    const { display, typeParams, typeParamsRawText } = extractGenericFromDisplay(quotedAlias[1]!);
    return {
      display, id: quotedAlias[2]!, typeParams,
      ...(typeParamsRawText !== undefined ? { typeParamsRawText } : {}),
    };
  }

  // `CODE as "DISPLAY"` — the other upstream-valid quoted form. Tried before
  // the bareword fallback so a single-word quoted display (`"Bar"`, matches
  // \S+) is not misassigned by that broader pattern. G2 N32: deliberately
  // NOT run through `extractGenericFromDisplay` -- no jar evidence for this
  // form (unlike `quotedAlias` below, jar-verified `zaxate-23-xifa551`/
  // `nesuti-69-giza389`), narrower scope than guessing.
  const codeAsQuotedDisplay = /^(\S+)\s+as\s+"([^"]*)"$/.exec(rest);
  if (codeAsQuotedDisplay !== null)
    return {
      id: codeAsQuotedDisplay[1]!,
      display: codeAsQuotedDisplay[2]!,
      typeParams: [],
    };

  // Bareword-both-sides: invalid upstream syntax, kept as leniency (see
  // doc comment above) — NOT the upstream-correct id/display assignment.
  // G2 N32: NOT run through `extractGenericFromDisplay`, same reasoning.
  const unquotedAlias = /^(\S+)\s+as\s+(\S+)$/.exec(rest);
  if (unquotedAlias !== null)
    return { display: unquotedAlias[1]!, id: unquotedAlias[2]!, typeParams: [] };

  // `id<generic>` — upstream's CODE never includes `<`/`>` (it stops at the
  // first `<`), so the id is split off first; the remaining `<...>` suffix is
  // matched against the bounded-nesting generic-body pattern (handles nested
  // generics like `Foo<List <? extends GENERIC>>`, not just single-level).
  // @see ~/git/plantuml/.../classdiagram/command/CommandCreateClass.java:89-91
  const idThenGeneric = /^([^\s<>]+)(<.*>)$/.exec(rest.trim());
  if (idThenGeneric !== null) {
    const genericMatch = GENERIC_CLAUSE_RE.exec(idThenGeneric[2]!);
    if (genericMatch !== null) {
      const typeParams = splitTopLevelCommas(genericMatch[1]!);
      return {
        display: idThenGeneric[1]!, id: idThenGeneric[1]!, typeParams,
        typeParamsRawText: genericMatch[1]!,
      };
    }
  }

  // A bare quoted name (`rectangle "foo3"`): the quotes are display syntax, not
  // part of the id — stripping them keeps the id clean for namespace qualification.
  // G2 N32: deliberately NOT run through `extractGenericFromDisplay` -- here
  // `id` is DERIVED FROM `display` (no separate alias), so stripping a
  // trailing `<...>` would also truncate the ID used for DOT node identity
  // and cross-references; jar-verified HARMFUL via a real corpus regression
  // (`nagega-30-poso418`'s `class "boost::function<ResultE(NodeCore*, const
  // Action*)>"` -- a macro-substituted C++ template signature, not a real
  // generic clause -- collapsing two DIFFERENT such ids to the same
  // truncated "boost::function" broke DOT node-count parity). Scoped to
  // `quotedAlias` only (an explicit, separately-named alias — stripping its
  // OWN display can never collide with another entity's id).
  const quoted = /^"([^"]+)"$/.exec(rest.trim());
  if (quoted !== null)
    return { display: quoted[1]!, id: quoted[1]!, typeParams: [] };

  return { display: rest.trim(), id: rest.trim(), typeParams: [] };
}

/** A resolved `extends`/`implements` parent: the id to create (if missing) and
 *  the relationship to link it with, back to the classifier under construction. */
