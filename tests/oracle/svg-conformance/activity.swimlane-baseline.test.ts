/**
 * Swimlane CHROME-AND-PLACEMENT census gate for the committed activity
 * oracle corpus (`activity-swimlane-rendering` / T0, 2026-09-09).
 *
 * WHY A THIRD PIN EXISTS BESIDE `diff-baseline.json` AND `style-baseline.json`.
 * The ratchet pins one number per fixture (`weightedScore`) and the style
 * census pins per-attribute histograms. Neither says how many lane dividers
 * were drawn, where a lane title sat, whether the title band was emitted,
 * or where a lane's left edge and width landed. This mission lands five
 * sequenced changes on the same ~60 measurable swimlane fixtures --
 * skinparams (T1), resolvers (T2), lane threading (T3), lane extents and
 * widths (T4), origins and placement (T5), the chrome (T6) -- and measured
 * against the two existing pins those would be individually
 * unattributable. This file is the instrument that separates them.
 *
 * POPULATION: every committed fixture whose SOURCE contains a swimlane
 * declaration line, detected from the `.puml` on every run by the needle
 * `SWIMLANE_LINE_RE` below -- a transcription of upstream's
 * `CommandSwimlane#getRegexConcat` (`activitydiagram3/command/
 * CommandSwimlane.java:59-67`: `^\|` colour? `([^|]+)` `\|` label? `$`) --
 * never from a slug list. Lines are trimmed first, as the preprocessor
 * trims them before command matching. A creole table row inside a
 * multi-line action (`| a | b |`) does NOT match: it carries a third `|`.
 *
 * WHAT IS PINNED, per fixture, for OURS and for the committed JAR golden,
 * over the NORMALIZED tree (`normalize.ts` expands `style="..."` into
 * attributes, so `stroke-width:1.5` and `stroke-width="1.5"` count once):
 *
 *   - `dividerXs`  -- the `x` of every vertical `<line>` spanning at least
 *                     `DIVIDER_MIN_SPAN_RATIO` of the root canvas height,
 *                     in DOCUMENT ORDER. Upstream draws one
 *                     `ULine.vline(height)` per divider
 *                     (`ftile/LaneDivider.java:87-97`), `height` being the
 *                     full content height plus the title translate, so a
 *                     divider always spans nearly the whole canvas; an edge
 *                     segment never does. Order is kept, not sorted: D5
 *                     (`decisions.md`) makes draw order a pinned quantity.
 *   - `bandRect`   -- the title-band rectangle, or `null`. Detected as the
 *                     FIRST `<rect>` in document order whose `y` is at or
 *                     above the top of the dividers: upstream's
 *                     `drawTitlesBackground` (`Swimlanes.java:357-367`)
 *                     draws it at the same `y` the dividers start, and every
 *                     content rectangle sits below the title translate
 *                     (`getTitleHeightTranslate`, `:304-307`). Recorded with
 *                     its `x`/`y`/`width`/`height`/`fill` so D3 (emit the
 *                     transparent band) is attributable on its own.
 *   - `titles`     -- every `<text>` whose baseline `y` lies inside the
 *                     band's vertical extent, in DOCUMENT ORDER, with its
 *                     `font-size`, `x` and `text-anchor` (`(absent)` when
 *                     the element carries none -- the jar's `CenteredText`
 *                     positions by `x` alone, ours uses `text-anchor`).
 *                     Empty when there is no band: upstream draws titles
 *                     only from `drawWhenSwimlanes` (`:318-355`), the same
 *                     method that draws the band.
 *   - `lanes`      -- per-lane `{ x, width }`. OURS comes from the layout
 *                     GEOMETRY (`ActivityGeometry.swimlanes`), the quantity
 *                     T4/T5 move; the JAR has no geometry we can read, so
 *                     its lanes are the spans between consecutive divider
 *                     `x`s in ascending order -- upstream keeps exactly
 *                     `swimlanes().size() + 1` dividers (`:327`), one per
 *                     boundary including both outer edges.
 *   - `width` / `height` -- the root `<svg>` canvas.
 *   - `laneCount`  -- from OUR AST (`ActivityDiagramAST.swimlanes.length`),
 *                     pinned once per fixture, not per side.
 *
 * A SINGLE-LANE FIXTURE IS EXPECTED TO SHOW ZERO JAR DIVIDERS AND NO BAND:
 * `Swimlanes#drawU` only enters `drawWhenSwimlanes` when
 * `swimlanes().size() > 1` (`Swimlanes.java:253,275`). That asymmetry
 * against our own output (which draws chrome for any declared lane) is a
 * finding this pin records, not a detection failure.
 *
 * THE SAME THREE-WAY STATUS DISCRIMINATION the sibling gates carry:
 * `baseline` (both sides measurable, numbers pinned), `error` (our parser
 * refuses -- NO numbers, D8 of `plans/activity-oracle-harness/decisions.md`),
 * `jar-error` (the golden is the jar's own error page -- NO numbers either
 * way, D12 ibid; detected on every run from the golden's own content via the
 * shared needle, never from a slug list; a fixture in both sets records
 * `jar-error`).
 *
 * AN EQUALITY PIN, NOT A RATCHET. T3-T6 each break it by design; T7 re-pins
 * ONCE from a fresh measurement and the DIFF of the pin is the mission's
 * evidence. Do not hand-edit an entry to make the gate pass, and do not
 * re-pin per task -- re-pinning early destroys the attribution this file
 * exists to buy.
 *
 * THE LAYOUT PIPELINE IS MIRRORED in `swimlane-census.ts#layoutFixtureActivity`
 * rather than exported from `render-fixture-activity.ts`: that helper returns
 * only the SVG string, its theme builder is private, and widening its exports
 * lies outside this task's write-set. Same choice
 * `scripts/svg-conformance-census.ts` records for `buildTheme`. The SVG side
 * still comes from `renderFixtureActivity` itself, so the chrome census is
 * measured through the identical seam the ratchet and style gates use.
 *
 * THE CENSUS CODE LIVES IN `swimlane-census.ts` (pure, no vitest import) so the
 * orchestrator's re-pin generator and this gate share ONE implementation --
 * a generator that re-derived the rules would be a second instrument.
 *
 * NO `describe.skipIf` (D4, ibid): `test-results/dot-cache/` is committed.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/activity.swimlane-baseline.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { renderFixtureActivity } from './render-fixture-activity.js';
import {
  ABSENT,
  ACTIVITY_TYPE,
  JAR_ERROR_PAGE_RE,
  censusOf,
  checkCensus,
  hasSwimlaneLine,
  lanesFromDividers,
  layoutFixtureActivity,
} from './swimlane-census.js';
import type { FixtureRef, SwimlaneCensus, SwimlaneManifest } from './swimlane-census.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, '../../../oracle/goldens/svg-activity/swimlane-baseline.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as SwimlaneManifest;

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
// AC0 -- the population is exactly the committed fixtures with a swimlane
// line, derived from the sources on every run, and every one is present.
// ---------------------------------------------------------------------------

describe('svg-activity swimlane census — population', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(missing, `test-results/dot-cache/activity/ is COMMITTED. Missing: ${missing.join(', ')}`).toEqual([]);
  });

  it('the manifest lists exactly the committed fixtures whose source has a swimlane line', () => {
    const fromSources = readdirSync(join(CACHE_ROOT, ACTIVITY_TYPE))
      .filter((slug) => hasCachedFixture({ type: ACTIVITY_TYPE, slug }))
      .filter((slug) => hasSwimlaneLine(readFileSync(join(CACHE_ROOT, ACTIVITY_TYPE, slug, 'in.puml'), 'utf8')))
      .sort();
    const pinned = manifest.fixtures.map((f) => f.slug).sort();
    expect(pinned, 'the population is derived from the sources, never a slug list').toEqual(fromSources);
  });

  it('the partition is 60 baseline / 24 error / 8 jar-error', () => {
    expect(baselineFixtures.length).toBe(60);
    expect(errorFixtures.length).toBe(24);
    expect(jarErrorFixtures.length).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// AC1 -- every baselined fixture's OURS and JAR censuses equal their pin.
// ---------------------------------------------------------------------------

describe('svg-activity swimlane census', () => {
  for (const f of baselineFixtures) {
    it(`activity/${f.slug}: swimlane census matches its pin`, () => {
      const dir = fixtureDir(f);
      const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
      const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
      const geometry = layoutFixtureActivity(markup, new DeterministicMeasurer(), {
        includeStore: fixtureIncludeStore(),
      });
      expect(geometry.laneCount, `${f.slug}: laneCount from the AST moved`).toBe(f.laneCount);

      const oursCheck = checkCensus(f, 'ours', f.ours, censusOf(renderOrThrow(markup), geometry.lanes));
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
// AC2 -- the comparison discriminates, naming the fixture and the quantity.
// In-memory only: fabricated censuses, never a swimlane-baseline.json edit.
// ---------------------------------------------------------------------------

describe('svg-activity swimlane census — comparison discrimination', () => {
  const sample: FixtureRef = { type: ACTIVITY_TYPE, slug: 'census-probe' };
  const base: SwimlaneCensus = {
    dividerXs: [12, 132],
    titles: [{ fontSize: '18', x: '72', anchor: 'middle' }],
    bandRect: { x: 0, y: 0, width: 240, height: 28, fill: '#FFF' },
    lanes: [
      { x: 12, width: 120 },
      { x: 132, width: 120 },
    ],
    width: '264',
    height: '148',
  };

  it('an identical census passes', () => {
    expect(checkCensus(sample, 'ours', base, { ...base }).ok).toBe(true);
  });

  it('a moved divider set fails, naming the fixture and dividerXs', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, dividerXs: [20, 58.338, 369.275] });
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('dividerXs: pinned [12,132] -> now [20,58.338,369.275]');
    expect(message).not.toContain('titles');
  });

  it('a moved title fails, naming titles', () => {
    const moved = { ...base, titles: [{ fontSize: '18', x: '33.15', anchor: ABSENT }] };
    const { ok, message } = checkCensus(sample, 'ours', base, moved);
    expect(ok).toBe(false);
    expect(message).toContain('titles: pinned');
    expect(message).toContain('"anchor":"(absent)"');
  });

  it('a band that vanished fails, naming bandRect', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, bandRect: null });
    expect(ok).toBe(false);
    expect(message).toContain('bandRect: pinned {');
    expect(message).toContain('-> now null');
  });

  it('a moved lane extent fails independently of the chrome', () => {
    const moved = {
      ...base,
      lanes: [
        { x: 20, width: 38.338 },
        { x: 58.338, width: 310.937 },
      ],
    };
    const { ok, message } = checkCensus(sample, 'ours', base, moved);
    expect(ok).toBe(false);
    expect(message).toContain('lanes: pinned');
    expect(message).not.toContain('dividerXs');
  });

  it('a canvas move fails, naming width and height', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, width: '395', height: '185' });
    expect(ok).toBe(false);
    expect(message).toContain('width: pinned 264 -> now 395');
    expect(message).toContain('height: pinned 148 -> now 185');
  });

  it('an unpinned side fails rather than reading as "no change"', () => {
    const { ok, message } = checkCensus(sample, 'jar', undefined, base);
    expect(ok).toBe(false);
    expect(message).toContain('no "jar" census');
  });

  it('discrimination fires against a REAL golden, not only fabricated numbers', () => {
    const real = baselineFixtures.find((f) => (f.jar?.dividerXs.length ?? 0) > 0);
    expect(real, 'expected at least one baselined fixture with jar dividers').toBeDefined();
    const live = censusOf(readFileSync(join(fixtureDir(real!), 'in.svg'), 'utf8'));
    expect(checkCensus(real!, 'jar', real!.jar, live).ok).toBe(true);
    expect(checkCensus(real!, 'jar', { ...live, dividerXs: live.dividerXs.slice(1) }, live).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC2b -- the census itself reads the jar's model the way the Java draws it.
// ---------------------------------------------------------------------------

describe('svg-activity swimlane census — the instrument', () => {
  it('a swimlane line matches CommandSwimlane; a creole table row does not', () => {
    expect(hasSwimlaneLine('@startuml\n|A|\nstart\n@enduml')).toBe(true);
    expect(hasSwimlaneLine('@startuml\n|[#red]Lane| label\n@enduml')).toBe(true);
    expect(hasSwimlaneLine('@startuml\n:x\n| a | b |;\n@enduml')).toBe(false);
    expect(hasSwimlaneLine('@startuml\nstart\n@enduml')).toBe(false);
  });

  it('jar lanes are the spans between ascending dividers', () => {
    expect(lanesFromDividers([369.275, 20, 58.338])).toEqual([
      { x: 20, width: 38.338 },
      { x: 58.338, width: 310.937 },
    ]);
    expect(lanesFromDividers([])).toEqual([]);
  });

  it('counts the pakema-21-xema183 golden the way Swimlanes.java draws it', () => {
    const golden = readFileSync(join(CACHE_ROOT, ACTIVITY_TYPE, 'pakema-21-xema183', 'in.svg'), 'utf8');
    const c = censusOf(golden);
    expect(c.dividerXs).toEqual([20, 58.338, 369.275]);
    expect(c.bandRect).toEqual({ x: 20, y: 17.5, width: 348.275, height: 18, fill: 'none' });
    expect(c.titles).toEqual([
      { fontSize: '18', x: '33.15', anchor: ABSENT },
      { fontSize: '18', x: '63.338', anchor: ABSENT },
    ]);
    expect(c.lanes).toEqual([
      { x: 20, width: 38.338 },
      { x: 58.338, width: 310.937 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures carry no numbers, and still error.
// ---------------------------------------------------------------------------

describe('svg-activity swimlane census — recorded parser-gap errors', () => {
  for (const f of errorFixtures) {
    it(`activity/${f.slug}: still errors as recorded, with no census`, () => {
      expect(f.reason, `${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.ours, `${f.slug}: an "error" entry must carry NO ours census`).toBeUndefined();
      expect(f.jar, `${f.slug}: an "error" entry must carry NO jar census`).toBeUndefined();
      expect(f.laneCount, `${f.slug}: an "error" entry must carry NO laneCount`).toBeUndefined();
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

describe('svg-activity swimlane census — recorded jar-error goldens', () => {
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
