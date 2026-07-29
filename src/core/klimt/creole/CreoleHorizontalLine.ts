/**
 * CreoleHorizontalLine — the drawable `Atom` a creole `--...--`/`==...==`/
 * `..'..`/bare-`====` separator line becomes: a bare infinite horizontal
 * rule when the line carries no captured label, or (once unblocked — see
 * below) an infinite rule with a centered label built through the real
 * creole Sheet/Stripe pipeline.
 *
 * Upstream: klimt/creole/CreoleHorizontalLine.java. Ported: the `create`
 * static factory + private constructor, `getHorizontalLine` (the
 * length===0/length>0 dispatch), `drawU`, `calculateDimensionSlow` (the
 * length===0 fast path: `new XDimension2D(10, 10)`), `getStartingAltitude`
 * (always 0).
 *
 * ## `getTitle()`'s non-empty-line branch is a cited, throwing seam
 *
 * `getTitle()`'s `line.length() > 0` branch needs `Display.getWithNewlines
 * (skinParam.getPragma(), line)`. `Display` (klimt/creole/Display.java,
 * 796 lines) is `SheetBuilder.ts`'s own documented seam — "T9c's own
 * target, gated on this file" — still unported as of this task. Reaching
 * it also needs `skinParam.getPragma()`, which `ISkinSimple.ts` (T9a)
 * deliberately omits ("zero callers reachable from this task" — this task
 * is the first real caller, but widening `ISkinSimple.ts` is outside this
 * task's write-set, so it stays cited rather than silently added). Per
 * the ADR-8 corollary this is a genuinely large, separable follow-on, not
 * a silent drop: the length===0 fast path — the ONLY shape
 * `CreoleStripeSimpleParser.ts#classifyStripeLine` can produce today (a
 * non-empty capture classifies as `LITERAL`, not `HORIZONTAL_LINE` — see
 * that file's own doc comment) — is fully faithful and reachable; the
 * labelled-separator branch throws a cited error instead of silently
 * returning wrong output or being stubbed away. Nothing in this port
 * constructs a `CreoleHorizontalLine` with a non-empty `line` yet, so
 * this is a build/test-time signal only.
 *
 * Whoever de-seams this (after `Display` lands) will also need to thread
 * an `AtomOps` bundle (`Sea.ts`) into this class's constructor as an
 * EXTRA, LAST-positioned parameter, matching `SheetBlock1.ts`'s own
 * precedent — the real `getTitle()` body constructs `new SheetBlock1
 * (sheet, LineBreakStrategy.NONE, atomOps, skinParam.getPadding())`, and
 * this port's `SheetBlock1` requires that bundle where upstream's virtual
 * `Atom` dispatch needed none.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/CreoleHorizontalLine.java
 */
import { AbstractAtom } from './atom/AbstractAtom.js';
import { UHorizontalLine } from '../shape/UHorizontalLine.js';
import { TextBlockUtils } from '../shape/TextBlockUtils.js';
import { UTranslate } from '../UTranslate.js';
import { XDimension2D } from '../geom/XDimension2D.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { FontConfiguration } from '../shape/UText.js';
import type { ISkinSimple } from '../../style/ISkinSimple.js';
import type { Atom } from './SheetBlock1.js';

const DEFAULT_THICKNESS = 1;

/** One labelled, cited "blocked on the unported Display layer" seam —
 *  thrown, never silently dropped or stubbed to wrong output (ADR-8
 *  corollary). Mirrors `legacy/CreoleParser.ts`'s own `blockedOnSibling`
 *  helper (private to that module, not reused across files). */
function blockedOnDisplay(line: string, fontConfiguration: FontConfiguration): Error {
  return new Error(
    `CreoleHorizontalLine.getTitle: a labelled separator (line="${line}", ` +
      `font=${fontConfiguration.family}/${fontConfiguration.size}) needs ` +
      `Display.getWithNewlines(...) -- klimt/creole/Display.java (796 lines) ` +
      `is not yet ported (SheetBuilder.ts's own documented seam, T9c's ` +
      `target -- batch-3a/T10a, ADR-8 corollary: flagged as a genuinely ` +
      `large, separable follow-on, not silently dropped or stubbed -- see ` +
      `.agent-notes/T10a-separator-primitives.md). Nothing in this port ` +
      `constructs a CreoleHorizontalLine with a non-empty line yet -- ` +
      `CreoleStripeSimpleParser.ts's classifyStripeLine only produces ` +
      `HORIZONTAL_LINE for an EMPTY captured label; a non-empty one ` +
      `classifies as LITERAL instead (see that file's own doc comment).`,
  );
}

export class CreoleHorizontalLine extends AbstractAtom implements Atom {
  private readonly fontConfiguration: FontConfiguration;
  private readonly line: string;
  private readonly style: string;
  private readonly skinParam: ISkinSimple;

  static create(
    fontConfiguration: FontConfiguration,
    line: string,
    style: string,
    skinParam: ISkinSimple,
  ): CreoleHorizontalLine {
    return new CreoleHorizontalLine(fontConfiguration, line, style, skinParam);
  }

  private constructor(fontConfiguration: FontConfiguration, line: string, style: string, skinParam: ISkinSimple) {
    super();
    this.fontConfiguration = fontConfiguration;
    this.line = line;
    this.style = style;
    this.skinParam = skinParam;
  }

  private getHorizontalLine(): UHorizontalLine {
    if (this.line.length === 0) return UHorizontalLine.infinite(DEFAULT_THICKNESS, 0, 0, this.style);

    // Coverage note: this branch is unreachable by construction TODAY, not
    // untested -- `drawU` always calls `calculateDimension` (line 116)
    // BEFORE reaching `getHorizontalLine`, and `calculateDimensionSlow`
    // reaches this SAME `getTitle()` seam first for any non-empty line, so
    // execution always throws before this line runs. It becomes reachable
    // (and testable) the moment `getTitle()`'s Display seam above is
    // unblocked.
    const tb = this.getTitle();
    return UHorizontalLine.infinite(DEFAULT_THICKNESS, 0, 0, this.style, tb);
  }

  private getTitle(): TextBlock {
    if (this.line.length === 0) return TextBlockUtils.empty(0, 0);
    // this.skinParam would build the real Sheet here once Display lands --
    // see the class doc comment for the exact call shape.
    throw blockedOnDisplay(this.line, this.fontConfiguration);
  }

  drawU(ug: UGraphic): void {
    const dim = this.calculateDimension(ug.getStringBounder());
    const target = ug.apply(UTranslate.dy(dim.getHeight() / 2));
    target.draw(this.getHorizontalLine());
  }

  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    if (this.line.length === 0) return new XDimension2D(10, 10);

    const tb = this.getTitle();
    return tb.calculateDimension(stringBounder);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }
}
