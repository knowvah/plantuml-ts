import type { UChange } from '../UChange.js';
import type { UShape } from '../UShape.js';
import type { UGraphic } from '../UGraphic.js';
import type { UParam } from '../UParam.js';
import type { UTranslate } from '../UTranslate.js';
import type { UGroup } from '../shape/UGroup.js';
import type { StringBounder } from '../font/StringBounder.js';
import { ColorMapper } from '../color/ColorMapper.js';

/**
 * UGraphicDelegator — a `UGraphic` that forwards every read-only member
 * to a wrapped `ug`, leaving `apply` abstract for a subclass to
 * intercept (`AbstractUGraphicHorizontalLine` is the one concrete
 * subclass this port needs).
 *
 * Upstream: klimt/drawing/UGraphicDelegator.java — delegates
 * `matchesProperty`, `getStringBounder`, `getParam`, `draw`,
 * `getColorMapper`, `startUrl`/`closeUrl`, `startGroup`/`closeGroup`,
 * `flushUg`, `getDefaultBackground`, `writeToStream`; `apply` is NOT
 * implemented (inherited abstract from the `UGraphic` interface).
 *
 * Scope reduction (this task — matches T2's own `UGraphic` interface
 * scope, `UGraphic.ts`): this port's `UGraphic` has only 5 members
 * (`apply`, `draw`, `getParam`, `getTranslate`, `getStringBounder`).
 * Delegated here: `getStringBounder`, `getParam`, `draw`, `getTranslate`
 * (T2's own addition, delegated the same way), and `getColorMapper`
 * (sep-T5c, java:79-81). `matchesProperty`/`flushUg`/`getDefaultBackground`/
 * `writeToStream` are dropped — none is
 * part of this port's `UGraphic` surface, matching every prior scope
 * reduction in this file family.
 *
 * cdd-T28: `startUrl`/`closeUrl` (java:84-91) ARE delegated now. They are
 * still not on this port's `UGraphic` interface — `UGraphicSvg` is the
 * only implementor that can emit an `<a>`, and callers duck-type for the
 * pair (`annotations/blocks-creole.ts#urlCapable`, the same shape
 * `skin/VisibilityModifier.ts` uses for `startGroup`/`closeGroup`). But a
 * DELEGATOR must forward what it wraps, or the capability disappears the
 * moment a decorator is in the chain: `SheetBlock2#drawU` always wraps its
 * graphic in `UGraphicStencil` (a subclass of this class), so without
 * these two methods no creole `[[url label]]` inside a `Sheet` could ever
 * reach `UGraphicSvg#startUrl`.
 *
 * sdd3-T8p: `startGroup`/`closeGroup` (java:88-94) ARE delegated now, the
 * same duck-typed way: `ComponentRoseLine.java:80` /
 * `ComponentRoseActiveLine.java:78` open a titled group on the graphic they
 * are handed, which under handwritten mode is a `UGraphicHandwritten` (a
 * subclass of this class), so a decorator that dropped the pair would lose
 * the lifeline's `<g><title>`. Pure addition: no engine reaches it today.
 */
export abstract class UGraphicDelegator implements UGraphic {
  private readonly ug: UGraphic;

  constructor(ug: UGraphic) {
    this.ug = ug;
  }

  abstract apply(change: UChange): UGraphic;

  getStringBounder(): StringBounder {
    return this.ug.getStringBounder();
  }

  getParam(): UParam {
    return this.ug.getParam();
  }

  draw(shape: UShape): void {
    this.ug.draw(shape);
  }

  getTranslate(): UTranslate {
    return this.ug.getTranslate();
  }

  /** The wrapped graphic's mapper; `IDENTITY` when it has none (see
   *  `UGraphic.ts#getColorMapper`).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/UGraphicDelegator.java:79-81 */
  getColorMapper(): ColorMapper {
    return this.ug.getColorMapper?.() ?? ColorMapper.IDENTITY;
  }

  /** java:84-86 — forwarded only when the wrapped graphic can emit a
   *  link (see this module's doc comment); a measuring or limit-finding
   *  graphic legitimately cannot, and silently drawing without the `<a>`
   *  is what upstream's non-SVG drivers do too. */
  startUrl(url: { readonly url: string; readonly tooltip: string }): void {
    const target = this.ug as Partial<{ startUrl(u: typeof url): void }>;
    target.startUrl?.(url);
  }

  /** java:88-91. */
  closeUrl(): void {
    const target = this.ug as Partial<{ closeUrl(): void }>;
    target.closeUrl?.();
  }

  /** java:88-90 — forwarded only when the wrapped graphic can open a group
   *  (`UGraphicSvg`); the same duck-typing as {@link startUrl}. */
  startGroup(group: UGroup): void {
    const target = this.ug as Partial<{ startGroup(g: UGroup): void }>;
    target.startGroup?.(group);
  }

  /** java:92-94. */
  closeGroup(): void {
    const target = this.ug as Partial<{ closeGroup(): void }>;
    target.closeGroup?.();
  }

  protected getUg(): UGraphic {
    return this.ug;
  }
}
