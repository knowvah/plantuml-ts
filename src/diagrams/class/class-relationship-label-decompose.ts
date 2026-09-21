/**
 * `decomposeLabel` — split out of class-relationship-parser.ts (pure move,
 * no behavior change) to keep that file under the repo's 500-line-per-file
 * cap.
 */

import { stripQuotes } from './class-relationship-id-grammar.js';

/** Quoted multiplicities INSIDE the free-text label (`: "1" contains "0..*"`),
 *  mirroring Labels#init (descdiagram/command/Labels.java:75-104): when NO
 *  explicit `"m"` group sits beside either endpoint, the label decomposes via
 *  three anchored patterns — BOTH_LABELS / FIRST_LABEL_ONLY /
 *  SECOND_LABEL_ONLY — into firstLabel (left end), the residual middle label
 *  (trimmed, outer quotes stripped), and secondLabel (right end); these feed
 *  taillabel/label/headlabel in the DOT (tilipa-86-suxi130). Returns null
 *  when no pattern matches (label stays whole). */
export function decomposeLabel(
  label: string,
): { first?: string | undefined; mid: string; second?: string | undefined } | null {
  const both = /^"([^"]+)"([^"]+)"([^"]+)"$/.exec(label);
  if (both !== null) return { first: both[1]!, mid: stripQuotes(both[2]!.trim()).trim(), second: both[3]! };
  const firstOnly = /^"([^"]+)"([^"]+)$/.exec(label);
  if (firstOnly !== null) return { first: firstOnly[1]!, mid: stripQuotes(firstOnly[2]!.trim()).trim() };
  const secondOnly = /^([^"]+)"([^"]+)"$/.exec(label);
  if (secondOnly !== null) return { mid: stripQuotes(secondOnly[1]!.trim()).trim(), second: secondOnly[2]! };
  return null;
}
