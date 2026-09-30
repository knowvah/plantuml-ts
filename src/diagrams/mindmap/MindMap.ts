import type { ISkinParamWithSimple } from '../../core/abel/ISkinParam.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { Rankdir } from '../../core/klimt/geom/Rankdir.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { TextBlockMemoized } from '../../core/klimt/shape/TextBlockMemoized.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { Branch } from './Branch.js';
import type { IdeaContent } from './Idea.js';

/**
 * The `ISkinParam` surface the mindmap reads: the `ISkinSimple` members
 * `FtileBoxOld`/`create0` reach (`ISkinParamWithSimple`), the real style
 * engine's builder (`getCurrentStyleBuilder`, `MindMap.java:124-125,139,
 * 141`) and `getRankdir` (`FingerImpl.java:83`, `MindMap.java:87,107`),
 * which the port's `ISkinParam` slice does not declare yet.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMap.java:57 (the `skinParam` field)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java (getRankdir, getCurrentStyleBuilder)
 */
export interface MindMapSkinParam extends ISkinParamWithSimple {
  getCurrentStyleBuilder(): StyleBuilder;
  getRankdir(): Rankdir;
}

/**
 * MindMap — one two-sided tree (a `regular` branch and a `reverse` branch,
 * fanning right/left or down/up depending on `direction`) inside a mindmap
 * diagram. A source can declare more than one (`MindMapDiagram.isFull`
 * starts a fresh one whenever a second level-0 root appears).
 *
 * Drawing: once the tree is complete, `computeFinger` builds each
 * non-empty branch's `FingerImpl`; when both sides draw, the reverse side
 * skips its root box (the regular side draws the shared root once). The
 * reverse side's full reach (`getX12`) is the x offset of the root.
 *
 * `atomOps` is ADR-9's injected creole capability, appended after the
 * upstream parameter and handed to every `FingerImpl` (see `FingerImpl.ts`).
 *
 * `NoStyleAvailableException` (java:119,142-145): the port builds the
 * `StyleBuilder` before parsing (`buildMindmapStyleBuilder`, which handles
 * it), so `getCurrentStyleBuilder` cannot throw it here; the `try`/`catch`
 * around `addIdeaInternal`'s body is not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMap.java:52-152
 */
export class MindMap extends TextBlockMemoized {
  /** @see MindMap.java:54 */
  private readonly regular = new Branch();
  /** @see MindMap.java:55 */
  private readonly reverse = new Branch();
  /** @see MindMap.java:57 */
  private readonly skinParam: MindMapSkinParam;
  private readonly atomOps: AtomOps;
  /** @see MindMap.java:115 */
  private multiplier = 0;

  /** @see MindMap.java:59-61 */
  constructor(skinParam: MindMapSkinParam, atomOps: AtomOps) {
    super();
    this.skinParam = skinParam;
    this.atomOps = atomOps;
  }

  /** @see MindMap.java:63-75 */
  private computeFinger(): void {
    if (this.reverse.hasFinger() === false && this.regular.hasFinger() === false) {
      if (this.reverse.hasChildren()) this.reverse.initFinger(this.skinParam, false, this.atomOps);

      if (this.reverse.hasFinger() === false || this.regular.hasChildren())
        this.regular.initFinger(this.skinParam, true, this.atomOps);

      if (this.reverse.hasFinger() && this.regular.hasFinger()) this.reverse.doNotDrawFirstPhalanx();
    }
  }

  /** @see MindMap.java:77-92 */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    this.computeFinger();
    const y1 = this.regular.getHalfThickness(stringBounder);
    const y2 = this.reverse.getHalfThickness(stringBounder);
    const y = Math.max(y1, y2);

    const width = this.reverse.getX12(stringBounder) + this.regular.getX12(stringBounder);
    const height =
      y + Math.max(this.reverse.getHalfThickness(stringBounder), this.regular.getHalfThickness(stringBounder));
    if (this.skinParam.getRankdir() === Rankdir.TOP_TO_BOTTOM) return new XDimension2D(height, width);
    else return new XDimension2D(width, height);
  }

  /** @see MindMap.java:94-113 */
  drawU(ug: UGraphic): void {
    if (this.reverse.hasRoot() === false && this.regular.hasRoot() === false) return;

    this.computeFinger();

    const stringBounder = ug.getStringBounder();
    const y1 = this.regular.getHalfThickness(stringBounder);
    const y2 = this.reverse.getHalfThickness(stringBounder);
    const y = Math.max(y1, y2);

    const x = this.reverse.getX12(stringBounder);
    let translated: UGraphic;
    if (this.skinParam.getRankdir() === Rankdir.TOP_TO_BOTTOM) translated = ug.apply(new UTranslate(y, x));
    else translated = ug.apply(new UTranslate(x, y));
    this.regular.drawU(translated);
    this.reverse.drawU(translated);
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
