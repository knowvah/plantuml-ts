/**
 * class-body-embedded-diagram-conformance.test.ts — CDD T27FU: TDD against
 * the three class-body `{{ }}` goldens the mission targets (moxobo-16-
 * tipo829 43x54 @ (13,43), zikabo-17-gugi332 67x64 @ (13,57), gadufu-56-
 * votu808 133x107 @ (13,75) — `test-results/dot-cache/class/<slug>/in.svg`).
 *
 * gadufu is END-TO-END real (`renderSync` on the cached `.puml`, full
 * production pipeline, `isEnhancedBody` already true for it thanks to its
 * real `-- subsection --` separator). moxobo/zikabo are NOT: `.agent-notes/
 * cdd-T27.md` records the exact blocker — `class-body-enhanced.ts
 * #isEnhancedBody` (EXCLUDED this task, T24 editing it concurrently) never
 * detects a `{{ }}` opener with no separator/tree marker, so neither
 * fixture's body is currently routed through `measureEnhancedBody` at all.
 * Their tests below call `measureEnhancedBody` DIRECTLY on the fixture's
 * own cached raw body lines (bypassing the blocked `isEnhancedBody` gate)
 * to prove the embed EXTRACTION+RENDER mechanism itself is byte-exact
 * against the jar target — real production code, just not yet reachable
 * end-to-end. See the trailing `it.todo` block for what full `renderSync`
 * conformance and a real self-embedding fixture need (a MORE PRECISE
 * finding than "isEnhancedBody's missing disjunct" — see that block's own
 * comment).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { measureEnhancedBody, type EnhancedLayoutCtx } from '../../../src/diagrams/class/class-body-enhanced-layout.js';
import { createNestedDiagramRenderer } from '../../../src/diagrams/class/class-nested-diagram-renderer.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function cachedPuml(slug: string): string {
  return readFileSync(join(REPO_ROOT, 'test-results/dot-cache/class', slug, 'in.puml'), 'utf-8');
}

/** Same extraction convention as the other class conformance suites:
 *  entities are siblings at the same nesting depth, so the next `<!--` (or
 *  end of string) is a safe end bound. */
function entityGroup(svg: string, marker: string): string {
  const start = svg.indexOf(marker);
  if (start === -1) throw new Error(`marker "${marker}" not found in rendered SVG`);
  const bodyStart = svg.indexOf('<g class="entity"', start);
  const next = svg.indexOf('<!--', bodyStart + 1);
  return svg.slice(bodyStart, next === -1 ? svg.length : next);
}

function imageTags(svg: string): string[] {
  return svg.match(/<image[^>]*>/g) ?? [];
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
}

function decodeHref(href: string): string {
  return Buffer.from(href.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
}

describe('gadufu-56-votu808 — end-to-end, real renderSync, isEnhancedBody already true', () => {
  const svg = renderSync(cachedPuml('gadufu-56-votu808'), { measurer: new WidthTableMeasurer() });
  const group = entityGroup(svg, '<g class="entity"');

  it('draws exactly one <image> for the {{ start / :Использовать; }} block', () => {
    expect(imageTags(group)).toHaveLength(1);
  });

  it('positions the <image> at the jar-verified (13, 75)', () => {
    const [tag] = imageTags(group);
    expect(attr(tag!, 'x')).toBe('13');
    expect(attr(tag!, 'y')).toBe('75');
  });

  it('the <image> payload is a real recursive render (ACTIVITY engine, the Cyrillic activity text), not the (42,42) fallback', () => {
    const [tag] = imageTags(group);
    const decoded = decodeHref(attr(tag!, 'xlink:href')!);
    expect(decoded).toContain('data-diagram-type="ACTIVITY"');
    expect(decoded).toContain('Использовать');
    // NOT asserted equal to the jar's own 133x107: the residual (this
    // port's 121x96, `.agent-notes/cdd-T27.md`'s own arithmetic finding)
    // belongs to the ACTIVITY engine's Cyrillic text measurement /
    // upstream's own sizing-vs-drawing asymmetry for this embed, not the
    // class-engine embedding mechanism under test here.
    expect(attr(tag!, 'width')).not.toBe('42');
    expect(attr(tag!, 'height')).not.toBe('42');
  });
});

describe('moxobo/zikabo — the extraction+render mechanism, byte-exact, called directly (blocked end-to-end on isEnhancedBody)', () => {
  function ctx(): EnhancedLayoutCtx {
    const measurer = new WidthTableMeasurer();
    return {
      fontSpec: { family: 'sans-serif', size: 14 },
      measurer,
      sprites: undefined,
      baselineOffset: 10,
      bodyTop: 0,
      nestedRenderer: createNestedDiagramRenderer((source) => renderSync(source, { measurer })),
    };
  }

  it('moxobo-16-tipo829: {{ file f }} sizes to the jar-verified 43x54, no member rows survive', () => {
    const geo = measureEnhancedBody(['{{', 'file f', '}}'], ctx());
    const rowsPart = geo.parts.find((p) => p.kind === 'rows');
    expect(rowsPart?.rows).toEqual([]);
    expect(rowsPart?.embeds).toHaveLength(1);
    expect(rowsPart?.embeds?.[0]?.width).toBe(43);
    expect(rowsPart?.embeds?.[0]?.height).toBe(54);
    const decoded = decodeHref(rowsPart!.embeds![0]!.href!);
    expect(decoded).toContain('data-diagram-type="DESCRIPTION"');
    expect(decoded).toContain('>f<');
  });

  it('zikabo-17-gugi332: "- field" survives as a member row, {{ node n }} sizes to the jar-verified 67x64, stacked below it', () => {
    const geo = measureEnhancedBody(['- field', '{{', 'node n', '}}'], ctx());
    const rowsPart = geo.parts.find((p) => p.kind === 'rows');
    expect(rowsPart?.rows).toHaveLength(1);
    expect(rowsPart?.rows[0]?.text).toBe('field');
    expect(rowsPart?.embeds).toHaveLength(1);
    expect(rowsPart?.embeds?.[0]?.width).toBe(67);
    expect(rowsPart?.embeds?.[0]?.height).toBe(64);
    // Stacked BELOW the one member row (MethodsOrFieldsArea.java:141-152's
    // own dimension order) -- the embed's local y is strictly after the
    // member row's own y.
    expect(rowsPart?.embeds?.[0]?.y).toBeGreaterThan(rowsPart!.rows[0]!.y);
  });
});

// ---------------------------------------------------------------------------
// Documented, not silently skipped — see .agent-notes/cdd-T27.md
// ---------------------------------------------------------------------------

describe('blocked on out-of-write-set wiring — see .agent-notes/cdd-T27.md for the exact mechanism', () => {
  it.todo(
    'moxobo-16-tipo829/zikabo-17-gugi332 render one <image> through a real renderSync(cached .puml) call ' +
      '(needs class-body-enhanced.ts#isEnhancedBody to also trigger on a bare {{ }} opener with no separator/ ' +
      'tree marker -- EXCLUDED this task, T24 editing it concurrently; the embed extraction+render mechanism ' +
      'itself is proven byte-exact above, called directly)',
  );

  it.todo(
    'a self-embedding CLASS body ("class C { {{ class C { ... } }} }") throws EmbeddedDiagramDepthError through ' +
      'a real renderSync(...) call -- NOT reachable at ANY depth >= 2 today, for a reason MORE PRECISE than the ' +
      'isEnhancedBody gap above: src/diagrams/class/parser.ts#handlePendingBodyLine tests EVERY body line against ' +
      'the bare "}" close-body regex unconditionally (no embedded-block awareness at parse time, unlike the ' +
      'TYPE0/TYPE1 path class-embedded-block.ts/class-multiline-element.ts already solve for "[ ... ]" bodies) -- ' +
      'a nested class declaration\'s OWN closing "}" inside a {{ }} region prematurely closes the OUTER class body ' +
      'before the embed is ever collected, regardless of isEnhancedBody or the recursion guard. Verified by direct ' +
      'probe (2026-09-22): "class C {\\n--\\n{{\\nclass C {\\n--\\n{{\\nfield\\n}}\\n}\\n}}\\n}" renders a ' +
      '"Syntax Error?" refusal box, not a depth error. The guard itself IS proven, at the renderer-unit level, in ' +
      'class-nested-diagram-renderer.test.ts (4 tests, real depth accounting, no mock).',
  );
});
