/**
 * ddc-T2d: `JsonParser.ts`, the port of minimal-json's `JsonParser` +
 * `Json.DefaultHandler`, against the Java it mirrors.
 *
 * Expected values cite `JsonParser.java` (J:<line>) and `JsonNumber.java`;
 * the whole-diagram consequences are pinned to the jar in
 * `ddc-t2d-jar.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { JsonNumber } from '../../../src/diagrams/json/JsonNumber.js';
import type { JsonObject } from '../../../src/diagrams/json/JsonObject.js';
import { jsonParse, ParseException } from '../../../src/diagrams/json/JsonParser.js';
import { plainOf } from '../../helpers/json-object.js';

const literalOf = (value: unknown): string => {
  expect(value).toBeInstanceOf(JsonNumber);
  return (value as JsonNumber).literal;
};

describe('numbers keep their literal text (JsonNumber.java:32-44)', () => {
  it.each(['1e10', '-12.5e3', '12345678901234567890', '1E5', '-0', '0.10', '1.0'])('%s is held as text', (literal) => {
    const value = jsonParse(literal);
    expect(literalOf(value)).toBe(literal);
    expect(String(value)).toBe(literal);
  });

  it.each(['7', '-3', '0.25', '0', '123456'])('%s, which String() reproduces, is a plain number', (literal) => {
    expect(jsonParse(literal)).toBe(Number(literal));
    expect(String(jsonParse(literal))).toBe(literal);
  });

  it('reads a leading zero as a complete number (J:373-379)', () => {
    expect(() => jsonParse('01')).toThrow(ParseException);
  });

  it.each(['-', '1.', '1e', '1e+', '.5', '+1'])('rejects the malformed number %s', (text) => {
    expect(() => jsonParse(text)).toThrow(ParseException);
  });
});

describe('strings (J:311-368)', () => {
  it('decodes every escape the parser lists', () => {
    expect(jsonParse(String.raw`"\"\/\\\b\f\n\r\tA"`)).toBe('"/\\\b\f\n\r\tA');
  });

  it('rejects an unknown escape, a short \\u and a raw control character', () => {
    expect(() => jsonParse(String.raw`"\x"`)).toThrow('Expected valid escape sequence');
    expect(() => jsonParse(String.raw`"\u12G4"`)).toThrow('Expected hexadecimal digit');
    expect(() => jsonParse('"a\tb"')).toThrow('Expected valid string character');
  });

  it('reports an unterminated string as an unexpected end of input', () => {
    expect(() => jsonParse('"abc')).toThrow('Unexpected end of input');
  });
});

describe('structure (J:187-252)', () => {
  it('rejects a trailing comma in an object and in an array', () => {
    expect(() => jsonParse('{ "a": 1, }')).toThrow('Expected name');
    expect(() => jsonParse('[1, ]')).toThrow('Expected value');
  });

  it('keeps duplicate members, in source order (Json.java:377-378)', () => {
    const value = jsonParse('{"b": 1, "10": 2, "b": 3}') as JsonObject;
    expect(value.members()).toEqual([
      ['b', 1],
      ['10', 2],
      ['b', 3],
    ]);
  });

  it('parses nested containers and the three literals', () => {
    expect(plainOf(jsonParse('{"a": [true, false, null, {"b": []}]}'))).toEqual({
      a: [true, false, null, { b: [] }],
    });
  });

  it('accepts // comments between object members only (J:230-232, 245-247)', () => {
    expect(plainOf(jsonParse('{ // lead\n "a": 1 // tail\n , "b": 2 }'))).toEqual({ a: 1, b: 2 });
    expect(() => jsonParse('[1, // no\n 2]')).toThrow(ParseException);
  });

  it('requires a second slash after the first (J:257-258)', () => {
    expect(() => jsonParse('{ /x "a": 1 }')).toThrow('Expected Error in comment');
  });

  it('fails a comment that never ends instead of reading past the text', () => {
    expect(() => jsonParse('{ "a": 1 // x')).toThrow('Unexpected end of input');
  });

  it('rejects trailing content and missing separators (J:140-145, 209, 249)', () => {
    expect(() => jsonParse('{} x')).toThrow('Unexpected character');
    expect(() => jsonParse('[1 2]')).toThrow("Expected ',' or ']'");
    expect(() => jsonParse('{"a" 1}')).toThrow("Expected ':'");
    expect(() => jsonParse('{"a": 1 "b"}')).toThrow("Expected ',' or '}'");
  });

  it('rejects an empty text and a bad literal (J:148-185, 272-299)', () => {
    expect(() => jsonParse('')).toThrow('Unexpected end of input');
    expect(() => jsonParse('nulx')).toThrow("Expected 'l'");
    expect(() => jsonParse('trux')).toThrow("Expected 'e'");
    expect(() => jsonParse('falsy')).toThrow("Expected 'e'");
    expect(() => jsonParse('nul')).toThrow('Unexpected end of input');
  });

  it('stops at a nesting level of 1000 (J:38, 190-192)', () => {
    expect(() => jsonParse('['.repeat(1000) + ']'.repeat(1000))).not.toThrow();
    expect(() => jsonParse('['.repeat(1001) + ']'.repeat(1001))).toThrow('Nesting too deep');
  });

  it('carries the offset of the failure', () => {
    try {
      jsonParse('{"a": }');
      expect.unreachable();
    } catch (error) {
      expect((error as ParseException).offset).toBe(6);
    }
  });
});
