/**
 * `json` declaration command shared by the class and state diagram parsers
 * (`CommandCreateJson` + `CommandCreateJsonSingleLine` + `BodierJSon`).
 *
 * Upstream registers these two classes VERBATIM from the `objectdiagram
 * .command` package into THREE factories — `ClassDiagramFactory:118-119`,
 * `StateDiagramFactory:115-116`, `DescriptionDiagramFactory:130-131` — one
 * shared implementation, not a per-engine reimplementation. This port mirrors
 * that: the regex grammar, the hand-rolled order-preserving JSON body parser,
 * and the open/single-line apply logic live here ONCE; each engine supplies a
 * small {@link JsonCommandHost} adapter for its own entity-creation mechanics
 * (class: namespace-qualified `Classifier` index; state: scope-stack
 * `declareState`) via {@link jsonCommands}. `DescriptionDiagramFactory` is
 * NOT wired this mission (follow-on — mission shared-seam-extraction D7).
 *
 * A plain JS object/array (via `JSON.parse`) would silently reorder
 * purely-numeric string keys ahead of non-numeric ones — a real hazard for a
 * JSON leaf whose key order is user-visible table row order. The
 * recursive-descent parser below preserves source order unconditionally by
 * building {@link JsonNode} directly instead of round-tripping through a JS
 * object.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/command/CommandCreateJson.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/objectdiagram/command/CommandCreateJsonSingleLine.java
 */

import type { Command } from './Command.js';
import type { JsonNode } from './JsonNode.js';

// ---------------------------------------------------------------------------
// Header grammar (NameAndCodeParser.nameAndCode() + ColorParser.exp1()) —
// CommandCreateJson.java:83-95, CommandCreateJsonSingleLine.java:72-91.
// ---------------------------------------------------------------------------

/** Upstream CODE = `[^%s{}%g<>]+`. */
const CODE = '[^\\s{}\x22<>]+';

/**
 * `NameAndCodeParser.nameAndCode()`'s four ordered alternatives — the SAME
 * grammar the `object`/`map` multiline/single-line openers use (upstream
 * calls the identical static method). Capture groups: 1 DISPLAY1, 2 CODE1,
 * 3 CODE2, 4 DISPLAY2, 5 CODE3, 6 CODE4.
 */
const NAME_AND_CODE =
  '(?:' +
  '\x22([^\x22]*)\x22\\s+as\\s+(' + CODE + ')' +
  '|(' + CODE + ')\\s+as\\s+\x22([^\x22]*)\x22' +
  '|(' + CODE + ')' +
  '|\x22([^\x22]+)\x22' +
  ')';

/** Upstream NAME (single-line form) = `(?:[%g]([^%g]+)[%g][%s]+as[%s]+)?
 *  ([%pLN_.]+)`. */
const SINGLE_LINE_NAME = '(?:\x22([^\x22]*)\x22\\s+as\\s+)?([\\w.]+)';

/** `StereotypePattern.optional("STEREO")`. */
const STEREO = '(?:\\s*<<\\s*([^<>]+?)\\s*>>)?';

/** `UrlBuilder.OPTIONAL` — matched and discarded. */
const URL = '(?:\\s*\\[\\[[^\\]]*\\]\\])?';

/** `ColorParser.exp1()` — json has no separate LINECOLOR group, unlike `map`/
 *  `state`'s own declaration grammar. */
const COLOR =
  '(#(?:\\w+[-\\\\|/]?\\w+;)?(?:(?:text|back|header|line|line\\.dashed|' +
  'line\\.dotted|line\\.bold|shadowing)(?::\\w+[-\\\\|/]?\\w+)?' +
  '(?:;|(?![\\w;:.])))+|#\\w+[-\\\\|/]?\\w+)?';

/**
 * `json <name-and-code> [<<stereo>>] [[[url]]] [#color] {` — mandatory
 * trailing `{` (upstream `RegexLeaf("\\{")` then `RegexLeaf.end()`, no
 * optional-brace alternative; `CommandCreateJson.java:83-94`). Capture
 * groups: 1-6 NAME_AND_CODE, 7 STEREO, 8 COLOR.
 */
export const JSON_MULTILINE_DECL_RE = new RegExp(
  '^json\\s+' + NAME_AND_CODE + STEREO + URL + '\\s*' + COLOR + '\\s*\\{\\s*$',
  'i',
);

/**
 * `json <name> [<<stereo>>] [[[url]]] [#color] <data>` — DATA is captured as
 * ONE group spanning whichever of the 6 upstream alternatives
 * (boolean/number/null/string/array/object,
 * `CommandCreateJsonSingleLine.java:82-89`) matches; the exact match SPAN
 * mirrors upstream's `RegexOr` (alternatives tried in the same order, same
 * greedy sub-patterns), but this parser determines the value's actual kind
 * by re-parsing the captured text with {@link parseJsonNode} rather than
 * tracking which of the 6 branches matched. Capture groups: 1-2 NAME,
 * 3 STEREO, 4 COLOR, 5 DATA. Upstream's DATA_NUMBER is integer-only
 * (`-?\d+`, no decimal point) — ported faithfully, not "fixed".
 */
export const JSON_SINGLE_LINE_RE = new RegExp(
  '^json\\s+' +
    SINGLE_LINE_NAME +
    STEREO +
    URL +
    '\\s*' +
    COLOR +
    '\\s*(' +
    '(?:true|false)' +
    '|(?:-?\\d+)' +
    '|(?:null)' +
    '|(?:\x22.*\x22)' +
    '|(?:\\[.*\\])' +
    '|(?:\\{\\s*\x22(?:\\\\\x22|[^\x22])+\x22\\s*:.*\\})' +
    ')\\s*$',
  'i',
);

// ---------------------------------------------------------------------------
// Hand-rolled, order-preserving JSON parser
// ---------------------------------------------------------------------------

interface Cursor {
  text: string;
  pos: number;
}

const QUOTE = '\x22';

function skipWs(c: Cursor): void {
  while (c.pos < c.text.length && ' \t\r\n'.includes(c.text[c.pos]!)) c.pos++;
}

function parseJsonString(c: Cursor): string {
  c.pos++; // opening quote
  let out = '';
  while (c.pos < c.text.length && c.text[c.pos] !== QUOTE) {
    const ch = c.text[c.pos]!;
    if (ch === '\\') {
      const esc = c.text[c.pos + 1];
      const map: Record<string, string> = { '"': QUOTE, '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
      if (esc !== undefined && esc in map) {
        out += map[esc];
        c.pos += 2;
      } else if (esc === 'u') {
        out += String.fromCharCode(parseInt(c.text.slice(c.pos + 2, c.pos + 6), 16));
        c.pos += 6;
      } else {
        out += ch;
        c.pos++;
      }
    } else {
      out += ch;
      c.pos++;
    }
  }
  c.pos++; // closing quote
  return out;
}

function parseJsonNumber(c: Cursor): number {
  const m = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(c.text.slice(c.pos));
  if (m === null) throw new Error('expected number');
  c.pos += m[0].length;
  return Number(m[0]);
}

function parseJsonObject(c: Cursor): JsonNode {
  c.pos++; // '{'
  skipWs(c);
  const entries: { key: string; value: JsonNode }[] = [];
  if (c.text[c.pos] === '}') {
    c.pos++;
    return { kind: 'object', entries };
  }
  for (;;) {
    skipWs(c);
    const key = parseJsonString(c);
    skipWs(c);
    if (c.text[c.pos] !== ':') throw new Error('expected :');
    c.pos++;
    skipWs(c);
    entries.push({ key, value: parseJsonValue(c) });
    skipWs(c);
    if (c.text[c.pos] === ',') { c.pos++; continue; }
    if (c.text[c.pos] === '}') { c.pos++; break; }
    throw new Error('expected , or }');
  }
  return { kind: 'object', entries };
}

function parseJsonArray(c: Cursor): JsonNode {
  c.pos++; // '['
  skipWs(c);
  const items: JsonNode[] = [];
  if (c.text[c.pos] === ']') {
    c.pos++;
    return { kind: 'array', items };
  }
  for (;;) {
    skipWs(c);
    items.push(parseJsonValue(c));
    skipWs(c);
    if (c.text[c.pos] === ',') { c.pos++; continue; }
    if (c.text[c.pos] === ']') { c.pos++; break; }
    throw new Error('expected , or ]');
  }
  return { kind: 'array', items };
}

function parseJsonValue(c: Cursor): JsonNode {
  skipWs(c);
  const ch = c.text[c.pos];
  if (ch === '{') return parseJsonObject(c);
  if (ch === '[') return parseJsonArray(c);
  if (ch === QUOTE) return { kind: 'scalar', value: parseJsonString(c) };
  if (c.text.startsWith('true', c.pos)) { c.pos += 4; return { kind: 'scalar', value: true }; }
  if (c.text.startsWith('false', c.pos)) { c.pos += 5; return { kind: 'scalar', value: false }; }
  if (c.text.startsWith('null', c.pos)) { c.pos += 4; return { kind: 'scalar', value: null }; }
  return { kind: 'scalar', value: parseJsonNumber(c) };
}

/**
 * Parse a complete JSON text into a {@link JsonNode}, or `null` on any
 * malformed input (mirrors `JsonParser#parse` throwing -> `getJsonValue`
 * catching and returning `null`, `CommandCreateJson.java:163-185` /
 * `CommandCreateJsonSingleLine.java:146-156`).
 */
export function parseJsonNode(text: string): JsonNode | null {
  try {
    const c: Cursor = { text, pos: 0 };
    const value = parseJsonValue(c);
    skipWs(c);
    if (c.pos !== c.text.length) throw new Error('trailing data');
    return value;
  } catch {
    return null;
  }
}

/**
 * Finalize a closed `json { ... }` multi-line body, given its accumulated
 * raw lines (each engine's own per-line pending-body loop calls this once
 * the closing `}` is reached — `CommandCreateJson#getJsonString` +
 * `getJsonValue`, `CommandCreateJson.java:163-195`). Body lines are
 * concatenated with NO separator (upstream: `sb.append(sl.getString())` per
 * line, no added newline/space — a property line's own trailing `,` already
 * separates it from the next), then wrapped in `{`/`}` to reconstruct the
 * object literal. On parse failure, upstream retries the SAME concatenation
 * WITHOUT the `{`/`}` wrapper ("let's see if we could ignore external
 * brackets..." — a fallback for a body that already supplies its own outer
 * braces; `CommandCreateJson.java:172-182`) — ported the same way here.
 * `executeNow` creates the leaf entity BEFORE this validation and never
 * removes it on failure (`CommandExecutionResult.error("Bad data")`, no
 * `setJson` call) — mirrored by simply leaving `entity.jsonValue` unset.
 */
export function finalizeJsonBody<E extends { jsonValue?: JsonNode }>(
  entity: E,
  rawLines: readonly string[],
): void {
  const body = rawLines.join('');
  const wrapped = parseJsonNode('{' + body + '}');
  const value = wrapped ?? parseJsonNode(body);
  if (value !== null) entity.jsonValue = value;
}

// ---------------------------------------------------------------------------
// Header field extraction — shared by both apply functions below.
// ---------------------------------------------------------------------------

interface JsonHeaderMatch {
  rawId: string;
  rawDisplay: string | undefined;
  stereotype: string | undefined;
  color: string | undefined;
}

/** Pulls id/display/stereotype/color out of a {@link JSON_MULTILINE_DECL_RE}
 *  match (`CommandCreateJson#executeArg0`'s `line0.getLazzy("CODE", 0)` /
 *  `.get("STEREO"/"COLOR", 0)` reads, `CommandCreateJson.java:199-218`). */
function parseJsonMultilineMatch(match: RegExpExecArray): JsonHeaderMatch {
  const rawCode = match[2] ?? match[3] ?? match[5] ?? match[6];
  const rawDisplay = match[1] ?? match[4];
  return {
    rawId: (rawCode ?? rawDisplay)!,
    rawDisplay,
    stereotype: match[7]?.trim(),
    color: match[8],
  };
}

// ---------------------------------------------------------------------------
// Engine adapter surface
// ---------------------------------------------------------------------------

/**
 * Engine-agnostic surface {@link jsonCommands} needs from a diagram's parse
 * state to open/close a `json` declaration (`CommandCreateJson`/
 * `CommandCreateJsonSingleLine`'s shared `executeArg0`,
 * `CommandCreateJson.java:197-222` / `CommandCreateJsonSingleLine.java:158-
 * 182` — identical bodies apart from `quarkInContext`'s reuse flag). `E` is
 * the engine's own leaf/entity type (class's `Classifier`, state's `State`)
 * — both already carry an optional `jsonValue?: JsonNode` field.
 */
export interface JsonCommandHost<E> {
  /**
   * Resolve-or-create the target entity for a `json` declaration, applying
   * `stereotype`/`color` as part of THIS SAME call rather than as a later
   * mutation on the returned entity — state's `declareState` merges
   * re-declared content through a pass-gated path keyed off the state
   * object handed in, so stereotype/color must already be on it before that
   * call, not applied afterward (mirrors `CommandCreateJson#executeArg0`
   * building its `Entity` with everything already resolved). Returns
   * `undefined` when the id already exists and the engine treats that as a
   * rejected duplicate (`executeArg0`'s `quark.getData() != null` -> `null`,
   * "JSON already exists") — the caller still opens (and immediately
   * discards) a multi-line body so its lines don't leak to the top-level
   * dispatcher as bogus commands.
   */
  resolve(
    rawId: string,
    rawDisplay: string | undefined,
    stereotype: string | undefined,
    color: string | undefined,
    reuseExisting: boolean,
  ): E | undefined;
  /** Begin (or, for a duplicate `entity === undefined`, discard) a
   *  multi-line `{ ... }` body. Only called by the multiline opener. */
  beginBody(entity: E | undefined): void;
  /** Store a parsed single-line JSON value on `entity`. */
  setJsonValue(entity: E, value: JsonNode): void;
}

/**
 * Open a `json Name { ... }` body (`CommandCreateJson#executeArg0` +
 * `executeNow`'s header handling, `CommandCreateJson.java:136-152,197-222`).
 * `reuseExisting=true` — matches `quarkInContext(true, idShort)`. Exported
 * (not just used via {@link jsonCommands}) so an engine whose own `Command
 * <S>` is not this module's 2-argument shape — state's dispatch table adds
 * a third `pass` argument, D4 — can build its own table entries around a
 * per-pass host while still sharing this apply logic (see
 * `state-json-commands.ts`).
 */
export function applyJsonMultilineOpen<E>(host: JsonCommandHost<E>, match: RegExpExecArray): void {
  const { rawId, rawDisplay, stereotype, color } = parseJsonMultilineMatch(match);
  const entity = host.resolve(rawId, rawDisplay, stereotype, color, true);
  host.beginBody(entity);
}

/**
 * Apply one matched `json Name value` line
 * (`CommandCreateJsonSingleLine#executeArg` + `executeArg0`,
 * `CommandCreateJsonSingleLine.java:130-144,158-182`). `reuseExisting=false`
 * — a DELIBERATE asymmetry from the multiline opener above
 * (`executeArg0`'s `quarkInContext(false, diagram.cleanId(name))` vs
 * `CommandCreateJson#executeArg0`'s `quarkInContext(true, idShort)`),
 * preserved faithfully rather than normalized to match its multiline
 * sibling. Exported for the same reason as {@link applyJsonMultilineOpen}.
 */
export function applyJsonSingleLine<E>(host: JsonCommandHost<E>, match: RegExpExecArray): void {
  const rawDisplay = match[1];
  const rawId = match[2]!;
  const stereotype = match[3]?.trim();
  const color = match[4];
  const dataText = match[5]!;

  const entity = host.resolve(rawId, rawDisplay, stereotype, color, false);
  if (entity === undefined) return; // "JSON already exists" — no-op

  const value = parseJsonNode(dataText);
  if (value !== null) host.setJsonValue(entity, value);
}

/**
 * Build the two `json` dispatch-table entries (multiline opener,
 * single-line form) for a host of type `E`, adapted from parse state `S`,
 * using this module's own `Command<S>` shape (`core/command/Command.ts`,
 * `execute(state, match)`, no `pass` argument). Multiline listed first —
 * mirrors upstream `ClassDiagramFactory.initCommandsList`'s registration
 * order: `CommandCreateMap`(117), `CommandCreateJson`(118),
 * `CommandCreateJsonSingleLine`(119); never collides with single-line (the
 * multiline pattern requires a trailing `{`, the single-line one requires a
 * DATA_ value instead).
 *
 * An engine whose own `Command<S>` is a DIFFERENT shape (state's dispatch
 * table adds a third `pass` argument, D4) does not call this factory —
 * it builds its own table entries directly around {@link
 * applyJsonMultilineOpen}/{@link applyJsonSingleLine} and a per-pass host
 * (see `state-json-commands.ts`).
 */
export function jsonCommands<S, E>(adapt: (state: S) => JsonCommandHost<E>): Command<S>[] {
  return [
    {
      pattern: JSON_MULTILINE_DECL_RE,
      execute: (state, match) => applyJsonMultilineOpen(adapt(state), match),
    },
    {
      pattern: JSON_SINGLE_LINE_RE,
      execute: (state, match) => applyJsonSingleLine(adapt(state), match),
    },
  ];
}
