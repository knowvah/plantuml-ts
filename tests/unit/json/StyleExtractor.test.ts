/**
 * `extractStyle` -- the port of upstream's `StyleExtractor`, the json family's
 * only directive handling.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/StyleExtractor.java:63-103
 */
import { describe, it, expect } from 'vitest';
import { extractStyle, payloadOf, upstreamSourceLines } from '../../../src/diagrams/json/StyleExtractor.js';

describe('extractStyle (StyleExtractor.java:63-103)', () => {
  it('keeps @start/@end and payload in list, untrimmed, skipping blank lines', () => {
    const x = extractStyle(['@startjson', '', '  { "a": 1 }', '@endjson']);
    expect(x.list).toEqual(['@startjson', '  { "a": 1 }', '@endjson']);
    expect(payloadOf(x)).toEqual(['  { "a": 1 }']);
  });

  it('reads title/scale/skin before the payload (:82-87)', () => {
    const x = extractStyle(['@startjson', 'title  My Title ', 'scale 2', 'skin rose', '{}', '@endjson']);
    expect(x.title).toBe('My Title');
    expect(x.scale).toBe('scale 2');
    expect(x.newSkin).toBe('rose');
    expect(payloadOf(x)).toEqual(['{}']);
  });

  it('keeps the title text raw -- quotes are not stripped', () => {
    expect(extractStyle(['@startjson', 'title "Q"', '{}', '@endjson']).title).toBe('"Q"');
  });

  it('treats every directive after the first payload line as payload (list.size() <= 1)', () => {
    const x = extractStyle(['@startjson', '{}', 'title Late', 'skinparam a b', '@endjson']);
    expect(x.title).toBeUndefined();
    expect(payloadOf(x)).toEqual(['{}', 'title Late', 'skinparam a b']);
  });

  it('treats caption/legend/header/footer/mainframe/sprite/bare title as payload', () => {
    const lines = ['caption c', 'legend l', 'header h', 'footer f', 'mainframe m', 'sprite $s [1x1/16] {', 'title'];
    for (const l of lines) expect(payloadOf(extractStyle(['@startjson', l, '@endjson']))).toEqual([l]);
  });

  it('ignores !assume / !pragma / hide (:76-81)', () => {
    const x = extractStyle(['@startjson', '!assume x', '!pragma y z', 'hide a', '{}', '@endjson']);
    expect(payloadOf(x)).toEqual(['{}']);
  });

  it('honours only `handwritten true` among skinparams (:88-90)', () => {
    expect(extractStyle(['@startjson', 'skinparam handwritten true', '@endjson']).handwritten).toBe(true);
    expect(extractStyle(['@startjson', 'skinparam handwritten false', '@endjson']).handwritten).toBe(false);
    expect(extractStyle(['@startjson', 'skinparam backgroundColor red', '@endjson']).list).toEqual([
      '@startjson',
      '@endjson',
    ]);
  });

  it('drops a skinparam block through its closing brace, handwritten inside it ignored (:91-97)', () => {
    const x = extractStyle(['@startjson', 'skinparam {', ' handwritten true', ' }', '{}', '@endjson']);
    expect(x.handwritten).toBe(false);
    expect(payloadOf(x)).toEqual(['{}']);
  });

  it('an unclosed skinparam block swallows the rest of the source', () => {
    expect(extractStyle(['@startjson', 'skinparam x {', '{}', '@endjson']).list).toEqual(['@startjson']);
  });

  it('skips <style> blocks anywhere, even after the payload (:69-75)', () => {
    const x = extractStyle(['@startjson', '{}', '<style>', 'a { b c }', '</style>', '@endjson']);
    expect(payloadOf(x)).toEqual(['{}']);
  });

  it('a lone <style> on the last line consumes nothing past itself', () => {
    expect(extractStyle(['@startjson', '<style>']).list).toEqual(['@startjson']);
  });
});

describe('upstreamSourceLines', () => {
  it('prefers seedSourceLines (UmlSource#iterator2)', () => {
    expect(upstreamSourceLines({ lines: ['x'], seedSourceLines: ['@startyaml', 'y', '@endyaml'] }, 'yaml')).toEqual([
      '@startyaml',
      'y',
      '@endyaml',
    ]);
  });

  it('restores missing wrapper lines on a hand-built source', () => {
    expect(upstreamSourceLines({ lines: ['a: 1'] }, 'yaml')).toEqual(['@startyaml', 'a: 1', '@endyaml']);
    expect(upstreamSourceLines({ lines: ['@starthcl', 'a', '@endhcl'] }, 'hcl')).toEqual(['@starthcl', 'a', '@endhcl']);
    expect(upstreamSourceLines({ lines: [] }, 'json')).toEqual(['@startjson', '@endjson']);
    // Blank lines never reach `list`, so the wrapper test skips them; the
    // block extractor matches @start/@end in any case.
    expect(upstreamSourceLines({ lines: ['@STARTJSON', '{}', '@ENDJSON', ''] }, 'json')).toEqual([
      '@STARTJSON',
      '{}',
      '@ENDJSON',
      '',
    ]);
  });
});
