import type { HColor } from '../../core/abel/Colors.js';
import type { Display } from '../../core/klimt/creole/Display.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import { MergeStrategy } from '../../core/style/MergeStrategy.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { IdeaShape } from './IdeaShape.js';

/**
 * `WElement.STEP_BY_PARENT` (`1000_1000`), which `Idea` aliases.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WElement.java:110
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Idea.java:94
 */
export const STEP_BY_PARENT = 10001000;

/**
 * `int deltaPriority = STEP_BY_PARENT * 1000` in Java `int` arithmetic:
 * 10001000 * 1000 overflows to 1411065408 (the jar's own priorities read
 * back at 1411065408 + stored). `Math.imul` is the 32-bit multiply.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Idea.java:97
 */
const FIRST_DELTA_PRIORITY = Math.imul(STEP_BY_PARENT, 1000);

/** Java dereferences a `null` merged style (an NPE); the port throws at the same point. */
function requireStyle(style: Style | undefined, what: string): Style {
  if (style === undefined) throw new Error(`NullPointerException: no ${what} style in the StyleBuilder`);
  return style;
}

/**
 * The four upstream constructor fields that are supplied per-node by a
 * caller (a command, or `Branch`/`MindMap` passing one through) rather than
 * computed from the node's position in the tree (`level`/`parent`) or its
 * ambient style context (`styleBuilder`, see {@link IdeaDecoration}).
 * Grouped into one object — matching this repo's `code-principles.md`
 * ≤5-params-per-function complexity hook, which the flat 6/7-parameter
 * upstream constructor/factories would otherwise trip — rather than a
 * behavioral change: every field below is read verbatim, in the same
 * upstream order, by {@link Idea}'s constructor.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Idea.java:115-136
 */
export interface IdeaContent {
  readonly backColor: HColor | undefined;
  readonly label: Display;
  readonly shape: IdeaShape;
  readonly stereotype: Stereotype | undefined;
}

/** {@link IdeaContent} plus the `StyleBuilder` in effect when the node is
 *  created — the full upstream constructor parameter set. */
export interface IdeaDecoration extends IdeaContent {
  readonly styleBuilder: StyleBuilder;
}

/**
 * Idea — one node of a mindmap tree: a label, its depth, its parent/children
 * links, its shape/background-color/stereotype decorations, and the
 * `StyleBuilder` in effect when it was created.
 *
 * `styleBuilder` is the real style engine's builder (`core/style/`, D1);
 * `getStyle`/`getStyleArrow` resolve the node and link styles from it.
 *
 * Upstream's class (and `Branch`, `MindMap`) is package-private
 * (`net.sourceforge.plantuml.mindmap`, no `public`); this port's module
 * boundary is the file, not a keyword, so the class is exported for
 * `Branch.ts`/`MindMap.ts`/the command modules to construct and read.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Idea.java:54-179
 */
export class Idea {
  private readonly label: Display;
  private readonly level: number;
  private readonly parent: Idea | undefined;
  private readonly children: Idea[] = [];
  private readonly shape: IdeaShape;
  private readonly backColor: HColor | undefined;
  /** @see Idea.java:62 */
  private readonly styleBuilder: StyleBuilder;
  private readonly stereotype: Stereotype | undefined;

  /** @see Idea.java:127-136 */
  private constructor(decoration: IdeaDecoration, level: number, parent: Idea | undefined) {
    this.backColor = decoration.backColor;
    this.styleBuilder = decoration.styleBuilder;
    this.label = decoration.label;
    this.level = level;
    this.parent = parent;
    this.shape = decoration.shape;
    this.stereotype = decoration.stereotype;
  }

  /**
   * The node signature: root / leaf / boxless variants, each with the
   * stereotype and `level` added. `level` is the CALLER's level, not this
   * idea's (`getStyle` walks the parents with the child's level).
   * @see Idea.java:65-92
   */
  private getDefaultStyleDefinitionNode(level: number): StyleSignatureBasic {
    if (level === 0)
      if (this.shape === IdeaShape.NONE)
        return StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'rootNode', 'boxless')
          .addStereotype(this.stereotype)
          .addLevel(level);
      else
        return StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'rootNode')
          .addStereotype(this.stereotype)
          .addLevel(level);

    if (this.shape === IdeaShape.NONE && this.children.length === 0)
      return StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'leafNode', 'boxless')
        .addStereotype(this.stereotype)
        .addLevel(level);

    if (this.shape === IdeaShape.NONE)
      return StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'boxless')
        .addStereotype(this.stereotype)
        .addLevel(level);

    if (this.children.length === 0)
      return StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'leafNode')
        .addStereotype(this.stereotype)
        .addLevel(level);

    return StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node')
      .addStereotype(this.stereotype)
      .addLevel(level);
  }

  /**
   * The own node's special merge at `STEP_BY_PARENT * 1000`, then every
   * ancestor's definition AT THIS NODE'S LEVEL, starred, one
   * `STEP_BY_PARENT` lower each, merged over it (`OVERWRITE_EXISTING_VALUE`).
   * `| 0` keeps the subtraction in Java `int` arithmetic.
   * @see Idea.java:96-106
   */
  getStyle(): Style {
    let deltaPriority = FIRST_DELTA_PRIORITY;
    let result = this.styleBuilder.getMergedStyleSpecial(this.getDefaultStyleDefinitionNode(this.level), deltaPriority);
    for (let up = this.parent; up !== undefined; up = up.parent) {
      const ss = up.getDefaultStyleDefinitionNode(this.level).addStar();
      deltaPriority = (deltaPriority - STEP_BY_PARENT) | 0;
      const styleParent = this.styleBuilder.getMergedStyleSpecial(ss, deltaPriority);
      result = requireStyle(result, 'node').mergeWith(styleParent, MergeStrategy.OVERWRITE_EXISTING_VALUE);
    }
    return requireStyle(result, 'node');
  }

  /** @see Idea.java:108-113 */
  getStyleArrow(): Style {
    const defaultStyleDefinitionArrow = StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'arrow')
      .addStereotype(this.stereotype)
      .addLevel(this.level);
    return requireStyle(defaultStyleDefinitionArrow.getMergedStyle(this.styleBuilder), 'arrow');
  }

  /** @see Idea.java:115-118 */
  static createIdeaSimple(decoration: IdeaDecoration): Idea {
    return new Idea(decoration, 0, undefined);
  }

  /** @see Idea.java:120-125 */
  createIdea(decoration: IdeaDecoration, newLevel: number): Idea {
    const result = new Idea(decoration, newLevel, this);
    this.children.push(result);
    return result;
  }

  /** @see Idea.java:138-141 */
  toString(): string {
    return this.label.toString();
  }

  /** @see Idea.java:143-145 */
  getLevel(): number {
    return this.level;
  }

  /** @see Idea.java:147-149 */
  getLabel(): Display {
    return this.label;
  }

  /** @see Idea.java:151-153 (`Collections.unmodifiableList`) */
  getChildren(): readonly Idea[] {
    return this.children;
  }

  /** @see Idea.java:155-157 */
  hasChildren(): boolean {
    return this.children.length > 0;
  }

  /** @see Idea.java:159-161 */
  getParent(): Idea | undefined {
    return this.parent;
  }

  /** @see Idea.java:163-165 */
  getShape(): IdeaShape {
    return this.shape;
  }

  /** @see Idea.java:167-169 */
  getBackColor(): HColor | undefined {
    return this.backColor;
  }

  /** @see Idea.java:171-173 */
  getStyleBuilder(): StyleBuilder {
    return this.styleBuilder;
  }

  /** @see Idea.java:175-177 */
  getStereotype1(): Stereotype | undefined {
    return this.stereotype;
  }
}
