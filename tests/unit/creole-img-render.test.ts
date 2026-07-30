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
import { describe, expect, test } from 'vitest';
import { scanLineForAtoms, type AtomImageResolver, type InlineAtomToken } from '../../src/core/creole-atoms.js';
import { measureInlineAtom, spriteScale } from '../../src/core/creole-atoms-measure.js';
import { createSpriteRegistry, addSprite } from '../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../src/core/klimt/sprite/SpriteMonochrome.js';
import { spriteMonochromeAsLike, spriteToPngDataUri } from '../../src/core/klimt/sprite/sprite-raster.js';
import { encodePng, toBase64DataUri } from '../../src/core/klimt/sprite/png-encoder.js';
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
