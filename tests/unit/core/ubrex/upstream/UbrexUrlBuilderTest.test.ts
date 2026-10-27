import { describe, expect, it } from 'vitest';
import { UbrexUrlBuilder } from '../../../../../src/core/url/UbrexUrlBuilder.js';
import type { UrlMode } from '../../../../../src/core/url/UrlMode.js';

// Port of ~/git/plantuml/src/test/java/net/sourceforge/plantuml/url/UbrexUrlBuilderTest.java.
// One @ParameterizedTest / @CsvSource of 20 rows (lines 11-30) -> one it.each of 20 rows.
// CsvSource semantics: unquoted values trimmed, '...' keeps whitespace, '' is the empty string.
// Row: [javaLine, input, mode, url, tooltip, label]
type Row = readonly [number, string, UrlMode, string, string, string];
const ROWS: readonly Row[] = [
  [11, '[[http://foo]]', 'STRICT', 'http://foo', 'http://foo', 'http://foo'],
  [12, '[[http://foo{tooltip} text]]', 'STRICT', 'http://foo', 'tooltip', 'text'],
  [13, '[[http://foo {tooltip} text]]', 'STRICT', 'http://foo', 'tooltip', 'text'],
  [14, '[[http://foo {tooltip}]]', 'STRICT', 'http://foo', 'tooltip', 'http://foo'],
  [15, '[[http://foo text]]', 'STRICT', 'http://foo', 'http://foo', 'text'],
  [16, '[[  http://foo  ]]', 'STRICT', 'http://foo', 'http://foo', 'http://foo'],
  [17, '[["http://foo text"]]', 'STRICT', 'http://foo text', 'http://foo text', 'http://foo text'],
  [18, 'start [["http://foo test"]] end', 'ANYWHERE', 'http://foo test', 'http://foo test', 'http://foo test'],
  [
    19,
    '[[http://google.com{a nice toolip} <img:HelloWorld.png{scale=2}>]]',
    'STRICT',
    'http://google.com',
    'a nice toolip',
    '<img:HelloWorld.png{scale=2}>',
  ],
  [
    20,
    '[[http://google.com {a nice toolip} <img:HelloWorld.png{scale=2}>]]',
    'STRICT',
    'http://google.com',
    'a nice toolip',
    '<img:HelloWorld.png{scale=2}>',
  ],
  [
    21,
    '[[http://google.com <img:HelloWorld.png{scale=2}>]]',
    'STRICT',
    'http://google.com',
    'http://google.com',
    '<img:HelloWorld.png{scale=2}>',
  ],
  [
    22,
    '[[http://foo?dummy={123}&action=edit]]',
    'STRICT',
    'http://foo?dummy={123}&action=edit',
    'http://foo?dummy={123}&action=edit',
    'http://foo?dummy={123}&action=edit',
  ],
  [
    23,
    '[[http://www.plantuml.com{Json: {"firstName":"Bob", "lastName":"Smith"}}]]',
    'STRICT',
    'http://www.plantuml.com',
    'Json: {"firstName":"Bob", "lastName":"Smith"}',
    'http://www.plantuml.com',
  ],
  [24, '[[http://foo?dummy={123}z{}]]', 'STRICT', 'http://foo?dummy=', '123}z{', 'http://foo?dummy='],
  [25, '[[{tooltip} some text]]', 'STRICT', '', 'tooltip', 'some text'],
  [
    26,
    'fromor [[www.google.com POST /session/csrStart]] end',
    'ANYWHERE',
    'www.google.com',
    'www.google.com',
    'POST /session/csrStart',
  ],
  [27, '[[ blaha(xyz,12){ tooltip } ]]', 'STRICT', 'blaha(xyz,12)', ' tooltip ', 'blaha(xyz,12)'],
  [
    28,
    '[[{Json: {"firstName":"Bob", "lastName":"Smith"}}]]',
    'STRICT',
    '',
    'Json: {"firstName":"Bob", "lastName":"Smith"}',
    '',
  ],
  [29, '[[http://foo?dummy={123}{}]]', 'STRICT', 'http://foo?dummy=', '123}{', 'http://foo?dummy='],
  [30, '[["http://foo?dummy={123}"{}]]', 'STRICT', 'http://foo?dummy={123}', '', 'http://foo?dummy={123}'],
];

describe('UbrexUrlBuilderTest', () => {
  it('has the 20 CsvSource rows (UbrexUrlBuilderTest.java:11-30)', () => {
    expect(ROWS.map((r) => r[0])).toEqual(Array.from({ length: 20 }, (_, i) => i + 11));
  });

  it.each(ROWS)('testUrl row at UbrexUrlBuilderTest.java:%i (%s)', (_line, input, urlMode, urlLink, tooltip, label) => {
    const b = new UbrexUrlBuilder(null, urlMode);
    const url = b.getUrl(input);
    expect(url?.getUrl()).toBe(urlLink); // :35
    expect(url?.getTooltip()).toBe(tooltip); // :36
    expect(url?.getLabel()).toBe(label); // :37
  });
});
