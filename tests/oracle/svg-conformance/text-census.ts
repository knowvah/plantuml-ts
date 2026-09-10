/**
 * Activity TEXT census -- the PURE core shared by the gate
 * (`activity.text-baseline.test.ts`) and the orchestrator's re-pin
 * generator. Carries no vitest import and reads no manifest, so a plain
 * `npx jiti` script can drive it to produce `text-baseline.json`.
 *
 * The gate's doc comment is the authoritative description of every
 * quantity measured here and of why each is measured; this file only holds
 * the code. Mirrors `swimlane-census.ts` exactly in its split.
 */
import { normalizeSvg } from './normalize.js';
import type { NormalizedNode } from './normalize.js';

// ---------------------------------------------------------------------------
// Shapes -- the interface contract T4, T5 and T6 consume.
// ---------------------------------------------------------------------------

export type Histogram = Readonly<Record<string, number>>;

export interface TextCensus {
  /** `fill` over every `<text>`, `(absent)` counted. */
  readonly fill: Histogram;
  /** `text-anchor` over every `<text>`, `(absent)` counted. */
  readonly anchor: Histogram;
  /** `round3(text.x - rect.x)` for every `<text>` whose immediately
   * preceding ELEMENT sibling is a `<rect>`. */
  readonly inset: Histogram;
  /** How many `<text>` elements exist -- the tripwire. */
  readonly textCount: number;
}

export interface TextFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error' | 'jar-error';
  /** Present only on `status: "baseline"`. */
  readonly ours?: TextCensus;
  /** Present only on `status: "baseline"`. */
  readonly jar?: TextCensus;
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

export interface TextManifest {
  readonly $comment?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
  readonly fixtures: readonly TextFixture[];
}

export type FixtureRef = Pick<TextFixture, 'type' | 'slug'>;

// ---------------------------------------------------------------------------
// Constants and needles.
// ---------------------------------------------------------------------------

export const ACTIVITY_TYPE = 'activity';

export const ABSENT = '(absent)';

/** The jar's own error page (`PSystemError.java:148-155` /
 * `ReportLog.java:103-108`) -- the same needle the sibling gates use. */
export const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;

/** The census histogram keys the comparison walks, in report order. */
export const HISTOGRAMS = ['fill', 'anchor', 'inset'] as const;

// ---------------------------------------------------------------------------
// The census. Pure over a normalized tree.
// ---------------------------------------------------------------------------

function num(v: string | undefined): number {
  return Number(v ?? 'NaN');
}

/** Rounds an inset to 3 dp so `26 - 16` pins as `10` and a 6-figure
 * normalized coordinate difference does not carry float noise. */
export function round3(v: number): number {
  return Math.round(v * 1e3) / 1e3;
}

function bump(h: Record<string, number>, key: string): void {
  h[key] = (h[key] ?? 0) + 1;
}

/** Counts fill, anchor, inset and text count in one SVG. */
export function censusOf(svg: string): TextCensus {
  const root = normalizeSvg(svg);
  const fill: Record<string, number> = {};
  const anchor: Record<string, number> = {};
  const inset: Record<string, number> = {};
  let textCount = 0;

  const walk = (n: NormalizedNode): void => {
    const elements = (n.children ?? []).filter((c) => c.type === 'element');
    elements.forEach((child, i) => {
      if (child.tag === 'text') {
        textCount += 1;
        bump(fill, child.attrs?.['fill'] ?? ABSENT);
        bump(anchor, child.attrs?.['text-anchor'] ?? ABSENT);
        const prev = i > 0 ? elements[i - 1] : undefined;
        if (prev?.tag === 'rect') {
          bump(inset, String(round3(num(child.attrs?.['x']) - num(prev.attrs?.['x']))));
        }
      }
      walk(child);
    });
  };
  walk(root);

  return { fill, anchor, inset, textCount };
}

// ---------------------------------------------------------------------------
// The comparison. Pure; names the fixture, the side and every moved quantity.
// ---------------------------------------------------------------------------

export interface CensusCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

function histogramDiff(pinned: Histogram, live: Histogram): readonly string[] {
  const keys = [...new Set([...Object.keys(pinned), ...Object.keys(live)])].sort();
  return keys
    .filter((k) => (pinned[k] ?? 0) !== (live[k] ?? 0))
    .map((k) => `${k}: pinned ${String(pinned[k] ?? 0)} -> now ${String(live[k] ?? 0)}`);
}

function censusProblems(pinned: TextCensus, live: TextCensus): string[] {
  const problems: string[] = [];
  for (const h of HISTOGRAMS) {
    const rows = histogramDiff(pinned[h], live[h]);
    if (rows.length > 0) problems.push(`${h} { ${rows.join('; ')} }`);
  }
  if (pinned.textCount !== live.textCount) {
    problems.push(`textCount: pinned ${String(pinned.textCount)} -> now ${String(live.textCount)}`);
  }
  return problems;
}

export function checkCensus(
  f: FixtureRef,
  side: 'ours' | 'jar',
  pinned: TextCensus | undefined,
  live: TextCensus,
): CensusCheckResult {
  const where = `${f.type}/${f.slug} [${side}]`;
  if (pinned === undefined) {
    return {
      ok: false,
      message:
        `${where}: text-baseline.json carries no "${side}" census for this fixture. ` +
        `A "baseline" entry must pin BOTH sides; re-pin it from a fresh measurement ` +
        `rather than letting an unpinned side evaluate as "no change".`,
    };
  }
  const problems = censusProblems(pinned, live);
  if (problems.length === 0) return { ok: true, message: `${where}: text census matches its pin.` };
  return {
    ok: false,
    message:
      `${where}: TEXT CENSUS MOVED -- ${problems.join(' | ')}. This gate is an EQUALITY ` +
      `pin, not a ratchet. If this move is the intended effect of a deliberate change, re-pin ` +
      `oracle/goldens/svg-activity/text-baseline.json FROM A FRESH MEASUREMENT (T6, once) ` +
      `and state the delta in the mission close-out. Never hand-edit an entry to make this pass.`,
  };
}

/** Partition status for one fixture, derived from its own content. */
export function statusOf(golden: string, oursThrew: boolean): TextFixture['status'] {
  if (JAR_ERROR_PAGE_RE.test(golden)) return 'jar-error';
  return oursThrew ? 'error' : 'baseline';
}
