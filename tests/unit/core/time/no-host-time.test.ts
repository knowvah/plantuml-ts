import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DIR = new URL('../../../../src/core/time/', import.meta.url);
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.ts'));

// Strip comments so the doc text may say "Date"/"Intl" while code may not use them.
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('src/core/time purity (D2, journal row 7)', () => {
  it('finds the module files', () => {
    expect(FILES.length).toBeGreaterThanOrEqual(12);
  });

  it.each(FILES)('%s references no Date, Intl, Node built-in or clock', (file) => {
    const src = code(readFileSync(new URL(file, DIR), 'utf8'));
    expect(src).not.toMatch(/\bDate\b/);
    expect(src).not.toMatch(/\bIntl\b/);
    expect(src).not.toMatch(/from\s+['"]node:/);
    expect(src).not.toMatch(/\brequire\(/);
    expect(src).not.toMatch(/process\.env/);
    expect(src).not.toMatch(/Math\.random/);
  });
});
