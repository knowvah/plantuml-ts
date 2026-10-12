import { Back } from '../../../core/klimt/Back.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { Fore } from '../../../core/klimt/Fore.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { AbstractElement } from './AbstractElement.js';
import { ElementMenuEntry } from './ElementMenuEntry.js';
import { ElementMenuPopup } from './ElementMenuPopup.js';

/** The gap after every bar entry. @see ElementMenuBar.java:95, 113 */
const ENTRY_GAP = 10;
/** The z-index the bar and its entries draw at. @see ElementMenuBar.java:107 */
const BAR_Z_INDEX = 0;
/** The z-index the popups draw at. @see ElementMenuBar.java:118 */
const POPUP_Z_INDEX = 1;

/**
 * ElementMenuBar — a `{*` menu bar: its entries left to right on a `#DDD`
 * strip at z-index 0, then every popup under its entry at z-index 1.
 *
 * `popups` is a `Map`, iterated in insertion order. Upstream's is a
 * `HashMap` keyed by entries with identity hash codes (no `hashCode`
 * override, ElementMenuEntry.java:50), so the jar's popup draw order is
 * unspecified and changes run to run; insertion order is one of the orders
 * the jar produces.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementMenuBar.java:51-131
 */
export class ElementMenuBar extends AbstractElement {
  /** @see ElementMenuBar.java:53 */
  private readonly entries: ElementMenuEntry[] = [];
  /** @see ElementMenuBar.java:54 */
  private readonly popups = new Map<ElementMenuEntry, ElementMenuPopup>();
  /** @see ElementMenuBar.java:55 */
  private readonly font: UFont;
  /** @see ElementMenuBar.java:56 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementMenuBar.java:58-61 */
  constructor(font: UFont, spriteContainer: ISkinSimple) {
    super();
    this.font = font;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementMenuBar.java:63-65 */
  addEntry(s: string): void {
    this.entries.push(new ElementMenuEntry(s, this.font, this.spriteContainer));
  }

  /** Throws `IllegalArgumentException` when `s` names no entry (`getElementMenuEntry`).
   *  @see ElementMenuBar.java:67-70 */
  addSubEntry(s: string, sub: string): void {
    const popup = this.getPopup(this.getElementMenuEntry(s));
    popup.addEntry(sub);
  }

  /** @see ElementMenuBar.java:72-79 */
  private getPopup(s: ElementMenuEntry): ElementMenuPopup {
    let popup = this.popups.get(s);
    if (popup === undefined) {
      popup = new ElementMenuPopup(this.font, this.spriteContainer);
      this.popups.set(s, popup);
    }
    return popup;
  }

  /** @see ElementMenuBar.java:81-88 */
  private getElementMenuEntry(n: string): ElementMenuEntry {
    for (const entry of this.entries) {
      if (entry.getText() === n) {
        return entry;
      }
    }
    throw new Error('IllegalArgumentException');
  }

  /** @see ElementMenuBar.java:90-99 */
  getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    let w = 0;
    let h = 0;
    for (const entry of this.entries) {
      const dim = entry.getPreferredDimension(stringBounder, x, y);
      w += dim.getWidth() + ENTRY_GAP;
      h = Math.max(h, dim.getHeight());
    }
    return new XDimension2D(w, h);
  }

  /** @see ElementMenuBar.java:101-130 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void {
    const preferred = this.getPreferredDimension(ug.getStringBounder(), 0, 0);

    ug = ug.apply(new Fore(this.getBlack().asPaint()));

    if (zIndex === BAR_Z_INDEX) {
      this.drawBar(ug, zIndex, dimToUse);
      return;
    }

    if (zIndex === POPUP_Z_INDEX) {
      this.drawPopups(ug, zIndex, preferred);
    }
  }

  /** The `zIndex == 0` branch, split out for the complexity limit.
   *  @see ElementMenuBar.java:106-115 */
  private drawBar(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void {
    let x1 = 0;
    ug.apply(new Back(this.getColorDD().asPaint())).draw(URectangle.build(dimToUse.getWidth(), dimToUse.getHeight()));
    for (const entry of this.entries) {
      entry.drawU(ug.apply(UTranslate.dx(x1)), zIndex, dimToUse);
      const w = entry.getPreferredDimension(ug.getStringBounder(), x1, 0).getWidth();
      entry.setX(x1);
      x1 += w + ENTRY_GAP;
    }
  }

  /** The `zIndex == 1` branch, split out for the complexity limit.
   *  @see ElementMenuBar.java:119-128 */
  private drawPopups(ug: UGraphic, zIndex: number, preferred: XDimension2D): void {
    for (const entry of this.popups.keys()) entry.setBackground(this.getColorBB());

    const y1 = preferred.getHeight();
    for (const [key, p] of this.popups) {
      const xpopup = key.getX();
      p.drawU(ug.apply(new UTranslate(xpopup, y1)), zIndex, p.getPreferredDimension(ug.getStringBounder(), xpopup, y1));
    }
  }
}
