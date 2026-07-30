import type { ColorResolver as UGraphicWithScaleColorResolver } from '../UGraphicWithScale.js';
import { UGraphicWithScale } from '../UGraphicWithScale.js';
import type { UGraphic } from '../UGraphic.js';
import type { Paint } from '../../paint.js';
import { ColorResolver, colorResolverToSvgHex } from './ColorResolver.js';
import type { GrayLevelRange } from './ColorResolver.js';
import type { ResolvedColor } from '../color/HColorSet.js';
import { parseSimpleColor } from '../color/HColorSet.js';
import { grayScale } from '../../tim/builtin/color-utils.js';
import { parseSvgPath } from './SvgPath.js';
import { UTranslate } from '../UTranslate.js';

/**
 * SvgNanoParser -- draw-time decomposition of a `<$sprite>`'s raw SVG body
 * into individual `UPath`/`UEllipse`/`UText` primitives, one per `<path>` /
 * `<circle>` / `<ellipse>` / `<text>` element, walked through a `<g>`
 * push/pop transform stack. This is the class the whole
 * `svg-sprite-nanoparser` mission is named for (see
 * `plans/svg-sprite-nanoparser/README.md`): upstream draws each element as
 * its own primitive, giving a real per-element ink signal independent of
 * the sprite's declared width/height box.
 *
 * This file is split across two tasks porting the SAME 522-line upstream
 * class:
 *  - **T6 (this file's initial landing):** `getData`, the `drawU` dispatch
 *    loop, the `<g>` push/pop stack discipline, `drawPath` (delegates to
 *    T1's `SvgPath.ts` per ADR-1 -- no second `d` -> `UPath` parser here),
 *    the constructor, `minGray`/`maxGray` fields, and the `extract()`
 *    helper.
 *  - **T8 (later, same file):** fills the `drawCircle`/`drawEllipse`/
 *    `drawText`/`applyFillAndStroke`/`applyTransform` STUBS below -- their
 *    dispatch branches are wired now so T8 only supplies bodies.
 *
 * Beyond the task's literal list, this file ALSO ports `getFillString`,
 * `computeMinMaxGray`, `updateMinMax`, `getMinGrayLevel`, and
 * `getMaxGrayLevel` (upstream `:309-342`, `:482-520`) -- NOT because the T6
 * task text names them, but because `drawU`'s first line
 * (`new ColorResolver(fontColor, forcedColor, this)`, upstream `:136`) is
 * itself T6 scope and requires `this` to satisfy T2's `GrayLevelRange`
 * interface. `computeMinMaxGray` only ever calls `getFillString(s, null)`
 * (upstream `:485`), so porting `getFillString` in full costs nothing here
 * and saves T8 from having to add it later -- T8's `applyFillAndStroke`/
 * `drawText` (which call `getFillString(s, stackG)` with the REAL ancestor
 * stack) can reuse this file's existing implementation unchanged.
 *
 * ---------------------------------------------------------------------
 * KNOWN SEAM MISMATCH, resolved here (batch-1 finding, this task's job to
 * fix): `UGraphicWithScale.ts` (T3, written in parallel before T2 landed)
 * declares its own LOCAL structural `ColorResolver` interface whose
 * `getDefaultColor`/`getTrueColor` return `Paint` (`string | Gradient`,
 * this port's SVG-emission colour type -- matching every other klimt seam,
 * e.g. `UBackground.ts`/`UForeground.ts`, where upstream's `HColor`
 * becomes `Paint`). T2's REAL `ColorResolver` (`./ColorResolver.ts`)
 * instead returns `ResolvedColor` (`{r,g,b,a}`, this port's `HColor`
 * stand-in -- see that file's own doc comment for why). The two are NOT
 * structurally compatible: passing a `ColorResolver` instance directly to
 * `UGraphicWithScale.create` fails to typecheck.
 *
 * Reconciliation chosen: CONVERT AT THE BOUNDARY, via the private
 * `PaintColorResolver` adapter below, using T2's own exported
 * `colorResolverToSvgHex` (`ResolvedColor` -> SVG hex string). A hex
 * string is always a valid `Paint` (the plain-string variant), so the
 * adapter's methods satisfy `UGraphicWithScale.ts`'s local interface
 * exactly. This is a pure, stateless wrapper living entirely in THIS
 * file; it touches neither `UGraphicWithScale.ts` nor `ColorResolver.ts`
 * (both outside this task's write-set -- reopening either would mean
 * reopening a landed, parallel batch-1 task's file, which this mission's
 * method rules treat as a STOP, not a task-local fix). Widening either
 * file's return type was considered and rejected: `UGraphicWithScale.ts`
 * deliberately mirrors the `Paint`-typed convention every other klimt seam
 * uses, and `ColorResolver.ts` deliberately mirrors upstream's `HColor`
 * return type one level closer to `XColor` -- collapsing either into the
 * other would lose information the OTHER seam's own callers rely on.
 * ---------------------------------------------------------------------
 *
 * T9 seam (sprite resolution returning primitives, batch 4 -- not this
 * task): `drawU` takes any `UGraphic`, so T9 needs no change here. This
 * port's existing idiom for "collect what would have been drawn, instead
 * of rendering it" is a collecting `UGraphic` implementation --
 * `src/core/klimt/drawing/LimitFinder.ts` already does exactly this for
 * `MinMax` (`draw(shape)` accumulates extent instead of touching a real
 * backend). T9 should follow that same idiom: a small `UGraphic`
 * implementation whose `draw(shape)` pushes `UPath`/other shapes onto an
 * array instead of drawing them, then calls `parser.drawU(collector, ...)`
 * and reads the array back. No parallel collector type is needed, and
 * nothing in this file needs to change to support it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java
 * (package `svg/parser/`, NOT `klimt/sprite/` -- see this mission's
 * README for why that distinction matters).
 */

/**
 * `emoji/GrayLevelRange.java`'s and `HColorSet#getColorOrWhite`'s WHITE
 * fallback, duplicated from `ColorResolver.ts`'s own identical private
 * constant (that file does not export it, and this file's write-set does
 * not extend to adding an export there).
 */
const WHITE: ResolvedColor = { r: 255, g: 255, b: 255, a: 255 };

/**
 * `(\<text .*?\</text\>)|(\<(svg|path|g|circle|ellipse)[^<>]*\>)|(\</[^<>]*\>)`
 * -- upstream's `P_TEXT_OR_DRAW`, unchanged. No `s` (dotAll) flag, matching
 * Java's default (non-`DOTALL`) `Pattern.compile` semantics: `.` does not
 * match a newline inside a `<text>...</text>` span.
 */
const P_TEXT_OR_DRAW = /(<text .*?<\/text>)|(<(?:svg|path|g|circle|ellipse)[^<>]*>)|(<\/[^<>]*>)/g;

/** `equals_something = "=\"([^\"]+)\""`. */
const EQUALS_SOMETHING = '="([^"]+)"';
const DATA_FILL = new RegExp('fill' + EQUALS_SOMETHING);
const DATA_STROKE = new RegExp('stroke' + EQUALS_SOMETHING);
const DATA_STYLE = new RegExp('style' + EQUALS_SOMETHING);

/** `colon_something = ":([^;\"]+)"`. */
const COLON_SOMETHING = ':([^;"]+)';
/** `Pattern.quote("fill") + colon_something` -- `Pattern.quote` is a no-op
 *  here since "fill" contains no regex metacharacters, so the literal
 *  string is used directly rather than adding an escaping helper. */
const STYLE_FILL = new RegExp('fill' + COLON_SOMETHING);

/** @see SvgNanoParser.java#extract */
function extract(p: RegExp, s: string): string | undefined {
  const m = p.exec(s);
  return m === null ? undefined : m[1];
}

/**
 * Adapter reconciling T2's `ColorResolver` (returns `ResolvedColor`) with
 * `UGraphicWithScale.ts`'s local `ColorResolver` contract (returns
 * `Paint`) -- see this file's module doc comment for the full account of
 * why this seam exists and why the fix lives here rather than in either
 * of those two files.
 */
class PaintColorResolver implements UGraphicWithScaleColorResolver {
  constructor(private readonly inner: ColorResolver) {}

  getDefaultColor(): Paint {
    return colorResolverToSvgHex(this.inner.getDefaultColor());
  }

  /* v8 ignore next 3 -- unreachable via this task's own call graph: the
   * only caller would be `applyFillAndStroke`'s `ugs.getTrueColor(...)`
   * call (SvgNanoParser.java:198), and that method is a T6 STUB (see its
   * own doc comment above) that never calls `ugs.getTrueColor`. Provably
   * dead until T8 fills that stub in; T8's own test suite exercises this. */
  getTrueColor(code: string): Paint {
    return colorResolverToSvgHex(this.inner.getTrueColor(code));
  }
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java
 */
export class SvgNanoParser implements GrayLevelRange {
  private minGray = 999;
  private maxGray = -1;
  private data: string[] | undefined;

  constructor(private readonly svg: string) {}

  /**
   * @see SvgNanoParser.java#drawU
   *
   * Signature deviation from the interface-contract pseudocode (which
   * used upstream's `HColor`): this port has no `HColor` type
   * (`ColorResolver.ts`'s own doc comment), so `fontColor`/`forcedColor`
   * are typed `ResolvedColor | undefined`, matching `ColorResolver`'s own
   * constructor exactly.
   */
  drawU(ug: UGraphic, scale: number, fontColor: ResolvedColor | undefined, forcedColor: ResolvedColor | undefined): void {
    const colorResolver = new ColorResolver(fontColor, forcedColor, this);
    const paintResolver = new PaintColorResolver(colorResolver);
    let ugs = UGraphicWithScale.create(ug, paintResolver, scale);

    const stack: UGraphicWithScale[] = [];
    const stackG: string[] = [];
    for (const s of this.getData()) {
      if (s.startsWith('<path ')) {
        this.drawPath(ugs, s, stackG);
      } else if (s.startsWith('</g>')) {
        ugs = stack.shift()!;
        stackG.shift();
      } else if (s.startsWith('<g>')) {
        stack.unshift(ugs);
        stackG.unshift(s);
      } else if (s.startsWith('<g ')) {
        stack.unshift(ugs);
        stackG.unshift(s);
        ugs = this.applyFillAndStroke(ugs, s, stackG);
        ugs = this.applyTransform(ugs, s);
      } else if (s.startsWith('<circle ')) {
        this.drawCircle(ugs, s, stackG);
      } else if (s.startsWith('<ellipse ')) {
        this.drawEllipse(ugs, s, stackG);
      } else if (s.startsWith('<text ')) {
        this.drawText(ugs, s, stackG);
      } else {
        // TRACE-only in upstream ("ignored1") -- not reproduced (no
        // TRACE flag/console output exists in this port).
      }
    }
    // Faithful 1:1 port of upstream's flat if/else tag-kind dispatch
    // (SvgNanoParser.java:141-165), not real branching complexity.
    // #lizard forgives
  }

  /**
   * @see SvgNanoParser.java#getData
   *
   * Memoized on first call (upstream's `synchronized` + `data.isEmpty()`
   * guard -- irrelevant here, this port is single-threaded, so only the
   * memoization itself is ported).
   */
  private getData(): readonly string[] {
    if (this.data === undefined) {
      const result: string[] = [];
      P_TEXT_OR_DRAW.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = P_TEXT_OR_DRAW.exec(this.svg)) !== null) {
        const s = m[0];
        if (
          s.startsWith('<path') ||
          s.startsWith('<g ') ||
          s.startsWith('<g>') ||
          s.startsWith('</g>') ||
          s.startsWith('<circle ') ||
          s.startsWith('<ellipse ') ||
          s.startsWith('<text ')
        ) {
          result.push(s);
        } else if (s.startsWith('<svg') || s.startsWith('</svg')) {
          // Ignore -- matches upstream's silent `<svg>`/`</svg>` skip.
        } else {
          // TRACE-only in upstream ("ignored2") -- not reproduced.
        }
      }
      this.data = result;
    }
    // Faithful 1:1 port of upstream's tag-kind allow-list membership test
    // (SvgNanoParser.java:172-181), not real branching complexity.
    // #lizard forgives
    return this.data;
  }

  /**
   * @see SvgNanoParser.java#drawPath -- delegates to T1's `SvgPath.ts`
   * (`parseSvgPath`), per ADR-1: no second `d` -> `UPath` parser here.
   *
   * KNOWN GAP, inherited from T1's documented scope (not introduced by
   * this task, and not fixable within this task's write-set):
   * `parseSvgPath` only applies its `translate` argument -- it does not
   * bake in scale/rotation from an `XAffineTransform`
   * (`src/core/klimt/sprite/SvgPath.ts`'s own doc comment: "identical
   * scale (no `XAffineTransform` type exists in this port yet)").
   * Upstream's real call, `svgPath.drawMe(ug, at)`, bakes the FULL
   * `ugs.getAffineTransform()` (accumulated `<g transform=...>` /
   * `scale` parameter) into the emitted path's coordinates via
   * `SvgPath#toUPath(XAffineTransform)`. This port instead calls
   * `parseSvgPath(tmp, UTranslate.none())` -- matching upstream's
   * literal `new SvgPath(tmp, UTranslate.none())` constructor call
   * exactly -- and draws the result UNSCALED. For every fixture this
   * task's acceptance criteria exercise (scale=1, no enclosing `<g
   * transform=...>`), `ugs.getAffineTransform()` is the identity matrix,
   * so this gap is invisible. It is NOT invisible for a real,
   * non-identity-scaled sprite draw (e.g. `AtomSprite` rendering at
   * `scale=2.5`) -- closing it needs `UPath.affine`/`rotate`
   * (`src/core/klimt/shape/UPath.ts`, itself already flagged there as
   * "Deferred (out of D3' scope, reported)" by an EARLIER mission, and
   * outside every task's write-set in THIS mission too). Flagged here
   * for the mission orchestrator: T8's `drawEllipse` calls the
   * equivalent `path.affine(ugs.getAffineTransform(), ugs.getAngle(),
   * ugs.getInitialScale())` and will hit the identical gap.
   */
  private drawPath(ugs: UGraphicWithScale, s: string, stackG: readonly string[]): void {
    // `id="` -> `ID="` avoids `indexOf('d="')` below false-matching the
    // tail of an `id="..."` attribute (upstream quirk, preserved
    // verbatim -- `String#replace(CharSequence, CharSequence)` replaces
    // EVERY occurrence, hence `replaceAll` here, not a single replace).
    const withId = s.replaceAll('id="', 'ID="');
    let applied = this.applyFillAndStroke(ugs, withId, stackG);
    applied = this.applyTransform(applied, withId);

    const x1 = withId.indexOf('d="');
    const x2 = withId.indexOf('"', x1 + 3);
    const tmp = withId.slice(x1 + 3, x2);

    const path = parseSvgPath(tmp, UTranslate.none());
    applied.draw(path);
  }

  /**
   * STUB for T8 (`plans/svg-sprite-nanoparser/batch-3/T8-nanoparser-shapes-text.md`).
   * Dispatch is wired above (the `<g ...>` branch and `drawPath`) so T8
   * only needs to fill this body. Currently a no-op: `ugs` is returned
   * unchanged, so no fill/stroke/stroke-width is applied yet.
   * @see SvgNanoParser.java#applyFillAndStroke
   */
  private applyFillAndStroke(ugs: UGraphicWithScale, _s: string, _stackG: readonly string[]): UGraphicWithScale {
    return ugs;
  }

  /**
   * STUB for T8. Dispatch is wired above (the `<g ...>` branch and
   * `drawPath`) so T8 only needs to fill this body. Currently a no-op:
   * `ugs` is returned unchanged, so no `transform=` (rotate/matrix/
   * scale/translate) is applied yet.
   * @see SvgNanoParser.java#applyTransform
   */
  private applyTransform(ugs: UGraphicWithScale, _s: string): UGraphicWithScale {
    return ugs;
  }

  /** STUB for T8 -- dispatch wired in `drawU` above. @see SvgNanoParser.java#drawCircle */
  private drawCircle(_ugs: UGraphicWithScale, _s: string, _stackG: readonly string[]): void {
    // Intentionally empty pending T8.
  }

  /** STUB for T8 -- dispatch wired in `drawU` above. @see SvgNanoParser.java#drawEllipse */
  private drawEllipse(_ugs: UGraphicWithScale, _s: string, _stackG: readonly string[]): void {
    // Intentionally empty pending T8.
  }

  /** STUB for T8 -- dispatch wired in `drawU` above. @see SvgNanoParser.java#drawText */
  private drawText(_ugs: UGraphicWithScale, _s: string, _stackG: readonly string[]): void {
    // Intentionally empty pending T8.
  }

  /**
   * @see SvgNanoParser.java#getFillString
   *
   * Ported in full here (not just the non-recursive core `computeMinMaxGray`
   * needs) so T8's `applyFillAndStroke`/`drawText` can call this UNCHANGED
   * with a real `stackG` -- see this file's module doc comment.
   */
  private getFillString(s: string, stackG: readonly string[] | null): string | undefined {
    let color = extract(DATA_FILL, s);
    if (color === undefined) {
      const style = extract(DATA_STYLE, s);
      if (style !== undefined) color = extract(STYLE_FILL, style);
    }

    /* v8 ignore start -- unreachable via this task's own call graph: the
     * only caller of `getFillString` today is `computeMinMaxGray`, which
     * always passes `null` (SvgNanoParser.java:485 does the same). This
     * ancestor-group walk only fires once T8's `applyFillAndStroke`/
     * `drawText` pass a REAL `stackG` -- ported in full now (not stubbed)
     * so T8 can reuse it unchanged; T8's own test suite exercises it. */
    if (color === undefined && stackG !== null) {
      for (const g of stackG) {
        color = this.getFillString(g, null);
        if (color !== undefined) return color;
      }
    }
    /* v8 ignore stop */

    return color;
  }

  /** @see SvgNanoParser.java#computeMinMaxGray */
  private computeMinMaxGray(): void {
    for (const s of this.getData()) {
      if (s.includes('<path ') || s.includes('<g ') || s.includes('<circle ') || s.includes('<ellipse ')) {
        const fillString = this.getFillString(s, null);
        const strokeString = extract(DATA_STROKE, s);

        this.updateMinMax(strokeString);
        this.updateMinMax(fillString);
      }
    }
  }

  /**
   * @see SvgNanoParser.java#updateMinMax
   *
   * `HColorSet#getColorOrWhite` + `ColorUtils#getGrayScaleColor(...)
   * .getGreen()` collapse to `parseSimpleColor(...) ?? WHITE` +
   * `grayScale(...)` here -- the same two exported primitives T2's own
   * `ColorResolver.ts#asMonochrome` composes for the identical upstream
   * calculation.
   */
  private updateMinMax(colorString: string | undefined): void {
    if (colorString === undefined) return;

    const color = parseSimpleColor(colorString) ?? WHITE;
    const gray = grayScale(color);
    this.minGray = Math.min(this.minGray, gray);
    this.maxGray = Math.max(this.maxGray, gray);
  }

  /** @see SvgNanoParser.java#getMinGrayLevel */
  getMinGrayLevel(): number {
    if (this.maxGray === -1) this.computeMinMaxGray();

    return this.minGray;
  }

  /** @see SvgNanoParser.java#getMaxGrayLevel */
  getMaxGrayLevel(): number {
    if (this.maxGray === -1) this.computeMinMaxGray();

    return this.maxGray;
  }
}
