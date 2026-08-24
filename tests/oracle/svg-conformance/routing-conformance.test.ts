/**
 * ROUTING-conformance gate — does each source reach the engine upstream gives
 * it to? (`sequence-engine-overclaims-nested-diagrams` / T1, 2026-08-23.)
 *
 * Every other gate here asks how CLOSE our bytes are once an engine has
 * drawn. None asks whether the RIGHT engine drew. 86 fixtures routed to a
 * different engine than the jar and survived indefinitely, because every one
 * still renders: `renderSync` never throws (it returns an error-diagram SVG,
 * `src/index.ts:250`), so absence of a throw proves nothing and no golden,
 * ratchet or census moved. This file is the missing comparison (D3,
 * `plans/sequence-engine-overclaims-nested-diagrams/decisions.md`).
 *
 * THE ORACLE IS THE JAR'S OWN ANSWER, read from each fixture's committed
 * golden: `TextBlockExporter.java:292-294` stamps
 * `withRootAttribute("data-diagram-type", ...)` on every document it exports.
 * Corpus DIRECTORY NAMES are explicitly NOT the oracle (D6):
 * `scripts/populate-corpus.py` over-selects — a bare `A -> B` anywhere makes
 * its sequence pattern match — so `object/zuvila-56-nuda425` is a CLASS
 * diagram and 70 files under `sequence/` are not sequence diagrams. The
 * directory name builds a path and does nothing else.
 *
 * A golden carrying no such attribute is legitimately `NONE`, not a skip:
 * upstream emits none for `@startdot` passthrough and some error pages, and
 * several of our engines (activity, board, chart, dot, ...) likewise return a
 * `RenderFragment` with no `diagramType`. `NONE` is a real answer on BOTH
 * sides and is compared like any other.
 *
 * THE GATE RATCHETS DOWN ONLY.
 *
 *   - a fixture pinned `agree` that now disagrees -> FAIL, naming the slug,
 *     its `jarType` and its `ourType`, with the whole jar->ours bucket table
 *     so a reader sees WHICH mechanism moved without re-running anything.
 *   - a fixture pinned `known-misroute` that now agrees -> PASS, logged
 *     `[FIXED]` with a note that the pin is stale. A fall must never fail;
 *     falls are this mission's entire point.
 *   - a fixture pinned `known-misroute` that lands on a DIFFERENT wrong
 *     engine -> PASS, logged `[CHANGED]`. It has not newly misrouted, and
 *     the gated quantity is the SET of misrouting fixtures, not which wrong
 *     engine each one reached.
 *   - a fixture on disk that is in no baseline entry -> FAIL. A corpus that
 *     grew under the gate is un-measured, and silently un-measured fixtures
 *     are how the original 86 survived.
 *
 * THE INCLUDE STORE IS PART OF THE MEASUREMENT, deliberately. Rendering
 * without one makes `renderSync` throw on any `!include` (`src/index.ts:213`)
 * and return `errorSvg`, which carries no `data-diagram-type` — so a
 * RESOLUTION failure reads as a routing answer of `NONE`. Measured both ways
 * over all 3158 fixtures: no store => 90 disagreements, the shared
 * `tests/helpers/fixture-include-store.ts` => 79, and the 79 are a STRICT
 * SUBSET (it fixes 11, breaks 0; all 11 are `!include` fixtures). The brief's
 * own 86 is the no-store number over the dot-cache tree alone and reproduces
 * exactly, so the tree has not moved. Pinning those 11 as `known-misroute`
 * would floor this mission's SLI above zero for a reason no routing change
 * can move — and that module's header already records that omitting it "was
 * measuring a different population than the census".
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/routing-conformance.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

/** Which committed tree a fixture lives in. Decides the golden's filename and
 *  the root the `slug` is relative to — nothing else. */
type Tree = 'dot-cache' | 'goldens';

interface BaselineFixture {
  readonly tree: Tree;
  /** Top-level directory under the tree root. NOT authoritative (D6). */
  readonly type: string;
  /** Path from `<tree root>/<type>/` to the fixture directory. Usually one
   *  segment; `oracle/goldens/svg-description/` nests one level deeper. */
  readonly slug: string;
  /** The jar's own answer, read from this fixture's golden. */
  readonly jarType: string;
  /** Ours as pinned. Informational for an `agree` entry (it equals
   *  `jarType`); for a `known-misroute` entry it records WHICH wrong engine
   *  claimed the source, which is what the bucket table is built from. */
  readonly ourType: string;
  readonly status: 'agree' | 'known-misroute';
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface BaselineManifest {
  readonly fixtures: readonly BaselineFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-conformance/routing-baseline.json');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache');
const GOLDENS_ROOT = join(REPO, 'oracle/goldens');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

/** `TextBlockExporter.java:292-294`'s root attribute. */
const DIAGRAM_TYPE_ATTR_RE = /data-diagram-type="([A-Z]+)"/;
/** Read only the head of a golden. The attribute is on the ROOT element, and
 *  `sequence/zudize-61-vomi445`'s golden is 8.26 MB — reading whole documents
 *  to find a byte-300 attribute would dominate this gate's runtime. */
const HEAD_BYTES = 4096;
/** The value recorded when a document carries no such attribute at all. Real
 *  on both sides (see the header), never a sentinel for "unmeasured". */
const NO_DIAGRAM_TYPE = 'NONE';

export function diagramTypeOf(head: string): string {
  return DIAGRAM_TYPE_ATTR_RE.exec(head)?.[1] ?? NO_DIAGRAM_TYPE;
}

function readHead(path: string): string {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(HEAD_BYTES);
    return buf.subarray(0, readSync(fd, buf, 0, HEAD_BYTES, 0)).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

type FixtureRef = Pick<BaselineFixture, 'tree' | 'type' | 'slug'>;

function fixtureDir(f: FixtureRef): string {
  return f.tree === 'dot-cache'
    ? join(CACHE_ROOT, f.type, f.slug)
    : join(GOLDENS_ROOT, f.type, f.slug);
}

function goldenPath(f: FixtureRef): string {
  return join(fixtureDir(f), f.tree === 'dot-cache' ? 'in.svg' : 'golden.svg');
}

/** Stable identity across the two trees. */
function keyOf(f: FixtureRef): string {
  return `${f.tree}:${f.type}/${f.slug}`;
}

function hasCachedFixture(f: FixtureRef): boolean {
  return existsSync(join(fixtureDir(f), 'in.puml')) && existsSync(goldenPath(f));
}

// ---------------------------------------------------------------------------
// Enumeration -- from DISK, not from the manifest, so a fixture added to
// either tree without a baseline entry is detectable (it is a FAIL below).
// ---------------------------------------------------------------------------

/** Depth-first: a directory holding both `in.puml` and the tree's golden IS a
 *  fixture; anything else is descended into. Both trees are mostly flat but
 *  `oracle/goldens/svg-description/{component,usecase}/<slug>/` and
 *  `svg-skin/rose/<slug>/` nest one level deeper — 52 fixtures that a
 *  single-level `readdir` silently drops. */
function walk(typeRoot: string, dir: string, tree: Tree, type: string, out: FixtureRef[]): void {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const child = join(dir, e.name);
    const ref: FixtureRef = { tree, type, slug: relative(typeRoot, child) };
    if (hasCachedFixture(ref)) out.push(ref);
    else walk(typeRoot, child, tree, type, out);
  }
}

function collectTree(root: string, tree: Tree, keep: (name: string) => boolean): FixtureRef[] {
  const out: FixtureRef[] = [];
  for (const e of readdirSync(root, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!e.isDirectory() || !keep(e.name)) continue;
    walk(join(root, e.name), join(root, e.name), tree, e.name, out);
  }
  return out;
}

function collectFixtures(): FixtureRef[] {
  return [
    ...collectTree(CACHE_ROOT, 'dot-cache', () => true),
    ...collectTree(GOLDENS_ROOT, 'goldens', (n) => n.startsWith('svg-')),
  ];
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

interface LiveRouting {
  readonly jarType: string;
  readonly ourType: string;
}

/** Routes ONE fixture the way production does: `renderSync` over the raw
 *  source, then read the root attribute off our own document. Deliberately
 *  NOT `registry.resolve()` — that would test the dispatcher in isolation and
 *  miss the engines whose `RenderFragment` carries no `diagramType` at all,
 *  which is exactly half of the `-> NONE` bucket.
 *
 *  `DeterministicMeasurer` is passed for the reason every sibling harness
 *  passes it, plus one specific to this file: under vitest's jsdom
 *  environment the production `CanvasMeasurer` default hits
 *  `HTMLCanvasElement.prototype.getContext` (unimplemented without the
 *  `canvas` package), putting a layout failure -- hence an `errorSvg`, hence
 *  a routing answer of `NONE` -- inside the measurement. Routing is
 *  measurer-independent, and that is measured, not assumed: the corpus
 *  scores 79 with an identical bucket table under either measurer. */
function measure(f: FixtureRef, store: ReturnType<typeof fixtureIncludeStore>): LiveRouting {
  const markup = readFileSync(join(fixtureDir(f), 'in.puml'), 'utf8');
  const ours = renderSync(markup, {
    includeStore: store,
    measurer: new DeterministicMeasurer(),
  }).slice(0, HEAD_BYTES);
  return { jarType: diagramTypeOf(readHead(goldenPath(f))), ourType: diagramTypeOf(ours) };
}

let measured: Map<string, LiveRouting> | undefined;

/** Memoised whole-corpus measurement. Every assertion below reads this map;
 *  the warm-up `it()` at the top of the first `describe` pays for it once and
 *  carries the only budget. */
function live(): Map<string, LiveRouting> {
  if (measured !== undefined) return measured;
  const store = fixtureIncludeStore();
  measured = new Map(collectFixtures().map((f) => [keyOf(f), measure(f, store)]));
  return measured;
}

// ---------------------------------------------------------------------------
// Pure gate logic -- extracted so the FAIL branch is exercisable (AC3) with
// fabricated inputs, without ever touching routing-baseline.json on disk.
// ---------------------------------------------------------------------------

interface CheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** A fixture pinned `agree` must still agree. Nothing else can fail this gate:
 *  a pinned misroute is already counted, and no movement of one can raise the
 *  count. */
export function checkNoNewMisroute(f: BaselineFixture, now: LiveRouting | undefined): CheckResult {
  const at = `${f.tree} ${f.type}/${f.slug}`;
  if (now === undefined) {
    return {
      ok: false,
      message:
        `${at}: pinned in routing-baseline.json but ABSENT from the live corpus walk. ` +
        `Both trees are committed, so a missing fixture means a broken or partial ` +
        `checkout — restore the tree rather than pruning the baseline to match it.`,
    };
  }
  if (now.ourType === now.jarType) return { ok: true, message: `${at}: agrees (${now.jarType}).` };
  return {
    ok: false,
    message:
      `${at}: NEWLY MISROUTES. The jar routes this source to ${now.jarType}; we route it ` +
      `to ${now.ourType}. It agreed when the baseline was pinned (${f.measuredAt}, ` +
      `${f.measuredAgainstCommit}), so a registration-order or heuristic change took a ` +
      `fixture that was CORRECT. This gate ratchets DOWN ONLY and has no bypass: find the ` +
      `mechanism in the Java before touching this file. Never widen a pattern to make a ` +
      `bucket close — widening is how the over-claim class arose in the first place.`,
  };
}

/** Progress classification for an already-pinned misroute. `undefined` when it
 *  is still wrong in exactly the way it was pinned. */
export function progressNote(f: BaselineFixture, now: LiveRouting): string | undefined {
  const at = `${f.tree} ${f.type}/${f.slug}`;
  if (now.ourType === now.jarType) {
    return (
      `[FIXED] ${at} now routes to ${now.jarType}, matching the jar. Its ` +
      `known-misroute pin is STALE: re-pin this entry to status "agree" in ` +
      `oracle/goldens/svg-conformance/routing-baseline.json from a fresh measurement. ` +
      `A fall never fails this gate.`
    );
  }
  if (now.ourType !== f.ourType) {
    return (
      `[CHANGED] ${at} still misroutes, but to a different engine: pinned ${f.ourType}, ` +
      `now ${now.ourType} (jar says ${now.jarType}). Not a regression — the gated quantity ` +
      `is the SET of misrouting fixtures, not which wrong engine each reached.`
    );
  }
  return undefined;
}

/** The jar->ours bucket table (AC5), so a failure names the mechanism class
 *  that moved rather than only the fixture. */
export function bucketTable(rows: readonly LiveRouting[]): string {
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.jarType} -> ${r.ourType}`;
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const lines = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, n]) => `    ${k}: ${n}`);
  return [`  jar -> ours (${rows.length} disagreeing):`, ...lines].join('\n');
}

const pinnedAgree = manifest.fixtures.filter((f) => f.status === 'agree');
const pinnedMisroutes = manifest.fixtures.filter((f) => f.status === 'known-misroute');

// ---------------------------------------------------------------------------
// AC2 -- warm-up + corpus completeness in BOTH directions. Runs first, so it
// owns the whole-corpus measurement cost and the only per-test budget.
// ---------------------------------------------------------------------------

/** Derived from measurement, never fitted to whatever made the test go green.
 *
 * BASE, measured in situ: **15,492 ms** under a full `npm test` -- v8
 * coverage on, 12 vitest forks on 12 cores, the rest of the 633-file suite
 * competing (`--reporter=verbose`, 2026-08-23). Alone it measures 11.25 s
 * with coverage and 6.0 s without, so most of the cost is instrumentation
 * and contention rather than the 3,158 renders.
 *
 * CEILING: `.agent-notes/ratchet-zudize-timeout.md` measured how a CPU-bound
 * conformance test degrades with fork count -- 1,374 ms at 12 copies, 3,711 ms
 * at 22, a **2.70x** step, well above the 1.83x CPU share alone predicts. Two
 * concurrent `npm test` runs put exactly 22 forks on 12 cores, and that
 * condition is what previously turned a green ratchet red. Applying it here:
 * 15,492 ms x 2.70 = **~41,800 ms**.
 *
 * 120,000 ms is ~2.9x that ceiling -- wide for the reason that note gives
 * (the contended worker also runs the rest of its shard, so the tail lies
 * above the base), not because a smaller number went red. A hang still
 * surfaces in two minutes, well inside CI's 12-minute job cap.
 *
 * No PER-FIXTURE budget is needed or wanted. Unlike the sequence ratchet,
 * nothing here reads a whole golden: `readHead` takes the first 4 KB, so the
 * 8.26 MB `sequence/zudize-61-vomi445` golden that forced that budget costs
 * this gate the same as any other fixture. */
const CORPUS_BUDGET_MS = 120_000;

describe('routing conformance — corpus completeness', () => {
  it(
    'every fixture on disk is pinned, and every pin is on disk',
    () => {
      const seen = live();
      expect(manifest.fixtures.length, 'the baseline must not be empty').toBeGreaterThan(0);

      const pinnedKeys = new Set(manifest.fixtures.map(keyOf));
      const unpinned = [...seen.keys()].filter((k) => !pinnedKeys.has(k));
      expect(
        unpinned.slice(0, 10),
        `${unpinned.length} fixture(s) exist on disk with NO routing-baseline.json entry. ` +
          `An un-measured fixture is exactly how the original 86 misroutes survived: they ` +
          `all rendered, so nothing failed. Measure and pin them — do not narrow the walk.`,
      ).toEqual([]);

      const missing = manifest.fixtures.filter((f) => !seen.has(keyOf(f))).map(keyOf);
      expect(
        missing.slice(0, 10),
        `${missing.length} pinned fixture(s) are absent from the live walk. Both trees are ` +
          `committed, so this is a broken checkout, not a cache awaiting regeneration.`,
      ).toEqual([]);
    },
    CORPUS_BUDGET_MS,
  );
});

// ---------------------------------------------------------------------------
// AC1 + AC3 -- no fixture that agrees today may disagree at run time.
// Aggregate, not per-fixture: only an aggregate can carry AC5's bucket table,
// and 3079 `it()` blocks would cost more in runner overhead than the whole
// measurement they wrap.
// ---------------------------------------------------------------------------

describe('routing conformance — no fixture newly misroutes', () => {
  it('every fixture pinned "agree" still routes where the jar routes it', () => {
    const seen = live();
    const broken = pinnedAgree
      .map((f) => ({ f, result: checkNoNewMisroute(f, seen.get(keyOf(f))) }))
      .filter(({ result }) => !result.ok);

    const moved = broken
      .map(({ f }) => seen.get(keyOf(f)))
      .filter((r): r is LiveRouting => r !== undefined);
    const detail =
      broken.length === 0
        ? ''
        : `\n${broken.map(({ result }) => `  - ${result.message}`).join('\n')}\n${bucketTable(moved)}`;

    expect(
      broken.length,
      `${broken.length} of ${pinnedAgree.length} previously-correct fixtures NEWLY ` +
        `MISROUTE. This is the mission's primary stop condition.${detail}`,
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AC4 -- a pinned misroute that improves must PASS, loudly. This is the whole
// point of the mission, so it must never be able to fail.
// ---------------------------------------------------------------------------

describe('routing conformance — pinned misroutes', () => {
  for (const f of pinnedMisroutes) {
    it(`${f.tree} ${f.type}/${f.slug}: jar says ${f.jarType}, pinned as ${f.ourType}`, () => {
      const now = live().get(keyOf(f));
      expect(now, `${keyOf(f)}: pinned but absent from the live walk`).toBeDefined();
      const note = progressNote(f, now!);
      if (note !== undefined) console.log(note);
      expect(now!.jarType).toBe(f.jarType);
    });
  }

  it('reports the standing misroute count and its bucket table', () => {
    const seen = live();
    const still = pinnedMisroutes
      .map((f) => seen.get(keyOf(f)))
      .filter((r): r is LiveRouting => r !== undefined && r.ourType !== r.jarType);
    console.log(
      `[ROUTING SLI] ${still.length} of ${pinnedMisroutes.length} pinned misroutes remain ` +
        `(target 0, ratcheting down only).\n${bucketTable(still)}`,
    );
    expect(still.length).toBeLessThanOrEqual(pinnedMisroutes.length);
  });
});

// ---------------------------------------------------------------------------
// AC3 + AC4 + AC5 -- branch discrimination. In-memory only: fabricated
// fixtures and fabricated live readings, never a baseline edit. A branch
// nobody has seen fire is not a gate.
// ---------------------------------------------------------------------------

const SAMPLE: BaselineFixture = {
  tree: 'dot-cache',
  type: 'sequence',
  slug: 'branch-probe',
  jarType: 'SEQUENCE',
  ourType: 'SEQUENCE',
  status: 'agree',
  measuredAt: '2026-08-23',
  measuredAgainstCommit: 'f66f6abb',
};

describe('routing conformance — branch discrimination', () => {
  it('a fixture that agrees passes', () => {
    expect(checkNoNewMisroute(SAMPLE, { jarType: 'SEQUENCE', ourType: 'SEQUENCE' }).ok).toBe(true);
  });

  it('a newly-disagreeing fixture fails, naming the slug, the jar type and ours', () => {
    const { ok, message } = checkNoNewMisroute(SAMPLE, {
      jarType: 'SEQUENCE',
      ourType: 'DESCRIPTION',
    });
    expect(ok).toBe(false);
    expect(message).toContain('branch-probe');
    expect(message).toContain('SEQUENCE');
    expect(message).toContain('DESCRIPTION');
    expect(message).toContain('NEWLY MISROUTES');
  });

  it('a pinned fixture missing from the live walk fails rather than passing vacuously', () => {
    const { ok, message } = checkNoNewMisroute(SAMPLE, undefined);
    expect(ok).toBe(false);
    expect(message).toContain('ABSENT');
  });

  it('NONE on both sides is an agreement, not an unmeasured fixture', () => {
    expect(checkNoNewMisroute(SAMPLE, { jarType: 'NONE', ourType: 'NONE' }).ok).toBe(true);
  });

  it('a fall to the jar type is reported [FIXED] and never fails', () => {
    const pinned: BaselineFixture = { ...SAMPLE, ourType: 'DESCRIPTION', status: 'known-misroute' };
    const note = progressNote(pinned, { jarType: 'SEQUENCE', ourType: 'SEQUENCE' });
    expect(note).toContain('[FIXED]');
    expect(note).toContain('STALE');
    expect(checkNoNewMisroute(pinned, { jarType: 'SEQUENCE', ourType: 'SEQUENCE' }).ok).toBe(true);
  });

  it('a misroute that moves to a different wrong engine is [CHANGED], not a regression', () => {
    const pinned: BaselineFixture = { ...SAMPLE, ourType: 'DESCRIPTION', status: 'known-misroute' };
    const note = progressNote(pinned, { jarType: 'SEQUENCE', ourType: 'JSON' });
    expect(note).toContain('[CHANGED]');
    expect(note).not.toContain('[FIXED]');
  });

  it('a misroute that has not moved is reported as neither', () => {
    const pinned: BaselineFixture = { ...SAMPLE, ourType: 'DESCRIPTION', status: 'known-misroute' };
    expect(progressNote(pinned, { jarType: 'SEQUENCE', ourType: 'DESCRIPTION' })).toBeUndefined();
  });

  it('the bucket table counts each jar->ours pair, ordered by size', () => {
    const table = bucketTable([
      { jarType: 'SEQUENCE', ourType: 'DESCRIPTION' },
      { jarType: 'SEQUENCE', ourType: 'DESCRIPTION' },
      { jarType: 'CLASS', ourType: 'SEQUENCE' },
    ]);
    expect(table).toContain('SEQUENCE -> DESCRIPTION: 2');
    expect(table).toContain('CLASS -> SEQUENCE: 1');
    expect(table.indexOf('SEQUENCE -> DESCRIPTION')).toBeLessThan(table.indexOf('CLASS ->'));
    expect(table).toContain('3 disagreeing');
  });

  it('a document with no root attribute reads as NONE, and one with it reads that value', () => {
    expect(diagramTypeOf('<svg xmlns="http://www.w3.org/2000/svg" width="10">')).toBe('NONE');
    expect(diagramTypeOf('<svg data-diagram-type="SEQUENCE" width="10">')).toBe('SEQUENCE');
  });
});
