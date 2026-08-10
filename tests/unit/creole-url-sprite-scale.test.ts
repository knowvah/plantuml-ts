/**
 * G10 (mission `s1l-tail-fix`, task F2-c) — a `<$sprite>` inside a
 * `[[url label]]` link takes its RAW parsed scale, NOT
 * `CommandCreoleSprite`'s `* fc.getSize2D() / 13.0` factor.
 *
 * Upstream builds a url-label sprite through a SECOND constructor,
 * `AtomTextUtils#createAtomTextForUrl` (`java:119-127`), which hands
 * `Parser.getScale(...)` straight to `AtomSprite`; the ordinary inline path
 * (`CommandCreoleSprite#executeAndAdvance`, `java:82`) multiplies by the
 * font ratio first. Our port emitted one undifferentiated sprite token for
 * both contexts, so the factor applied unconditionally.
 *
 * Every number asserted below is a jar measurement taken with the pinned
 * deterministic oracle:
 *
 *   java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<d> \
 *     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <d> <f>.puml
 *
 * The `$maxime [48x48/16z]` sprite (borrowed verbatim from
 * `oracle/goldens/description/bivira-53-boja685/input.puml`, the fixture
 * this closes) measures `48 x 14/13 = 51.6923` outside a link and flat `48`
 * inside one, at the default element font 14.
 *
 * The DOT-dimension and SVG-geometry cases are deliberately kept in ONE
 * file: `planning/sizer-renderer-parity.md` requires the sizer and the
 * renderer to move together, and a sprite that measures 48 while it draws
 * 51.69 is a worse bug than the one being fixed. Asserting both off the
 * same markup is what makes that lockstep a test rather than a convention.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../src/index.js';
import { setLayoutInputObserver } from '../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../../src/core/measurer.js';
import { dotInputToStructural } from '../oracle/svek-dot.js';
import { spriteAtomScale, spriteScale, measureInlineAtom } from '../../src/core/creole-atoms-measure.js';
import type { SpriteAtomToken, SpriteDimsLookup } from '../../src/core/creole-atoms.js';
import { buildLineAtoms } from '../../src/core/klimt/creole/legacy/StripeSimple.js';
import type { FontConfiguration } from '../../src/core/klimt/shape/UText.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The `[48x48/16z]` encoded sprite declaration from `bivira-53-boja685` —
 *  reused verbatim so the jar numbers below are the fixture's own, not a
 *  re-derivation. Lines 2..10 of that fixture are the `sprite $maxime`
 *  block. */
const MAXIME_SPRITE_DECL = readFileSync(
  join(REPO, 'oracle', 'goldens', 'description', 'bivira-53-boja685', 'input.puml'),
  'utf8',
)
  .split('\n')
  .slice(1, 10)
  .join('\n');

const ELEMENT_FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

/** The sprite's declared box, and its two jar-measured scaled widths. */
const SPRITE_DECLARED_PX = 48;
const SPRITE_SCALED_AT_FONT_14 = (SPRITE_DECLARED_PX * 14) / 13; // 51.6923…

function diagram(body: string): string {
  return `@startuml\n${MAXIME_SPRITE_DECL}\n${body}\n@enduml\n`;
}

/** Every DOT node's `width x height` in inches, in emission order. A
 *  single-entity diagram emits no DOT at all, so each probe carries a
 *  throwaway second element and one edge. */
function dotNodeDims(markup: string): { width: number; height: number }[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(markup, { measurer: new WidthTableMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  const structural = dotInputToStructural(captured[0]!) as unknown as {
    nodes: { width: number; height: number }[];
  };
  return structural.nodes.map((n) => ({ width: n.width, height: n.height }));
}

/** Every `<image>` element's declared box in the rendered SVG. */
function svgImageBoxes(markup: string): { width: number; height: number }[] {
  const svg = renderSync(markup, { measurer: new WidthTableMeasurer() });
  return [...svg.matchAll(/<image\s[^>]*?width="([0-9.]+)"[^>]*?height="([0-9.]+)"/g)].map((m) => ({
    width: Number(m[1]),
    height: Number(m[2]),
  }));
}

const URL_LABEL_SPRITE = diagram(
  'rectangle "You can click\\n[[http://www.google.com <$maxime>]]" as R1\nrectangle "qq" as Z9\nR1 --> Z9',
);
const BARE_SPRITE = diagram('rectangle "<$maxime>" as R1\nrectangle "qq" as Z9\nR1 --> Z9');

// ---------------------------------------------------------------------------
// spriteAtomScale — the single scaling site the sizer and renderer share
// ---------------------------------------------------------------------------

describe('spriteAtomScale', () => {
  const inline: SpriteAtomToken = { kind: 'sprite', name: 'maxime', scale: 1 };
  const inUrl: SpriteAtomToken = { kind: 'sprite', name: 'maxime', scale: 1, insideUrl: true };

  it('applies CommandCreoleSprite’s fontSize/13 factor on the ordinary inline path', () => {
    expect(spriteAtomScale(inline, 14)).toBeCloseTo(14 / 13, 12);
    expect(spriteAtomScale(inline, 26)).toBe(2);
  });

  it('returns the RAW parsed scale for a sprite inside a [[url label]], at every font size', () => {
    expect(spriteAtomScale(inUrl, 14)).toBe(1);
    expect(spriteAtomScale(inUrl, 26)).toBe(1);
    expect(spriteAtomScale({ ...inUrl, scale: 0.31 }, 14)).toBe(0.31);
  });

  it('agrees with spriteScale exactly whenever insideUrl is unset (no other behaviour changes)', () => {
    for (const size of [8, 13, 14, 21, 26]) {
      expect(spriteAtomScale({ ...inline, scale: 2.5 }, size)).toBe(spriteScale(2.5, size));
    }
  });

  it('keeps the ambient-font-less default at the 13px reference on the inline path', () => {
    expect(spriteAtomScale(inline)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// measureInlineAtom — the jar's two calibration points for $maxime
// ---------------------------------------------------------------------------

describe('measureInlineAtom — url-label sprite', () => {
  const sprites: SpriteDimsLookup = {
    get: (name) => (name === 'maxime' ? { width: SPRITE_DECLARED_PX, height: SPRITE_DECLARED_PX } : undefined),
  };

  it('measures a 48x48 sprite at 51.6923 outside a link (jar: 48 x 14/13)', () => {
    const dims = measureInlineAtom({ kind: 'sprite', name: 'maxime', scale: 1 }, sprites, 14);
    expect(dims.width).toBeCloseTo(SPRITE_SCALED_AT_FONT_14, 10);
    expect(dims.height).toBeCloseTo(SPRITE_SCALED_AT_FONT_14, 10);
  });

  it('measures the SAME sprite at flat 48 inside a link (jar: raw parsed scale)', () => {
    const dims = measureInlineAtom({ kind: 'sprite', name: 'maxime', scale: 1, insideUrl: true }, sprites, 14);
    expect(dims).toEqual({ width: SPRITE_DECLARED_PX, height: SPRITE_DECLARED_PX });
  });

  it('leaves img atoms alone — upstream’s url branch passes a raw scale there too, and so does its inline branch', () => {
    const img = { kind: 'img', dataUri: 'data:image/png;base64,zz', scale: 2, width: 10, height: 20 } as const;
    expect(measureInlineAtom(img, sprites, 14)).toEqual({ width: 20, height: 40 });
  });
});

// ---------------------------------------------------------------------------
// StripeSimple — where the provenance is attached
// ---------------------------------------------------------------------------

describe('buildLineAtoms — url provenance on the inline atom token', () => {
  function spriteTokens(line: string): SpriteAtomToken[] {
    return buildLineAtoms(line, ELEMENT_FONT)
      .atoms.filter((a) => a.kind === 'inline')
      .map((a) => (a as { atom: SpriteAtomToken }).atom)
      .filter((t) => t.kind === 'sprite');
  }

  it('marks a sprite recognized inside a [[url label]] capture', () => {
    expect(spriteTokens('aa[[http://p.com <$maxime>]]')).toEqual([
      { kind: 'sprite', name: 'maxime', scale: 1, insideUrl: true },
    ]);
  });

  it('does NOT mark a sprite outside any link — the factor must still apply there', () => {
    expect(spriteTokens('aa<$maxime>')).toEqual([{ kind: 'sprite', name: 'maxime', scale: 1 }]);
  });

  it('does NOT leak the mark to a sprite AFTER the link closes (activeUrl is restored)', () => {
    expect(spriteTokens('[[http://p.com lbl]]<$maxime>')).toEqual([{ kind: 'sprite', name: 'maxime', scale: 1 }]);
  });

  it('preserves the markup’s own forced color alongside the mark', () => {
    expect(spriteTokens('[[http://p.com <#red$maxime>]]')).toEqual([
      { kind: 'sprite', name: 'maxime', forcedColor: 'red', scale: 1, insideUrl: true },
    ]);
  });

  it('preserves the markup’s own `*N` scale form alongside the mark', () => {
    expect(spriteTokens('[[http://p.com <$maxime*0.31>]]')).toEqual([
      { kind: 'sprite', name: 'maxime', scale: 0.31, insideUrl: true },
    ]);
  });

  /* Found while writing the case above; a SEPARATE, pre-existing defect,
   * deliberately left un-asserted rather than pinned at its current wrong
   * value. `CommandCreoleUrl.ts#resolveLabel` strips `{…}` GLOBALLY from the
   * whole `[[…]]` inner text to remove an optional tooltip, so a sprite's own
   * `{scale=N}` block inside the LABEL is eaten too and the scale silently
   * falls back to 1 — `[[http://p.com <$maxime{scale=0.31}>]]` yields
   * `scale: 1`, while `<$maxime{scale=0.31}>` outside a link yields 0.31.
   * Upstream's tooltip is POSITIONAL, not a global strip: `UrlBuilder`'s
   * `S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL` (`java:76-79`) matches
   * `link`, then an optional `\{([^{}]*)\}` immediately after it, then a
   * label whose FIRST character may not be a brace but whose remainder
   * (`[^\[\]]*`) may — so the label keeps its braces. `CommandCreoleUrl.ts`
   * is outside F2-c's write-set; reported, not fixed here. */
  it.todo('keeps a sprite’s {scale=N} block inside a url label (CommandCreoleUrl#resolveLabel brace strip)');

  it('leaves an openiconic atom inside a link unmarked — sprite-only divergence', () => {
    const atoms = buildLineAtoms('[[http://p.com <&cloud>]]', ELEMENT_FONT).atoms;
    const inline = atoms.filter((a) => a.kind === 'inline').map((a) => (a as { atom: { kind: string } }).atom);
    expect(inline).toEqual([{ kind: 'openiconic', name: 'cloud', scale: 1 }]);
  });
});

// ---------------------------------------------------------------------------
// End-to-end DOT dims (acceptance criteria 1-3) — jar numbers
// ---------------------------------------------------------------------------

describe('url-label sprite — measured DOT node dimensions', () => {
  it('a display whose second line is [[url <$maxime>]] matches the jar at 1.316840 x 1.138889in', () => {
    const [node] = dotNodeDims(URL_LABEL_SPRITE);
    expect(node!.width).toBeCloseTo(1.31684, 6);
    // 82px = 48 (raw sprite) + 14 (line 1) + 20 (margin). Pre-fix: 85.692,
    // i.e. +3.692 = 51.6923 - 48 exactly.
    expect(node!.height).toBeCloseTo(1.138889, 6);
  });

  it('regression guard: the SAME sprite OUTSIDE a link is unchanged at 71.692 x 71.692px', () => {
    const [node] = dotNodeDims(BARE_SPRITE);
    // 0.995726in = 71.692px = 51.6923 + 20 margin, on both axes.
    expect(node!.width).toBeCloseTo(0.995726, 6);
    expect(node!.height).toBeCloseTo(0.995726, 6);
    expect(node!.width * 72 - 20).toBeCloseTo(SPRITE_SCALED_AT_FONT_14, 3);
  });
});

// ---------------------------------------------------------------------------
// Sizer <-> renderer lockstep (acceptance criterion 4)
// ---------------------------------------------------------------------------

describe('url-label sprite — drawn geometry tracks measured geometry', () => {
  it('draws the url-label sprite at 48x48, the box it was measured at (jar: width=48 height=48)', () => {
    expect(svgImageBoxes(URL_LABEL_SPRITE)).toEqual([{ width: 48, height: 48 }]);
  });

  it('draws the un-linked sprite at 52x52 = round(51.6923), the box IT was measured at', () => {
    expect(svgImageBoxes(BARE_SPRITE)).toEqual([
      { width: Math.round(SPRITE_SCALED_AT_FONT_14), height: Math.round(SPRITE_SCALED_AT_FONT_14) },
    ]);
  });

  it('the two contexts differ by exactly the fontSize/13 factor in the DRAWN box too', () => {
    const [inLink] = svgImageBoxes(URL_LABEL_SPRITE);
    const [outside] = svgImageBoxes(BARE_SPRITE);
    expect(outside!.width - inLink!.width).toBe(Math.round(SPRITE_SCALED_AT_FONT_14) - SPRITE_DECLARED_PX);
  });
});
