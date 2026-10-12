/**
 * MyElkDrawing (cdd8 T2b), checked against `MyElkDrawing.java` line by line on
 * a synthetic layout, and end to end on cadutu-02-lazu601 (elkjs -> maker ->
 * drawing -> UGraphicSvg) against the jar's in.svg
 * (test-results/dot-cache/class/cadutu-02-lazu601/in.svg).
 */
import { describe, expect, it } from 'vitest';

import { LinkDecor } from '../../../src/core/decoration/LinkDecor.js';
import { LinkType } from '../../../src/core/decoration/LinkType.js';
import { getPosition, makeElkLayout } from '../../../src/core/elk/CucaDiagramFileMakerElk.js';
import type { ElkMakerMaps } from '../../../src/core/elk/CucaDiagramFileMakerElk.js';
import type { ElkColors, ElkDiagramAdapter } from '../../../src/core/elk/ElkDiagramAdapter.js';
import { loadElk } from '../../../src/core/elk/load-elk.js';
import { MyElkDrawing, newMyElkDrawing } from '../../../src/core/elk/MyElkDrawing.js';
import type { ElkEdge } from '../../../src/core/elk/proxy/graph/ElkEdge.js';
import type { ElkEdgeSection } from '../../../src/core/elk/proxy/graph/ElkEdgeSection.js';
import type { ElkLabel } from '../../../src/core/elk/proxy/graph/ElkLabel.js';
import type { ElkNode } from '../../../src/core/elk/proxy/graph/ElkNode.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { MagneticBorder } from '../../../src/core/klimt/geom/MagneticBorder.js';
import { MagneticBorderNone } from '../../../src/core/klimt/geom/MagneticBorderNone.js';
import { MinMax } from '../../../src/core/klimt/geom/MinMax.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { PackageStyle } from '../../../src/core/svek/PackageStyle.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type Pt = readonly [x: number, y: number];

const GROUP = 'pkg';
const LEAF_A = 'a';
const LEAF_B = 'b';
const LINK = 'lnk';
const NO_DECOR = new LinkType(LinkDecor.NONE, LinkDecor.NONE);
const ARROW_ONLY = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
const LINE_COLOR = '#181818';
const noColors: ElkColors = { getColor: () => null, getSpecificLineStroke: () => null };

function notRead(member: string): () => never {
  return () => {
    throw new Error(`${member} is not read by MyElkDrawing`);
  };
}

function elkLabel(text: string, [x, y]: Pt = [0, 0]): ElkLabel {
  return {
    setProperty: () => undefined,
    setText: () => undefined,
    setDimensions: () => undefined,
    getText: () => text,
    getX: () => x,
    getY: () => y,
  };
}

const ROOT: ElkNode = elkNode(null, [0, 0], [0, 0]);

function elkNode(parent: ElkNode | null, [x, y]: Pt, [w, h]: Pt, labels: readonly ElkLabel[] = []): ElkNode {
  return {
    setProperty: () => undefined,
    setDimensions: () => undefined,
    getParent: () => parent,
    getX: () => x,
    getY: () => y,
    getWidth: () => w,
    getHeight: () => h,
    getLabels: () => labels,
  };
}

function section(start: Pt, end: Pt): ElkEdgeSection {
  return {
    getStartX: () => start[0],
    getStartY: () => start[1],
    getEndX: () => end[0],
    getEndY: () => end[1],
    getBendPoints: () => [],
  };
}

function elkEdge(container: ElkNode, sections: readonly ElkEdgeSection[], labels: readonly ElkLabel[] = []): ElkEdge {
  return {
    setProperty: () => undefined,
    getContainingNode: () => container,
    getLabels: () => labels,
    getSections: () => sections,
    isHierarchical: notRead('isHierarchical'),
  };
}

/** A block drawing nothing but its name and translate into `sink`. */
function block(width: number, height: number, name = '', sink?: string[]): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(width, height),
    drawU: (ug: UGraphic) => {
      sink?.push(`${name} ${ug.getTranslate().getDx()},${ug.getTranslate().getDy()}`);
    },
  };
}

/** The cluster `pkg` at (10, 20); leaves a, b inside it, so their corners add the cluster's (CucaDiagramFileMakerElk.java:280-296). */
const CLUSTER = elkNode(ROOT, [10, 20], [200, 300], [elkLabel('C')]);
const NODE_A = elkNode(CLUSTER, [5, 30], [40, 20], [elkLabel('X')]);
const NODE_B = elkNode(CLUSTER, [5, 100], [40, 20], [elkLabel('X')]);

function syntheticMaps(
  edge: ElkEdge = elkEdge(CLUSTER, [section([25, 50], [25, 100])], [elkLabel('X', [1, 2])]),
): ElkMakerMaps {
  return {
    clusters: new Map([[GROUP, CLUSTER]]),
    edges: new Map([[LINK, edge]]),
    nodes: new Map([
      [LEAF_A, NODE_A],
      [LEAF_B, NODE_B],
    ]),
  };
}

interface SyntheticFacts {
  readonly invis?: boolean;
  readonly border?: MagneticBorder;
  readonly q?: Readonly<Record<string, TextBlock>>;
}

/** Records the calls standing for each draw phase into `events`. */
function syntheticAdapter(events: string[], facts: SyntheticFacts = {}): ElkDiagramAdapter {
  const throwing = {
    getDefaultStringBounder: notRead('getDefaultStringBounder'),
    getRootGroup: notRead('getRootGroup'),
    leafs: notRead('leafs'),
    getChildrenGroups: notRead('getChildrenGroups'),
    isEmpty: notRead('isEmpty'),
    getLinks: notRead('getLinks'),
    isRemoved: notRead('isRemoved'),
    getGroupType: notRead('getGroupType'),
    muteToType: notRead('muteToType'),
    groupLeafs: notRead('groupLeafs'),
    getParentContainer: notRead('getParentContainer'),
    calculateDimension: notRead('calculateDimension'),
    getClusterStyleForMagneticBorder: notRead('getClusterStyleForMagneticBorder'),
    getQuantifier1: notRead('getQuantifier1'),
    getQuantifier2: notRead('getQuantifier2'),
    getRole1: notRead('getRole1'),
    getRole2: notRead('getRole2'),
  };
  const q = facts.q ?? {};
  return {
    ...throwing,
    // MyElkCluster
    getUSymbol: () => null,
    getPackageStyle: () => null,
    getEntityColors: () => noColors,
    getClusterHeader: () => ({
      getTitleAndAttributeHeight: () => 0,
      getTitle: () => block(0, 0),
      getStereo: () => block(0, 0),
    }),
    getClusterStyle: (g) => {
      events.push(`cluster ${g}`);
      return { shadowing: 0, stroke: UStroke.simple(), roundCorner: 0, lineColor: LINE_COLOR };
    },
    getClusterBackColor: () => '#FFFFFF',
    packageStyle: () => PackageStyle.RECTANGLE,
    getPackageTitleAlignment: () => HorizontalAlignment.LEFT,
    getStereotypeAlignment: () => HorizontalAlignment.CENTER,
    // nodes
    drawLeaf: (id, ug, corner) => {
      events.push(`leaf ${id} ${corner.x},${corner.y} ug ${ug.getTranslate().getDx()},${ug.getTranslate().getDy()}`);
    },
    getMagneticBorder: () => facts.border ?? new MagneticBorderNone(),
    // edges
    isInvis: () => facts.invis ?? false,
    isHidden: (link) => {
      events.push(`edge ${link}`);
      return false;
    },
    getEntity1: () => LEAF_A,
    getEntity2: () => LEAF_B,
    getLabel: () => block(0, 0, 'centre', events),
    getQuantifier: (_link, n) => q[`q${n}`] ?? null,
    getRoleLabel: (_link, n) => q[`r${n}`] ?? null,
    getType: () => NO_DECOR,
    getArrowStyle: () => ({ lineColor: LINE_COLOR, stroke: UStroke.simple() }),
    getArrowThickness: () => null,
    getLinkColors: () => null,
    getSpecificColor: () => null,
  };
}

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', { calculateDimension: () => ({ width: 0 }) });
}

// ---------------------------------------------------------------------------
// drawU (MyElkDrawing.java:110-114)
// ---------------------------------------------------------------------------

describe('MyElkDrawing.drawU', () => {
  it('draws clusters, then nodes at their getPosition corners, then edges (:110-145)', () => {
    const events: string[] = [];
    new MyElkDrawing(syntheticAdapter(events), null, syntheticMaps()).drawU(newGraphic());
    expect(events).toEqual([
      `cluster ${GROUP}`,
      // NODE_A (5, 30) in CLUSTER (10, 20); the adapter receives the untranslated ug
      `leaf ${LEAF_A} 15,50 ug 0,0`,
      `leaf ${LEAF_B} 15,120 ug 0,0`,
      `edge ${LINK}`,
      // the centre label at (1, 2), translated by the containing node's position (:183, :203)
      'centre 11,22',
    ]);
    expect([getPosition(NODE_A).x, getPosition(NODE_A).y]).toEqual([15, 50]);
  });

  it('skips an invisible link (:154-155)', () => {
    const events: string[] = [];
    new MyElkDrawing(syntheticAdapter(events, { invis: true }), null, syntheticMaps()).drawU(newGraphic());
    expect(events).toEqual([`cluster ${GROUP}`, `leaf ${LEAF_A} 15,50 ug 0,0`, `leaf ${LEAF_B} 15,120 ug 0,0`]);
  });

  it("asks a node's border at the edge point minus the node corner (IEntityImageUtils.java:103-111)", () => {
    const asked: Pt[] = [];
    const border: MagneticBorder = {
      getForceAt: (position) => {
        asked.push([position.x, position.y]);
        return UTranslate.none();
      },
    };
    new MyElkDrawing(syntheticAdapter([], { border }), null, syntheticMaps()).drawU(newGraphic());
    // section (25, 50) -> (25, 100) in CLUSTER; translated by (10, 20) = (35, 70) / (35, 120);
    // a's corner (15, 50), b's (15, 120)
    expect(asked).toEqual([
      [20, 20],
      [20, 0],
    ]);
  });
});

// ---------------------------------------------------------------------------
// drawSingleEdge label blocks (MyElkDrawing.java:193-203)
// ---------------------------------------------------------------------------

describe('MyElkDrawing tail/head blocks', () => {
  const labelled = (): ElkMakerMaps =>
    syntheticMaps(elkEdge(ROOT, [section([0, 0], [0, 100])], [elkLabel('1', [3, 4]), elkLabel('2', [5, 90])]));

  it('falls back to the role when there is no quantifier, with no separate role (:197-201)', () => {
    const drawn: string[] = [];
    const q = { r1: block(10, 13, 'r1', drawn), r2: block(10, 13, 'r2', drawn) };
    new MyElkDrawing(syntheticAdapter([], { q }), null, labelled()).drawU(newGraphic());
    expect(drawn).toEqual(['r1 3,4', 'r2 5,90']);
  });

  it('draws the quantifier at the label and the role beside it (:197-201)', () => {
    const drawn: string[] = [];
    const q = {
      q1: block(10, 13, 'q1', drawn),
      r1: block(10, 13, 'r1', drawn),
      q2: block(10, 13, 'q2', drawn),
      r2: block(10, 13, 'r2', drawn),
    };
    new MyElkDrawing(syntheticAdapter([], { q }), null, labelled()).drawU(newGraphic());
    // MyElkEdge.java:296-305: vertical line at x 0, quantifier centre 8 / 10 right of it -> role left, gap 2
    expect(drawn).toEqual(['q1 3,4', 'q2 5,90', 'r1 -12,4', 'r2 -12,90']);
  });
});

// ---------------------------------------------------------------------------
// calculateDimension (MyElkDrawing.java:339-346)
// ---------------------------------------------------------------------------

describe('MyElkDrawing.calculateDimension', () => {
  it('is minMax.getDimension().delta(20, 20) (:345)', () => {
    const minMax = MinMax.getEmpty(false).addPoint(11, 7).addPoint(334.375, 220);
    const dim = new MyElkDrawing(syntheticAdapter([]), minMax, syntheticMaps()).calculateDimension(
      newGraphic().getStringBounder(),
    );
    expect([dim.getWidth(), dim.getHeight()]).toEqual([343.375, 233]);
  });

  it('throws without a minMax, as the provisional drawing does (:342-343)', () => {
    const drawing = new MyElkDrawing(syntheticAdapter([]), null, syntheticMaps());
    expect(() => drawing.calculateDimension(newGraphic().getStringBounder())).toThrow('UnsupportedOperationException');
  });
});

// ---------------------------------------------------------------------------
// cadutu-02-lazu601 end to end: elkjs -> maker -> MyElkDrawing -> SVG
// ---------------------------------------------------------------------------

/**
 * The jar's full-precision text widths for cadutu (`plans/class-divergence-drive-8/spike/text-widths.json`),
 * as `tests/unit/elk/MyElkEdge.test.ts` uses them: the SVG's 3 dp widths move
 * foo's second port from 246.41 to 246.411 (.agent-notes/cdd8-T2d.md).
 */
const WIDTH_14 = {
  foo1: 27.212499618530273,
  foo2: 27.212499618530273,
  foo: 19.424999237060547,
  bar: 20.212499618530273,
  bar2: 28,
};
const WIDTH_13 = {
  one: 7.231249809265137,
  star: 5.037499904632568,
  foo: 18.037500381469727,
  bar: 18.768749237060547,
  hello: 27.543750762939453,
  shortLabel: 59.962501525878906,
  thisLabel: 92.4625015258789,
  longAnd: 134.30624389648438,
  onThe: 74.34375,
};
/** rect width - textLength is 32.000 for every class in in.svg; every class is 48 high. */
const CLASS_HEADER_EXTRA = 32;
const CLASS_HEIGHT = 48;
const LINE_HEIGHT_13 = 13;
const centreLabel = (widths: readonly number[]): Pt => [Math.max(...widths) + 4, widths.length * LINE_HEIGHT_13 + 4];

interface CadutuLink {
  readonly from: string;
  readonly to: string;
  readonly type: LinkType;
  readonly label: Pt;
  readonly q1?: Pt;
  readonly q2?: Pt;
}

const CADUTU_LEAVES: Readonly<Record<string, Pt>> = Object.fromEntries(
  Object.entries(WIDTH_14).map(([id, w]) => [id, [w + CLASS_HEADER_EXTRA, CLASS_HEIGHT]]),
);

const CADUTU_LINKS: Readonly<Record<string, CadutuLink>> = {
  lnk3: {
    from: 'foo1',
    to: 'foo2',
    type: new LinkType(LinkDecor.ARROW, LinkDecor.ARROW),
    label: centreLabel([WIDTH_13.shortLabel]),
  },
  lnk6: {
    from: 'foo',
    to: 'bar',
    type: ARROW_ONLY,
    label: centreLabel([WIDTH_13.thisLabel, WIDTH_13.longAnd, WIDTH_13.onThe]),
    q1: [WIDTH_13.one, LINE_HEIGHT_13],
    q2: [WIDTH_13.star, LINE_HEIGHT_13],
  },
  lnk8: {
    from: 'foo',
    to: 'bar2',
    type: ARROW_ONLY,
    label: centreLabel([WIDTH_13.hello]),
    q1: [WIDTH_13.foo, LINE_HEIGHT_13],
    q2: [WIDTH_13.bar, LINE_HEIGHT_13],
  },
};

function cadutuLink(id: string): CadutuLink {
  const found = CADUTU_LINKS[id];
  if (found === undefined) throw new Error(`no link ${id}`);
  return found;
}

function cadutuLeaf(id: string): Pt {
  const found = CADUTU_LEAVES[id];
  if (found === undefined) throw new Error(`no leaf ${id}`);
  return found;
}

/** cadutu's class adapter, each leaf image a bare rect of its size. */
function cadutuAdapter(): ElkDiagramAdapter {
  const quantifier = (id: string, n: 1 | 2): Pt | undefined => (n === 1 ? cadutuLink(id).q1 : cadutuLink(id).q2);
  return {
    ...syntheticAdapter([]),
    getDefaultStringBounder: () => ({ calculateDimension: notRead('stringBounder') }),
    getRootGroup: () => 'root',
    leafs: () => Object.keys(CADUTU_LEAVES),
    getChildrenGroups: () => [],
    getLinks: () => Object.keys(CADUTU_LINKS),
    isRemoved: () => false,
    getParentContainer: () => 'root',
    calculateDimension: (id) => new XDimension2D(...cadutuLeaf(id)),
    drawLeaf: (id, ug, corner) => ug.apply(UTranslate.point(corner)).draw(URectangle.build(...cadutuLeaf(id))),
    getEntity1: (id) => cadutuLink(id).from,
    getEntity2: (id) => cadutuLink(id).to,
    getQuantifier1: (id) => (cadutuLink(id).q1 === undefined ? null : 'q'),
    getQuantifier2: (id) => (cadutuLink(id).q2 === undefined ? null : 'q'),
    getRole1: () => null,
    getRole2: () => null,
    getLabel: (id) => block(...cadutuLink(id).label),
    getQuantifier: (id, n) => {
      const dim = quantifier(id, n);
      return dim === undefined ? null : block(...dim);
    },
    getRoleLabel: () => null,
    getType: (id) => cadutuLink(id).type,
  };
}

/** The jar's class rects: `<rect x y width height>` of each entity group (in.svg). */
const CADUTU_LEAF_RECTS = [
  [48.356, 12, 59.212, 48],
  [48.356, 173, 59.212, 48],
  [212.127, 12, 51.425, 48],
  [203.162, 173, 52.212, 48],
  [275.375, 173, 60, 48],
];

/** The jar's edge elements: every `<line>`/`<polygon>` after the last class body (in.svg). */
const CADUTU_EDGE_SHAPES = [
  '<line x1="77.963" y1="60" x2="77.963" y2="173" style="stroke:#181818;stroke-width:1;"/>',
  '<polygon points="77.963,173,81.963,164,77.963,168,73.963,164,77.963,173" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
  '<polygon points="77.963,60,73.963,69,77.963,65,81.963,69,77.963,60" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
  '<line x1="229.269" y1="60" x2="229.269" y2="173" style="stroke:#181818;stroke-width:1;"/>',
  '<polygon points="229.269,173,233.269,164,229.269,168,225.269,164,229.269,173" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
  '<line x1="246.41" y1="60" x2="246.41" y2="85" style="stroke:#181818;stroke-width:1;"/>',
  '<line x1="246.41" y1="85" x2="305.375" y2="85" style="stroke:#181818;stroke-width:1;"/>',
  '<line x1="305.375" y1="85" x2="305.375" y2="173" style="stroke:#181818;stroke-width:1;"/>',
  '<polygon points="305.375,173,309.375,164,305.375,168,301.375,164,305.375,173" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
];

async function drawCadutu(): Promise<string> {
  const adapter = cadutuAdapter();
  const result = makeElkLayout(adapter, await loadElk(), newMyElkDrawing);
  const ug = newGraphic();
  // CucaDiagramFileMakerElk.java:498
  new MyElkDrawing(adapter, result.minMax, result).drawU(ug);
  return ug.getSvgString();
}

describe('MyElkDrawing: cadutu-02-lazu601 through elkjs', () => {
  it("draws every class rect where the jar's sits, before any edge", async () => {
    const svg = await drawCadutu();
    const rects = [...svg.matchAll(/<rect [^>]*?x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g)];
    expect(rects.map((m) => m.slice(1, 5).map(Number))).toEqual(CADUTU_LEAF_RECTS);
    expect(svg.lastIndexOf('<rect ')).toBeLessThan(svg.indexOf('<line '));
  });

  it("draws the jar's edge lines and arrowheads", async () => {
    expect((await drawCadutu()).match(/<(?:line|polygon) [^>]*\/>/g)).toEqual(CADUTU_EDGE_SHAPES);
  });

  it('measures its minMax by drawing the provisional, null-minMax drawing (CucaDiagramFileMakerElk.java:495-496)', async () => {
    const result = makeElkLayout(cadutuAdapter(), await loadElk(), newMyElkDrawing);
    const dim = new MyElkDrawing(cadutuAdapter(), result.minMax, result).calculateDimension(
      newGraphic().getStringBounder(),
    );
    // LimitFinder.java:184-188 over the jar's rects: foo1 (48.356, 12) - 1; bar2 (275.375 + 60, 173 + 48) - 1.
    // The edge legs and arrowheads lie inside; the test label blocks draw nothing.
    const { minMax } = result;
    const r3 = (v: number): number => Math.round(v * 1000) / 1000;
    expect([minMax.getMinX(), minMax.getMinY(), minMax.getMaxX(), minMax.getMaxY()].map(r3)).toEqual([
      47.356, 11, 334.375, 220,
    ]);
    expect([r3(dim.getWidth()), dim.getHeight()]).toEqual([307.019, 229]);
  });
});
