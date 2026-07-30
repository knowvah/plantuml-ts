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
 * ## T9c: `getTitle()`'s non-empty-line seam closed
 *
 * T10a's own seam needed exactly two things: `Display.getWithNewlines`
 * (T9c's own target) and `ISkinSimple.getPragma()` (landed alongside
 * T10b, required per that file's own doc comment). Both now exist, so
 * `getTitle()`'s `line.length() > 0` branch constructs the real
 * `SheetBuilder`/`Sheet`/`SheetBlock1` chain
 * (`skinParam.sheet(fontConfiguration, HorizontalAlignment.LEFT,
 * CreoleMode.FULL).createSheet(Display.getWithNewlines(skinParam
 * .getPragma(), line))`) exactly like upstream. The constructor gains an
 * EXTRA, LAST-positioned `atomOps: AtomOps` parameter (`SheetBlock1.ts`'s
 * own established precedent).
 *
 * This branch stays UNREACHABLE IN PRACTICE (a pure addition):
 * `CreoleStripeSimpleParser.ts#classifyStripeLine` only ever produces
 * `HORIZONTAL_LINE` for an EMPTY captured label — a non-empty capture
 * classifies as `LITERAL` instead (that file's own doc comment, a
 * jar-verified, deliberate divergence). Flipping that classification is
 * S1L-i's root cause and is explicitly OFF-LIMITS to this task (it would
 * alter live rendering in `EntityImageDescriptionSupport.ts`, ADR-6). So
 * closing this seam here is real, tested code that nothing yet calls.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/CreoleHorizontalLine.java
 */
import { AbstractAtom } from './atom/AbstractAtom.js';
import { UHorizontalLine } from '../shape/UHorizontalLine.js';
import { TextBlockUtils } from '../shape/TextBlockUtils.js';
import { UTranslate } from '../UTranslate.js';
import { XDimension2D } from '../geom/XDimension2D.js';
import { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import { CreoleMode } from './CreoleMode.js';
import { Display } from './Display.js';
import { SheetBlock1 } from './SheetBlock1.js';
import { LineBreakStrategy } from '../LineBreakStrategy.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { FontConfiguration } from '../shape/UText.js';
import type { ISkinSimple } from '../../style/ISkinSimple.js';
import type { Atom } from './SheetBlock1.js';
import type { AtomOps } from './Sea.js';
import type { Sheet } from './Sheet.js';
import type { CreoleAtom } from './atom/Atom.js';

const DEFAULT_THICKNESS = 1;

export class CreoleHorizontalLine extends AbstractAtom implements Atom {
  private readonly fontConfiguration: FontConfiguration;
  private readonly line: string;
  private readonly style: string;
  private readonly skinParam: ISkinSimple;
  private readonly atomOps: AtomOps;

  static create(
    fontConfiguration: FontConfiguration,
    line: string,
    style: string,
    skinParam: ISkinSimple,
    atomOps: AtomOps,
  ): CreoleHorizontalLine {
    return new CreoleHorizontalLine(fontConfiguration, line, style, skinParam, atomOps);
  }

  private constructor(fontConfiguration: FontConfiguration, line: string, style: string, skinParam: ISkinSimple, atomOps: AtomOps) {
    super();
    this.fontConfiguration = fontConfiguration;
    this.line = line;
    this.style = style;
    this.skinParam = skinParam;
    this.atomOps = atomOps;
  }

  private getHorizontalLine(): UHorizontalLine {
    if (this.line.length === 0) return UHorizontalLine.infinite(DEFAULT_THICKNESS, 0, 0, this.style);

    const tb = this.getTitle();
    return UHorizontalLine.infinite(DEFAULT_THICKNESS, 0, 0, this.style, tb);
  }

  /** java:78-83 -- both branches now real (T9c). The `Sheet<StripeAtom> ->
   *  Sheet<CreoleAtom>` cast mirrors `DisplayCreole.ts#getCreole`'s own
   *  documented, pre-existing `SheetBlock1.ts`/`CreoleParser.ts` type gap
   *  (see that file's own comment) -- not introduced here. */
  private getTitle(): TextBlock {
    if (this.line.length === 0) return TextBlockUtils.empty(0, 0);
    const parser = this.skinParam.sheet(this.fontConfiguration, HorizontalAlignment.LEFT, CreoleMode.FULL);
    const sheet = parser.createSheet(Display.getWithNewlines(this.skinParam.getPragma(), this.line)) as unknown as Sheet<CreoleAtom>;
    return new SheetBlock1(sheet, LineBreakStrategy.NONE, this.atomOps, this.skinParam.getPadding());
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
