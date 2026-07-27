/**
 * Pure, stateless helpers for the descriptive-diagram parser.
 *
 * Low-level string primitives (quote/wrap stripping, id cleaning, url/link
 * token resolution, stereotype/color/tag extraction) live in
 * `parse-helpers-strings.ts` — split out purely to stay under 500 lines —
 * and are re-exported below so existing imports of this module keep
 * working unchanged. All regex literals that contain $, " or ' are
 * pre-compiled at module scope — Lizard 1.23.0 miscounts braces when those
 * chars appear inside /regex/ literals inside function bodies.
 */

import {
  KEYWORD_TO_SYMBOL,
  type USymbol,
} from '../../core/descriptive-keywords.js';
import type { DescriptiveNode } from './ast.js';
import {
  cleanId,
  extractColor,
  extractNodeStereotype,
  extractTags,
  finalizeDisplay,
  splitLeadingQuote,
  stripTrailingUrl,
  stripUrl,
} from './parse-helpers-strings.js';

export {
  stripFullWrap,
  cleanId,
  resolveTextEscapes,
  resolveNewlineEscapes,
  finalizeDisplay,
  extractNodeStereotype,
  stripUrl,
  resolveInlineLinks,
  extractColor,
  extractTags,
  extractLinkStereotype,
} from './parse-helpers-strings.js';
export type {
  StereotypeResult,
  ColorResult,
  LinkStereoResult,
  TagsResult,
} from './parse-helpers-strings.js';

// ---------------------------------------------------------------------------
// Container symbols — exported so layout.ts and renderer.ts can import them.
// The 17 keywords upstream allows to open a `{` group: the SYMBOL alternation
// in descdiagram/command/CommandPackageWithUSymbol.java.
// ---------------------------------------------------------------------------

export const CONTAINER_SYMBOLS: ReadonlySet<USymbol> = new Set<USymbol>([
  'package',
  'rectangle',
  'hexagon',
  'node',
  'artifact',
  'folder',
  'file',
  'frame',
  'cloud',
  'action',
  'process',
  'database',
  'storage',
  'component',
  'card',
  'queue',
  'stack',
]);

// ---------------------------------------------------------------------------
// Named return-type interfaces (prevent Lizard brace-counting confusion)
// ---------------------------------------------------------------------------

export interface NameSection {
  id: string;
  display: string;
  stereotype?: readonly string[];
  color?: string;
  tags?: string[];
}

interface IdDisplay {
  id: string;
  display: string;
}

// ---------------------------------------------------------------------------
// Module-level regex constants
// Lizard 1.23.0 miscounts brace depth when $, " or ' appear inside /regex/
// literals in function bodies, producing false NLOC attribution. Defining
// them here (outside any function) avoids the issue entirely.
// ---------------------------------------------------------------------------

// parseAliasForms — quoted / paren / alias forms
// DISPLAY-quoted "as" branches (CommandCreateElementFull.java:87-94,
// DISPLAY2/CODE2): `new RegexLeaf("as")` has no leading spaceZeroOrMore —
// zero space before "as" is legal (`"Long Name"as LN`), only
// spaceOneOrMore AFTER "as" is required. \s* (not \s+) before "as" here.
const RE_DQ_AS_ALIAS = /^"([^"]+)"\s*as\s+(\S+)$/;
const RE_SQ_AS_ALIAS = /^'([^']+)'\s+as\s+(\S+)$/;
const RE_ID_AS_DQ   = /^(\S+)\s+as\s+"([^"]+)"$/;
const RE_ID_AS_SQ   = /^(\S+)\s+as\s+'([^']+)'$/;
const RE_PAREN_ALIAS = /^\(([^)]+)\)\s+as\s+(\S+|\([^)]+\)|:[^:]+:)$/;
const RE_DQ_AS_WRAPPED = /^"([^"]+)"\s*as\s+(\([^)]+\)|:[^:]+:|\[[^\]]+\])$/;
// CODE as :wrapped: — bare code, colon/paren/bracket-wrapped display
// (`Admin as :Main Admin:`). Display keeps its notation stripped by cleanId.
const RE_ID_AS_WRAPPED = /^(\S+)\s+as\s+(\([^)]+\)|:[^:]+:|\[[^\]]+\])$/;
const RE_PAREN_ONLY  = /^\(([^)]+)\)$/;
const RE_PLAIN_ALIAS = /^(\S+)\s+as\s+(\S+)$/;

// parseNameSection — quoted-only form
const RE_DQ_ONLY = /^"([^"]+)"$/;

// ---------------------------------------------------------------------------
// Node factory
// ---------------------------------------------------------------------------

/** Build a DescriptiveNode, omitting optional fields when undefined. */
export function makeNode(
  id: string,
  display: string,
  symbol: USymbol,
  stereotype?: readonly string[],
  color?: string,
  tags?: string[],
): DescriptiveNode {
  const node: DescriptiveNode = { id, display, symbol, children: [] };
  if (stereotype !== undefined) node.stereotype = stereotype;
  if (color !== undefined) node.color = color;
  if (tags !== undefined) node.tags = tags;
  return node;
}

// ---------------------------------------------------------------------------
// Name-section parsing — split across two functions to stay under 30 NLOC
// ---------------------------------------------------------------------------

/** Try every quoted / paren / plain alias form; return id+display or undefined. */
function parseAliasForms(remainder: string): IdDisplay | undefined {
  const m1 = RE_DQ_AS_ALIAS.exec(remainder);
  if (m1 !== null) return { id: m1[2]!, display: m1[1]! };

  const m2 = RE_SQ_AS_ALIAS.exec(remainder);
  if (m2 !== null) return { id: m2[2]!, display: m2[1]! };

  const m3 = RE_ID_AS_DQ.exec(remainder);
  if (m3 !== null) return { id: m3[1]!, display: m3[2]! };

  const m4 = RE_ID_AS_SQ.exec(remainder);
  if (m4 !== null) return { id: m4[1]!, display: m4[2]! };

  const m5 = RE_PAREN_ALIAS.exec(remainder);
  if (m5 !== null) return { id: cleanId(m5[2]!), display: m5[1]!.trim() };

  const m5b = RE_DQ_AS_WRAPPED.exec(remainder);
  if (m5b !== null) return { id: cleanId(m5b[2]!), display: m5b[1]! };

  const m5c = RE_ID_AS_WRAPPED.exec(remainder);
  if (m5c !== null) return { id: m5c[1]!, display: cleanId(m5c[2]!) };

  const m6 = RE_PAREN_ONLY.exec(remainder);
  if (m6 !== null) { const n = m6[1]!.trim(); return { id: n, display: n }; }

  const m7 = RE_PLAIN_ALIAS.exec(remainder);
  if (m7 !== null) return { id: cleanId(m7[2]!), display: m7[1]! };

  return undefined;
}

/**
 * Build a NameSection from parsed id/display and optional stereotype/color.
 * Uses imperative assignment to satisfy exactOptionalPropertyTypes — spreading
 * `{ stereotype: undefined }` is not allowed for `stereotype?: string`.
 */
function buildNameSection(
  id: string,
  display: string,
  stereotype: readonly string[] | undefined,
  color: string | undefined,
  tags: string[] | undefined,
): NameSection {
  const section: NameSection = { id, display };
  if (stereotype !== undefined) section.stereotype = stereotype;
  if (color !== undefined) section.color = color;
  if (tags !== undefined && tags.length > 0) section.tags = tags;
  return section;
}

/**
 * Parse the name/alias/color/stereotype section of a keyword declaration.
 * Delegates alias matching to parseAliasForms to stay under 30 NLOC.
 *
 * The final id — whichever branch produces it — is always run through
 * {@link cleanId}, mirroring `CommandCreateElementFull.executeArg:302`
 * (`diagram.quarkInContext(false, diagram.cleanId(codeRaw))`), which applies
 * regardless of which CODE alternative (bare, or the alias-form CODE2/3/4)
 * matched.
 */
export function parseNameSection(rest: string): NameSection {
  const trimmedRest = rest.trim();
  const leading = splitLeadingQuote(trimmedRest);
  let remainder = leading === undefined ? stripUrl(trimmedRest) : leading.quoted + stripTrailingUrl(leading.tail);
  let stereotype: readonly string[] | undefined;
  let color: string | undefined;

  const sr = extractNodeStereotype(remainder);
  if (sr !== undefined) { stereotype = sr.stereotypes; remainder = sr.remainder.trim(); }

  const tr = extractTags(remainder);
  const tags = tr.tags.length > 0 ? tr.tags : undefined;
  remainder = tr.remainder;

  const cr = extractColor(remainder);
  if (cr !== undefined) { color = cr.color; remainder = cr.remainder.trim(); }

  const aliases = parseAliasForms(remainder);
  if (aliases !== undefined) {
    return buildNameSection(cleanId(aliases.id), finalizeDisplay(aliases.display), stereotype, color, tags);
  }

  const mq = RE_DQ_ONLY.exec(remainder);
  if (mq !== null) {
    return buildNameSection(mq[1]!, finalizeDisplay(mq[1]!), stereotype, color, tags);
  }

  const id = cleanId(remainder.trim());
  return buildNameSection(id, finalizeDisplay(id), stereotype, color, tags);
}

// ---------------------------------------------------------------------------
// Inline body parser (for single-line container blocks)
// ---------------------------------------------------------------------------

/**
 * Parse the body of a single-line container block such as { (A) [B] }.
 * Recognises: [Name] component, () Name interface, (Name) usecase, :Name: actor.
 */
export function parseInlineBody(body: string): DescriptiveNode[] {
  const nodes: DescriptiveNode[] = [];
  let m: RegExpExecArray | null;

  const compRe = /\[([^\]]+)\]/g;
  while ((m = compRe.exec(body)) !== null) {
    nodes.push(makeNode(m[1]!.trim(), m[1]!.trim(), 'component'));
  }

  const noBrackets = body.replace(/\[[^\]]*\]/g, '');

  const ifaceRe = /\(\)\s*(\S+)/g;
  while ((m = ifaceRe.exec(noBrackets)) !== null) {
    nodes.push(makeNode(m[1]!.trim(), m[1]!.trim(), 'interface'));
  }

  const noIface = noBrackets.replace(/\(\)\s*\S+/g, '');

  const parenRe = /\(([^)]+)\)/g;
  while ((m = parenRe.exec(noIface)) !== null) {
    nodes.push(makeNode(m[1]!.trim(), m[1]!.trim(), 'usecase'));
  }

  const colonRe = /:([^:]+):/g;
  const noParens = noIface.replace(/\([^)]*\)/g, '');
  while ((m = colonRe.exec(noParens)) !== null) {
    nodes.push(makeNode(m[1]!.trim(), m[1]!.trim(), 'actor'));
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Dynamic regexes derived from KEYWORD_TO_SYMBOL (single source of truth)
// ---------------------------------------------------------------------------

const CONTAINER_KW_ALT = [...CONTAINER_SYMBOLS].join('|');

const ALL_KW_ALT = [...KEYWORD_TO_SYMBOL.keys()]
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

/** Container keyword + inline body: package P { [A] [B] } */
export const CONTAINER_INLINE_RE = new RegExp(
  `^(${CONTAINER_KW_ALT})\\s+(.*?)\\s*\\{([^}]*)\\}\\s*$`,
  'i',
);

/** Container keyword opening a multi-line block: package P { */
export const CONTAINER_OPEN_RE = new RegExp(
  `^(${CONTAINER_KW_ALT})\\s+(.*?)\\s*\\{\\s*$`,
  'i',
);

/** Any keyword followed by at least one space and a name rest. */
export const KEYWORD_RE = new RegExp(`^(${ALL_KW_ALT})\\s+(.+)$`, 'i');

/** CommandCreateElementMultilines TYPE1: `<keyword> <code> [stereo][url]
 *  [#color] [` opening a multi-line `[ … ]` description block. The line ends
 *  with `[` and (crucially) no matching `]`; the body is closed by a line
 *  ending in `]`. Captures the keyword and the bare code only — the
 *  description text is label content (tolerant metric), not DOT structure. */
export const ELEMENT_MULTILINE_OPEN_RE = new RegExp(
  `^(${ALL_KW_ALT})\\s+([\\p{L}\\p{N}_.]+)` +
    '(?:\\s*(?:<<[^>]+>>|\\[\\[[^\\]]*\\]\\]|#\\w+))*' +
    '\\s*\\[[^\\[]*$',
  'iu',
);
