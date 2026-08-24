/**
 * Object-diagram parsing behavior, ported to exercise the class engine
 * directly (object-dot-sync mission T5 — the standalone object plugin is
 * deleted; upstream has no separate object-diagram engine, so these
 * assertions now run through `parseClass`, mirroring
 * `ClassDiagramFactory`'s registration of `CommandCreateEntityObject` /
 * `CommandCreateEntityObjectMultilines` alongside the class commands).
 *
 * Declaration/body-header parsing (quoted alias forms, stereotype, color,
 * duplicate handling, namespace placement) already has dedicated
 * upstream-cited coverage in tests/unit/class/class-object-decl.test.ts and
 * class-object-body.test.ts (T4). This file keeps the full end-to-end
 * behavioral surface from the old plugin-era test suite (relationship
 * parsing, parse-loop edge cases, canonical multi-object example) as a
 * single coherent regression net for "object diagram as a whole", with two
 * documented exceptions below.
 */

import { describe, it, expect } from 'vitest';
// The object engine IS the class parser (upstream: `ObjectDiagramFactory`
// shares `AbstractClassOrObjectDiagram`). Route through the class engine's
// narrowing seam, which throws naming the refusal rather than letting an
// unexpected `ParseRefusal` surface as a missing-property failure.
import { parseClass } from '../class/parse-helper.js';
import { parseClass as parseClassRaw } from '../../../src/diagrams/class/parser.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function src(lines: string[]): UmlSource {
  return { lines, type: 'class' };
}

// ---------------------------------------------------------------------------
// 1. Basic object declaration — no body
// ---------------------------------------------------------------------------

/** The refusal arm, for the forms upstream has no command for. */
function refusalOf(lines: readonly string[]) {
  return parseRefusalOf(parseClassRaw(src(lines)));
}

describe('parseClass (object diagram) — bare object declaration', () => {
  it('creates a classifier with kind object', () => {
    const ast = parseClass(src(['object Foo']));
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.classifiers[0]!.kind).toBe('object');
    expect(ast.classifiers[0]!.id).toBe('Foo');
    expect(ast.classifiers[0]!.display).toBe('Foo');
    expect(ast.classifiers[0]!.members).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Quoted display name with alias
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — quoted display and alias', () => {
  it('refuses a bare quoted-as line: it starts with no keyword at all', () => {
    // Was "should be ignored" — the permissive-parser assumption. T5 made the
    // class parser strict, so a line no command matches is now a refusal, not
    // a silent skip. Upstream agrees: `NameAndCodeParser`'s four `as`
    // alternatives all require a leading element keyword.
    expect(refusalOf(['"User : Alice" as alice'])?.kind).toBe('syntax');
  });

  it('parses object with quoted display and alias', () => {
    const ast = parseClass(src(['object "User : Alice" as alice']));
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.classifiers[0]!.id).toBe('alice');
    expect(ast.classifiers[0]!.display).toBe('User : Alice');
  });
});

// ---------------------------------------------------------------------------
// 3. Multi-line body with field = value
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — multi-line body', () => {
  it('parses field = value members', () => {
    const ast = parseClass(src([
      'object Alice {',
      '  firstName = Alice',
      '  age = 30',
      '}',
    ]));
    expect(ast.classifiers).toHaveLength(1);
    const c = ast.classifiers[0]!;
    expect(c.members).toHaveLength(2);
    expect(c.members[0]!.name).toBe('firstName');
    expect(c.members[0]!.type).toBe('Alice');
    expect(c.members[0]!.visibility).toBe('+');
    expect(c.members[0]!.isStatic).toBe(false);
    expect(c.members[0]!.isAbstract).toBe(false);
    expect(c.members[1]!.name).toBe('age');
    expect(c.members[1]!.type).toBe('30');
  });

  it('parses bare field name with no value', () => {
    const ast = parseClass(src([
      'object Thing {',
      '  name',
      '}',
    ]));
    const c = ast.classifiers[0]!;
    expect(c.members).toHaveLength(1);
    expect(c.members[0]!.name).toBe('name');
    expect(c.members[0]!.type).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Divergence removal — the old plugin's inline single-line body and
//    unquoted `as` alias were never valid upstream syntax; the ported class
//    engine (T4) intentionally does not carry them forward. See
//    class-object-commands.ts's module doc and:
//      - NameAndCodeParser.java: DISPLAY = `[%g]([^%g]*)[%g]` — the `as`
//        alternatives require a QUOTED display on one side; a bare
//        `object Foo as bar` (both unquoted) matches none of nameAndCode()'s
//        four alternatives.
//      - CommandCreateEntityObjectMultilines.java extends CommandMultilines2
//        unconditionally — there is no single-line inline-`{ ... }` form;
//        the body is always closed by a `}` alone on its own line.
//    T5 (dispatch-by-parse-attempt) gave this parser an error-reporting
//    channel. The observable behaviour for either unmatched form is now a
//    `ParseRefusal`, matching upstream, where `getCandidate` returning null
//    is a SYNTAX_ERROR that fails the whole document
//    (`PSystemCommandFactory.java:169-175`) — not a silent no-op.
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — divergent plugin-era syntax is no longer accepted', () => {
  it('refuses an inline single-line body (upstream has no such form)', () => {
    expect(refusalOf(['object Foo { x = 1; y = 2 }'])?.kind).toBe('syntax');
  });

  it('refuses an unquoted "as" alias (upstream requires a quoted display)', () => {
    expect(refusalOf(['object MyObject as obj'])?.kind).toBe('syntax');
  });
});

// ---------------------------------------------------------------------------
// 5. Relationship parsing
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — relationships', () => {
  it('parses --> association between two objects', () => {
    const ast = parseClass(src([
      'object Alice',
      'object Bob',
      'Alice --> Bob : knows',
    ]));
    expect(ast.relationships).toHaveLength(1);
    const rel = ast.relationships[0]!;
    expect(rel.from).toBe('Alice');
    expect(rel.to).toBe('Bob');
    expect(rel.type).toBe('association');
    expect(rel.label).toBe('knows');
  });

  it('auto-creates classifiers referenced only in relationships', () => {
    const ast = parseClass(src(['Alice --> Bob']));
    expect(ast.classifiers).toHaveLength(2);
    expect(ast.classifiers.map((c) => c.id).sort()).toEqual(['Alice', 'Bob']);
  });

  it('parses composition *-- relationship', () => {
    const ast = parseClass(src(['Whole *-- Part']));
    expect(ast.relationships[0]!.type).toBe('composition');
    expect(ast.relationships[0]!.from).toBe('Whole');
    expect(ast.relationships[0]!.to).toBe('Part');
  });

  it('parses dependency ..> relationship', () => {
    const ast = parseClass(src(['A ..> B']));
    expect(ast.relationships[0]!.type).toBe('dependency');
  });

  it('parses multiplicity labels', () => {
    const ast = parseClass(src(['Alice "1" --> "*" Bob']));
    const rel = ast.relationships[0]!;
    expect(rel.fromMultiplicity).toBe('1');
    expect(rel.toMultiplicity).toBe('*');
  });

  it('parses relationship with quoted identifier (stripQuotes true branch)', () => {
    const ast = parseClass(src(['"Foo" --> Bar']));
    expect(ast.relationships).toHaveLength(1);
    expect(ast.relationships[0]!.from).toBe('Foo');
    expect(ast.relationships[0]!.to).toBe('Bar');
  });

  it('parses <|-- extension (swapDirection true)', () => {
    const ast = parseClass(src(['Child <|-- Parent']));
    expect(ast.relationships).toHaveLength(1);
    expect(ast.relationships[0]!.type).toBe('extension');
    expect(ast.relationships[0]!.from).toBe('Parent');
    expect(ast.relationships[0]!.to).toBe('Child');
  });
});

// ---------------------------------------------------------------------------
// 5b. Edge cases in the main parse loop
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — parse loop edge cases', () => {
  it('skips empty lines in the middle of input', () => {
    const ast = parseClass(src(['object Foo', '', 'object Bar']));
    expect(ast.classifiers).toHaveLength(2);
  });

  it('ignores a standalone closing brace outside a body', () => {
    const ast = parseClass(src(['object Foo', '}']));
    expect(ast.classifiers).toHaveLength(1);
  });

  it('refuses an object declaration whose id resolves to empty', () => {
    // After stripping stereotype, colour and empty body nothing is left, so no
    // command matches. Was asserted as "ignored, later lines still parse" —
    // the permissive assumption; strict parsing refuses the document at that
    // line and never reaches `object Valid`.
    expect(refusalOf(['object << entity >> #pink {}', 'object Valid'])?.kind).toBe('syntax');
  });
});

// ---------------------------------------------------------------------------
// 6. Stereotype and color
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — stereotype and color', () => {
  it('parses stereotype on object declaration', () => {
    const ast = parseClass(src(['object Foo << entity >>']));
    expect(ast.classifiers[0]!.stereotype).toBe('entity');
  });

  it('parses color on object declaration', () => {
    const ast = parseClass(src(['object Foo #pink']));
    expect(ast.classifiers[0]!.color).toBe('#pink');
  });
});

// ---------------------------------------------------------------------------
// 7. Comments and skinparam are ignored
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — ignored lines', () => {
  it('skips comment lines', () => {
    const ast = parseClass(src(["' this is a comment", 'object Foo']));
    expect(ast.classifiers).toHaveLength(1);
  });

  it('skips skinparam lines', () => {
    const ast = parseClass(src(['skinparam backgroundColor white', 'object Bar']));
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.classifiers[0]!.id).toBe('Bar');
  });
});

// ---------------------------------------------------------------------------
// 7c. Non-structured field lines become raw display rows (object-dot-sync
//     Phase L iter 7 — upstream's `BodierLikeClassOrObject#addFieldOrMethod`
//     NEVER rejects a body line; only blank/separator lines are dropped, see
//     class-object-commands.ts#parseObjectField). This block used to assert
//     the OLD (pre-fix) drop-on-no-match behavior for a line like `foo bar`;
//     that was the bug tests/unit/class/class-object-raw-members.test.ts was
//     written to fix — updated here to the correct upstream-faithful shape.
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — non-structured field lines', () => {
  it('keeps a line with no "=" and no matching bare-name shape as a raw display row', () => {
    const ast = parseClass(src([
      'object Foo {',
      '  valid = yes',
      '  foo bar',
      '}',
    ]));
    // 'valid = yes' parses structured; 'foo bar' (a space, no '=') falls back
    // to a raw display row instead of being dropped.
    expect(ast.classifiers[0]!.members).toHaveLength(2);
    expect(ast.classifiers[0]!.members[0]!.name).toBe('valid');
    expect(ast.classifiers[0]!.members[1]!.rawDisplay).toBe('foo bar');
  });
});

// ---------------------------------------------------------------------------
// 8. Empty diagram
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — empty input', () => {
  it('returns empty AST for empty input', () => {
    const ast = parseClass(src([]));
    expect(ast.classifiers).toHaveLength(0);
    expect(ast.relationships).toHaveLength(0);
    expect(ast.namespaces).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Multiple objects and canonical example
// ---------------------------------------------------------------------------

describe('parseClass (object diagram) — canonical example', () => {
  it('parses all three objects and two relationships', () => {
    const ast = parseClass(src([
      'object "User : Alice" as alice {',
      '  firstName = Alice',
      '  lastName = Wonderland',
      '  age = 30',
      '}',
      'object "User : Bob" as bob {',
      '  firstName = Bob',
      '  lastName = Hope',
      '  age = 45',
      '}',
      'object Address {',
      '  street = 123 Main St',
      '  city = Springfield',
      '}',
      'alice --> bob : knows',
      'alice --> Address : livesAt',
    ]));

    expect(ast.classifiers).toHaveLength(3);
    expect(ast.classifiers.find((c) => c.id === 'alice')!.display).toBe('User : Alice');
    expect(ast.classifiers.find((c) => c.id === 'alice')!.members).toHaveLength(3);
    expect(ast.classifiers.find((c) => c.id === 'Address')!.members).toHaveLength(2);
    expect(ast.relationships).toHaveLength(2);
  });
});
