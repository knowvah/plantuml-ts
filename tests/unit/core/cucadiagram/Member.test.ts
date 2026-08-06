/**
 * Member.test.ts — SI1/T7: `src/core/cucadiagram/Member.ts` against
 * cucadiagram/Member.java:95-148 (constructor sequence) and :150-178
 * (`getDisplay`). Expectations hand-derived from the Java; where A2s F-B
 * already jar-verified the same rule in the class engine's fork
 * (`class-member-parser.ts`, ADR-5), the case cites it.
 */
import { describe, expect, it } from 'vitest';
import { Member } from '../../../../src/core/cucadiagram/Member.js';
import { VisibilityModifier } from '../../../../src/core/skin/VisibilityModifier.js';

describe('Member constructor (Member.java:100-148)', () => {
  it('parses a leading visibility char into the FIELD modifier for fields', () => {
    const m = Member.field('+name : String');
    expect(m.getVisibilityModifier()).toBe(VisibilityModifier.PUBLIC_FIELD);
    expect(m.getDisplay(false)).toBe('name : String');
    expect(m.getDisplay(true)).toBe('+name : String');
  });

  it('parses a leading visibility char into the METHOD modifier for methods', () => {
    const m = Member.method('-run()');
    expect(m.getVisibilityModifier()).toBe(VisibilityModifier.PRIVATE_METHOD);
    expect(m.getDisplay(false)).toBe('run()');
    expect(m.getDisplay(true)).toBe('-run()');
  });

  it('maps every visibility char (java:133-134 via VisibilityModifier)', () => {
    expect(Member.field('#p : int').getVisibilityModifier()).toBe(VisibilityModifier.PROTECTED_FIELD);
    expect(Member.field('~p : int').getVisibilityModifier()).toBe(VisibilityModifier.PACKAGE_PRIVATE_FIELD);
    expect(Member.field('*p : int').getVisibilityModifier()).toBe(VisibilityModifier.IE_MANDATORY);
    expect(Member.method('#run()').getVisibilityModifier()).toBe(VisibilityModifier.PROTECTED_METHOD);
    expect(Member.method('~run()').getVisibilityModifier()).toBe(VisibilityModifier.PACKAGE_PRIVATE_METHOD);
  });

  it('keeps a doubled leading char as display text (isVisibilityCharacter second-char rule)', () => {
    // VisibilityModifier.java: second char must DIFFER from the first —
    // `**bold**` is creole, not an IE_MANDATORY marker (G2 N42 cite).
    const m = Member.field('**bold**');
    expect(m.getVisibilityModifier()).toBeNull();
    expect(m.getDisplay(false)).toBe('**bold**');
  });

  it('removes {method}/{field} doc tags anywhere, case-insensitively (java:95/:103; A2s F-B B1)', () => {
    // jar: `{method} + execute` measures identical to `+ execute`
    // (filoxo-23-fafi328, class-member-parser.ts REMOVE_TAG_PATTERN).
    const m = Member.method('{method} + execute');
    expect(m.getVisibilityModifier()).toBe(VisibilityModifier.PUBLIC_METHOD);
    expect(m.getDisplay(false)).toBe('execute');
    const upper = Member.field('{FIELD} data');
    expect(upper.getDisplay(false)).toBe('data');
  });

  it('detects {static}/{classifier} (any case) and strips the tag (java:124/:127-128)', () => {
    const m1 = Member.field('{static} counter : int');
    expect(m1.isStatic()).toBe(true);
    expect(m1.isAbstract()).toBe(false);
    expect(m1.getDisplay(false)).toBe('counter : int');
    const m2 = Member.field('{classifier} counter');
    expect(m2.isStatic()).toBe(true);
    const m3 = Member.field('{STATIC} counter');
    expect(m3.isStatic()).toBe(true);
    expect(m3.getDisplay(false)).toBe('counter');
  });

  it('detects {abstract} and strips the tag (java:125)', () => {
    const m = Member.method('{abstract} draw()');
    expect(m.isAbstract()).toBe(true);
    expect(m.isStatic()).toBe(false);
    expect(m.getDisplay(false)).toBe('draw()');
  });

  it('renders a display emptied by tag removal as ONE blank row " " (java:130-131; A2s F-B blankFallback)', () => {
    expect(Member.field('{field}').getDisplay(false)).toBe(' ');
    expect(Member.field('{static}').getDisplay(false)).toBe(' ');
  });

  it('extracts a member-level [ [[url]] ] suffix (java:93/:106-115, triple-bracket end to end)', () => {
    // Member-level url grammar wraps UrlBuilder's `[[...]]` in one more
    // `[...]` layer (class-member-parser.ts stripUrlSuffix's derivation).
    const m = Member.method('methods1() [[[http://plantuml.com]]]');
    expect(m.hasUrl()).toBe(true);
    expect(m.getUrl()?.getUrl()).toBe('http://plantuml.com');
    expect(m.getDisplay(false)).toBe('methods1()');
  });

  it('has no url without the bracket suffix, and none when manageModifier=false (java:117-118)', () => {
    expect(Member.method('run()').hasUrl()).toBe(false);
    expect(Member.method('run()').getUrl()).toBeNull();
    expect(Member.method('run() [[[http://x]]]', false).hasUrl()).toBe(false);
  });

  it('manageModifier=false keeps visibility chars/modifier tags as display text (java:140-147)', () => {
    const m = Member.method('  +raw()  ', false);
    expect(m.getVisibilityModifier()).toBeNull();
    expect(m.isStatic()).toBe(false);
    expect(m.getDisplay(false)).toBe('+raw()');
    expect(m.getDisplay(true)).toBe('+raw()');
    expect(Member.field('', false).getDisplay(false)).toBe(' ');
  });

  it('rewrites guillemets in the display (java:135/:137, Guillemet.GUILLEMET)', () => {
    expect(Member.field('<<create>> build()').getDisplay(false)).toBe('«create» build()');
  });
});

describe('Member CharSequence surface + equality (java:60-75, :180-189)', () => {
  it('toString/charAt/length/subSequence read the RAW line, not the display', () => {
    const raw = '{static} +counter : int';
    const m = Member.field(raw);
    expect(m.toString()).toBe(raw);
    expect(m.length()).toBe(raw.length);
    expect(m.charAt(0)).toBe('{');
    expect(m.subSequence(9, 17)).toBe('+counter');
  });

  it('equals compares on display; hashCode is Java String#hashCode of display', () => {
    const a = Member.field('+x : int');
    const b = Member.field('  +x : int  ');
    expect(a.equals(b)).toBe(true);
    expect(a.hashCode()).toBe(b.hashCode());
    expect(a.equals(Member.field('+y : int'))).toBe(false);
    // Java "x : int".hashCode() — hand-computed reference value.
    expect(Member.field('x').hashCode()).toBe('x'.charCodeAt(0));
  });
});
