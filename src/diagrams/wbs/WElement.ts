/**
 * WElement — one node of a WBS tree: label, level, LEFT/RIGHT children, style resolution and recorded geometry.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java
 */
import type { HColor } from '../../core/abel/Colors.js';
import { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import { Direction } from '../../core/abel/Direction.js';
import type { ISkinParamWithSimple } from '../../core/abel/ISkinParam.js';
import type { Display } from '../../core/klimt/creole/Display.js';
import type { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { UTranslate } from '../../core/klimt/UTranslate.js';
import { SkinParamColors } from '../../core/skin/SkinParamColors.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import { MergeStrategy } from '../../core/style/MergeStrategy.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { IdeaShape } from '../mindmap/IdeaShape.js';

/**
 * `public static final int STEP_BY_PARENT = 1000_1000`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java:110
 */
export const STEP_BY_PARENT = 10001000;

/**
 * `int deltaPriority = STEP_BY_PARENT * 1000` in Java `int` arithmetic:
 * 10001000 * 1000 overflows to 1411065408. `Math.imul` is the 32-bit
 * multiply (as `mindmap/Idea.ts`, D4).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java:113
 */
const FIRST_DELTA_PRIORITY = Math.imul(STEP_BY_PARENT, 1000);

/** Java dereferences a `null` merged style (an NPE); the port throws at the same point, as `mindmap/Idea.ts`. */
function requireStyle(style: Style | undefined): Style {
  if (style === undefined) throw new Error('NullPointerException: no node style in the StyleBuilder');
  return style;
}

/**
 * The five per-node fields `createElement` receives from its caller
 * (`backColor`, `newLabel`, `stereotype`, `shape`, `styleBuilder`) grouped
 * into one object — the `mindmap/Idea.ts#IdeaDecoration` precedent for the
 * repo's ≤5-parameter complexity hook, which upstream's 7-parameter
 * `createElement`/private constructor would trip. Every field is read
 * verbatim by {@link WElement}.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java:144-145
 */
export interface WElementDecoration {
  readonly backColor: HColor | undefined;
  readonly label: Display;
  readonly stereotype: Stereotype | undefined;
  readonly shape: IdeaShape;
  readonly styleBuilder: StyleBuilder;
}

/**
 * WElement — one node of a WBS tree: its label, depth, parent, the LEFT and
 * RIGHT child lists, its shape/back colour/stereotype decorations, the
 * `StyleBuilder` in effect when it was created, and the position/dimension
 * the layout records on it while drawing (`setGeometry`).
 *
 * `childrenLeft`/`childrenRight` mirror upstream's in-place `ArrayList`
 * mutation: `createElement` appends (or, for a level-1 LEFT child, also
 * prepends to `childrenRight`, D9); `getChildren` hands out read-only views.
 * `position`/`dimension` are mutable slots, written by `setGeometry`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java:61-205
 */
export class WElement {
  /** @see WElement.java:63 */
  private readonly backColor: HColor | undefined;
  /** @see WElement.java:64 */
  private readonly label: Display;
  /**
   * @see WElement.java:65. Write-once: the root constructor sets `0`, only
   * `createElement` (via {@link WElement.child}) overwrites it, before the
   * new element escapes — upstream's private 7-parameter constructor.
   */
  private level = 0;
  /** @see WElement.java:66 */
  private readonly stereotype: Stereotype | undefined;
  /** @see WElement.java:67. Write-once, as {@link level}. */
  private parent: WElement | undefined = undefined;
  /** @see WElement.java:68 */
  private readonly styleBuilder: StyleBuilder;
  /** @see WElement.java:69 */
  private readonly childrenLeft: WElement[] = [];
  /** @see WElement.java:70 */
  private readonly childrenRight: WElement[] = [];
  /** @see WElement.java:71 */
  private readonly shape: IdeaShape;
  /** @see WElement.java:72 */
  private position: UTranslate | undefined = undefined;
  /** @see WElement.java:73 */
  private dimension: XDimension2D | undefined = undefined;

  /** The root form: level 0, no parent. @see WElement.java:124-138 */
  constructor(
    backColor: HColor | undefined,
    label: Display,
    stereotype: Stereotype | undefined,
    styleBuilder: StyleBuilder,
    shape: IdeaShape,
  ) {
    this.label = label;
    this.backColor = backColor;
    this.shape = shape;
    this.styleBuilder = styleBuilder;
    this.stereotype = stereotype;
  }

  /** Upstream's private constructor with `level`/`parent`. @see WElement.java:129-138 */
  private static child(decoration: WElementDecoration, level: number, parent: WElement): WElement {
    const result = new WElement(
      decoration.backColor,
      decoration.label,
      decoration.stereotype,
      decoration.styleBuilder,
      decoration.shape,
    );
    result.level = level;
    result.parent = parent;
    return result;
  }

  /**
   * The node signature: root / leaf / boxless variants, each with the
   * stereotype and `level` added. `level` is the CALLER's level, not this
   * element's (`getStyle` walks the parents with the child's level).
   * Upstream: `@DuplicateCode(reference = "Idea")`.
   * @see WElement.java:75-101
   */
  private getDefaultStyleDefinitionNode(level: number): StyleSignatureBasic {
    if (level === 0)
      if (this.shape === IdeaShape.NONE)
        return StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', 'rootNode', 'boxless')
          .addStereotype(this.stereotype)
          .addLevel(level);
      else
        return StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', 'rootNode')
          .addStereotype(this.stereotype)
          .addLevel(level);

    if (this.shape === IdeaShape.NONE && this.isLeaf())
      return StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', 'leafNode', 'boxless')
        .addStereotype(this.stereotype)
        .addLevel(level);

    if (this.isLeaf())
      return StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', 'leafNode')
        .addStereotype(this.stereotype)
        .addLevel(level);

    if (this.shape === IdeaShape.NONE)
      return StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', 'boxless')
        .addStereotype(this.stereotype)
        .addLevel(level);

    return StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node')
      .addStereotype(this.stereotype)
      .addLevel(level);
  }

  /**
   * The skin param wrapped with this element's `BACK` colour, or the skin
   * param itself when no back colour was given.
   * @see WElement.java:103-108
   */
  withBackColor(skinParam: ISkinParamWithSimple): ISkinParamWithSimple {
    if (this.backColor === undefined) return skinParam;

    return new SkinParamColors(skinParam, Colors.empty().add(ColorType.BACK, this.backColor));
  }

  /**
   * The own node's special merge at `STEP_BY_PARENT * 1000`, then every
   * ancestor's definition AT THIS ELEMENT'S LEVEL, starred, one
   * `STEP_BY_PARENT` lower each, merged over it (`OVERWRITE_EXISTING_VALUE`).
   * `| 0` keeps the subtraction in Java `int` arithmetic.
   * @see WElement.java:112-122
   */
  getStyle(): Style {
    let deltaPriority = FIRST_DELTA_PRIORITY;
    let result = this.styleBuilder.getMergedStyleSpecial(this.getDefaultStyleDefinitionNode(this.level), deltaPriority);
    for (let up = this.parent; up !== undefined; up = up.parent) {
      const ss = up.getDefaultStyleDefinitionNode(this.level).addStar();
      deltaPriority = (deltaPriority - STEP_BY_PARENT) | 0;
      const styleParent = this.styleBuilder.getMergedStyleSpecial(ss, deltaPriority);
      result = requireStyle(result).mergeWith(styleParent, MergeStrategy.OVERWRITE_EXISTING_VALUE);
    }
    return requireStyle(result);
  }

  /** @see WElement.java:140-142 */
  isLeaf(): boolean {
    return this.childrenLeft.length === 0 && this.childrenRight.length === 0;
  }

  /**
   * A new child at `newLevel`. A LEFT child at level 1 is PREPENDED to
   * `childrenRight` and also appended to `childrenLeft` (upstream's two
   * independent `if`s, D9); any other LEFT child goes to `childrenLeft`,
   * every other direction to `childrenRight`.
   * @see WElement.java:144-155
   */
  createElement(decoration: WElementDecoration, newLevel: number, direction: Direction): WElement {
    const result = WElement.child(decoration, newLevel, this);
    if (direction === Direction.LEFT && newLevel === 1) this.childrenRight.unshift(result);
    if (direction === Direction.LEFT) this.childrenLeft.push(result);
    else this.childrenRight.push(result);

    return result;
  }

  /** @see WElement.java:157-160 */
  toString(): string {
    return this.label.toString();
  }

  /** @see WElement.java:162-164 */
  getLevel(): number {
    return this.level;
  }

  /** @see WElement.java:166-168 */
  getLabel(): Display {
    return this.label;
  }

  /** `Collections.unmodifiableList` of the LEFT list, else the RIGHT one. @see WElement.java:170-174 */
  getChildren(direction: Direction): readonly WElement[] {
    if (direction === Direction.LEFT) return this.childrenLeft;
    return this.childrenRight;
  }

  /** @see WElement.java:176-178 */
  getParent(): WElement | undefined {
    return this.parent;
  }

  /** @see WElement.java:180-182 */
  getShape(): IdeaShape {
    return this.shape;
  }

  /** @see WElement.java:184-186 */
  getStyleBuilder(): StyleBuilder {
    return this.styleBuilder;
  }

  /** @see WElement.java:188-191 */
  setGeometry(position: UTranslate, dimension: XDimension2D): void {
    this.position = position;
    this.dimension = dimension;
  }

  /** @see WElement.java:193-195 */
  getPosition(): UTranslate | undefined {
    return this.position;
  }

  /** @see WElement.java:197-199 */
  getDimension(): XDimension2D | undefined {
    return this.dimension;
  }

  /** @see WElement.java:201-203 */
  getStereotype(): Stereotype | undefined {
    return this.stereotype;
  }
}
