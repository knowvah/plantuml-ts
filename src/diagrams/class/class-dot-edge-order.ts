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
 * (`class-arrow-grammar.ts#resolveArrow`'s `decorSwap`), so `from`/`to` is
 * NOT upstream's order for any left-headed arrow. It does, however, already
 * carry upstream's order under another name: `idEntity1FullId`/
 * `idEntity2FullId` are picked by `upOrLeft` alone — exactly upstream's rule
 * — because the SVG id pair and the drawn path direction both needed it
 * (G2 N9/N30, see those fields' doc comments in `class-relationship-ast.ts`).
 * Emitting from that pair is therefore the re-mirror, not a correction:
 * upstream's `cl1`/`cl2` reach dot unmodified.
 *
 * Until B6 this reversal was applied to `extension`/`implementation` only,
 * via `parentIsLinkEntity1` — a patch added 2026-08-08 for
 * `class-inheritance-interface-assoc` (122px short). That covered the two
 * types whose ranking is most visible and left every association, aggregation
 * and composition emitting backwards. It was also wrong for a hierarchical
 * arrow that ALSO carries `-left-`/`-up-`: there `swapDirection` is
 * `decorSwap XOR upOrLeft` = false, so it declined to reverse and emitted the
 * opposite of upstream. The FullId pair gets that case right by construction.
 *
 * The `parentIsLinkEntity1` rule survives as the FALLBACK for relationships
 * built outside the arrow grammar, which carry no FullId pair — magma
 * chaining edges and note connectors. (Inline `extends`/`implements` sets the
 * pair itself, `class-declaration-parser.ts:261-287`, and so takes the
 * primary path; the two agree there.)
 */
export function dotEdgeRunsReversed(rel: Relationship): boolean {
  const e1 = rel.idEntity1FullId;
  const e2 = rel.idEntity2FullId;
  // A self-link (`e1 === e2`) has no orientation to restore; fall through
  // rather than reading a reversal out of a degenerate comparison.
  if (e1 !== undefined && e2 !== undefined && e1 !== e2) {
    return e1 === rel.to && e2 === rel.from;
  }
  return HIERARCHICAL.has(rel.type) && rel.parentIsLinkEntity1 === true;
}
