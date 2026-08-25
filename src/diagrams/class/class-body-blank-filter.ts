/**
 * Close-time blank-member filtering for a classic (class/interface/enum/...)
 * body, split out of parser.ts purely to keep that file within the repo's
 * 500-line hook cap -- pure move, no behavior change (same precedent as
 * class-line-merge.ts's own header note). Called from
 * `handlePendingBodyLine` (parser.ts) via `filterPendingBodyBlanks`.
 */

import type { Classifier } from './ast.js';
import type { ParseState } from './class-parse-state.js';
import { isMethodMember } from './class-layout-helpers.js';

/** True for an A3 blank-line placeholder member (real members never parse to
 *  an empty name -- `parseMemberLine` returns null for a blank/empty line). */
function isBlankMember(m: { name: string; type?: string; rawDisplay?: string }): boolean {
  return m.name === '' && m.type === undefined && m.rawDisplay === undefined;
}

/**
 * A2s F-A / A3: upstream's empty-row display filters for a just-closed
 * classic body (`BodierLikeClassOrObject`, java:114-172): a blank strictly
 * BETWEEN two method lines is a METHOD row (sandwich rule, java:136-142);
 * each compartment skips empties before its first real member (java:122,152)
 * and drops trailing empties (`removeFinalEmptyMembers`, java:166-170); a
 * blank surviving both (e.g. between two field rows) displays as one empty
 * row. Neighborhood = the MEMBERS array (classic bodies: every line is a
 * member, i.e. upstream's rawBody order). jar-verified: jijovu-48-gole133's
 * blank between methods and fields displays NO row, delta 0.
 */
function filterBodyBlankMembers(members: Classifier['members']): void {
  for (let i = 1; i < members.length - 1; i++) {
    const m = members[i]!;
    if (isBlankMember(m) && isMethodMember(members[i - 1]!) && isMethodMember(members[i + 1]!)) {
      m.params = []; // sandwich rule: empty METHOD row
    }
  }
  stripCompartmentEdgeBlanks(members, false);
  stripCompartmentEdgeBlanks(members, true);
}

/** Leading-empty skip + `removeFinalEmptyMembers` for ONE compartment
 *  subsequence (entries outside [first real, last real] are blanks by
 *  construction -- see {@link filterBodyBlankMembers}). */
function stripCompartmentEdgeBlanks(members: Classifier['members'], wantMethod: boolean): void {
  const seq = members.filter((m) => isMethodMember(m) === wantMethod);
  let firstReal = seq.findIndex((m) => !isBlankMember(m));
  if (firstReal === -1) firstReal = seq.length;
  let lastReal = seq.length - 1;
  while (lastReal >= 0 && isBlankMember(seq[lastReal]!)) lastReal--;
  for (let i = 0; i < seq.length; i++) {
    if (i < firstReal || i > lastReal) members.splice(members.indexOf(seq[i]!), 1);
  }
}

/** Close-time A3 hook: runs {@link filterBodyBlankMembers} for the classic
 *  member path only (object/map/json bodies keep their own semantics). */
export function filterPendingBodyBlanks(state: ParseState): void {
  const idx = state.pendingBodyId !== null ? state.classifierIndex.get(state.pendingBodyId) : undefined;
  const classifier = idx !== undefined ? state.ast.classifiers[idx] : undefined;
  if (classifier === undefined) return;
  if (classifier.kind === 'object' || classifier.kind === 'map' || classifier.kind === 'json') return;
  filterBodyBlankMembers(classifier.members);
}
