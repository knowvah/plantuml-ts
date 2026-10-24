/**
 * Authored harness for the lengthAdjust document-wide mission (lad / T0c, D5).
 *
 * Copies the authored half of `render-fixture-utility.ts` over
 * `tests/fixtures/lengthadjust/` (`<engine>-<variant>.puml` + the jar's
 * `.svg`, variants default/none/glyphs/onechar) and adds the D5 projection:
 * the root `<g>` attribute set and the per-`<text>` `textLength` presence
 * vector, the two things `lengthAdjust` changes in the jar
 * (SvgGraphics.java:155-158 root attribute; :699-705 `textLength` only when
 * `text.length() > 1` and the option is SPACING or SPACING_AND_GLYPHS).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync, type RenderOptions } from '../../../src/index.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';
import { isOurErrorPage, surveyAssetStore } from './render-fixture-utility.js';

/** The committed, flat authored-fixture root (`<slug>.puml` + `<slug>.svg`). */
export const AUTHORED_LENGTHADJUST_ROOT: string = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/lengthadjust',
);

const PUML_SUFFIX = '.puml';
const SVG_SUFFIX = '.svg';

/** Every authored fixture slug: the `*.puml` basenames under the root, sorted. */
export function listAuthoredLengthAdjustSlugs(root: string = AUTHORED_LENGTHADJUST_ROOT): string[] {
  return readdirSync(root)
    .filter((f) => f.endsWith(PUML_SUFFIX))
    .map((f) => f.slice(0, -PUML_SUFFIX.length))
    .sort();
}

/** One authored fixture's source and jar oracle (`undefined` when the svg is absent). */
export interface AuthoredLengthAdjustFixture {
  readonly markup: string;
  readonly golden: string | undefined;
}

export function readAuthoredLengthAdjustFixture(
  slug: string,
  root: string = AUTHORED_LENGTHADJUST_ROOT,
): AuthoredLengthAdjustFixture {
  const svgPath = join(root, slug + SVG_SUFFIX);
  return {
    markup: readFileSync(join(root, slug + PUML_SUFFIX), 'utf8'),
    golden: existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : undefined,
  };
}

/**
 * The ONE place the authored harness builds its `renderSync` options. A later
 * task (T1e) adds the internal jar-compatible style-input flag here.
 */
function authoredRenderOptions(): RenderOptions {
  return {
    measurer: new DeterministicMeasurer(),
    assetStore: surveyAssetStore(),
    includeStore: fixtureIncludeStore(),
  };
}

/** Renders an authored fixture through the production `renderSync`. */
export function renderAuthoredLengthAdjust(markup: string): string {
  return renderSync(markup, authoredRenderOptions());
}

const DEFS_END = /<defs\s*\/>|<\/defs>/;
const OPEN_G = /<g(\s[^>]*)?>/;
const ATTRIBUTE = /([^\s=]+)="([^"]*)"/g;

/** The attributes of the first `<g …>` after `<defs>` (the root group); order-insensitive. */
export function rootGroupAttributes(svg: string): Map<string, string> {
  const defs = DEFS_END.exec(svg);
  const from = defs === null ? 0 : defs.index + defs[0].length;
  const open = OPEN_G.exec(svg.slice(from));
  const attrs = new Map<string, string>();
  if (open?.[1] === undefined) return attrs;
  for (const m of open[1].matchAll(ATTRIBUTE)) attrs.set(m[1]!, m[2]!);
  return attrs;
}

const TEXT_OPEN = /<text(\s[^>]*)?>/g;
const TEXT_LENGTH_ATTR = /(?:^|\s)textLength="/;

/** One entry per `<text>` in document order: does it carry `textLength`? */
export function textLengthPresence(svg: string): boolean[] {
  return [...svg.matchAll(TEXT_OPEN)].map((m) => TEXT_LENGTH_ATTR.test(m[1] ?? ''));
}

/** True when both root-group attribute sets hold the same keys and values. */
export function rootGroupsEqual(a: ReadonlyMap<string, string>, b: ReadonlyMap<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

/** True when the vectors have equal length and every entry matches. */
export function presenceVectorsEqual(a: readonly boolean[], b: readonly boolean[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export interface LengthAdjustProjection {
  readonly rootExact: boolean;
  readonly textLengthMatch: boolean;
}

/** The D5 projection of an (ours, oracle) pair. */
export function projectLengthAdjust(ours: string, golden: string): LengthAdjustProjection {
  return {
    rootExact: rootGroupsEqual(rootGroupAttributes(ours), rootGroupAttributes(golden)),
    textLengthMatch: presenceVectorsEqual(textLengthPresence(ours), textLengthPresence(golden)),
  };
}

export type AuthoredLengthAdjustMeasure =
  | ({
      readonly errored: false;
      readonly score: number;
      readonly diffCount: number;
      readonly weErrored: boolean;
    } & LengthAdjustProjection)
  | { readonly errored: true; readonly reason: string };

/** Measures one authored row against the jar oracle beside it. */
export function measureAuthoredLengthAdjust(
  slug: string,
  root: string = AUTHORED_LENGTHADJUST_ROOT,
): AuthoredLengthAdjustMeasure {
  const { markup, golden } = readAuthoredLengthAdjustFixture(slug, root);
  if (golden === undefined) return { errored: true, reason: `${slug}.svg is missing` };
  try {
    const ours = renderAuthoredLengthAdjust(markup);
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return {
      errored: false,
      score: weightedScore(diffs),
      diffCount: diffs.length,
      weErrored: isOurErrorPage(ours),
      ...projectLengthAdjust(ours, golden),
    };
  } catch (err) {
    return { errored: true, reason: err instanceof Error ? err.message : String(err) };
  }
}
