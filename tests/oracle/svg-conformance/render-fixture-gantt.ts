/**
 * Shared low-level render helper for the svg-gantt oracle harness
 * (gantt-engine-port / T0c, D3b, D7).
 *
 * Copies `render-fixture-wbs.ts`: a THIN wrapper around the production
 * `renderSync`. Gantt still refuses today (`@startgantt` renders the
 * dispatcher's "unknown diagram type" page), so both gantt ratchets are
 * DORMANT: their pin files are empty until the orchestrator pins at the
 * batch-7 turn-on (D7).
 *
 * {@link ganttRenderOptions} is the ONE function that builds the `renderSync`
 * options for a gantt fixture. T1b adds the recorded capture clock there
 * (`oracle/capture-clock.json`, keyed by `<engine>/<slug>` or
 * `fixtures/<path>`); no clock option exists yet because the library seam
 * does not exist yet.
 *
 * TWO fixture roots, as for wbs:
 *   - the CACHED corpus, `test-results/dot-cache/gantt/<slug>/{in.puml,in.svg}`;
 *   - the AUTHORED root, {@link AUTHORED_GANTT_ROOT}, flat `<slug>.puml` +
 *     `<slug>.svg`. The directory may be ABSENT or EMPTY (T0b writes it in
 *     parallel); every reader tolerates that.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import type { Clock } from '../../../src/core/clock.js';
import { renderSync } from '../../../src/index.js';
import { clockForKey, corpusClockKey, fixtureClockKey } from './capture-clock.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

/** The `RenderOptions` fields a gantt fixture caller may pass (measurer is separate). */
export interface GanttFixtureRenderOptions {
  assetStore?: AssetStore;
  includeStore?: IncludeStore;
  /** The slug's recorded capture clock (`oracle/capture-clock.json`), when the source is clock-dependent. */
  clock?: Clock;
}

/**
 * The single place gantt fixture render options are built, including the
 * recorded clock for `slug` (gantt-engine-port D3b). `slug` is the sidecar key's slug part.
 */
export function ganttRenderOptions(
  slug: string,
  includeStore: IncludeStore = fixtureIncludeStore(),
): GanttFixtureRenderOptions {
  // A corpus row is keyed `gantt/<slug>`, an authored fixture `fixtures/gantt/<slug>` (capture-clock.ts).
  const clock = clockForKey(corpusClockKey('gantt', slug)) ?? clockForKey(fixtureClockKey(`gantt/${slug}`));
  return { includeStore, ...(clock === undefined ? {} : { clock }) };
}

/** Renders a `.puml` gantt fixture through the PRODUCTION `renderSync`. */
export function renderFixtureGantt(
  markup: string,
  measurer: StringMeasurer,
  options?: GanttFixtureRenderOptions,
): string {
  return renderSync(markup, { measurer, ...options });
}

/** The committed, flat authored-fixture root (`<slug>.puml` + `<slug>.svg`). */
export const AUTHORED_GANTT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/gantt');

const PUML_SUFFIX = '.puml';
const SVG_SUFFIX = '.svg';

/** Every authored fixture slug (sorted); `[]` when the root is absent or empty. */
export function listAuthoredGanttSlugs(root: string = AUTHORED_GANTT_ROOT): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((f) => f.endsWith(PUML_SUFFIX))
    .map((f) => f.slice(0, -PUML_SUFFIX.length))
    .sort();
}

/** One authored fixture's source and jar oracle (`undefined` when the svg is absent). */
export interface AuthoredGanttFixture {
  readonly markup: string;
  readonly golden: string | undefined;
}

export function readAuthoredGanttFixture(slug: string, root: string = AUTHORED_GANTT_ROOT): AuthoredGanttFixture {
  const svgPath = join(root, slug + SVG_SUFFIX);
  return {
    markup: readFileSync(join(root, slug + PUML_SUFFIX), 'utf8'),
    golden: existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : undefined,
  };
}

/** Include store for the authored root: relative targets from the fixture's dir, else the shared store. */
export function authoredGanttIncludeStore(root: string = AUTHORED_GANTT_ROOT): IncludeStore {
  const shared = fixtureIncludeStore();
  const local = (path: string): string | undefined => {
    const file = join(root, path);
    return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  };
  return {
    get: (path: string): string | undefined => local(path) ?? shared.get(path),
    has: (path: string): boolean => local(path) !== undefined || shared.has(path),
    getPumlResource: (fullname: string): string | undefined => shared.getPumlResource?.(fullname),
  };
}
