import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';

// ---------------------------------------------------------------------------
// Fix A: parseIdDisplay's `as` alias forms
//
// Upstream (command/NameAndCodeParser.java:52-67,
// nameAndCodeForClassWithGeneric) recognizes exactly two `as`-alias forms —
// the display side is ALWAYS quoted:
//   1. `"DISPLAY" as CODE`
//   2. `CODE as "DISPLAY"`
// Bareword-both-sides (`class Foo as Bar`) is a SYNTAX ERROR upstream
// (live-oracle-verified: renders "Syntax Error?"); see parser.test.ts's
// "unquoted alias (bareword-both-sides leniency)" describe block for our
// deliberate backward-compat divergence on that invalid form.
// ---------------------------------------------------------------------------

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

function firstClassifier(source: string): Classifier {
  const ast = parse(source);
  const c = ast.classifiers[0];
  if (c === undefined) throw new Error('Expected at least one classifier');
  return c;
}

describe('classifier — `"DISPLAY" as CODE` (quoted-display-first)', () => {
  it('class "Display One" as Code1 → id=Code1, display=Display One', () => {
    const c = firstClassifier('class "Display One" as Code1');
    expect(c.id).toBe('Code1');
    expect(c.display).toBe('Display One');
  });

  it('interface "I Base" as IB → id=IB, display=I Base', () => {
    const c = firstClassifier('interface "I Base" as IB');
    expect(c.id).toBe('IB');
    expect(c.display).toBe('I Base');
  });
});

// ---------------------------------------------------------------------------
// T5b (jixipo-21-mefu703/zivenu-37-nace681 secondary, class-decl-as-case-
// sensitive): every regex-DSL `RegexLeaf` literal compiles case-insensitively
// (`regex/Pattern2.java:112-114`, `Pattern.compile(regex,
// Pattern.CASE_INSENSITIVE)`) -- upstream's "as" keyword literal
// (`command/NameAndCodeParser.java:57,63,76,81`) matches "AS"/"As"/"aS" too.
// ---------------------------------------------------------------------------

describe('classifier — `as` keyword is case-insensitive (Pattern2.java:112-114)', () => {
  it('class TRES AS "something" (uppercase AS, quoted-display-second)', () => {
    const c = firstClassifier('class TRES AS "something"');
    expect(c.id).toBe('TRES');
    expect(c.display).toBe('something');
  });

  it('class "something" AS TRES (uppercase AS, quoted-display-first)', () => {
    const c = firstClassifier('class "something" AS TRES');
    expect(c.id).toBe('TRES');
    expect(c.display).toBe('something');
  });

  it('mixed-case "As" is also recognized', () => {
    const c = firstClassifier('class Code1 As "Display One"');
    expect(c.id).toBe('Code1');
    expect(c.display).toBe('Display One');
  });
});

// ---------------------------------------------------------------------------
// T5b regression (jixipo-21-mefu703, found while verifying the case-
// insensitive fix above): a quoted alias display containing its OWN literal
// `[[...]]` text (a creole url the classifier-level display draws later)
// must NOT be treated as the classifier's own trailing url decoration --
// `extractDecorations`'s un-anchored `[[...]]` strip previously matched it
// anywhere in the remainder, including inside the quotes, emptying the
// display to `""` and tripping `parseClassifierDecl`'s `display === ''`
// rejection -- which orphaned every later body line ("Syntax Error?").
// Before this fix, `class TRES as "..."` (lowercase "as", ALREADY
// reachable pre-T5b) hit this same defect; the case-insensitive fix above
// only made the uppercase `AS` form reach it too.
// ---------------------------------------------------------------------------

describe('classifier — a quoted alias\'s own [[...]] text is not stripped as a decoration (T5b)', () => {
  it('class TRES as "[[url label]]" keeps the bracket text in display, not treated as a url decoration', () => {
    const c = firstClassifier('class TRES as "[[http://www.plantuml.com tres]]"');
    expect(c.id).toBe('TRES');
    expect(c.display).toBe('[[http://www.plantuml.com tres]]');
    expect(c.url).toBeUndefined();
  });

  it('a REAL trailing url decoration (outside quotes) is still extracted', () => {
    const c = firstClassifier('class Foo [[http://example.com]]');
    expect(c.id).toBe('Foo');
    expect(c.url).toEqual({
      url: 'http://example.com',
      tooltip: 'http://example.com',
      label: 'http://example.com',
    });
  });

  it('a real url decoration after a quoted-display-first alias is still extracted', () => {
    const c = firstClassifier('class "Display" as Code [[http://example.com]]');
    expect(c.id).toBe('Code');
    expect(c.display).toBe('Display');
    expect(c.url).toEqual({
      url: 'http://example.com',
      tooltip: 'http://example.com',
      label: 'http://example.com',
    });
  });

  it('the full jixipo-21-mefu703 TRES declaration (with stereotype + body) parses, no Syntax Error page', () => {
    const ast = parse(
      'class TRES AS "[[http://www.plantuml.com tres]]" <<otro>> {\n* aaa\n+ [[otro modelo]]\n- bb\n}',
    );
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.classifiers[0]!.id).toBe('TRES');
    expect(ast.classifiers[0]!.display).toBe('[[http://www.plantuml.com tres]]');
    expect(ast.classifiers[0]!.members).toHaveLength(3);
  });
});

describe('classifier — `CODE as "DISPLAY"` (quoted-display-second)', () => {
  it('class Code1 as "Display One" → id=Code1, display=Display One', () => {
    const c = firstClassifier('class Code1 as "Display One"');
    expect(c.id).toBe('Code1');
    expect(c.display).toBe('Display One');
  });

  it('interface IB as "I Base" → id=IB, display=I Base', () => {
    const c = firstClassifier('interface IB as "I Base"');
    expect(c.id).toBe('IB');
    expect(c.display).toBe('I Base');
  });

  it('single-word quoted display: class Code1 as "Display" → id=Code1, display=Display', () => {
    // Regression guard: a single-word quoted display (no internal space)
    // also matches \S+, so it must not be misassigned by the bareword
    // fallback — this was the exact form that motivated Fix A
    // (besepi-37-rori892, begico-70-guva302).
    const c = firstClassifier('class Code1 as "Display"');
    expect(c.id).toBe('Code1');
    expect(c.display).toBe('Display');
  });
});

// ---------------------------------------------------------------------------
// Fix D: `scale` directive must never be parsed as a relationship.
//
// Upstream's CommandScale + siblings (CommandScaleWidthAndHeight, ...) are
// registered globally via CommonCommands.java — structurally inert for class
// LAYOUT (D4: scale is resolved at the layout->render boundary, `layoutClass`,
// never re-derives node/edge positions). Without the ignore rule, `scale .5`
// tokenizes as a phantom classifier chain (`scale`, `.->`, `5`) plus a
// minlen-0 edge (corine-48-pemu761). cdd-T29 additionally captures the
// directive into `ast.scale` (no longer a bare no-op) — see D4,
// `plans/class-divergence-drive/decisions.md`.
// ---------------------------------------------------------------------------

describe('classifier — `scale` directive is captured, never parsed as a relationship', () => {
  it('scale .5 produces no classifiers and no relationships, and sets ast.scale', () => {
    const ast = parse('class A\nscale .5\nclass B');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.relationships).toEqual([]);
    expect(ast.scale).toEqual({ kind: 'simple', factor: 0.5 });
  });

  it('scale 200*100 (width*height form) sets ast.scale, no phantom classifiers', () => {
    const ast = parse('class A\nscale 200*100\nclass B');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.relationships).toEqual([]);
    expect(ast.scale).toEqual({ kind: 'widthAndHeight', width: 200, height: 100 });
  });

  it('scale 200 width (single-dimension form) sets ast.scale, no phantom classifiers', () => {
    const ast = parse('class A\nscale 200 width\nclass B');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.relationships).toEqual([]);
    expect(ast.scale).toEqual({ kind: 'width', target: 200 });
  });

  it('scale max 300*200 (max-clamped form) sets ast.scale, no phantom classifiers', () => {
    const ast = parse('class A\nscale max 300*200\nclass B');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.relationships).toEqual([]);
    expect(ast.scale).toEqual({ kind: 'maxWidthAndHeight', width: 300, height: 200 });
  });

  it('an unrecognized scale line (scale 0) leaves ast.scale unset', () => {
    const ast = parse('class A\nscale 0\nclass B');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.scale).toBeUndefined();
  });
});
