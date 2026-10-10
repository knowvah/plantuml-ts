import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { errorPageVerdict, loadStockErrorRecord } from '../../../scripts/lib/survey-error-verdict.js';

const RECORD = new Set(['activity/abc-1']);

describe('errorPageVerdict', () => {
  it('record + error page => conformant errorPage', () => {
    expect(errorPageVerdict('activity', 'abc-1', RECORD, true)).toEqual({ verdict: 'conformant', errorPage: true });
  });
  it('record + drawn => diverged error-page', () => {
    expect(errorPageVerdict('activity', 'abc-1', RECORD, false)).toEqual({
      verdict: 'diverged',
      firstDiff: 'error-page',
    });
  });
  it('not in record => undefined (exact comparison), whatever we drew', () => {
    expect(errorPageVerdict('activity', 'zzz', RECORD, true)).toBeUndefined();
    expect(errorPageVerdict('class', 'abc-1', RECORD, false)).toBeUndefined();
  });
});

describe('loadStockErrorRecord', () => {
  it('reads the keys of errors', () => {
    const p = join(mkdtempSync(join(tmpdir(), 'aepp-')), 'r.json');
    writeFileSync(p, JSON.stringify({ errors: { 'a/b': { line: null, message: '' } } }));
    expect([...loadStockErrorRecord(p)]).toEqual(['a/b']);
  });
  it('throws on a malformed record', () => {
    const p = join(mkdtempSync(join(tmpdir(), 'aepp-')), 'r.json');
    writeFileSync(p, '{}');
    expect(() => loadStockErrorRecord(p)).toThrow(/missing "errors"/);
  });
});
