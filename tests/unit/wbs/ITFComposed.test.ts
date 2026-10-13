/**
 * `ITFComposed` (wbs/ITFComposed.java:60-244): a subtree whose main box
 * sits over a vertical trunk, LEFT children stacked down its left side and
 * RIGHT children down its right, each joined by a horizontal link.
 *
 * Every subtree is built by `build2` from a hand-built `WElement` tree (as
 * `WBSDiagram#addIdea` would; T2b, parallel) and drawn at the origin the
 * jar gave it. Expected `<rect x,y,width,height>` / `<line x1,y1,x2,y2>`
 * are the jar's (1.2026.8beta1, `-DPLANTUML_DETERMINISTIC_TEXT=true`):
 * - `test-results/dot-cache/wbs/WBS-monoline-def-0-4/in.svg`: `Line 2`
 *   (LEFT `L21`, RIGHT `L22`) drawn at (116.375, 92) — the root `Fork`
 *   puts it at 20 + `Line 1`'s width 76.375 + `delta1x` 20, y 20 + 32 + 40.
 * - `WBS-monoline-def-0-7`: the same tree with `***[#green] L21`, at the
 *   same origin (`L21`'s rect is filled `#008000`).
 * - `mogume-53-tuxe939` (`node { width auto }`): `Implementation` at
 *   x = 20 + `Planning`'s width + `Fork.delta1x` 20 (Fork.java:123), with
 *   `Planning`'s main forced to `Implementation`'s by the root's auto-width
 *   pass (Fork.java:78-82) — 219.687 as printed; its leaves all 199.325
 *   wide.
 * - `navoxe-03-mala012`: the PSEUDO `**_` over `Child A`/`Child B` at
 *   (20, 92), stacked with `marginBottom` 0.
 * - authored (`scripts/oracle-render.sh`), `node { Margin 25 }`: `* R` /
 *   `** A` / `***< L1` / `***< L2` / `*** R1` / `*** R2`, `A` at (20, 92).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HColor } from '../../../src/core/abel/Colors.js';
import { Direction } from '../../../src/core/abel/Direction.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import { TextBlockMemoized } from '../../../src/core/klimt/shape/TextBlockMemoized.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { Stereotype } from '../../../src/core/stereo/Stereotype.js';
import type { Style } from '../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import type { SkinParam } from '../../../src/diagrams/mindmap/mindmap-skin-param.js';
import type { ITF } from '../../../src/diagrams/wbs/ITF.js';
import { ITFComposed } from '../../../src/diagrams/wbs/ITFComposed.js';
import { ITFLeaf } from '../../../src/diagrams/wbs/ITFLeaf.js';
import { WElement } from '../../../src/diagrams/wbs/WElement.js';
import { parseMindMap, stringBounder, svgGraphic } from '../mindmap/helpers/mindmap-skin.js';

/** One node: depth (the subtree's own node = 1), label, direction, shape, back colour, stereotype. */
interface Row {
  readonly level: number;
  readonly text: string;
  readonly direction?: Direction;
  readonly shape?: IdeaShape;
  readonly backColor?: HColor;
  readonly stereotype?: string;
}

function skinParam(style = ''): SkinParam {
  return parseMindMap(`@startmindmap\n${style}\n* r\n@endmindmap`, Rankdir.LEFT_TO_RIGHT).getSkinParam();
}

/** `rows` attached to the last node one level up under a root `R`; returns the level-1 node. */
function subtree(rows: readonly Row[], style = ''): { skin: SkinParam; idea: WElement } {
  const skin = skinParam(style);
  const styleBuilder = skin.getCurrentStyleBuilder();
  const label = (text: string): Display => Display.getWithNewlines(Pragma.createEmpty(), text);
  const last: WElement[] = [new WElement(undefined, label('R'), undefined, styleBuilder, IdeaShape.BOX)];
  for (const row of rows) {
    const decoration = {
      backColor: row.backColor,
      label: label(row.text),
      stereotype: Stereotype.build(row.stereotype),
      shape: row.shape ?? IdeaShape.BOX,
      styleBuilder,
    };
    last[row.level] = last[row.level - 1]!.createElement(decoration, row.level, row.direction ?? Direction.RIGHT);
  }
  return { skin, idea: last[1]! };
}

function build(rows: readonly Row[], style = ''): { block: ITF; idea: WElement } {
  const { skin, idea } = subtree(rows, style);
  return { block: ITFComposed.build2(skin, idea, skin.atomOps), idea };
}

/** Every `<rect>` as `R x,y,w,h` and `<line>` as `L x1,y1,x2,y2`, in draw order, the block drawn at (x, y). */
function drawn(block: ITF, x: number, y: number, attribute?: string): string[] {
  const ug = svgGraphic();
  block.drawU(ug.apply(new UTranslate(x, y)));
  const out: string[] = [];
  for (const m of ug.getSvgString().matchAll(/<(rect|line)\b([^>]*)\/>/g)) {
    const a: Record<string, string> = {};
    for (const p of m[2]!.matchAll(/(\w+)="([^"]*)"/g)) a[p[1]!] = p[2]!;
    if (attribute !== undefined) out.push(`${m[1]} ${a[attribute]}`);
    else if (m[1] === 'rect') out.push(`R ${a.x},${a.y},${a.width},${a.height}`);
    else out.push(`L ${a.x1},${a.y1},${a.x2},${a.y2}`);
  }
  return out;
}

function svgNumber(n: number): number {
  return Number(n.toFixed(3));
}

/** `Line 2` of `WBS-monoline-def-0-4`. */
const LINE_2: readonly Row[] = [
  { level: 1, text: 'Line 2' },
  { level: 2, text: 'L21', direction: Direction.LEFT },
  { level: 2, text: 'L22' },
];

const WIDTH_AUTO = '<style>\nwbsDiagram {\n  node {\n    width auto\n  }\n}\n</style>';
/** `Implementation` of `mogume-53-tuxe939`. */
const IMPLEMENTATION: readonly Row[] = [
  { level: 1, text: 'Implementation' },
  { level: 2, text: 'Code' },
  { level: 2, text: 'Test' },
  { level: 2, text: 'Deploy to production environment' },
];

/** `Planning` of `mogume-53-tuxe939`. */
const PLANNING: readonly Row[] = [
  { level: 1, text: 'Planning' },
  { level: 2, text: 'Define scope' },
  { level: 2, text: 'Set milestones' },
  { level: 2, text: 'Allocate resources' },
];

describe('ITFComposed.build2 (ITFComposed.java:111-124)', () => {
  it('a leaf is an ITFLeaf, anything else an ITFComposed', () => {
    const { skin, idea } = subtree(LINE_2);
    expect(ITFComposed.build2(skin, idea, skin.atomOps)).toBeInstanceOf(ITFComposed);
    expect(ITFComposed.build2(skin, idea.getChildren(Direction.RIGHT)[0]!, skin.atomOps)).toBeInstanceOf(ITFLeaf);
  });

  it('a leaf is built over idea.withBackColor(skinParam): WBS-monoline-def-0-7 L21 is #008000', () => {
    const green = HColorSet.instance().getColor('green');
    const rows = [LINE_2[0]!, { ...LINE_2[1]!, backColor: green }, LINE_2[2]!];
    const fills = drawn(build(rows).block, 116.375, 92, 'fill').filter((e) => e.startsWith('rect '));
    expect(fills).toEqual(['rect #F1F1F1', 'rect #008000', 'rect #F1F1F1']);
  });
});

describe('ITFComposed.drawU against the jar (ITFComposed.java:179-218)', () => {
  it('WBS-monoline-def-0-4 Line 2: main, the LEFT link and child, the RIGHT link and child, the trunk', () => {
    expect(drawn(build(LINE_2).block, 116.375, 92)).toEqual([
      'R 140.05,92,52.7,32',
      'L 156.4,155,166.4,155',
      'R 116.375,139,40.025,32',
      'L 166.4,155,176.4,155',
      'R 176.4,139,40.025,32',
      'L 166.4,124,166.4,155',
    ]);
  });

  it('node { Margin 25 }: LEFT and RIGHT children each stack by marginBottom 25', () => {
    const rows: readonly Row[] = [
      { level: 1, text: 'A' },
      { level: 2, text: 'L1', direction: Direction.LEFT },
      { level: 2, text: 'L2', direction: Direction.LEFT },
      { level: 2, text: 'R1' },
      { level: 2, text: 'R2' },
    ];
    expect(
      drawn(build(rows, '<style>\nwbsDiagram {\n  node {\n    Margin 25\n  }\n}\n</style>').block, 20, 92),
    ).toEqual([
      'R 49.338,92,28.025,32',
      'L 53.35,165,63.35,165',
      'R 20,149,33.35,32',
      'L 53.35,222,63.35,222',
      'R 20,206,33.35,32',
      'L 63.35,165,73.35,165',
      'R 73.35,149,35.375,32',
      'L 63.35,222,73.35,222',
      'R 73.35,206,35.375,32',
      'L 63.35,124,63.35,222',
    ]);
  });

  it('navoxe-03-mala012: a PSEUDO node draws no box and stacks with marginBottom 0', () => {
    const rows: readonly Row[] = [
      { level: 1, text: '', shape: IdeaShape.PSEUDO },
      { level: 2, text: 'Child A' },
      { level: 2, text: 'Child B' },
    ];
    const { block } = build(rows);
    expect(drawn(block, 20, 92)).toEqual([
      'L 30,108,40,108',
      'R 40,92,58.775,32',
      'L 30,140,40,140',
      'R 40,124,58.775,32',
      'L 30,92,30,140',
    ]);
    expect([svgNumber(block.calculateDimension(stringBounder()).getWidth()), 64]).toEqual([
      78.775,
      block.calculateDimension(stringBounder()).getHeight(),
    ]);
  });

  it('mogume-53-tuxe939 Implementation: Width auto forces every child to the widest main box', () => {
    const sb = stringBounder();
    const implementation = build(IMPLEMENTATION, WIDTH_AUTO).block;
    const planning = build(PLANNING, WIDTH_AUTO).block;
    planning.setForcedMinWidth(implementation.getMainBoxWidth(sb));
    const x = 20 + planning.calculateDimension(sb).getWidth() + 20;
    expect(drawn(implementation, x, 92)).toEqual([
      'R 219.687,92,101.975,32',
      'L 270.675,155,280.675,155',
      'R 280.675,139,199.325,32',
      'L 270.675,202,280.675,202',
      'R 280.675,186,199.325,32',
      'L 270.675,249,280.675,249',
      'R 280.675,233,199.325,32',
      'L 270.675,124,270.675,249',
    ]);
  });

  it('without Width auto the children keep their own widths', () => {
    const rects = drawn(build(IMPLEMENTATION).block, 0, 0).filter((e) => e.startsWith('R '));
    expect(rects.map((r) => svgNumber(Number(r.split(',')[2])))).toEqual([101.975, 48.725, 43.325, 199.325]);
  });

  it("a stereotyped node: getLinkColor reads its signature, drawLine's arrow style still sets the links", () => {
    const rows: readonly Row[] = [{ ...LINE_2[0]!, stereotype: '<<hot>>' }, LINE_2[1]!, LINE_2[2]!];
    expect(drawn(build(rows).block, 116.375, 92)).toEqual(drawn(build(LINE_2).block, 116.375, 92));
  });
});

describe('ITFComposed geometry (ITFComposed.java:126-169)', () => {
  const { block } = build(LINE_2);
  const sb = stringBounder();

  it('calculateDimension: getw1 + the RIGHT half, main height + the taller stacked column', () => {
    const d = block.calculateDimension(sb);
    expect([svgNumber(d.getWidth()), d.getHeight()]).toEqual([100.05, 79]);
  });

  it.each([
    ['T1: (getw1, 0)', () => block.getT1(sb), [50.025, 0]],
    ['T2: (getw1, main height)', () => block.getT2(sb), [50.025, 32]],
    ['F1: (getw1 - main width / 2, main height / 2)', () => block.getF1(sb), [23.675, 16]],
    ['F2: (getw1 + main width / 2, main height / 2)', () => block.getF2(sb), [76.375, 16]],
  ] as const)('%s', (_what, anchor, expected) => {
    const p = anchor();
    expect([svgNumber(p.getX()), p.getY()]).toEqual(expected);
  });

  it('getw1 is half the main width when the LEFT column is narrower', () => {
    const { block: wide } = build([
      { level: 1, text: 'A rather long subtree label' },
      { level: 2, text: 'x', direction: Direction.LEFT },
    ]);
    const main = wide.getMainBoxWidth(sb);
    expect(wide.getT1(sb).getX()).toBe(main / 2);
  });
});

describe('ITFComposed main box width (ITFComposed.java:80-89)', () => {
  it('getMainBoxWidth is the main box, not the subtree', () => {
    expect(svgNumber(build(LINE_2).block.getMainBoxWidth(stringBounder()))).toBe(52.7);
  });

  it('setForcedMinWidth widens an FtileBoxOld main', () => {
    const { block } = build(LINE_2);
    block.setForcedMinWidth(80);
    expect(block.getMainBoxWidth(stringBounder())).toBe(80);
  });

  it('setForcedMinWidth leaves a boxless (NONE) main alone', () => {
    const { block } = build([{ ...LINE_2[0]!, shape: IdeaShape.NONE }, LINE_2[1]!, LINE_2[2]!]);
    const before = block.getMainBoxWidth(stringBounder());
    block.setForcedMinWidth(200);
    expect(block.getMainBoxWidth(stringBounder())).toBe(before);
  });
});

describe('ITFComposed.applyAutoWidth (ITFComposed.java:93-109)', () => {
  type Invalidate = { invalidateDimensionCache(): void };

  function invalidations(style: string, first: 'measure' | 'draw'): number {
    const spy = vi.spyOn(TextBlockMemoized.prototype as unknown as Invalidate, 'invalidateDimensionCache');
    try {
      const { block } = build(IMPLEMENTATION, style);
      if (first === 'measure') block.calculateDimension(stringBounder());
      drawn(block, 0, 0);
      block.calculateDimension(stringBounder());
      return spy.mock.contexts.filter((c) => c === block).length;
    } finally {
      spy.mockRestore();
    }
  }

  it('Width auto: invalidated once, whichever of measure and draw runs first', () => {
    expect([invalidations(WIDTH_AUTO, 'measure'), invalidations(WIDTH_AUTO, 'draw')]).toEqual([1, 1]);
  });

  it('no Width auto: never invalidated', () => {
    expect(invalidations('', 'measure')).toBe(0);
  });

  it('measured first, the dimension already carries the forced widths', () => {
    const d = build(IMPLEMENTATION, WIDTH_AUTO).block.calculateDimension(stringBounder());
    // 480 (the right edge of the 199.325 leaves) - 219.6875; float32 text widths print 260.312.
    expect(d.getWidth()).toBeCloseTo(260.3125, 3);
    expect(d.getHeight()).toBe(173);
  });
});

describe('ITFComposed.drawU records the geometry (ITFComposed.java:186-189)', () => {
  it('an AbstractCommonUGraphic: setGeometry(its translate, the main dimension)', () => {
    const { block, idea } = build(LINE_2);
    drawn(block, 116.375, 92);
    expect([idea.getPosition()!.getDx(), idea.getPosition()!.getDy()]).toEqual([116.375, 92]);
    expect([svgNumber(idea.getDimension()!.getWidth()), idea.getDimension()!.getHeight()]).toEqual([52.7, 32]);
  });

  it('any other UGraphic: no geometry is recorded', () => {
    const { block, idea } = build([
      { level: 1, text: '', shape: IdeaShape.PSEUDO },
      { level: 2, text: '', shape: IdeaShape.PSEUDO },
    ]);
    const bounder = stringBounder();
    const shapes: unknown[] = [];
    const ug: UGraphic = {
      apply: () => ug,
      draw: (shape) => shapes.push(shape),
      getParam: () => {
        throw new Error('unreached');
      },
      getTranslate: () => new UTranslate(0, 0),
      getStringBounder: () => bounder,
    };
    block.drawU(ug);
    expect(idea.getPosition()).toBeUndefined();
    expect(shapes).toHaveLength(2);
  });
});

/**
 * The two Java runtime failures of `getLinkColor` (java:220-224): no style
 * from the builder (Java dereferences `null`, an NPE) and a colour the
 * `ug.apply(HColor)` foreground cannot carry. Neither is reachable from a
 * parsed style, so the merged style is stubbed.
 */
describe('ITFComposed.getLinkColor failures (ITFComposed.java:220-224)', () => {
  const PSEUDO_TREE: readonly Row[] = [
    { level: 1, text: '', shape: IdeaShape.PSEUDO },
    { level: 2, text: '', shape: IdeaShape.PSEUDO },
  ];

  function drawWithLinkStyle(style: Style | undefined): () => void {
    const { block } = build(PSEUDO_TREE);
    vi.spyOn(StyleSignatureBasic.prototype, 'getMergedStyle').mockReturnValue(style);
    return () => drawn(block, 0, 0);
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no merged style: throws where Java NPEs', () => {
    expect(drawWithLinkStyle(undefined)).toThrow('NullPointerException: no wbs link style in the StyleBuilder');
  });

  it('a LineColor that is neither HColorSimple nor HColorGradient: throws ClassCastException', () => {
    const opaque = { withDark: () => opaque, toString: () => 'opaque' };
    const style = { value: () => ({ asColor: () => opaque }) } as unknown as Style;
    expect(drawWithLinkStyle(style)).toThrow('ClassCastException: link colour is not an HColorSimple');
  });
});
