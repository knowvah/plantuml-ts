/**
 * `Ports` production for the class engine's `RECTANGLE_HTML_FOR_PORTS` leaves —
 * the DOT-input half of `SvekNode#appendLabelHtmlSpecialForLink`'s
 * `((WithPorts) image).getPorts(stringBounder)` call
 * (svek/SvekNode.java:269).
 *
 * Upstream reaches the bands through the live `TextBlock` tree: `TextBlockMap`
 * reports one band per data row (`cucadiagram/TextBlockMap.java:93-105`) and
 * the enclosing `TextBlockVertical`/`TextBlockMarged` wrappers translate them
 * down by the title height (`klimt/shape/TextBlockMarged.java#getPorts`).
 *
 * The `Ports` model itself is NOT re-implemented here: ids come from the
 * ported `Ports#encodePortNameToId` (`core/svek/Ports.ts`), whose md5 output is
 * jar-verified against the oracle DOT for `method3`, `__method1__`, `method2`,
 * `USA` and `3`.
 *
 * The `map`/`json` flat-sizer producers (`mapPortRows`, `mapPortName`) moved
 * out to ./class-map-port-rows.ts (S-B — pure relocation; ADR-4 in
 * `plans/si20-object-row-ports/decisions.md`) for the same 500-line/NLOC-cap
 * reason as ./class-object-fields.ts's own split; this file imports
 * {@link mapPortName} back for `edgePortAttrs`' port-name resolution and
 * {@link mapPortRows} back for `applyShapeAndPorts`' `map`/`json` branch.
 */

import type { Classifier, ClassDiagramAST, ClassifierKind, Member } from './ast.js';
import { formatMemberText, type MeasuredClassifier } from './class-layout-helpers.js';
import { isRowPortKind } from './class-shield-helpers.js';
import { formatObjectMemberText } from './class-object-fields.js';
import type { DotInputNode, DotInputPortRow } from '../../core/graph-layout.types.js';
import { Ports } from '../../core/svek/Ports.js';
import { mapPortRows, mapPortName } from './class-map-port-rows.js';
import { MethodsOrFieldsArea } from '../../core/cucadiagram/MethodsOrFieldsArea.js';
import type { Elected } from '../../core/cucadiagram/Elected.js';

/**
 * The `tailport`/`headport` a relationship contributes when its `Class::member`
 * endpoint names a row on a `RECTANGLE_HTML_FOR_PORTS` node — `abel/Link.java
 * :219-231` threads the port name onto the endpoint and the DOT statement comes
 * out as `sh0006:p48c4…->sh0007:pcb85…`. `map key *-> dest` rows reach the same
 * place: `CommandCreateMap.java:191` sets the port from the row key, which
 * `class-map-commands.ts:362` mirrors as `fromPort`.
 *
 * `swap` is this port's own concern, not upstream's: `ranksParentFirst` may
 * emit the DOT edge parent-first, and the ports have to follow the endpoints
 * they belong to. Gated on `portRowIds` so a `::member` endpoint on an ordinary
 * box classifier (whose members are not port bands) contributes nothing.
 */
export function edgePortAttrs(
  rel: { fromPort?: string; toPort?: string },
  swap: boolean,
  from: string,
  to: string,
  portRowIds: ReadonlySet<string>,
): { tailport?: string; headport?: string } {
  const tailName = swap ? rel.toPort : rel.fromPort;
  const headName = swap ? rel.fromPort : rel.toPort;
  const out: { tailport?: string; headport?: string } = {};
  if (tailName !== undefined && portRowIds.has(from)) {
    out.tailport = Ports.encodePortNameToId(mapPortName(tailName));
  }
  if (headName !== undefined && portRowIds.has(to)) {
    out.headport = Ports.encodePortNameToId(mapPortName(headName));
  }
  return out;
}

/** Classifier kind → non-default svek node shape (everything else → rect). */
const KIND_SHAPE: Partial<Record<ClassifierKind, DotInputNode['shape']>> = {
  association: 'diamond', // `<> name` (CommandDiamondAssociation)
  'assoc-circle': 'circle', // `(A,B) .. C` connector on the A–B association
  circle: 'plaintext', // `circle Foo` / `() name` — the small circle table
  usecase: 'ellipse', // `usecase Foo` (LeafType.USECASE)
  state: 'rounded', // `state Foo` (LeafType.STATE, classdiagram-only ALL_TYPES superset)
  lollipop: 'circle', // `Name ()-- Existing` (CommandLinkLollipop)
  map: 'plaintext', // `map Name { ... }` — EntityImageMap.getShapeType is
  // ALWAYS RECTANGLE_HTML_FOR_PORTS (never a plain rect, even with zero rows).
  json: 'plaintext', // `json Name { ... }` — EntityImageJson.getShapeType is
  // the SAME RECTANGLE_HTML_FOR_PORTS shape as map, ALWAYS (even scalar/empty).
};

/**
 * A map/json's `shape=plaintext` is EntityImageMap/EntityImageJson's own
 * per-row shield table (svek's RECTANGLE_HTML_FOR_PORTS), NOT the qualifier/
 * `::member` port-shield mechanism this flag drives (svek-dot-emit.ts's
 * portTable — a single compass-point "P" cell, wrong shape for either). A map
 * row link (class-map-commands.ts) sets `fromPort` on its relationship purely
 * as row-target metadata; it must not flip this flag even though
 * shieldedClassifierIds sees the same relationship.
 */
function shouldMarkPort(shape: DotInputNode['shape'] | undefined, isShieldedPort: boolean, kind: ClassifierKind): boolean {
  return shape === 'plaintext' && isShieldedPort && kind !== 'map' && kind !== 'json';
}

/**
 * T2 (SI17): adapts the publish-only `MeasuredClassifier.portMemberSections`
 * (`class-layout-generic-classifier.ts#buildNormalClassifierResult`, and for
 * an object leaf `class-object-sizing.ts#buildFieldBasedObjectGeo`) into
 * `classPortRows`' own `PortRowCompartmentInput[]` shape, fields compartment
 * first then methods (`classPortRows`' own doc comment / `BodierLikeClassOr
 * Object#getBody`'s `mergeTB` order). A `undefined` compartment (SUPPRESSED,
 * see `portMemberSections`'s doc comment) is OMITTED entirely, not passed as
 * an empty one -- an omitted compartment contributes no `SECTION_MARGIN*2`
 * floor at all, matching `fieldsH`/`methodsH` being 0 rather than 8.
 *
 * ADR-5, load-bearing: `text` is ALWAYS recomputed fresh from the member
 * object by {@link electionTextFor} -- NEVER `FlatMemberRows.texts`, which
 * carries the visibility char whenever the caller measured with `noIcon`
 * (`classAttributeIconSize 0`, `computeMemberSectionsGeo`'s own
 * `formatMemberText(m, noIcon)` call). The election's input text and the
 * member's RENDERED row text are two independently-resolved upstream calls
 * (`MethodsOrFieldsArea.java`'s `convert` vs. `createTextBlock`), and only
 * the former may reach `classPortRows`.
 */
function toPortCompartments(
  sections: NonNullable<MeasuredClassifier['portMemberSections']>,
  electionText: (member: Member) => string,
): PortRowCompartmentInput[] {
  const compartments: PortRowCompartmentInput[] = [];
  for (const section of [sections.fields, sections.methods]) {
    if (section === undefined) continue;
    compartments.push({
      members: section.members.map((member, i) => ({
        text: electionText(member),
        height: section.builds[i]!.height,
      })),
    });
  }
  return compartments;
}

/** SI20 ADR-2: the election's input is upstream's `Member.getDisplay(false)`,
 *  and this port reconstructs that from the PARSED member with a different
 *  function per parser -- `formatMemberText` for the class family
 *  (`name: type`, `class-member-parser.ts`) and `formatObjectMemberText` for
 *  an object leaf (`name = type`, plus G3/O4's `\t` unescape,
 *  `class-object-commands.ts#parseObjectField`). Upstream needs only one
 *  because it never re-splits the line -- `Member#getDisplay` returns the
 *  stored display verbatim (`cucadiagram/Member.java:146-155`) -- so the
 *  reconstructor here must match the parser that ran. T0 jar-verified the
 *  object one against `getDisplay(false)` on a visibility-char control.
 *  Picking the wrong one does NOT fail loudly: it silently elects a different
 *  row, which is why `class-object-row-ports.test.ts` carries a purpose-built
 *  `\t` control (rozuxo's bare-word members cannot tell the two apart).
 *
 *  CO-MAINTENANCE POINT with `class-shield-helpers.ts#isRowPortKind`. The
 *  `else` here is the class family by construction, not by default: every
 *  kind that reaches this function has passed `isRowPortKind`, which today is
 *  exactly `LIKE_CLASS_KINDS` plus `object`. **A kind added to that predicate
 *  without a branch here would silently take the class reconstructor** -- the
 *  precise defect SI20's T2 shipped and caught. Because the two live in
 *  different modules and the coupling is not expressible in the type system
 *  (`LIKE_CLASS_KINDS` is a runtime `Set`, reachable here only through an
 *  import cycle), it is pinned by a fitness test instead:
 *  `class-port-rows.test.ts`'s "row-port kind set is pinned" case fails the
 *  moment `isRowPortKind` accepts anything new, forcing this decision. */
function electionTextFor(kind: ClassifierKind): (member: Member) => string {
  return kind === 'object' ? formatObjectMemberText : (member) => formatMemberText(member, false);
}

/** ADR-4 continued: `classPortRows` returns `[]` when every member loses its
 *  election (`bicabi-42-coto932`'s zero-election control) -- `[]` is still
 *  PRESENT, so the emitter still draws the one-trailer-row table. Split out
 *  of {@link applyShapeAndPorts} purely for that function's CCN budget. */
function classFamilyPortRows(
  measured: MeasuredClassifier,
  portShortNames: ReadonlySet<string>,
  kind: ClassifierKind,
): DotInputPortRow[] {
  const compartments = measured.portMemberSections !== undefined
    ? toPortCompartments(measured.portMemberSections, electionTextFor(kind))
    : [];
  return classPortRows(compartments, portShortNames, measured.portMemberSections?.headerHeight ?? 0);
}

/** ADR-4: the shape flip is on the DECLARED port-name COUNT, not on election
 *  success -- written explicitly here (not left to fall out of `shield !==
 *  undefined`, which happens to always be true in this same case since both
 *  derive from the identical `rel.fromPort`/`toPort` scan) so the gate this
 *  ADR names is visible at its own call site. Split out of {@link
 *  applyShapeAndPorts} purely for that function's CCN budget. */
function resolveNodeShape(
  classifier: Classifier,
  shield: { isPort: boolean; hasQualifier: boolean } | undefined,
  hasPortBands: boolean,
): DotInputNode['shape'] | undefined {
  return KIND_SHAPE[classifier.kind] ?? (shield !== undefined || hasPortBands ? 'plaintext' : undefined);
}

/** Svek shape selection plus the four port/shield mechanisms riding on it:
 *  the `:P` compass shield (`isPort`), a map's flat-sizer row bands, (T2) a
 *  class-family OR (SI20 T2) object leaf's block-tree row bands (`portRows`
 *  on both), and (B1)
 *  the `:h` shield flag (`qualifierShielded`) -- `SvekNode#isShielded`'s
 *  `hasKal1`/`hasKal2` half, independent of the shape/port mechanisms above
 *  (svek/SvekNode.java:383-396; see `graph-layout.types.ts`'s field doc).
 *  Split out of `class-dot-graph.ts#buildOneDotNode` for that function's CCN
 *  budget. */
export function applyShapeAndPorts(
  node: DotInputNode,
  classifier: Classifier,
  measured: MeasuredClassifier,
  shield: { isPort: boolean; hasQualifier: boolean } | undefined,
  // T2: this leaf's `Entity#getPortShortNames()` (`classifierPortShortNames`),
  // ONLY for an `isRowPortKind` leaf -- see `class-dot-graph.ts`'s caller.
  portShortNames: ReadonlySet<string> | undefined,
): void {
  const hasPortBands = portShortNames !== undefined && portShortNames.size > 0;
  const shape = resolveNodeShape(classifier, shield, hasPortBands);
  if (shape !== undefined) node.shape = shape;
  if (shouldMarkPort(shape, shield?.isPort === true, classifier.kind)) node.isPort = true;
  if (shield?.hasQualifier === true) node.qualifierShielded = true;
  if (classifier.kind === 'map') {
    // A map is RECTANGLE_HTML_FOR_PORTS unconditionally (EntityImageMap
    // #getShapeType, svek/image/EntityImageMap.java:245-247) -- even with
    // zero rows, which is what makes `map map0` a row table with a lone
    // trailer row rather than a shield. `portRows` being PRESENT (not its
    // length) is what switches the emitter and the layout adapter over.
    node.portRows = mapPortRows(classifier, measured);
  } else if (portShortNames !== undefined && hasPortBands) {
    node.portRows = classFamilyPortRows(measured, portShortNames, classifier.kind);
  }
}

// ---------------------------------------------------------------------------
// T1 (SI17): class port-band PRODUCER -- NOT wired into `applyShapeAndPorts`
// above (T2's job). ADR-1 (`plans/si17-class-row-ports/decision-journal.md`'s
// T0 entry): a class's bands come off the upstream `EntityImageClass
// #getPorts` -> `MethodsOrFieldsArea#getPorts` BLOCK-TREE composition, not
// `mapPortRows`' flat `dividerYs` recipe above -- `MeasuredClassifier
// .dividerYs` is the COMPARTMENT separator list for a class (`[32,68]` for a
// 5-row class), not one entry per row as it is for a `map`, so that recipe
// drops or misplaces every class band it touches (T0's measured table).
//
// PLUMBING CONSTRAINT (verified, not re-derived): `class-dot-graph.ts
// #buildOneDotNode` (this module's only caller) has no `StringMeasurer`/
// `Theme` at its call site, so a producer here cannot itself measure text or
// construct the real klimt `TextBlock` tree `MethodsOrFieldsArea#getPorts`
// runs on. `MeasuredClassifier` also does not (yet) publish a per-member
// height or compartment boundary -- `class-member-rows.ts:200-201` computes
// upstream's exact per-row `y` and keeps only a text BASELINE, discarding the
// row-top/height terms this producer needs. `classPortRows` below therefore
// takes those terms as an EXPLICIT parameter (`PortRowCompartmentInput`);
// wiring a caller that supplies them from `MeasuredClassifier` is T2's task.
// ---------------------------------------------------------------------------

/**
 * One member row's producer-facing input -- the per-member terms the
 * block-tree frame needs that `MeasuredClassifier` does not yet publish
 * (see the plumbing-constraint note above).
 */
export interface PortRowMemberInput {
  /**
   * ADR-5: the election's input text is upstream's `Member.getDisplay(false)`
   * -- the display form WITHOUT the visibility character, even when the row
   * itself RENDERS with one. T2 must supply `formatMemberText(member, false)`
   * (`class-layout-helpers.ts:145`'s `keepVisibilityChar` default), NEVER
   * `ClassifierGeo.rows[i].text` (`class-member-rows.ts:180,203`), which
   * carries the char whenever `member.visibilityExplicit` is true. Drift
   * here does not fail loudly -- it silently elects a DIFFERENT row.
   * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:213-217 (convert)
   */
  readonly text: string;
  /**
   * This member's own measured content height -- T2 must supply the SAME
   * `MemberRowBuild.height` value `class-member-rows.ts:182,201` already
   * reads into its `rowTop` accumulator and then discards.
   * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:201-208 (dim.getHeight())
   */
  readonly height: number;
}

/**
 * One fields-or-methods compartment, in `BodierLikeClassOrObject#getBody`'s
 * `mergeTB(fields, methods)` order (fields first, methods second) --
 * `~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java:237-249`.
 * `classPortRows` composes however many compartments it is given the SAME
 * way `TextBlockVertical#getPorts`'s child loop does
 * (`~/git/plantuml/.../klimt/shape/TextBlockVertical.java:107-118`), so a
 * caller with one compartment or more than two is handled identically.
 */
export interface PortRowCompartmentInput {
  readonly members: readonly PortRowMemberInput[];
}

/**
 * `TextBlockUtils.withMargin(area, 6, 4)`'s top/bottom margin term (4) --
 * `TextBlockMarged#getPorts`'s `translateY(top)` (`~/git/plantuml/.../
 * klimt/shape/TextBlockMarged.java:100-102`), fed by `withMargin`'s own
 * `top = marginY` assignment (`~/git/plantuml/.../klimt/shape/
 * TextBlockUtils.java:64-69`). The SAME upstream value `class-member-
 * rows.ts`'s (unexported) `SECTION_MARGIN_TOP`/half of `EMPTY_SECTION_
 * HEIGHT` (8 = 4+4) already establishes for that file's own margin-only
 * empty-compartment floor -- redeclared locally rather than imported
 * because this task's write-set may not touch `class-member-rows.ts`.
 */
const SECTION_MARGIN = 4;

/**
 * `MethodsOrFieldsArea#getElected`/`#sortBySize` (java:180-192,219-236;
 * ported in full at `core/cucadiagram/MethodsOrFieldsArea.ts:219-274`) are
 * this producer's REQUIRED election mechanism -- never reimplemented here.
 * Constructing a real `MethodsOrFieldsArea` instance needs a `Display`/
 * `Entity`/`StringBounder` this seam does not have (see the plumbing-
 * constraint note above), so both ported methods are invoked directly
 * against the class's OWN `.prototype` object as the method receiver.
 * This is sound because BOTH methods are pure over their own parameters --
 * confirmed by reading the bodies, not assumed: `sortBySize` sorts a COPY
 * of its input and touches no field; `getElected` calls only
 * `this.getScore(cs, shortName)`, and `getScore` reads only its own two
 * parameters. Supplying `MethodsOrFieldsArea.prototype` as `this` gives
 * `getElected`'s internal `this.getScore` call exactly what it dereferences
 * (the sibling method itself, found directly ON that prototype object) --
 * no different from a real instance for this call, since no instance field
 * is ever read. `getElected` is invoked through its normal PUBLIC method
 * syntax; `sortBySize` is private (upstream and here), so its call site
 * narrows the prototype to that one method's own signature rather than
 * casting to `any`.
 */
function electedFor(memberText: string, sortedShortNames: readonly string[]): Elected | null {
  return MethodsOrFieldsArea.prototype.getElected(memberText, sortedShortNames);
}

/** @see {@link electedFor}'s doc comment -- same reuse rationale, for the
 *  private `sortBySize` half of the election. */
function sortShortNamesBySize(shortNames: Iterable<string>): string[] {
  const proto = MethodsOrFieldsArea.prototype as unknown as {
    sortBySize(all: Iterable<string>): string[];
  };
  return proto.sortBySize(shortNames);
}

/**
 * The port bands of a class/interface/enum/... leaf's body (ADR-1, block
 * tree) -- `EntityImageClass#getPorts` -> `MethodsOrFieldsArea#getPorts`,
 * composed exactly as T0 measured it:
 *
 * `position = headerHeight + Σ(prior compartments' FULL margined height) +
 * SECTION_MARGIN + Σ(prior members' own height, SAME compartment)`
 *
 * | Layer | behavior | `file:line` |
 * |---|---|---|
 * | `EntityImageClass` | `body.getPorts().translateY(dimHeader.getHeight())` | `svek/image/EntityImageClass.java:247-253` |
 * | `TextBlockVertical` | per-child `translateY(y)`, `y += child's OWN full height` | `klimt/shape/TextBlockVertical.java:107-118` |
 * | `TextBlockLineBefore` | pass-through, no translate | `klimt/shape/TextBlockLineBefore.java:103-107` |
 * | `TextBlockMarged` | `translateY(top)`, `top = SECTION_MARGIN` | `klimt/shape/TextBlockMarged.java:100-102` |
 * | `MethodsOrFieldsArea` | `y` accumulates each member's own height | `cucadiagram/MethodsOrFieldsArea.java:194-211` |
 *
 * A compartment's FULL margined height is `SECTION_MARGIN * 2 +
 * Σ(member heights)` -- the same margin-only floor `class-member-rows.ts`'s
 * `EMPTY_SECTION_HEIGHT` (8 = 4+4) already establishes for an EMPTY
 * compartment, so an empty leading compartment still pushes the next one
 * down by 8, matching `BodierLikeClassOrObject#getBody` always building
 * BOTH compartments even when one has zero members.
 *
 * ADR-4: the shape flip is on `portShortNames.size > 0`, NOT on this
 * function's return -- a classifier with declared port names whose every
 * member loses its election still returns `[]` here, and the CALLER (not
 * this function) must still flip the node to `RECTANGLE_HTML_FOR_PORTS`.
 *
 * Jar-verified against T0's three oracle controls (`plans/si17-class-row-
 * ports/decision-journal.md`): `dekaba-54-fafi485` (single compartment, one
 * elected member: 36/14), the authored `fm-both` fixture (fields `field2`
 * 50/14, methods `method1` 72/14 -- the methods compartment correctly
 * carries the whole fields compartment's height), and `xefeme-77-fagu709`
 * (two elected members in one compartment: 36/14, 50/14).
 */
export function classPortRows(
  compartments: readonly PortRowCompartmentInput[],
  portShortNames: Iterable<string>,
  headerHeight: number,
): DotInputPortRow[] {
  const sortedShortNames = sortShortNamesBySize(portShortNames);
  if (sortedShortNames.length === 0) return [];

  const ports = new Ports();
  let compartmentTop = headerHeight;
  for (const compartment of compartments) {
    let memberTop = compartmentTop + SECTION_MARGIN;
    let contentHeight = 0;
    for (const member of compartment.members) {
      const elected = electedFor(member.text, sortedShortNames);
      if (elected !== null) {
        ports.add(elected.getShortName(), elected.getScore(), memberTop, member.height);
      }
      memberTop += member.height;
      contentHeight += member.height;
    }
    compartmentTop += SECTION_MARGIN * 2 + contentHeight;
  }

  return ports.getAllPortGeometry().map((g) => ({
    id: g.getId(),
    position: g.getPosition(),
    height: g.getHeight(),
  }));
}

/**
 * `Entity#getPortShortNames()`'s originating mechanism, for a T2 caller that
 * has an `ast.relationships` array but no live `Entity` graph: `Link
 * #setPortMembers` registers a `Class::member` edge's port name on BOTH the
 * FROM and TO classifier, independently of each other and of the link's
 * later lifecycle (`~/git/plantuml/.../abel/Link.java:515-524` ->
 * `Entity#addPortShortName`, `abel/Entity.java:538`). `Relationship
 * .fromPort`/`.toPort` already carry the raw (un-encoded) name
 * (`class-relationship-parser.ts:314`, `class-map-commands.ts:365`) for any
 * edge that is STILL alive -- this collects them per classifier id, matching
 * `Entity#portShortNames`'s `Set` semantics (each name registered at most
 * once, regardless of how many edges name it). B2 (SI17): a subsumed edge's
 * OWN port does not survive here -- `class-assoc-couple.ts` no longer copies
 * it onto a live relationship (upstream's replacement edges name no port of
 * their own); see {@link classPortShortNamesById}'s doc comment for where
 * that history is actually preserved.
 */
export function classifierPortShortNames(
  classifierId: string,
  relationships: readonly { from: string; to: string; fromPort?: string; toPort?: string }[],
): Set<string> {
  const names = new Set<string>();
  for (const rel of relationships) {
    if (rel.from === classifierId && rel.fromPort !== undefined) names.add(rel.fromPort);
    if (rel.to === classifierId && rel.toPort !== undefined) names.add(rel.toPort);
  }
  return names;
}

/**
 * T2 (SI17): {@link classifierPortShortNames}, ONE call per
 * `isRowPortKind` leaf (SI20 T2: that predicate, not `LIKE_CLASS_KINDS` --
 * see its own doc comment in `class-shield-helpers.ts` for why `object`
 * joined it and why `map`/`json` did not) rather than per-edge, indexed by
 * classifier id -- mirrors
 * `class-shield-helpers.ts#shieldedClassifierIds`'s own "precompute once
 * over `ast.relationships`" precedent. Every other kind is excluded: `map`'s
 * row bands are `mapPortRows`' own concern, and no other kind has a
 * row-port producer yet (see `applyShapeAndPorts`'s doc comment). Consumed
 * by `class-dot-graph.ts` to thread the SAME map to both node building
 * (ADR-4's shape/`portRows` gate) and edge building (ADR-3's unconditional
 * tailport/headport gate), so they agree on exactly which ids carry bands.
 *
 * B2 (SI17): unions in {@link Classifier.portShortNames} -- the classifier's
 * OWN persistent registry (`Entity#portShortNames`, `abel/Entity.java:112`),
 * which is how a subsumed `Class::member` association-class-couple edge
 * keeps shielding its classifier after `class-assoc-couple.ts` removes the
 * link, without that history leaking onto the couple's port-free replacement
 * edge (`edgePortAttrs` reads ONLY `rel.fromPort`/`.toPort`, never this
 * field, so the union here cannot put a port back onto a DOT edge).
 */
/**
 * ONE pass over `ast.relationships`, building every eligible leaf's port-name
 * set at once -- the shape `class-shield-helpers.ts#shieldedClassifierIds`
 * already uses, and the reason {@link classifierPortShortNames} (which scans
 * the whole relationship list for a SINGLE id) is not called in a loop here.
 * Doing that is O(classifiers x relationships), and SI20 widened
 * `isRowPortKind` to include `object`, so in an object diagram -- where every
 * leaf is an object -- every leaf now qualifies where none used to, taking a
 * path that was previously skipped outright.
 *
 * Per-id insertion order is deliberately unchanged: relationships are still
 * visited in source order and each id's names still land in that order, so
 * the resulting `Set`s iterate exactly as the per-classifier version's did.
 */
function rowPortNamesFromRelationships(ast: ClassDiagramAST): Map<string, Set<string>> {
  const eligible = new Set<string>();
  for (const c of ast.classifiers) if (isRowPortKind(c.kind)) eligible.add(c.id);
  const byId = new Map<string, Set<string>>();
  const add = (id: string, name: string | undefined): void => {
    if (name === undefined || !eligible.has(id)) return;
    const existing = byId.get(id);
    if (existing === undefined) byId.set(id, new Set([name]));
    else existing.add(name);
  };
  for (const rel of ast.relationships) {
    add(rel.from, rel.fromPort);
    add(rel.to, rel.toPort);
  }
  return byId;
}

export function classPortShortNamesById(ast: ClassDiagramAST): Map<string, Set<string>> {
  const byId = rowPortNamesFromRelationships(ast);
  for (const c of ast.classifiers) {
    if (!isRowPortKind(c.kind) || c.portShortNames === undefined) continue;
    const names = byId.get(c.id) ?? new Set<string>();
    for (const name of c.portShortNames) names.add(name);
    if (names.size > 0) byId.set(c.id, names);
  }
  return byId;
}
