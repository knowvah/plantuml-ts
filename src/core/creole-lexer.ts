/**
 * Creole markup lexer + inline-style parser.
 *
 * A sibling of `src/core/creole.ts` (kept in a separate module: creole.ts
 * exceeded this repo's 500-line-per-file cap; see
 * `~/.claude/hooks/check-complexity.py`). This file owns the
 * tokeniser/parser core — turning a raw Creole/HTML-inline string into a flat
 * list of styled `CreoleSpan`s. `creole.ts` re-exports `CreoleSpan` and
 * composes this module's `tokenise`/`parseTokens`/`mergeSpans` into the
 * public `parseCreole` entry point.
 *
 * Supported markup:
 *   **text**          — bold
 *   //text//          — italic
 *   __text__          — underline
 *   --text--          — strikethrough
 *   <color:X>text</color>  — text colour
 *   <b>text</b>       — bold (HTML alias)
 *   <i>text</i>       — italic (HTML alias)
 *   <u>text</u>       — underline (HTML alias)
 *   <s>text</s>       — strikethrough (HTML alias)
 *
 * Markup may be nested. Unclosed markup is treated as literal text.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CreoleSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color?: string;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** The formatting state that is active at a given point during parsing. */
interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color?: string;
}

export const EMPTY_STATE: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
};

/**
 * A token produced by the lexer.
 *
 * Symmetric Creole delimiters (**, //, __, --) use a single token kind for
 * both open and close; the parser uses the same kind when searching for the
 * closing delimiter. Asymmetric HTML-style tags have separate open/close
 * kinds.
 */
type Token =
  | { kind: 'text'; value: string }
  | { kind: 'bold' }
  | { kind: 'italic' }
  | { kind: 'underline' }
  | { kind: 'strike' }
  | { kind: 'open-color'; color: string }
  | { kind: 'close-color' }
  | { kind: 'open-b' }
  | { kind: 'close-b' }
  | { kind: 'open-i' }
  | { kind: 'close-i' }
  | { kind: 'open-u' }
  | { kind: 'close-u' }
  | { kind: 'open-s' }
  | { kind: 'close-s' };

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

/** Symmetric 2-char Creole delimiters, checked in this order at each position. */
const SYMMETRIC_DELIMS: ReadonlyArray<{
  literal: string;
  kind: 'bold' | 'italic' | 'underline' | 'strike';
}> = [
  { literal: '**', kind: 'bold' },
  { literal: '//', kind: 'italic' },
  { literal: '__', kind: 'underline' },
  { literal: '--', kind: 'strike' },
];

/** `<b>`/`<i>`/`<u>`/`<s>` HTML-style tags, checked in this order. */
const SIMPLE_TAGS: ReadonlyArray<{
  open: string;
  openKind: 'open-b' | 'open-i' | 'open-u' | 'open-s';
  close: string;
  closeKind: 'close-b' | 'close-i' | 'close-u' | 'close-s';
}> = [
  { open: '<b>', openKind: 'open-b', close: '</b>', closeKind: 'close-b' },
  { open: '<i>', openKind: 'open-i', close: '</i>', closeKind: 'close-i' },
  { open: '<u>', openKind: 'open-u', close: '</u>', closeKind: 'close-u' },
  { open: '<s>', openKind: 'open-s', close: '</s>', closeKind: 'close-s' },
];

/** Match a symmetric Creole delimiter (**, //, __, --) at `pos`, if any. */
function matchSymmetricDelim(input: string, pos: number): Token | undefined {
  for (const d of SYMMETRIC_DELIMS) {
    if (input.startsWith(d.literal, pos)) return { kind: d.kind };
  }
  return undefined;
}

/**
 * Match `<color:X>` / `</color>` at `pos`, if any. Close is checked before
 * open to mirror the original hand-written scan order.
 */
function matchColorTag(
  input: string,
  pos: number,
): { token: Token; length: number } | undefined {
  if (input.startsWith('</color>', pos)) {
    return { token: { kind: 'close-color' }, length: 8 };
  }
  if (input.startsWith('<color:', pos)) {
    const end = input.indexOf('>', pos);
    if (end !== -1) {
      const color = input.slice(pos + 7, end);
      return { token: { kind: 'open-color', color }, length: end + 1 - pos };
    }
  }
  return undefined;
}

/**
 * Match a `<b>`/`<i>`/`<u>`/`<s>` open or close tag at `pos`, if any. For
 * each tag, close is checked before open to mirror the original scan order.
 */
function matchSimpleTag(
  input: string,
  pos: number,
): { token: Token; length: number } | undefined {
  for (const tag of SIMPLE_TAGS) {
    if (input.startsWith(tag.close, pos)) {
      return { token: { kind: tag.closeKind }, length: tag.close.length };
    }
    if (input.startsWith(tag.open, pos)) {
      return { token: { kind: tag.openKind }, length: tag.open.length };
    }
  }
  return undefined;
}

/** Append a plain-text character, coalescing with the previous text token. */
function appendTextChar(tokens: Token[], input: string, pos: number): void {
  const last = tokens.at(-1);
  if (last?.kind === 'text') {
    last.value += input[pos];
  } else {
    tokens.push({ kind: 'text', value: input[pos] ?? '' });
  }
}

/**
 * Tokenise the input string into a flat list of tokens.
 *
 * The lexer uses a single left-to-right scan, trying each pattern at the
 * current position: symmetric Creole delimiters, then `<color:.../</color>`,
 * then the simple HTML-alias tags, then a plain-text fallback.
 */
export function tokenise(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const sym = matchSymmetricDelim(input, pos);
    if (sym !== undefined) {
      tokens.push(sym);
      pos += 2;
      continue;
    }

    const color = matchColorTag(input, pos);
    if (color !== undefined) {
      tokens.push(color.token);
      pos += color.length;
      continue;
    }

    const tag = matchSimpleTag(input, pos);
    if (tag !== undefined) {
      tokens.push(tag.token);
      pos += tag.length;
      continue;
    }

    appendTextChar(tokens, input, pos);
    pos += 1;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Span merging
// ---------------------------------------------------------------------------

/** Two spans are mergeable when they share identical formatting state. */
function sameFormat(a: CreoleSpan, b: CreoleSpan): boolean {
  return (
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.strikethrough === b.strikethrough &&
    a.color === b.color
  );
}

/**
 * Collapse adjacent spans that have identical formatting into a single span.
 *
 * This is needed because unclosed delimiters are emitted as literal text
 * tokens, which would otherwise produce two consecutive plain spans (one for
 * the delimiter chars, one for the following text).
 */
export function mergeSpans(spans: CreoleSpan[]): CreoleSpan[] {
  const result: CreoleSpan[] = [];
  for (const span of spans) {
    const last = result.at(-1);
    if (last !== undefined && sameFormat(last, span)) {
      last.text += span.text;
    } else {
      result.push({ ...span });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/** Table-driven entry for the eight boolean-toggle delimiters. */
interface BooleanDelimEntry {
  closeKind: Token['kind'];
  field: 'bold' | 'italic' | 'underline' | 'strikethrough';
  literal: string;
}

const BOOLEAN_DELIMS: Record<
  'bold' | 'italic' | 'underline' | 'strike' | 'open-b' | 'open-i' | 'open-u' | 'open-s',
  BooleanDelimEntry
> = {
  bold: { closeKind: 'bold', field: 'bold', literal: '**' },
  italic: { closeKind: 'italic', field: 'italic', literal: '//' },
  underline: { closeKind: 'underline', field: 'underline', literal: '__' },
  strike: { closeKind: 'strike', field: 'strikethrough', literal: '--' },
  'open-b': { closeKind: 'close-b', field: 'bold', literal: '<b>' },
  'open-i': { closeKind: 'close-i', field: 'italic', literal: '<i>' },
  'open-u': { closeKind: 'close-u', field: 'underline', literal: '<u>' },
  'open-s': { closeKind: 'close-s', field: 'strikethrough', literal: '<s>' },
};

/** Literal text emitted for an orphan (unmatched) HTML-style close tag. */
const ORPHAN_CLOSE_LITERAL: Record<
  'close-color' | 'close-b' | 'close-i' | 'close-u' | 'close-s',
  string
> = {
  'close-color': '</color>',
  'close-b': '</b>',
  'close-i': '</i>',
  'close-u': '</u>',
  'close-s': '</s>',
};

/**
 * Scan forward from `start` looking for the first token whose kind matches
 * `closeKind`.
 */
function findClose(tokens: Token[], start: number, closeKind: Token['kind']): number {
  for (let j = start; j < tokens.length; j++) {
    if (tokens[j]?.kind === closeKind) return j;
  }
  return -1;
}

/**
 * Append `text` (rendered with `state`'s current formatting) to `spans` as a
 * new span. A zero-length text produces no span.
 */
function flushText(spans: CreoleSpan[], state: FormatState, text: string): void {
  if (text.length === 0) return;
  const span: CreoleSpan = { ...state, text };
  if (state.color === undefined) {
    delete span.color;
  }
  spans.push(span);
}

/** True when `kind` is one of the eight boolean-toggle delimiter kinds. */
function isBooleanDelimKind(kind: Token['kind']): kind is keyof typeof BOOLEAN_DELIMS {
  return kind in BOOLEAN_DELIMS;
}

/** True when `kind` is one of the five orphan HTML-style close-tag kinds. */
function isOrphanCloseKind(kind: Token['kind']): kind is keyof typeof ORPHAN_CLOSE_LITERAL {
  return kind in ORPHAN_CLOSE_LITERAL;
}

/**
 * Handle one of the eight boolean-toggle delimiters (bold/italic/underline/
 * strikethrough, Creole or HTML-alias spelling). If unclosed, the literal
 * delimiter text is flushed; otherwise the enclosed tokens are parsed
 * recursively with the toggled state.
 */
function applyBooleanDelim(
  tokens: Token[],
  i: number,
  state: FormatState,
  entry: BooleanDelimEntry,
): { spans: CreoleSpan[]; nextI: number } {
  const closeIdx = findClose(tokens, i + 1, entry.closeKind);
  if (closeIdx === -1) {
    const spans: CreoleSpan[] = [];
    flushText(spans, state, entry.literal);
    return { spans, nextI: i + 1 };
  }
  const nested: FormatState = { ...state };
  nested[entry.field] = true;
  return { spans: parseTokens(tokens.slice(i + 1, closeIdx), nested), nextI: closeIdx + 1 };
}

/**
 * Handle `<color:X>...</color>`. If unclosed, the literal open-tag text is
 * flushed; otherwise the enclosed tokens are parsed recursively with the
 * colour applied.
 */
function applyColorDelim(
  tokens: Token[],
  i: number,
  state: FormatState,
  color: string,
): { spans: CreoleSpan[]; nextI: number } {
  const closeIdx = findClose(tokens, i + 1, 'close-color');
  if (closeIdx === -1) {
    const spans: CreoleSpan[] = [];
    flushText(spans, state, `<color:${color}>`);
    return { spans, nextI: i + 1 };
  }
  const nested: FormatState = { ...state, color };
  return { spans: parseTokens(tokens.slice(i + 1, closeIdx), nested), nextI: closeIdx + 1 };
}

/**
 * Parse the token stream into spans using a "paired-delimiter" strategy.
 *
 * Each toggle token (e.g. `bold`) is tentative: it becomes a real format
 * boundary only when a matching close token is found later in the stream. If
 * no matching close exists, the delimiter characters are emitted as literal
 * text.
 */
export function parseTokens(tokens: Token[], state: FormatState): CreoleSpan[] {
  const spans: CreoleSpan[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === undefined) break;

    if (tok.kind === 'text') {
      flushText(spans, state, tok.value);
      i++;
    } else if (isBooleanDelimKind(tok.kind)) {
      const { spans: nested, nextI } = applyBooleanDelim(tokens, i, state, BOOLEAN_DELIMS[tok.kind]);
      spans.push(...nested);
      i = nextI;
    } else if (tok.kind === 'open-color') {
      const { spans: nested, nextI } = applyColorDelim(tokens, i, state, tok.color);
      spans.push(...nested);
      i = nextI;
    } else if (isOrphanCloseKind(tok.kind)) {
      flushText(spans, state, ORPHAN_CLOSE_LITERAL[tok.kind]);
      i++;
    }
  }

  return spans;
}
