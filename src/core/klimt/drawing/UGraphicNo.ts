import type { UChange } from '../UChange.js';
import type { UGraphic } from '../UGraphic.js';
import type { UShape } from '../UShape.js';
import type { UParam } from '../UParam.js';
import { UStroke } from '../UStroke.js';
import { UTranslate } from '../UTranslate.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { UGroup } from '../shape/UGroup.js';

/**
 * UGraphicNo — abstract no-op `UGraphic` base: everything a
 * measurement-only subclass (this port's sole subclass, `LimitFinder`)
 * does NOT need to override. Concrete subclasses supply `apply`/`draw`.
 *
 * Upstream: klimt/drawing/UGraphicNo.java, `implements UGraphic`. Ported
 * (matching OUR narrower `UGraphic` interface surface — see the scope
 * note on `UGraphic.ts`): the `stringBounder`/`translate` fields +
 * constructor, `getStringBounder()`, `getTranslate()` (upstream declares
 * this `protected final`; kept public here because OUR `UGraphic`
 * interface — unlike upstream's — declares `getTranslate()` as a public
 * interface member directly, not only on `AbstractCommonUGraphic`), and
 * `getParam()` (upstream returns `new UParamNull()`; this port has no
 * `UParamNull.ts`, so the same all-black/simple-stroke/zero-translate
 * defaults are inlined here as a plain object literal, mirroring how
 * `AbstractCommonUGraphic#getParam` already builds its `UParam` inline).
 *
 * NOT ported (upstream `UGraphic` members with no counterpart on OUR
 * narrower `UGraphic` interface — omitted per this task's explicit scope
 * note, "where upstream methods don't exist in our interface, omit and
 * document"):
 * - `startUrl`/`closeUrl` — need `Url`, not ported.
 * - `getColorMapper()` — needs `ColorMapper`, not ported.
 * - `getDefaultBackground()` — needs `HColor`/`HColors`, not ported.
 * - `flushUg()` — no counterpart; this port's renderers have no
 *   flush-buffering concept.
 * - `matchesProperty(String)` — needs `StringBounder#matchesProperty`,
 *   which this port's narrower `StringBounder` interface (see
 *   `StringBounder.ts`) does not carry.
 * - `writeToStream(OutputStream, ...)` — N/A for a browser-safe,
 *   SVG-string-returning renderer (no Node `OutputStream` equivalent).
 */
export abstract class UGraphicNo implements UGraphic {
  private readonly stringBounder: StringBounder;
  private readonly translate: UTranslate;

  protected constructor(stringBounder: StringBounder, translate: UTranslate) {
    this.stringBounder = stringBounder;
    this.translate = translate;
  }

  abstract apply(change: UChange): UGraphic;
  abstract draw(shape: UShape): void;

  /**
   * No-ops, verbatim from upstream — `UGraphicNo.java:75-77,84-86` both have
   * empty bodies. A group is a DOM-wrapping concern (`UGraphicSvg` emits the
   * `<g>`); a measuring UGraphic has nothing to wrap, so ignoring them is
   * the faithful behaviour, not a stub.
   *
   * Previously omitted here, and this file's own header said so, on the
   * grounds that `UGroup` was "not wired through `UGraphic`". That is still
   * true — `startGroup`/`closeGroup` are duck-typed extras this port narrows
   * to via `requireGroups`, not members of the `UGraphic` interface — but
   * omitting them made `LimitFinder` (which extends this class) fail
   * `requireGroups` and so unable to walk any `EntityImageDescription`,
   * which calls `startGroup` unconditionally. Upstream's own
   * `TextBlockUtils.getMinMax` walks exactly those images with exactly this
   * class, so the omission was the divergence.
   *
   * The `group` parameter is deliberately unused, matching upstream.
   */
  startGroup(_group: UGroup): void {
    /* upstream: empty */
  }

  closeGroup(): void {
    /* upstream: empty */
  }

  getParam(): UParam {
    return {
      getStroke: () => UStroke.simple(),
      getColor: () => 'black',
      getBackcolor: () => 'black',
      getTranslate: () => UTranslate.none(),
    };
  }

  getStringBounder(): StringBounder {
    return this.stringBounder;
  }

  getTranslate(): UTranslate {
    return this.translate;
  }
}
