/**
 * `computeRemovedRanks`, split out of `class-directives-removal.ts` (line
 * cap, cdd-T31) -- re-exported from there so `from './class-directives-
 * removal.js'`/`from './class-directives.js'` sites are unchanged, mirroring
 * this file family's own "split for the hook, no behavior change"
 * convention. Also split into one push-helper per entity kind here (CCN
 * cap) -- same branch conditions as the pre-move single function, just
 * named per loop body.
 */
import type { ClassDiagramAST, ClassNote, Relationship } from './ast.js';
import { computeRemovedIds } from './class-directives-removal.js';

function pushRank(ranks: number[], n: number | undefined): void {
  if (n !== undefined) ranks.push(n);
}

/** A removed note's own creation-index burn, plus its `GMN`/connector
 *  phantom slots (`phantomSlot`) and member-tip group phantom pair
 *  (`tipGroupPhantomIndex`) -- see {@link computeRemovedRanks}'s doc. */
function pushNoteRanks(ranks: number[], n: ClassNote, removed: ReadonlySet<string>): void {
  if (!removed.has(n.id)) return;
  pushRank(ranks, n.creationIndex);
  if (n.phantomSlot === true && n.creationIndex !== undefined) {
    ranks.push(n.creationIndex - 1, n.creationIndex + 1);
  }
  if (n.tipGroupPhantomIndex !== undefined) ranks.push(n.tipGroupPhantomIndex, n.tipGroupPhantomIndex + 1);
}

/** A removed relationship's own creation-index burn, plus its discarded
 *  pre-`getInv()` `Link` phantom slot (`phantomSlot`). */
function pushRelationshipRanks(ranks: number[], r: Relationship, removed: ReadonlySet<string>): void {
  if (!removed.has(r.from) && !removed.has(r.to)) return;
  pushRank(ranks, r.creationIndex);
  if (r.phantomSlot === true && r.creationIndex !== undefined) ranks.push(r.creationIndex - 1);
}

/**
 * cdd-T3 (A1 SB5): every shared-counter rank the entities `filterRemoved
 * Entities` drops had ALREADY been burned upstream. `remove`/`restore` is
 * an EXPORT-time skip there — `Entity`'s ctor (`abel/Entity.java:171`) and
 * `Link`'s (`abel/Link.java:135`) run at PARSE time, and
 * `GraphvizImageBuilder` only consults `isRemoved()` when it walks the
 * entities to print (`printEntities:350`, `printGroups:413`, `link:230`).
 * So a removed leaf leaves a HOLE in jar's numbering; this port's dense
 * re-numbering (`renderer-uid.ts`'s module doc comment) would close it.
 *
 * Returns the ranks to re-inject as uid-less phantoms, covering every burn
 * the dropped row carried ({@link pushNoteRanks}/{@link pushRelationshipRanks}).
 * Classifier-level standalone ranks (`subsumedLinkCreationIndex` and the
 * repeat-couple pair) are NOT re-injected here: they belong to the couple
 * circle that survives, not to the removed row.
 */
export function computeRemovedRanks(ast: ClassDiagramAST): number[] {
  const removed = computeRemovedIds(ast);
  if (removed.size === 0) return [];
  const ranks: number[] = [];
  for (const c of ast.classifiers) if (removed.has(c.id)) pushRank(ranks, c.creationIndex);
  for (const n of ast.notes) pushNoteRanks(ranks, n, removed);
  for (const r of ast.relationships) pushRelationshipRanks(ranks, r, removed);
  return ranks;
}
