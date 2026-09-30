import type { ISkinParam } from '../../core/abel/ISkinParam.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { Branch } from './Branch.js';
import type { IdeaContent } from './Idea.js';

/**
 * `ISkinParam` narrowed to the one member the tree-building slice of
 * `MindMap`/`Branch`/`Idea` ported here actually reads —
 * `getCurrentStyleBuilder()` (`MindMap.java:124-125,139,141`, reached via
 * `Branch#initRoot`/`#add`). T4a widens the field this type backs to the
 * full `ISkinParam` when it ports `computeFinger`/`drawU`/
 * `calculateDimensionSlow`, which also read `getRankdir()`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMap.java:57 (the `skinParam` field)
 */
export type MindMapStyleSource = Pick<ISkinParam, 'getCurrentStyleBuilder'>;

/**
 * MindMap — one two-sided tree (a `regular` branch and a `reverse` branch,
 * fanning right/left or down/up depending on `direction`) inside a mindmap
 * diagram. A source can declare more than one (`MindMapDiagram.isFull`
 * starts a fresh one whenever a second level-0 root appears).
 *
 * Tree-part-only port (this task's scope): the constructor's field store,
 * `addIdeaInternal`, `isFull`. Drawing (`computeFinger`,
 * `calculateDimensionSlow`, `drawU`) is T4a's — see this task's brief.
 * `NoStyleAvailableException` (java:119,142-145) has no port yet (no
 * `src/core/style/` consumer throws it): the `try`/`catch` around
 * `addIdeaInternal`'s body is omitted here rather than guarding a case that
 * cannot occur with today's opaque `StyleBuilder`; T4a reintroduces it
 * alongside the real style engine if a real throw site lands.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMap.java:52-152
 */
export class MindMap {
  private readonly regular = new Branch();
  private readonly reverse = new Branch();
  private readonly skinParam: MindMapStyleSource;
  /** @see MindMap.java:115 */
  private multiplier = 0;

  /** @see MindMap.java:59-61 */
  constructor(skinParam: MindMapStyleSource) {
    this.skinParam = skinParam;
  }

  /**
   * @see MindMap.java:117-146. The `TeaVM.a()` dev-assertion
   * (`assert multiplier > 0`, java:131-132) is upstream's own
   * transpile-target-only sanity check, gated off in normal JVM builds
   * too; no TS equivalent is needed for the same reason `Branch.ts`'s
   * unguarded walks need none — this port has no TeaVM target.
   */
  addIdeaInternal(content: IdeaContent, level: number, direction: boolean): CommandExecutionResult {
    let effectiveLevel = level;
    if (this.reverse.hasRoot() === false && this.regular.hasRoot() === false) effectiveLevel = 0;

    if (effectiveLevel === 0) {
      const styleBuilder = this.skinParam.getCurrentStyleBuilder();
      this.regular.initRoot(content, styleBuilder);
      this.reverse.initRoot(content, styleBuilder);
      return CommandExecutionResult.ok();
    }

    if (this.multiplier === 0) this.multiplier = effectiveLevel;

    if (effectiveLevel % this.multiplier !== 0) return CommandExecutionResult.error('Bad indentation');

    // Java `level /= multiplier` is integer division; `effectiveLevel` and
    // `multiplier` are always non-negative here, so `Math.trunc` matches.
    effectiveLevel = Math.trunc(effectiveLevel / this.multiplier);
    const styleBuilder = this.skinParam.getCurrentStyleBuilder();
    if (direction === false) return this.reverse.add(content, styleBuilder, effectiveLevel);
    return this.regular.add(content, styleBuilder, effectiveLevel);
  }

  /** @see MindMap.java:148-150 */
  isFull(level: number): boolean {
    return level === 0 && this.regular.hasRoot();
  }

  /** Test/consumer observability accessor — see `Branch.ts#getRoot`'s doc
   *  comment for why this exists despite `regular`/`reverse` being private
   *  fields upstream too (`MindMap.java:54-55`). */
  getRegular(): Branch {
    return this.regular;
  }

  /** See {@link getRegular}. */
  getReverse(): Branch {
    return this.reverse;
  }
}
