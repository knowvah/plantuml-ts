import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  dayOfWeekLong,
  dayOfWeekShort,
  monthLong,
  monthShort,
  newLocale,
} from '../../../../src/core/utils/I18nTimeData.js';

type Tables = Record<string, Record<string, string[]>>;

const UPSTREAM = join(homedir(), 'git/plantuml/src/main/java/net/sourceforge/plantuml/utils/I18nTimeData.java');
const FALLBACK_LANG = '';
const UNKNOWN_LANG = 'toto';
const FNS = {
  dayOfWeekLong,
  dayOfWeekShort,
  monthShort,
  monthLong,
} as const;

/** Parse the upstream Java switch tables (I18nTimeData.java:11-466). */
function parseJava(src: string): Tables {
  const out: Tables = {};
  for (const m of src.matchAll(/public static String (\w+)\(.*?\n\t\}\n/gs)) {
    const tabs: Record<string, string[]> = {};
    const body = m[0];
    for (const lm of body.matchAll(/\t\tcase "(\w+)":\n(.*?)\t\t\tbreak;/gs)) {
      tabs[lm[1] as string] = [...(lm[2] as string).matchAll(/return "([^"]*)";/g)].map((p) => p[1] as string);
    }
    const fb = body.slice(body.indexOf('// Fallback'));
    tabs[FALLBACK_LANG] = [...fb.matchAll(/return "([^"]*)";/g)].map((p) => p[1] as string);
    out[m[1] as string] = tabs;
  }
  return out;
}

const expected: Tables = existsSync(UPSTREAM)
  ? parseJava(readFileSync(UPSTREAM, 'utf8'))
  : (JSON.parse(readFileSync(new URL('./I18nTimeData.expected.json', import.meta.url), 'utf8')) as Tables);

describe('I18nTimeData', () => {
  it('collects the four lookups with seven languages plus fallback', () => {
    expect(Object.keys(expected).sort()).toEqual(Object.keys(FNS).sort());
    for (const tabs of Object.values(expected)) {
      expect(Object.keys(tabs).sort()).toEqual(['', 'de', 'es', 'fr', 'ja', 'ko', 'ru', 'zh']);
    }
  });

  for (const [name, fn] of Object.entries(FNS)) {
    const tabs = expected[name] as Record<string, string[]>;
    for (const [lang, values] of Object.entries(tabs)) {
      const probe = lang === FALLBACK_LANG ? UNKNOWN_LANG : lang;
      it(`${name} matches upstream for "${probe}"`, () => {
        const got = values.map((_, i) => fn(i, newLocale(probe)));
        expect(got).toEqual(values);
      });
    }
  }

  it("unknown locale 'toto' falls back to English (I18nTimeData.java:92-100)", () => {
    const l = newLocale('toto');
    expect(dayOfWeekLong(0, l)).toBe('Monday');
    expect(dayOfWeekShort(1, l)).toBe('Tu');
    expect(monthShort(2, l)).toBe('Mar');
    expect(monthLong(11, l)).toBe('December');
  });

  it('lower-cases the language like new Locale(lang) and ignores country', () => {
    expect(newLocale('FR', 'CA')).toEqual({ language: 'fr', country: 'CA' });
    expect(dayOfWeekLong(0, newLocale('FR', 'CA'))).toBe('lundi');
  });

  it('does not resolve inherited object keys as languages', () => {
    expect(monthLong(0, { language: 'constructor', country: '' })).toBe('January');
  });

  it("throws for an ordinal outside the enum, like the Java's IllegalArgumentException", () => {
    expect(() => dayOfWeekLong(7, newLocale('de'))).toThrow(RangeError);
    expect(() => monthShort(12, newLocale('xx'))).toThrow(RangeError);
  });
});
