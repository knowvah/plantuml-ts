import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import type { Finger } from './Finger.js';
import { FingerImpl } from './FingerImpl.js';
import type { IdeaContent } from './Idea.js';
import { Idea } from './Idea.js';
import type { MindMapSkinParam } from './MindMap.js';

/**
 * Branch — one half (`regular` or `reverse`) of a `MindMap`: the root idea,
 * the "current insertion point" (`last`), and the indentation-driven
 * sibling/child logic that turns a flat stream of `(level, content)` pairs
 * into a tree.
 *
 * Its `finger` is the drawable `FingerImpl` tree built from `root` once
 * the tree is complete (`MindMap.computeFinger`); every geometry query
 * answers 0 while there is none.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Branch.java:48-129
 */
export class Branch implements UDrawable {
  /** @see Branch.java:49 */
  private root: Idea | undefined;
  /** @see Branch.java:50 */
  private last: Idea | undefined;
  /** @see Branch.java:51 */
  private finger: Finger | undefined;

  /** @see Branch.java:53-56 */
  initRoot(content: IdeaContent, styleBuilder: StyleBuilder): void {
    this.root = Idea.createIdeaSimple({ ...content, styleBuilder });
    this.last = this.root;
  }

  /**
   * `atomOps` is ADR-9's injected creole capability (see `FingerImpl.ts`).
   * Upstream builds from `root` unguarded; `MindMap.computeFinger` only
   * calls this on a branch with a root.
   * @see Branch.java:58-60
   */
  initFinger(skinParam: MindMapSkinParam, direction: boolean, atomOps: AtomOps): void {
    this.finger = FingerImpl.build(this.root!, skinParam, direction, atomOps);
  }

  /** @see Branch.java:62-68. Upstream walks `nb` parent hops off `last`
   *  with no null guard — every call site in `add` below only ever asks
   *  for a hop count `<= last.getLevel()`, so the walk can never run past
   *  the root (`getLevel() === 0` has no parent left to hop to only when
   *  `nb` would already be 0). Preserved unguarded, matching upstream. */
  getParentOfLast(nb: number): Idea | undefined {
    let result = this.last;
    for (let i = 0; i < nb; i++) result = result?.getParent();
    return result;
  }

  /** @see Branch.java:70-88 */
  add(content: IdeaContent, styleBuilder: StyleBuilder, level: number): CommandExecutionResult {
    if (this.last === undefined) return CommandExecutionResult.error('Check your indentation ?');

    const decoration = { ...content, styleBuilder };
    if (level === this.last.getLevel() + 1) {
      this.last = this.last.createIdea(decoration, level);
      return CommandExecutionResult.ok();
    }
    if (level <= this.last.getLevel()) {
      const diff = this.last.getLevel() - level + 1;
      // Upstream calls `.createIdea` unguarded on `getParentOfLast(diff)`'s
      // result (an NPE if it were ever undefined); `diff` here is always in
      // `[1, last.getLevel() + 1]`, so the walk never outruns the root — see
      // `getParentOfLast`'s own doc.
      const parent = this.getParentOfLast(diff)!;
      this.last = parent.createIdea(decoration, level);
      return CommandExecutionResult.ok();
    }
    return CommandExecutionResult.error('error42L');
  }

  /** @see Branch.java:90-92 */
  hasFinger(): boolean {
    return this.finger !== undefined;
  }

  /** @see Branch.java:94-97 */
  drawU(ug: UGraphic): void {
    if (this.finger !== undefined) this.finger.drawU(ug);
  }

  /** @see Branch.java:99-103 */
  getHalfThickness(stringBounder: StringBounder): number {
    if (this.finger === undefined) return 0;
    return this.finger.getFullThickness(stringBounder) / 2;
  }

  /** @see Branch.java:105-109 */
  getFullElongation(stringBounder: StringBounder): number {
    if (this.finger === undefined) return 0;
    return this.finger.getFullElongation(stringBounder);
  }

  /** @see Branch.java:111-113. Upstream calls `root.hasChildren()`
   *  UNGUARDED — an NPE when `root` is `null` (no idea ever added to this
   *  branch). Preserved faithfully rather than guarded: a diagram with no
   *  root idea crashes the SAME way upstream does (jar-observed:
   *  `mindmap/susipa-95-tedu015`, whose oracle is the jar's own NPE crash
   *  page, `Branch.hasChildren(Branch.java:112)` in its stack trace). Reached
   *  from `MindMap.computeFinger`. */
  hasChildren(): boolean {
    return this.root!.hasChildren();
  }

  /** @see Branch.java:115-117 */
  hasRoot(): boolean {
    return this.root !== undefined;
  }

  /** Upstream calls it unguarded; `MindMap.computeFinger` only does so with a finger. @see Branch.java:119-121 */
  doNotDrawFirstPhalanx(): void {
    this.finger!.doNotDrawFirstPhalanx();
  }

  /** Java's `(FingerImpl) finger` cast. @see Branch.java:123-127 */
  getX12(stringBounder: StringBounder): number {
    if (this.finger === undefined) return 0;
    if (!(this.finger instanceof FingerImpl)) throw new Error('ClassCastException: finger is not a FingerImpl');
    return this.finger.getFullElongation(stringBounder) + this.finger.getX12();
  }

  /**
   * Test/consumer observability accessor — not part of upstream's public
   * surface (`Branch` is package-private; nothing outside `mindmap/` calls
   * this on the real jar). This port's module boundary is the file, not a
   * keyword (see `Idea.ts`'s class doc), and this task's own acceptance
   * criteria require verifying tree shape from outside the package, so a
   * read accessor is added here rather than reaching into a private field.
   */
  getRoot(): Idea | undefined {
    return this.root;
  }
}
