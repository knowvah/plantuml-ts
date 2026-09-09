/**
 * Swimlane chrome-and-placement census -- the PURE core shared by the gate
 * (`activity.swimlane-baseline.test.ts`) and the orchestrator's re-pin
 * generator. Carries no vitest import and reads no manifest, so a plain
 * `npx jiti` script can drive it to produce `swimlane-baseline.json`.
 *
 * The gate's doc comment is the authoritative description of every
 * quantity measured here and of why each detection rule reads the Java the
 * way it does; this file only holds the code.
 */
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { PreprocessOptions, PreprocessorResult } from '../../../src/core/preprocessor.js';
import { resolveTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../../../src/core/skinparam.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import { applyStyleMap } from '../../../src/core/style-map-theme.js';
import { applySkinLayer } from '../../../src/core/skin-loader.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { parseActivity } from '../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../src/diagrams/activity/layout/tile-layout.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { normalizeSvg } from './normalize.js';
import type { NormalizedNode } from './normalize.js';

// ---------------------------------------------------------------------------
// Shapes -- the interface contract T5, T6 and T7 consume.
// ---------------------------------------------------------------------------

export interface TitleCensus {
  readonly fontSize: string;
  readonly x: string;
  /** `text-anchor`, or `(absent)`. */
  readonly anchor: string;
}

export interface BandRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** `fill`, or `(absent)`. */
  readonly fill: string;
}

export interface LaneExtent {
  readonly x: number;
  readonly width: number;
}

export interface SwimlaneCensus {
  readonly dividerXs: readonly number[];
  readonly titles: readonly TitleCensus[];
  readonly bandRect: BandRect | null;
  readonly lanes: readonly LaneExtent[];
  readonly width: string;
  readonly height: string;
}

export interface SwimlaneFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error' | 'jar-error';
  /** From our AST. Present only on `status: "baseline"`. */
  readonly laneCount?: number;
  readonly ours?: SwimlaneCensus;
  readonly jar?: SwimlaneCensus;
  readonly reason?: string;
}

export interface SwimlaneManifest {
  readonly $comment?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
  readonly fixtures: readonly SwimlaneFixture[];
}

// ---------------------------------------------------------------------------
// Constants and needles.
// ---------------------------------------------------------------------------

export const ACTIVITY_TYPE = 'activity';

/** `CommandSwimlane.java:59-67`: `^\|` + optional `[#colour]` + `([^|]+)` +
 * `\|` + optional label `([^|]+)?` + `$`. */
export const SWIMLANE_LINE_RE = /^\|(?:\[[^\]]*\])?[^|]+\|[^|]*$/;

/** A vertical `<line>` is a lane divider when it spans at least this
 * fraction of the root canvas height. Upstream's divider is
 * `ULine.vline(height)` over the FULL content height
 * (`LaneDivider.java:97`); the tallest edge segment on any fixture in the
 * corpus is far shorter. */
export const DIVIDER_MIN_SPAN_RATIO = 0.5;

export const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;

export const ABSENT = '(absent)';

export type FixtureRef = Pick<SwimlaneFixture, 'type' | 'slug'>;

/** True when any trimmed source line is a swimlane declaration. Pure. */
export function hasSwimlaneLine(markup: string): boolean {
  return markup.split(/\r?\n/).some((line) => SWIMLANE_LINE_RE.test(line.trim()));
}

// ---------------------------------------------------------------------------
// The layout pipeline, mirrored from `render-fixture-activity.ts` up to the
// geometry stage (see the file doc comment for why it is not imported).
// ---------------------------------------------------------------------------

function buildThemeForFixture(preprocessed: PreprocessorResult, rawSourceLines: readonly string[]): Theme {
  const base = resolveTheme(preprocessed.theme ?? 'default');
  const withSkin = applySkinLayer(preprocessed, base, rawSourceLines);
  const withSkinparam = resolveSkinparam(preprocessed.skinparam, withSkin).theme;
  const styleMap = preprocessed.styles.map(parseStyleBlock).reduce<StyleMap>((acc, m) => {
    m.forEach((props, selector) => {
      const existing = acc.get(selector) ?? new Map<string, string>();
      props.forEach((v, k) => existing.set(k, v));
      acc.set(selector, existing);
    });
    return acc;
  }, new Map());
  const flatRoot = styleMap.get('') ?? new Map<string, string>();
  const withStyles = resolveSkinparam(flatRoot, withSkinparam).theme;
  return applyStyleMap(styleMap, withStyles);
}

export interface LaneGeometry {
  readonly laneCount: number;
  readonly lanes: readonly LaneExtent[];
}

/** Parses and lays out a fixture, returning only the lane quantities. */
export function layoutFixtureActivity(
  markup: string,
  measurer: StringMeasurer,
  options?: PreprocessOptions,
): LaneGeometry {
  const blocks = buildBlockUmls(markup, options);
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;
  const preprocessed = first.preprocessed;
  const theme = buildThemeForFixture(
    preprocessed,
    first.rawSource.map((s) => s.getString()),
  );
  const block = { ...first.source, rawStyles: preprocessed.styles, stylePositions: preprocessed.stylePositions };
  const ast = astOrThrow(parseActivity(block), ACTIVITY_TYPE);
  const geo = layoutActivity(ast, theme, measurer);
  return {
    laneCount: ast.swimlanes.length,
    lanes: geo.swimlanes.map((s) => ({ x: s.x, width: s.width })),
  };
}

// ---------------------------------------------------------------------------
// The census. Pure over a normalized tree.
// ---------------------------------------------------------------------------

function num(v: string | undefined): number {
  return Number(v ?? 'NaN');
}

function flatten(root: NormalizedNode): NormalizedNode[] {
  const out: NormalizedNode[] = [];
  const walk = (n: NormalizedNode): void => {
    if (n.type === 'element') out.push(n);
    for (const child of n.children ?? []) walk(child);
  };
  walk(root);
  return out;
}

function isVertical(n: NormalizedNode): boolean {
  return n.tag === 'line' && num(n.attrs?.['x1']) === num(n.attrs?.['x2']);
}

function lineTop(n: NormalizedNode): number {
  return Math.min(num(n.attrs?.['y1']), num(n.attrs?.['y2']));
}

function lineSpan(n: NormalizedNode): number {
  return Math.abs(num(n.attrs?.['y2']) - num(n.attrs?.['y1']));
}

/** The dividers: vertical lines that start at the diagram's TOP -- the
 * smallest `y` any vertical line reaches -- and span at least half the
 * canvas. Upstream draws every divider WITHOUT the title translate that
 * every edge is drawn under (`Swimlanes.java:342` vs `:338-340`), so a
 * divider's top is the drawing's top and no edge can share it. */
function dividersOf(elements: readonly NormalizedNode[], canvasHeight: number): NormalizedNode[] {
  const verticals = elements.filter(isVertical);
  if (verticals.length === 0) return [];
  const top = Math.min(...verticals.map(lineTop));
  return verticals.filter((n) => lineTop(n) === top && lineSpan(n) >= DIVIDER_MIN_SPAN_RATIO * canvasHeight);
}

function findBand(elements: readonly NormalizedNode[], dividers: readonly NormalizedNode[]): BandRect | null {
  if (dividers.length === 0) return null;
  const top = Math.min(...dividers.map(lineTop));
  const rect = elements.find((n) => n.tag === 'rect' && num(n.attrs?.['y']) <= top);
  if (rect === undefined) return null;
  const a = rect.attrs ?? {};
  return {
    x: num(a['x']),
    y: num(a['y']),
    width: num(a['width']),
    height: num(a['height']),
    fill: a['fill'] ?? ABSENT,
  };
}

function titlesIn(elements: readonly NormalizedNode[], band: BandRect | null): TitleCensus[] {
  if (band === null) return [];
  return elements
    .filter((n) => n.tag === 'text' && num(n.attrs?.['y']) >= band.y && num(n.attrs?.['y']) <= band.y + band.height)
    .map((n) => ({
      fontSize: n.attrs?.['font-size'] ?? ABSENT,
      x: n.attrs?.['x'] ?? ABSENT,
      anchor: n.attrs?.['text-anchor'] ?? ABSENT,
    }));
}

/** Rounds a derived difference to the normalizer's own 6-figure precision
 * so `369.275 - 58.338` pins as `310.937`, not `310.93699999999995`. */
function round6(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/** The JAR's lanes: spans between consecutive dividers, ascending. */
export function lanesFromDividers(dividerXs: readonly number[]): LaneExtent[] {
  const xs = [...dividerXs].sort((a, b) => a - b);
  const lanes: LaneExtent[] = [];
  for (let i = 1; i < xs.length; i += 1) lanes.push({ x: xs[i - 1]!, width: round6(xs[i]! - xs[i - 1]!) });
  return lanes;
}

/** Counts the swimlane chrome in one SVG. `lanes` is OUR geometry when
 * given; when omitted the lanes are derived from the dividers (the JAR). */
export function censusOf(svg: string, lanes?: readonly LaneExtent[]): SwimlaneCensus {
  const root = normalizeSvg(svg);
  const height = num(root.attrs?.['height']);
  const elements = flatten(root);
  const dividers = dividersOf(elements, height);
  const dividerXs = dividers.map((d) => num(d.attrs?.['x1']));
  const bandRect = findBand(elements, dividers);
  return {
    dividerXs,
    titles: titlesIn(elements, bandRect),
    bandRect,
    lanes: lanes ?? lanesFromDividers(dividerXs),
    width: root.attrs?.['width'] ?? '',
    height: root.attrs?.['height'] ?? '',
  };
}

// ---------------------------------------------------------------------------
// The comparison. Pure; names the fixture, the side and every moved quantity.
// ---------------------------------------------------------------------------

export interface CensusCheckResult {
  readonly ok: boolean;
  readonly message: string;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function censusProblems(pinned: SwimlaneCensus, live: SwimlaneCensus): string[] {
  const problems: string[] = [];
  const show = (v: unknown): string => JSON.stringify(v);
  if (!same(pinned.dividerXs, live.dividerXs)) {
    problems.push(`dividerXs: pinned ${show(pinned.dividerXs)} -> now ${show(live.dividerXs)}`);
  }
  if (!same(pinned.titles, live.titles))
    problems.push(`titles: pinned ${show(pinned.titles)} -> now ${show(live.titles)}`);
  if (!same(pinned.bandRect, live.bandRect)) {
    problems.push(`bandRect: pinned ${show(pinned.bandRect)} -> now ${show(live.bandRect)}`);
  }
  if (!same(pinned.lanes, live.lanes)) problems.push(`lanes: pinned ${show(pinned.lanes)} -> now ${show(live.lanes)}`);
  if (pinned.width !== live.width) problems.push(`width: pinned ${pinned.width} -> now ${live.width}`);
  if (pinned.height !== live.height) problems.push(`height: pinned ${pinned.height} -> now ${live.height}`);
  return problems;
}

export function checkCensus(
  f: FixtureRef,
  side: 'ours' | 'jar',
  pinned: SwimlaneCensus | undefined,
  live: SwimlaneCensus,
): CensusCheckResult {
  const where = `${f.type}/${f.slug} [${side}]`;
  if (pinned === undefined) {
    return {
      ok: false,
      message:
        `${where}: swimlane-baseline.json carries no "${side}" census for this fixture. ` +
        `A "baseline" entry must pin BOTH sides; re-pin it from a fresh measurement ` +
        `rather than letting an unpinned side evaluate as "no change".`,
    };
  }
  const problems = censusProblems(pinned, live);
  if (problems.length === 0) return { ok: true, message: `${where}: swimlane census matches its pin.` };
  return {
    ok: false,
    message:
      `${where}: SWIMLANE CENSUS MOVED -- ${problems.join(' | ')}. This gate is an EQUALITY ` +
      `pin, not a ratchet. If this move is the intended effect of a deliberate change, re-pin ` +
      `oracle/goldens/svg-activity/swimlane-baseline.json FROM A FRESH MEASUREMENT (T7, once) ` +
      `and state the delta in the mission close-out. Never hand-edit an entry to make this pass.`,
  };
}

/** Partition status for one fixture, derived from its own content. */
export function statusOf(golden: string, oursThrew: boolean): SwimlaneFixture['status'] {
  if (JAR_ERROR_PAGE_RE.test(golden)) return 'jar-error';
  return oursThrew ? 'error' : 'baseline';
}
