/**
 * `WElement` (wbs/WElement.java:61-205): the tree model, the six node
 * signatures of `getDefaultStyleDefinitionNode` (java:76-101), the
 * `STEP_BY_PARENT` ancestor merge of `getStyle` (java:110-122), the
 * level-1 LEFT insertion quirk of `createElement` (java:144-155, D9),
 * `withBackColor` (java:103-108) and the geometry slots (java:188-199).
 *
 * The signatures are observed through the `StyleBuilder` the element was
 * built with (`getMergedStyleSpecial` spy) — upstream keeps the method
 * private, so does the port.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Colors } from '../../../src/core/abel/Colors.js';
import { ColorType } from '../../../src/core/abel/ColorType.js';
import { Direction } from '../../../src/core/abel/Direction.js';
import type { ISkinParamWithSimple } from '../../../src/core/abel/ISkinParam.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { SkinParamColors } from '../../../src/core/skin/SkinParamColors.js';
import { Stereotype } from '../../../src/core/stereo/Stereotype.js';
import { MergeStrategy } from '../../../src/core/style/MergeStrategy.js';
import { Style } from '../../../src/core/style/Style.js';
import { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import type { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import type { WElementDecoration } from '../../../src/diagrams/wbs/WElement.js';
import { STEP_BY_PARENT, WElement } from '../../../src/diagrams/wbs/WElement.js';

const RED = HColorSet.instance().getColor('#FF0000');

/** `int deltaPriority = STEP_BY_PARENT * 1000` overflows a Java int: 10001000000 - 2 * 2^32 (WElement.java:113). */
const FIRST_DELTA = 1411065408;

const NODE = ['root', 'element', 'wbsDiagram', 'node'] as const;

interface SpecialCall {
  readonly names: readonly string[];
  readonly level: number;
  readonly starred: boolean;
  readonly stereotypes: readonly string[];
  readonly priority: number;
  readonly returned: Style;
}

/** A real builder whose `getMergedStyleSpecial` records each call and answers a fresh empty style on the signature. */
function spyBuilder(calls: SpecialCall[]): StyleBuilder {
  const builder = new StyleBuilder();
  vi.spyOn(builder, 'getMergedStyleSpecial').mockImplementation((signature: StyleSignatureBasic, priority: number) => {
    const returned = new Style(signature, new Map());
    calls.push({
      names: signature.names,
      level: signature.getKey().level,
      starred: signature.isStarred(),
      stereotypes: [...signature.getStereotypes()],
      priority,
      returned,
    });
    return returned;
  });
  return builder;
}

function decoration(label: string, shape: IdeaShape, styleBuilder: StyleBuilder): WElementDecoration {
  return { backColor: undefined, label: Display.create(label), stereotype: undefined, shape, styleBuilder };
}

function rootOf(shape: IdeaShape, styleBuilder: StyleBuilder, stereotype?: Stereotype): WElement {
  return new WElement(undefined, Display.create('r'), stereotype, styleBuilder, shape);
}

/** The signature `getStyle` asks for on its own node (the first special merge). */
function ownSignature(element: WElement, calls: SpecialCall[]): SpecialCall {
  calls.length = 0;
  element.getStyle();
  return calls[0]!;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WElement root constructor (WElement.java:124-127)', () => {
  it('is level 0, parentless, a leaf, and keeps label/shape/stereotype/builder', () => {
    const builder = new StyleBuilder();
    const stereotype = Stereotype.build('<<foo>>');
    const label = Display.create('root');
    const root = new WElement(RED, label, stereotype, builder, IdeaShape.BOX);
    expect(root.getLevel()).toBe(0);
    expect(root.getParent()).toBeUndefined();
    expect(root.isLeaf()).toBe(true);
    expect(root.getLabel()).toBe(label);
    expect(root.getShape()).toBe(IdeaShape.BOX);
    expect(root.getStereotype()).toBe(stereotype);
    expect(root.getStyleBuilder()).toBe(builder);
    expect(root.toString()).toBe(label.toString());
  });
});

describe('WElement.createElement (WElement.java:144-155, D9)', () => {
  const builder = new StyleBuilder();

  it('a RIGHT child is appended to childrenRight only', () => {
    const root = rootOf(IdeaShape.BOX, builder);
    const a = root.createElement(decoration('a', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    const b = root.createElement(decoration('b', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    expect(root.getChildren(Direction.RIGHT)).toEqual([a, b]);
    expect(root.getChildren(Direction.LEFT)).toEqual([]);
    expect(a.getParent()).toBe(root);
    expect(a.getLevel()).toBe(1);
    expect(root.isLeaf()).toBe(false);
  });

  it('a LEFT child at level 1 is PREPENDED to childrenRight AND appended to childrenLeft', () => {
    const root = rootOf(IdeaShape.BOX, builder);
    const r1 = root.createElement(decoration('r1', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    const l1 = root.createElement(decoration('l1', IdeaShape.BOX, builder), 1, Direction.LEFT);
    const l2 = root.createElement(decoration('l2', IdeaShape.BOX, builder), 1, Direction.LEFT);
    expect(root.getChildren(Direction.RIGHT)).toEqual([l2, l1, r1]);
    expect(root.getChildren(Direction.LEFT)).toEqual([l1, l2]);
    expect(root.getChildren(Direction.RIGHT)[0]).toBe(l2);
    expect(root.getChildren(Direction.LEFT).at(-1)).toBe(l2);
  });

  it('a LEFT child at any other level goes to childrenLeft only', () => {
    const root = rootOf(IdeaShape.BOX, builder);
    const a = root.createElement(decoration('a', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    const x = a.createElement(decoration('x', IdeaShape.BOX, builder), 2, Direction.LEFT);
    expect(a.getChildren(Direction.LEFT)).toEqual([x]);
    expect(a.getChildren(Direction.RIGHT)).toEqual([]);
    expect(x.getLevel()).toBe(2);
    expect(x.getParent()).toBe(a);
  });

  it('the child keeps its own decoration', () => {
    const root = rootOf(IdeaShape.BOX, builder);
    const other = new StyleBuilder();
    const stereotype = Stereotype.build('<<bar>>');
    const label = Display.create('c');
    const c = root.createElement(
      { backColor: RED, label, stereotype, shape: IdeaShape.PSEUDO, styleBuilder: other },
      1,
      Direction.RIGHT,
    );
    expect(c.getLabel()).toBe(label);
    expect(c.getStereotype()).toBe(stereotype);
    expect(c.getShape()).toBe(IdeaShape.PSEUDO);
    expect(c.getStyleBuilder()).toBe(other);
  });
});

describe('WElement.getDefaultStyleDefinitionNode — the six signatures (WElement.java:76-101)', () => {
  const calls: SpecialCall[] = [];

  it('level 0, shape NONE: root element wbsDiagram node rootNode boxless', () => {
    const root = rootOf(IdeaShape.NONE, spyBuilder(calls));
    expect(ownSignature(root, calls)).toMatchObject({ names: [...NODE, 'rootNode', 'boxless'], level: 0 });
  });

  it('level 0, shape BOX (even with children): root element wbsDiagram node rootNode', () => {
    const builder = spyBuilder(calls);
    const root = rootOf(IdeaShape.BOX, builder);
    root.createElement(decoration('a', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    expect(ownSignature(root, calls)).toMatchObject({ names: [...NODE, 'rootNode'], level: 0 });
  });

  it('shape NONE and leaf: … node leafNode boxless', () => {
    const builder = spyBuilder(calls);
    const a = rootOf(IdeaShape.BOX, builder).createElement(
      decoration('a', IdeaShape.NONE, builder),
      1,
      Direction.RIGHT,
    );
    expect(ownSignature(a, calls)).toMatchObject({ names: [...NODE, 'leafNode', 'boxless'], level: 1 });
  });

  it('leaf (BOX or PSEUDO): … node leafNode', () => {
    const builder = spyBuilder(calls);
    const root = rootOf(IdeaShape.BOX, builder);
    const box = root.createElement(decoration('a', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    const pseudo = root.createElement(decoration('p', IdeaShape.PSEUDO, builder), 1, Direction.RIGHT);
    expect(ownSignature(box, calls)).toMatchObject({ names: [...NODE, 'leafNode'], level: 1 });
    expect(ownSignature(pseudo, calls)).toMatchObject({ names: [...NODE, 'leafNode'], level: 1 });
  });

  it('shape NONE, not a leaf: … node boxless', () => {
    const builder = spyBuilder(calls);
    const a = rootOf(IdeaShape.BOX, builder).createElement(
      decoration('a', IdeaShape.NONE, builder),
      1,
      Direction.RIGHT,
    );
    a.createElement(decoration('b', IdeaShape.BOX, builder), 2, Direction.RIGHT);
    expect(ownSignature(a, calls)).toMatchObject({ names: [...NODE, 'boxless'], level: 1 });
  });

  it('shape BOX, not a leaf: root element wbsDiagram node', () => {
    const builder = spyBuilder(calls);
    const a = rootOf(IdeaShape.BOX, builder).createElement(decoration('a', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    a.createElement(decoration('b', IdeaShape.BOX, builder), 2, Direction.LEFT);
    expect(ownSignature(a, calls)).toMatchObject({ names: [...NODE], level: 1 });
  });

  it('adds the stereotype (addStereotype(stereotype)) and leaves the own signature unstarred', () => {
    const root = rootOf(IdeaShape.BOX, spyBuilder(calls), Stereotype.build('<<Foo>>'));
    expect(ownSignature(root, calls)).toMatchObject({ stereotypes: ['foo'], starred: false });
  });
});

describe('WElement.getStyle — the STEP_BY_PARENT merge (WElement.java:110-122)', () => {
  it('STEP_BY_PARENT is 1000_1000 (WElement.java:110)', () => {
    expect(STEP_BY_PARENT).toBe(10001000);
  });

  it('a 3-deep chain: self at STEP_BY_PARENT*1000, then each ancestor starred, STEP_BY_PARENT lower', () => {
    const calls: SpecialCall[] = [];
    const builder = spyBuilder(calls);
    const root = rootOf(IdeaShape.BOX, builder, Stereotype.build('<<top>>'));
    const a = root.createElement(decoration('a', IdeaShape.NONE, builder), 1, Direction.RIGHT);
    const b = a.createElement(decoration('b', IdeaShape.BOX, builder), 2, Direction.RIGHT);
    const merges = vi.spyOn(Style.prototype, 'mergeWith');
    calls.length = 0;
    b.getStyle();
    expect(calls.map(({ returned: _, ...call }) => call)).toEqual([
      { names: [...NODE, 'leafNode'], level: 2, starred: false, stereotypes: [], priority: FIRST_DELTA },
      { names: [...NODE, 'boxless'], level: 2, starred: true, stereotypes: [], priority: FIRST_DELTA - STEP_BY_PARENT },
      // The root is asked at b's level 2, not its own 0 (java:116): the non-root, non-leaf signature.
      { names: [...NODE], level: 2, starred: true, stereotypes: ['top'], priority: FIRST_DELTA - 2 * STEP_BY_PARENT },
    ]);
    expect(merges.mock.calls).toEqual([
      [calls[1]!.returned, MergeStrategy.OVERWRITE_EXISTING_VALUE],
      [calls[2]!.returned, MergeStrategy.OVERWRITE_EXISTING_VALUE],
    ]);
    expect(merges.mock.contexts[0]).toBe(calls[0]!.returned);
    expect(merges.mock.contexts[1]).toBe(merges.mock.results[0]!.value);
  });

  it('a root merges only its own signature and returns that style', () => {
    const calls: SpecialCall[] = [];
    const root = rootOf(IdeaShape.BOX, spyBuilder(calls));
    expect(root.getStyle()).toBe(calls[0]!.returned);
    expect(calls).toHaveLength(1);
  });

  it('throws where the Java dereferences a null merged style (no matching declaration)', () => {
    const builder = new StyleBuilder();
    const root = rootOf(IdeaShape.BOX, builder);
    const a = root.createElement(decoration('a', IdeaShape.BOX, builder), 1, Direction.RIGHT);
    expect(() => a.getStyle()).toThrow('NullPointerException: no node style in the StyleBuilder');
    expect(() => root.getStyle()).toThrow('NullPointerException: no node style in the StyleBuilder');
  });
});

describe('WElement.withBackColor (WElement.java:103-108)', () => {
  const skinParam = {} as ISkinParamWithSimple;

  it('without a back colour returns the skin param itself', () => {
    expect(rootOf(IdeaShape.BOX, new StyleBuilder()).withBackColor(skinParam)).toBe(skinParam);
  });

  it('with a back colour wraps it in SkinParamColors carrying BACK = that colour', () => {
    const root = new WElement(RED, Display.create('r'), undefined, new StyleBuilder(), IdeaShape.BOX);
    const result = root.withBackColor(skinParam);
    expect(result).toBeInstanceOf(SkinParamColors);
    const colors = (result as SkinParamColors).getColors();
    expect(colors.getColor(ColorType.BACK)).toBe(RED);
    expect(colors.toString()).toBe(Colors.empty().add(ColorType.BACK, RED).toString());
  });
});

describe('WElement geometry (WElement.java:188-199)', () => {
  it('is unset until setGeometry, then reads back the same objects', () => {
    const element = rootOf(IdeaShape.BOX, new StyleBuilder());
    expect(element.getPosition()).toBeUndefined();
    expect(element.getDimension()).toBeUndefined();
    const position = new UTranslate(12.5, 40);
    const dimension = new XDimension2D(80, 26.2969);
    element.setGeometry(position, dimension);
    expect(element.getPosition()).toBe(position);
    expect(element.getDimension()).toBe(dimension);
  });
});
