import { BasicEnsureVisible } from '../klimt/geom/BasicEnsureVisible.js';
import type { EnsureVisible } from '../klimt/geom/EnsureVisible.js';
import { Check } from './Check.js';

/**
 * Url — a hyperlink attached to a diagram element: the target `url`, a
 * `tooltip`, a display `label`, plus the accumulated on-canvas bounding
 * box (`BasicEnsureVisible`) of everything drawn for it, which becomes
 * the clickable region.
 *
 * Upstream: url/Url.java — ported in full. The `__HAXE__` preprocessor
 * block (Url.java:53-59) is ported in its active (reverted) form:
 * tooltip falls back to the url only when null.
 *
 * `UrlBuilder` (traced, NOT pulled): Url.java has no dependency on
 * UrlBuilder — UrlBuilder is a CONSUMER (it parses `[[...]]` syntax and
 * constructs Urls). It joins whichever mission ports the command/label
 * parsing that calls it.
 *
 * `toString()` adaptation (reported): Java prefixes
 * `super.toString()` (the `Object` identity hash); TS has no
 * equivalent, so the class name literal is used. No caller parses
 * this debug string.
 */
export class Url implements EnsureVisible {
  private readonly url: string;
  private readonly tooltip: string;
  private readonly label: string;
  private member = false;

  /** @see net/sourceforge/plantuml/url/Url.java (constructor) */
  constructor(url: string, tooltip: string | null, label: string | null) {
    url = eventuallyRemoveStartingAndEndingDoubleQuote(url, '\x22') as string;
    this.url = url;
    if (tooltip === null) this.tooltip = url;
    else this.tooltip = tooltip;

    if (label === null || label.length === 0) this.label = url;
    else this.label = label;
  }

  /** @see net/sourceforge/plantuml/url/Url.java#isLatex(String) */
  static isLatex(pendingUrl: string): boolean {
    return pendingUrl.startsWith('latex://');
  }

  /** @see net/sourceforge/plantuml/url/Url.java#isLatex() */
  isLatex(): boolean {
    return Url.isLatex(this.url);
  }

  /** @see net/sourceforge/plantuml/url/Url.java#getUrl */
  getUrl(): string {
    return this.url;
  }

  /** @see net/sourceforge/plantuml/url/Url.java#getTooltip */
  getTooltip(): string {
    return this.tooltip;
  }

  /** @see net/sourceforge/plantuml/url/Url.java#getLabel */
  getLabel(): string {
    return this.label;
  }

  /** @see net/sourceforge/plantuml/url/Url.java#toString */
  toString(): string {
    return `Url ${this.url} ${this.visible.getCoords(1.0)}`;
  }

  /**
   * Upstream throws `IllegalStateException` when junit mode is on and the
   * box is still degenerate — a rendering pass forgot to report pixels.
   *
   * @see net/sourceforge/plantuml/url/Url.java#getCoords
   */
  getCoords(scale: number): string {
    if (Check.isJunit() && this.visible.getCoords(1.0).includes('0,0,0,0'))
      throw new Error(`IllegalStateException: ${this.toString()}`);

    return this.visible.getCoords(scale);
  }

  /** @see net/sourceforge/plantuml/url/Url.java#setMember */
  setMember(member: boolean): void {
    this.member = member;
  }

  /** @see net/sourceforge/plantuml/url/Url.java#isMember */
  isMember(): boolean {
    return this.member;
  }

  private readonly visible = new BasicEnsureVisible();

  /** @see net/sourceforge/plantuml/url/Url.java#ensureVisible */
  ensureVisible(x: number, y: number): void {
    this.visible.ensureVisible(x, y);
  }

  /** @see net/sourceforge/plantuml/url/Url.java#hasData */
  hasData(): boolean {
    return this.visible.hasData();
  }

  /**
   * Orders urls by the surface of their clickable box (image-map z-order:
   * smaller regions must be emitted on top of larger ones).
   *
   * @see net/sourceforge/plantuml/url/Url.java#SURFACE_COMPARATOR
   */
  static readonly SURFACE_COMPARATOR = (url1: Url, url2: Url): number => {
    const surface1 = url1.visible.getSurface();
    const surface2 = url2.visible.getSurface();
    if (surface1 > surface2) return 1;
    else if (surface1 < surface2) return -1;

    return 0;
  };
}

/**
 * The `StringUtils` slice `Url`'s constructor consumes (ADR-2 consumed-
 * slice pattern — the full `StringUtils.java` port is future missions'
 * work; move this there when it lands). Strips one pair of surrounding
 * quotes/parens/brackets/colons, but only the pair kinds present in
 * `format`.
 *
 * @see net/sourceforge/plantuml/StringUtils.java#eventuallyRemoveStartingAndEndingDoubleQuote(String,String)
 */
export function eventuallyRemoveStartingAndEndingDoubleQuote(
  s: string | null,
  format: string,
): string | null {
  if (s === null) return null;

  if (
    format.includes('\x22') &&
    s.length > 1 &&
    isDoubleQuote(s.charAt(0)) &&
    isDoubleQuote(s.charAt(s.length - 1))
  )
    return s.substring(1, s.length - 1);

  if (format.includes('(') && s.startsWith('(') && s.endsWith(')')) return s.substring(1, s.length - 1);

  if (format.includes('[') && s.startsWith('[') && s.endsWith(']')) return s.substring(1, s.length - 1);

  if (format.includes(':') && s.startsWith(':') && s.endsWith(':')) return s.substring(1, s.length - 1);

  // #lizard forgives -- faithful port of upstream's four format-gated
  // strip branches (StringUtils.java:63-81); the branch shape IS the
  // ported behavior (do-not-refactor-while-porting, CLAUDE.md).
  return s;
}

/** @see net/sourceforge/plantuml/StringUtils.java#isDoubleQuote */
function isDoubleQuote(c: string): boolean {
  return c === '\x22' || c === '“' || c === '”' || c === '«' || c === '»';
}
