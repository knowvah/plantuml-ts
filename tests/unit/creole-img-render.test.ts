/**
 * creole-img-render.test.ts — SI5b+E2r T7: rendering unit tests for
 * creole `<img>`/`<$sprite>` inline atoms (D7 — SVG `<image>` emission).
 *
 * jar-relation evidence (probes run 2026-07 under `oracle/dist/
 * plantuml-oracle.jar -tsvg -pipe`, probes staged under `/private/tmp`,
 * per this task's instructions — RELATIONS pinned, not href bytes):
 *
 * Probe 1 — inline sprite definition + `<$name>` in a component label
 * (`sprite $DynamoDBItems [64x64/16z] { ... }` — the REAL awslib14 body,
 * verbatim from `assets/stdlib/awslib14/Database/DynamoDBItems.puml` —
 * `component "Icon <$DynamoDBItems>" as C1`):
 *
 *   <image width="69" height="69" x="54.9219" y="27"
 *          xlink:href="data:image/png;base64,..."/>
 *
 * Probe 2 — an `<img data:...>` label using a REAL awslib14 data URI (the
 * SAME DynamoDBItems sprite, decoded + tinted through THIS PORT's own T4/
 * T5 pipeline — `spriteToPngDataUri` — into a genuine 64x64 raster, then
 * embedded as `component "Icon <img:data:image/png;base64,...>" as C1`):
 *
 *   <image width="64" height="64" x="54.9219" y="27"
 *          xlink:href="data:image/png;base64,..."/>
 *
 * Both probes confirm the RELATION this suite pins: exactly one `<image>`
 * element per atom, with `x`/`y`/`width`/`height` attributes and an
 * `xlink:href` data URI — the shape `svgImageDataUri`
 * (`svg-graphics-elements.ts`) emits. The `x="54.9219"` in both probes is
 * the jar's own measured width of the preceding "Icon " text run (the
 * atom's x-advance starts immediately after it) — the same "text segment,
 * then atom" ordering `scanLineForAtoms(...).segments` reproduces here.
 * `href` BYTES are NOT compared (the jar re-encodes/re-derives; this port
 * passes `img` hrefs through verbatim and stored-block-encodes sprite
 * tints — D7's documented, deliberate divergence, DIVERGENCES.md).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { describe, expect, test } from 'vitest';
import { scanLineForAtoms, type AtomImageResolver, type DrawablePrimitive, type InlineAtomToken } from '../../src/core/creole-atoms.js';
import { measureInlineAtom, spriteScale } from '../../src/core/creole-atoms-measure.js';
import { createSpriteRegistry, addSprite } from '../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../src/core/klimt/sprite/SpriteMonochrome.js';
import { SpriteSvg } from '../../src/core/klimt/sprite/SpriteSvg.js';
import { spriteMonochromeAsLike, spriteToPngDataUri } from '../../src/core/klimt/sprite/sprite-raster.js';
import { encodePng, toBase64DataUri } from '../../src/core/klimt/sprite/png-encoder.js';
import { pathBBox } from '../../src/core/klimt/sprite/svg-path-bbox.js';
import { UPath } from '../../src/core/klimt/shape/UPath.js';
import { UEllipse } from '../../src/core/klimt/shape/UEllipse.js';
import { makeAtomImageResolverFor } from '../../src/diagrams/description/render-atoms.js';
import { buildTextBlock } from '../../src/core/svek/image/EntityImageDescriptionSupport.js';
import { HorizontalAlignment } from '../../src/core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../src/core/klimt/shape/UText.js';
import { UGraphicSvg } from '../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../src/core/measurer-bounder.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

/** Width-only bounder for `DriverTextSvg`'s own `textLength` attribute —
 *  same pattern as `entity-image-description.test.ts`'s
 *  `jarBackedDriverBounder`, backed by the deterministic measurer instead
 *  of the AWT jar (this suite asserts structure/geometry relations, not
 *  jar-exact pixel widths). */
const measurer = new DeterministicMeasurer();

const driverBounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: measurer.measure(text, font).width };
  },
};

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

/** A tiny (2x2) deterministic PNG data URI — same encoder T5 uses for
 *  sprite tints, reused here to build a standalone `<img>` atom fixture
 *  without depending on any registry. */
const TINY_PNG_URI = toBase64DataUri(encodePng(new Uint8Array(2 * 2 * 4).fill(0xff), 2, 2));

function buildSpriteRegistryWithFoo(): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = new SpriteMonochrome(4, 4, 16);
  // A simple diagonal gradient so `computeMaxCoef` (sprite-raster.ts) is
  // nonzero and every pixel isn't degenerately transparent (file header:
  // an all-zero sprite is legitimately fully transparent, not useful here).
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) sprite.setGray(x, y, (x + y) % 16);
  }
  addSprite(registry, 'foo', sprite);
  return registry;
}

/** A minimal SVG sprite whose one `<path>` traces the declared box's own
 *  four corners exactly -- so the primitives' collective bbox equals the
 *  declared box, isolating the SCALE-threading assertion (T9's interface
 *  contract: `spriteScale` applies identically to both channels) from the
 *  separate declared-vs-ink assertion `bi-globe` (below) covers. */
const SQUARE_SVG = '<svg width="10" height="10"><path d="M0 0L10 0L10 10L0 10Z"/></svg>';

/** `bi-globe`, copied VERBATIM from `oracle/goldens/svg-description/usecase/
 *  sprite-svg-bootstrap-0/in.puml` -- the mission's own jar-verified case for
 *  ADR-2's central claim (decisions.md ADR-5): a declared 16x16 box whose
 *  outer circle is drawn as an ARC, so `UPath.addInternal` records only the
 *  arc's ENDPOINT (ADR-1) and the primitives' true ink is 16x13.846, NOT the
 *  declared 16x16 -- the exact declared/ink split this task exists to keep
 *  in two channels rather than collapsing into one (see file's SvgNanoParser
 *  import for why `pathBBox`, the SAME `UPath` minmax rule via ADR-1's proven
 *  equivalence, is the oracle for "what SHOULD the primitives' bbox be"). */
const BI_GLOBE_D =
  'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z';
const BI_GLOBE_SVG = `<svg width="16" height="16"><path d="${BI_GLOBE_D}"/></svg>`;

function buildSpriteRegistryWithSvg(name: string, svg: string): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = SpriteSvg.from(svg);
  if (sprite === undefined) throw new Error(`test fixture SVG for '${name}' has no width/height`);
  addSprite(registry, name, sprite);
  return registry;
}

/** Overall bbox across every collected `UPath` primitive (a `DrawablePrimitive`
 *  whose `shape` is NOT a `UPath` -- e.g. a decomposed `<circle>`'s `UEllipse`
 *  -- is skipped here; `ellipseInkBox` below covers that case) -- ADR-1's
 *  proven `pathBBox`/`UPath` minmax equivalence means this is directly
 *  comparable to `pathBBox(d)`'s own numbers for a single-path sprite.
 *  `primitive.translate` is folded in (T9's positioning fix): a `UPath`'s own
 *  is always `(0,0)` (see `SpritePrimitiveCollector`'s doc comment), but
 *  asserting the fold here rather than assuming it keeps this helper honest. */
function primitivesBBox(primitives: readonly DrawablePrimitive[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const { shape, translate } of primitives) {
    if (!(shape instanceof UPath)) continue;
    const dx = translate.getDx();
    const dy = translate.getDy();
    minX = Math.min(minX, shape.getMinX() + dx);
    minY = Math.min(minY, shape.getMinY() + dy);
    maxX = Math.max(maxX, shape.getMaxX() + dx);
    maxY = Math.max(maxY, shape.getMaxY() + dy);
  }
  return { minX, minY, maxX, maxY };
}

/** True when at least one collected primitive is a `UEllipse` (a decomposed
 *  `<circle>`) or `UText` (a decomposed `<text>`) -- the two element kinds
 *  the T9 positioning fix restores (previously silently dropped). */
function hasNonPathPrimitive(primitives: readonly DrawablePrimitive[]): boolean {
  return primitives.some(({ shape }) => !(shape instanceof UPath));
}

// ---------------------------------------------------------------------------
// makeAtomImageResolverFor — SVG sprites decompose to `drawable` primitives
// (svg-sprite-nanoparser T9, ADR-2): width/height stay the DECLARED box,
// ink lives ONLY inside `primitives` -- never collapsed into one channel.
// ---------------------------------------------------------------------------

describe('makeAtomImageResolverFor — SVG sprite atoms resolve to kind: "drawable" (T9)', () => {
  test('an SVG sprite resolves to kind: "drawable" with UPath primitives, not an image data URI', () => {
    const registry = buildSpriteRegistryWithSvg('sq', SQUARE_SVG);
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'sq', scale: 1 };
    const result = resolve(atom);
    expect(result?.kind).toBe('drawable');
    if (result?.kind !== 'drawable') throw new Error('expected the drawable variant');
    expect(result.primitives).toHaveLength(1);
    expect(result.primitives[0]!.shape).toBeInstanceOf(UPath);
  });

  test('width/height are the DECLARED (scaled) box -- IDENTICAL to measureInlineAtom, same as the image variant', () => {
    const registry = buildSpriteRegistryWithSvg('sq', SQUARE_SVG);
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'sq', scale: 1 };
    const result = resolve(atom);
    if (result?.kind !== 'drawable') throw new Error('expected the drawable variant');

    const dims = measureInlineAtom(atom, { get: (name) => (name === 'sq' ? { width: 10, height: 10 } : undefined) }, FONT.size);
    expect(result.width).toBe(dims.width);
    expect(result.height).toBe(dims.height);
    expect(result.width).toBeCloseTo(10 * (14 / 13), 10); // 10 * scale(1) * size/13, S1L-f
  });

  test('spriteScale applies to the decomposition IDENTICALLY to the declared box (S1L-f, interface contract)', () => {
    const registry = buildSpriteRegistryWithSvg('sq', SQUARE_SVG);
    // FONT.size (14) cancels spriteScale's ambient-size factor down to just
    // atom.scale when paired with a 13px font -- use a 13px font here so the
    // resulting numbers are exact integers, not floating approximations.
    const font13: FontConfiguration = { ...FONT, size: 13 };
    const resolve = makeAtomImageResolverFor(registry)(font13);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'sq', scale: 2.5 };
    const result = resolve(atom);
    if (result?.kind !== 'drawable') throw new Error('expected the drawable variant');

    expect(spriteScale(2.5, 13)).toBe(2.5);
    expect(result.width).toBe(25); // declared 10 * scale 2.5
    expect(result.height).toBe(25);
    // SQUARE_SVG's path traces the declared box's own corners exactly, so at
    // an IDENTITY-cancelling font size the primitives' bbox equals the SAME
    // 25x25 the declared box reports -- proves the scale factor threads to
    // the decomposition, not just to measureInlineAtom's own formula.
    const bbox = primitivesBBox(result.primitives);
    expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 25, maxY: 25 });
  });

  test('declared box and drawn ink are STRUCTURALLY SEPARATE channels (ADR-2 central claim): bi-globe declares 16x16 but its arc-drawn primitives ink a smaller box', () => {
    const registry = buildSpriteRegistryWithSvg('bi-globe', BI_GLOBE_SVG);
    const font13: FontConfiguration = { ...FONT, size: 13 };
    const resolve = makeAtomImageResolverFor(registry)(font13);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'bi-globe', scale: 1 };
    const result = resolve(atom);
    if (result?.kind !== 'drawable') throw new Error('expected the drawable variant');

    // width/height: the DECLARED box, unaffected by ink -- ADR-2's non-goal
    // (this is NOT the deleted inkX/inkY/inkWidth/inkHeight measurement
    // channel; nothing here computes an "ink box" and assigns it to width/
    // height).
    expect(result.width).toBe(16);
    expect(result.height).toBe(16);

    // The drawn primitives' own bbox is jar-verified SMALLER than the
    // declared box (ADR-1's proven UPath/pathBBox minmax equivalence is the
    // oracle here, not a hand-computed number): the outer circle is an ARC,
    // and UPath.addInternal (ADR-1) records only an arc's endpoint.
    const expectedInk = pathBBox(BI_GLOBE_D)!;
    const bbox = primitivesBBox(result.primitives);
    expect(bbox.minX).toBeCloseTo(expectedInk.minX, 10);
    expect(bbox.minY).toBeCloseTo(expectedInk.minY, 10);
    expect(bbox.maxX).toBeCloseTo(expectedInk.maxX, 10);
    expect(bbox.maxY).toBeCloseTo(expectedInk.maxY, 10);
    // The declared box (16 tall) genuinely differs from the ink box --
    // proves this is a real narrowing, not a no-op assertion.
    expect(bbox.maxY - bbox.minY).toBeLessThan(result.height);
  });

  test('a <circle>-bearing REAL stdlib body (edgy bIdentityLogo) contributes UEllipse ink -- T9 positioning fix (maintainer-required)', () => {
    // Loaded verbatim from the vendored stdlib bundle, not hand-authored --
    // `assets/stdlib/edgy/edgy.puml`'s `$bIdentityLogo` is the ONE bundled
    // sprite the maintainer named as exercising `<circle>` (two, inside a
    // `<g fill="#00ea4e">`), the exact element kind `drawCircle` decomposes
    // to a `UEllipse` -- previously silently dropped by the collector
    // (ADR-2's original `UPath[]`-only shape), now widened to `UShape[]`.
    const edgyPuml = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../assets/stdlib/edgy/edgy.puml'),
      'utf8',
    );
    const svgMatch = /sprite \$bIdentityLogo (<svg[\s\S]*?<\/svg>)/.exec(edgyPuml);
    if (svgMatch === null) throw new Error('bIdentityLogo sprite not found in assets/stdlib/edgy/edgy.puml');
    const registry = buildSpriteRegistryWithSvg('bIdentityLogo', svgMatch[1]!);
    // A 13px font makes spriteScale(1, 13) === 1 (identity) -- exact integer
    // assertions below, not floating approximations (same convention the
    // scale-threading test above uses).
    const font13: FontConfiguration = { ...FONT, size: 13 };
    const resolve = makeAtomImageResolverFor(registry)(font13);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'bIdentityLogo', scale: 1 };
    const result = resolve(atom);
    if (result?.kind !== 'drawable') throw new Error('expected the drawable variant');

    // Declared box: the sprite's `viewBox="0 0 32 32"` (no width/height
    // attributes) -- unaffected by ink, same as every other assertion here.
    expect(result.width).toBe(32);
    expect(result.height).toBe(32);

    // The fix under test: at least one collected primitive is a UEllipse
    // (the two <circle>s), not silently dropped.
    expect(hasNonPathPrimitive(result.primitives)).toBe(true);
    const ellipses = result.primitives.filter((p) => p.shape instanceof UEllipse);
    expect(ellipses).toHaveLength(2);
    // Each carries a REAL position (not the origin -- `cx="17" cy="14"
    // r="10"` and `cx="7.5" cy="25.5" r="2.5"` in the source): a dropped
    // translate would silently zero these out.
    const translates = ellipses.map((p) => ({ dx: p.translate.getDx(), dy: p.translate.getDy() }));
    expect(translates).toEqual(
      expect.arrayContaining([
        { dx: 7, dy: 4 }, // cx-rx, cy-ry for the r=10 circle
        { dx: 5, dy: 23 }, // cx-rx, cy-ry for the r=2.5 circle
      ]),
    );

    // Draw-time proof: buildTextBlock actually emits two <ellipse> elements
    // at their real (translated) positions, not the atom's origin -- the
    // atom is the line's ONLY content (LEFT align => origin (0,0)), and
    // scale 1 round-trips the translate exactly back to the source's OWN
    // cx/cy (7+10=17, 4+10=14).
    const ug = newGraphic();
    buildTextBlock('<$bIdentityLogo>', font13, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();
    const ellipseTags = svg.match(/<ellipse[^>]*>/g) ?? [];
    expect(ellipseTags).toHaveLength(2);
    expect(svg).toContain('cx="17"');
    expect(svg).toContain('cy="14"');
  });

  test('an unknown SVG sprite name still resolves to undefined -- StripeSimple.addSprite parity holds for both sprite kinds', () => {
    const registry = buildSpriteRegistryWithSvg('sq', SQUARE_SVG);
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'does-not-exist', scale: 1 };
    expect(resolve(atom)).toBeUndefined();
  });

  test('a monochrome sprite in the SAME registry still resolves to kind: "image" -- only SVG-form sprites decompose', () => {
    const registry = buildSpriteRegistryWithSvg('sq', SQUARE_SVG);
    const mono = new SpriteMonochrome(4, 4, 16);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) mono.setGray(x, y, (x + y) % 16);
    addSprite(registry, 'foo', mono);
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    expect(resolve({ kind: 'sprite', name: 'foo', scale: 1 })?.kind).toBe('image');
    expect(resolve({ kind: 'sprite', name: 'sq', scale: 1 })?.kind).toBe('drawable');
  });

  test('buildTextBlock draws the SVG sprite\'s decomposed primitives as <path> elements, not <image>', () => {
    const registry = buildSpriteRegistryWithSvg('sq', SQUARE_SVG);
    const ug = newGraphic();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    buildTextBlock('Icon <$sq>', FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();

    expect(svg).toContain('<path');
    expect(svg).not.toContain('<image');
  });
});

// ---------------------------------------------------------------------------
// scanLineForAtoms — ordered render segments (T7's own render-side addition)
// ---------------------------------------------------------------------------

describe('scanLineForAtoms — render segments', () => {
  test('interleaves text and atom segments in source order', () => {
    const scan = scanLineForAtoms(`before <$foo> middle <img:${TINY_PNG_URI}> after`);
    expect(scan.segments.map((s) => s.kind)).toEqual(['text', 'atom', 'text', 'atom', 'text']);
    expect(scan.segments[0]).toEqual({ kind: 'text', text: 'before ' });
    expect((scan.segments[1] as { kind: 'atom'; atom: InlineAtomToken }).atom.kind).toBe('sprite');
    expect(scan.segments[2]).toEqual({ kind: 'text', text: ' middle ' });
    expect((scan.segments[3] as { kind: 'atom'; atom: InlineAtomToken }).atom.kind).toBe('img');
    expect(scan.segments[4]).toEqual({ kind: 'text', text: ' after' });
  });

  test('omits empty text runs (atom immediately followed by another atom)', () => {
    const scan = scanLineForAtoms('<$foo><$bar>');
    expect(scan.segments).toEqual([
      { kind: 'atom', atom: { kind: 'sprite', name: 'foo', scale: 1 } },
      { kind: 'atom', atom: { kind: 'sprite', name: 'bar', scale: 1 } },
    ]);
  });

  test('an atom-free line is a single text segment', () => {
    const scan = scanLineForAtoms('plain text, no atoms');
    expect(scan.segments).toEqual([{ kind: 'text', text: 'plain text, no atoms' }]);
  });
});

// ---------------------------------------------------------------------------
// makeAtomImageResolverFor — seam (a)/(b) reconciliation + D9 agreement
// ---------------------------------------------------------------------------

describe('makeAtomImageResolverFor', () => {
  test('img atom: href passed through VERBATIM (D7), dims = IHDR * scale', () => {
    const resolve = makeAtomImageResolverFor(undefined)(FONT);
    const atom: InlineAtomToken = { kind: 'img', dataUri: TINY_PNG_URI, scale: 2, width: 2, height: 2 };
    const result = resolve(atom);
    expect(result?.kind).toBe('image');
    if (result?.kind !== 'image') throw new Error('expected the image variant');
    // The output href string EQUALS the input dataUri (assertion the
    // mission brief calls out explicitly).
    expect(result.href).toBe(TINY_PNG_URI);
    expect(result.width).toBe(4); // 2 * scale(2)
    expect(result.height).toBe(4);
  });

  test('img atom resolves even with no sprite registry at all', () => {
    const resolve = makeAtomImageResolverFor(undefined)(FONT);
    const atom: InlineAtomToken = { kind: 'img', dataUri: TINY_PNG_URI, scale: 1, width: 2, height: 2 };
    expect(resolve(atom)).toEqual({ kind: 'image', href: TINY_PNG_URI, width: 2, height: 2 });
  });

  test('sprite atom: resolves via the registry to a tinted PNG data URI, dims agree with measureInlineAtom (D9)', () => {
    const registry = buildSpriteRegistryWithFoo();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'foo', scale: 2 };
    const result = resolve(atom);
    expect(result?.kind).toBe('image');
    if (result?.kind !== 'image') throw new Error('expected the image variant');
    expect(result.href.startsWith('data:image/png;base64,')).toBe(true);

    // "Drawing and measuring agree by construction" (this task's charter):
    // the resolver's width/height must equal measureInlineAtom's own
    // numbers — the SAME ones leaf-sizing.ts used to size the label box
    // during layout.
    // The resolver threads its own FONT.size, so the cross-check must too --
    // `CommandCreoleSprite.java:82` scales a creole sprite by the ambient
    // font size over a 13px reference (S1L-f, jar-verified).
    const dims = measureInlineAtom(
      atom,
      { get: (name) => (name === 'foo' ? { width: 4, height: 4 } : undefined) },
      FONT.size,
    );
    expect(result.width).toBe(dims.width);
    expect(result.height).toBe(dims.height);
    expect(result.width).toBeCloseTo(4 * 2 * (14 / 13), 10); // 4 * scale(2) * size/13
  });

  test('unknown sprite name resolves to undefined -- skip, matching StripeSimple.addSprite (never added)', () => {
    const registry = buildSpriteRegistryWithFoo();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'does-not-exist', scale: 1 };
    expect(resolve(atom)).toBeUndefined();
  });

  test('sprite atom resolves to undefined when there is no registry at all', () => {
    const resolve = makeAtomImageResolverFor(undefined)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'foo', scale: 1 };
    expect(resolve(atom)).toBeUndefined();
  });

  test('forcedColor overrides fontColor for the tint gradient (does not throw, still resolves)', () => {
    const registry = buildSpriteRegistryWithFoo();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    const atom: InlineAtomToken = { kind: 'sprite', name: 'foo', scale: 1, forcedColor: '#FF0000' };
    const result = resolve(atom);
    expect(result).toBeDefined();
    // Cross-check against calling spriteToPngDataUri directly with the same
    // forcedColor -- the resolver must use forcedColor, not fontColor, as
    // the tint's dark end (AtomSprite: `forcedColor == null ? fontColor : forcedColor`).
    const sprite = new SpriteMonochrome(4, 4, 16);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) sprite.setGray(x, y, (x + y) % 16);
    // Same scale the resolver now passes: requested 1 * FONT.size / 13.
    const direct = spriteToPngDataUri(
      spriteMonochromeAsLike(sprite),
      '#FF0000',
      undefined,
      spriteScale(1, FONT.size),
    );
    expect(result!.width).toBe(direct.width);
    expect(result!.height).toBe(direct.height);
  });
});

// ---------------------------------------------------------------------------
// buildTextBlock — end-to-end SVG <image> emission + byte-stability
// ---------------------------------------------------------------------------

describe('buildTextBlock — atom-aware SVG emission', () => {
  test('an atom-free line draws byte-identical output whether or not a resolver is supplied', () => {
    const ugNoResolver = newGraphic();
    buildTextBlock('plain label', FONT, HorizontalAlignment.LEFT).drawU(ugNoResolver);
    const svgNoResolver = ugNoResolver.getSvgString();

    const ugWithResolver = newGraphic();
    const resolve = makeAtomImageResolverFor(undefined)(FONT);
    buildTextBlock('plain label', FONT, HorizontalAlignment.LEFT, resolve).drawU(ugWithResolver);
    const svgWithResolver = ugWithResolver.getSvgString();

    expect(svgWithResolver).toBe(svgNoResolver);
    expect(svgNoResolver).toContain('<text');
    expect(svgNoResolver).not.toContain('<image');
  });

  test('an img atom emits exactly one <image> element with the verbatim href', () => {
    const ug = newGraphic();
    const resolve = makeAtomImageResolverFor(undefined)(FONT);
    buildTextBlock(`Icon <img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();

    const imageMatches = svg.match(/<image[^>]*>/g) ?? [];
    expect(imageMatches).toHaveLength(1);
    expect(svg).toContain(`xlink:href="${TINY_PNG_URI}"`);
    // Still draws the "Icon " text segment ahead of the image.
    expect(svg).toContain('<text');
  });

  test('a resolved sprite atom emits exactly one <image> element', () => {
    const registry = buildSpriteRegistryWithFoo();
    const ug = newGraphic();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    buildTextBlock('Icon <$foo>', FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();

    const imageMatches = svg.match(/<image[^>]*>/g) ?? [];
    expect(imageMatches).toHaveLength(1);
    expect(svg).toMatch(/<image[^>]*xlink:href="data:image\/png;base64,[^"]+"/);
  });

  test('an unknown sprite name renders NOTHING for that atom (no <image>, upstream StripeSimple parity)', () => {
    const registry = buildSpriteRegistryWithFoo();
    const ug = newGraphic();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    buildTextBlock('before <$nope> after', FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();

    expect(svg).not.toContain('<image');
    // The surrounding text still renders (skip the atom, not the line).
    expect(svg).toContain('before');
    expect(svg).toContain('after');
  });

  test('two atoms on one line each get their own <image>, x-advancing left to right', () => {
    const registry = buildSpriteRegistryWithFoo();
    const ug = newGraphic();
    const resolve = makeAtomImageResolverFor(registry)(FONT);
    buildTextBlock(`A <$foo> B <img:${TINY_PNG_URI}> C`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();

    const imageMatches = svg.match(/<image[^>]*>/g) ?? [];
    expect(imageMatches).toHaveLength(2);
    const xs = imageMatches.map((tag) => Number(/x="([0-9.]+)"/.exec(tag)![1]));
    expect(xs[1]).toBeGreaterThan(xs[0]!); // second atom sits to the right of the first
  });
});

// ---------------------------------------------------------------------------
// AtomImageResolver — optional ink fields (T3-seams, ADR-2)
// ---------------------------------------------------------------------------

describe('AtomImageResolver — optional ink fields (T3-seams, ADR-2)', () => {
  test('a resolver may report ink offsets distinct from the declared box', () => {
    const resolve: AtomImageResolver = (atom) => {
      if (atom.kind !== 'sprite') return undefined;
      return { kind: 'image', href: 'data:x', width: 16, height: 16, inkX: 1, inkY: 2, inkWidth: 12, inkHeight: 10 };
    };
    const atom: InlineAtomToken = { kind: 'sprite', name: 'bi-globe', scale: 1 };
    expect(resolve(atom)).toEqual({ kind: 'image', href: 'data:x', width: 16, height: 16, inkX: 1, inkY: 2, inkWidth: 12, inkHeight: 10 });
  });

  test('omitting the ink fields is still a valid AtomImageResolver return -- ADR-2 additive shape', () => {
    const resolve: AtomImageResolver = () => ({ kind: 'image', href: 'data:x', width: 16, height: 16 });
    const atom: InlineAtomToken = { kind: 'img', dataUri: TINY_PNG_URI, scale: 1, width: 2, height: 2 };
    expect(resolve(atom)).toEqual({ kind: 'image', href: 'data:x', width: 16, height: 16 });
  });

  test('the real render-time resolver (makeAtomImageResolverFor) still omits ink keys entirely -- byte-identical to pre-T3', () => {
    const resolve = makeAtomImageResolverFor(undefined)(FONT);
    const atom: InlineAtomToken = { kind: 'img', dataUri: TINY_PNG_URI, scale: 1, width: 2, height: 2 };
    const result = resolve(atom);
    expect(result).toEqual({ kind: 'image', href: TINY_PNG_URI, width: 2, height: 2 });
    expect(Object.keys(result!).sort()).toEqual(['height', 'href', 'kind', 'width']);
  });

  test('ink fields on a resolved atom change NEITHER the rendered SVG NOR the measured dimension -- nothing consumes them yet', () => {
    const withoutInk: AtomImageResolver = () => ({ kind: 'image', href: TINY_PNG_URI, width: 10, height: 10 });
    const withInk: AtomImageResolver = () => ({
      kind: 'image',
      href: TINY_PNG_URI,
      width: 10,
      height: 10,
      inkX: 3,
      inkY: 3,
      inkWidth: 4,
      inkHeight: 4,
    });
    const display = `Icon <img:${TINY_PNG_URI}>`;

    const ugA = newGraphic();
    buildTextBlock(display, FONT, HorizontalAlignment.LEFT, withoutInk).drawU(ugA);
    const ugB = newGraphic();
    buildTextBlock(display, FONT, HorizontalAlignment.LEFT, withInk).drawU(ugB);
    expect(ugB.getSvgString()).toBe(ugA.getSvgString());

    const bounder = new MeasurerStringBounder(measurer);
    const dimA = buildTextBlock(display, FONT, HorizontalAlignment.LEFT, withoutInk).calculateDimension(bounder);
    const dimB = buildTextBlock(display, FONT, HorizontalAlignment.LEFT, withInk).calculateDimension(bounder);
    expect(dimB).toEqual(dimA);
  });
});

// ---------------------------------------------------------------------------
// buildTextBlock — the <img> cannot-decode fallback is hardcoded to
// `AtomImg.java:106-107`'s `monospace(14)`/`blackBlueTrue`, never the
// per-element font (sizer-footprint-parity ADR-1). A PREVIOUS mission
// (T3-seams, ADR-3) threaded a `defaultFont` param here instead, believing
// the fallback should draw at the diagram default -- deleted; `buildTextBlock`
// no longer accepts that 7th parameter at all.
// ---------------------------------------------------------------------------

describe('buildTextBlock — the <img> cannot-decode fallback is hardcoded (ADR-1), not threaded', () => {
  // `<img:x/y.svg>` is the mission brief's own jar-verified fixture: neither
  // a data URI nor an http(s) URL, so `buildImgSpan` degrades it to the
  // short `(Cannot decode)` fallback text -- CANNOT_DECODE_TEXT, `creole-
  // atoms.ts`.
  const MALFORMED_IMG = '<img:x/y.svg>';
  // A second, DIFFERENT element font (serif, size 8, not 14) -- proves the
  // fallback ignores whatever reaches it via `font`.
  const OTHER_ELEMENT_FONT: FontConfiguration = { family: 'serif', size: 8, color: '#ff0000', styles: new Set() };
  const FALLBACK_TEXT_WIDTH = 100.3625; // jar-verified: "(Cannot decode)" at monospace 14.

  test('fallback measures at the hardcoded monospace(14) font, not the element font', () => {
    const dim = buildTextBlock(MALFORMED_IMG, FONT, HorizontalAlignment.LEFT).calculateDimension(
      new MeasurerStringBounder(measurer),
    );
    expect(dim.getWidth()).toBeCloseTo(FALLBACK_TEXT_WIDTH, 4);

    const ug = newGraphic();
    buildTextBlock(MALFORMED_IMG, FONT, HorizontalAlignment.LEFT).drawU(ug);
    const svg = ug.getSvgString();
    expect(svg).toContain('font-size="14"');
    expect(svg).toContain('font-family="monospace"');
  });

  test('two DIFFERENT element fonts produce the IDENTICAL fallback measurement -- the element font never reaches it', () => {
    const dimSans = buildTextBlock(MALFORMED_IMG, FONT, HorizontalAlignment.LEFT).calculateDimension(
      new MeasurerStringBounder(measurer),
    );
    const dimSerif = buildTextBlock(MALFORMED_IMG, OTHER_ELEMENT_FONT, HorizontalAlignment.LEFT).calculateDimension(
      new MeasurerStringBounder(measurer),
    );
    expect(dimSans.getWidth()).toBe(dimSerif.getWidth());
    expect(dimSans.getWidth()).toBeCloseTo(FALLBACK_TEXT_WIDTH, 4);

    const ugSans = newGraphic();
    buildTextBlock(MALFORMED_IMG, FONT, HorizontalAlignment.LEFT).drawU(ugSans);
    const ugSerif = newGraphic();
    buildTextBlock(MALFORMED_IMG, OTHER_ELEMENT_FONT, HorizontalAlignment.LEFT).drawU(ugSerif);
    // Same fallback glyph run in both cases -- font-size/font-family are the
    // hardcoded constant, not `FONT`'s 'sans-serif' or the other font's
    // 'serif'/red color.
    expect(ugSans.getSvgString()).toContain('font-size="14"');
    expect(ugSerif.getSvgString()).toContain('font-size="14"');
    expect(ugSans.getSvgString()).not.toContain('font-family="serif"');
    expect(ugSerif.getSvgString()).not.toContain('font-family="serif"');
  });

  test('a decodable <img> is unaffected -- only the cannot-decode fallback text run uses the hardcoded font', () => {
    const ug = newGraphic();
    buildTextBlock(`Icon <img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT).drawU(ug);
    expect(ug.getSvgString()).not.toContain('font-family="monospace"');
  });
});
