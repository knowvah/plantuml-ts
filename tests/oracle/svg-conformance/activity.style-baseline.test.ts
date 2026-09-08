/**
 * Per-attribute STYLE census gate for the committed activity oracle corpus
 * (`activity-style-defaults` / T0, 2026-09-08).
 *
 * WHY A SECOND PIN EXISTS BESIDE `diff-baseline.json`.
 * `activity.diff-baseline.ratchet.test.ts` pins one number per fixture --
 * `weightedScore` -- and `diff-census.json` pins which diff PATHS carry the
 * corpus's weight. Neither says WHICH ATTRIBUTE VALUE moved. This mission
 * lands two independent geometric changes (per-element `FontSize`, D1/D2;
 * and the sizer's 1.4x -> 1.0x line advance, D6) and a third ink change
 * (`LineThickness` / `RoundCorner`, D4/D5). Measured against
 * `weightedScore` alone those would be individually unattributable -- the
 * exact failure `activity-element-granularity`'s own T0 was created to
 * prevent, and the reason this file is its successor instrument.
 *
 * WHAT IS PINNED, per fixture, for OURS and for the committed JAR golden:
 *
 *   - `fontSize`    -- histogram of `font-size` over every `<text>`
 *   - `strokeWidth` -- histogram of `stroke-width` over every `<line>`
 *   - `rx`          -- histogram of `rx` over every `<rect>`
 *   - `textCount`   -- how many `<text>` elements exist, so a LINE-HEIGHT
 *                      change (D6, which changes text POSITIONS and box
 *                      heights but not the element count) stays separable
 *                      from a FONT-SIZE change (which moves the histogram)
 *   - `width` / `height` -- the root `<svg>` canvas, the quantity every
 *                      text-metric change ultimately feeds
 *
 * A value that is ABSENT on an element is counted under the `(absent)` key
 * rather than dropped: our `<rect>`s emit no `ry` today and 139 of them emit
 * no `rx` at all (D4 deletes the unsourced `rx="8"`), and an absence that
 * silently vanished from the histogram would read as "nothing changed".
 *
 * MEASURED THROUGH THE IDENTICAL SEAMS THE RATCHET GATE USES --
 * `renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`,
 * then `normalizeSvg`. NORMALIZED, not raw: `normalize.ts` expands
 * `style="font-size:12px"` into a `font-size` attribute before comparing
 * (adaptation #1), so the histogram counts exactly what the comparator sees
 * and never splits one value across two spellings. This is also why the
 * mission does not chase `style=` vs presentation attributes at all -- there
 * is nothing there to measure.
 *
 * THE SAME THREE-WAY STATUS DISCRIMINATION the sibling ratchet carries:
 *
 *   - `baseline`  -- both sides measurable; histograms are pinned and gated.
 *   - `error`     -- our own parser refuses the source. NO numbers (D8 of
 *                    `plans/activity-oracle-harness/decisions.md`): an error
 *                    must never read as an empty histogram, which would be
 *                    indistinguishable from "renders, emits no text".
 *   - `jar-error` -- the GOLDEN is the jar's own graphical error page (D12,
 *                    ibid). NO numbers either way: the jar failing is no
 *                    evidence about us. Detected on EVERY run from the
 *                    golden's own content, via the same needle
 *                    `refusal-coverage.test.ts` and the ratchet gate use
 *                    (`PSystemError.java:148-155` / `ReportLog.java:103-108`)
 *                    -- never from a slug list. A fixture whose own render
 *                    ALSO errors and whose golden is a jar-error page is
 *                    recorded `jar-error`, not `error`: the jar's failure
 *                    makes our outcome unevidential either way.
 *
 * UNLIKE the ratchet, this gate is an EQUALITY pin, not a ratchet. There is
 * no direction of "better" for a histogram: moving `font-size` 14 -> 12
 * across 952 elements is the mission's intent, and moving it 14 -> 9 is a
 * bug, and both are "different". So every deliberate change re-pins this
 * file (T7) from a fresh measurement, and the DIFF of the pin is the
 * mission's evidence. Do not hand-edit an entry to make the gate pass.
 *
 * NO `describe.skipIf` (D4, ibid): `test-results/dot-cache/` is committed
 * (`.gitignore:25` re-includes it), so an absent tree is a broken checkout,
 * not an un-generated one. AC0 asserts corpus presence instead.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/activity.style-baseline.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { normalizeSvg } from './normalize.js';
import type { NormalizedNode } from './normalize.js';
import { renderFixtureActivity } from './render-fixture-activity.js';

/** Histogram of one attribute's values. `(absent)` counts elements that
 * carry no such attribute -- see the file doc comment. */
type Histogram = Readonly<Record<string, number>>;

interface StyleCensus {
  /** `font-size` over every `<text>`. */
  readonly fontSize: Histogram;
  /** `stroke-width` over every `<line>`. */
  readonly strokeWidth: Histogram;
  /** `rx` over every `<rect>`. */
  readonly rx: Histogram;
  /** `<text>` element count -- separates a line-height move from a font move. */
  readonly textCount: number;
  /** Root `<svg>` `@width`. */
  readonly width: string;
  /** Root `<svg>` `@height`. */
  readonly height: string;
}

interface StyleFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error' | 'jar-error';
  /** Present only on `status: "baseline"`. */
  readonly ours?: StyleCensus;
  /** Present only on `status: "baseline"`. */
  readonly jar?: StyleCensus;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface StyleManifest {
  readonly $comment?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
  readonly fixtures: readonly StyleFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, '../../../oracle/goldens/svg-activity/style-baseline.json');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as StyleManifest;

const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;

type FixtureRef = Pick<StyleFixture, 'type' | 'slug'>;

function fixtureDir(f: FixtureRef): string {
  return join(CACHE_ROOT, f.type, f.slug);
}

function hasCachedFixture(f: FixtureRef): boolean {
  const dir = fixtureDir(f);
  return existsSync(join(dir, 'in.puml')) && existsSync(join(dir, 'in.svg'));
}

const ABSENT = '(absent)';

/** Walks a NORMALIZED tree and counts the four style quantities. Pure. */
export function censusOf(svg: string): StyleCensus {
  const root = normalizeSvg(svg);
  const fontSize: Record<string, number> = {};
  const strokeWidth: Record<string, number> = {};
  const rx: Record<string, number> = {};
  let textCount = 0;

  const bump = (h: Record<string, number>, v: string | undefined): void => {
    const key = v ?? ABSENT;
    h[key] = (h[key] ?? 0) + 1;
  };

  const walk = (n: NormalizedNode): void => {
    if (n.type === 'element') {
      if (n.tag === 'text') {
        textCount += 1;
        bump(fontSize, n.attrs?.['font-size']);
      } else if (n.tag === 'line') {
        bump(strokeWidth, n.attrs?.['stroke-width']);
      } else if (n.tag === 'rect') {
        bump(rx, n.attrs?.['rx']);
      }
    }
    for (const child of n.children ?? []) walk(child);
  };
  walk(root);

  return {
    fontSize,
    strokeWidth,
    rx,
    textCount,
    width: root.attrs?.['width'] ?? '',
    height: root.attrs?.['height'] ?? '',
  };
}

interface CensusCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

function histogramDiff(pinned: Histogram, live: Histogram): readonly string[] {
  const keys = [...new Set([...Object.keys(pinned), ...Object.keys(live)])].sort();
  return keys
    .filter((k) => (pinned[k] ?? 0) !== (live[k] ?? 0))
    .map((k) => `${k}: pinned ${String(pinned[k] ?? 0)} -> now ${String(live[k] ?? 0)}`);
}

/** Pure equality check between a pinned census and a freshly measured one.
 * Extracted (not inlined in the `it()` body) so AC2 can drive it with a
 * fabricated histogram without touching `style-baseline.json` on disk. The
 * message NAMES the fixture, the side, and every differing attribute --
 * a gate that only says "not equal" tells the next mission nothing. */
export function checkCensus(
  f: FixtureRef,
  side: 'ours' | 'jar',
  pinned: StyleCensus | undefined,
  live: StyleCensus,
): CensusCheckResult {
  const where = `${f.type}/${f.slug} [${side}]`;
  if (pinned === undefined) {
    return {
      ok: false,
      message:
        `${where}: style-baseline.json carries no "${side}" census for this fixture. ` +
        `A "baseline" entry must pin BOTH sides; re-pin it from a fresh measurement ` +
        `rather than letting an unpinned side evaluate as "no change".`,
    };
  }

  const problems: string[] = [];
  for (const attr of ['fontSize', 'strokeWidth', 'rx'] as const) {
    const rows = histogramDiff(pinned[attr], live[attr]);
    if (rows.length > 0) problems.push(`${attr} { ${rows.join('; ')} }`);
  }
  if (pinned.textCount !== live.textCount) {
    problems.push(`textCount: pinned ${String(pinned.textCount)} -> now ${String(live.textCount)}`);
  }
  if (pinned.width !== live.width) problems.push(`width: pinned ${pinned.width} -> now ${live.width}`);
  if (pinned.height !== live.height) problems.push(`height: pinned ${pinned.height} -> now ${live.height}`);

  if (problems.length === 0) {
    return { ok: true, message: `${where}: style census matches its pin.` };
  }
  return {
    ok: false,
    message:
      `${where}: STYLE CENSUS MOVED -- ${problems.join(' | ')}. This gate is an EQUALITY ` +
      `pin, not a ratchet: a histogram has no direction of "better", so a move is neither ` +
      `automatically a regression nor automatically progress. If this move is the intended ` +
      `effect of a deliberate change, re-pin oracle/goldens/svg-activity/style-baseline.json ` +
      `FROM A FRESH MEASUREMENT and state the histogram delta in the mission close-out. ` +
      `Never hand-edit an entry to make this pass -- the pin's diff IS the mission's evidence.`,
  };
}

const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');
const errorFixtures = manifest.fixtures.filter((f) => f.status === 'error');
const jarErrorFixtures = manifest.fixtures.filter((f) => f.status === 'jar-error');

// ---------------------------------------------------------------------------
// AC0 -- the committed corpus is present and complete, and the partition is
// the one the sibling ratchet records. A silent partition drift would move
// fixtures out of the gated set without failing anything.
// ---------------------------------------------------------------------------

describe('svg-activity style census — corpus presence', () => {
  it('every manifest fixture has its committed in.puml + in.svg', () => {
    const missing = manifest.fixtures.filter((f) => !hasCachedFixture(f)).map((f) => `${f.type}/${f.slug}`);
    expect(
      missing,
      `test-results/dot-cache/activity/ is COMMITTED. Missing entries mean a broken or ` +
        `partial checkout, not a cache that needs regenerating. Missing: ${missing.slice(0, 10).join(', ')}`,
    ).toEqual([]);
    expect(manifest.fixtures.length).toBe(373);
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

describe('svg-activity style census', () => {
  for (const f of baselineFixtures) {
    it(`activity/${f.slug}: style census matches its pin`, () => {
      const dir = fixtureDir(f);
      const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
      const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
      const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), {
        includeStore: fixtureIncludeStore(),
      });

      const oursCheck = checkCensus(f, 'ours', f.ours, censusOf(ours));
      expect(oursCheck.ok, oursCheck.message).toBe(true);

      const jarCheck = checkCensus(f, 'jar', f.jar, censusOf(golden));
      expect(
        jarCheck.ok,
        `${jarCheck.message} A JAR-side move means the COMMITTED GOLDEN changed under ` +
          `this pin -- that is a corpus event, not a port change. Find out what re-captured ` +
          `it before re-pinning.`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC2 -- the comparison must actually discriminate, and must name the
// fixture and the differing attribute. In-memory only: fabricated censuses,
// never a style-baseline.json edit.
// ---------------------------------------------------------------------------

describe('svg-activity style census — comparison discrimination', () => {
  const sample: FixtureRef = { type: 'activity', slug: 'census-probe' };
  const base: StyleCensus = {
    fontSize: { '14': 3 },
    strokeWidth: { '1.5': 2 },
    rx: { '8': 1 },
    textCount: 3,
    width: '482',
    height: '382',
  };

  it('an identical census passes', () => {
    const { ok } = checkCensus(sample, 'ours', base, { ...base });
    expect(ok).toBe(true);
  });

  it('a moved font-size histogram fails, naming the fixture and the attribute', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, fontSize: { '12': 3 } });
    expect(ok).toBe(false);
    expect(message).toContain(sample.slug);
    expect(message).toContain('fontSize');
    expect(message).toContain('14: pinned 3 -> now 0');
    expect(message).toContain('12: pinned 0 -> now 3');
  });

  it('a moved stroke-width histogram fails, naming stroke-width', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, strokeWidth: { '1': 2 } });
    expect(ok).toBe(false);
    expect(message).toContain('strokeWidth');
  });

  it('a moved rx histogram fails, naming rx', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, rx: { '12.5': 1 } });
    expect(ok).toBe(false);
    expect(message).toContain('rx {');
    expect(message).toContain('12.5: pinned 0 -> now 1');
  });

  it('a text-count move fails independently of any histogram move', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, textCount: 5 });
    expect(ok).toBe(false);
    expect(message).toContain('textCount: pinned 3 -> now 5');
    expect(message).not.toContain('fontSize');
  });

  it('a canvas move fails, naming width and height', () => {
    const { ok, message } = checkCensus(sample, 'ours', base, { ...base, width: '327', height: '280' });
    expect(ok).toBe(false);
    expect(message).toContain('width: pinned 482 -> now 327');
    expect(message).toContain('height: pinned 382 -> now 280');
  });

  it('an unpinned side fails rather than reading as "no change"', () => {
    const { ok, message } = checkCensus(sample, 'jar', undefined, base);
    expect(ok).toBe(false);
    expect(message).toContain('no "jar" census');
  });

  it('discrimination fires against a REAL fixture, not only fabricated numbers', () => {
    const real = baselineFixtures[0];
    expect(real, 'expected at least one baselined fixture').toBeDefined();
    const golden = readFileSync(join(fixtureDir(real!), 'in.svg'), 'utf8');
    const live = censusOf(golden);
    expect(checkCensus(real!, 'jar', real!.jar, live).ok).toBe(true);
    expect(checkCensus(real!, 'jar', { ...live, textCount: live.textCount + 1 }, live).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC3 -- error-status fixtures carry no numbers, and still error. An error
// that started rendering is a real change and must fail loudly.
// ---------------------------------------------------------------------------

describe('svg-activity style census — recorded parser-gap errors', () => {
  for (const f of errorFixtures) {
    it(`activity/${f.slug}: still errors as recorded, with no census`, () => {
      expect(f.reason, `${f.type}/${f.slug}: an "error" entry must carry a reason`).toBeTruthy();
      expect(f.ours, `${f.type}/${f.slug}: an "error" entry must carry NO ours census`).toBeUndefined();
      expect(f.jar, `${f.type}/${f.slug}: an "error" entry must carry NO jar census`).toBeUndefined();

      const dir = fixtureDir(f);
      const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
      let threw = false;
      try {
        renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
      } catch {
        threw = true;
      }
      expect(
        threw,
        `${f.type}/${f.slug}: recorded as status "error" (${String(f.reason)}) but rendering ` +
          `SUCCEEDED this run. An error-to-measurable transition is a real change and must never ` +
          `read as an empty histogram -- move this fixture to status "baseline" in ` +
          `style-baseline.json with a freshly measured census.`,
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// AC3b -- jar-error goldens, detected from the golden's own content on every
// run, never trusted as a static classification.
// ---------------------------------------------------------------------------

describe('svg-activity style census — recorded jar-error goldens', () => {
  for (const f of jarErrorFixtures) {
    it(`activity/${f.slug}: golden is still a jar error page, with no census`, () => {
      expect(f.reason, `${f.type}/${f.slug}: a "jar-error" entry must carry a reason`).toBeTruthy();
      expect(f.ours, `${f.type}/${f.slug}: a "jar-error" entry must carry NO ours census`).toBeUndefined();
      expect(f.jar, `${f.type}/${f.slug}: a "jar-error" entry must carry NO jar census`).toBeUndefined();
      const golden = readFileSync(join(fixtureDir(f), 'in.svg'), 'utf8');
      expect(
        JAR_ERROR_PAGE_RE.test(golden),
        `${f.type}/${f.slug}: recorded as status "jar-error" but the committed golden no longer ` +
          `matches the jar-error-page needle (PSystemError.java:148-155 / ReportLog.java:103-108). ` +
          `The jar's own output changed, which is itself a reportable event -- re-classify this ` +
          `entry with a fresh measurement rather than leaving it "jar-error".`,
      ).toBe(true);
    });
  }
});
