/**
 * `DataSourceImpl` tokenisation against the 1.2026.8beta1 oracle jar.
 *
 * `fixtures/data-source-tokens.json` is the jar's own `DataSourceImpl` run by
 * `fixtures/DataSourceProbe.java` over the body lines of every committed salt
 * oracle (`test-results/dot-cache/salt/<slug>/in.puml`) plus the authored
 * `fixtures/data-source-edges.puml` (case-insensitive `{s-`/`{si`, escaped
 * `\|` `\{` `\}`, a `}` mid-line, blank and tab-padded cells). Every token and
 * its terminator must equal the jar's, in order.
 *
 * Accessor values (`peek` past the end, `remove`, empty input) are from a
 * jshell probe of the same jar: `new DataSourceImpl(List.of("a | b"))` peeks
 * `b NEWLINE` at 1 and throws `IndexOutOfBoundsException` at 2.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../src/diagrams/salt/DataSourceImpl.js';
import type { Terminated } from '../../../src/diagrams/salt/Terminated.js';
import { Terminator } from '../../../src/diagrams/salt/Terminator.js';

interface ProbeRow {
  readonly source: string;
  readonly lines: readonly string[];
  readonly tokens: readonly (readonly [string, string])[];
}

const PROBE_URL = new URL('./fixtures/data-source-tokens.json', import.meta.url);
const PROBE_ROWS = JSON.parse(readFileSync(PROBE_URL, 'utf8')) as readonly ProbeRow[];
const SALT_CORPUS_ROWS = 51;

function drain(ds: DataSourceImpl): [string, string][] {
  const result: [string, string][] = [];
  while (ds.hasNext()) {
    const t: Terminated<string> = ds.next();
    result.push([t.getElement(), t.getTerminator()]);
  }
  return result;
}

describe('DataSourceImpl tokenisation (jar probe)', () => {
  it('covers every committed salt oracle plus the authored edge file', () => {
    expect(PROBE_ROWS).toHaveLength(SALT_CORPUS_ROWS + 1);
  });

  it.each(PROBE_ROWS.map((row) => [row.source, row] as const))('%s', (_source, row) => {
    expect(drain(new DataSourceImpl(row.lines))).toEqual(row.tokens);
  });

  it('splits a nested "{# ... }" header off its prefix (jukefo-44-teja465)', () => {
    const ds = new DataSourceImpl(['{', 'S={# [OK south] | [Cancel]}', '}']);
    expect(drain(ds)).toEqual([
      ['{', Terminator.NEWLINE],
      ['S=', Terminator.NEWCOL],
      ['{#', Terminator.NEWCOL],
      ['[OK south]', Terminator.NEWCOL],
      ['[Cancel]', Terminator.NEWCOL],
      ['}', Terminator.NEWLINE],
      ['}', Terminator.NEWLINE],
    ]);
  });
});

describe('DataSourceImpl cursor', () => {
  it('peeks relative to the cursor without advancing it', () => {
    const ds = new DataSourceImpl(['a | b']);
    expect(ds.peek(0).toString()).toBe('a NEWCOL');
    expect(ds.peek(1).toString()).toBe('b NEWLINE');
    expect(ds.next().getElement()).toBe('a');
    expect(ds.peek(0).getElement()).toBe('b');
  });

  it('throws IndexOutOfBoundsException past the end, like ArrayList.get', () => {
    const ds = new DataSourceImpl(['a | b']);
    expect(() => ds.peek(2)).toThrow('Index 2 out of bounds for length 2');
    expect(() => ds.peek(-1)).toThrow('Index -1 out of bounds for length 2');
    ds.next();
    ds.next();
    expect(ds.hasNext()).toBe(false);
    expect(() => ds.next()).toThrow('Index 2 out of bounds for length 2');
  });

  it('has nothing for empty input', () => {
    expect(new DataSourceImpl([]).hasNext()).toBe(false);
  });

  it('refuses remove, as upstream does', () => {
    expect(() => new DataSourceImpl(['a']).remove()).toThrow('UnsupportedOperationException');
  });

  it('prints the class name and the next token, or $$$ when drained', () => {
    const ds = new DataSourceImpl(['a']);
    expect(ds.toString()).toBe('DataSourceImpl a NEWLINE');
    ds.next();
    expect(ds.toString()).toBe('DataSourceImpl $$$');
  });
});
