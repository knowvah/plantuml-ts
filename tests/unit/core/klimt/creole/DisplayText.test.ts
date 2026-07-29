/**
 * DisplayText.test.ts — T9c: unit coverage for `DisplayText.ts`, the
 * "same metadata, new content" list-manipulation family `Display.ts`
 * delegates to (`add*`/`with*`/`replace*`/`underlined*`/`splitMultiline`).
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../../src/core/klimt/creole/Display.js';
import { Stereotype } from '../../../../../src/core/stereo/Stereotype.js';

describe('Display list-manipulation family (DisplayText.ts)', () => {
  it('replace substitutes every occurrence of src with dest across lines (java:159-168)', () => {
    const d = Display.create('foo bar foo', 'no match');
    expect(d.replace('foo', 'baz').asList()).toEqual(['baz bar baz', 'no match']);
  });

  it('replaceBackslashT converts literal "\\\\t" to a real tab (java:148-157)', () => {
    const d = Display.create('a\\tb');
    expect(d.replaceBackslashT().asList()).toEqual(['a\tb']);
  });

  it('withPage substitutes %page%/%lastpage% (java:427-439)', () => {
    const d = Display.create('Page %page% of %lastpage%');
    expect(d.withPage(2, 10).asList()).toEqual(['Page 2 of 10']);
  });

  it('withPage on a NULL display returns `this` unchanged (java:428-429, the one guarded case)', () => {
    expect(Display.NULL.withPage(1, 1)).toBe(Display.NULL);
  });

  it('underlined wraps every line in <u> (java:462-469)', () => {
    expect(Display.create('a', 'b').underlined().asList()).toEqual(['<u>a', '<u>b']);
  });

  it('underlinedName wraps only the name portion of the first "name: rest" line (java:473-488)', () => {
    const d = Display.create('Foo: field', 'plain');
    expect(d.underlinedName().asList()).toEqual(['<u>Foo</u>: field', '<u>plain']);
  });

  it('underlinedName falls back to wrapping the whole first line when no ":" is present', () => {
    expect(Display.create('NoColon').underlinedName().asList()).toEqual(['<u>NoColon']);
  });

  it('removeEndingStereotype strips a trailing <<...>> from the last line (java:441-450)', () => {
    const d = Display.create('Foo <<bar>>');
    // The lazy `(.*?)` prefix group keeps the space before "<<" -- matches
    // upstream's own regex byte-for-byte (java:452), not this port's choice.
    expect(d.removeEndingStereotype().asList()).toEqual(['Foo ']);
  });

  it('removeEndingStereotype is a no-op when the last line has no trailing stereotype', () => {
    const d = Display.create('Foo');
    expect(d.removeEndingStereotype()).toBe(d);
  });

  it('getEndingStereotype builds a real Stereotype from a trailing <<...>> (java:454-460)', () => {
    const d = Display.create('Foo <<bar>>');
    const s = d.getEndingStereotype();
    expect(s).toBeInstanceOf(Stereotype);
    expect(s!.toString()).toBe('<<bar>>');
  });

  it('getEndingStereotype returns undefined with no trailing stereotype', () => {
    expect(Display.create('Foo').getEndingStereotype()).toBeUndefined();
  });

  it('addAll appends every element of another Display (java:505-509)', () => {
    expect(Display.create('a').addAll(Display.create('b', 'c')).asList()).toEqual(['a', 'b', 'c']);
  });

  it('addFirst prepends one element (java:511-515)', () => {
    expect(Display.create('b').addFirst('a').asList()).toEqual(['a', 'b']);
  });

  it('appendFirstLine prefixes the first line only (java:517-521)', () => {
    expect(Display.create('World', 'other').appendFirstLine('Hello ').asList()).toEqual(['Hello World', 'other']);
  });

  it('add appends one element (java:523-527)', () => {
    expect(Display.create('a').add('b').asList()).toEqual(['a', 'b']);
  });

  it('addGeneric appends a new bracketed line when empty, else folds into the last line (java:529-538)', () => {
    expect(Display.empty().addGeneric('x').asList()).toEqual(['<x>']);
    expect(Display.create('a').addGeneric('x').asList()).toEqual(['a<x>']);
  });

  it('splitMultiline splits each line on the first separator match, accumulating non-matching lines into the CURRENT pending Display (java:579-599)', () => {
    const d = Display.create('a:b', 'no-sep', 'c:d');
    const parts = d.splitMultiline(/:/);
    // 3 pending Displays: the initial one (gets "a"), the one started after
    // the first match (accumulates "b", then the non-matching "no-sep",
    // then "c" from the second match's prefix), and the one started after
    // the second match (gets "d"). Matches upstream's own accumulation
    // exactly (java:584-597): a non-matching line always appends to
    // whichever `pending` is currently open, not a per-original-line split.
    expect(parts).toHaveLength(3);
    expect(parts[0]!.asList()).toEqual(['a']);
    expect(parts[1]!.asList()).toEqual(['b', 'no-sep', 'c']);
    expect(parts[2]!.asList()).toEqual(['d']);
  });

  it('splitMultiline with no match anywhere returns exactly one Display with all lines', () => {
    const d = Display.create('a', 'b');
    const parts = d.splitMultiline(/never-matches/);
    expect(parts).toHaveLength(1);
    expect(parts[0]!.asList()).toEqual(['a', 'b']);
  });

  it('toTooltipText returns the first line, or "" when empty (java:601-605)', () => {
    expect(Display.create('first', 'second').toTooltipText()).toBe('first');
    expect(Display.empty().toTooltipText()).toBe('');
  });

  it('hasSeveralGuideLines (instance) is true only with >1 line AND a guide-line marker (java:715-717,729-748)', () => {
    expect(Display.create('< a', 'b').hasSeveralGuideLines()).toBe(true);
    expect(Display.create('a', 'b').hasSeveralGuideLines()).toBe(false);
    expect(Display.create('< a').hasSeveralGuideLines()).toBe(false);
  });

  it('manageGuillemet rewrites <<...>> runs via the default guillemet pair (java:410-425)', () => {
    expect(Display.create('<<Foo>>').manageGuillemet(false).asList()).toEqual(['«Foo»']);
  });

  it('manageGuillemet strips a leading visibility character on the first line only, when requested', () => {
    expect(Display.create('-field', '-other').manageGuillemet(true).asList()).toEqual(['field', '-other']);
  });
});

describe('Display.hasSeveralGuideLines (static, String-splitting overload)', () => {
  it('splits on literal backslash-n and detects a leading/trailing guide marker (java:720-727)', () => {
    expect(Display.hasSeveralGuideLines('< a\\nb')).toBe(true);
    expect(Display.hasSeveralGuideLines('a\\nb')).toBe(false);
  });
});
