/**
 * `json` declaration commands for the state diagram parser — thin adapter
 * over the shared port in `core/command/CommandCreateJson.ts` (mission
 * shared-seam-extraction T9; formerly a 74%-line-identical clone of
 * `class/class-json-commands.ts`, D7).
 *
 * `StateDiagramFactory` registers these VERBATIM from the shared
 * `objectdiagram.command` package — the SAME classes `ClassDiagramFactory`
 * registers, not a state-specific reimplementation (mirrors this project's
 * `CommandRemoveRestore` precedent, `.agent-notes/A4-phase-L-iter13-
 * transition-grammar-singles.md`). Only the entity-creation plumbing differs
 * (state's scope-stack `declareState`/`makeState` in place of class's flat
 * `Classifier` index) — expressed here as a {@link JsonCommandHost} adapter,
 * NOT a state-specific reimplementation of the grammar/JSON parser.
 *
 * Multiline body lines are collected via `ps.pendingJson`
 * (state-parse-state.ts) — parser.ts's per-line loop intercepts them BEFORE
 * `dispatchCommand`, the same architecture `pendingNote` already uses for
 * multi-line note blocks. This is load-bearing, not a style choice: a json
 * body line (a quoted key, colon, quoted value) also happens to match rule
 * 15's generic CODE-colon-text standalone-description-line pattern
 * (state-commands.ts) — without the pre-dispatch interception, that line
 * silently auto-creates a BOGUS state from the key text instead of becoming
 * this json leaf's own field.
 *
 * This file contains ZERO raw double-quote glyphs (code OR comments) — see
 * `state-commands-declarations.ts`'s `DQUOTE` doc for why (the project's
 * lizard complexity hook desyncs on an unescaped double-quote character,
 * mis-scoping this file's own trailing `Command[]`-array-of-methods span).
 *
 * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateJson.java
 * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateJsonSingleLine.java
 * @see ~/git/plantuml/.../cucadiagram/BodierJSon.java
 * @see ~/git/plantuml/.../statediagram/StateDiagramFactory.java:115-116 (registration)
 * @see ../../core/command/CommandCreateJson.ts (the shared port)
 * @see src/diagrams/class/class-json-commands.ts (the class engine's own adapter)
 */

import type { State } from './ast.js';
import type { Command } from './state-commands.js';
import { type ParseState, type Pass, makeState } from './state-parse-state.js';
import { declareState } from './state-parse-resolve.js';
import {
  JSON_MULTILINE_DECL_RE,
  JSON_SINGLE_LINE_RE,
  applyJsonMultilineOpen,
  applyJsonSingleLine,
  type JsonCommandHost,
} from '../../core/command/CommandCreateJson.js';

// ---------------------------------------------------------------------------
// Pending multi-line body (parser.ts's per-line pre-dispatch interception —
// mirrors PendingNote/state-notes.ts's own precedent). Engine-specific: NOT
// part of the shared core port (the accumulation loop lives in parser.ts).
// ---------------------------------------------------------------------------

/** Non-null while inside a `json Name { ... }` multi-line body. Holds the
 *  CANONICAL target State object directly (not just its id) — the target
 *  may already have existed (global by-name reuse / pass-TWO replay of the
 *  SAME declaration), so re-resolving by id at the closer would be
 *  redundant at best and a fresh lookup risk at worst; `declareState`'s
 *  return value IS the single source of truth. */
export interface PendingJson {
  target: State;
  lines: string[];
}

/** `CommandCreateJson#END` — one or more whitespace, closing brace, one or
 *  more whitespace, anchored on both ends. */
export function isJsonCloser(line: string): boolean {
  return /^\s*\}\s*$/.test(line);
}

// ---------------------------------------------------------------------------
// Host adapter — state's scope-stack `declareState`/`makeState` in place of
// class's flat `Classifier` index. Bound to ONE pass, unlike class (which has
// no pass concept): stereotype/color are baked into `makeState`'s opts BEFORE
// `declareState` (its pass-gated `applyDeclaredContent` merge reads them off
// the state object handed in, so they must already be there — see
// `JsonCommandHost.resolve`'s doc in the shared port), and the actual
// `jsonValue` write is gated to pass ONE (mirrors `declareState`'s own
// `applyDeclaredContent` pass gate — every other single-line state
// declaration in this parser follows the same convention, so a pass-TWO
// replay is a safe no-op re-resolve rather than a double-apply). State never
// rejects a duplicate id the way class does (`reuseExisting` is accepted but
// unused) — `declareState` always resolves back to the canonical object,
// which is required for pass-TWO to replay the SAME declaration rather than
// collide with it; no fixture in the corpus exercises a genuine duplicate
// `json` declaration in a state diagram.
// ---------------------------------------------------------------------------

function adapt(ps: ParseState, pass: Pass): JsonCommandHost<State> {
  return {
    resolve(rawId, rawDisplay, stereotype, color) {
      const s = makeState(rawId, rawDisplay ?? rawId, 'json', {
        ...(color !== undefined ? { color } : {}),
        ...(stereotype !== undefined ? { stereotype } : {}),
      });
      return declareState(ps, s, pass);
    },
    beginBody(entity) {
      ps.pendingJson = entity !== undefined ? { target: entity, lines: [] } : null;
    },
    setJsonValue(entity, value) {
      if (pass === 'one') entity.jsonValue = value;
    },
  };
}

/**
 * JSON commands — spread into `COMMANDS` (state-commands.ts) right after
 * `NOTE_COMMANDS`, mirroring upstream `StateDiagramFactory.initCommandsList`'s
 * registration order (`CommandCreateJson`/`CommandCreateJsonSingleLine` sit
 * right before `CommonCommands.addCommonCommands1`, well after the note
 * family). `passes: ['one', 'two']` on both entries mirrors the
 * composite/frame opener precedent (state-commands-declarations.ts): the
 * pattern must match — and the body/entity resolution must run — on BOTH
 * passes so a multiline body is swallowed regardless of pass; the actual
 * `jsonValue` write is gated to pass ONE inside {@link adapt}.
 */
export const JSON_COMMANDS: readonly Command[] = [
  {
    pattern: JSON_MULTILINE_DECL_RE,
    passes: ['one', 'two'],
    execute: (ps, match, pass) => applyJsonMultilineOpen(adapt(ps, pass), match),
  },
  {
    pattern: JSON_SINGLE_LINE_RE,
    passes: ['one', 'two'],
    execute: (ps, match, pass) => applyJsonSingleLine(adapt(ps, pass), match),
  },
];
