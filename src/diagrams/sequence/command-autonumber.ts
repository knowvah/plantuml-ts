/**
 * The autonumber block: `CommandAutonumber` (`SequenceDiagramFactory
 * .java:146`), `CommandAutonumberStop` (`:147`), `CommandAutonumberResume`
 * (`:148`) and `CommandAutonumberIncrement` (`:149`), registered as four
 * consecutive entries.
 *
 * All four share the mutable cursor `SequenceDiagramAST.autonumber` --
 * upstream's `AutoNumber`/`DottedNumber` pair (`AutoNumber.java`,
 * `DottedNumber.java`). This port's AST models that cursor as
 * `{ enabled, start, current, step, prefix, format }` rather than
 * `DottedNumber`'s `List<Integer> nums` / `List<String> separators` (see
 * `ast.ts:230-242`'s doc comment: multi-segment `incrementIntermediate` was
 * explicitly left unmodelled there). `autonumberIncrementCommand` below
 * still ports `incrementIntermediate` faithfully WITHOUT a new AST field --
 * `prefix + String(current)` already carries every segment as a string, so
 * the command re-derives the segment list locally (mirroring
 * `DottedNumber.create`'s own `(\d+)|(\D+)` split), bumps it, and folds the
 * result back through the existing `parseDottedStart` (last-digit-run split)
 * that `prefix`/`current` already use. No `ast.ts` change is needed or made.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:146-149
 */

import { parseDottedStart, type Command } from './sequence-parse-helpers.js';

// 3. autonumber. T13: widened for `autonumber START STEP "FORMAT"`, where
//    START may be a dotted number (`1.1`, `1-1:1`) and FORMAT a quoted
//    DecimalFormat pattern -- see `parseDottedStart`/`formatAutonumber`.
// @see sequencediagram/command/CommandAutonumber.java:58-74
export const autonumberCommand: Command = {
  pattern: /^autonumber(?:\s+([\d][^\s"]*))?(?:\s+(\d+))?(?:\s+"([^"]+)")?\s*$/i,
  execute(state, match) {
    const { prefix, value } = parseDottedStart(match[1] ?? '1');
    const step = match[2] !== undefined ? parseInt(match[2], 10) : 1;
    state.ast.autonumber = {
      enabled: true,
      start: value,
      current: value,
      step,
      prefix,
      ...(match[3] !== undefined ? { format: match[3] } : {}),
    };
  },
};

// autonumber stop -- suspends numbering; `current` is left untouched so a
// later `autonumber resume` continues from where it stopped
// (`AutoNumber.stop`/`.resume`, `AutoNumber.java:55-57,59-64`).
// @see sequencediagram/command/CommandAutonumberStop.java:49,72-76
export const autonumberStopCommand: Command = {
  pattern: /^autonumber\s+stop\s*$/i,
  execute(state) {
    state.ast.autonumber.enabled = false;
  },
};

// autonumber resume [STEP] ["FORMAT"] -- resumes numbering. STEP and FORMAT
// only replace the existing value when given (`AutoNumber.resume`,
// `AutoNumber.java:59-64,66-71`); this port's `step`/`format` fields ARE
// that state, so a bare `resume` leaves both as they were.
// @see sequencediagram/command/CommandAutonumberResume.java:57-73,97-117
export const autonumberResumeCommand: Command = {
  pattern: /^autonumber\s+resume(?:\s+(\d+))?(?:\s+"([^"]+)")?\s*$/i,
  execute(state, match) {
    const auto = state.ast.autonumber;
    auto.enabled = true;
    if (match[1] !== undefined) auto.step = parseInt(match[1], 10);
    if (match[2] !== undefined) auto.format = match[2];
  },
};

/** `DottedNumber.create`'s `(\d+)|(\D+)` split, applied locally to
 *  `prefix + String(current)` -- see the module doc comment for why this
 *  stays local rather than becoming a new `ast.ts` field.
 *  @see sequencediagram/DottedNumber.java:53,55-67 */
function splitSegments(raw: string): { nums: number[]; seps: string[] } {
  const nums: number[] = [];
  const seps: string[] = [];
  for (const part of raw.match(/(\d+)|(\D+)/g) ?? []) {
    if (/^\d/.test(part)) nums.push(Number(part));
    else seps.push(part);
  }
  return { nums, seps };
}

/** Inverse of {@link splitSegments} -- `DottedNumber.toString`'s
 *  `nums[i] + (separators[i] ?? '')` interleave.
 *  @see sequencediagram/DottedNumber.java:74-84 */
function joinSegments(nums: readonly number[], seps: readonly string[]): string {
  let out = '';
  for (let i = 0; i < nums.length; i++) {
    out += String(nums[i]);
    if (i < seps.length) out += seps[i];
  }
  return out;
}

/** Bump segment `position` by 1 and reset every later segment to 1.
 *  Out-of-range `position` is a no-op guard: upstream's
 *  `List.get(position)` would throw `IndexOutOfBoundsException` for the
 *  same malformed input, which this dispatch table's void `execute` has no
 *  channel to surface.
 *  @see sequencediagram/DottedNumber.java:97-104 */
function incrementIntermediate(nums: readonly number[], position: number): number[] {
  if (position < 0 || position >= nums.length) return [...nums];
  const next = [...nums];
  next[position] = next[position]! + 1;
  for (let i = position + 1; i < next.length; i++) next[i] = 1;
  return next;
}

// autonumber inc [POS] -- bumps one dotted segment and resets the segments
// after it to 1. POS names the segment by letter (`A` = segment 0, `B` = 1,
// ...); with no POS, upstream bumps the second-to-last segment, or the only
// one (`DottedNumber.incrementIntermediate()`, no-arg overload).
// @see sequencediagram/command/CommandAutonumberIncrement.java:56-69,92-101
// @see sequencediagram/DottedNumber.java:92-104
export const autonumberIncrementCommand: Command = {
  pattern: /^autonumber\s+inc(?:\s+([A-Za-z]))?\s*$/i,
  execute(state, match) {
    const auto = state.ast.autonumber;
    const { nums, seps } = splitSegments(auto.prefix + String(auto.current));
    const letter = match[1];
    const position =
      letter !== undefined
        ? letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0)
        : nums.length === 1
          ? 0
          : nums.length - 2;
    const bumped = incrementIntermediate(nums, position);
    const { prefix, value } = parseDottedStart(joinSegments(bumped, seps));
    auto.prefix = prefix;
    auto.current = value;
  },
};
