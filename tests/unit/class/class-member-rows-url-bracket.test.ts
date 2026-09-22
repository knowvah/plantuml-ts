/**
 * class-member-rows-url-bracket.test.ts — T24-diagnosis row 83 / CDD T27FU:
 * `isMethodMember`'s raw-fallback paren scan must strip an embedded
 * `[[...]]` url bracket first (`BodierLikeClassOrObject#isMethod`,
 * java:104-116: `URL_PATTERN.matcher(s).replaceAll("")` before `contains
 * ("(")`/`contains(")")`), so a url's own tooltip/label text containing
 * parens does not misbucket the member as a method.
 *
 * `sejuzo-42-fini523`'s one field carries a `[[url{tooltip} label]] :
 * TEXT` line whose tooltip contains "(pagename)" — before this fix, the
 * raw-fallback paren scan saw those parens directly and bucketed the field
 * as a method, landing the (empty) methods divider first and shifting the
 * field row + its own trailing divider down by 8px (jar y=43/65, this
 * port's own pre-fix y=43/51).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:104-116
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:52-88
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isMethodMember } from '../../../src/diagrams/class/class-member-rows.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function rawFallbackMember(rawDisplay: string): Classifier['members'][number] {
  return { visibility: '+', name: rawDisplay, rawDisplay, isStatic: false, isAbstract: false };
}

describe('isMethodMember — url-bracket-aware paren scan (T24 row 83)', () => {
  it('a tooltip containing parens does NOT bucket the member as a method', () => {
    const m = rawFallbackMember('[[https://example.org{foreign key(pagename) of the series} series]] : TEXT');
    expect(isMethodMember(m)).toBe(false);
  });

  it('a genuine method-shaped raw-fallback line (parens outside any bracket) still buckets as a method', () => {
    const m = rawFallbackMember('String weird(Type');
    expect(isMethodMember(m)).toBe(true);
  });

  it('parens BOTH inside a url bracket and outside it still bucket as a method (the outer parens survive the strip)', () => {
    const m = rawFallbackMember('[[https://example.org{tip(x)}]] weird(');
    expect(isMethodMember(m)).toBe(true);
  });

  it('a quoted-link bracket ([["quoted"{tooltip} label]]) with parens in its tooltip is also stripped', () => {
    const m = rawFallbackMember('[["https://example.org"{tip(with parens)} label]] : TEXT');
    expect(isMethodMember(m)).toBe(false);
  });
});

describe('sejuzo-42-fini523 — end-to-end divider position (jar: y=43, y=65)', () => {
  it('the field lands in the FIELDS compartment, not methods — no spurious empty-methods divider at y=51', () => {
    const markup = readFileSync(join(REPO_ROOT, 'test-results/dot-cache/class/sejuzo-42-fini523/in.puml'), 'utf-8');
    const svg = renderSync(markup, { measurer: new WidthTableMeasurer() });
    const lineYs = [...svg.matchAll(/<line x1="8" y1="(\d+)"/g)].map((m) => Number(m[1]));
    expect(lineYs).toEqual([43, 65]);
  });
});
