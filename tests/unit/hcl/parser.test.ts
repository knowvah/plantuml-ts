import { describe, it, expect } from 'vitest';
import { isDisplayPositionedNull } from '../../../src/core/annotations/index.js';
import { parseHcl } from '../../../src/diagrams/hcl/parser.js';
import { extractBlocks } from '../../../src/core/block-extractor.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

// ---------------------------------------------------------------------------
// Helper: build a UmlSource from an array of lines
// ---------------------------------------------------------------------------

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'hcl' };
}

// ---------------------------------------------------------------------------
// Acceptance criteria (1-8 from task spec)
// ---------------------------------------------------------------------------

describe('parseHcl — acceptance criteria', () => {
  // HclParser.java:77-89: a top-level entry must be names then `{`; an `=`
  // throws at :88 and the jar draws the "does not sound like HCL data" page
  // (unwind2-S2, jar: tests/fixtures/unwind2-S2/hcl-top-assign-*).
  it('AC1: top-level key=value pairs are a parse failure, as in the jar', () => {
    const src = makeSource(['key = "value"', 'key2 = "value2"']);
    const ast = parseHcl(src);
    expect(ast.parseError).toBe(true);
    expect(ast.root).toBeNull();
    expect(ast.highlights).toEqual([]);
  });

  it('AC2: block with quoted name parts — quoted strings included in name with space separator', () => {
    // Java behavior: single-entry map → unwrap to the value (inner object).
    // The block name "resource \"aws_s3_bucket\" \"b\"" is correct but gets
    // unwrapped since it is the only top-level entry.
    const src = makeSource(['resource "aws_s3_bucket" "b" {', '  bucket = "test"', '}']);
    const ast = parseHcl(src);
    // Single-entry map → unwrapped → inner object
    expect(ast.root).toEqual({ bucket: 'test' });
  });

  it('AC3: comment lines (starting with #) are stripped', () => {
    const src = makeSource(['# this is a comment', 'r {', 'key = "value"', '}']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({ key: 'value' });
  });

  it('AC4a: function with args is stored as { "fn()": [...args] }', () => {
    const src = makeSource(['resource "x" {', '  result = fn("a", "b")', '}']);
    const ast = parseHcl(src);
    // Single-entry map → unwrapped → the inner bracket object
    const inner = ast.root as Record<string, unknown>;
    // The result field holds a { "fn()": ["a", "b"] } object
    expect(inner['result']).toEqual({ 'fn()': ['a', 'b'] });
  });

  it('AC4b: no-arg function is stored as string "fn()"', () => {
    const src = makeSource(['resource "x" {', '  result = noop()', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['result']).toBe('noop()');
  });

  it('AC5: for expression inside array produces empty array []', () => {
    // The for-expression tokens are all STRING_SIMPLE (silently ignored)
    const src = makeSource(['resource "x" {', '  tags = [for k in list : k]', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['tags']).toEqual([]);
  });

  it('AC6: extractBlocks assigns type "hcl" to @starthcl blocks', () => {
    const blocks = extractBlocks(['@starthcl', 'key = "val"', '@endhcl']);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.type).toBe('hcl');
  });

  it('AC7: <style> blocks are stripped before parsing', () => {
    const src = makeSource(['<style>', 'node { color: red }', '</style>', 'r {', 'key = "val"', '}']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({ key: 'val' });
  });

  it('AC8: a leading title is consumed but never set (HclDiagramFactory.java:86-92)', () => {
    // StyleExtractor.java:84-85 takes the line; the hcl factory's setTitle
    // block is commented out, so no chrome (jar: unwind-U1/hcl-title).
    const src = makeSource(['title My Title', 'r {', 'key = "val"', '}']);
    const ast = parseHcl(src);
    expect(isDisplayPositionedNull(ast.annotations!.title)).toBe(true);
    expect(ast.root).toEqual({ key: 'val' });
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case tests
// ---------------------------------------------------------------------------

describe('parseHcl — additional cases', () => {
  // An empty payload parses: HclParser#parseMe returns an empty JsonObject
  // (HclParser.java:61-75), which JsonDiagram.java:83-86 draws as one empty
  // cell (jar: unwind-U1/hcl-title-only).
  it('empty source → root is an empty object', () => {
    const ast = parseHcl(makeSource([]));
    expect(ast.root).toEqual({});
    expect(ast.parseError).toBe(false);
  });

  it('blank-only source → root is an empty object', () => {
    const ast = parseHcl(makeSource(['', '  ', '']));
    expect(ast.root).toEqual({});
  });

  it('single top-level block with one child → root is the child object directly (unwrapped)', () => {
    const src = makeSource(['module "vpc" {', '  cidr = "10.0.0.0/8"', '}']);
    const ast = parseHcl(src);
    // map has exactly 1 entry → value returned directly (not wrapped)
    expect(ast.root).toEqual({ cidr: '10.0.0.0/8' });
  });

  it('multiple top-level blocks → root is an object with block names as keys', () => {
    const src = makeSource(['module "a" { x = "1" }', 'module "b" { y = "2" }']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({
      'module "a"': { x: '1' },
      'module "b"': { y: '2' },
    });
  });

  it('nested object value obj = { a = "1" }', () => {
    const src = makeSource(['resource "r" {', '  obj = { a = "1" }', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['obj']).toEqual({ a: '1' });
  });

  it('array of strings list = ["a", "b"]', () => {
    const src = makeSource(['resource "r" {', '  list = ["a", "b"]', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['list']).toEqual(['a', 'b']);
  });

  it('array of objects items = [{ name = "x" }]', () => {
    const src = makeSource(['resource "r" {', '  items = [{ name = "x" }]', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['items']).toEqual([{ name: 'x' }]);
  });

  it('variable reference var.bucket_name → stored as string', () => {
    const src = makeSource(['resource "r" {', '  path = var.bucket_name', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['path']).toBe('var.bucket_name');
  });

  it('string interpolation "${var.host}/path" → stored verbatim', () => {
    const src = makeSource(['resource "r" {', '  url = "${var.host}/path"', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['url']).toBe('${var.host}/path');
  });

  it('ternary expression causes parse failure → root is null', () => {
    // cond ? "a" : "b" — PARENTHESIS_OPEN with empty pending → throw → null
    const src = makeSource(['resource "r" {', '  x = cond ? "a" : "b"', '}']);
    const ast = parseHcl(src);
    expect(ast.root).toBeNull();
    // HclDiagramFactory.java:79-83 + JsonDiagram.java:116-122: the jar draws
    // "Your data does not sound like HCL data" for this source (unwind-U1).
    expect(ast.parseError).toBe(true);
  });

  it('highlights is always empty []', () => {
    const ast = parseHcl(makeSource(['r {', 'key = "val"', '}']));
    expect(ast.highlights).toEqual([]);
  });

  it('@starthcl/@endhcl wrapper lines inside source.lines are stripped', () => {
    const src = makeSource(['@starthcl', 'r {', 'key = "val"', '}', '@endhcl']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({ key: 'val' });
  });

  it('key with colon separator (TWO_POINTS) instead of equals', () => {
    const src = makeSource(['resource "r" {', '  key : "value"', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['key']).toBe('value');
  });

  it('multiple key=value pairs inside one block produce a flat object', () => {
    const src = makeSource(['r {', 'a = "1"', 'b = "2"', 'c = "3"', '}']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({ a: '1', b: '2', c: '3' });
  });

  // HclParser.java:235: `Character.isSpaceChar` -- a TAB is not a space, so
  // it stays in the field name (jar: unwind2-S2/hcl-tab-indent).
  it('a tab is part of the token, not a separator', () => {
    const ast = parseHcl(makeSource(['r {', '\ta = "1"', '}']));
    expect(ast.root).toEqual({ '\ta': '1' });
  });

  // HclParser.java:188-216 flushes a pending string only when a symbol
  // follows it, so trailing text is dropped (jar: unwind2-S2/hcl-trailing-token).
  it('trailing text after the last symbol is dropped', () => {
    const ast = parseHcl(makeSource(['r {', '  a = "1"', '}', 'foo']));
    expect(ast.parseError).toBe(false);
    expect(ast.root).toEqual({ a: '1' });
  });

  it('skinparam directive before body is stripped', () => {
    const src = makeSource(['skinparam backgroundColor white', 'r {', 'key = "val"', '}']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({ key: 'val' });
  });

  it('blank lines within body are preserved (do not restart)', () => {
    // Body already started; blank lines between blocks should not affect parsing
    const src = makeSource(['module "a" { x = "1" }', '', 'module "b" { y = "2" }']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({
      'module "a"': { x: '1' },
      'module "b"': { y: '2' },
    });
  });

  it('function with multiple args — COMMA sentinel handled correctly', () => {
    // Tests the COMMA sentinel branch inside getFunctionData
    const src = makeSource(['resource "r" {', '  result = format("hello %s", "world")', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['result']).toEqual({ 'format()': ['hello %s', 'world'] });
  });

  it('top-level block with only a quoted name part (STRING_QUOTED in getModuleOrSomething)', () => {
    // Exercise the STRING_QUOTED branch in getModuleOrSomething
    const src = makeSource(['"myblock" {', '  x = "1"', '}']);
    const ast = parseHcl(src);
    // Single entry → unwrapped
    expect(ast.root).toEqual({ x: '1' });
  });

  it('escaped quote in string value', () => {
    const src = makeSource(['resource "r" {', '  msg = "say \\"hello\\""', '}']);
    const ast = parseHcl(src);
    const inner = ast.root as Record<string, unknown>;
    expect(inner['msg']).toBe('say "hello"');
  });

  it('unexpected token at module level causes parse failure → root is null', () => {
    // An EQUALS or bracket at the outermost module-name-reading position
    // (before we see a CURLY_BRACKET_OPEN) triggers the error branch in
    // getModuleOrSomething. This exercises line 241-242.
    // A block name followed by SQUARE_BRACKET_OPEN instead of "{".
    const src = makeSource(['blockname [']);
    const ast = parseHcl(src);
    expect(ast.root).toBeNull();
    // HclParser.java:88 throws; the jar draws the "does not sound like HCL
    // data" page (HclDiagramFactory.java:79-83, unwind-U1).
    expect(ast.parseError).toBe(true);
  });

  it('whitespace-only body → empty object', () => {
    // tokenize returns [] for a space-only body; parseMe's map is empty.
    const src = makeSource(['   ']);
    const ast = parseHcl(src);
    expect(ast.root).toEqual({});
  });

  it('unexpected token in bracket data field-name position → parse failure', () => {
    // Inside a bracket block, a non-STRING token at the field-name position
    // triggers the error branch in getBracketData (lines 188-189).
    // Use "]" inside a block: resource "r" { ] }
    // "]" is SQUARE_BRACKET_CLOSE — not STRING_SIMPLE, STRING_QUOTED, or
    // CURLY_BRACKET_CLOSE, so it hits the else-throw.
    const src = makeSource(['resource "r" { ] }']);
    const ast = parseHcl(src);
    expect(ast.root).toBeNull();
  });

  it('unexpected token type in getValue throws → parse failure', () => {
    // A CURLY_BRACKET_CLOSE appearing where a value is expected triggers
    // the throw in getValue (line 203). Construct: key = } (malformed block).
    const src = makeSource(['resource "r" {', '  key = }', '}']);
    const ast = parseHcl(src);
    // CURLY_BRACKET_CLOSE is handled by getBracketData, not getValue,
    // so this will actually end the bracket early. Let's try a different
    // approach: SQUARE_BRACKET_CLOSE as a value.
    // Actually CURLY_BRACKET_CLOSE closes the bracket — no error.
    // Use TWO_POINTS as the value: key = : — TWO_POINTS hits the throw.
    const src2 = makeSource(['resource "r" {', '  key = :', '}']);
    const ast2 = parseHcl(src2);
    expect(ast2.root).toBeNull();
    // Suppress unused src/ast
    void src;
    void ast;
  });
});
