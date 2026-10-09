/**
 * Unit tests for scripts/recapture-oracles.ts and scripts/lib/recapture-*.ts
 * (mission instrument-space-width, T0b). No JVM: the renderer is injected.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  STATUS,
  countByStatus,
  evaluate,
  evaluateFixtureSvg,
  pickSvg,
  selectOutputs,
  type Rendered,
} from '../../../scripts/lib/recapture-classify.js';
import { parseArgs, DEFAULT_WORKERS } from '../../../scripts/lib/recapture-cli.js';
import {
  TARGET_KIND,
  buildManifest,
  filterTargets,
  isSvekDot,
  targetId,
  type Target,
} from '../../../scripts/lib/recapture-manifest.js';
import { classpath, javaArgs, runPool, type Renderer } from '../../../scripts/lib/recapture-render.js';
import { formatCounts, processTarget, recapture, type Context } from '../../../scripts/recapture-oracles.js';

const buf = (s: string): Buffer => Buffer.from(s);
const rendered = (files: Record<string, string>, exitCode: number | null = 0, timedOut = false): Rendered => ({
  files: new Map(Object.entries(files).map(([k, v]) => [k, buf(v)])),
  exitCode,
  timedOut,
});
const existing = (files: Record<string, string | undefined>): Map<string, Buffer | undefined> =>
  new Map(Object.entries(files).map(([k, v]) => [k, v === undefined ? undefined : buf(v)]));

const CACHE: Target = {
  kind: TARGET_KIND.dotCache,
  dir: 'test-results/dot-cache/usecase/foo',
  puml: 'test-results/dot-cache/usecase/foo/in.puml',
  outputs: ['in.svg', 'svek-1.dot', 'svek-2.dot'],
};
const GOLDEN: Target = {
  kind: TARGET_KIND.svgGolden,
  dir: 'oracle/goldens/svg-dot/bar',
  puml: 'oracle/goldens/svg-dot/bar/in.puml',
  outputs: ['golden.svg'],
};
const DOTS: Target = {
  kind: TARGET_KIND.dotGolden,
  dir: 'oracle/goldens/class/baz',
  puml: 'oracle/goldens/class/baz/input.puml',
  outputs: ['svek-1.dot'],
};
const FIXTURE: Target = {
  kind: TARGET_KIND.fixtureSvg,
  dir: 'tests/fixtures/lgm/x',
  puml: 'tests/fixtures/lgm/x/a.puml',
  outputs: ['a.svg'],
};

describe('buildManifest', () => {
  const files = [
    'test-results/dot-cache/usecase/foo/in.puml',
    'test-results/dot-cache/usecase/foo/in.svg',
    'test-results/dot-cache/usecase/foo/svek-2.dot',
    'test-results/dot-cache/usecase/foo/svek-1.dot',
    'test-results/dot-cache/usecase/incomplete/in.puml',
    'oracle/goldens/svg-dot/bar/in.puml',
    'oracle/goldens/svg-dot/bar/golden.svg',
    'oracle/goldens/svg-conformance/orphan/golden.svg',
    'oracle/goldens/svg-class/no-golden/in.puml',
    'oracle/goldens/class/baz/input.puml',
    'oracle/goldens/class/baz/svek-1.dot',
    'oracle/goldens/class/baz/input.svg',
    'oracle/goldens/class/no-dots/input.puml',
    'oracle/goldens/sequence/seq/input.puml',
    'oracle/goldens/sequence/seq/svek-1.dot',
    'tests/fixtures/lgm/x/a.puml',
    'tests/fixtures/lgm/x/a.svg',
    'tests/fixtures/lgm/x/b.svg',
    'src/elsewhere/in.puml',
  ];
  const manifest = buildManifest(files);

  it('builds one row per dot-cache dir with in.puml + in.svg, outputs sorted', () => {
    expect(manifest.filter((t) => t.kind === TARGET_KIND.dotCache)).toEqual([CACHE]);
  });

  it('builds svg-golden only when golden.svg has its in.puml sibling', () => {
    expect(manifest.filter((t) => t.kind === TARGET_KIND.svgGolden)).toEqual([GOLDEN]);
  });

  it('builds dot-golden for dot engines only, from existing svek dots, never input.svg', () => {
    expect(manifest.filter((t) => t.kind === TARGET_KIND.dotGolden)).toEqual([DOTS]);
  });

  it('builds fixture-svg only for an svg with a sibling puml', () => {
    expect(manifest.filter((t) => t.kind === TARGET_KIND.fixtureSvg)).toEqual([FIXTURE]);
  });

  it('ignores everything else', () => {
    expect(manifest).toHaveLength(4);
  });

  it('recognises svek dot names', () => {
    expect([isSvekDot('svek-12.dot'), isSvekDot('svek-.dot'), isSvekDot('x.dot')]).toEqual([true, false, false]);
  });
});

describe('filterTargets / targetId', () => {
  const all = [CACHE, GOLDEN, DOTS, FIXTURE];

  it('is the dir for directory kinds and the svg path for a fixture-svg', () => {
    expect(targetId(CACHE)).toBe('test-results/dot-cache/usecase/foo');
    expect(targetId(FIXTURE)).toBe('tests/fixtures/lgm/x/a.svg');
  });

  it('keeps everything with no globs', () => {
    expect(filterTargets(all, [])).toEqual(all);
  });

  it('matches a trailing path suffix at a segment boundary', () => {
    expect(filterTargets(all, ['usecase/foo'])).toEqual([CACHE]);
    expect(filterTargets(all, ['secase/foo'])).toEqual([]);
  });

  it('supports * within a segment, ** across segments and ?', () => {
    expect(filterTargets(all, ['oracle/goldens/svg-*/bar'])).toEqual([GOLDEN]);
    expect(filterTargets(all, ['tests/**/a.svg'])).toEqual([FIXTURE]);
    expect(filterTargets(all, ['class/ba?'])).toEqual([DOTS]);
    expect(filterTargets(all, ['svg-*'])).toEqual([]);
  });

  it('takes the union of several globs and escapes regex metacharacters', () => {
    expect(filterTargets(all, ['usecase/foo', 'class/baz'])).toEqual([CACHE, DOTS]);
    expect(filterTargets(all, ['a.svg'])).toEqual([FIXTURE]);
    expect(filterTargets(all, ['a+svg'])).toEqual([]);
  });
});

describe('pickSvg / selectOutputs', () => {
  it('prefers <puml base>.svg', () => {
    expect(
      pickSvg(
        CACHE,
        new Map([
          ['in.svg', buf('a')],
          ['in_001.svg', buf('b')],
        ]),
      ),
    ).toEqual(buf('a'));
  });

  it('adopts a lone differently-named svg (@startuml <name>)', () => {
    expect(pickSvg(CACHE, new Map([['named.svg', buf('n')]]))).toEqual(buf('n'));
  });

  it('reports no svg and ambiguous svgs as errors', () => {
    expect(pickSvg(CACHE, new Map())).toBe('jar produced no SVG');
    expect(
      pickSvg(
        CACHE,
        new Map([
          ['b.svg', buf('')],
          ['a.svg', buf('')],
        ]),
      ),
    ).toBe('ambiguous SVG output (a.svg, b.svg)');
  });

  it('maps the svg to the target output name and keeps svek dots for dot kinds', () => {
    const files = new Map([
      ['in.svg', buf('s')],
      ['svek-1.dot', buf('d')],
      ['other.txt', buf('x')],
    ]);
    expect([...(selectOutputs(CACHE, files) as Map<string, Buffer>).keys()]).toEqual(['in.svg', 'svek-1.dot']);
    expect([...(selectOutputs(GOLDEN, files) as Map<string, Buffer>).keys()]).toEqual(['golden.svg']);
    expect([...(selectOutputs(DOTS, files) as Map<string, Buffer>).keys()]).toEqual(['svek-1.dot']);
  });

  it('fails a dot-golden that produced no dot, even with an svg', () => {
    expect(selectOutputs(DOTS, new Map([['input.svg', buf('s')]]))).toBe('jar produced no svek DOT');
  });
});

describe('evaluate', () => {
  it('is SAME when every output equals the committed bytes', () => {
    const ev = evaluate(GOLDEN, existing({ 'golden.svg': 'x' }), rendered({ 'in.svg': 'x' }));
    expect(ev).toMatchObject({ status: STATUS.same, changedOutputs: [], removedOutputs: [] });
    expect(ev.desired.size).toBe(0);
  });

  it('is CHANGED with the differing output names and the bytes to write', () => {
    const ev = evaluate(GOLDEN, existing({ 'golden.svg': 'old' }), rendered({ 'in.svg': 'new' }));
    expect(ev.status).toBe(STATUS.changed);
    expect(ev.changedOutputs).toEqual(['golden.svg']);
    expect(ev.desired.get('golden.svg')).toEqual(buf('new'));
  });

  it('is CHANGED for a brand-new dot and for a stale dot the jar no longer emits', () => {
    const ev = evaluate(
      CACHE,
      existing({ 'in.svg': 's', 'svek-1.dot': 'd1', 'svek-2.dot': 'd2' }),
      rendered({ 'in.svg': 's', 'svek-1.dot': 'd1', 'svek-3.dot': 'd3' }),
    );
    expect(ev.status).toBe(STATUS.changed);
    expect(ev.changedOutputs).toEqual(['svek-3.dot']);
    expect(ev.removedOutputs).toEqual(['svek-2.dot']);
  });

  it('is FAILED on timeout, with no files, or with an ambiguous render', () => {
    const e = existing({ 'golden.svg': 'x' });
    expect(evaluate(GOLDEN, e, rendered({}, null, true))).toMatchObject({
      status: STATUS.failed,
      detail: 'jar timed out',
    });
    expect(evaluate(GOLDEN, e, rendered({}, 1))).toMatchObject({
      status: STATUS.failed,
      detail: 'jar produced no SVG',
      jarExit: 1,
    });
  });

  it('keeps a non-zero exit beside bytes that are an error diagram', () => {
    const ev = evaluate(GOLDEN, existing({ 'golden.svg': 'err' }), rendered({ 'in.svg': 'err' }, 200));
    expect(ev).toMatchObject({ status: STATUS.same, jarExit: 200, detail: 'jar exit 200' });
  });
});

describe('evaluateFixtureSvg', () => {
  const committed = existing({ 'a.svg': 'jar' });

  it('is SAME when the reference jar reproduces the committed svg and no candidate is given', () => {
    expect(evaluateFixtureSvg(FIXTURE, committed, rendered({ 'a.svg': 'jar' }), undefined).status).toBe(STATUS.same);
  });

  it('is not-a-jar-render when the reference differs, never writable', () => {
    const ev = evaluateFixtureSvg(FIXTURE, committed, rendered({ 'a.svg': 'ours' }), undefined);
    expect(ev).toMatchObject({ status: STATUS.notAJarRender, detail: 'reference jar differs', changedOutputs: [] });
    expect(ev.desired.size).toBe(0);
  });

  it('is not-a-jar-render, with the reason, when the reference render failed', () => {
    const ev = evaluateFixtureSvg(FIXTURE, committed, rendered({}, 1), undefined);
    expect(ev).toMatchObject({ status: STATUS.notAJarRender, detail: 'reference render failed: jar produced no SVG' });
  });

  it('judges a jar render against the candidate jar: CHANGED when it moved', () => {
    const ev = evaluateFixtureSvg(FIXTURE, committed, rendered({ 'a.svg': 'jar' }), rendered({ 'a.svg': 'new' }));
    expect(ev.status).toBe(STATUS.changed);
    expect(ev.desired.get('a.svg')).toEqual(buf('new'));
  });
});

describe('countByStatus / formatCounts', () => {
  it('counts per status and prints all four in a fixed order', () => {
    expect(countByStatus([STATUS.same, STATUS.same, STATUS.failed])).toEqual({ SAME: 2, FAILED: 1 });
    const row = { kind: TARGET_KIND.svgGolden, outputs: [], changedOutputs: [], removedOutputs: [] };
    const rows = [
      { ...row, target: 'a', status: STATUS.same },
      { ...row, target: 'b', status: STATUS.notAJarRender },
    ];
    expect(formatCounts(rows)).toBe('SAME=1 CHANGED=0 FAILED=0 not-a-jar-render=1');
  });
});

describe('parseArgs', () => {
  it('defaults to verify with the default workers', () => {
    expect(parseArgs([])).toEqual({
      mode: 'verify',
      workers: DEFAULT_WORKERS,
      only: [],
      jar: undefined,
      report: undefined,
      scratch: undefined,
    });
  });

  it('reads every flag', () => {
    expect(
      parseArgs([
        '--write',
        '--workers',
        '3',
        '--only',
        'a,b',
        '--only',
        'c',
        '--jar',
        'j.jar',
        '--report',
        'r.json',
        '--scratch',
        '/s',
      ]),
    ).toEqual({ mode: 'write', workers: 3, only: ['a', 'b', 'c'], jar: 'j.jar', report: 'r.json', scratch: '/s' });
  });

  it('rejects bad input with a message', () => {
    expect(parseArgs(['--workers', '0'])).toEqual({ error: '--workers needs a positive integer, got "0"' });
    expect(parseArgs(['--only'])).toEqual({ error: '--only needs a value' });
    expect(parseArgs(['--nope'])).toEqual({ error: 'unknown argument "--nope"' });
    expect(parseArgs(['--write', '--verify'])).toEqual({ error: '--write and --verify are mutually exclusive' });
  });
});

describe('runPool', () => {
  it('preserves input order and never exceeds the worker bound', async () => {
    let live = 0;
    let peak = 0;
    const out = await runPool([5, 1, 4, 2, 3], 2, async (n) => {
      live += 1;
      peak = Math.max(peak, live);
      await new Promise((r) => setTimeout(r, n));
      live -= 1;
      return n * 10;
    });
    expect(out).toEqual([50, 10, 40, 20, 30]);
    expect(peak).toBe(2);
  });

  it('handles an empty list', async () => {
    expect(await runPool([], 4, () => Promise.resolve(1))).toEqual([]);
  });
});

describe('javaArgs / classpath', () => {
  let repo: string;
  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'recap-cp-'));
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it('renders with the deterministic-text flag and dumps DOT beside the svg', () => {
    expect(javaArgs('/j.jar', repo, '/out', '/p/in.puml')).toEqual([
      '-DPLANTUML_DETERMINISTIC_TEXT=true',
      '-DPLANTUML_DUMP_DOT=/out',
      '-cp',
      '/j.jar',
      'net.sourceforge.plantuml.Run',
      '-tsvg',
      '-o',
      '/out',
      '/p/in.puml',
    ]);
  });

  it('puts the REPO batik jars on the classpath only when present', () => {
    expect(classpath('/j.jar', repo)).toBe('/j.jar');
    mkdirSync(join(repo, 'oracle', 'dist', 'batik'), { recursive: true });
    writeFileSync(join(repo, 'oracle', 'dist', 'batik', 'b.jar'), '');
    expect(classpath('/j.jar', repo)).toBe(`/j.jar:${join(repo, 'oracle', 'dist', 'batik', '*')}`);
  });
});

describe('processTarget / recapture (injected renderer, temp repo)', () => {
  let repo: string;
  const read = (rel: string): string => readFileSync(join(repo, rel), 'utf8');

  function ctx(render: Renderer, write: boolean): Context {
    return { repo, jar: '/new.jar', referenceJar: '/ref.jar', scratchRoot: join(repo, 'scratch'), write, render };
  }

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'recap-repo-'));
    for (const [rel, body] of [
      [`${CACHE.dir}/in.svg`, 'old-svg'],
      [`${CACHE.dir}/svek-1.dot`, 'old-d1'],
      [`${CACHE.dir}/svek-2.dot`, 'old-d2'],
      [`${FIXTURE.dir}/a.svg`, 'jar-bytes'],
    ] as const) {
      mkdirSync(join(repo, rel, '..'), { recursive: true });
      writeFileSync(join(repo, rel), body);
    }
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  const newCache: Renderer = () => Promise.resolve(rendered({ 'in.svg': 'new-svg', 'svek-1.dot': 'new-d1' }));

  it('without --write reports CHANGED but touches no committed byte', async () => {
    const row = await processTarget(CACHE, ctx(newCache, false));
    expect(row).toMatchObject({
      target: CACHE.dir,
      kind: 'dot-cache',
      status: 'CHANGED',
      outputs: CACHE.outputs,
      changedOutputs: ['in.svg', 'svek-1.dot'],
      removedOutputs: ['svek-2.dot'],
    });
    expect(read(`${CACHE.dir}/in.svg`)).toBe('old-svg');
    expect(read(`${CACHE.dir}/svek-2.dot`)).toBe('old-d2');
  });

  it('with --write replaces changed outputs and deletes the stale dot', async () => {
    await processTarget(CACHE, ctx(newCache, true));
    expect(read(`${CACHE.dir}/in.svg`)).toBe('new-svg');
    expect(read(`${CACHE.dir}/svek-1.dot`)).toBe('new-d1');
    expect(existsSync(join(repo, CACHE.dir, 'svek-2.dot'))).toBe(false);
  });

  it('never writes a not-a-jar-render fixture, even under --write', async () => {
    const ours: Renderer = () => Promise.resolve(rendered({ 'a.svg': 'something-else' }));
    const row = await processTarget(FIXTURE, ctx(ours, true));
    expect(row.status).toBe('not-a-jar-render');
    expect(read(`${FIXTURE.dir}/a.svg`)).toBe('jar-bytes');
  });

  it('renders a fixture with the reference jar first and the candidate jar second', async () => {
    const render = vi.fn<Renderer>((_p, o) =>
      Promise.resolve(rendered({ 'a.svg': o.jar === '/ref.jar' ? 'jar-bytes' : 'new-bytes' })),
    );
    const row = await processTarget(FIXTURE, ctx(render, true));
    expect(render.mock.calls.map((c) => c[1].jar)).toEqual(['/ref.jar', '/new.jar']);
    expect(render.mock.calls[0]![0]).toBe(join(repo, FIXTURE.puml));
    expect(row.status).toBe('CHANGED');
    expect(read(`${FIXTURE.dir}/a.svg`)).toBe('new-bytes');
  });

  it('recapture renders one call per target and keeps target order', async () => {
    const render = vi.fn<Renderer>(() =>
      Promise.resolve(rendered({ 'in.svg': 'old-svg', 'svek-1.dot': 'old-d1', 'svek-2.dot': 'old-d2' })),
    );
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const rows = await recapture([CACHE, CACHE], ctx(render, false), 2);
    out.mockRestore();
    expect(rows.map((r) => r.status)).toEqual(['SAME', 'SAME']);
    expect(render).toHaveBeenCalledTimes(2);
  });
});
