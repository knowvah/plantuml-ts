/**
 * Check — the url-package junit-mode flag: once `goJunit()` is called,
 * `Url#getCoords` treats an empty visibility box as a hard error instead
 * of silently emitting a degenerate `0,0,0,0` link region. One-way by
 * design (upstream has no reset).
 *
 * Upstream: url/Check.java — ported in full (both members).
 *
 * Naming deviation (reported): Java holds the flag in a field also named
 * `isJunit`; a TS class cannot carry a field and a method of the same
 * name, so the field is `isJunitFlag` (behavior unchanged).
 */
export class Check {
  private static isJunitFlag = false;

  /** @see net/sourceforge/plantuml/url/Check.java#goJunit */
  static goJunit(): void {
    Check.isJunitFlag = true;
  }

  /** @see net/sourceforge/plantuml/url/Check.java#isJunit */
  static isJunit(): boolean {
    return Check.isJunitFlag;
  }
}
