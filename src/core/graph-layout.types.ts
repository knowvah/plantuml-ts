// Imported (not merely re-exported below) because `DotInputGraph.clusters`
// references the name locally; `export … from` alone creates no local binding.
import type { DotInputCluster } from './graph-layout-cluster.types.js';

// Consumer-facing graph-layout types.
//
// Relocated verbatim (names + shapes) from the deleted `src/core/dot/types.ts`
// per plans/burn-graphviz-engines/decisions.md#d4. These are the only types the
// six graph diagram renderers read; the engine-internal working types (DotNode,
// DotEdge, DotWorkingGraph) died with the in-house engines.

/** Node outline Svek emits as the graphviz `shape` (and `style=rounded`).
 *  Absent ⇒ treated as `rect` (Svek's default for boxed entities). */
export type DotInputNodeShape =
  | 'rect'
  | 'rounded'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'octagon'
  | 'hexagon'
  | 'point'
  | 'plaintext'
  /** A5/T7: graphviz `shape=record`. The ONLY shape whose geometry the layout
   *  actually derives from a label rather than from the caller's measured
   *  `width`/`height` — see `DotInputNode.recordLabel`. */
  | 'record';

/**
 * One `PortGeometry` band on a `RECTANGLE_HTML_FOR_PORTS` node — the DOT-input
 * projection of `svek/PortGeometry.java`, carrying only what
 * `SvekNode#appendLabelHtmlSpecialForLink` reads back out of `Ports`.
 * `score` is deliberately absent: it exists to arbitrate which report wins
 * inside `Ports#add`, and is already spent by the time `getAllPortGeometry()`
 * hands the sorted snapshot to the emitter.
 */
export interface DotInputPortRow {
  /** ALREADY md5-encoded (`Ports#encodePortNameToId`, svek/Ports.java:53-55) —
   *  the emitter writes this verbatim into `PORT="…"`. */
  id: string;
  /** Top of the band, in px from the node box's top edge
   *  (`PortGeometry#getPosition`). */
  position: number;
  /** Band height in px (`PortGeometry#getHeight`). */
  height: number;
}

export interface DotInputNode {
  id: string;
  width: number;
  height: number;
  /** Svek-faithful node outline. Layout ignores this (all nodes lay out as a
   *  box); only the Svek-DOT emitter reads it. Absent ⇒ rect. */
  shape?: DotInputNodeShape;
  /**
   * A5/T7: the record label for `shape: 'record'`, in graphviz's own record
   * syntax (`a|b`, `{a|{b|c}}`, `<PORT>text`). Field ports declared here are
   * what `DotInputEdge.attributes.tailport` targets.
   *
   * Unlike every other shape, a record is NOT laid out `fixedsize` from the
   * caller's `width`/`height`: graphviz sizes it from its own fields, and
   * `width`/`height` act as minimums. That is upstream's design --
   * `SmetanaForJson#createNode` (`SmetanaForJson.java:233-262`) sets
   * `shape=record`, the label, and the (swapped) width/height, and no
   * `fixedsize`.
   *
   * **Field sizes come from the text measurer.** Upstream cannot measure text
   * inside Smetana, so it encodes each cell's exact dimensions in the label as
   * a `_dim_<h>_<w>_` sentinel and decodes it in
   * `smetana/core/Macro.java:1294 hackInitDimensionFromLabel`. This port keeps
   * that mechanism rather than inventing another: see
   * `core/dot-engine-measurer.ts`, which installs a measurer that decodes the
   * same sentinel and delegates everything else to the lookup table.
   */
  recordLabel?: string;
  xlabel?: string;
  xlabelWidth?: number;
  xlabelHeight?: number;
  attributes?: {
    rank?: 'source' | 'sink' | 'same' | 'min' | 'max';
  };
  /** Svek EntityPosition PORTIN/PORTOUT (abel/EntityPosition.java) — edges
   *  referencing this node get Svek's `:P` compass suffix (`Link
   *  .getEntityPort` -> `EntityPort.forPort`, abel/Link.java:227-231)
   *  regardless of which shape branch below is chosen, and it participates
   *  in its owning cluster's rank-chain (`ClusterDotString.printRanks`).
   *  Emitter-only. */
  isPort?: true;
  /** Only meaningful when `isPort` && `shape:'plaintext'` — the blank
   *  flanking-cell width for the PORT="P" HTML table
   *  (`SvekNode.appendLabelHtmlSpecialForPortHtml`'s `fullWidth`, clamped to
   *  a 10px floor). Emitter-only. */
  portPad?: number;
  /**
   * Svek `ShapeType.RECTANGLE_HTML_FOR_PORTS`: the per-member-row port bands
   * `SvekNode#appendLabelHtmlSpecialForLink` turns into `<TR><TD … PORT="…">`
   * rows (svek/SvekNode.java:268-296, rows via `appendTr` `:298-311`). Present
   * (even as an EMPTY array) ⇒ this node is emitted as a row table and, unlike
   * every other shape, is handed to the layout engine as an HTML **label**
   * with no `width`/`height`, so graphviz pads it by 4·GAP wide / 2·GAP tall
   * and floors it at 54x36 exactly as it does for the jar
   * (`~/git/graphviz/lib/common/shapes.c:1993-2009`, `GAP` at
   * `~/git/graphviz/lib/common/const.h:251`).
   *
   * Absent ⇒ the pre-existing shield-table emission and `fixedsize` layout
   * fold, unchanged — `description`'s `circle`/interface leaves and `state`'s
   * json states keep their current geometry.
   *
   * Selected upstream by `EntityImageMap#getShapeType` (unconditional,
   * `svek/image/EntityImageMap.java:245-247`), `EntityImageJson` (`:241`),
   * and `EntityImageObject`/`EntityImageClass` only when the leaf has port
   * short names (`:249-253` / `:254-258`).
   */
  portRows?: readonly DotInputPortRow[];
  /**
   * B1 (SI17): `SvekNode#isShielded` (svek/SvekNode.java:383-396) — true when
   * this leaf is the qualified end of some `Link` (`link.hasKal1()`/
   * `hasKal2()`, `abel/Link.java:569-575`, off `[Qualifier]` association
   * syntax). `Bibliotekon#getNodeUid` (svek/Bibliotekon.java:126-132)
   * appends `:h` to every DOT reference to a shielded leaf's uid,
   * independently of node shape/type — a `portRows` leaf (RECTANGLE_
   * HTML_FOR_PORTS) still needs this flag to earn `:h`; shape alone
   * (`EntityImageClass`/`EntityImageMap#getShapeType`) is a separate switch.
   * Does NOT cover the OTHER `isShielded` trigger — a plain quantifier/role
   * cardinality label's margin bump, gated on graphviz <= 2.28
   * (`svek/SvekEdge.java:232-239`, `dot/GraphvizVersionFinder.java:48-88`);
   * out of scope, no corpus fixture needs it. */
  qualifierShielded?: true;
  /** Svek `ClusterDotString.empty()` port placeholder: reuses the
   *  group-anchor id as a tiny `.01in` rect carrying the OWNING cluster's
   *  own title HTML as its label, instead of the plain `shape:'point'`
   *  anchor used when no port forces this (ClusterDotString.java:177-184).
   *  Only ever set together with `shape:'rect'`. Emitter-only. */
  titleLabelWidth?: number;
  titleLabelHeight?: number;
  /** ClusterDotString.java:148-149: `thereALinkFromOrToGroup2` -- true when
   *  some OTHER edge in the graph also targets this cluster's group entity
   *  directly (a note or link attached to the group, not one of its port
   *  children). Independently of `hasPort()`, upstream ALWAYS emits the
   *  plain `id [shape=point,width=.01,label=""];` anchor declaration first
   *  in that case; the ee-placeholder's `shape=rect` + title-table line
   *  (driven by `titleLabelWidth`/`titleLabelHeight` above) still follows.
   *  Only meaningful together with `titleLabelWidth`/`titleLabelHeight`.
   *  Emitter-only. */
  groupAnchorAlsoPoint?: true;
}

export interface DotInputEdge {
  id: string;
  from: string;
  to: string;
  attributes?: {
    weight?: number;
    minLen?: number;
    /**
     * A5/T7: a graphviz `tailport` — the NAME of a field port declared in the
     * tail node's `recordLabel` (upstream emits `P0`, `P1`, ... per row:
     * `SmetanaForJson.java:224`). Resolved by the engine's own
     * `map_rec_port`/`record_port` (a port of `lib/common/shapes.c`), so the
     * edge leaves the specific ROW rather than the node's centre.
     */
    tailport?: string;
    /**
     * B1/M1: the head-side counterpart of {@link tailport}. On a
     * `RECTANGLE_HTML_FOR_PORTS` node this is a `DotInputPortRow.id` (an
     * md5-encoded member-row port), so the edge lands on the specific member
     * row rather than the node's centre — the jar emits both suffixes on one
     * statement (`sh0006:p48c4…->sh0007:pcb85…`, `svek/SvekEdge.java` via
     * `Bibliotekon#getNodeUid` + `abel/Link.java:219-231`).
     */
    headport?: string;
    /** ~~Normalized port y-offset on the tail (FROM) node.~~
     *  **DEAD (A5/T7).** json set this on every edge and nothing ever
     *  forwarded it to the engine, so it never had an effect; `tailport`
     *  above is the real mechanism and replaced it. Retained only to keep the
     *  field's history legible -- no producer remains. */
    tailportY?: number;
    /**
     * The graphviz arrow attributes, forwarded verbatim to the engine.
     *
     * Upstream sets all three on EVERY json-family edge, in one place:
     *
     * ```java
     * agsafeset(zz, edge, new CString("arrowsize"), new CString(".75"), ...);
     * agsafeset(zz, edge, new CString("arrowtail"), new CString("none"), ...);
     * agsafeset(zz, edge, new CString("arrowhead"), new CString("normal"), ...);
     * ```
     * `SmetanaForJson.java:221-223` (`#createEdge`, alongside the `tailport`
     * above at :224).
     *
     * These are NOT decorative. Declaring an arrowhead makes graphviz SHORTEN
     * the spline to leave room for it and record the arrow's attachment point
     * as `bezier.ep` — which is what `DotLayoutResult.edges[].ep` reports and
     * `json/JsonCurve.ts` draws the arrowhead to. Without them the engine
     * neither reserves nor shortens, and `ep` is absent (C `eflag` unset), so
     * a consumer has nothing to read and must extrapolate a tip instead.
     *
     * Absent on every non-json caller (class, component, usecase, state),
     * which is faithful: no other engine sets them.
     */
    arrowhead?: string;
    arrowtail?: string;
    arrowsize?: string;
    label?: string;
    labelWidth?: number;
    labelHeight?: number;
    /** G8 T2 (`plans/g8-label-placement/`): the REAL FIXEDSIZE HTML-table
     *  label-box reservation `graph-layout-build.ts#addEdges` feeds
     *  @knowvah/dot-engine for THIS edge (mirrors `DotInputCluster.titleTableWidth`/
     *  `.titleTableHeight`'s identical additive pattern -- see that field's
     *  own doc comment for the full `setHtmlAttr` mechanism). Deliberately
     *  DISTINCT from `labelWidth`/`labelHeight` above (the pre-existing,
     *  UN-margined/UN-floored Svek-DOT TEXT emitter convention -- kept
     *  unchanged for every caller, including the one that also sets this
     *  field): the state composite/flat pipelines set BOTH, one for the
     *  oracle/emitter path, one for the real FIXEDSIZE layout-input
     *  reservation. Additive: absent (every pre-existing caller -- class,
     *  component, usecase edges, and a state transition with an attached
     *  `note on link`, whose merged label+note margin story is
     *  unverified this iteration) falls back to the pre-existing
     *  plain-text `label` DOT attr, unchanged. */
    labelBoxWidth?: number;
    labelBoxHeight?: number;
    /** Tail/head end labels (association cardinality/roles). Sizing-only
     *  (`tailLabelWidth`/`tailLabelHeight`/`headLabelWidth`/`headLabelHeight`)
     *  is emitter-only (Svek-DOT text, `svek-dot-emit.ts`); the DOT-gate
     *  comparator never checks pixel widths, so these do not need to match
     *  `tailLabel`/`headLabel` exactly. */
    tailLabelWidth?: number;
    tailLabelHeight?: number;
    headLabelWidth?: number;
    headLabelHeight?: number;
    /**
     * G2/N25: the actual multiplicity/cardinality/role TEXT for the tail
     * (FROM-side) and head (TO-side) edge-end labels
     * (`SvekEdge.java:447-468`'s `taillabel=<TABLE>`/`headlabel=<TABLE>`
     * DOT attrs). Unlike the `*Width`/`*Height` pair above, these ARE fed
     * into the real @knowvah/dot-engine layout call (`graph-layout.ts#addEdges`)
     * so its own faithfully-ported external-label placement algorithm
     * (`label/xlabels.ts`, `lib/label/xlabels.c:placeLabels`/`xladjust`)
     * computes the position graphviz would — upstream never sets
     * `labelangle`/`labeldistance` on any class-diagram edge (`LinkArg`
     * carries both fields but no `net/` call site ever reads them for DOT
     * emission — dead upstream), so `place_portlabel`'s early-return always
     * fires and every tail/head label is placed via the external-label
     * force-search path, not a closed-form angle/distance formula. Absent
     * for every other diagram type — additive, no other caller sets this. */
    tailLabel?: string;
    headLabel?: string;
    /** Invisible constraint edge (Svek `style=invis`). Emitter-only. */
    invis?: boolean;
    xlabel?: string;
    xlabelWidth?: number;
    xlabelHeight?: number;
    /**
     * G2/N14: per-edge override of `DotInputGraph.manualArrowheads` — this
     * edge draws NO arrowhead at all (a class-diagram note connector,
     * merged into the note's own Opale outline, `SvekEdge#drawU`'s `if
     * (opale) return;`), so @knowvah/dot-engine must NOT reserve its default
     * ~10-11px arrow-length clip gap when trimming the routed spline to the
     * target node's boundary (`graph-layout.ts#addEdges`'s own doc comment
     * — the SAME mechanism `manualArrowheads` already handles graph-wide,
     * scoped here to a single edge so it doesn't touch the arrowhead-marker
     * clip behavior every OTHER class-diagram edge already relies on).
     */
    noArrow?: boolean;
    /**
     * `sametail` — graphviz groups every edge sharing this value onto ONE
     * shared tail point instead of letting them fan out from the node
     * border. Upstream sets it on inheritance links whose tail reaches
     * `skinparam groupInheritance N` (`dot/DotData.java:122-161`
     * `removeIrrelevantSametail`) and emits it last on the edge line
     * (`svek/SvekEdge.java:478-479`).
     *
     * The value is the TAIL ENTITY's `ent%04d` uid, not its `sh####` node
     * id — a different counter (`abel/Entity.java:171`). Carried here rather
     * than derived at emission because only the class engine knows it.
     */
    sametail?: string;
    /**
     * `constraint=false` — the edge is drawn but does NOT participate in rank
     * assignment. Far more consequential than it looks: on
     * `class/kupetu-36-kive480` its absence adds an entire extra rank and
     * moves every node.
     *
     * Only `false` is ever carried. Upstream never writes `constraint=true`
     * (that is graphviz's default), so the field's presence IS the signal —
     * `svek/SvekEdge.java:475-476`:
     *
     *     if (link.isConstraint() == false || link.hasTwoEntryPointsSameContainer())
     *         sb.append(",constraint=false");
     *
     * Two ports feed it. `isConstraint() == false` comes from the `[norank]`
     * link style (`WithLinkType.java:157-158` -> `Link#goNorank`), set per
     * engine at the same site that handles `invis`.
     * `hasTwoEntryPointsSameContainer()` (`Link.java:443-448`) is computed
     * generically from the assembled graph — see
     * `graph-layout-build-constraint.ts`.
     *
     * Both graph-level paths -- the same-container rule and `Link.java:139
     * -141`'s kermor XOR -- live in `graph-layout-build-constraint.ts`.
     */
    constraint?: false;
  };
}

export type { DotInputCluster };


export interface DotInputGraph {
  nodes: DotInputNode[];
  edges: DotInputEdge[];
  rankDir?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSep?: number;
  rankSep?: number;
  /** When true, nodeSep is an explicit `skinparam nodesep` override and the
   *  emitter must NOT apply the 35px minimum floor — a nonzero skinparam
   *  value replaces the min-clamped default outright
   *  (svek/DotStringFactory.java:117-124). Absent = clamp as before. */
  nodeSepExplicit?: boolean;
  /** Same as nodeSepExplicit for ranksep and its 60px floor
   *  (DotStringFactory.java:125-133). */
  rankSepExplicit?: boolean;
  /** Svek child-pass attr omission (mission A4/T4, mechanisms.md §3):
   *  `GroupMakerState`'s inner `GraphvizImageBuilder.buildImage` calls pass a
   *  caller-supplied EMPTY `dotStrings[]` placeholder array, so
   *  `DotStringFactory.createDotString`'s nodesep/ranksep substitution never
   *  fires — the emitted DOT for an autonom composite's own child pass has
   *  NO nodesep/ranksep line at all (not even the floor). When true, the
   *  emitter skips both lines unconditionally, ignoring `nodeSep`/`rankSep`/
   *  the *Explicit flags entirely. Absent/false = prior behavior (floor or
   *  explicit value always printed) — additive, no existing caller sets
   *  this (D3; class/object/description sibling ratchets unaffected). */
  omitSepAttrs?: true;
  aspect?: number;
  /** Cluster structure for Svek-DOT emission. Layout ignores it (clusters are
   *  still resolved post-layout); only the emitter reads it. Emitter-only. */
  clusters?: DotInputCluster[];
  /** `!pragma kermor on` (skin/PragmaKey.java:55) — svek's alternate
   *  cluster/note DOT-emission path (svek/ClusterDotStringKermor.java,
   *  Cluster.java:595-609 `printCluster3_forKermor`). Changes the ranksep
   *  floor/divisor (DotStringFactory.java:111-114,247-249: 40px floor,
   *  dzeta÷100 instead of dzeta÷10 — nodesep is untouched) and the cluster
   *  body shape (no `ee`-wrapped port subgraph, no port anchor/rank-chain,
   *  an `${id}empty` point placeholder when a cluster's direct non-port
   *  members are empty). Emitter- and spacing-only; description is the only
   *  engine that ever sets this (see description/layout.ts, ast.ts's
   *  `kermor` field, description-dot-100 decision-journal.md I2) — absent
   *  for every other diagram engine, so this is additive/no-op for them. */
  kermor?: true;
  /** True when every edge's arrowhead/decoration is drawn manually by the
   *  caller's own renderer (e.g. `core/svek/SvekEdge.ts`'s per-end
   *  `Extremity` polygons — see `svek-edge-extremity.ts`), rather than via
   *  an SVG `marker-end` sitting at the raw spline endpoint. The Svek-DOT
   *  text emitter already reflects this faithfully for EVERY diagram type
   *  (`svek-dot-emit.ts`: every edge line carries
   *  `arrowtail=none,arrowhead=none`, confirmed universal across the whole
   *  cached-fixture corpus) — but `layoutGraph()`'s @knowvah/dot-engine seam only
   *  honors it when this flag is set, because callers that draw arrowheads
   *  via `marker-end` (class/state/dot/json — see each renderer's own
   *  `markerEnd`/`targetMarker` call sites) rely on graphviz's *default*
   *  arrowhead-length spline-clip reservation to leave room for that marker
   *  without overlapping the target node's box; only `description`
   *  (component/usecase) sets this today. Absent/false = prior behavior
   *  (graphviz reserves arrow-length space when clipping every spline to
   *  its target node) — additive, no existing non-description caller sets
   *  this. */
  manualArrowheads?: true;
}
// `DotLayoutResult` moved to ./graph-layout-result.types.ts for the 500-line
// file cap (see that module's header). Re-exported so no consumer changed.
export type { DotLayoutResult } from './graph-layout-result.types.js';
