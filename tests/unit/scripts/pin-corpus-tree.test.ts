/**
 * Unit tests for `scripts/pin-corpus-tree.ts` (mission
 * unknown-bucket-routing-repair, T0).
 *
 * The 4-fixture temp tree below is rendered through the REAL `src/index.js`
 * `renderSync` -- `scripts/pin-corpus-tree-measure.ts`'s header explains why
 * this tool duplicates rather than imports the gates' own classifiers -- so
 * each `in.puml` is chosen for a KNOWN, manually-verified measured outcome,
 * never a mocked one:
 *
 *   - `agree-class`: `class A` renders `data-diagram-type="CLASS"` here; its
 *     golden is pinned `CLASS` too. Routing agrees, refusal is `ok`.
 *   - `jar-error-page`: same real CLASS render; the GOLDEN ALONE carries the
 *     jar's own error banner (`PSystemError#header()`'s shape), so
 *     `jarErrored` is true regardless of `ourType` -- routing and refusal
 *     both land in the `jar-error` cohort.
 *   - `misroute-sequence`: a real SEQUENCE render (`Alice -> Bob`, verified
 *     to produce `data-diagram-type="SEQUENCE"`) against a golden pinned
 *     `CLASS` -- a genuine type mismatch, not a fabricated status.
 *   - `refusal-includedef`: `!includedef macro` with no macro ever defined
 *     is this port's one real, reproducible parse-time refusal (verified to
 *     emit our `PSystemError` banner) -- the same mechanism
 *     `refusal-coverage.test.ts`'s header names as dot-cache
 *     `sequence/nuvoja-46-dezu541`'s pin. Its golden carries neither a
 *     `data-diagram-type` attribute nor the jar's error banner (`NONE`,
 *     `jarRendered: true`), and our own error page likewise stamps no root
 *     attribute, so `jarType === ourType === "NONE"`: routing agrees and
 *     only the refusal side needs an excuse -- isolating the refusal defect
 *     from the routing one on purpose, so AC1's four cohorts stay distinct.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  deriveRow,
  checkAdditive,
  computeTally,
  loadLedger,
  parseArgs,
  runPinCorpusTree,
  type LedgerRow,
  type PinOptions,
} from '../../../scripts/pin-corpus-tree.js';
import type { MeasuredFixture } from '../../../scripts/pin-corpus-tree-measure.js';

interface RowLike {
  readonly slug: string;
  readonly status: string;
  readonly jarType?: string;
  readonly ourType?: string;
  readonly jarErrored?: boolean;
  readonly reason?: string;
  readonly weErrored?: boolean;
  readonly jarRendered?: boolean;
}

interface BaselineFileLike {
  readonly $comment: string;
  readonly fixtures: readonly RowLike[];
}

function findRow(rows: readonly RowLike[], slug: string): RowLike {
  const row = rows.find((r) => r.slug === slug);
  if (row === undefined) throw new Error(`no row for "${slug}" in test fixture`);
  return row;
}

const CLASS_PUML = '@startuml\nclass A\n@enduml\n';
const SEQ_PUML = '@startuml\nAlice -> Bob : hi\n@enduml\n';
const REFUSE_PUML = '@startuml\n!includedef macro\nAlice -> Bob : hello2\n@enduml\n';

const GOLDEN_CLASS = '<svg data-diagram-type="CLASS"></svg>';
const GOLDEN_JAR_ERROR = '<svg><text>PlantUML version 1.2026.0 / abcdef [Sun Jan 01 2026]</text></svg>';
const GOLDEN_NONE = '<svg><text>hello</text></svg>';

const TODAY = '2026-09-20';
const COMMIT = 'abcd1234';

const EXISTING_ROUTING: BaselineFileLike = {
  $comment: 'test routing baseline.',
  fixtures: [
    {
      slug: 'existing-1',
      status: 'agree',
      jarType: 'CLASS',
      ourType: 'CLASS',
    },
  ],
};

const EXISTING_REFUSAL: BaselineFileLike = {
  $comment: 'test refusal baseline.',
  fixtures: [
    {
      slug: 'existing-1',
      status: 'ok',
      jarRendered: true,
      weErrored: false,
    },
  ],
};

let tmp: string;
let treeDir: string;
let ledgerDir: string;

function writeFixture(dir: string, slug: string, puml: string, golden: string): void {
  const fdir = join(dir, slug);
  mkdirSync(fdir, { recursive: true });
  writeFileSync(join(fdir, 'in.puml'), puml, 'utf8');
  writeFileSync(join(fdir, 'in.svg'), golden, 'utf8');
}

function writeLedgerFragment(dir: string, rows: readonly LedgerRow[]): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'fragment.json'), JSON.stringify({ rows }, null, 2), 'utf8');
}

/** Fresh, isolated copies of the two baselines for one test -- never shared
 *  across tests, since several of them write to their baseline paths and a
 *  shared path would let one test's write pollute another's "unchanged"
 *  assertion. */
function freshBaselinePaths(label: string): { routingBaselinePath: string; refusalBaselinePath: string } {
  const dir = join(tmp, `baselines-${label}`);
  mkdirSync(dir, { recursive: true });
  const routingBaselinePath = join(dir, 'routing-baseline.json');
  const refusalBaselinePath = join(dir, 'refusal-baseline.json');
  writeFileSync(routingBaselinePath, JSON.stringify(EXISTING_ROUTING, null, 2) + '\n', 'utf8');
  writeFileSync(refusalBaselinePath, JSON.stringify(EXISTING_REFUSAL, null, 2) + '\n', 'utf8');
  return { routingBaselinePath, refusalBaselinePath };
}

function baseOpts(overrides: Partial<PinOptions> & Pick<PinOptions, 'routingBaselinePath' | 'refusalBaselinePath'>): PinOptions {
  return {
    type: 'unknown-test',
    treeDir,
    ledgerDir,
    dry: true,
    today: TODAY,
    commit: COMMIT,
    ...overrides,
  };
}

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'pin-corpus-tree-'));
  treeDir = join(tmp, 'tree');
  ledgerDir = join(tmp, 'ledger');

  writeFixture(treeDir, 'agree-class', CLASS_PUML, GOLDEN_CLASS);
  writeFixture(treeDir, 'jar-error-page', CLASS_PUML, GOLDEN_JAR_ERROR);
  writeFixture(treeDir, 'misroute-sequence', SEQ_PUML, GOLDEN_CLASS);
  writeFixture(treeDir, 'refusal-includedef', REFUSE_PUML, GOLDEN_NONE);

  writeLedgerFragment(ledgerDir, [
    {
      slug: 'misroute-sequence',
      cohort: 'seq-misroute',
      disposition: 'known-misroute',
      reason: 'CommandFoo.java:12 fake reason for the misroute fixture',
      task: 'T0',
    },
    {
      slug: 'refusal-includedef',
      cohort: 'includedef-gap',
      disposition: 'known-gap',
      reason: 'CommandIncludeDef.java:99 fake reason for the refusal fixture',
      task: 'T0',
    },
  ]);
});

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// deriveRow -- pure, no filesystem
// ---------------------------------------------------------------------------

describe('deriveRow', () => {
  const agreeFixture: MeasuredFixture = {
    slug: 's',
    jarType: 'CLASS',
    ourType: 'CLASS',
    jarErrored: false,
    jarRendered: true,
    weErrored: false,
    engine: 'class',
  };

  it('agrees and is ok when both sides land on the same type and neither errors', () => {
    const d = deriveRow(agreeFixture, undefined);
    expect(d.routing).toEqual({ status: 'agree', needsReason: false });
    expect(d.refusal).toEqual({ status: 'ok', cohort: 'ok', needsReason: false });
  });

  it('routing is jar-error whenever the golden itself is an error page, regardless of ourType', () => {
    const f: MeasuredFixture = { ...agreeFixture, jarType: 'NONE', ourType: 'CLASS', jarErrored: true };
    expect(deriveRow(f, undefined).routing).toEqual({ status: 'jar-error', needsReason: false });
  });

  it('refusal is the jar-error cohort whenever jarRendered is false, regardless of weErrored', () => {
    const f: MeasuredFixture = { ...agreeFixture, jarRendered: false, weErrored: true };
    expect(deriveRow(f, undefined).refusal).toEqual({ status: 'ok', cohort: 'jar-error', needsReason: false });
  });

  it('a single ledger reason covers BOTH a misroute and a refusal defect for the same slug', () => {
    const f: MeasuredFixture = {
      slug: 's',
      jarType: 'CLASS',
      ourType: 'SEQUENCE',
      jarErrored: false,
      jarRendered: true,
      weErrored: true,
      engine: 'unknown',
    };
    const ledgerRow: LedgerRow = { slug: 's', cohort: 'c', disposition: 'known-misroute', reason: 'Foo.java:1 x', task: 'T0' };
    const d = deriveRow(f, ledgerRow);
    expect(d.routing).toEqual({ status: 'known-misroute', needsReason: true, reason: 'Foo.java:1 x' });
    expect(d.refusal).toEqual({ status: 'known-gap', cohort: 'known-gap', needsReason: true, reason: 'Foo.java:1 x' });
  });

  it('a stale "fixed" ledger row is not consulted for a reason when the measurement still disagrees', () => {
    const f: MeasuredFixture = {
      slug: 's',
      jarType: 'CLASS',
      ourType: 'SEQUENCE',
      jarErrored: false,
      jarRendered: true,
      weErrored: false,
      engine: 'sequence',
    };
    const ledgerRow: LedgerRow = { slug: 's', cohort: 'c', disposition: 'fixed', reason: 'Foo.java:1 x', task: 'T0' };
    expect(deriveRow(f, ledgerRow).routing).toEqual({ status: 'known-misroute', needsReason: true });
  });
});

// ---------------------------------------------------------------------------
// checkAdditive -- AC4
// ---------------------------------------------------------------------------

describe('checkAdditive', () => {
  const before = [
    { slug: 'a', v: 1 },
    { slug: 'b', v: 2 },
  ];

  it('accepts a strict additive extension', () => {
    expect(checkAdditive(before, [...before, { slug: 'c', v: 3 }])).toEqual({ ok: true });
  });

  it('refuses when a pre-existing row changed (AC4)', () => {
    const after = [{ slug: 'a', v: 999 }, before[1], { slug: 'c', v: 3 }];
    const result = checkAdditive(before, after);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('row 0');
  });

  it('refuses when the baseline would shrink', () => {
    const result = checkAdditive(before, [before[0]!]);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeTally -- pure, fabricated inputs
// ---------------------------------------------------------------------------

describe('computeTally', () => {
  it('buckets by ledger cohort x routing status x refusal cohort, counting a blocked defect as unpinned', () => {
    const measured: MeasuredFixture[] = [
      { slug: 'a', jarType: 'CLASS', ourType: 'CLASS', jarErrored: false, jarRendered: true, weErrored: false, engine: 'class' },
      { slug: 'b', jarType: 'CLASS', ourType: 'SEQUENCE', jarErrored: false, jarRendered: true, weErrored: false, engine: 'sequence' },
    ];
    const ledger = new Map<string, LedgerRow>();
    const derived = new Map(measured.map((m) => [m.slug, deriveRow(m, ledger.get(m.slug))]));
    const tally = computeTally(measured, ledger, derived);
    expect(tally.unpinned).toBe(1);
    expect(tally.entries).toEqual([{ cohort: '(no ledger row)', routing: 'agree', refusal: 'ok', count: 1 }]);
  });

  it('sorts entries by cohort, then routing status, then refusal cohort when cohorts tie', () => {
    const measured: MeasuredFixture[] = [
      { slug: 'a', jarType: 'CLASS', ourType: 'CLASS', jarErrored: false, jarRendered: true, weErrored: false, engine: 'class' },
      { slug: 'b', jarType: 'CLASS', ourType: 'CLASS', jarErrored: false, jarRendered: false, weErrored: false, engine: 'class' },
    ];
    const ledgerRow: LedgerRow = { slug: 'shared', cohort: 'same-cohort', disposition: 'agree', task: 'T0' };
    const ledger = new Map<string, LedgerRow>([
      ['a', ledgerRow],
      ['b', ledgerRow],
    ]);
    const derived = new Map(measured.map((m) => [m.slug, deriveRow(m, ledger.get(m.slug))]));
    const tally = computeTally(measured, ledger, derived);
    expect(tally.entries).toEqual([
      { cohort: 'same-cohort', routing: 'agree', refusal: 'jar-error', count: 1 },
      { cohort: 'same-cohort', routing: 'agree', refusal: 'ok', count: 1 },
    ]);
  });

  it('skips a measured fixture with no corresponding entry in derived rather than throwing', () => {
    const measured: MeasuredFixture[] = [
      { slug: 'a', jarType: 'CLASS', ourType: 'CLASS', jarErrored: false, jarRendered: true, weErrored: false, engine: 'class' },
    ];
    const tally = computeTally(measured, new Map(), new Map());
    expect(tally).toEqual({ entries: [], unpinned: 0 });
  });
});

// ---------------------------------------------------------------------------
// loadLedger
// ---------------------------------------------------------------------------

describe('loadLedger', () => {
  it('reads as zero rows when the ledger directory does not exist yet', () => {
    expect(loadLedger(join(tmp, 'nonexistent-ledger-dir')).size).toBe(0);
  });

  it('merges rows from multiple fragment files by slug', () => {
    const dir = join(tmp, 'ledger-merge');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.json'), JSON.stringify({ rows: [{ slug: 'x', cohort: 'c', disposition: 'agree', task: 'T1' }] }), 'utf8');
    writeFileSync(join(dir, 'b.json'), JSON.stringify({ rows: [{ slug: 'y', cohort: 'c', disposition: 'agree', task: 'T2' }] }), 'utf8');
    expect([...loadLedger(dir).keys()].sort()).toEqual(['x', 'y']);
  });

  it('throws when a slug appears in two fragments', () => {
    const dir = join(tmp, 'ledger-dup');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.json'), JSON.stringify({ rows: [{ slug: 'z', cohort: 'c', disposition: 'agree', task: 'T1' }] }), 'utf8');
    writeFileSync(join(dir, 'b.json'), JSON.stringify({ rows: [{ slug: 'z', cohort: 'c', disposition: 'agree', task: 'T2' }] }), 'utf8');
    expect(() => loadLedger(dir)).toThrow(/"z"/);
  });
});

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('defaults --tree and --ledger from <type>', () => {
    expect(parseArgs(['sequence'])).toEqual({
      type: 'sequence',
      treeDir: 'test-results/dot-cache/sequence',
      ledgerDir: 'tests/oracle/svg-conformance/unknown-ledger',
      dry: false,
    });
  });

  it('overrides --tree and --ledger, and sets --dry', () => {
    expect(parseArgs(['unknown', '--tree', 'a/b', '--ledger', 'c/d', '--dry'])).toEqual({
      type: 'unknown',
      treeDir: 'a/b',
      ledgerDir: 'c/d',
      dry: true,
    });
  });

  it('ignores an unrecognized flag rather than consuming the next argument', () => {
    expect(parseArgs(['unknown', '--bogus', 'x']).treeDir).toBe('test-results/dot-cache/unknown');
  });

  it('throws when no type is given', () => {
    expect(() => parseArgs([])).toThrow(/usage/);
  });
});

// ---------------------------------------------------------------------------
// runPinCorpusTree -- the mission brief's five acceptance criteria
// ---------------------------------------------------------------------------

describe('runPinCorpusTree', () => {
  it('AC1: --dry over the 4-fixture tree tallies the expected cohorts and writes nothing', () => {
    const { routingBaselinePath, refusalBaselinePath } = freshBaselinePaths('ac1');
    const beforeRouting = readFileSync(routingBaselinePath, 'utf8');
    const beforeRefusal = readFileSync(refusalBaselinePath, 'utf8');

    const result = runPinCorpusTree(baseOpts({ dry: true, routingBaselinePath, refusalBaselinePath }));

    expect(result.wrote).toBe(false);
    expect(result.total).toBe(4);
    expect(result.tally.unpinned).toBe(0);
    expect(new Set(result.tally.entries)).toEqual(
      new Set([
        { cohort: '(no ledger row)', routing: 'agree', refusal: 'ok', count: 1 },
        { cohort: '(no ledger row)', routing: 'jar-error', refusal: 'jar-error', count: 1 },
        { cohort: 'seq-misroute', routing: 'known-misroute', refusal: 'ok', count: 1 },
        { cohort: 'includedef-gap', routing: 'agree', refusal: 'known-gap', count: 1 },
      ]),
    );
    expect(readFileSync(routingBaselinePath, 'utf8')).toBe(beforeRouting);
    expect(readFileSync(refusalBaselinePath, 'utf8')).toBe(beforeRefusal);
  });

  it('AC2: a measured misroute whose ledger row has no reason exits naming the slug; both baselines stay byte-unchanged', () => {
    const noReasonLedgerDir = join(tmp, 'ledger-no-reason');
    writeLedgerFragment(noReasonLedgerDir, [
      { slug: 'misroute-sequence', cohort: 'seq-misroute', disposition: 'known-misroute', task: 'T0' },
      {
        slug: 'refusal-includedef',
        cohort: 'includedef-gap',
        disposition: 'known-gap',
        reason: 'CommandIncludeDef.java:99 x',
        task: 'T0',
      },
    ]);
    const { routingBaselinePath, refusalBaselinePath } = freshBaselinePaths('ac2');
    const beforeRouting = readFileSync(routingBaselinePath, 'utf8');
    const beforeRefusal = readFileSync(refusalBaselinePath, 'utf8');

    expect(() =>
      runPinCorpusTree(baseOpts({ dry: false, ledgerDir: noReasonLedgerDir, routingBaselinePath, refusalBaselinePath })),
    ).toThrow(/misroute-sequence/);

    expect(readFileSync(routingBaselinePath, 'utf8')).toBe(beforeRouting);
    expect(readFileSync(refusalBaselinePath, 'utf8')).toBe(beforeRefusal);
  });

  it('AC3: a fix-candidate ledger row refuses naming the slug when run without --dry', () => {
    const fixCandidateLedgerDir = join(tmp, 'ledger-fix-candidate');
    writeLedgerFragment(fixCandidateLedgerDir, [
      { slug: 'misroute-sequence', cohort: 'seq-misroute', disposition: 'fix-candidate', task: 'T0' },
      {
        slug: 'refusal-includedef',
        cohort: 'includedef-gap',
        disposition: 'known-gap',
        reason: 'CommandIncludeDef.java:99 x',
        task: 'T0',
      },
    ]);
    const { routingBaselinePath, refusalBaselinePath } = freshBaselinePaths('ac3');

    expect(() =>
      runPinCorpusTree(baseOpts({ dry: false, ledgerDir: fixCandidateLedgerDir, routingBaselinePath, refusalBaselinePath })),
    ).toThrow(/misroute-sequence/);
  });

  it('AC5: a real run appends exactly 4 rows in slug order; every pre-existing row stays byte-identical', () => {
    const { routingBaselinePath, refusalBaselinePath } = freshBaselinePaths('ac5');

    const result = runPinCorpusTree(baseOpts({ dry: false, routingBaselinePath, refusalBaselinePath }));

    expect(result.wrote).toBe(true);
    expect(result.total).toBe(4);

    const routing = JSON.parse(readFileSync(routingBaselinePath, 'utf8')) as BaselineFileLike;
    const refusal = JSON.parse(readFileSync(refusalBaselinePath, 'utf8')) as BaselineFileLike;

    expect(routing.fixtures).toHaveLength(EXISTING_ROUTING.fixtures.length + 4);
    expect(refusal.fixtures).toHaveLength(EXISTING_REFUSAL.fixtures.length + 4);
    expect(routing.fixtures[0]).toEqual(EXISTING_ROUTING.fixtures[0]);
    expect(refusal.fixtures[0]).toEqual(EXISTING_REFUSAL.fixtures[0]);

    const newSlugs = routing.fixtures.slice(EXISTING_ROUTING.fixtures.length).map((r) => r.slug);
    expect(newSlugs).toEqual(['agree-class', 'jar-error-page', 'misroute-sequence', 'refusal-includedef']);

    const agree = findRow(routing.fixtures, 'agree-class');
    expect(agree.status).toBe('agree');
    expect(agree.jarErrored).toBeUndefined();

    const jarErrorRow = findRow(routing.fixtures, 'jar-error-page');
    expect(jarErrorRow.status).toBe('jar-error');
    expect(jarErrorRow.jarErrored).toBe(true);

    const misroute = findRow(routing.fixtures, 'misroute-sequence');
    expect(misroute.status).toBe('known-misroute');
    expect(misroute.jarType).toBe('CLASS');
    expect(misroute.ourType).toBe('SEQUENCE');
    expect(misroute.reason).toBe('CommandFoo.java:12 fake reason for the misroute fixture');

    const refusalRow = findRow(refusal.fixtures, 'refusal-includedef');
    expect(refusalRow.status).toBe('known-gap');
    expect(refusalRow.weErrored).toBe(true);
    expect(refusalRow.jarRendered).toBe(true);
    expect(refusalRow.reason).toBe('CommandIncludeDef.java:99 fake reason for the refusal fixture');

    const okRow = findRow(refusal.fixtures, 'misroute-sequence');
    expect(okRow.status).toBe('ok');
    expect(okRow.weErrored).toBe(false);
  });

  it('a malformed ledger reason refuses regardless of --dry', () => {
    const badLedgerDir = join(tmp, 'ledger-bad-reason');
    writeLedgerFragment(badLedgerDir, [
      { slug: 'misroute-sequence', cohort: 'c', disposition: 'known-misroute', reason: 'not a file reference', task: 'T0' },
      { slug: 'refusal-includedef', cohort: 'c', disposition: 'known-gap', reason: 'CommandIncludeDef.java:99 x', task: 'T0' },
    ]);
    const { routingBaselinePath, refusalBaselinePath } = freshBaselinePaths('bad-reason');

    expect(() =>
      runPinCorpusTree(baseOpts({ dry: true, ledgerDir: badLedgerDir, routingBaselinePath, refusalBaselinePath })),
    ).toThrow(/misroute-sequence/);
  });

  it('--dry tolerates an unresolved defect as "unpinned" WIP rather than refusing (only a real run refuses it)', () => {
    const emptyLedgerDir = join(tmp, 'ledger-empty-for-dry');
    writeLedgerFragment(emptyLedgerDir, []);
    const { routingBaselinePath, refusalBaselinePath } = freshBaselinePaths('dry-unpinned');

    const result = runPinCorpusTree(
      baseOpts({ dry: true, ledgerDir: emptyLedgerDir, routingBaselinePath, refusalBaselinePath }),
    );

    // misroute-sequence (routing) and refusal-includedef (refusal) each need
    // a reason and have none once the ledger is empty.
    expect(result.tally.unpinned).toBe(2);
    expect(result.wrote).toBe(false);
  });
});
