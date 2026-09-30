import type { StyleBuilder } from '../../core/abel/ISkinParam.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import type { IdeaContent } from './Idea.js';
import { Idea } from './Idea.js';

/**
 * Branch — one half (`regular` or `reverse`) of a `MindMap`: the root idea,
 * the "current insertion point" (`last`), and the indentation-driven
 * sibling/child logic that turns a flat stream of `(level, content)` pairs
 * into a tree.
 *
 * Tree-part-only port (this task's scope): `initRoot`, `add`, `hasRoot`,
 * `hasChildren`, plus the `getParentOfLast` helper `add` needs. `finger`
 * (the `FingerImpl` layout the drawing pass positions) and every
 * finger/drawing member (`initFinger`, `drawU`, `getHalfThickness`,
 * `getFullElongation`, `doNotDrawFirstPhalanx`, `getX12`) are T4a's — see
 * this task's brief ("Drawing/geometry stays for T4a").
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Branch.java:48-129
 */
export class Branch {
  private root: Idea | undefined;
  private last: Idea | undefined;

  /** @see Branch.java:53-56 */
  initRoot(content: IdeaContent, styleBuilder: StyleBuilder): void {
    this.root = Idea.createIdeaSimple({ ...content, styleBuilder });
    this.last = this.root;
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

  /** @see Branch.java:111-113. Upstream calls `root.hasChildren()`
   *  UNGUARDED — an NPE when `root` is `null` (no idea ever added to this
   *  branch). Preserved faithfully rather than guarded: a diagram with no
   *  root idea crashes the SAME way upstream does (jar-observed:
   *  `mindmap/susipa-95-tedu015`, whose oracle is the jar's own NPE crash
   *  page, `Branch.hasChildren(Branch.java:112)` in its stack trace). Only
   *  reachable from T4a's `MindMap.computeFinger` (not this task's tests). */
  hasChildren(): boolean {
    return this.root!.hasChildren();
  }

  /** @see Branch.java:115-117 */
  hasRoot(): boolean {
    return this.root !== undefined;
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
