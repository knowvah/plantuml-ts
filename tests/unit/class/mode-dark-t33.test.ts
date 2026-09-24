/**
 * `skinparam mode dark` acceptance pin for the class engine (cdd-T33).
 *
 * Upstream mechanism: `SkinParam.isDark` (`skin/SkinParam.java:114-116`,
 * `"dark".equalsIgnoreCase(getValue("mode"))`) switches
 * `TitledDiagram#muteColorMapper` (`TitledDiagram.java:291-294`) to
 * `ColorMapper.DARK_MODE` (`klimt/color/ColorMapper.java:68-72`), which maps
 * every drawn `HColorSimple` through its baked-in `.dark` variant
 * (`klimt/color/HColorSimple.java:236-239`). The dark variant of each
 * default is baked in at style-PARSE time from `resources/skin/
 * plantuml.skin`'s `@media (prefers-color-scheme:dark) { ... }` block
 * (:563-776) — this port has no `@media` style-parser, so the block's
 * literal values are read directly into `core/theme-dark.ts#DARK_MODE_DEFAULTS`
 * and gated into the accumulator by `skinparam-theme-builder.ts#buildThemePartial`.
 *
 * Renders via `renderFixtureClass` + `DeterministicMeasurer`, mirroring
 * `layout-dpi.test.ts`'s (cdd-T30) pipeline and dot-cache-skip convention.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

function fixtureDir(slug: string): string {
  return join(process.cwd(), 'test-results', 'dot-cache', 'class', slug);
}

function readFixture(slug: string): { markup: string; oracle: string } {
  const dir = fixtureDir(slug);
  return {
    markup: readFileSync(join(dir, 'in.puml'), 'utf8'),
    oracle: readFileSync(join(dir, 'in.svg'), 'utf8'),
  };
}

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

const DARK_SLUG = 'zirori-93-jefo337';
// A conformant, `mode`-free class fixture (parity-class.json, pre-T33) --
// the wide-reach regression: dark's gated defaults must be a strict no-op
// when `mode` is unset.
const LIGHT_REGRESSION_SLUG = 'bajotu-30-soku184';

describe.skipIf(!existsSync(fixtureDir(DARK_SLUG)))(
  'layoutClass — skinparam mode dark (zirori-93-jefo337, class foo)',
  () => {
    it('renders byte-identical (structural+numeric) to the jar dark-mode in.svg', () => {
      const { markup, oracle } = readFixture(DARK_SLUG);
      const ours = render(markup);
      const { pass, diffs } = compareSvg(ours, oracle, 'deterministic');
      expect(
        pass,
        `class/${DARK_SLUG}: first diff ${diffs[0] === undefined ? '(none)' : JSON.stringify(diffs[0])}`,
      ).toBe(true);
    });

    it('root canvas background is #1B1B1B (document { BackGroundColor #1B1B1B }, plantuml.skin:572)', () => {
      const { markup } = readFixture(DARK_SLUG);
      const ours = render(markup);
      expect(ours).toContain('background:#1B1B1B');
      expect(ours).toContain('fill="#1B1B1B"');
    });

    it('classifier fill is #313139 (root { BackGroundColor #313139 }, plantuml.skin:568)', () => {
      const { markup } = readFixture(DARK_SLUG);
      const ours = render(markup);
      expect(ours).toContain('fill="#313139"');
    });

    it('classifier stroke is #E7E7E7 (root { LineColor #e7e7e7 }, plantuml.skin:567)', () => {
      const { markup } = readFixture(DARK_SLUG);
      const ours = render(markup);
      expect(ours).toContain('stroke="#E7E7E7"');
    });

    it('badge fill is #2E5233 (spot { spotClass { BackgroundColor #2E5233 } }, plantuml.skin:645)', () => {
      const { markup } = readFixture(DARK_SLUG);
      const ours = render(markup);
      expect(ours).toContain('fill="#2E5233"');
    });

    it('name text and badge glyph fill are #FFF (root { FontColor white }, plantuml.skin:566)', () => {
      const { markup } = readFixture(DARK_SLUG);
      const ours = render(markup);
      const whiteFillCount = (ours.match(/fill="#FFF"/g) ?? []).length;
      expect(whiteFillCount).toBe(2); // badge glyph path + classifier name text
    });

    it('root <g> draws 2 children: the document background rect + the entity group', () => {
      // The 10th diff (`svg/g[1][childCount] exp=2 act=1`) is NOT a missing
      // second layer -- `renderer.ts`'s EXISTING `documentBackgroundRect`
      // exclusion (`canonicalBackground !== '#000000' && !== '#FFFFFF' &&
      // !== transparent`) already draws this rect; it never fired because
      // `theme.colors.background` was never wired to a non-default value.
      const { markup } = readFixture(DARK_SLUG);
      const ours = render(markup);
      const rootGroupOpen = ours.indexOf('<g font-family="sans-serif" lengthAdjust="spacing">');
      expect(rootGroupOpen).toBeGreaterThan(-1);
      const afterOpen = ours.slice(rootGroupOpen);
      const rectIndex = afterOpen.indexOf('<rect');
      const entityGroupIndex = afterOpen.indexOf('<g class="entity"');
      expect(rectIndex).toBeGreaterThan(-1);
      expect(entityGroupIndex).toBeGreaterThan(rectIndex);
    });
  },
);

describe.skipIf(!existsSync(fixtureDir(LIGHT_REGRESSION_SLUG)))(
  'layoutClass — skinparam mode dark, wide-reach regression (mode unset)',
  () => {
    it(`${LIGHT_REGRESSION_SLUG}: byte-identical (structural+numeric) to the jar's light-mode in.svg`, () => {
      const { markup, oracle } = readFixture(LIGHT_REGRESSION_SLUG);
      const ours = render(markup);
      const { pass, diffs } = compareSvg(ours, oracle, 'deterministic');
      expect(
        pass,
        `class/${LIGHT_REGRESSION_SLUG}: first diff ${diffs[0] === undefined ? '(none)' : JSON.stringify(diffs[0])}`,
      ).toBe(true);
    });

    it('draws the default light background (#FFFFFF), not a dark-mode default', () => {
      const { markup } = readFixture(LIGHT_REGRESSION_SLUG);
      const ours = render(markup);
      expect(ours).not.toContain('#1B1B1B');
      expect(ours).not.toContain('#313139');
      expect(ours).not.toContain('#2E5233');
    });
  },
);
