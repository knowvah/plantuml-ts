/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java
 */
import { describe, expect, it, vi } from 'vitest';
import { SvgNanoParser } from '../../../../../src/core/klimt/sprite/SvgNanoParser.js';
import { pathBBox } from '../../../../../src/core/klimt/sprite/svg-path-bbox.js';
import { UPath } from '../../../../../src/core/klimt/shape/UPath.js';
import { UEllipse } from '../../../../../src/core/klimt/shape/UEllipse.js';
import { UText } from '../../../../../src/core/klimt/shape/UText.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../../src/core/klimt/Back.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../src/core/klimt/UParam.js';
import type { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

const DUMMY_PARAM: UParam = {
  getStroke: () => {
    throw new Error('not used in these tests');
  },
  getColor: () => '#000000',
  getBackcolor: () => '#FFFFFF',
  getTranslate: () => {
    throw new Error('not used in these tests');
  },
};

const DUMMY_BOUNDER: StringBounder = {
  calculateDimension: () => {
    throw new Error('not used in these tests');
  },
};

/**
 * A minimal, immutable `UGraphic` test double: `apply` returns a NEW
 * instance carrying the accumulated change log (mirroring
 * `UGraphicWithScale.test.ts`'s own `FakeUGraphic`), and `draw` records
 * every drawn shape in order onto a SHARED array so a test can inspect
 * what `drawU` produced regardless of how many `apply`-derived instances
 * were involved along the way. `drawnChanges[i]` is the `applied` log in
 * effect when `drawn[i]` was drawn (T8: lets tests assert exactly which
 * `Fore`/`Back`/`UStroke`/`UTranslate` changes `applyFillAndStroke`/
 * `applyTransform`/`drawCircle` applied, not just the shape geometry).
 */
class FakeUGraphic implements UGraphic {
  readonly drawn: UShape[];
  readonly drawnChanges: (readonly UChange[])[];
  readonly applied: readonly UChange[];

  constructor(
    drawn: UShape[] = [],
    drawnChanges: (readonly UChange[])[] = [],
    applied: readonly UChange[] = [],
  ) {
    this.drawn = drawn;
    this.drawnChanges = drawnChanges;
    this.applied = applied;
  }

  apply(change: UChange): UGraphic {
    return new FakeUGraphic(this.drawn, this.drawnChanges, [...this.applied, change]);
  }

  draw(shape: UShape): void {
    this.drawn.push(shape);
    this.drawnChanges.push(this.applied);
  }

  getParam(): UParam {
    return DUMMY_PARAM;
  }

  getTranslate(): UTranslate {
    throw new Error('not used in these tests');
  }

  getStringBounder(): StringBounder {
    return DUMMY_BOUNDER;
  }
}

/** Verbatim from `assets/stdlib/bootstrap1.13.1/bootstrap.puml`, `sprite bi-globe`
 *  -- a single-`<path>` sprite, matching T5's own ADR-1 equivalence fixture. */
const BI_GLOBE_D =
  'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z';

const BI_GLOBE_SVG = `<svg width="16" height="16">\n  <path d="${BI_GLOBE_D}"/>\n</svg>`;

/** Verbatim from `assets/stdlib/bootstrap1.13.1/bootstrap.puml`, `sprite bi-bootstrap-fill`
 *  -- a two-`<path>` sprite with no `<g>`. */
const BI_BOOTSTRAP_FILL_D1 =
  'M6.375 7.125V4.658h1.78c.973 0 1.542.457 1.542 1.237 0 .802-.604 1.23-1.764 1.23zm0 3.762h1.898c1.184 0 1.81-.48 1.81-1.377 0-.885-.65-1.348-1.886-1.348H6.375z';
const BI_BOOTSTRAP_FILL_D2 =
  'M4.002 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4zm1.06 12V3.545h3.399c1.587 0 2.543.809 2.543 2.11 0 .884-.65 1.675-1.483 1.816v.1c1.143.117 1.904.931 1.904 2.033 0 1.488-1.084 2.396-2.888 2.396z';

const BI_BOOTSTRAP_FILL_SVG =
  `<svg width="16" height="16">\n` +
  `  <path d="${BI_BOOTSTRAP_FILL_D1}"/>\n` +
  `  <path d="${BI_BOOTSTRAP_FILL_D2}"/>\n` +
  `</svg>`;

/** Verbatim from `assets/stdlib/archimate/ArchimateSprites.puml`,
 *  `sprite $application-collaboration-svg` -- a `<g transform="...">` wrapping
 *  a `<rect .../>` (not matched by `P_TEXT_OR_DRAW` at all -- "rect" is not
 *  one of svg|path|g|circle|ellipse) and a single `<path>`. */
const ARCHIMATE_GROUP_TRANSFORM = 'translate(-19.992 -120.11)';
const ARCHIMATE_PATH_D =
  'm27.183 123.97a0.5 0.5 0 0 0-0.02119 0.0103 0.5 0.5 0 0 0-0.01964-8e-3c-3.4192 0.0465-6.1654 2.864-6.1247 6.2833 0.04075 3.4193 2.8536 6.17 6.273 6.135 0.95572-0.01 1.8599-0.23624 2.6655-0.632 0.84256 0.41381 1.7909 0.64223 2.7916 0.632 3.4194-0.035 6.174-2.8427 6.1448-6.2622-0.02918-3.4194-2.8328-6.1817-6.2523-6.1583a0.5 0.5 0 0 0-0.01344 0.014 0.5 0.5 0 0 0-0.02739-0.0119c-0.94791 0.0129-1.8443 0.23889-2.6438 0.63149-0.83677-0.41157-1.7786-0.64035-2.7724-0.63356z';
const ARCHIMATE_PATH_ATTRS = `stop-color="#000000" stroke-linecap="round" stroke-linejoin="round"`;

const ARCHIMATE_SVG =
  `<svg width="19.995mm" height="19.928mm" version="1.1" viewBox="0 0 19.995 19.928" xmlns="http://www.w3.org/2000/svg">\n` +
  ` <g transform="${ARCHIMATE_GROUP_TRANSFORM}">\n` +
  `  <rect x="19.992" y="120.11" width="19.995" height="19.928" ry="0" fill="none"/>\n` +
  `  <path d="${ARCHIMATE_PATH_D}" ${ARCHIMATE_PATH_ATTRS}/>\n` +
  ` </g>\n` +
  `</svg>`;

describe('SvgNanoParser#getData (acceptance criterion 1)', () => {
  it('extracts <path>/<g>/</g> in document order and silently ignores <svg>/</svg>/<rect>', () => {
    const parser = new SvgNanoParser(ARCHIMATE_SVG);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    // getData() is private; observed indirectly via drawU's dispatch: the
    // <rect> never reaches any branch (no throw, no drawn shape for it),
    // and exactly one UPath (the archimate <path>) is drawn -- proving the
    // extraction regex matched <g ...>, <path .../>, </g> and skipped
    // <svg ...>/<rect .../>/</svg>.
    expect(ug.drawn).toHaveLength(1);
    expect(ug.drawn[0]).toBeInstanceOf(UPath);
  });

  it('produces a UPath whose minmax reflects the archimate <g transform> (T8: transform no longer a stub)', () => {
    const parser = new SvgNanoParser(ARCHIMATE_SVG);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const box = pathBBox(ARCHIMATE_PATH_D);
    expect(box).toBeDefined();
    const path = ug.drawn[0] as UPath;
    // Since T8, applyTransform is real: the archimate <g transform=
    // "translate(-19.992 -120.11)"> now shifts the path by that exact
    // delta rather than leaving it at the untranslated pathBBox value
    // (the pre-T8 identity-stub behaviour this test used to pin).
    expect(path.getMinX()).toBeCloseTo(box!.minX - 19.992, 9);
    expect(path.getMaxX()).toBeCloseTo(box!.maxX - 19.992, 9);
    expect(path.getMinY()).toBeCloseTo(box!.minY - 120.11, 9);
    expect(path.getMaxY()).toBeCloseTo(box!.maxY - 120.11, 9);
  });
});

describe('SvgNanoParser#drawU -- drawPath (acceptance criteria 3 and 4)', () => {
  it('emits exactly ONE UPath for a single-<path> sprite, matching pathBBox of the same d (bi-globe)', () => {
    const parser = new SvgNanoParser(BI_GLOBE_SVG);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(1);
    const path = ug.drawn[0] as UPath;
    expect(path).toBeInstanceOf(UPath);

    const box = pathBBox(BI_GLOBE_D);
    expect(box).toBeDefined();
    expect(path.getMinX()).toBeCloseTo(box!.minX, 9);
    expect(path.getMaxX()).toBeCloseTo(box!.maxX, 9);
    expect(path.getMinY()).toBeCloseTo(box!.minY, 9);
    expect(path.getMaxY()).toBeCloseTo(box!.maxY, 9);
  });

  it('reproduces svgInkBox\'s union-of-paths box for bi-bootstrap-fill (2 paths, no <g>)', () => {
    const parser = new SvgNanoParser(BI_BOOTSTRAP_FILL_SVG);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(2);
    const [p1, p2] = ug.drawn as [UPath, UPath];

    const box1 = pathBBox(BI_BOOTSTRAP_FILL_D1)!;
    const box2 = pathBBox(BI_BOOTSTRAP_FILL_D2)!;
    const unionMinX = Math.min(box1.minX, box2.minX);
    const unionMinY = Math.min(box1.minY, box2.minY);
    const unionMaxX = Math.max(box1.maxX, box2.maxX);
    const unionMaxY = Math.max(box1.maxY, box2.maxY);

    const drawnMinX = Math.min(p1.getMinX(), p2.getMinX());
    const drawnMinY = Math.min(p1.getMinY(), p2.getMinY());
    const drawnMaxX = Math.max(p1.getMaxX(), p2.getMaxX());
    const drawnMaxY = Math.max(p1.getMaxY(), p2.getMaxY());

    expect(drawnMinX).toBeCloseTo(unionMinX, 9);
    expect(drawnMinY).toBeCloseTo(unionMinY, 9);
    expect(drawnMaxX).toBeCloseTo(unionMaxX, 9);
    expect(drawnMaxY).toBeCloseTo(unionMaxY, 9);
  });
});

describe('SvgNanoParser#drawU -- drawPath bakes ugs.getAffineTransform() into the path (T13)', () => {
  it('scales the emitted path box by the `scale` drawU was called with', () => {
    const scale = 2.5;
    const parserAtScale = new SvgNanoParser(BI_GLOBE_SVG);
    const ugScaled = new FakeUGraphic();
    parserAtScale.drawU(ugScaled, scale, undefined, undefined);

    const parserUnscaled = new SvgNanoParser(BI_GLOBE_SVG);
    const ugUnscaled = new FakeUGraphic();
    parserUnscaled.drawU(ugUnscaled, 1, undefined, undefined);

    const scaledPath = ugScaled.drawn[0] as UPath;
    const unscaledPath = ugUnscaled.drawn[0] as UPath;

    expect(scaledPath.getMinX()).toBeCloseTo(unscaledPath.getMinX() * scale, 9);
    expect(scaledPath.getMaxX()).toBeCloseTo(unscaledPath.getMaxX() * scale, 9);
    expect(scaledPath.getMinY()).toBeCloseTo(unscaledPath.getMinY() * scale, 9);
    expect(scaledPath.getMaxY()).toBeCloseTo(unscaledPath.getMaxY() * scale, 9);
  });

  it('scale=1 (identity) reproduces the pre-T13 unscaled box exactly, matching pathBBox', () => {
    const parser = new SvgNanoParser(BI_GLOBE_SVG);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const path = ug.drawn[0] as UPath;
    const box = pathBBox(BI_GLOBE_D)!;
    expect(path.getMinX()).toBeCloseTo(box.minX, 9);
    expect(path.getMaxX()).toBeCloseTo(box.maxX, 9);
    expect(path.getMinY()).toBeCloseTo(box.minY, 9);
    expect(path.getMaxY()).toBeCloseTo(box.maxY, 9);
  });
});

describe('SvgNanoParser#drawU -- <g> push/pop stack discipline (acceptance criterion 2)', () => {
  it('draws sibling paths before/after a <g transform=...>...</g> in exact document order, without corrupting the stack', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <path d="${BI_BOOTSTRAP_FILL_D1}"/>\n` +
      `  <g transform="${ARCHIMATE_GROUP_TRANSFORM}">\n` +
      `    <path d="${ARCHIMATE_PATH_D}" ${ARCHIMATE_PATH_ATTRS}/>\n` +
      `  </g>\n` +
      `  <path d="${BI_BOOTSTRAP_FILL_D2}"/>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(3);
    ug.drawn.forEach((shape) => expect(shape).toBeInstanceOf(UPath));

    const [outer1, inner, outer2] = ug.drawn as [UPath, UPath, UPath];
    const box1 = pathBBox(BI_BOOTSTRAP_FILL_D1)!;
    const boxInner = pathBBox(ARCHIMATE_PATH_D)!;
    const box2 = pathBBox(BI_BOOTSTRAP_FILL_D2)!;

    // Sibling paths OUTSIDE the <g transform=...> are unaffected by it.
    expect(outer1.getMinX()).toBeCloseTo(box1.minX, 9);
    expect(outer1.getMaxX()).toBeCloseTo(box1.maxX, 9);
    expect(outer2.getMinX()).toBeCloseTo(box2.minX, 9);
    expect(outer2.getMaxX()).toBeCloseTo(box2.maxX, 9);
    // The path INSIDE the group picks up its translate (T8: no longer stubbed).
    expect(inner.getMinX()).toBeCloseTo(boxInner.minX - 19.992, 9);
    expect(inner.getMaxX()).toBeCloseTo(boxInner.maxX - 19.992, 9);
  });

  it('handles a plain <g> (no attributes) push/pop identically to <g transform=...>', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <g>\n` +
      `    <path d="${BI_GLOBE_D}"/>\n` +
      `  </g>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(1);
    expect(ug.drawn[0]).toBeInstanceOf(UPath);
  });
});

describe('SvgNanoParser -- unrecognised elements are ignored, not thrown (acceptance criterion 5)', () => {
  it('ignores a <rect> sibling and still draws every recognised <path>', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <rect x="0" y="0" width="16" height="16" fill="none"/>\n` +
      `  <path d="${BI_GLOBE_D}"/>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    expect(() => parser.drawU(ug, 1, undefined, undefined)).not.toThrow();
    expect(ug.drawn).toHaveLength(1);
  });

  it('ignores a stray closing tag with no matching opener (getData\'s "ignored2" branch)', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <title>bi-globe</title>\n` +
      `  <path d="${BI_GLOBE_D}"/>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    expect(() => parser.drawU(ug, 1, undefined, undefined)).not.toThrow();
    expect(ug.drawn).toHaveLength(1);
  });
});

describe('SvgNanoParser#drawCircle (T8, acceptance criterion 1)', () => {
  it('emits a UEllipse whose bounds match upstream\'s own circle formula (edgy bIdentityLogo)', () => {
    // Verbatim structure from assets/stdlib/edgy/edgy.puml `sprite $bIdentityLogo`:
    // <g fill="#00ea4e"><circle cx="17" cy="14" r="10"/>...</g>.
    const svg =
      `<svg viewBox="0 0 32 32">\n` +
      `  <g fill="#00ea4e">\n` +
      `    <circle cx="17" cy="14" r="10"/>\n` +
      `  </g>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(1);
    const ellipse = ug.drawn[0] as UEllipse;
    expect(ellipse).toBeInstanceOf(UEllipse);
    // Upstream: rx = ry = r*scale = 10; width/height = 2*rx = 2*ry = 20;
    // drawn via UTranslate(deltax + cx - rx, deltay + cy - ry) applied to
    // ugs -- the box upstream itself draws is [cx-rx, cx+rx] x [cy-ry, cy+ry]
    // = [7, 27] x [4, 24].
    expect(ellipse.getWidth()).toBeCloseTo(20, 9);
    expect(ellipse.getHeight()).toBeCloseTo(20, 9);
    const translate = ug.drawnChanges[0]!.at(-1) as UTranslate;
    expect(translate.getDx()).toBeCloseTo(7, 9);
    expect(translate.getDy()).toBeCloseTo(4, 9);

    // The circle inherits the ancestor <g fill="#00ea4e">'s color, not the
    // BLACK default -- same ancestor-lookup mechanism acceptance criterion 2
    // requires for <path>. The LAST Fore applied is the one active when the
    // shape is actually drawn (later apply() calls override earlier ones).
    const fore = ug.drawnChanges[0]!.filter((c): c is Fore => c instanceof Fore).at(-1);
    expect(fore?.getColor()).toBe('#00EA4E');
  });
});

describe('SvgNanoParser#drawEllipse (T8, acceptance criterion 5 -- 0 corpus reach, unit test only "by design")', () => {
  it('produces the exact upstream ellipse-arc-path bounding box for a minimal synthetic <ellipse> (no bundle uses one)', () => {
    // Authored per this task's own instruction: no stdlib sprite anywhere
    // uses <ellipse> (ADR-4's census: 0 occurrences), so this exercises the
    // real upstream code path with a minimal hand-authored fixture instead
    // of a corpus body.
    const svg = `<svg width="20" height="10">\n  <ellipse cx="10" cy="5" rx="4" ry="2"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(1);
    const path = ug.drawn[0] as UPath;
    expect(path).toBeInstanceOf(UPath);

    // Identity transform (no <g>, no scale beyond 1): the decomposed
    // 4-arc ellipse path's bounding box is exactly the ellipse's own
    // [cx-rx, cx+rx] x [cy-ry, cy+ry] box, since every SEG_ARCTO segment
    // contributes only its endpoint to minmax (UPath#addInternal).
    expect(path.getMinX()).toBeCloseTo(6, 9);
    expect(path.getMaxX()).toBeCloseTo(14, 9);
    expect(path.getMinY()).toBeCloseTo(3, 9);
    expect(path.getMaxY()).toBeCloseTo(7, 9);
  });
});

describe('SvgNanoParser -- <circle>/<ellipse> together under one ancestor <g fill> (dispatch order)', () => {
  it('draws the circle then the ellipse, in document order, both under the shared ancestor fill', () => {
    // Verbatim edgy structure with one <circle> swapped for an <ellipse>
    // (0 real stdlib occurrences per the mission's own census -- ADR-4
    // still requires exercising it, unit-test only, "by design").
    const svg =
      `<svg viewBox="0 0 32 32">\n` +
      `  <g fill="#00ea4e">\n` +
      `    <circle cx="17" cy="14" r="10"/>\n` +
      `    <ellipse cx="7.5" cy="25.5" rx="2.5" ry="2.5"/>\n` +
      `  </g>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    expect(() => parser.drawU(ug, 1, undefined, undefined)).not.toThrow();

    expect(ug.drawn).toHaveLength(2);
    expect(ug.drawn[0]).toBeInstanceOf(UEllipse);
    const ellipsePath = ug.drawn[1] as UPath;
    expect(ellipsePath).toBeInstanceOf(UPath);
    expect(ellipsePath.getMinX()).toBeCloseTo(5, 9);
    expect(ellipsePath.getMaxX()).toBeCloseTo(10, 9);
    expect(ellipsePath.getMinY()).toBeCloseTo(23, 9);
    expect(ellipsePath.getMaxY()).toBeCloseTo(28, 9);
  });
});

describe('SvgNanoParser#drawText (T8, acceptance criterion 6)', () => {
  it('emits a UText through the existing text driver with the resolved font/colour (edgy2 pattern)', () => {
    // Verbatim from assets/stdlib/edgy/edgy2.puml.
    const svg = `<svg viewBox="0 0 32 32">\n  <text x="17" y="10" font-size="10" fill="#262626">People</text>\n</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(1);
    const utext = ug.drawn[0] as UText;
    expect(utext).toBeInstanceOf(UText);
    expect(utext.getText()).toBe('People');
    const fc = utext.getFontConfiguration();
    expect(fc.family).toBe('SansSerif');
    expect(fc.size).toBe(10);
    expect(fc.color).toBe('#262626');

    // x/y were applied via ug.apply(new UTranslate(x, y)) directly on the
    // raw UGraphic (NOT ugs.draw) -- the last change in the log is that
    // translate, at (17, 10) (scalex/scaley/deltax/deltay all identity here).
    const translate = ug.drawnChanges[0]!.at(-1) as UTranslate;
    expect(translate.getDx()).toBeCloseTo(17, 9);
    expect(translate.getDy()).toBeCloseTo(10, 9);
  });

  it('falls back to "SansSerif" and inherits font-family from an ancestor <g> (getTextFontFamily stackG walk)', () => {
    const svg =
      `<svg viewBox="0 0 32 32">\n` +
      `  <g font-family="Georgia">\n` +
      `    <text x="0" y="0" font-size="10" fill="#000000">Hi</text>\n` +
      `  </g>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const utext = ug.drawn[0] as UText;
    expect(utext.getFontConfiguration().family).toBe('Georgia');
  });

  it('reads font-size from a style="font-size:12pt;" attribute, stripping the unit suffix', () => {
    const svg = `<svg viewBox="0 0 32 32">\n  <text x="0" y="0" style="font-size:12pt;" fill="#000000">Hi</text>\n</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const utext = ug.drawn[0] as UText;
    expect(utext.getFontConfiguration().size).toBe(12);
  });

  it('defaults font-size to 14 when neither font-size= nor style="font-size:..." is present', () => {
    const svg = `<svg viewBox="0 0 32 32">\n  <text x="0" y="0" fill="#000000">Hi</text>\n</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const utext = ug.drawn[0] as UText;
    expect(utext.getFontConfiguration().size).toBe(14);
  });

  it('falls back to white when no fill= is present anywhere (getColorOrWhite\'s undefined-code branch)', () => {
    const svg = `<svg viewBox="0 0 32 32">\n  <text x="0" y="0" font-size="10">NoFill</text>\n</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const utext = ug.drawn[0] as UText;
    expect(utext.getFontConfiguration().color).toBe('#FFFFFF');
  });
});

describe('SvgNanoParser#applyFillAndStroke (T8, acceptance criteria 2 and 3)', () => {
  it('a <path> with no own fill inherits the ancestor <g fill="...">\'s colour, not a default', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <g fill="#123456">\n` +
      `    <path d="${BI_GLOBE_D}"/>\n` +
      `  </g>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    expect(ug.drawn).toHaveLength(1);
    const changes = ug.drawnChanges[0]!;
    // LAST Fore/Back applied is what's active when the <path> is actually
    // drawn -- both the <g fill="#123456"> tag itself and the child <path>
    // (via its own ancestor-lookup) apply this same colour along the way.
    const fore = changes.filter((c): c is Fore => c instanceof Fore).at(-1);
    const back = changes.filter((c): c is Back => c instanceof Back).at(-1);
    expect(fore?.getColor()).toBe('#123456');
    expect(back?.getBackColor()).toBe('#123456');
  });

  it('multiplies stroke-width by getInitialScale() exactly (acceptance criterion 3)', () => {
    const svg = `<svg width="16" height="16">\n  <path stroke-width="2" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 3, undefined, undefined);

    const changes = ug.drawnChanges[0]!;
    const stroke = changes.find((c): c is UStroke => c instanceof UStroke);
    expect(stroke).toBeDefined();
    expect(stroke!.getThickness()).toBeCloseTo(6, 9);
  });

  it('a stroke with no own fill applies ONLY the stroke foreground + default background (early-return quirk)', () => {
    const svg = `<svg width="16" height="16">\n  <path stroke="#ff0000" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const changes = ug.drawnChanges[0]!;
    const fores = changes.filter((c): c is Fore => c instanceof Fore);
    const backs = changes.filter((c): c is Back => c instanceof Back);
    // The initial drawU-start default-color Fore/Back, then the stroke's
    // own Fore, then the early-return default-color Back -- no SECOND
    // Fore/Back pair from the fill branch, since the method returns before
    // reaching it.
    expect(fores).toHaveLength(2);
    expect(fores[1]!.getColor()).toBe('#FF0000');
    expect(backs).toHaveLength(2);
    expect(backs[1]!.getBackColor()).toBe('#000000');
  });

  it('fill="none" applies ONLY a background of the "none" sentinel, no foreground change', () => {
    const svg = `<svg width="16" height="16">\n  <path fill="none" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const changes = ug.drawnChanges[0]!;
    const fores = changes.filter((c): c is Fore => c instanceof Fore);
    const backs = changes.filter((c): c is Back => c instanceof Back);
    // Only the drawU-start default Fore -- none from applyFillAndStroke's
    // "none" branch (it applies Back only).
    expect(fores).toHaveLength(1);
    expect(backs).toHaveLength(2);
    expect(backs[1]!.getBackColor()).toBe('none');
  });
});

describe('SvgNanoParser#applyTransform (T8, acceptance criterion 4)', () => {
  it('composes nested <g transform="translate(...)"> then <g transform="scale(...)"> in upstream\'s document order', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <g transform="translate(10 20)">\n` +
      `    <g transform="scale(2)">\n` +
      `      <path d="${BI_GLOBE_D}"/>\n` +
      `    </g>\n` +
      `  </g>\n` +
      `</svg>`;

    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const path = ug.drawn[0] as UPath;
    const box = pathBBox(BI_GLOBE_D)!;
    // Outer translate(10,20) composes BEFORE inner scale(2) (each <g> post-
    // multiplies onto the accumulated matrix in document order), so the
    // final affine is [2,0,0,2,20,40]: (x,y) -> (2x+20, 2y+40).
    expect(path.getMinX()).toBeCloseTo(2 * box.minX + 10 * 2, 9);
    expect(path.getMaxX()).toBeCloseTo(2 * box.maxX + 10 * 2, 9);
    expect(path.getMinY()).toBeCloseTo(2 * box.minY + 20 * 2, 9);
    expect(path.getMaxY()).toBeCloseTo(2 * box.maxY + 20 * 2, 9);
  });

  it('handles the single-argument translate(x) and two-argument scale(x,y) forms', () => {
    // scale(2,2) (equal args) rather than scale(2,3): UGraphicWithScale
    // .applyScale throws for non-uniform scale (a separate, already-ported
    // upstream invariant -- not this task's concern), so a UNIFORM
    // two-argument value is what proves P_SCALE2 (not P_SCALE1) matched.
    const svg = `<svg width="10" height="10">\n  <g transform="translate(5) scale(2,2)">\n    <path d="M0 0 L1 1"/>\n  </g>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const path = ug.drawn[0] as UPath;
    // translate(5) -- single-arg form sets BOTH dx and dy to 5
    // (P_TRANSLATE2, upstream's own quirk, preserved verbatim) -- then
    // scale(2,2) -- two-argument form (P_SCALE2). Composed: at=[1,0,0,1,5,5]
    // after translate, then scale(2,2) multiplies rows -> at=[2,0,0,2,10,10]:
    // (x,y) -> (2x+10, 2y+10). (0,0)->(10,10); (1,1)->(12,12).
    expect(path.getMinX()).toBeCloseTo(10, 9);
    expect(path.getMaxX()).toBeCloseTo(12, 9);
    expect(path.getMinY()).toBeCloseTo(10, 9);
    expect(path.getMaxY()).toBeCloseTo(12, 9);
  });

  it('applies a well-formed rotate(angle, x, y) transform (rotate(90, 0, 0) maps (x,y) -> (-y, x))', () => {
    const svg = `<svg width="10" height="10">\n  <g transform="rotate(90, 0, 0)">\n    <path d="M4 0 L0 0"/>\n  </g>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const path = ug.drawn[0] as UPath;
    // Raw points (4,0) and (0,0) rotate to (0,4) and (0,0).
    expect(path.getMinX()).toBeCloseTo(0, 9);
    expect(path.getMaxX()).toBeCloseTo(0, 9);
    expect(path.getMinY()).toBeCloseTo(0, 9);
    expect(path.getMaxY()).toBeCloseTo(4, 9);
  });

  it('applies a well-formed matrix(...) transform', () => {
    const svg = `<svg width="10" height="10">\n  <g transform="matrix(1 0 0 1 5 5)">\n    <path d="M0 0 L1 1"/>\n  </g>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    parser.drawU(ug, 1, undefined, undefined);

    const path = ug.drawn[0] as UPath;
    // matrix(1,0,0,1,5,5) is a pure translate(5,5): (0,0)->(5,5), (1,1)->(6,6).
    expect(path.getMinX()).toBeCloseTo(5, 9);
    expect(path.getMaxX()).toBeCloseTo(6, 9);
    expect(path.getMinY()).toBeCloseTo(5, 9);
    expect(path.getMaxY()).toBeCloseTo(6, 9);
  });

  it('warns and leaves the transform unchanged for a malformed rotate(...) (upstream\'s WARNING branch)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const svg = `<svg width="10" height="10">\n  <g transform="rotate(bogus)">\n    <path d="${BI_GLOBE_D}"/>\n  </g>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    expect(() => parser.drawU(ug, 1, undefined, undefined)).not.toThrow();

    const path = ug.drawn[0] as UPath;
    const box = pathBBox(BI_GLOBE_D)!;
    expect(path.getMinX()).toBeCloseTo(box.minX, 9);
    expect(warnSpy).toHaveBeenCalledWith('WARNING: rotate(bogus)');
    warnSpy.mockRestore();
  });

  it('warns and leaves the transform unchanged for a malformed matrix(...) (upstream\'s WARNING branch)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const svg = `<svg width="10" height="10">\n  <g transform="matrix(bogus)">\n    <path d="${BI_GLOBE_D}"/>\n  </g>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    const ug = new FakeUGraphic();
    expect(() => parser.drawU(ug, 1, undefined, undefined)).not.toThrow();

    const path = ug.drawn[0] as UPath;
    const box = pathBBox(BI_GLOBE_D)!;
    expect(path.getMinX()).toBeCloseTo(box.minX, 9);
    expect(warnSpy).toHaveBeenCalledWith('WARNING: matrix(bogus)');
    warnSpy.mockRestore();
  });
});

describe('SvgNanoParser -- GrayLevelRange (constructor/minGray/maxGray fields)', () => {
  it('returns the default 999/-1-derived min/max gray level for a sprite with no fill/stroke colour', () => {
    const parser = new SvgNanoParser(BI_GLOBE_SVG);
    expect(parser.getMinGrayLevel()).toBe(999);
    expect(parser.getMaxGrayLevel()).toBe(-1);
  });

  it('computes min/max gray level from a <path fill="..."> attribute', () => {
    const svg = `<svg width="16" height="16">\n  <path fill="#000000" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    expect(parser.getMinGrayLevel()).toBe(0);
    expect(parser.getMaxGrayLevel()).toBe(0);
  });

  it('memoizes across repeated calls (calling getMaxGrayLevel first still computes minGray correctly)', () => {
    const svg = `<svg width="16" height="16">\n  <path fill="#ffffff" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    expect(parser.getMaxGrayLevel()).toBe(255);
    expect(parser.getMinGrayLevel()).toBe(255);
  });

  it('reads fill from a style="fill:..." attribute when no plain fill= is present', () => {
    const svg = `<svg width="16" height="16">\n  <path style="fill:#123456;" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    expect(parser.getMinGrayLevel()).toBe(45);
    expect(parser.getMaxGrayLevel()).toBe(45);
  });

  it('falls back to white for an unparseable fill colour token', () => {
    const svg = `<svg width="16" height="16">\n  <path fill="not-a-real-color-xyz" d="${BI_GLOBE_D}"/>\n</svg>`;
    const parser = new SvgNanoParser(svg);
    expect(parser.getMinGrayLevel()).toBe(255);
    expect(parser.getMaxGrayLevel()).toBe(255);
  });

  it('scans fill on <g>/<circle>/<ellipse> elements, not just <path> (computeMinMaxGray\'s full tag set)', () => {
    const svg =
      `<svg width="16" height="16">\n` +
      `  <g fill="#000000">\n` +
      `    <circle cx="1" cy="1" r="1" fill="#ffffff"/>\n` +
      `    <ellipse cx="1" cy="1" rx="1" ry="1" fill="#808080"/>\n` +
      `  </g>\n` +
      `</svg>`;
    const parser = new SvgNanoParser(svg);
    expect(parser.getMinGrayLevel()).toBe(0);
    expect(parser.getMaxGrayLevel()).toBe(255);
  });
});
