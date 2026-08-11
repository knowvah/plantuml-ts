/**
 * Which direction a relationship's dot edge is emitted in.
 *
 * Split out of ./class-dot-graph.ts (which re-exports nothing from here —
 * both symbols are imported directly) to keep that file under the project's
 * 500-line cap when B6/M7 generalized the rule from the two hierarchical
 * types to every relationship. Pure move plus the B6 rule; the same
 * precedent as `class-geo-types.ts`'s split out of `layout.ts`.
 */
import type { Relationship, RelationshipType } from './class-relationship-ast.js';

// For hierarchical relationships the dot edge must run in the direction
// upstream's own `Link` runs -- `entity1 -> entity2`, which the jar emits
// verbatim and never reorders. This port normalizes every inheritance form to
// `from` = child / `to` = parent, discarding that order, so the relationship
// carries `parentIsLinkEntity1` to restore it (see its doc comment in
// `class-relationship-ast.ts` for the per-form table).
//
// Swapping unconditionally -- as this did until 2026-08-08 -- is right only
// when the parent was written first. It put the interface on the TOP rank for
// `D ..|> I`, where the jar ranks it BELOW: jar-verified against
// `class-inheritance-interface-assoc`, whose document height was 122px short
// as a result.
//
// When the swap applies, the edge points dot returns are reversed so the
// rendered arrow still flows child → parent with the triangle at the parent
// end.
export const HIERARCHICAL = new Set<RelationshipType>(['extension', 'implementation']);

/**
 * Whether this relationship's dot edge must be emitted `rel.to -> rel.from`
 * to run in upstream's own `Link` order.
 *
 * B6/M7: upstream emits `entity1 -> entity2` verbatim and never reorders it
 * (`svek/SvekEdge.java:249-250` takes `getEntityPort1/2` as-is), and it
 * inverts a link in exactly one place — `CommandLinkClass.java:362-363`,
 * `if (dir == Direction.LEFT || dir == Direction.UP) link = link.getInv()`.
 * `getDirection` (`:517-527`) STRIPS the arrowheads before classifying
 * (`replaceAll("[^-.=\\w]", "")`, then a leading/trailing `o`), so `<--`
 * reduces to `--` → `Direction.DOWN` → not inverted. Only an explicit
 * `-left-`/`-up-` direction word inverts; the head decor never participates.
 *
 * This port instead normalizes `from`/`to` by the arrowhead
 * (`class-arrow-grammar.ts#resolveArrow`'s `decorSwap`), so `from`/`to` is NOT
 * upstream's order for any left-headed arrow. `Relationship.dotEdgeReversed`
 * records that fact at parse time, and this function simply reads it.
 *
 * Until B6 the reversal was applied to `extension`/`implementation` only, via
 * `parentIsLinkEntity1` — a patch added 2026-08-08 for
 * `class-inheritance-interface-assoc` (122px short). That covered the two
 * types whose ranking is most visible and left every association, aggregation
 * and composition emitting backwards.
 *
 * T1/B33 replaced B6's own mechanism. B6 inferred the reversal by comparing
 * `idEntity1FullId`/`idEntity2FullId` against `from`/`to`, which holds only
 * until endpoint resolution rewrites `from`/`to` — see the inline note below
 * and `Relationship.dotEdgeReversed`'s doc comment.
 *
 * The `parentIsLinkEntity1` rule survives as the FALLBACK for relationships
 * built outside the arrow grammar, which carry no flag — magma chaining edges
 * and note connectors. Inline `extends`/`implements` sets the flag itself
 * (`class-declaration-parser.ts`), so it takes the primary path.
 */
export function dotEdgeRunsReversed(rel: Relationship): boolean {
  // T1/B33: read the flag the PARSER set, never infer it by comparing ids.
  //
  // B6 compared `idEntity1FullId`/`idEntity2FullId` against `from`/`to`. Those
  // agree only until `class-command-relationships.ts:107-113` rewrites
  // `from`/`to` through `resolveRelationshipEndpoint`, which the FullId pair
  // never sees — so inside a `namespace`/`package`, or with an `as "alias"`
  // declaration, the comparison reported "not reversed" AND returned early,
  // never reaching the fallback below. That was 28 of the 32 fixtures in
  // `direction-backlog.json`; `class/famizo-04-joxe063` emitted `d1 -> c1`
  // against the oracle's `c1 -> d1`. See `Relationship.dotEdgeReversed`.
  if (rel.dotEdgeReversed !== undefined) return rel.dotEdgeReversed;
  // Relationships built outside the arrow grammar carry no flag — magma
  // chaining edges and note connectors. Unchanged since B6.
  return HIERARCHICAL.has(rel.type) && rel.parentIsLinkEntity1 === true;
}
