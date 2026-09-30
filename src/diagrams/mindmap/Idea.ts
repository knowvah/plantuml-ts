import type { HColor } from '../../core/abel/Colors.js';
import type { StyleBuilder } from '../../core/abel/ISkinParam.js';
import type { Display } from '../../core/klimt/creole/Display.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import type { IdeaShape } from './IdeaShape.js';

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
 * Tree-part-only port (this task's scope): the constructor, the two
 * creation factories, and every plain getter. `getStyle()`/`getStyleArrow()`
 * (java:96-113, `StyleBuilder.getMergedStyleSpecial`/`getMergedStyle` plus
 * the `getDefaultStyleDefinitionNode` signature builder) are T4a's — they
 * read `styleBuilder` through the real style engine (`src/core/style/`,
 * landing in a parallel batch) plus `SName`/`StyleSignatureBasic`, neither
 * of which this task imports (D1: mindmap gets the full style engine, but
 * not from this file). `styleBuilder` itself is kept as the existing
 * `StyleBuilder` opaque stand-in (`core/abel/ISkinParam.ts`, already `type
 * StyleBuilder = object` for exactly this "consumed later" reason) rather
 * than widened to a real class here — T4a fills in `getStyle()`/
 * `getStyleArrow()` against it without changing this field's type.
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
  /** T4a's `getStyle()`/`getStyleArrow()` read this; see file doc. */
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
