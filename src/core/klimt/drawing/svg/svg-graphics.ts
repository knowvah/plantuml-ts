/**
 * svg-graphics.ts — the single upstream-named `SvgGraphics` entry point.
 * Split boundary #4 of 4 for SvgGraphics.java — see
 * `svg-graphics-core.ts`'s doc comment for the full split rationale and
 * file-by-file breakdown. This file assembles the chain
 * (`SvgGraphicsCore` → `SvgGraphicsShadow` → `SvgGraphicsElements` →
 * `SvgGraphics`) and adds the group/link management, comment/metadata
 * emission, and the D3′ throwing stubs.
 *
 * D3′ stubs (images, sprites — out of scope, throw a message naming D3′):
 * `svgImage` (one method covering both upstream overloads —
 * `PortableImage` and `UImageSvg` — plus `svgImageUnsecure`, none of
 * which are ported; sprites route through `svgImage` upstream too, so no
 * separate sprite method exists to stub).
 *
 * cdd-T28: `openLink`/`closeLink` and `LinkData` ARE ported now (they
 * were D3′ stubs). `AtomText#drawU` opens a url around its runs
 * (`klimt/creole/legacy/AtomText.java:197-198,235-236` ->
 * `UGraphicSvg#startUrl`, java:159-162 -> `SvgGraphics#openLink`,
 * java:1227-1239), which is how the jar wraps a creole `[[url label]]`
 * in `<a target="_top" href=…>` — visible in
 * `test-results/dot-cache/activity/letare-59-gore448/in.svg`'s legend and
 * unreachable in this port while the stub threw.
 *
 * D3′ extended (this task's own finding, not in the mission brief's D3′
 * list, applying the same throw-with-citation treatment): `getMetadataHex`
 * / `addCommentMetadata`. Upstream's `getMetadataHex` calls
 * `TranscoderUtil.getDefaultTranscoderProtected().encode(comment)` — the
 * deflate+base64 diagram-source encoder used for the `<?plantuml-src ...?>`
 * click-to-edit PI. `TranscoderUtil` is not part of this task's read-set
 * and is not ported anywhere in this codebase yet, so both throw citing
 * "D3-prime (extended)" rather than silently no-op-ing a metadata feature.
 *
 * NOT ported (out of scope, reported once for the whole class — see the
 * other three files for their own NOT-ported notes): `drawPathIterator`
 * (`svg-graphics-elements.ts`, AWT `PathIterator` dependency); the
 * multi-stop-gradient `createSvgGradient(HColorLinearGradient,
 * ColorMapper)` overload, `buildLinearGradientKey`, `formatPercent`,
 * `formatOpacity` (`svg-graphics-core.ts`, no `HColorLinearGradient`
 * representation in this klimt port's Paint-for-HColor seam).
 *
 * `activeLinks` carries the open-link stack upstream's
 * `closeTopActiveLinkIfNeeded`/`addTopOpenedLinkIfNeeded` guards read —
 * SVG forbids a nested `<a>`, so only the topmost link is ever pending
 * (upstream's own note, java:1178-1182).
 */

import { SvgGraphicsElements } from './svg-graphics-elements.js';
import type { XmlNode } from './xml-writer.js';
import { UGroupType } from '../../shape/UGroup.js';
import { ignoreThisLink } from '../../../security/SecurityUtils.js';

export type { SvgOption } from './svg-graphics-core.js';
// LengthAdjust/TransparentFillBehavior are as-const objects (a value AND
// a type under the same name) — re-exported as values so `LengthAdjust
// .SPACING` etc. remain usable through this single entry point, not just
// their type.
export { basicSvgOption, LengthAdjust, TransparentFillBehavior } from './svg-graphics-core.js';
export type { TextOptions, RectangleGeometry } from './svg-graphics-elements.js';

/** Upstream: `SvgGraphics.META_HEADER`. */
export const META_HEADER = '<!--SRC=[';

/**
 * Upstream: `SvgGraphics.getMetadataHex(String)`. D3′ (extended) throwing
 * stub — see the module doc comment above.
 */
export function getMetadataHex(_comment: string): string {
  throw new Error('deferred per D3-prime (extended): metadata encoding requires TranscoderUtil, not ported');
}

/**
 * SvgGraphics — see the module doc comment above.
 *
 * Upstream: `SvgGraphics.java`. Ported in full: `closeTopPendingElement`,
 * `closeTopActiveLinkIfNeeded`, `addTopOpenedLinkIfNeeded`, `closeGroup`,
 * `startGroup`, `addComment`, `addCommentMetadata` (throws — see above).
 */
/**
 * Upstream: `SvgGraphics.LinkData` (a private nested class, java:1130-1175)
 * — the `<a>` element's attribute set, in upstream's own order: `target`,
 * `href`, `xlink:href`, `xlink:type="simple"`, `xlink:actuate="onRequest"`,
 * `xlink:show="new"`, `title`, `xlink:title`. The identical set is already
 * jar-verified byte-exact by `core/svg.ts#linkWrap` (the string-emitting
 * path every non-klimt engine uses); this is the XmlNode-emitting twin, so
 * the two agree by construction.
 *
 * `getXlinkTitle` (java:1147-1161) decodes `<U+XXXX>` escapes in the
 * tooltip and turns a literal `\n` into a real newline, falling back to
 * the url when no tooltip was given.
 */
class LinkData {
  private readonly url: string;
  constructor(
    url: string,
    private readonly title: string | null,
    private readonly target: string,
  ) {
    // java:1136-1140 — javascript: security issue.
    this.url = ignoreThisLink(url) ? '' : url;
  }

  private getXlinkTitle(): string {
    if (this.title === null) return this.url;
    return this.title
      .replace(/<U\+([0-9A-Fa-f]+)>/g, (_m, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
      .replace(/\\n/g, '\n');
  }

  /** java:1163-1174. */
  updateAttributesOf(element: XmlNode): void {
    const title = this.getXlinkTitle();
    element.setAttribute('target', this.target);
    element.setAttribute('href', this.url);
    element.setAttribute('xlink:href', this.url);
    element.setAttribute('xlink:type', 'simple');
    element.setAttribute('xlink:actuate', 'onRequest');
    element.setAttribute('xlink:show', 'new');
    element.setAttribute('title', title);
    element.setAttribute('xlink:title', title);
  }
}

export class SvgGraphics extends SvgGraphicsElements {
  /** java:1184 — the open-link stack; SVG forbids nested `<a>`, so at most
   *  one entry is ever pending as `pendingElements[0]`. */
  private readonly activeLinks: LinkData[] = [];

  private closeTopPendingElement(): void {
    const element = this.pendingElements[0]!;
    this.pendingElements.shift();
    if (element.getFirstChild() !== null) this.getG().appendChild(element);
  }

  /** java:1202-1215. */
  private closeTopActiveLinkIfNeeded(): void {
    if (this.activeLinks.length > 0) {
      if (this.pendingElements[0]?.getTagName() !== 'a') {
        throw new Error('Expected top pending element to be a link.');
      }
      this.closeTopPendingElement();
    }
    for (const elt of this.pendingElements) {
      if (elt.getTagName() === 'a') throw new Error('closeTopActiveLinkIfNeeded: invalid state');
    }
  }

  /** java:1222-1228. */
  private addTopOpenedLinkIfNeeded(): void {
    if (this.activeLinks.length === 0) return;
    const link = this.activeLinks[0]!;
    const element = this.document.createElement('a');
    this.pendingElements.unshift(element);
    link.updateAttributesOf(element);
  }

  /** java:1233-1245. `target` defaults to `_top` at the call site
   *  (`SkinParam.java:1082`, `getValue("svglinktarget", "_top")`). */
  openLink(url: string, title: string | null, target: string): void {
    this.closeTopActiveLinkIfNeeded();
    this.activeLinks.unshift(new LinkData(url, title, target));
    this.addTopOpenedLinkIfNeeded();
  }

  /** java:1251-1264. */
  closeLink(): void {
    if (this.pendingElements.length === 0 || this.activeLinks.length === 0) {
      throw new Error('Attempting to close a link in an invalid state.');
    }
    if (this.pendingElements[0]!.getTagName() !== 'a') {
      throw new Error('Attempting to close a link in an invalid state.');
    }
    this.closeTopActiveLinkIfNeeded();
    this.activeLinks.shift();
    this.addTopOpenedLinkIfNeeded();
  }

  /** Upstream: `closeGroup()`. */
  closeGroup(): void {
    if (this.pendingElements.length === 0) throw new Error('closeGroup: no pending element');
    this.closeTopActiveLinkIfNeeded();
    this.closeTopPendingElement();
    this.addTopOpenedLinkIfNeeded();
  }

  /** Upstream: `startGroup(Map<UGroupType, String>)`. */
  startGroup(typeIdents: ReadonlyMap<UGroupType, string>): void {
    if (typeIdents.size === 0) throw new Error('startGroup: typeIdents must not be empty');
    this.closeTopActiveLinkIfNeeded();
    this.pendingElements.unshift(this.document.createElement('g'));
    for (const [key, value] of typeIdents) {
      this.document.applyGroupAttribute(this.pendingElements[0]!, key, value);
    }
    this.addTopOpenedLinkIfNeeded();
  }

  /** Upstream: `addComment(String)`. */
  addComment(comment: string): void {
    this.getG().appendComment(comment);
  }

  /** Upstream: `addCommentMetadata(String)`. Throws via `getMetadataHex`
   * (D3′ extended) — see the module doc comment above. */
  addCommentMetadata(metadata: string): void {
    const signature = getMetadataHex(metadata);
    this.getG().appendProcessingInstruction('plantuml-src', signature);
  }

  /**
   * D3′ throwing stub covering both upstream `svgImage` overloads
   * (`PortableImage`, `UImageSvg`) and `svgImageUnsecure` — see the
   * module doc comment above. When this deferral lifts, fetched SVG that
   * is inlined here (upstream splices it raw, `SvgGraphics.java:790-797`)
   * must pass through `src/core/svg-sanitize.ts#sanitizeSvg` first — that
   * function exists for exactly this call site
   * (`plans/svg-attribute-escaping-audit/decisions.md` D6).
   */
  svgImage(..._args: readonly unknown[]): void {
    throw new Error('deferred per D3-prime: image embedding (PNG/inline SVG base64) not yet ported');
  }
}

// Re-exported so callers building a `<g>` attribute map for `startGroup`
// don't need a separate import from `../../shape/UGroup.js`.
export { UGroupType };
export type { XmlNode };
