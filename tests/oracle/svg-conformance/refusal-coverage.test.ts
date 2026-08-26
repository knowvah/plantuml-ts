/**
 * REFUSAL-coverage gate — do we produce an ERROR DIAGRAM for a source the jar
 * rendered? (`dispatch-by-parse-attempt` / T0, 2026-08-24.)
 *
 * The sibling `routing-conformance.test.ts` asks whether the RIGHT engine drew.
 * This one asks whether ANY engine drew. They are different questions and, once
 * this mission makes the parsers strict, the second becomes the load-bearing
 * one: today every engine's parse loop ends in a chain of `if (…) continue;`
 * with no `else`, so an unrecognised line is silently dropped
 * (`class/parser.ts:439-462`, `state/parser.ts:192-208`) where upstream fails —
 * every line must match a registered `Command`
 * (`PSystemCommandFactory.java:169-175`). Giving our engines the ability to
 * refuse turns all 3158 corpus fixtures into an assertion that OUR COMMAND
 * TABLES MATCH UPSTREAM'S, and nothing in this repo could measure that. This
 * file is that instrument, built BEFORE the change that needs it (D7,
 * `plans/dispatch-by-parse-attempt/decisions.md`) — built after, it would
 * report a number with nothing to compare it against.
 *
 * THE TWO SIDES OF THE MEASUREMENT.
 *
 *   - `jarRendered` — the JAR's answer, read from the fixture's committed
 *     golden by exactly the classifier the routing gate uses, on exactly the
 *     same evidence (`PSystemError.java:148-155` /`ReportLog.java:103-108`;
 *     see {@link isJarErrorPage}). The jar failing is not evidence about us:
 *     such a fixture is excluded from the defect count, and the exclusion is
 *     checked against the golden's own content in both directions so it can
 *     never go stale.
 *   - `weErrored` — OUR answer, read from our own rendered document by the
 *     same shape of test applied to our own banner. Every page in the
 *     `PSystemError` family opens with `PSystemError#header()`
 *     (`src/core/error/PSystemError.ts:156`), which is one whole `<text>`
 *     element carrying `fullDescription()` — the port of
 *     `Version.java#fullDescription`. The needle is BUILT from that function
 *     rather than spelled out, so a version bump cannot silently stop this
 *     gate from seeing errors.
 *
 * WHAT IS DELIBERATELY *NOT* AN ERROR DIAGRAM, each verified by rendering it:
 *
 *   - the Welcome screen (`PSystemWelcome`), which a source with no
 *     `@start…@end` block draws. It shares the error page's opening welcome
 *     block but carries NO version banner — which is why the banner, not the
 *     welcome text, is the needle.
 *   - `Your data does not sound like JSON data`. Upstream renders that inside
 *     the JSON diagram itself (`JsonDiagram.java:118`), not through
 *     `PSystemError`; so does this port. It is a rendered diagram on both
 *     sides and must keep counting as one (D6 leaves the
 *     `PSystemAbstractFactory` family's own error semantics untouched).
 *
 * THE GATE RATCHETS DOWN ONLY, mirroring its sibling.
 *
 *   - a fixture pinned as rendering that now errors, on a source the jar
 *     rendered -> FAIL, with the per-engine table so a reader sees WHICH
 *     command table moved without re-running anything.
 *   - a fixture pinned as erroring that now renders -> PASS, logged `[FIXED]`.
 *     Falls are batches 4-6's entire point and must never fail.
 *   - a fixture that newly errors where the JAR ALSO errored -> PASS, logged
 *     `[MATCHED]`. The gated quantity is `we error AND the jar rendered`; us
 *     joining the jar in failing is not a defect.
 *   - a fixture on disk that is in no baseline entry -> FAIL. An un-measured
 *     corpus is exactly how the original 86 misroutes survived.
 *
 * THE INCLUDE STORE IS PART OF THE MEASUREMENT. Without one `renderSync`
 * throws on any `!include` (`src/index.ts:213`) and returns an error page — so
 * a RESOLUTION failure would read as a refusal, and this gate's whole subject
 * is refusals. The shared `tests/helpers/fixture-include-store.ts` is the same
 * store the sibling gate and every fixture harness uses.
 *
 * THE BASELINE IS 1, NOT 0 — and that is a finding, not a pin.
 * `dot-cache sequence/nuvoja-46-dezu541` is `!includedef macro`, which this
 * port stops on in the PREPROCESSOR (`IncludeExecutor.ts:127`), long before
 * any engine sees a line. It is the routing gate's second standing
 * known-misroute and is named out of scope by this mission's stop condition 10.
 * It is pinned `weErrored: true, status: "ok"` — an honest record of today's
 * behaviour, NOT a `known-gap` excuse, because nothing has gapped yet: no
 * engine can refuse anything at the moment this baseline was taken.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/refusal-coverage.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fullDescription } from '../../../src/core/version.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

/** Which committed tree a fixture lives in. Decides the golden's filename and
 *  the root the `slug` is relative to — nothing else. */
type Tree = 'dot-cache' | 'goldens';

interface BaselineFixture {
  readonly tree: Tree;
  /** Top-level directory under the tree root. NOT authoritative — the corpus
   *  populator over-selects, so a directory name builds a path and does
   *  nothing else (routing gate D6). */
  readonly type: string;
  /** Path from `<tree root>/<type>/` to the fixture directory. */
  readonly slug: string;
  /** True iff the fixture's golden is NOT one of the jar's own error pages.
   *  Derived from the golden, and checked against it in both directions. */
  readonly jarRendered: boolean;
  /** True iff OUR render of the same source is a `PSystemError` page. */
  readonly weErrored: boolean;
  /** WHICH engine owns the answer, so a coverage task (T13-T20) can filter to
   *  its own bucket without re-running the corpus. When we errored it is the
   *  `(Assumed diagram type: X)` the error page itself prints
   *  (`ErrorUml.java#getError`); otherwise our root `data-diagram-type`
   *  lower-cased, or `none` when the engine stamps none. INFORMATIONAL: this
   *  gate never asserts on it, because which engine drew is the sibling
   *  routing gate's subject and failing here for a routing move would name the
   *  same defect twice. */
  readonly engine: string;
  /** `known-gap` excuses a fixture from the defect count. Reserved for batches
   *  4-6, each pin carrying the unported `Command` that explains it. Nothing
   *  is pinned `known-gap` at baseline. */
  readonly status: 'ok' | 'known-gap';
  /** Required on a `known-gap` pin: the unported `Command` that explains the
   *  refusal, with its upstream `file:line`. D7's bar for excusing one. */
  readonly reason?: string;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
}

interface BaselineManifest {
  readonly fixtures: readonly BaselineFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../../..');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-conformance/refusal-baseline.json');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache');
const GOLDENS_ROOT = join(REPO, 'oracle/goldens');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;

/** Read only the head of a GOLDEN: the evidence both classifiers below need is
 *  in the first element, and `sequence/zudize-61-vomi445`'s golden is 8.26 MB.
 *  OUR OWN output is never truncated — see {@link weErroredIn}. */
const HEAD_BYTES = 4096;

/**
 * Upstream's two graphical error pages, keyed on the text PlantUML itself
 * writes into them — the identical classifier `routing-conformance.test.ts`
 * carries, on the identical evidence:
 *
 *   1. `PSystemError#header()` (`PSystemError.java:148-155`) opens EVERY
 *      graphical error page with `Version.fullDescription()`
 *      (`Version.java:51-54`).
 *   2. The crash page prepends `ReportLog#anErrorHasOccurred`
 *      (`ReportLog.java:103-108`), whose first line is
 *      `"An error has occurred : " + exception`.
 *
 * Both markers are anchored at BOTH ends, so a label merely MENTIONING the
 * phrase leaves other characters inside the element and does not fire.
 * Measured over all 3158 committed goldens: 8 fire, 3150 do not.
 *
 * It is duplicated rather than imported because the sibling is a `.test.ts`:
 * importing it would execute its module body and register its ~3158-fixture
 * measurement a second time inside this file's suite. Extracting it into a
 * shared module is outside T0's write-set.
 */
const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;

export function isJarErrorPage(head: string): boolean {
  return JAR_ERROR_PAGE_RE.test(head);
}

/**
 * OUR error banner, as one whole `<text>` element. Built from
 * `fullDescription()` itself, never spelled out, so this gate cannot be
 * silently blinded by a version bump.
 * @see ~/git/plantuml/.../version/Version.java#fullDescription
 */
const OUR_ERROR_BANNER = `>${fullDescription()}</text>`;

/**
 * Deliberately scans the WHOLE document, not a head window. The banner's
 * offset is not fixed: `PSystemError#getGraphicalFormatted` prepends the
 * welcome block only for a short source, measured at byte 4544 for a
 * two-line source and byte 2459 for a 200-line one — a 4 KB window would
 * miss the first and see the second, which is the worst possible failure for
 * a gate whose subject is "did we error at all".
 */
export function weErroredIn(ours: string): boolean {
  return ours.includes(OUR_ERROR_BANNER);
}

/** `ErrorUml#getError`'s suffix, printed only once a parser has committed to a
 *  diagram type. Absent on a crash, which is what `unknown` records.
 *  @see ~/git/plantuml/.../ErrorUml.java#getError */
const ASSUMED_TYPE_RE = /\(Assumed diagram type: ([^)<]+)\)/;
/** `TextBlockExporter.java:292-294`'s root attribute. */
const DIAGRAM_TYPE_RE = /data-diagram-type="([A-Z]+)"/;

export function engineOf(ours: string, errored: boolean): string {
  if (errored) return ASSUMED_TYPE_RE.exec(ours)?.[1] ?? 'unknown';
  return DIAGRAM_TYPE_RE.exec(ours.slice(0, HEAD_BYTES))?.[1]?.toLowerCase() ?? 'none';
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
  return join(f.tree === 'dot-cache' ? CACHE_ROOT : GOLDENS_ROOT, f.type, f.slug);
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
 *  `svg-skin/rose/<slug>/` nest one level deeper. */
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

interface LiveRefusal {
  readonly jarRendered: boolean;
  readonly weErrored: boolean;
  readonly engine: string;
}

/** Renders ONE fixture the way production does. `DeterministicMeasurer` is
 *  passed for the reason every sibling harness passes it, plus one specific to
 *  a refusal gate: under vitest's jsdom environment the production
 *  `CanvasMeasurer` hits an unimplemented `getContext`, and the resulting
 *  layout failure IS an error page — putting a fabricated refusal inside the
 *  measurement. */
function measure(f: FixtureRef, store: ReturnType<typeof fixtureIncludeStore>): LiveRefusal {
  const markup = readFileSync(join(fixtureDir(f), 'in.puml'), 'utf8');
  const ours = renderSync(markup, {
    includeStore: store,
    measurer: new DeterministicMeasurer(),
  });
  const weErrored = weErroredIn(ours);
  return {
    jarRendered: !isJarErrorPage(readHead(goldenPath(f))),
    weErrored,
    engine: engineOf(ours, weErrored),
  };
}

let measured: Map<string, LiveRefusal> | undefined;

/** Memoised whole-corpus measurement. Every assertion below reads this map;
 *  the warm-up `it()` at the top of the first `describe` pays for it once and
 *  carries the only budget. */
function live(): Map<string, LiveRefusal> {
  if (measured !== undefined) return measured;
  const store = fixtureIncludeStore();
  measured = new Map(collectFixtures().map((f) => [keyOf(f), measure(f, store)]));
  return measured;
}

// ---------------------------------------------------------------------------
// Pure gate logic -- extracted so every branch is exercisable with fabricated
// inputs, without ever touching refusal-baseline.json on disk.
// ---------------------------------------------------------------------------

interface CheckResult {
  readonly ok: boolean;
  readonly message: string;
}

/** SLI 2's quantity: WE errored and the JAR rendered. A `known-gap` pin
 *  excuses a fixture only once someone has written the unported `Command`
 *  that explains it (D7). */
export function isDefect(now: LiveRefusal, status: BaselineFixture['status']): boolean {
  return now.weErrored && now.jarRendered && status === 'ok';
}

/**
 * A fixture that renders today must keep rendering — unless the jar errors on
 * it too, in which case us erroring is agreement rather than a defect.
 */
export function checkNoNewRefusal(f: BaselineFixture, now: LiveRefusal | undefined): CheckResult {
  const at = `${f.tree} ${f.type}/${f.slug}`;
  if (now === undefined) {
    return {
      ok: false,
      message:
        `${at}: pinned in refusal-baseline.json but ABSENT from the live corpus walk. ` +
        `Both trees are committed, so a missing fixture means a broken or partial ` +
        `checkout — restore the tree rather than pruning the baseline to match it.`,
    };
  }
  if (f.weErrored || !isDefect(now, f.status))
    return { ok: true, message: `${at}: no new refusal (engine ${now.engine}).` };
  return {
    ok: false,
    message:
      `${at}: NEWLY REFUSED by the ${now.engine} engine, on a source the jar RENDERED. It ` +
      `rendered when the baseline was pinned (${f.measuredAt}, ${f.measuredAgainstCommit}). ` +
      `Per D7 this is a DEFECT, not baseline movement: our command table is missing a ` +
      `Command the jar has. Find it in the Java (PSystemCommandFactory.java:169-175 lists ` +
      `how a line is matched) and port it. Do NOT relax the refusal to make this pass — ` +
      `refusing a line the jar accepts is this mission's defining failure mode and it ` +
      `looks exactly like progress (stop condition 3).`,
  };
}

/** Progress classification. `undefined` when nothing about this fixture moved. */
export function progressNote(f: BaselineFixture, now: LiveRefusal): string | undefined {
  const at = `${f.tree} ${f.type}/${f.slug}`;
  if (f.weErrored && !now.weErrored) {
    return (
      `[FIXED] ${at} now RENDERS where it used to error. Its pin is STALE: re-pin ` +
      `weErrored: false in oracle/goldens/svg-conformance/refusal-baseline.json from a ` +
      `fresh measurement. A fall never fails this gate.`
    );
  }
  if (!f.weErrored && now.weErrored && !now.jarRendered) {
    return (
      `[MATCHED] ${at} now errors, and so does the jar — its golden is an upstream error ` +
      `page. Not a defect: the gated quantity is "we error AND the jar rendered".`
    );
  }
  if (f.weErrored && now.weErrored && now.engine !== f.engine) {
    return (
      `[CHANGED] ${at} still errors, but the error is now owned by ${now.engine} rather ` +
      `than ${f.engine}. Not a regression — engine is informational here.`
    );
  }
  return undefined;
}

/**
 * The pin must agree with what the GOLDEN says, in both directions. A jar
 * upgrade that stops crashing is a real change to the oracle; letting it pass
 * silently would leave a fixture permanently excused from the defect count for
 * a reason that has ceased to hold. The converse pin would floor SLI 2 above
 * zero for a reason no command-table work can move.
 */
export function checkJarClassification(
  f: BaselineFixture,
  now: LiveRefusal | undefined,
): CheckResult {
  const at = `${f.tree} ${f.type}/${f.slug}`;
  if (now === undefined) return { ok: true, message: `${at}: absent; owned by the walk gate.` };
  if (f.jarRendered === now.jarRendered)
    return { ok: true, message: `${at}: classification matches its golden.` };
  return {
    ok: false,
    message:
      `${at}: pinned jarRendered: ${String(f.jarRendered)}, but its golden now says ` +
      `${String(now.jarRendered)} (PSystemError.java:148-155 / ReportLog.java:103-108). The ` +
      `classification comes from the golden, never from the pin — re-measure and re-pin.`,
  };
}

/** The per-engine table, so a failure names the command table that moved
 *  rather than only the fixture. */
export function engineTable(rows: readonly LiveRefusal[]): string {
  const buckets = new Map<string, number>();
  for (const r of rows) buckets.set(r.engine, (buckets.get(r.engine) ?? 0) + 1);
  const lines = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, n]) => `    ${k}: ${n}`);
  return [`  refusing engine (${rows.length} erroring):`, ...lines].join('\n');
}

const pinnedRendering = manifest.fixtures.filter((f) => !f.weErrored);
const pinnedErroring = manifest.fixtures.filter((f) => f.weErrored);
/** Excluded from SLI 2 by construction, and watched by the classification gate
 *  below so the exclusion cannot go stale. */
const pinnedJarErrors = manifest.fixtures.filter((f) => !f.jarRendered);

// ---------------------------------------------------------------------------
// AC3 -- warm-up + corpus completeness in BOTH directions. Runs first, so it
// owns the whole-corpus measurement cost and the only per-test budget.
// ---------------------------------------------------------------------------

/** Transferred from the sibling routing gate's in-situ derivation rather than
 *  re-derived, because the per-fixture work is the same work: render the
 *  fixture, read the golden's head. That note measured **15,492 ms** under a
 *  full `npm test` (v8 coverage on, 12 vitest forks on 12 cores) and applied
 *  the 2.70x fork-contention step from `.agent-notes/ratchet-zudize-timeout.md`
 *  to reach a ~41,800 ms ceiling; 120,000 ms is ~2.9x that, wide because the
 *  contended worker also runs the rest of its shard.
 *
 *  Corroborated here, not assumed: this gate measures **7,304 ms** solo
 *  (jiti, no coverage, 2026-08-24) against the sibling's 6,000 ms under the
 *  same conditions. The ~1.3 s delta is the full-document banner scan
 *  {@link weErroredIn} deliberately does not truncate. Same order, same
 *  ceiling; a hang still surfaces in two minutes, inside CI's 12-minute cap. */
const CORPUS_BUDGET_MS = 120_000;

describe('refusal coverage — corpus completeness', () => {
  it(
    'every fixture on disk is pinned, and every pin is on disk',
    () => {
      const seen = live();
      expect(manifest.fixtures.length, 'the baseline must not be empty').toBeGreaterThan(0);

      const pinnedKeys = new Set(manifest.fixtures.map(keyOf));
      const unpinned = [...seen.keys()].filter((k) => !pinnedKeys.has(k));
      expect(
        unpinned.slice(0, 10),
        `${unpinned.length} fixture(s) exist on disk with NO refusal-baseline.json entry. ` +
          `An un-measured fixture cannot be a defect, which is exactly how a missing Command ` +
          `would hide. Measure and pin them — do not narrow the walk.`,
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
// AC1 -- no fixture that renders today may error at run time. Aggregate, not
// per-fixture: only an aggregate can carry the engine table, and 3152 `it()`
// blocks would cost more in runner overhead than the measurement they wrap.
// ---------------------------------------------------------------------------

describe('refusal coverage — no fixture newly errors', () => {
  it('every fixture pinned as rendering still renders', () => {
    const seen = live();
    const broken = pinnedRendering
      .map((f) => ({ f, result: checkNoNewRefusal(f, seen.get(keyOf(f))) }))
      .filter(({ result }) => !result.ok);

    const moved = broken
      .map(({ f }) => seen.get(keyOf(f)))
      .filter((r): r is LiveRefusal => r !== undefined);
    const detail =
      broken.length === 0
        ? ''
        : `\n${broken.map(({ result }) => `  - ${result.message}`).join('\n')}\n${engineTable(moved)}`;

    expect(
      broken.length,
      `${broken.length} of ${pinnedRendering.length} previously-rendering fixtures NEWLY ` +
        `ERROR on sources the jar rendered. Per D7 each is a missing Command, not baseline ` +
        `movement.${detail}`,
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AC5 -- a pinned refusal that improves must PASS, loudly. Batches 4-6 exist
// to make these fall, so a fall must never be able to fail.
// ---------------------------------------------------------------------------

describe('refusal coverage — pinned refusals', () => {
  for (const f of pinnedErroring) {
    it(`${f.tree} ${f.type}/${f.slug}: errors under ${f.engine}`, () => {
      const now = live().get(keyOf(f));
      expect(now, `${keyOf(f)}: pinned but absent from the live walk`).toBeDefined();
      const note = progressNote(f, now!);
      if (note !== undefined) console.log(note);
      expect(checkNoNewRefusal(f, now).ok).toBe(true);
    });
  }

  it('reports the standing SLI 2 count and its engine table', () => {
    const seen = live();
    const defects = manifest.fixtures
      .map((f) => ({ f, now: seen.get(keyOf(f)) }))
      .filter((r): r is { f: BaselineFixture; now: LiveRefusal } => r.now !== undefined)
      .filter(({ f, now }) => isDefect(now, f.status));
    console.log(
      `[REFUSAL SLI] ${defects.length} fixture(s) error here on a source the jar RENDERED ` +
        `(target 0, or a mechanism per residual — D7). ${pinnedJarErrors.length} further ` +
        `fixtures are excluded because the jar itself produced an error page, so its ` +
        `failure is no evidence about us.\n${engineTable(defects.map((d) => d.now))}\n` +
        defects.map((d) => `    ${keyOf(d.f)}`).join('\n'),
    );
    expect(defects.length).toBeLessThanOrEqual(
      manifest.fixtures.filter((f) => f.weErrored && f.jarRendered && f.status === 'ok').length,
    );
  });
});

// ---------------------------------------------------------------------------
// AC2 + AC4 -- the jar-error split, derived from the goldens and checked
// against the pins in BOTH directions, plus the pinned baseline itself.
// ---------------------------------------------------------------------------

describe('refusal coverage — baseline shape', () => {
  it('every pin matches what its own golden says about the jar erroring', () => {
    const seen = live();
    const wrong = manifest.fixtures
      .map((f) => checkJarClassification(f, seen.get(keyOf(f))))
      .filter((r) => !r.ok);
    expect(
      wrong.map((r) => r.message),
      `${wrong.length} fixture(s) are pinned inconsistently with their golden's own content.`,
    ).toEqual([]);
  });

  it('the manifest is 3158 fixtures, 8 of them jar errors, 104 of them erroring here', () => {
    // The 8 jar-error fixtures are the same 8 the routing gate pins. The 104
    // we error on are 5 of those 8, plus nuvoja, plus the 98 pinned
    // known-gap below — the 10 exo-arrow fixtures T13 found, then batch 4's
    // full sequence residual censused 2026-08-25. It was 6 erroring / 3152
    // rendering when T0 took the baseline, before any engine could refuse
    // anything at all.
    //
    // 169 -> 104 at `sequence-command-coverage` batch 3, which ported the
    // note factory, grouping/autonumber/lifeline, misc and sprite command
    // families and rebuilt CommandArrow compositionally.
    expect(manifest.fixtures.length).toBe(3158);
    expect(pinnedJarErrors.length).toBe(8);
    expect(pinnedErroring.length).toBe(104);
    expect(pinnedRendering.length).toBe(3054);
  });

  it('every known-gap pin names the unported Command that explains it', () => {
    // T0 asserted NOTHING was pinned known-gap, because at that commit no
    // engine could refuse anything. That is no longer the world. What must
    // hold now is D7's actual bar: a known-gap excuses a refusal ONLY when a
    // specific missing Command is named, so the excuse cannot become a
    // dumping ground.
    const gaps = manifest.fixtures.filter((f) => f.status === 'known-gap');
    // 10 at T13 (the exo-arrow family alone), then 163 once batch 4's whole
    // sequence residual was censused: every one carries the refusing LINE and
    // the upstream Command that explains it, which is what keeps a growing
    // count from becoming the dumping ground D7 warns about. The number is
    // pinned exactly so growth stays deliberate.
    //
    // 163 -> 98 at `sequence-command-coverage` batch 3. That net figure hides
    // two opposite movements, and both are real:
    //
    //  - 86 of the original 163 closed outright.
    //  - 21 fixtures BECAME known-gap that were not one before. They were
    //    misrouted to another engine which rendered them without erroring, so
    //    `weErrored` was legitimately false. Batch 3 fixed their routing, so
    //    they now reach the sequence engine and honestly refuse on a command
    //    it does not yet port. That is an improvement — a wrong diagram
    //    silently produced is worse than an honest refusal — but it is only
    //    visible as a known-gap once the routing is right.
    //
    // `nuvoja-46-dezu541` deliberately stays OUT of this set: its defect is a
    // fixture-include-store gap (`!includedef macro`), not an unported
    // Command, so it remains the single non-gapped defect SLI 2 reports.
    expect(gaps.length).toBe(98);
    for (const g of gaps) {
      // The bar is a specific upstream ORIGIN, cited as `File.java:line`.
      //
      // This asserted `/Command\w+/`, which was too narrow twice over.
      // Upstream names commands both ways — `CommandArrow`, and the
      // factory-built `FactorySequenceNoteCommand` where `Command` is the
      // suffix — and some refusals are not command gaps at all:
      // `EmbeddedDiagram`'s `{{`/`}}`, `ReadLineWithYamlHeader`'s `---`
      // block, and the `%newline()` builtin are PREPROCESSOR and
      // embedded-diagram mechanisms. Demanding the citation instead of the
      // word keeps D7's real bar (a named, locatable mechanism) while
      // admitting the gaps that are honestly not Commands.
      expect(g.reason ?? '', `${keyOf(g)} must cite its upstream origin`).toMatch(
        /\w+\.java:\d+/,
      );
      expect(g.weErrored, `${keyOf(g)} is pinned known-gap but not erroring`).toBe(true);
    }
  });

  it('the only non-gapped defect is nuvoja', () => {
    const defects = manifest.fixtures.filter(
      (f) => f.weErrored && f.jarRendered && f.status === 'ok',
    );
    expect(defects.map(keyOf)).toEqual(['dot-cache:sequence/nuvoja-46-dezu541']);
  });
});

// ---------------------------------------------------------------------------
// Branch discrimination. In-memory only: fabricated fixtures and fabricated
// live readings, never a baseline edit. A branch nobody has seen fire is not
// a gate.
// ---------------------------------------------------------------------------

const SAMPLE: BaselineFixture = {
  tree: 'dot-cache',
  type: 'sequence',
  slug: 'branch-probe',
  jarRendered: true,
  weErrored: false,
  engine: 'sequence',
  status: 'ok',
  measuredAt: '2026-08-24',
  measuredAgainstCommit: '1aec6731',
};

const RENDERS: LiveRefusal = { jarRendered: true, weErrored: false, engine: 'sequence' };
const REFUSES: LiveRefusal = { jarRendered: true, weErrored: true, engine: 'class' };

describe('refusal coverage — branch discrimination', () => {
  it('a fixture that still renders passes', () => {
    expect(checkNoNewRefusal(SAMPLE, RENDERS).ok).toBe(true);
  });

  it('a newly-erroring fixture fails, naming the slug and the refusing engine', () => {
    const { ok, message } = checkNoNewRefusal(SAMPLE, REFUSES);
    expect(ok).toBe(false);
    expect(message).toContain('branch-probe');
    expect(message).toContain('NEWLY REFUSED');
    expect(message).toContain('class');
  });

  it('a newly-erroring fixture whose JAR also errors is not a defect', () => {
    expect(checkNoNewRefusal(SAMPLE, { ...REFUSES, jarRendered: false }).ok).toBe(true);
    expect(isDefect({ ...REFUSES, jarRendered: false }, 'ok')).toBe(false);
  });

  it('a known-gap pin excuses a refusal from the defect count', () => {
    expect(isDefect(REFUSES, 'known-gap')).toBe(false);
    expect(checkNoNewRefusal({ ...SAMPLE, status: 'known-gap' }, REFUSES).ok).toBe(true);
  });

  it('a pinned fixture missing from the live walk fails rather than passing vacuously', () => {
    const { ok, message } = checkNoNewRefusal(SAMPLE, undefined);
    expect(ok).toBe(false);
    expect(message).toContain('ABSENT');
  });

  it('a fall to rendering is reported [FIXED] and never fails', () => {
    const pinned: BaselineFixture = { ...SAMPLE, weErrored: true, engine: 'class' };
    const note = progressNote(pinned, RENDERS);
    expect(note).toContain('[FIXED]');
    expect(note).toContain('STALE');
    expect(checkNoNewRefusal(pinned, RENDERS).ok).toBe(true);
  });

  it('joining the jar in erroring is [MATCHED], not a regression', () => {
    const note = progressNote(SAMPLE, { ...REFUSES, jarRendered: false });
    expect(note).toContain('[MATCHED]');
  });

  it('a refusal that moves to a different engine is [CHANGED]', () => {
    const pinned: BaselineFixture = { ...SAMPLE, weErrored: true, engine: 'sequence' };
    const note = progressNote(pinned, REFUSES);
    expect(note).toContain('[CHANGED]');
    expect(note).not.toContain('[FIXED]');
  });

  it('a fixture that has not moved is reported as neither', () => {
    const pinned: BaselineFixture = { ...SAMPLE, weErrored: true, engine: 'class' };
    expect(progressNote(pinned, REFUSES)).toBeUndefined();
  });

  it('the engine table counts each refusing engine, ordered by size', () => {
    const table = engineTable([
      { jarRendered: true, weErrored: true, engine: 'class' },
      { jarRendered: true, weErrored: true, engine: 'class' },
      { jarRendered: true, weErrored: true, engine: 'state' },
    ]);
    expect(table).toContain('class: 2');
    expect(table).toContain('state: 1');
    expect(table.indexOf('class:')).toBeLessThan(table.indexOf('state:'));
    expect(table).toContain('3 erroring');
  });

  it('a jarRendered pin that disagrees with its golden fails, so a jar fix is never silent', () => {
    const { ok, message } = checkJarClassification(SAMPLE, {
      ...RENDERS,
      jarRendered: false,
    });
    expect(ok).toBe(false);
    expect(message).toContain('branch-probe');
    expect(message).toContain('re-measure and re-pin');
  });

  it('a jar-error pin whose golden stopped erroring fails too', () => {
    expect(checkJarClassification({ ...SAMPLE, jarRendered: false }, RENDERS).ok).toBe(false);
  });

  it('an absent fixture is left to the completeness gate rather than failed twice', () => {
    expect(checkJarClassification(SAMPLE, undefined).ok).toBe(true);
  });

  it('recognises OUR error banner as a whole text element, and nothing else', () => {
    expect(weErroredIn(`<svg><text x="5">${fullDescription()}</text></svg>`)).toBe(true);
    // The Welcome screen shares the error page's opening block but carries no
    // banner -- which is why the banner is the needle.
    expect(weErroredIn('<svg><text x="5">Welcome to PlantUML!</text></svg>')).toBe(false);
    // Upstream renders this INSIDE the JSON diagram (JsonDiagram.java:118).
    expect(weErroredIn('<svg><text>Your data does not sound like JSON data</text></svg>')).toBe(
      false,
    );
  });

  it('recognises the JAR banner and crash page, whole text element only', () => {
    expect(
      isJarErrorPage(
        '<text x="5" y="17">PlantUML version $version$ / $git.commit.id$ [Unknown compile time]</text>',
      ),
    ).toBe(true);
    expect(isJarErrorPage('<text x="5" y="14">An error has occurred : java.lang.NPE</text>')).toBe(
      true,
    );
    expect(isJarErrorPage('<text x="5">Upgrade to PlantUML version 1.2024 [wiki] now</text>')).toBe(
      false,
    );
    expect(isJarErrorPage('<svg width="10"><text x="5">Alice</text>')).toBe(false);
  });

  it('names the engine from the assumed type when we errored, the root attribute otherwise', () => {
    expect(engineOf('<text>Empty description (Assumed diagram type: sequence)</text>', true)).toBe(
      'sequence',
    );
    expect(engineOf('<text>Fatal crash</text>', true)).toBe('unknown');
    expect(engineOf('<svg data-diagram-type="CLASS" width="10">', false)).toBe('class');
    expect(engineOf('<svg width="10">', false)).toBe('none');
  });
});
