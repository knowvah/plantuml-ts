import { PrintScale } from '../core/PrintScale.js';

/**
 * TimeScaleConfigData -- print scale, scale factor and hide-closed flag.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:35-79
 */
export class TimeScaleConfigData {
  #printScale: PrintScale = PrintScale.DAILY;
  #factorScale = 1.0;
  #hideClosed = false;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:41-43 */
  public getPrintScale(): PrintScale {
    return this.#printScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:45-47 */
  public getFactorScale(): number {
    return this.#factorScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:49-51 */
  public getEffectiveScale(): number {
    return this.#printScale.getDefaultScale() * this.#factorScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:53-55 */
  public isHideClosed(): boolean {
    return this.#hideClosed;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:59-61 */
  public setPrintScale(printScale: PrintScale): void {
    this.#printScale = printScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:63-65 */
  public setFactorScale(factorScale: number): void {
    this.#factorScale = factorScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:67-69 */
  public setHideClosed(hideClosed: boolean): void {
    this.#hideClosed = hideClosed;
  }
}
