/**
 * Activity TEXT census gate for the committed activity oracle corpus
 * (`activity-min-box-width` / T0, 2026-09-09).
 *
 * WHY A FOURTH PIN EXISTS BESIDE `diff-baseline.json`, `style-baseline.json`
 * AND `swimlane-baseline.json`. The ratchet pins one number per fixture
 * (`weightedScore`); the style census histograms font-size, stroke-width, rx,
 * text count and the canvas; the swimlane census pins the lane chrome. None
 * of them sees a text's `fill`, its `text-anchor`, or where it sits inside
 * its box. This mission lands four sequenced changes on the same 268
 * fixtures -- the width floor (T2), the stroke (T3), the text colour (T4)
 * and the text placement (T5) -- and against the three existing pins the
 * colour and the placement would be individually unattributable (D5,
 * `plans/activity-min-box-width/decisions.md`). This file is the instrument
 * that separates them.
 *
 * WHAT IS PINNED, per fixture, for OURS and for the committed JAR golden,
 * over the NORMALIZED tree (`normalize.ts` expands `style="..."` into
 * attributes, so `fill:#000` in a style and `fill="#000"` count once):
 *
 *   - `fill`      -- histogram of `fill` over every `<text>`, `(absent)`
 *                    counted. The jar draws the root `FontColor black`
 *                    (`plantuml.skin:9`) as `#000`; ours draws
 *                    `theme.colors.text` (`#181818`). D3's target.
 *   - `anchor`    -- histogram of `text-anchor` over every `<text>`,
 *                    `(absent)` counted. The jar emits NO `text-anchor` on
 *                    any activity text -- `FtileBox#drawU`
 *                    (`FtileBox.java:220-233`) positions its text block by
 *                    a translate and draws left-aligned; ours emits
 *                    `text-anchor="middle"` at the box centre. D2's target.
 *   - `inset`     -- histogram of `round3(text.x - rect.x)` for every
 *                    `<text>` whose immediately preceding ELEMENT sibling is
 *                    a `<rect>`: the action box and the text drawn right
 *                    after it. The jar's action text sits at `rect.x + 10`
 *                    (the box `Padding 10`, `plantuml.skin:360`, applied as
 *                    `padding.left` at `FtileBox.java:220-233`); ours sits
 *                    at `rect.x + width/2` because it is centre-anchored.
 *                    This is the quantity that tells a T5 x-placement move
 *                    from a T2 width move: narrowing the box moves OUR
 *                    inset (it is half the width) while the jar's stays 10.
 *   - `textCount` -- how many `<text>` elements exist. The tripwire: none
 *                    of T2-T5 may change an element count.
 *
 * THE SAME THREE-WAY STATUS DISCRIMINATION the sibling gates carry:
 * `baseline` (both sides measurable, histograms pinned), `error` (our parser
 * refuses -- NO numbers, D8 of `plans/activity-oracle-harness/decisions.md`),
 * `jar-error` (the golden is the jar's own error page -- NO numbers either
 * way, D12 ibid; detected on every run from the golden's own content via the
 * shared needle, never from a slug list; a fixture in both sets records
 * `jar-error`).
 *
 * AN EQUALITY PIN, NOT A RATCHET. T2-T5 each break it by design (T2 moves
 * OUR `inset`, T4 moves `fill`, T5 moves `anchor` and `inset`); T6 re-pins
 * ONCE from a fresh measurement and the DIFF of the pin is the mission's
 * evidence. Do not hand-edit an entry to make the gate pass, and do not
 * re-pin per task -- re-pinning early destroys the attribution this file
 * exists to buy.
 *
 * MEASURED THROUGH THE IDENTICAL SEAMS THE RATCHET GATE USES --
 * `renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`,
 * then `normalizeSvg`.
 *
 * THE CENSUS CODE LIVES IN `text-census.ts` (pure, no vitest import) so the
 * orchestrator's re-pin generator and this gate share ONE implementation --
 * a generator that re-derived the rules would be a second instrument.
 *
 * NO `describe.skipIf` (D4, ibid): `test-results/dot-cache/` is committed.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/activity.text-baseline.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { renderFixtureActivity } from './render-fixture-activity.js';
import { ABSENT, ACTIVITY_TYPE, JAR_ERROR_PAGE_RE, censusOf, checkCensus, round3, statusOf } from './text-census.js';
import type { FixtureRef, TextCensus, TextManifest } from './text-census.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, '../../../oracle/goldens/svg-activity/text-baseline.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as TextManifest;

function fixtureDir(f: FixtureRef): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: FixtureRef): boolean {
  const dir = fixtureDir(f);
  return existsSync(join(dir, 'in.puml')) && existsSync(join(dir, 'in.svg'));
}

const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');
const errorFixtures = manifest.fixtures.filter((f) => f.status === 'error');
const jarErrorFixtures = manifest.fixtures.filter((f) => f.status === 'jar-error');

function renderOrThrow(markup: string): string {
  return renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

// ---------------------------------------------------------------------------
// AC0 -- the committed corpus is present and complete, and the partition is
// the one the sibling ratchet records.
// ---------------------------------------------------------------------------

describe('svg-activity text census — corpus presence', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/activity/ is COMMITTED. Missing entries mean a broken or ` +
        `partial checkout, not a cache that needs regenerating. Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
  });

  it('the manifest lists exactly the committed activity fixtures', () => {
    const fromCache = readdirSync(join(CACHE_ROOT, ACTIVITY_TYPE))
      .filter((slug) => hasCachedFixture({ type: ACTIVITY_TYPE, slug }))
      .sort();
    const pinned = manifest.fixtures.map((f) => f.slug).sort();
    expect(pinned, 'the population is the committed corpus, never a slug list').toEqual(fromCache);
  });

  it('the partition matches the sibling ratchet: 268 baseline / 82 error / 23 jar-error', () => {
    expect(baselineFixtures.length).toBe(268);
    expect(errorFixtures.length).toBe(82);
    expect(jarErrorFixtures.length).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's OURS and JAR censuses equal their pin.
// ---------------------------------------------------------------------------

describe('svg-activity text census', () => {
  for (const f of baselineFixtures) {
    it(`activity/${f.slug}: text census matches its pin`, () => {
      const dir = fixtureDir(f);
      const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
      const golden = readFileSync(join(dir, 'in.svg'), 'utf8');

      const oursCheck = checkCensus(f, 'ours', f.ours, censusOf(renderOrThrow(markup)));
      expect(oursCheck.ok, oursCheck.message).toBe(true);

      const jarCheck = checkCensus(f, 'jar', f.jar, censusOf(golden));
      expect(
        jarCheck.ok,
        `${jarCheck.message} A JAR-side move means the COMMITTED GOLDEN changed under this pin ` +
          `-- a corpus event, not a port change. Find out what re-captured it before re-pinning.`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC2 -- the comparison discriminates, naming the fixture, the side and the
// moved histogram. In-memory only: fabricated censuses, never a
// text-baseline.json edit.
// ---------------------------------------------------------------------------

describe('svg-activity text census — comparison discrimination', () => {
  const sample: FixtureRef = { type: ACTIVITY_TYPE, slug: 'census-probe' };
  const base: TextCensus = {
    fill: { '#181818': 3 },
    anchor: { middle: 3 },
    inset: { '60': 2 },
    textCount: 3,
  };

  it('an identical census passes', () => {
    expect(checkCensus(sample, 'ours', base, { ...base }).ok).toBe(true);
  });

  it('a moved fill histogram fails, naming the fixture, the side and fill', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, fill: { '#000': 3 } });
    expect(ok).toBe(false);
    expect(message).toContain(`${sample.slug} [ours]`);
    expect(message).toContain('fill {');
    expect(message).toContain('#181818: pinned 3 -> now 0');
    expect(message).toContain('#000: pinned 0 -> now 3');
    expect(message).not.toContain('anchor');
    expect(message).not.toContain('inset');
  });

  it('a moved anchor histogram fails, naming anchor', () => {
    const { ok, message } = checkCensus(sample, 'jar', base, { ...base, anchor: { [ABSENT]: 3 } });
    expect(ok).toBe(false);
    expect(message).toContain(`${sample.slug} [jar]`);
    expect(message).toContain('anchor {');
    expect(message).toContain('(absent): pinned 0 -> now 3');
    expect(message).not.toContain('fill');
  });

  it('a moved inset histogram fails independently of fill and anchor', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, inset: { '10': 2 } });
    expect(ok).toBe(false);
    expect(message).toContain('inset {');
    expect(message).toContain('60: pinned 2 -> now 0');
    expect(message).toContain('10: pinned 0 -> now 2');
    expect(message).not.toContain('fill');
    expect(message).not.toContain('anchor');
  });

  it('a text-count move fails independently of any histogram move', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, textCount: 5 });
    expect(ok).toBe(false);
    expect(message).toContain('textCount: pinned 3 -> now 5');
    expect(message).not.toContain('fill');
  });

  it('an unpinned side fails rather than reading as "no change"', () => {
    const { ok, message } = checkCensus(sample, 'jar', undefined, base);
    expect(ok).toBe(false);
    expect(message).toContain('no "jar" census');
  });

  it('discrimination fires against a REAL golden, not only fabricated numbers', () => {
    const real = baselineFixtures.find((f) => (f.jar?.textCount ?? 0) > 0);
    expect(real, 'expected at least one baselined fixture with jar text').toBeDefined();
    const live = censusOf(readFileSync(join(fixtureDir(real!), 'in.svg'), 'utf8'));
    expect(checkCensus(real!, 'jar', real!.jar, live).ok).toBe(true);
    expect(checkCensus(real!, 'jar', { ...live, textCount: live.textCount + 1 }, live).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC2b -- the census itself reads the jar's model the way the Java draws it.
// ---------------------------------------------------------------------------

describe('svg-activity text census — the instrument', () => {
  it('rounds an inset to 3 dp', () => {
    expect(round3(26 - 16)).toBe(10);
    expect(round3(33.15 - 20)).toBe(13.15);
    expect(round3(0.1 + 0.2)).toBe(0.3);
  });

  it('counts the cizixu-00-koro700 golden the way FtileBox.java draws it', () => {
    const golden = readFileSync(join(CACHE_ROOT, ACTIVITY_TYPE, 'cizixu-00-koro700', 'in.svg'), 'utf8');
    const c = censusOf(golden);
    expect(c.textCount).toBe(2);
    expect(c.fill).toEqual({ '#000': 2 });
    expect(c.anchor).toEqual({ [ABSENT]: 2 });
    expect(c.inset).toEqual({ '10': 2 });
  });

  it('only a text whose immediately preceding element sibling is a rect gets an inset', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
      '<g><rect x="16" y="1" width="5" height="5"/><text x="26" y="4">a</text>' +
      '<line x1="0" y1="0" x2="1" y2="1"/><text x="40" y="4" fill="#000" text-anchor="middle">b</text></g>' +
      '<text x="3" y="9">c</text></svg>';
    const c = censusOf(svg);
    expect(c.textCount).toBe(3);
    expect(c.inset).toEqual({ '10': 1 });
    expect(c.fill).toEqual({ [ABSENT]: 2, '#000': 1 });
    expect(c.anchor).toEqual({ [ABSENT]: 2, middle: 1 });
  });

  it('derives the three-way status from the golden and our own outcome', () => {
    const jarError = readFileSync(join(CACHE_ROOT, ACTIVITY_TYPE, jarErrorFixtures[0]!.slug, 'in.svg'), 'utf8');
    expect(JAR_ERROR_PAGE_RE.test(jarError)).toBe(true);
    expect(statusOf(jarError, false)).toBe('jar-error');
    expect(statusOf(jarError, true)).toBe('jar-error');
    expect(statusOf('<svg/>', true)).toBe('error');
    expect(statusOf('<svg/>', false)).toBe('baseline');
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures carry no numbers, and still error.
// ---------------------------------------------------------------------------

describe('svg-activity text census — recorded parser-gap errors', () => {
  for (const f of errorFixtures) {
    it(`activity/${f.slug}: still errors as recorded, with no census`, () => {
      expect(f.reason, `${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.ours, `${f.slug}: an "error" entry must carry NO ours census`).toBeUndefined();
      expect(f.jar, `${f.slug}: an "error" entry must carry NO jar census`).toBeUndefined();
      const markup = readFileSync(join(fixtureDir(f), 'in.puml'), 'utf8');
      let threw = false;
      try {
        renderOrThrow(markup);
      } catch {
        threw = true;
      }
      expect(
        threw,
        `${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering SUCCEEDED ` +
          `this run. Move it to status "baseline" with a freshly measured census.`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC3b -- jar-error goldens, detected from the golden's own content.
// ---------------------------------------------------------------------------

describe('svg-activity text census — recorded jar-error goldens', () => {
  for (const f of jarErrorFixtures) {
    it(`activity/${f.slug}: golden is still a jar error page, with no census`, () => {
      expect(f.reason, `${f.slug}: a "jar-error" entry must carry a reason`).toBeTruthy();
      expect(f.ours, `${f.slug}: a "jar-error" entry must carry NO ours census`).toBeUndefined();
      expect(f.jar, `${f.slug}: a "jar-error" entry must carry NO jar census`).toBeUndefined();
      const golden = readFileSync(join(fixtureDir(f), 'in.svg'), 'utf8');
      expect(
        JAR_ERROR_PAGE_RE.test(golden),
        `${f.slug}: recorded as "jar-error" but the committed golden no longer matches the ` +
          `jar-error-page needle (PSystemError.java:148-155 / ReportLog.java:103-108).`,
      ).toBe(true);
    });
  }
});
