import { describe, expect, it } from 'vitest';
import { compareMaps, hashRows, report, type Row } from './extended-baseline.mts';

const row = (id: string, markup = id): Row => ({ id, markup });
const render = (r: Row): string => `<svg>${r.markup}</svg>`;

describe('extended-baseline core', () => {
  it('hashes rows sorted by id with sha256 of the render', () => {
    const map = hashRows([row('json/b'), row('hcl/z'), row('json/a')], render);
    expect(Object.keys(map)).toEqual(['hcl/z', 'json/a', 'json/b']);
    expect(map['json/a']).toMatch(/^[0-9a-f]{64}$/);
    expect(map['json/a']).not.toBe(map['json/b']);
  });

  it('hashes a throwing render as ERROR:<message>', () => {
    const boom = hashRows([row('json/x')], () => { throw new Error('boom'); });
    expect(boom['json/x']).toBe(hashRows([row('json/x')], () => 'ERROR:boom')['json/x']);
  });

  it('reports exactly MOVED for the one row whose bytes change', () => {
    const rows = [row('json/a'), row('json/b'), row('yaml/c')];
    const saved = hashRows(rows, render);
    const fresh = hashRows(rows, (r) => (r.id === 'json/b' ? '<svg>changed</svg>' : render(r)));
    const c = compareMaps(saved, fresh);
    expect(c).toEqual({ moved: ['json/b'], added: [], gone: [] });
    const out = report(c, 3);
    expect(out.lines).toEqual(['MOVED json/b', '3 rows: 1 MOVED, 0 ADDED, 0 GONE']);
    expect(out.exitCode).toBe(1);
  });

  it('reports GONE (exit 1) for a removed row and ADDED (exit 0) for a new one', () => {
    const saved = hashRows([row('json/a'), row('json/b')], render);
    const gone = report(compareMaps(saved, hashRows([row('json/a')], render)), 1);
    expect(gone.lines[0]).toBe('GONE json/b');
    expect(gone.exitCode).toBe(1);
    const added = report(compareMaps(saved, hashRows([row('json/a'), row('json/b'), row('hcl/n')], render)), 3);
    expect(added.lines).toEqual(['ADDED hcl/n', '3 rows: 0 MOVED, 1 ADDED, 0 GONE']);
    expect(added.exitCode).toBe(0);
  });

  it('is clean on identical maps', () => {
    const m = hashRows([row('json/a')], render);
    expect(report(compareMaps(m, m), 1)).toEqual({ lines: ['1 rows: 0 MOVED, 0 ADDED, 0 GONE'], exitCode: 0 });
  });
});
