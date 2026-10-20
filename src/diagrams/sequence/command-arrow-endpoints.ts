/**
 * `CommandArrow`'s endpoint helpers (`getOrCreateParticipant` per PART,
 * `getMulticasts`), split out of `command-arrow.ts` to keep it under the
 * 500-line file cap (sdd1 T1b). Bodies unchanged.
 */
import { ensureParticipant, type ParseState } from './sequence-parse-helpers.js';

/** A `RegExpExecArray`'s named groups. */
export type Groups = Readonly<Record<string, string | undefined>>;

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** One resolved endpoint: the participant CODE and the `Display` upstream
 *  builds beside it. */
export interface Endpoint {
  readonly code: string;
  readonly display: string;
}

/**
 * `getOrCreateParticipant(location, system, arg, n)` — the four PART
 * alternatives in upstream's own order. `"Long" as Code` takes its code from
 * the second group and its display from the first; `Code as "Long"` the other
 * way round.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:157-176
 */
export function endpointOf(g: Groups, n: 'PART1' | 'PART2'): Endpoint {
  const code = g[`${n}CODE`];
  if (code !== undefined) return { code, display: code };
  const long = g[`${n}LONG`];
  if (long !== undefined) return { code: long, display: long };
  const longCode = g[`${n}LONGCODE`];
  if (longCode !== undefined) return { code: g[`${n}LONGCODE1`]!, display: longCode };
  const codeLong = g[`${n}CODELONG`];
  if (codeLong !== undefined) return { code: codeLong, display: g[`${n}CODELONG1`]! };
  // Upstream's own `throw new IllegalStateException()` (`:175`): PART1/PART2
  // is a mandatory RegexOr, so one alternative always participated.
  throw new Error(`CommandArrow: ${n} matched with no alternative group`);
}

/**
 * `getMulticasts` — the extra `& target` recipients, split on `&`, blanks
 * skipped, each one declared through `getOrCreateParticipant`.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:139-155
 */
export function getMulticasts(state: ParseState, multicast: string | undefined): readonly string[] {
  if (multicast === undefined) return [];
  const result: string[] = [];
  for (const raw of multicast.split('&')) {
    const s = raw.trim();
    if (s.length === 0) continue;
    ensureParticipant(state, s);
    result.push(s);
  }
  return result;
}
