/**
 * `Fork` (wbs/Fork.java:52-157): the root row of a WBS — the root box, the
 * vertical stubs and the horizontal bar over its RIGHT children, each
 * child an `ITFComposed.build2` subtree.
 *
 * Every expected `<rect x,y,width,height>` / `<line x1,y1,x2,y2>` below is
 * the jar's (1.2026.8beta1, `-DPLANTUML_DETERMINISTIC_TEXT=true`), in the
 * jar's draw order:
 * - `test-results/dot-cache/wbs/<slug>/in.svg` for `WBS-monoline-def-0-4`
 *   (two children, grandchildren LEFT and RIGHT), `WBS-direction-0` (one
 *   child: the `lastX == firstX` branch), `mogume-53-tuxe939` (`node {
 *   width auto }`), `navoxe-03-mala012` (two PSEUDO `**_` nodes).
 * - authored probes (`scripts/oracle-render.sh`): {@link ALONE} and
 *   {@link MARGIN}.
 *
 * The jar draws the tree at (20, 20) (the document margin), so the block is
 * drawn under `UTranslate(20, 20)`. The tree is hand-built from `WElement`
 * as `WBSDiagram#addIdea` would (T2b, parallel); the style builder is a
 * mindmap parse's, which carries the default skin's `wbsDiagram` block plus
 * the source's `<style>` (wep-T1b note).
 */
import { describe, expect, it, vi } from 'vitest';
import { Direction } from '../../../src/core/abel/Direction.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import { TextBlockMemoized } from '../../../src/core/klimt/shape/TextBlockMemoized.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import type { SkinParam } from '../../../src/diagrams/mindmap/mindmap-skin-param.js';
import { Fork } from '../../../src/diagrams/wbs/Fork.js';
import { WElement } from '../../../src/diagrams/wbs/WElement.js';
import { parseMindMap, stringBounder, svgGraphic } from '../mindmap/helpers/mindmap-skin.js';

/** The document margin the jar draws the tree under. */
const DOCUMENT_MARGIN = 20;

/** One node below the root: depth (root = 0), label, direction, shape. */
type Row = readonly [level: number, label: string, direction?: Direction, shape?: IdeaShape];

interface Tree {
  readonly skin: SkinParam;
  readonly root: WElement;
}

function skinParam(style = ''): SkinParam {
  return parseMindMap(`@startmindmap\n${style}\n* r\n@endmindmap`, Rankdir.LEFT_TO_RIGHT).getSkinParam();
}

/** `rows` attached to the last node one level up, as `WBSDiagram#addIdea`. */
function tree(rootLabel: string, rows: readonly Row[], style = ''): Tree {
  const skin = skinParam(style);
  const styleBuilder = skin.getCurrentStyleBuilder();
  const label = (text: string): Display => Display.getWithNewlines(Pragma.createEmpty(), text);
  const root = new WElement(undefined, label(rootLabel), undefined, styleBuilder, IdeaShape.BOX);
  const last: WElement[] = [root];
  for (const [level, text, direction = Direction.RIGHT, shape = IdeaShape.BOX] of rows) {
    const decoration = { backColor: undefined, label: label(text), stereotype: undefined, shape, styleBuilder };
    last[level] = last[level - 1]!.createElement(decoration, level, direction);
  }
  return { skin, root };
}

function fork(t: Tree): Fork {
  return new Fork(t.skin, t.root, t.skin.atomOps);
}

/** Every `<rect>` as `R x,y,w,h` and `<line>` as `L x1,y1,x2,y2`, in draw order. */
function drawn(block: Fork): string[] {
  const ug = svgGraphic();
  block.drawU(ug.apply(new UTranslate(DOCUMENT_MARGIN, DOCUMENT_MARGIN)));
  const out: string[] = [];
  for (const m of ug.getSvgString().matchAll(/<(rect|line)\b([^>]*)\/>/g)) {
    const a: Record<string, string> = {};
    for (const p of m[2]!.matchAll(/(\w+)="([^"]*)"/g)) a[p[1]!] = p[2]!;
    if (m[1] === 'rect') out.push(`R ${a.x},${a.y},${a.width},${a.height}`);
    else out.push(`L ${a.x1},${a.y1},${a.x2},${a.y2}`);
  }
  return out;
}

function dim(block: Fork): [number, number] {
  const d = block.calculateDimension(stringBounder());
  return [Number(d.getWidth().toFixed(3)), Number(d.getHeight().toFixed(3))];
}

/** `WBS-monoline-def-0-4`. */
const MONOLINE_4: readonly Row[] = [
  [1, 'Line 1'],
  [2, 'L11'],
  [1, 'Line 2'],
  [2, 'L21', Direction.LEFT],
  [2, 'L22'],
];

/** `WBS-direction-0`: one child, grandchildren and great-grandchildren LEFT and RIGHT. */
const DIRECTION_0: readonly Row[] = [
  [1, 'Line 1A\\nLine 1B'],
  [2, 'Right R2A\\nRight R2B'],
  [3, 'Right R3A\\nRight R3B'],
  [2, 'Left L2A\\nLeft L2B', Direction.LEFT],
  [3, 'Left L3A\\nLeft L3B', Direction.LEFT],
];

/** `mogume-53-tuxe939`. */
const WIDTH_AUTO = '<style>\nwbsDiagram {\n  node {\n    width auto\n  }\n}\n</style>';
const MOGUME: readonly Row[] = [
  [1, 'Planning'],
  [2, 'Define scope'],
  [2, 'Set milestones'],
  [2, 'Allocate resources'],
  [1, 'Implementation'],
  [2, 'Code'],
  [2, 'Test'],
  [2, 'Deploy to production environment'],
  [1, 'Review'],
];

/** `navoxe-03-mala012`: `**_` with no label is PSEUDO (CommandWBSItemNew.java:122-123). */
const NAVOXE: readonly Row[] = [
  [1, '', Direction.RIGHT, IdeaShape.PSEUDO],
  [2, 'Child A'],
  [2, 'Child B'],
  [1, '', Direction.RIGHT, IdeaShape.PSEUDO],
  [2, 'Child C'],
  [2, 'Child D'],
  [1, 'Normal Node'],
  [2, 'Child E'],
];

/** Authored: `* R` / `** A` / `***< L1` / `***< L2` / `*** R1` / `*** R2` under `node { Margin 25 }`. */
const MARGIN_STYLE = '<style>\nwbsDiagram {\n  node {\n    Margin 25\n  }\n}\n</style>';
const MARGIN: readonly Row[] = [
  [1, 'A'],
  [2, 'L1', Direction.LEFT],
  [2, 'L2', Direction.LEFT],
  [2, 'R1'],
  [2, 'R2'],
];

/** Authored: `* Root alone`. */
const ALONE: readonly Row[] = [];

describe('Fork constructor (Fork.java:58-67)', () => {
  it('throws IllegalArgumentException for a non-root idea', () => {
    const t = tree('R', MONOLINE_4);
    const child = t.root.getChildren(Direction.RIGHT)[0]!;
    expect(() => new Fork(t.skin, child, t.skin.atomOps)).toThrow('IllegalArgumentException');
  });

  it('builds only the RIGHT children: a level-1 LEFT child is drawn once, via its childrenRight copy (D9)', () => {
    const t = tree('R', [[1, 'A', Direction.LEFT]]);
    expect(t.root.getChildren(Direction.LEFT)).toHaveLength(1);
    expect(drawn(fork(t)).filter((e) => e.startsWith('R '))).toHaveLength(2);
  });
});

describe('Fork.drawU against the jar (Fork.java:99-140)', () => {
  it('no children: the main box at the origin and a stub from y0 to y1 (java:109-113)', () => {
    expect(drawn(fork(tree('Root alone', ALONE)))).toEqual(['R 20,20,78.05,32', 'L 59.025,52,59.025,72']);
  });

  it('WBS-monoline-def-0-4: two children, the bar from firstX to lastX, main centred over it', () => {
    expect(drawn(fork(tree('R', MONOLINE_4)))).toEqual([
      'L 46.35,72,46.35,92',
      'R 20,92,52.7,32',
      'L 46.35,155,56.35,155',
      'R 56.35,139,40.025,32',
      'L 46.35,124,46.35,155',
      'L 166.4,72,166.4,92',
      'R 140.05,92,52.7,32',
      'L 156.4,155,166.4,155',
      'R 116.375,139,40.025,32',
      'L 166.4,155,176.4,155',
      'R 176.4,139,40.025,32',
      'L 166.4,124,166.4,155',
      'L 46.35,72,166.4,72',
      'R 92.025,20,28.7,32',
      'L 106.375,52,106.375,72',
    ]);
  });

  it('WBS-direction-0: one child, posMain = (fullWidth - mainWidth) / 2, the bar from firstX to the main centre', () => {
    const block = fork(tree('Root', DIRECTION_0));
    expect(drawn(block)).toEqual([
      'L 136.938,72,136.938,92',
      'R 106.575,92,60.725,44',
      'L 126.938,173,136.938,173',
      'R 62.313,151,64.625,44',
      'L 84.625,232,94.625,232',
      'R 20,210,64.625,44',
      'L 94.625,195,94.625,232',
      'L 136.938,173,146.938,173',
      'R 146.938,151,74.75,44',
      'L 184.313,232,194.313,232',
      'R 194.313,210,74.75,44',
      'L 184.313,195,184.313,232',
      'L 136.938,136,136.938,173',
      'L 136.938,72,144.531,72',
      'R 121.856,20,45.35,32',
      'L 144.531,52,144.531,72',
    ]);
    // posMain + mainWidth / 2 = (249.063 - 45.35) / 2 + 45.35 / 2: the centre of the full width.
    expect(dim(block)[0] / 2 + DOCUMENT_MARGIN).toBeCloseTo(144.531, 3);
  });

  it('mogume-53-tuxe939: Width auto forces every level-1 main box to the widest (Implementation)', () => {
    expect(drawn(fork(tree('Project', MOGUME, WIDTH_AUTO)))).toEqual([
      'L 70.987,72,70.987,92',
      'R 20,92,101.975,32',
      'L 70.987,155,80.987,155',
      'R 80.987,139,118.7,32',
      'L 70.987,202,80.987,202',
      'R 80.987,186,118.7,32',
      'L 70.987,249,80.987,249',
      'R 80.987,233,118.7,32',
      'L 70.987,124,70.987,249',
      'L 270.675,72,270.675,92',
      'R 219.687,92,101.975,32',
      'L 270.675,155,280.675,155',
      'R 280.675,139,199.325,32',
      'L 270.675,202,280.675,202',
      'R 280.675,186,199.325,32',
      'L 270.675,249,280.675,249',
      'R 280.675,233,199.325,32',
      'L 270.675,124,270.675,249',
      'L 550.987,72,550.987,92',
      'R 500,92,101.975,32',
      'L 70.987,72,550.987,72',
      'R 282.312,20,57.35,32',
      'L 310.987,52,310.987,72',
    ]);
  });

  it('navoxe-03-mala012: a PSEUDO subtree has no box and stacks its children with marginBottom 0', () => {
    expect(drawn(fork(tree('Root', NAVOXE)))).toEqual([
      'L 30,72,30,92',
      'L 30,108,40,108',
      'R 40,92,58.775,32',
      'L 30,140,40,140',
      'R 40,124,58.775,32',
      'L 30,92,30,140',
      'L 128.775,72,128.775,92',
      'L 128.775,108,138.775,108',
      'R 138.775,92,59.45,32',
      'L 128.775,140,138.775,140',
      'R 138.775,124,59.45,32',
      'L 128.775,92,128.775,140',
      'L 263.588,72,263.588,92',
      'R 218.225,92,90.725,32',
      'L 263.588,155,273.588,155',
      'R 273.588,139,58.775,32',
      'L 263.588,124,263.588,155',
      'L 30,72,263.588,72',
      'R 124.119,20,45.35,32',
      'L 146.794,52,146.794,72',
    ]);
  });

  it('node { Margin 25 }: LEFT and RIGHT children stack 25 apart', () => {
    expect(drawn(fork(tree('R', MARGIN, MARGIN_STYLE)))).toEqual([
      'L 63.35,72,63.35,92',
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
      'L 63.35,72,64.363,72',
      'R 50.013,20,28.7,32',
      'L 64.363,52,64.363,72',
    ]);
  });
});

/** The dimension is the jar's drawn extent less the document margin. */
describe('Fork.calculateDimensionSlow (Fork.java:142-157)', () => {
  it.each([
    ['no children: the main box + deltay', 'Root alone', ALONE, '', [78.05, 72]],
    ['WBS-monoline-def-0-4: children + one delta1x gap', 'R', MONOLINE_4, '', [196.425, 151]],
    ['WBS-direction-0: one child, no gap', 'Root', DIRECTION_0, '', [249.063, 234]],
    ['mogume-53-tuxe939: auto-widened children', 'Project', MOGUME, WIDTH_AUTO, [581.975, 245]],
    ['navoxe-03-mala012', 'Root', NAVOXE, '', [312.363, 151]],
  ] as const)('%s', (_what, rootLabel, rows, style, expected) => {
    expect(dim(fork(tree(rootLabel, rows, style)))).toEqual(expected);
  });

  it('a main box wider than its children sets the width; one child puts posMain at 0 (java:133-134)', () => {
    const block = fork(tree('A very very long root label', [[1, 'x']]));
    const root = drawn(block).filter((e) => e.startsWith('R '))[1]!;
    expect(root.startsWith(`R ${DOCUMENT_MARGIN},${DOCUMENT_MARGIN},`)).toBe(true);
    expect(dim(block)[0]).toBe(Number(root.split(',')[2]));
  });
});

describe('Fork.applyAutoWidth (Fork.java:71-84)', () => {
  type Invalidate = { invalidateDimensionCache(): void };

  function invalidations(style: string, first: 'measure' | 'draw'): number {
    const spy = vi.spyOn(TextBlockMemoized.prototype as unknown as Invalidate, 'invalidateDimensionCache');
    try {
      const block = fork(tree('Project', MOGUME, style));
      if (first === 'measure') block.calculateDimension(stringBounder());
      drawn(block);
      block.calculateDimension(stringBounder());
      return spy.mock.contexts.filter((c) => c === block).length;
    } finally {
      spy.mockRestore();
    }
  }

  it('Width auto: the cache is invalidated once, whichever of measure and draw runs first', () => {
    expect([invalidations(WIDTH_AUTO, 'measure'), invalidations(WIDTH_AUTO, 'draw')]).toEqual([1, 1]);
  });

  it('no Width auto: never invalidated', () => {
    expect(invalidations('', 'draw')).toBe(0);
  });

  it('drawn before measured, the auto widths still apply', () => {
    const block = fork(tree('Project', MOGUME, WIDTH_AUTO));
    expect(drawn(block)[1]).toBe('R 20,92,101.975,32');
    expect(dim(block)).toEqual([581.975, 245]);
  });
});
