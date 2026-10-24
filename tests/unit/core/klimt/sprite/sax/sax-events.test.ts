import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  parseSaxEvents,
  SaxParseError,
  type SaxAttributes,
  type SaxHandler,
} from '../../../../../../src/core/klimt/sprite/sax/sax-events.js';

/** Collects the event stream as flat strings. */
function collect(xml: string): string[] {
  const events: string[] = [];
  const handler: SaxHandler = {
    startElement(qName: string, attrs: SaxAttributes): void {
      const list: string[] = [];
      for (let i = 0; i < attrs.length; i++) list.push(`${attrs.qName(i)}=${attrs.value(i)}`);
      events.push(`start ${qName}${list.length > 0 ? ` ${list.join(',')}` : ''}`);
    },
    endElement(qName: string): void {
      events.push(`end ${qName}`);
    },
    characters(text: string): void {
      events.push(`chars ${text}`);
    },
  };
  parseSaxEvents(xml, handler);
  return events;
}

describe('parseSaxEvents', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits document-order events; text and CDATA are separate characters calls', () => {
    // SvgSaxParser.java:159-175 parseSvg drives startElement/characters/endElement.
    expect(collect('<svg><g id="a"><text>x<![CDATA[y]]></text></g></svg>')).toEqual([
      'start svg',
      'start g id=a',
      'start text',
      'chars x',
      'chars y',
      'end text',
      'end g',
      'end svg',
    ]);
  });

  it('keeps attribute source order and get() is exact-name', () => {
    let seen: SaxAttributes | undefined;
    parseSaxEvents('<use b="1" a="2" xlink:href="#z" xmlns:xlink="http://www.w3.org/1999/xlink"/>', {
      startElement(_q, attrs) {
        seen = attrs;
      },
    });
    expect(seen?.length).toBe(3);
    expect(seen?.qName(0)).toBe('b');
    expect(seen?.qName(1)).toBe('a');
    expect(seen?.value(1)).toBe('2');
    expect(seen?.get('a')).toBe('2');
    expect(seen?.get('xlink:href')).toBe('#z');
    expect(seen?.get('href')).toBeUndefined();
    expect(seen?.get('missing')).toBeUndefined();
    expect(seen?.qName(9)).toBe('');
    expect(seen?.value(9)).toBe('');
  });

  it('reports prefixed names as written and hides xmlns declarations (namespace-prefixes=false, SvgSaxParser.java:161)', () => {
    expect(collect('<s:svg xmlns:s="http://www.w3.org/2000/svg"><s:g/></s:svg>')).toEqual([
      'start s:svg',
      'start s:g',
      'end s:g',
      'end s:svg',
    ]);
  });

  it('decodes entities in text', () => {
    expect(collect('<a>1 &lt; 2 &amp; 3</a>')).toEqual(['start a', 'chars 1 < 2 & 3', 'end a']);
  });

  it('emits nothing for comments and processing instructions', () => {
    expect(collect('<?xml version="1.0"?><a><!-- c --><?pi data?>t</a>')).toEqual(['start a', 'chars t', 'end a']);
  });

  it('accepts an empty handler object', () => {
    expect(() => parseSaxEvents('<a><b/></a>', {})).not.toThrow();
  });

  it('throws SaxParseError on a mismatched tag, silently', () => {
    const spies = (['log', 'warn', 'error'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => undefined),
    );
    expect(() => parseSaxEvents('<svg><g></svg>', {})).toThrow(SaxParseError);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('throws SaxParseError on a warning-level problem (unterminated attribute)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => parseSaxEvents('<a b=c></a>', {})).toThrow(SaxParseError);
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses DOCTYPE before xmldom sees it', () => {
    // SvgSaxParser.java:163 disallow-doctype-decl.
    const xml = '<!DOCTYPE svg [<!ENTITY x "y">]><svg>&x;</svg>';
    expect(() => parseSaxEvents(xml, {})).toThrow(SaxParseError);
    expect(() => parseSaxEvents(xml, {})).toThrow(/DOCTYPE/);
    expect(() => parseSaxEvents('<svg><!DOCTYPE x></svg>', {})).toThrow(SaxParseError);
  });

  it('throws SaxParseError for empty input and keeps the xmldom cause', () => {
    expect(() => parseSaxEvents('', {})).toThrow(SaxParseError);
    let caught: unknown;
    try {
      parseSaxEvents('<svg><g></svg>', {});
    } catch (err) {
      caught = err;
    }
    expect((caught as SaxParseError).cause).toBeInstanceOf(Error);
  });

  it('accepts the DOCTYPE marker inside a comment', () => {
    // SvgSaxParser.java:163 refuses only a real declaration token.
    expect(collect('<a><!-- <!DOCTYPE x> --><b/></a>')).toEqual(['start a', 'start b', 'end b', 'end a']);
  });

  it('accepts the DOCTYPE marker inside CDATA and delivers the text', () => {
    expect(collect('<a><![CDATA[<!DOCTYPE x>]]></a>')).toEqual(['start a', 'chars <!DOCTYPE x>', 'end a']);
  });

  it('accepts the DOCTYPE marker inside a processing instruction', () => {
    expect(collect('<a><?pi <!DOCTYPE x> ?></a>')).toEqual(['start a', 'end a']);
  });

  it('refuses a real DOCTYPE after a skipped comment and before the root', () => {
    expect(() => parseSaxEvents('<!-- c --><!DOCTYPE svg><svg/>', {})).toThrow(SaxParseError);
  });

  it('tolerates an unterminated comment (xmldom then reports it)', () => {
    expect(() => parseSaxEvents('<a><!-- <!DOCTYPE x>', {})).toThrow(/Malformed XML/);
  });

  it('SaxParseError is an Error with its own name', () => {
    const err = new SaxParseError('x');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SaxParseError');
  });
});
