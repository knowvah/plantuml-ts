/**
 * `WBSDiagram` (wbs/WBSDiagram.java): the tree builder (`addIdea`, `add`,
 * `getParentOfLast`, `getSmartLevel`), `link`, and the draw/dimension
 * wrapper around a fresh `Fork`.
 *
 * `Fork` is T2a's (batch 2, parallel): {@link forkLog} is a double that
 * records every construction, reports a fixed 100 x 50 dimension, and on
 * `drawU` draws a marker rectangle and places the root's RIGHT children
 * (`setGeometry` at the CURRENT translate, as `ITFLeaf.java:46-49` does).
 *
 * Jar values:
 * - `test-results/dot-cache/wbs/WBS-arrow-0/in.svg`: a link with no colour
 *   and no style is stroked `#181818` (the default `wbsDiagram.arrow`).
 * - authored probe (`scripts/oracle-render.sh`, below as `LINK_STYLE`):
 *   `a -> b <<hot>>` is stroked `#F00`, `b -> a` `#00F`, `a -> b #00FF00`
 *   `#0F0`, in that order.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorType } from '../../../src/core/abel/ColorType.js';
import { Colors } from '../../../src/core/abel/Colors.js';
import { Direction } from '../../../src/core/abel/Direction.js';
import type { HColor } from '../../../src/core/abel/Colors.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import { preprocess } from '../../../src/core/preprocessor.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { createSpriteRegistry } from '../../../src/core/sprite-registry.js';
import { Stereotype } from '../../../src/core/stereo/Stereotype.js';
import { GUILLEMET_NONE } from '../../../src/core/stereo/StereotypeDecoration.js';
import {
  createMindmapSkinParam,
  executeDeclaration,
  positionedDeclarationsOf,
  SkinParam as StyleSkinParam,
} from '../../../src/core/style/mindmap-style-builder.js';
import type { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import { NoStyleAvailableException } from '../../../src/core/style/StyleLoader.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import { SkinParam } from '../../../src/diagrams/wbs/wbs-skin-param.js';
import { WBSDiagram } from '../../../src/diagrams/wbs/WBSDiagram.js';
import type { WElement } from '../../../src/diagrams/wbs/WElement.js';
import { stringBounder, svgGraphic } from '../mindmap/helpers/mindmap-skin.js';

interface ForkConstruction {
  readonly skinParam: unknown;
  readonly root: WElement;
  readonly atomOps: unknown;
}

const forkLog = vi.hoisted(() => ({ constructed: [] as ForkConstruction[], drawn: [] as string[] }));

vi.mock('../../../src/diagrams/wbs/Fork.js', async () => {
  const { XDimension2D } = await import('../../../src/core/klimt/geom/XDimension2D.js');
  const { UTranslate } = await import('../../../src/core/klimt/UTranslate.js');
  const { URectangle } = await import('../../../src/core/klimt/shape/URectangle.js');
  const { Direction } = await import('../../../src/core/abel/Direction.js');
  const { AbstractCommonUGraphic } = await import('../../../src/core/klimt/AbstractCommonUGraphic.js');
  class Fork {
    private readonly root: WElement;
    constructor(skinParam: unknown, root: WElement, atomOps: unknown) {
      if (root.getLevel() !== 0) throw new Error('IllegalArgumentException');
      this.root = root;
      forkLog.constructed.push({ skinParam, root, atomOps });
    }
    calculateDimension(): InstanceType<typeof XDimension2D> {
      return new XDimension2D(100, 50);
    }
    drawU(ug: UGraphic): void {
      const at = ug instanceof AbstractCommonUGraphic ? ug.getTranslate() : new UTranslate(0, 0);
      forkLog.drawn.push(`fork at (${at.getDx()},${at.getDy()})`);
      ug.draw(URectangle.build(7, 7));
      this.root.getChildren(Direction.RIGHT).forEach((child, i) => {
        child.setGeometry(at.compose(new UTranslate(i * 100, 50)), new XDimension2D(40, 20));
      });
    }
  }
  return { Fork };
});

/** The authored probe's `<style>` (oracle rendered with `a`/`b` links). */
const LINK_STYLE = `<style>
wbsDiagram {
  arrow {
    LineColor #0000FF
  }
}
.hot {
  LineColor #FF0000
}
</style>`;

/** A style `SkinParam` whose builder can be switched to throw (`SkinParam.java:183-197`'s failure). */
class FailingStyle extends StyleSkinParam {
  failure: Error | undefined = undefined;
  override getCurrentStyleBuilder(): StyleBuilder {
    if (this.failure !== undefined) throw this.failure;
    return super.getCurrentStyleBuilder();
  }
}

function styleOf(style: string): StyleSkinParam {
  const pre = preprocess(`@startwbs\n${style}\n@endwbs`);
  const result = createMindmapSkinParam(pre);
  for (const d of positionedDeclarationsOf(pre, [])) executeDeclaration(result, d, pre.skinparam);
  return result;
}

function diagram(style: StyleSkinParam = createMindmapSkinParam({})): WBSDiagram {
  const skinParam = new SkinParam({
    style,
    skinparam: new Map(),
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
  return new WBSDiagram({ lines: [] }, new PreprocessingArtifact(), skinParam);
}

function box(
  label: string,
  backColor: HColor | undefined = undefined,
): {
  backColor: HColor | undefined;
  label: string;
  shape: IdeaShape;
} {
  return { backColor, label, shape: IdeaShape.BOX };
}

/** The tree as `label(children...)`, read through the root a fresh `Fork` receives. */
function tree(d: WBSDiagram): string {
  d.calculateDimension(stringBounder());
  const show = (e: WElement): string => {
    const right = e.getChildren(Direction.RIGHT).map(show);
    const left = e.getChildren(Direction.LEFT).map((c) => `<${show(c)}`);
    const kids = [...right, ...left];
    const name = String(e.getLabel().get(0));
    return kids.length === 0 ? name : `${name}(${kids.join(',')})`;
  };
  return show(forkLog.constructed.at(-1)!.root);
}

function addAll(d: WBSDiagram, rows: readonly (readonly [number, string, string?])[]): void {
  for (const [level, label, code] of rows)
    expect(d.addIdea(code, level, box(label), Direction.RIGHT).isOk()).toBe(true);
}

beforeEach(() => {
  forkLog.constructed.length = 0;
  forkLog.drawn.length = 0;
});

describe('WBSDiagram — identity (WBSDiagram.java:86-97)', () => {
  it('describes itself and is its own text block', () => {
    const d = diagram();
    expect(d.getDescription()).toBe('Work Breakdown Structure');
    expect(d.getTextBlock()).toBe(d);
    expect(d.getDiagramType()).toBe('WBS');
  });
});

describe('WBSDiagram.addIdea (WBSDiagram.java:145-172)', () => {
  it('accepts one root and refuses a second with the Java message', () => {
    const d = diagram();
    expect(d.addIdea(undefined, 0, box('r'), Direction.RIGHT).isOk()).toBe(true);
    const second = d.addIdea(undefined, 0, box('r2'), Direction.RIGHT);
    expect(second.getError()).toBe('WBS diagram only accepts one root first declared.');
    expect(tree(d)).toBe('r');
  });

  it('refuses a jump of two levels with "Bad tree structure" (java:230)', () => {
    const d = diagram();
    addAll(d, [[0, 'r']]);
    expect(d.addIdea(undefined, 2, box('x'), Direction.RIGHT).getError()).toBe('Bad tree structure');
    expect(tree(d)).toBe('r');
  });

  it('hangs level == last + 1 off last (java:213-219)', () => {
    const d = diagram();
    addAll(d, [
      [0, 'r'],
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
    expect(tree(d)).toBe('r(a(b(c)))');
  });

  it.each([
    [3, 'r(a(b(c,d)))'],
    [2, 'r(a(b(c),d))'],
    [1, 'r(a(b(c)),d)'],
  ])('walks up last.level - level + 1 parents for level %i <= last (java:221-228)', (level, expected) => {
    const d = diagram();
    addAll(d, [
      [0, 'r'],
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
    expect(d.addIdea(undefined, level, box('d'), Direction.RIGHT).isOk()).toBe(true);
    expect(tree(d)).toBe(expected);
  });

  it('passes the direction to createElement (a level-1 LEFT child also lands in RIGHT, D9)', () => {
    const d = diagram();
    addAll(d, [[0, 'r']]);
    d.addIdea(undefined, 1, box('L'), Direction.LEFT);
    expect(tree(d)).toBe('r(L,<L)');
  });

  it('splits a trailing <<stereotype>> off the label (java:143-154)', () => {
    const d = diagram();
    addAll(d, [[0, ' Hello  <<hot>> ']]);
    const root = (d.calculateDimension(stringBounder()), forkLog.constructed.at(-1)!.root);
    expect(root.getLabel().toString()).toBe('[Hello]');
    expect(root.getStereotype()?.getLabels(GUILLEMET_NONE)).toEqual(['hot']);
  });

  it('keeps a label without a stereotype whole, newlines split by getWithNewlines', () => {
    const d = diagram();
    addAll(d, [[0, 'two\\nlines']]);
    const root = (d.calculateDimension(stringBounder()), forkLog.constructed.at(-1)!.root);
    expect(root.getLabel().size()).toBe(2);
    expect(root.getStereotype()).toBeUndefined();
  });

  it('matches the stereotype pattern case-insensitively and anchored (Pattern2.cmpile)', () => {
    const d = diagram();
    addAll(d, [[0, 'a <<x>> b']]);
    const root = (d.calculateDimension(stringBounder()), forkLog.constructed.at(-1)!.root);
    expect(root.getLabel().toString()).toBe('[a <<x>> b]');
  });

  it('takes a Display and a Stereotype directly in the Display overload (java:157-172)', () => {
    const d = diagram();
    const display = Display.getWithNewlines(Pragma.createEmpty(), 'root');
    const stereotype = Stereotype.build('<<s>>');
    const result = d.addIdeaDisplay(
      undefined,
      0,
      { backColor: undefined, label: display, stereotype, shape: IdeaShape.NONE },
      Direction.RIGHT,
    );
    expect(result.isOk()).toBe(true);
    const root = (d.calculateDimension(stringBounder()), forkLog.constructed.at(-1)!.root);
    expect(root.getLabel()).toBe(display);
    expect(root.getStereotype()).toBe(stereotype);
    expect(root.getShape()).toBe(IdeaShape.NONE);
  });

  it.each([
    ['the root', 0],
    ['a child', 1],
  ])('turns NoStyleAvailableException at %s into "General failure: no style available."', (_, level) => {
    const style = new FailingStyle(() => []);
    const d = diagram(style);
    if (level === 1) addAll(d, [[0, 'r']]);
    style.failure = new NoStyleAvailableException();
    expect(d.addIdea(undefined, level, box('x'), Direction.RIGHT).getError()).toBe(
      'General failure: no style available.',
    );
  });

  it.each([0, 1])(
    'lets any other failure propagate at level %i (only NoStyleAvailableException is caught)',
    (level) => {
      const style = new FailingStyle(() => []);
      const d = diagram(style);
      if (level === 1) addAll(d, [[0, 'r']]);
      style.failure = new RangeError('boom');
      expect(() => d.addIdea(undefined, level, box('x'), Direction.RIGHT)).toThrow('boom');
    },
  );
});

describe('WBSDiagram.getSmartLevel (WBSDiagram.java:187-208)', () => {
  function rooted(first: string): WBSDiagram {
    const d = diagram();
    expect(d.getSmartLevel(first)).toBe(0);
    addAll(d, [[0, 'r']]);
    return d;
  }

  it.each([
    ['*', '**', 1],
    ['*', ' **', 2],
    ['*', '\t**', 2],
    ['*', '+-', 1],
    ['+', '--+', 2],
    ['*', '  +', 2],
    ['*', '** +', 3],
  ])('first %j: %j is level %i', (first, type, level) => {
    expect(rooted(first).getSmartLevel(type)).toBe(level);
  });

  it('returns 0 and remembers the type while there is no root', () => {
    const d = diagram();
    expect(d.getSmartLevel('*')).toBe(0);
    expect(d.getSmartLevel('**')).toBe(0);
  });

  it('throws NullPointerException on a spaced type when no call preceded the root (first == null)', () => {
    const d = diagram();
    addAll(d, [[0, 'r']]);
    expect(d.getSmartLevel('**')).toBe(1);
    expect(() => d.getSmartLevel(' **')).toThrow('NullPointerException');
  });

  it('throws UnsupportedOperationException when no arm matches', () => {
    expect(() => rooted('*').getSmartLevel(' +-')).toThrow('UnsupportedOperationException: type=< +->[*]');
  });
});

describe('WBSDiagram.link (WBSDiagram.java:237-256)', () => {
  function coded(style?: StyleSkinParam): WBSDiagram {
    const d = diagram(style);
    addAll(d, [
      [0, 'r'],
      [1, 'A', 'a'],
      [1, 'B', 'b'],
    ]);
    return d;
  }

  it('names the missing code', () => {
    const d = coded();
    expect(d.link('x', 'b', Colors.empty()).getError()).toBe('No such node x');
    expect(d.link('a', 'y', Colors.empty()).getError()).toBe('No such node y');
  });

  it('registers a code only when one is given (java:217-218)', () => {
    const d = diagram();
    addAll(d, [
      [0, 'r'],
      [1, 'A'],
    ]);
    expect(d.link('A', 'A', Colors.empty()).getError()).toBe('No such node A');
  });

  function linkStrokes(d: WBSDiagram): string[] {
    const ug = svgGraphic();
    d.drawU(ug);
    return [...ug.getSvgString().matchAll(/<line\b[^>]*stroke:(#[0-9A-F]+)/g)].map((m) => m[1]!);
  }

  it('refuses a LINE colour that is not a drawable HColor (Java ClassCastException)', () => {
    expect(() => coded().link('a', 'b', Colors.empty().add(ColorType.LINE, {}))).toThrow('ClassCastException');
  });

  it('strokes an uncoloured link with the default arrow LineColor (WBS-arrow-0)', () => {
    const d = coded();
    expect(d.link('b', 'a', Colors.empty()).isOk()).toBe(true);
    expect(linkStrokes(d)).toEqual(['#181818']);
  });

  it('uses the stereotyped arrow style, the arrow style, then an explicit LINE colour (authored probe)', () => {
    const d = coded(styleOf(LINK_STYLE));
    d.link('a', 'b', Colors.empty(), Stereotype.build('<<hot>>'));
    d.link('b', 'a', Colors.empty());
    d.link('a', 'b', Colors.empty().add(ColorType.LINE, HColorSet.instance().getColor('#00FF00')));
    expect(linkStrokes(d)).toEqual(['#F00', '#00F', '#0F0']);
  });
});

describe('WBSDiagram draw and dimension (WBSDiagram.java:99-141)', () => {
  it('is the fork dimension + 20, from a new Fork over (skinParam, root, atomOps) each call', () => {
    const d = diagram();
    addAll(d, [[0, 'r']]);
    const dim = d.calculateDimension(stringBounder());
    expect([dim.getWidth(), dim.getHeight()]).toEqual([120, 70]);
    d.calculateDimension(stringBounder());
    expect(forkLog.constructed).toHaveLength(2);
    const [first, second] = forkLog.constructed;
    expect(first).not.toBe(second);
    expect(first!.skinParam).toBe(d.getSkinParam());
    expect(first!.atomOps).toBe(d.getSkinParam().atomOps);
    expect(first!.root.toString()).toBe('[r]');
  });

  it('throws NullPointerException without a root (new Fork(skinParam, null))', () => {
    expect(() => diagram().calculateDimension(stringBounder())).toThrow('NullPointerException');
  });

  it('draws the fork at (10,10), then each link after the translate is reversed', () => {
    const d = diagram();
    addAll(d, [
      [0, 'r'],
      [1, 'A', 'a'],
      [1, 'B', 'b'],
    ]);
    d.link('a', 'b', Colors.empty());
    const ug = svgGraphic();
    d.drawU(ug);
    expect(forkLog.drawn).toEqual(['fork at (10,10)']);
    const drawn = ug.getSvgString().match(/<rect\b[^>]*\/>|<line\b[^>]*\/>|<polygon\b[^>]*\/>/g) ?? [];
    expect(drawn.map((s) => s.slice(0, s.indexOf(' ')))).toEqual(['<rect', '<line', '<polygon']);
    expect(drawn[0]).toContain('x="10" y="10"');
    // a at (10,60) 40x20, b at (110,60) 40x20, in absolute coordinates: the
    // centre line clipped to both boxes runs x 50 -> 110 at y 70.
    expect(drawn[1]).toContain('x1="50" y1="70" x2="110" y2="70"');
  });

  it('draws only the fork when the UGraphic has no translate (java:124-131)', () => {
    const d = diagram();
    addAll(d, [
      [0, 'r'],
      [1, 'A', 'a'],
      [1, 'B', 'b'],
    ]);
    d.link('a', 'b', Colors.empty());
    const log: { shape: UShape; applied: readonly UChange[] }[] = [];
    d.drawU(recording(log));
    expect(forkLog.drawn).toEqual(['fork at (0,0)']);
    expect(log.map((r) => r.shape)).toEqual([expect.any(URectangle)]);
    expect(log[0]!.applied.map((c) => c.constructor.name)).toEqual(['UTranslate']);
  });
});

/** A plain `UGraphic` (not an `AbstractCommonUGraphic`): records draws with the changes applied. */
function recording(log: { shape: UShape; applied: readonly UChange[] }[], applied: readonly UChange[] = []): UGraphic {
  const unused = (): never => {
    throw new Error('not used');
  };
  return {
    apply: (change: UChange): UGraphic => recording(log, [...applied, change]),
    draw: (shape: UShape): void => {
      log.push({ shape, applied });
    },
    getParam: (): UParam => unused(),
    getTranslate: unused,
    getStringBounder: () => stringBounder(),
  };
}

describe('WBSDiagram common-command state (TitledDiagram/UmlDiagram, MindMapDiagram.ts:52-70 precedent)', () => {
  it('starts with empty annotations and no scale', () => {
    const d = diagram();
    expect(isEmpty(d.annotations)).toBe(true);
    expect(d.scale).toBeUndefined();
  });

  it('reads its sprites from the skin param', () => {
    const d = diagram();
    expect(d.sprites).toBe(d.getSkinParam().getSprites());
  });
});
