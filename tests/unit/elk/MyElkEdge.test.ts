/**
 * MyElkEdge (cdd8 T2d), checked against `MyElkEdge.java` line by line, and
 * end to end on cadutu-02-lazu601: the jar's ELK edges are straight `<line>`
 * segments plus arrowhead polygons (test-results/dot-cache/class/cadutu-02-lazu601/in.svg).
 */
import { describe, expect, it } from 'vitest';

import { ColorType } from '../../../src/core/abel/ColorType.js';
import { LinkDecor } from '../../../src/core/decoration/LinkDecor.js';
import { LinkMiddleDecor } from '../../../src/core/decoration/LinkMiddleDecor.js';
import { LinkStyle } from '../../../src/core/decoration/LinkStyle.js';
import { LinkType } from '../../../src/core/decoration/LinkType.js';
import { getPosition, makeElkLayout } from '../../../src/core/elk/CucaDiagramFileMakerElk.js';
import type { ElkColors, ElkDiagramAdapter } from '../../../src/core/elk/ElkDiagramAdapter.js';
import { loadElk } from '../../../src/core/elk/load-elk.js';
import {
  getRoleLabelPosition,
  MyElkEdge,
  type MyElkEdgeArgs,
  type MyElkEdgeCluster,
  type MyElkNodeImage,
} from '../../../src/core/elk/MyElkEdge.js';
import type { ElkEdge } from '../../../src/core/elk/proxy/graph/ElkEdge.js';
import type { ElkEdgeSection } from '../../../src/core/elk/proxy/graph/ElkEdgeSection.js';
import type { ElkLabel } from '../../../src/core/elk/proxy/graph/ElkLabel.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import type { MagneticBorder } from '../../../src/core/klimt/geom/MagneticBorder.js';
import { MagneticBorderNone } from '../../../src/core/klimt/geom/MagneticBorderNone.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../../src/core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import type { Paint } from '../../../src/core/paint.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LINE_COLOR = '#181818';
const LINK = 'lnk1';
const ENTITY1 = 'a';
const ENTITY2 = 'b';
const ARROW_ONLY = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
const NO_DECOR = new LinkType(LinkDecor.NONE, LinkDecor.NONE);

type Pt = readonly [x: number, y: number];

function section(start: Pt, bends: readonly Pt[], end: Pt): ElkEdgeSection {
  return {
    getStartX: () => start[0],
    getStartY: () => start[1],
    getEndX: () => end[0],
    getEndY: () => end[1],
    getBendPoints: () => bends.map(([x, y]) => ({ getX: () => x, getY: () => y })),
  };
}

function label(text: string, [x, y]: Pt): ElkLabel {
  return {
    setProperty: () => undefined,
    setText: () => undefined,
    setDimensions: () => undefined,
    getText: () => text,
    getX: () => x,
    getY: () => y,
  };
}

function edge(sections: readonly ElkEdgeSection[], labels: readonly ElkLabel[] = []): ElkEdge {
  return {
    setProperty: () => undefined,
    getContainingNode: () => {
      throw new Error('MyElkEdge does not read getContainingNode (MyElkDrawing.java:189 does)');
    },
    getLabels: () => labels,
    getSections: () => sections,
    // proxy/graph/ElkEdge.java:38-40
    isHierarchical: () => {
      throw new Error('UnsupportedOperationException');
    },
  };
}

interface LinkFacts {
  readonly type?: LinkType;
  readonly hidden?: boolean;
  readonly styleStroke?: UStroke | null;
  readonly arrowThickness?: UStroke | null;
  readonly colors?: ElkColors | null;
  readonly specificColor?: Paint | null;
}

function notRead(member: string): () => never {
  return () => {
    throw new Error(`${member} is not read by MyElkEdge`);
  };
}

/** The adapter members MyElkEdge reads; every other member throws. */
function linkAdapter(facts: LinkFacts = {}): ElkDiagramAdapter {
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
    getUSymbol: notRead('getUSymbol'),
    getPackageStyle: notRead('getPackageStyle'),
    getEntityColors: notRead('getEntityColors'),
    calculateDimension: notRead('calculateDimension'),
    drawLeaf: notRead('drawLeaf'),
    getMagneticBorder: notRead('getMagneticBorder'),
    getClusterHeader: notRead('getClusterHeader'),
    getClusterStyle: notRead('getClusterStyle'),
    getClusterStyleForMagneticBorder: notRead('getClusterStyleForMagneticBorder'),
    getClusterBackColor: notRead('getClusterBackColor'),
    packageStyle: notRead('packageStyle'),
    getPackageTitleAlignment: notRead('getPackageTitleAlignment'),
    getStereotypeAlignment: notRead('getStereotypeAlignment'),
    getQuantifier1: notRead('getQuantifier1'),
    getQuantifier2: notRead('getQuantifier2'),
    getRole1: notRead('getRole1'),
    getRole2: notRead('getRole2'),
    getLabel: notRead('getLabel'),
    getQuantifier: notRead('getQuantifier'),
    getRoleLabel: notRead('getRoleLabel'),
    isInvis: notRead('isInvis'),
  };
  return {
    ...throwing,
    getEntity1: () => ENTITY1,
    getEntity2: () => ENTITY2,
    isHidden: () => facts.hidden ?? false,
    getType: () => facts.type ?? NO_DECOR,
    getArrowStyle: () => ({
      lineColor: LINE_COLOR,
      stroke: facts.styleStroke === undefined ? UStroke.simple() : facts.styleStroke,
    }),
    getArrowThickness: () => (facts.arrowThickness === undefined ? null : facts.arrowThickness),
    getLinkColors: () => facts.colors ?? null,
    getSpecificColor: () => facts.specificColor ?? null,
  };
}

function block(width: number, height: number, sink?: Pt[]): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(width, height),
    drawU: (ug: UGraphic) => {
      sink?.push([ug.getTranslate().getDx(), ug.getTranslate().getDy()]);
    },
  };
}

const NO_LABEL = block(0, 0);

/** A border that records the positions it is asked about and pushes by `force`. */
function recordingBorder(force: Pt, asked: Pt[]): MagneticBorder {
  return {
    getForceAt: (position) => {
      asked.push([position.x, position.y]);
      return new UTranslate(force[0], force[1]);
    },
  };
}

function nodeImage(border: MagneticBorder): MyElkNodeImage {
  return { getMagneticBorder: () => border };
}

function cluster(border: MagneticBorder, bounders: StringBounder[] = []): MyElkEdgeCluster {
  return {
    getMagneticBorder: (stringBounder) => {
      bounders.push(stringBounder);
      return border;
    },
  };
}

function args(overrides: Partial<MyElkEdgeArgs> = {}): MyElkEdgeArgs {
  return {
    centerLabel: NO_LABEL,
    tailLabel: null,
    headLabel: null,
    tailRole: null,
    headRole: null,
    magicY2: 0,
    elkClusters: new Map(),
    translate: UTranslate.none(),
    nodeImages: new Map(),
    ...overrides,
  };
}

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', { calculateDimension: () => ({ width: 0 }) });
}

function render(myElkEdge: MyElkEdge): string {
  const ug = newGraphic();
  myElkEdge.drawU(ug);
  return ug.getSvgString();
}

/** Every `<line>` and `<polygon>` element, in drawing order. */
function shapes(svg: string): string[] {
  return svg.match(/<(?:line|polygon) [^>]*\/>/g) ?? [];
}

function lines(svg: string): number[][] {
  return [...svg.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/g)].map((m) =>
    m.slice(1, 5).map(Number),
  );
}

// ---------------------------------------------------------------------------
// drawSections (MyElkEdge.java:319-352)
// ---------------------------------------------------------------------------

describe('MyElkEdge.drawSections', () => {
  it('draws one ULine per leg, the first and last pulled by the end borders (:319-347)', () => {
    const asked1: Pt[] = [];
    const asked2: Pt[] = [];
    const nodeImages = new Map([
      [ENTITY1, nodeImage(recordingBorder([1, -2], asked1))],
      [ENTITY2, nodeImage(recordingBorder([3, 4], asked2))],
    ]);
    const sections = [
      section(
        [10, 20],
        [
          [10, 50],
          [80, 50],
        ],
        [80, 90],
      ),
    ];
    const svg = render(
      new MyElkEdge(
        linkAdapter(),
        'classDiagram',
        LINK,
        edge(sections),
        args({ magicY2: 2, translate: new UTranslate(5, 7), nodeImages }),
      ),
    );

    // translate (5, 7) on every leg; start (10+1, 20-2); end (80+3, 90+2+4)
    expect(lines(svg)).toEqual([
      [16, 25, 15, 57],
      [15, 57, 85, 57],
      [85, 57, 88, 103],
    ]);
    // the borders are asked at translate.getTranslated(point) (:328-329, :341-342)
    expect(asked1).toEqual([[15, 27]]);
    expect(asked2).toEqual([[85, 99]]);
  });

  it('draws a section without bend points as one line', () => {
    const svg = render(
      new MyElkEdge(linkAdapter(), 'classDiagram', LINK, edge([section([0, 0], [], [0, 40])]), args()),
    );
    expect(lines(svg)).toEqual([[0, 0, 0, 40]]);
  });

  it('applies the link stroke and colour to the legs (:198)', () => {
    const svg = render(
      new MyElkEdge(linkAdapter(), 'classDiagram', LINK, edge([section([0, 0], [], [0, 40])]), args()),
    );
    expect(shapes(svg)).toEqual(['<line x1="0" y1="0" x2="0" y2="40" style="stroke:#181818;stroke-width:1;"/>']);
  });

  it('throws like the jar when the edge has no section (:201-204, proxy ElkEdge.java:38-40)', () => {
    const myElkEdge = new MyElkEdge(linkAdapter(), 'classDiagram', LINK, edge([]), args());
    expect(() => myElkEdge.drawU(newGraphic())).toThrow('UnsupportedOperationException');
  });

  it('draws nothing for a hidden link (:150-151)', () => {
    const svg = render(
      new MyElkEdge(linkAdapter({ hidden: true }), 'classDiagram', LINK, edge([section([0, 0], [], [0, 40])]), args()),
    );
    expect(shapes(svg)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// MagneticBorder selection (MyElkEdge.java:182-196)
// ---------------------------------------------------------------------------

describe('MyElkEdge magnetic borders', () => {
  const VERTICAL = [section([0, 0], [], [0, 40])];

  it('prefers the node image over the cluster for entity 1, and the cluster for entity 2 (:188-196)', () => {
    const nodeAsked: Pt[] = [];
    const clusterAsked: Pt[] = [];
    const ignored: Pt[] = [];
    const bounders: StringBounder[] = [];
    const myElkEdge = new MyElkEdge(
      linkAdapter(),
      'classDiagram',
      LINK,
      edge(VERTICAL),
      args({
        nodeImages: new Map([
          [ENTITY1, nodeImage(recordingBorder([0, 1], nodeAsked))],
          [ENTITY2, nodeImage(recordingBorder([0, 0], ignored))],
        ]),
        elkClusters: new Map([
          [ENTITY1, cluster(recordingBorder([0, 0], ignored))],
          [ENTITY2, cluster(recordingBorder([0, -1], clusterAsked), bounders)],
        ]),
      }),
    );
    const ug = newGraphic();
    myElkEdge.drawU(ug);

    expect(lines(ug.getSvgString())).toEqual([[0, 1, 0, 39]]);
    expect(nodeAsked).toEqual([[0, 0]]);
    expect(clusterAsked).toEqual([[0, 40]]);
    expect(ignored).toEqual([]);
    expect(bounders).toHaveLength(1);
  });

  it('falls back to the cluster for entity 1 and to MagneticBorderNone without either', () => {
    const asked: Pt[] = [];
    const svg = render(
      new MyElkEdge(
        linkAdapter(),
        'classDiagram',
        LINK,
        edge(VERTICAL),
        args({ elkClusters: new Map([[ENTITY1, cluster(recordingBorder([2, 0], asked))]]) }),
      ),
    );
    expect(lines(svg)).toEqual([[2, 0, 0, 40]]);
    expect(asked).toEqual([[0, 0]]);
  });
});

// ---------------------------------------------------------------------------
// Colour and stroke (MyElkEdge.java:159-180)
// ---------------------------------------------------------------------------

function colors(color: Paint | null, lineStroke: UStroke | null): ElkColors {
  return {
    getColor: (key1, key2) => (key1 === ColorType.ARROW && key2 === ColorType.LINE ? color : null),
    getSpecificLineStroke: () => lineStroke,
  };
}

function firstLine(facts: LinkFacts): string {
  const svg = render(
    new MyElkEdge(linkAdapter(facts), 'classDiagram', LINK, edge([section([0, 0], [], [0, 9])]), args()),
  );
  return shapes(svg)[0] ?? '';
}

describe('MyElkEdge colour and stroke', () => {
  it("takes the link's ARROW/LINE colour over the style (:161-164)", () => {
    expect(firstLine({ colors: colors('#FF0000', null), specificColor: '#00FF00' })).toContain('stroke:#F00;');
  });

  it('keeps the style colour when the link colours have none, ignoring the specific colour (:161-166)', () => {
    expect(firstLine({ colors: colors(null, null), specificColor: '#00FF00' })).toContain('stroke:#181818;');
  });

  it('uses the specific colour when the link has no colours (:165-166)', () => {
    expect(firstLine({ specificColor: '#00FF00' })).toContain('stroke:#0F0;');
  });

  it('thickens a normal link by the style stroke (:177)', () => {
    expect(firstLine({ styleStroke: UStroke.withThickness(3) })).toContain('stroke-width:3;');
  });

  it('uses the arrow thickness when the style has no stroke (:174-175)', () => {
    expect(firstLine({ styleStroke: null, arrowThickness: UStroke.withThickness(4) })).toContain('stroke-width:4;');
  });

  it('uses the arrow thickness for a non-normal link (:174-175)', () => {
    const dashed = new LinkType(LinkDecor.NONE, LinkDecor.NONE, LinkMiddleDecor.NONE, LinkStyle.DASHED());
    expect(firstLine({ type: dashed, styleStroke: UStroke.withThickness(3), arrowThickness: null })).toContain(
      'stroke-dasharray:7,7;',
    );
  });

  it("takes the link's specific line stroke last (:179-180)", () => {
    expect(firstLine({ colors: colors(null, UStroke.withThickness(6)) })).toContain('stroke-width:6;');
  });
});

// ---------------------------------------------------------------------------
// Extremities (MyElkEdge.java:209-239)
// ---------------------------------------------------------------------------

describe('MyElkEdge extremities', () => {
  it('draws decor1 at the section end and decor2 at its start, with onlyThickness (:209-224)', () => {
    const dashed = new LinkType(LinkDecor.ARROW, LinkDecor.ARROW, LinkMiddleDecor.NONE, LinkStyle.DASHED());
    const svg = render(
      new MyElkEdge(
        linkAdapter({ type: dashed }),
        'classDiagram',
        LINK,
        edge([section([10, 0], [], [10, 50])]),
        args(),
      ),
    );
    const [line, head, tail] = shapes(svg);
    expect(line).toContain('stroke-dasharray:7,7;');
    // ExtremityArrow at angle PI/2 (end) and -PI/2 (start): tip on the point
    expect(head).toBe(
      '<polygon points="10,50,14,41,10,45,6,41,10,50" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
    );
    expect(tail).toBe(
      '<polygon points="10,0,6,9,10,5,14,9,10,0" fill="#181818" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
    );
  });

  it('pushes an extremity by the far border, asked at the untranslated point (:213-216)', () => {
    const asked: Pt[] = [];
    const svg = render(
      new MyElkEdge(
        linkAdapter({ type: ARROW_ONLY }),
        'classDiagram',
        LINK,
        edge([section([10, 0], [], [10, 50])]),
        args({
          translate: new UTranslate(100, 0),
          nodeImages: new Map([[ENTITY2, nodeImage(recordingBorder([0, -3], asked))]]),
        }),
      ),
    );
    // asked once by drawSections (translated), once by the extremity (not)
    expect(asked).toEqual([
      [110, 50],
      [10, 50],
    ]);
    expect(shapes(svg)[1]).toContain('points="110,47,114,38,110,42,106,38,110,47"');
  });

  it('draws no extremity for LinkDecor.NONE (:234-236)', () => {
    const svg = render(
      new MyElkEdge(linkAdapter({ type: NO_DECOR }), 'classDiagram', LINK, edge([section([0, 0], [], [0, 9])]), args()),
    );
    expect(shapes(svg)).toHaveLength(1);
  });

  it('builds EXTENDS through ExtremityFactoryExtends, which this port lacks (:231-232)', () => {
    const extendsType = new LinkType(LinkDecor.EXTENDS, LinkDecor.NONE);
    const myElkEdge = new MyElkEdge(
      linkAdapter({ type: extendsType }),
      'classDiagram',
      LINK,
      edge([section([0, 0], [], [0, 9])]),
      args(),
    );
    expect(() => myElkEdge.drawU(newGraphic())).toThrow('ExtremityFactoryExtends');
  });
});

// ---------------------------------------------------------------------------
// Labels (MyElkEdge.java:241-317)
// ---------------------------------------------------------------------------

describe('MyElkEdge labels', () => {
  it('draws each label kind at translate + its ELK position, skipping unknown kinds (:244-262)', () => {
    const center: Pt[] = [];
    const tail: Pt[] = [];
    const head: Pt[] = [];
    const labels = [label('X', [30, 40]), label('C', [1, 1]), label('1', [12, 5]), label('2', [14, 80])];
    render(
      new MyElkEdge(
        linkAdapter(),
        'classDiagram',
        LINK,
        edge([section([10, 0], [], [10, 90])], labels),
        args({
          translate: new UTranslate(100, 200),
          centerLabel: block(20, 10, center),
          tailLabel: block(7, 13, tail),
          headLabel: block(5, 13, head),
        }),
      ),
    );
    expect(center).toEqual([[130, 240]]);
    expect(tail).toEqual([[112, 205]]);
    expect(head).toEqual([[114, 280]]);
  });

  it('draws the roles beside their quantifiers (:264-276)', () => {
    const tailRole: Pt[] = [];
    const headRole: Pt[] = [];
    render(
      new MyElkEdge(
        linkAdapter(),
        'classDiagram',
        LINK,
        edge([section([10, 0], [], [10, 90])], [label('1', [12, 5]), label('2', [-20, 70])]),
        args({
          tailLabel: block(7, 13),
          headLabel: block(5, 13),
          tailRole: block(30, 13, tailRole),
          headRole: block(40, 13, headRole),
        }),
      ),
    );
    // vertical line at x=10; tail quantifier centre 15.5 >= 10 -> left: 10 - 30 - 2
    expect(tailRole).toEqual([[-22, 5]]);
    // head quantifier centre -17.5 < 10 -> right: 10 + 2
    expect(headRole).toEqual([[12, 70]]);
  });

  it('draws no role without its quantifier label position (:271-275)', () => {
    const role: Pt[] = [];
    render(
      new MyElkEdge(
        linkAdapter(),
        'classDiagram',
        LINK,
        edge([section([0, 0], [], [0, 9])], [label('X', [0, 0])]),
        args({ tailLabel: block(1, 1), tailRole: block(1, 1, role), headRole: block(1, 1, role) }),
      ),
    );
    expect(role).toEqual([]);
  });

  it('fails like the jar (NullPointerException) when a "1" label has no tail block', () => {
    const myElkEdge = new MyElkEdge(
      linkAdapter(),
      'classDiagram',
      LINK,
      edge([section([0, 0], [], [0, 9])], [label('1', [0, 0])]),
      args(),
    );
    expect(() => myElkEdge.drawU(newGraphic())).toThrow('NullPointerException');
  });
});

describe('getRoleLabelPosition (MyElkEdge.java:281-316)', () => {
  const Q = new XDimension2D(10, 13);
  const R = new XDimension2D(30, 13);

  it('stacks the role under the quantifier when the ends coincide (:288-291)', () => {
    const p = getRoleLabelPosition(Q, R, new XPoint2D(4, 5), new XPoint2D(1, 1), new XPoint2D(1.0004, 1.0005));
    expect([p.x, p.y]).toEqual([4, 18]);
  });

  it('puts the role right of a vertical line when the quantifier is left of it (:301-302)', () => {
    const p = getRoleLabelPosition(Q, R, new XPoint2D(-20, 5), new XPoint2D(0, 0), new XPoint2D(3, 50));
    expect([p.x, p.y]).toEqual([2, 5]);
  });

  it('puts the role left of a vertical line otherwise (:303-305)', () => {
    const p = getRoleLabelPosition(Q, R, new XPoint2D(-5, 5), new XPoint2D(0, 0), new XPoint2D(0, 50));
    expect([p.x, p.y]).toEqual([-32, 5]);
  });

  it('puts the role below a horizontal line when the quantifier is above it (:309-310)', () => {
    const p = getRoleLabelPosition(Q, R, new XPoint2D(4, -20), new XPoint2D(0, 0), new XPoint2D(50, 3));
    expect([p.x, p.y]).toEqual([4, 2]);
  });

  it('puts the role above a horizontal line otherwise (:311-313)', () => {
    const p = getRoleLabelPosition(Q, R, new XPoint2D(4, -6), new XPoint2D(0, 0), new XPoint2D(-50, 0));
    expect([p.x, p.y]).toEqual([4, -15]);
  });
});

// ---------------------------------------------------------------------------
// cadutu-02-lazu601 end to end: elkjs layout -> MyElkEdge -> SVG
// ---------------------------------------------------------------------------

/**
 * The jar's full-precision text widths for cadutu (`plans/class-divergence-drive-8/spike/text-widths.json`,
 * `StringBounderFromWidthTable.java:67-80`). The SVG's 3 dp `textLength`s are not
 * enough here: foo's second port sits at `x + 2w/3`, and 51.425 for
 * 51.424999237060547 moves it from 246.41 to 246.411.
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

const CADUTU_LEAVES: Readonly<Record<string, Pt>> = Object.fromEntries(
  Object.entries(WIDTH_14).map(([id, w]) => [id, [w + CLASS_HEADER_EXTRA, CLASS_HEIGHT]]),
);

interface CadutuLink {
  readonly from: string;
  readonly to: string;
  readonly type: LinkType;
  readonly label: Pt;
  readonly q1?: Pt;
  readonly q2?: Pt;
}

/** `StringBounderFromWidthTable.java:71`: a 13 pt line is 13 high; the centre label carries two `withMargin(1, 1)`. */
const LINE_HEIGHT_13 = 13;
const centreLabel = (widths: readonly number[]): Pt => [Math.max(...widths) + 4, widths.length * LINE_HEIGHT_13 + 4];

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

function cadutuAdapter(): ElkDiagramAdapter {
  const leafDim = (id: string): Pt => CADUTU_LEAVES[id] ?? [0, 0];
  const quantifier = (id: string, n: 1 | 2): Pt | undefined => (n === 1 ? cadutuLink(id).q1 : cadutuLink(id).q2);
  return {
    ...linkAdapter(),
    getDefaultStringBounder: () => ({ calculateDimension: notRead('stringBounder') }),
    getRootGroup: () => 'root',
    leafs: () => Object.keys(CADUTU_LEAVES),
    getChildrenGroups: () => [],
    getLinks: () => Object.keys(CADUTU_LINKS),
    isRemoved: () => false,
    getParentContainer: () => 'root',
    calculateDimension: (id) => new XDimension2D(...leafDim(id)),
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

/**
 * Where each label block lands, as in.svg's 13 pt `<text>` places it: every
 * 13 pt baseline in in.svg is 10.111 below its block top, and the centre
 * label's two `withMargin(1, 1)` add 2 on both axes. E.g. "short label" is
 * drawn at (14, 120.111), so its block is at (12, 108).
 */
const CADUTU_LABEL_TRANSLATES: Readonly<Record<string, Pt>> = {
  'lnk3 centre': [12, 108],
  'lnk6 centre': [88.963, 95],
  'lnk6 tail': [232.269, 62],
  'lnk6 head': [232.269, 158],
  'lnk8 centre': [271.831, 108],
  'lnk8 tail': [249.41, 62],
  'lnk8 head': [308.375, 158],
};

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

function recordAs(tb: TextBlock | null, name: string, sink: Map<string, Pt>): TextBlock | null {
  if (tb === null) return null;
  return {
    calculateDimension: (sb) => tb.calculateDimension(sb),
    drawU: (ug) => {
      sink.set(name, [round3(ug.getTranslate().getDx()), round3(ug.getTranslate().getDy())]);
    },
  };
}

/** elkjs layout of cadutu, then every edge through MyElkEdge as `MyElkDrawing.java:178-206` builds it. */
async function drawCadutu(labels: Map<string, Pt>): Promise<string> {
  const adapter = cadutuAdapter();
  const sb = adapter.getDefaultStringBounder();
  const result = makeElkLayout(adapter, await loadElk(), () => ({ drawU: () => undefined }));
  const nodeImages = new Map([...result.nodes.keys()].map((id) => [id, nodeImage(new MagneticBorderNone())]));
  const ug = newGraphic();
  for (const [linkId, elkEdge] of result.edges) {
    const centerLabel = recordAs(adapter.getLabel(linkId, sb), `${linkId} centre`, labels);
    new MyElkEdge(
      adapter,
      'classDiagram',
      linkId,
      elkEdge,
      args({
        centerLabel: centerLabel ?? NO_LABEL,
        tailLabel: recordAs(adapter.getQuantifier(linkId, 1, sb), `${linkId} tail`, labels),
        headLabel: recordAs(adapter.getQuantifier(linkId, 2, sb), `${linkId} head`, labels),
        // MyElkDrawing.java:189, :203
        translate: UTranslate.point(getPosition(elkEdge.getContainingNode())),
        nodeImages,
      }),
    ).drawU(ug);
  }
  return ug.getSvgString();
}

describe('MyElkEdge: cadutu-02-lazu601 through elkjs', () => {
  it("draws the jar's edge lines and arrowheads", async () => {
    expect(shapes(await drawCadutu(new Map()))).toEqual(CADUTU_EDGE_SHAPES);
  });

  it("places every label block where the jar's text sits", async () => {
    const labels = new Map<string, Pt>();
    await drawCadutu(labels);
    expect(Object.fromEntries(labels)).toEqual(CADUTU_LABEL_TRANSLATES);
  });
});
