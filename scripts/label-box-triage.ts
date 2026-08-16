/**
 * Per-slug triage for `label-size-backlog.json` across the four DOT-parity
 * ratchets (class/description/object/state) — mission edge-label-box-backlog,
 * T2. For every slug a type's backlog names, renders its pinned golden,
 * compares emitted edge-label boxes against the committed oracle svek-N.dot,
 * and prints one line per mismatched box plus a per-type/total count. Later
 * tasks read this output to see what mechanism a remaining slug needs, and
 * which have already cleared.
 *
 * Deliberately offline, mirroring the ratchet tests that own these backlogs
 * (`tests/oracle/{class,object,state}-dot-parity.test.ts`,
 * `tests/oracle/description-parity.ratchet.test.ts`): both `input.puml` and
 * the oracle's `svek-N.dot` are committed goldens under
 * `oracle/goldens/<type>/<slug>/`, so no Java / oracle jar is invoked.
 *
 * Reuses `parseSvekDot`/`dotInputToStructural` from `tests/oracle/svek-dot.ts`
 * rather than reimplementing DOT parsing; `boxesOfKind` below mirrors that
 * module's (unexported) `sortedLabelBoxes`, the same duplication
 * `scripts/dot-sync-drilldown.ts#labelBoxesOf` already carries for the same
 * reason — the internals compared here are more granular (per-kind, not the
 * combined multiset) than what `compareStructural` needs to expose.
 *
 * Usage: `npx jiti scripts/label-box-triage.ts`
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import { MapIncludeStore } from '../src/core/tim/IncludeStore.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import { combineAssetStores } from '../src/core/asset-store.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import { parseSvekDot, dotInputToStructural, type StructuralGraph } from '../tests/oracle/svek-dot.js';
import { loadSlugBacklog } from '../tests/oracle/dot-parity-backlog-data.js';
import { buildStdlibAssetsStore } from '../tests/helpers/stdlib-assets-store.js';
import { buildSpriteAssetsStore } from '../tests/helpers/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../tests/helpers/emoji-assets-store.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN_ROOT = join(REPO, 'oracle', 'goldens');

/** The four ratchets that share `label-size-backlog.json` (see
 *  `tests/oracle/dot-parity-backlogs.ts` doc comment). */
export const BACKLOG_TYPES = ['class', 'description', 'object', 'state'] as const;
export type BacklogType = (typeof BACKLOG_TYPES)[number];

// ---------------------------------------------------------------------------
// Pure comparator (unit-tested in isolation — no rendering, no I/O).
// ---------------------------------------------------------------------------

/** `StructuralEdge` field name → the DOT attr name shown in a mismatch line. */
const LABEL_KIND_ATTR = {
  labelBox: 'label',
  tailLabelBox: 'taillabel',
  headLabelBox: 'headlabel',
  xLabelBox: 'xlabel',
} as const;
type LabelKind = keyof typeof LABEL_KIND_ATTR;
const LABEL_KINDS = Object.keys(LABEL_KIND_ATTR) as LabelKind[];

export interface Mismatch {
  kind: string;
  oracle: string;
  ours: string;
}

/** `"WIDTHxHEIGHT"` → `[width, height]`, both in the box's native units. */
function parseBoxWH(box: string): [number, number] {
  const [w, h] = box.split('x').map(Number);
  return [w ?? 0, h ?? 0];
}

/** One label kind's box sizes for every edge of `g` that carries one, sorted
 *  numerically (width then height) — NOT the alphabetic string sort
 *  `sortedLabelBoxes` uses for its combined multiset, because pairing two
 *  numerically-close sizes side by side is what makes a mismatch line
 *  readable. */
export function boxesOfKind(g: StructuralGraph, kind: LabelKind): string[] {
  return g.edges
    .map((e) => e[kind])
    .filter((b): b is string => b !== undefined)
    .sort((a, b) => {
      const [aw, ah] = parseBoxWH(a);
      const [bw, bh] = parseBoxWH(b);
      return aw - bw || ah - bh;
    });
}

/** Positionally pairs `oracle`/`candidate`'s per-kind box lists (both sorted
 *  numerically) and reports every index where they differ. A missing
 *  counterpart (list-length mismatch — not expected for a `labelSizeOk`-only
 *  backlog slug, since `labelOk` must already hold, but handled rather than
 *  indexing past the end) reports as `'-'`. */
export function mismatchesForGraph(oracle: StructuralGraph, candidate: StructuralGraph): Mismatch[] {
  const out: Mismatch[] = [];
  for (const kind of LABEL_KINDS) {
    const oracleBoxes = boxesOfKind(oracle, kind);
    const ourBoxes = boxesOfKind(candidate, kind);
    const n = Math.max(oracleBoxes.length, ourBoxes.length);
    for (let i = 0; i < n; i++) {
      const o = oracleBoxes[i];
      const c = ourBoxes[i];
      if (o !== c) out.push({ kind: LABEL_KIND_ATTR[kind], oracle: o ?? '-', ours: c ?? '-' });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Formatting (unit-tested in isolation — pure over already-computed data).
// ---------------------------------------------------------------------------

export interface SlugReport {
  clearable: boolean;
  mismatches: Mismatch[];
  countMismatch?: string;
}

export function renderMismatchLine(m: Mismatch): string {
  return `  ${m.kind} oracle=${m.oracle} ours=${m.ours}`;
}

/** One slug's report as printable lines: `type/slug   CLEARABLE` when every
 *  box now matches, `type/slug   COUNT-MISMATCH (...)` when the fixture no
 *  longer produces as many layout graphs as it has pinned oracle files
 *  (out of this backlog's scope — reported, not silently skipped), or the
 *  slug header followed by one line per mismatched box. */
export function renderSlugLines(type: BacklogType, slug: string, r: SlugReport): string[] {
  const header = `${type}/${slug}`;
  if (r.countMismatch !== undefined) return [`${header}   COUNT-MISMATCH (${r.countMismatch})`];
  if (r.clearable) return [`${header}   CLEARABLE`];
  return [header, ...r.mismatches.map(renderMismatchLine)];
}

export interface Stats {
  slugs: number;
  clearable: number;
  mismatchBoxes: number;
}

export function statsFromReports(reports: readonly SlugReport[]): Stats {
  return {
    slugs: reports.length,
    clearable: reports.filter((r) => r.clearable).length,
    mismatchBoxes: reports.reduce((n, r) => n + r.mismatches.length, 0),
  };
}

export function formatStats(label: string, s: Stats): string {
  return `${label}: ${s.slugs} slugs, ${s.clearable} clearable, ${s.mismatchBoxes} mismatched box(es)`;
}

// ---------------------------------------------------------------------------
// Fixture I/O + render plumbing (exercised by the real run, not unit-tested —
// same split as scripts/measure-description-size-deltas.ts).
// ---------------------------------------------------------------------------

function svekFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

/** Renders one golden's `input.puml`, capturing every `layoutGraph()` input in
 *  pass order. `description` needs the stdlib/sprite/emoji asset stores the
 *  parity ratchet wires (`description-parity.ratchet.test.ts`); the other
 *  three ratchets render with the measurer alone. */
function captureGraphs(type: BacklogType, markup: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(markup, {
      measurer: new WidthTableMeasurer(),
      ...(type === 'description'
        ? {
            includeStore: withStdlib(new MapIncludeStore(), buildStdlibAssetsStore()),
            assetStore: combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore()),
          }
        : {}),
    });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

function triageSlug(type: BacklogType, slug: string): SlugReport {
  const dir = join(GOLDEN_ROOT, type, slug);
  const files = svekFiles(dir);
  const captured = captureGraphs(type, readFileSync(join(dir, 'input.puml'), 'utf8'));
  if (captured.length !== files.length) {
    return {
      clearable: false,
      mismatches: [],
      countMismatch: `expected ${files.length} captured layout graph(s), got ${captured.length}`,
    };
  }
  const mismatches: Mismatch[] = [];
  for (let i = 0; i < files.length; i++) {
    const oracle = parseSvekDot(readFileSync(join(dir, files[i]!), 'utf8'));
    const candidate = dotInputToStructural(captured[i]!);
    mismatches.push(...mismatchesForGraph(oracle, candidate));
  }
  return { clearable: mismatches.length === 0, mismatches };
}

function backlogSlugsFor(type: BacklogType): string[] {
  const dir = join(GOLDEN_ROOT, type);
  if (!existsSync(dir)) return [];
  return [...loadSlugBacklog(dir, 'label-size-backlog.json')].sort();
}

/* v8 ignore start -- CLI entry point; the pure functions above are exercised
 * directly by tests/unit/scripts/label-box-triage.test.ts. */
function main(): void {
  const allReports: SlugReport[] = [];
  for (const type of BACKLOG_TYPES) {
    const typeReports: SlugReport[] = [];
    for (const slug of backlogSlugsFor(type)) {
      const report = triageSlug(type, slug);
      for (const line of renderSlugLines(type, slug, report)) console.log(line);
      typeReports.push(report);
    }
    console.log(formatStats(type, statsFromReports(typeReports)));
    allReports.push(...typeReports);
  }
  console.log(formatStats('TOTAL', statsFromReports(allReports)));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
