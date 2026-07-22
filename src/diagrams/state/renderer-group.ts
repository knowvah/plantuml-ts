/**
 * renderer-group.ts — mission G4 S1, mechanism 2: the per-element `<g
 * class="entity"|"start_entity"|"end_entity"|"link">` wrapper every jar
 * state-diagram fixture stamps around each drawn state/pseudostate/
 * transition (verified against `jocela-05-niba392`, `moleco-69-sida106`,
 * `bajelo-54-dixe684`, `cekolo-21-gini183` — see `plans/g4-state-svg/
 * ledger.md` S1 mechanism 2).
 *
 * A pure-string sibling of `class/renderer-group.ts` (G2 N2's own precedent
 * for this exact wrapper shape) — same reasoning: `state/renderer.ts` draws
 * every shape as a plain SVG string (`core/svg.ts` helpers), never through a
 * `UGraphic`, so this module duplicates only the OBSERVABLE shape
 * (`class`/`id` attribute names/values), not klimt's `UGroup` machinery.
 * `data-qualified-name`/`data-entity-1`/`data-entity-2`/`data-link-type`/
 * `data-source-line` never affect conformance (`tests/oracle/svg-
 * conformance/normalize.ts` strips every `data-*` attribute before
 * comparison) — populated here for upstream fidelity, not because the
 * census requires it. `data-source-line` is OMITTED entirely (this port's
 * state parser has no line-number tracking, same gap `class/renderer-
 * group.ts`'s own doc comment names).
 *
 * NOT wrapped at all — jar-verified via `cekolo-21-gini183` (every
 * pseudostate stereotype in one fixture): fork/join/syncBar bars and
 * history/deepHistory pseudostates draw as bare, unwrapped siblings (no
 * `<g>`, no id, no comment) — a genuinely different convention from
 * initial/final/normal/choice, which all DO wrap. See `renderer.ts
 * #wrapClassFor`'s own doc comment for the per-`StateKind` dispatch table.
 *
 * COMPOSITE class dispatch (G6 T3, closing G4 S1's own "NOT MODELED" gap
 * below): a composite state (`children.length > 0`) wraps `class="cluster"`
 * via {@link wrapCluster} when it is drawn with the real jar-native cluster
 * shape (`node.clusterHeaderHeight !== undefined` — same gate
 * `renderer-composite-box.ts#renderComposite` already dispatches its shape
 * on, and `renderer.ts#renderChildNode` already dispatches structural
 * flat-sibling-vs-nested placement on, G5 C3) — jar-verified
 * `gojuja-90-pune699`'s `A`, `decede-10-buvu414`'s `E`. Every OTHER
 * composite (an "autonom" composite, flattened to a fixed-size leaf image,
 * OR a 'cluster'-classified composite this port's eligibility gate excluded
 * from the real-shape path — `state-composite-cluster.ts
 * #resolveClusterComposite`'s own doc comment) still wraps `entity` via
 * {@link wrapEntity}, unchanged — jar-verified `bajelo-54-dixe684`:
 * `Track_FSM` (top-level, 2 children) and `Track_FSM.Run.Do_Sector` (1
 * child) both wrap `entity`, `Track_FSM.Run` (1 child) wraps `cluster`.
 *
 * @see plans/g4-state-svg/ledger.md (S1, mechanism 2)
 * @see plans/g6-cluster-geometry/decisions.md (D3)
 */
import { group } from '../../core/svg.js';

// XML-attribute-value escaping — a local duplicate of `core/svg.ts`'s own
// (module-private, unexported) `escapeXml`, per this codebase's established
// one-small-helper-per-call-site convention (`class/renderer-group.ts`'s own
// `escAttr` precedent). Built from a string, not a regex literal containing
// `<`/`>` — the complexity checker miscounts those.
const XML_UNSAFE_RE = new RegExp('[&<>"]', 'g');
const XML_REPLACEMENTS: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
function escAttr(value: string): string {
  return value.replace(XML_UNSAFE_RE, (ch) => XML_REPLACEMENTS[ch]!);
}

/** Wraps a state/pseudostate's rendered body in the jar's `<g
 *  class="entity" data-qualified-name="..." id="...">` group — the
 *  `normal`/`json`/`choice`/composite ('entity'-wrapped, see module doc
 *  comment's composite class dispatch note) case. */
export function wrapEntity(qualifiedName: string, uid: string, inner: string): string {
  return group(inner, { class: 'entity', 'data-qualified-name': escAttr(qualifiedName), id: uid });
}

/** Wraps a `'cluster'`-classified composite's OWN shape (`node.
 *  clusterHeaderHeight !== undefined`, `renderer-composite-box.ts
 *  #renderComposite`'s own dispatch gate) in the jar's `<g class="cluster"
 *  data-qualified-name="..." id="...">` group — same attribute shape as
 *  {@link wrapEntity}, only the `class` value differs (jar-verified
 *  `gojuja-90-pune699`'s `A`, `decede-10-buvu414`'s `E`: `<g class="cluster"
 *  data-qualified-name="A" id="ent0001">`). Callers must use this ONLY for
 *  the composite's own wrap, never its (flat-sibling, G5 C3) children — see
 *  `renderer.ts#renderClusterSiblingMarkup`. */
export function wrapCluster(qualifiedName: string, uid: string, inner: string): string {
  return group(inner, { class: 'cluster', 'data-qualified-name': escAttr(qualifiedName), id: uid });
}

/** Wraps an `initial` pseudostate in the jar's `<g class="start_entity"
 *  data-qualified-name="..." id="...">` group. */
export function wrapStartEntity(qualifiedName: string, uid: string, inner: string): string {
  return group(inner, { class: 'start_entity', 'data-qualified-name': escAttr(qualifiedName), id: uid });
}

/** Wraps a `final` pseudostate in the jar's `<g class="end_entity"
 *  data-qualified-name="..." id="...">` group. */
export function wrapEndEntity(qualifiedName: string, uid: string, inner: string): string {
  return group(inner, { class: 'end_entity', 'data-qualified-name': escAttr(qualifiedName), id: uid });
}

/** Parameter bundle for {@link wrapLink} — collapsed from 4 positional args
 *  into one object to stay inside this project's per-function param-count
 *  budget (mirrors `class/renderer-group.ts#WrapLinkInfo`'s own precedent). */
export interface WrapLinkInfo {
  readonly from: string;
  readonly to: string;
  readonly uid: string;
  readonly fromUid: string;
  readonly toUid: string;
}

/** Wraps a transition's rendered body in the jar's `<g class="link"
 *  data-entity-1="..." data-entity-2="..." id="..." data-link-type=
 *  "dependency">` group, preceded by `<!--link X to Y-->` — state
 *  transitions always resolve to the plain `ARROW`/`dependency` decor (no
 *  tail decor, no reversal question), unlike class's multi-decor edges. */
export function wrapLink(info: WrapLinkInfo, inner: string): string {
  const { from, to, uid, fromUid, toUid } = info;
  const comment = `<!--link ${from} to ${to}-->`;
  return (
    comment +
    group(inner, {
      class: 'link',
      'data-entity-1': fromUid,
      'data-entity-2': toUid,
      id: uid,
      'data-link-type': 'dependency',
    })
  );
}
