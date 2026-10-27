/**
 * DisplayConfigData -- footbox / resource-name display flags. Upstream's
 * commented-out `labelStrategy` is not ported (it is dead upstream).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:33-82
 */
export class DisplayConfigData {
  #showFootbox = true;
  #hideResourceName = false;
  #hideResourceFootbox = false;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:44-46 */
  public isShowFootbox(): boolean {
    return this.#showFootbox;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:48-50 */
  public isHideResourceName(): boolean {
    return this.#hideResourceName;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:52-54 */
  public isHideResourceFootbox(): boolean {
    return this.#hideResourceFootbox;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:62-64 */
  public setShowFootbox(showFootbox: boolean): void {
    this.#showFootbox = showFootbox;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:66-68 */
  public setHideResourceName(hideResourceName: boolean): void {
    this.#hideResourceName = hideResourceName;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:70-72 */
  public setHideResourceFootbox(hideResourceFootbox: boolean): void {
    this.#hideResourceFootbox = hideResourceFootbox;
  }
}
