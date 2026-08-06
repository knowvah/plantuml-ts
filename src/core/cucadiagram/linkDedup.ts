/**
 * The shared `-[single]->` add-time dedup — ADR-3 (SI1): the EXACT
 * `CucaDiagram.addLink` / `containsSimilarLink` / `Link.sameConnections`
 * semantics, exposed as a helper over a caller-supplied link list so each
 * engine's own link shape (`DescriptiveLink`, class `Relationship`, state
 * `Transition`) plugs in via an endpoints accessor. The faithfully ported
 * classes carry the same semantics over real `Link` objects
 * (`CucaDiagram.ts#addLink/containsSimilarLink`, `Link.ts#sameConnections`,
 * `WithLinkType.ts#isSingle`) — per ADR-3 the parsers do NOT instantiate
 * `CucaDiagram` today; they call this helper instead, and the real-class
 * consumption arrives with the per-engine migration missions.
 *
 * Upstream mechanism (all three sites verified 2026-08-05):
 * - `addLink` drops the incoming link — silently, no error — when
 *   `link.isSingle() && containsSimilarLink(link)`; otherwise appends.
 *   @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:896-901
 * - `containsSimilarLink` linearly scans every already-added link for
 *   `other.sameConnections(link)`.
 *   @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:903-909
 * - `sameConnections` is endpoint IDENTITY, either direction, ignoring
 *   style/type/label entirely.
 *   @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java:462-470
 * - `isSingle` is set ONLY by `goSingle()`, reached ONLY by the `single`
 *   ARROW_STYLE token (case-insensitive, `;`-then-`,` tokenized).
 *   @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/WithLinkType.java:110-116 (goSingle/isSingle)
 *   @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/WithLinkType.java:126-166 (applyStyle/applyOneStyle)
 *
 * Timing contract (callers MUST preserve): upstream constructs the `Link`
 * object — consuming its `lnk` uid from the shared creation counter
 * (`abel/Link.java:135`) — BEFORE `addLink`'s dedup runs, so a
 * dropped-as-duplicate link still burns its creation tick, and both
 * endpoints are still auto-created. Only the link record itself is skipped.
 */

/** Endpoint accessor: the caller's link shape reduced to its two connection
 *  identities (`Link.cl1`/`cl2` — upstream compares `Entity` references;
 *  the parsers compare resolved canonical ids, which carry the same
 *  identity contract post-resolution). */
export type LinkConnection<TLink> = (link: TLink) => readonly [unknown, unknown];

/** `Link.sameConnections`: same endpoint pair, either direction — identity
 *  only, ignoring style/type/label.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java:462-470
 *  @see src/core/abel/Link.ts#sameConnections (the ported real-class form) */
function sameConnections<TLink>(
  self: TLink,
  other: TLink,
  connection: LinkConnection<TLink>,
): boolean {
  const [cl1, cl2] = connection(self);
  const [o1, o2] = connection(other);
  if (cl1 === o1 && cl2 === o2) return true;
  if (cl1 === o2 && cl2 === o1) return true;
  return false;
}

/** `CucaDiagram.containsSimilarLink`: any already-added link with the same
 *  connections as `other`.
 *  @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:903-909
 *  @see src/core/cucadiagram/CucaDiagram.ts#containsSimilarLink */
export function containsSimilarLink<TLink>(
  links: Iterable<TLink>,
  other: TLink,
  connection: LinkConnection<TLink>,
): boolean {
  for (const link of links) if (sameConnections(other, link, connection)) return true;
  return false;
}

/** `CucaDiagram.addLink`'s guard, verbatim: `true` when the incoming link
 *  must be silently dropped — it is `single` AND the diagram already holds
 *  any OTHER link (single or not) connecting the same two endpoints.
 *  @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:896-901
 *  @see src/core/cucadiagram/CucaDiagram.ts#addLink */
export function dropsAsSingleDuplicate<TLink>(
  isSingle: boolean,
  links: Iterable<TLink>,
  link: TLink,
  connection: LinkConnection<TLink>,
): boolean {
  return isSingle && containsSimilarLink(links, link, connection);
}

/** `WithLinkType.applyStyle`'s reachability of `goSingle()`, over a raw
 *  ARROW_STYLE bracket string: tokenize by `;` then `,`
 *  (`StringTokenizer` — empty tokens never emitted), and `goSingle()` fires
 *  on any token `equalsIgnoreCase("single")`. This is THE upstream gate for
 *  `isSingle` — no other code path sets it. Used by parsers that store the
 *  raw bracket text (state's `Transition.arrowStyle`) instead of a parsed
 *  flag; description/class tokenize identically at parse time
 *  (`link-grammar.ts#parseArrowStyle`,
 *  `class-arrow-grammar.ts#parseArrowStyleOverrides`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/WithLinkType.java:126-166
 *  @see src/core/decoration/WithLinkType.ts#applyStyle */
export function arrowStyleHasSingle(rawStyle: string | undefined): boolean {
  if (rawStyle === undefined) return false;
  for (const segment of rawStyle.split(';'))
    for (const token of segment.split(','))
      if (token.trim().toLowerCase() === 'single') return true;
  return false;
}
