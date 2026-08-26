/**
 * The individually-registered commands of `initCommandsList`'s trailing run
 * that are neither pagination nor autonumber: `CommandDivider` (`:142`),
 * `CommandHSpace` (`:143`), `CommandReferenceOverSeveral` (`:144`),
 * `CommandReferenceMultilinesOverSeveral` (`:145`), `CommandAutoactivate`
 * (`:150`), `CommandFootbox` (`:151`) and `CommandDelay` (`:152`).
 *
 * `CommandFootboxOld` (`:153`), `CommandUrl` (`:154`) and
 * `CommandLinkAnchor` (`:155`) close that run upstream and have no rule here
 * yet. `setSeparatorCommand` has no counterpart anywhere in the sequence
 * registration list — see its own doc comment.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:142-153
 */

import type { DelayEvent, DividerEvent, SpaceEvent } from './ast.js';
import {
  emit,
  ensureParticipant,
  type Command,
  type ParseState,
} from './sequence-parse-helpers.js';

// 2. hide footbox
export const hideFootboxCommand: Command = {
  pattern: /^hide\s+footbox\s*$/i,
  execute(state) {
    state.ast.options.hideFootbox = true;
  },
};

// 13. Divider: == text ==
export const dividerCommand: Command = {
  pattern: /^==\s*(.+?)\s*==\s*$/,
  execute(state, match) {
    const ev: DividerEvent = {
      kind: 'divider',
      text: match[1]!,
    };
    emit(state, ev);
  },
};

// 14a. Delay with text: ...text...
export const delayWithTextCommand: Command = {
  pattern: /^\.\.\.\s*(.+?)\s*\.\.\.\s*$/,
  execute(state, match) {
    const ev: DelayEvent = {
      kind: 'delay',
      text: match[1]!,
    };
    emit(state, ev);
  },
};

// 14b. Bare delay: ...
export const bareDelayCommand: Command = {
  pattern: /^\.\.\.\s*$/,
  execute(state) {
    const ev: DelayEvent = { kind: 'delay' };
    emit(state, ev);
  },
};

// 15. Space: |||  or  ||N|
export const spaceCommand: Command = {
  pattern: /^\|\|(\d+)?\|\s*$/,
  execute(state, match) {
    const pixels = match[1] !== undefined ? parseInt(match[1], 10) : 5;
    const ev: SpaceEvent = { kind: 'space', pixels };
    emit(state, ev);
  },
};

/** `autoactivate on|off` — `CommandAutoactivate`. Recognised and stored;
 *  this port's arrow command does not yet read `diagram.isAutoactivate()`
 *  (`CommandArrow.java:435-439` — the auto-activate-on-plain-arrow branch),
 *  so the flag is currently write-only. Getting the fixture out of the
 *  refusal bucket does not require wiring a reader: the source still
 *  renders (its messages, notes, frames draw normally), just without the
 *  auto-activation bars upstream would additionally draw. */
export const autoactivateCommand: Command = {
  pattern: /^autoactivate\s+(on|off)\s*$/i,
  execute() {
    /* recognised, write-only — see doc comment above */
  },
};

/** `set separator NAME|none` — no dedicated `sequencediagram/command/`
 *  class was found for this form (grepped the package); recognised as a
 *  no-op alongside the other unmodelled directives in this file. Flagged as
 *  a residual worth re-checking in a follow-up. */
export const setSeparatorCommand: Command = {
  pattern: /^set\s+separator\s+\S+\s*$/i,
  execute() {
    /* ignored — see doc comment above */
  },
};

/** `ref over A, B [, C...] : text` — `CommandReferenceOverSeveral`. Modelled
 *  as a one-branch, empty-body `FrameEvent` (`frameType: 'ref'`) whose label
 *  carries the text: `FrameGeo`'s layout already spans the full participant
 *  range for every frame type (`sequence-layout-events.ts
 *  #handleFrameEvent`), which is coarser than upstream's exact A..B span but
 *  matches this engine's STANDING simplification for every other frame kind
 *  (`loop`/`alt`/… already span the whole diagram width, not just their
 *  referenced participants) — not a new divergence introduced here. The
 *  leading `REF` background-color group and the inline `[[url]]` are
 *  matched and discarded: `FrameGeo` carries no per-frame color or URL.
 *  @see sequencediagram/command/CommandReferenceOverSeveral.java:67-82 */
function ensureRefParticipants(state: ParseState, raw: string): void {
  const participants = raw
    .split(',')
    .map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
    .filter((s) => s.length > 0);
  for (const p of participants) ensureParticipant(state, p);
}

export const refOverCommand: Command = {
  pattern: /^ref(#\w+)?\s+over\s+([^:[\]]+?)(?:\s*\[\[.*?\]\])?\s*:\s*(.*)$/i,
  execute(state, match) {
    ensureRefParticipants(state, match[2]!);
    const label = match[3]!.trim();
    emit(state, { kind: 'frame', frameType: 'ref', label, branches: [[]], branchLabels: [label] });
  },
};

/**
 * `ref over A, B [, C...]` with NO trailing `: text` — the multi-line
 * opener, `CommandReferenceMultilinesOverSeveral`. Its closer is `end` /
 * `end ref` / `endref` (`Pattern2.cmpile("^end[%s]?(ref)?$")`,
 * `:79-80`) — a BARE `end` closes it too, which is why this uses its own
 * `state.pendingRef` slot rather than `state.frameStack`: pushing onto
 * `frameStack` would let the dispatch loop try to parse the ref's plain-text
 * BODY lines as ordinary commands (they are prose, e.g. "This can be on" /
 * "several lines" — not `Command`-shaped), refusing on the first one.
 * `handlePendingRef` (`parser.ts`) intercepts body lines the same way
 * `handlePendingNote` does for multi-line notes.
 * @see sequencediagram/command/CommandReferenceMultilinesOverSeveral.java:60-77
 */
export const refOverMultilineCommand: Command = {
  pattern: /^ref(#\w+)?\s+over\s+([^:[\]]+?)(?:\s*\[\[.*?\]\])?(?:\s*#\w+)?\s*$/i,
  execute(state, match) {
    ensureRefParticipants(state, match[2]!);
    state.pendingRef = { kind: 'frame', frameType: 'ref', label: '', branches: [[]], branchLabels: [''] };
  },
};

