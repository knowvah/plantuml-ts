/**
 * `Bibliotekon#addLine`'s `lines0` insertion tie-break
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Bibliotekon
 * .java:87-106`): a note-labelled edge (`hasNoteLabelText()`, `SvekEdge.java
 * :383-385` -- this port's `label` + `labelWidth`/`labelHeight`, the centre
 * `<TABLE FIXEDSIZE...>` reservation) is spliced in just BEFORE the first
 * unlabelled `lines0` edge already collected that shares its connections
 * (`Link#sameConnections`, `abel/Link.java:462-469` -- endpoints equal in
 * either order), rather than appended. An edge with no note label, or that
 * finds no such match, is appended — the pre-existing behaviour.
 * `Bibliotekon#first(line)` (`:101-106`, jar's `link.getLength() == 1`) is
 * this port's `minLen === 0`.
 *
 * cdd3-T19 (E3-18): `cobumi-83-bapu892`'s jar DOT prints the labelled
 * `sh0019->sh0018 : children` ahead of the unlabelled `sh0018->sh0019` that
 * shares its endpoints; this port previously kept plain declaration order.
 *
 * Shared by every consumer that splits `DotInputGraph.edges` into the
 * `lines0`/`lines1` batches, so none may drift from the others
 * (`svek-dot-top.ts`'s own doc comment names this exact hazard): the LAYOUT
 * builder (`graph-layout-build-edges.ts#svekEdgeOrder`, feeds
 * @knowvah/dot-engine), the TEXT emitter (`svek-dot-emit.ts#edgeBatches`, the
 * DOT-parity gate), and node encounter order
 * (`svek-dot-order.ts#firstEncounterOrder`).
 */
import type { DotInputEdge } from './graph-layout.types.js';

function isLines0(e: DotInputEdge): boolean {
  return e.attributes?.minLen === 0;
}

/** `SvekEdge#hasNoteLabelText` (`SvekEdge.java:383-385`): `labelText != null
 *  && labelText != TextBlockUtils.EMPTY_TEXT_BLOCK`. */
function hasNoteLabelText(e: DotInputEdge): boolean {
  const a = e.attributes;
  return a?.label !== undefined && a?.labelWidth !== undefined && a?.labelHeight !== undefined;
}

/** `Link#sameConnections` (`abel/Link.java:462-469`): the same two
 *  endpoints, in either order — undirected. */
function sameConnections(a: DotInputEdge, b: DotInputEdge): boolean {
  return (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);
}

/**
 * `edges` in DECLARATION order (`Bibliotekon#addLine` runs once per link, as
 * each is created) → the `lines0` subset (`first(line)`), reordered by the
 * insertion rule above. Callers that also need `lines1` keep using their own
 * `e.attributes?.minLen !== 0` filter — `addLine`'s `else lines1.add(line)`
 * branch never reorders.
 */
export function orderLines0Edges(edges: readonly DotInputEdge[]): DotInputEdge[] {
  const lines0: DotInputEdge[] = [];
  for (const line of edges) {
    if (!isLines0(line)) continue;
    if (hasNoteLabelText(line)) {
      const idx = lines0.findIndex((other) => !hasNoteLabelText(other) && sameConnections(line, other));
      if (idx !== -1) {
        lines0.splice(idx, 0, line);
        continue;
      }
    }
    lines0.push(line);
  }
  return lines0;
}
