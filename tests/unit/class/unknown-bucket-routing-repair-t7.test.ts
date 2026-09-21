/**
 * T7 (unknown-bucket-routing-repair): one exemplar-line regression test per
 * mechanism fixed in this task. Each test names the exact upstream mechanism
 * and cites the fixture slug the diagnosis measured it against
 * (`plans/unknown-bucket-routing-repair/diagnosis/T2.md`, `T3.md`, `T4.md`,
 * `T5.md`). Before this task's fix, every one of these either REFUSED
 * (`buildSyntaxRefusal`/`ALLOW_MIXING_ERROR`) or, for the two silent-drop
 * mechanisms, silently produced the wrong AST rather than refusing —
 * verified by hand via direct `parseClass()` probes during diagnosis, not
 * re-asserted here as a separate "before" test (this file asserts the
 * AFTER state only, matching this repo's existing per-mechanism regression
 * test convention — see e.g. `parser.test.ts`'s own `allowmixing` test).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { parseClass as parseClassRaw } from '../../../src/diagrams/class/parser.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function classifier(ast: ReturnType<typeof parseClass>, id: string) {
  const c = ast.classifiers.find((x) => x.id === id);
  if (c === undefined) throw new Error(`Expected classifier "${id}"`);
  return c;
}

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return parseClass({ lines, type: 'class' } satisfies UmlSource);
}

function refusalOf(source: string) {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return parseRefusalOf(parseClassRaw({ lines, type: 'class' } satisfies UmlSource));
}

// ---------------------------------------------------------------------------
// T3 M1/M2 -- classifier declaration VISIBILITY + TYPE keyword gaps
// ---------------------------------------------------------------------------

describe('T3 M1 -- classifier declaration VISIBILITY prefix', () => {
  it('accepts a leading visibility char before class (Class-visibility-0)', () => {
    const ast = parse('+class A {\n}');
    expect(classifier(ast, 'A').kind).toBe('class');
  });
});

describe('T3 M2 -- classifier declaration TYPE keyword gaps', () => {
  it('accepts static class, collapsing onto plain class (vijuce-20-xapo285)', () => {
    const ast = parse('static class dummy');
    expect(classifier(ast, 'dummy').kind).toBe('class');
  });

  it('accepts metaclass AND stereotype in the same fixture (girapu-90-pise235)', () => {
    const ast = parse('metaclass meta1 {\n}\nstereotype ste1 {\n}');
    expect(classifier(ast, 'meta1').kind).toBe('metaclass');
    expect(classifier(ast, 'ste1').kind).toBe('stereotype');
  });

  it('accepts struct and exception (jodasa/zelura)', () => {
    expect(classifier(parse('struct Foo {}'), 'Foo').kind).toBe('struct');
    expect(classifier(parse('exception Foo {}'), 'Foo').kind).toBe('exception');
  });

  it('accepts dataclass with a stereotype and members (doboco-09-doba683)', () => {
    const ast = parse('dataclass AngleData <<lombok>> {\n- aimingPitch : double\n}');
    const c = classifier(ast, 'AngleData');
    expect(c.kind).toBe('dataclass');
    expect(c.stereotype).toBe('lombok');
  });

  it('accepts diamond, reusing the association-diamond kind (gegosa-79-mini423)', () => {
    const ast = parse('diamond diamond1');
    expect(classifier(ast, 'diamond1').kind).toBe('association');
  });
});

describe('T3 M3 -- package declaration VISIBILITY prefix', () => {
  it('accepts a leading visibility char before package (topave-65-ceso890)', () => {
    const ast = parse('- package foo {\n- class alice\n}');
    expect(ast.namespaces.some((n) => n.id === 'foo')).toBe(true);
    expect(classifier(ast, 'foo.alice').kind).toBe('class');
  });
});

describe('T3 M4 -- Unicode standalone-member shorthand', () => {
  it('accepts a Unicode member name (muvici-42-dumo371)', () => {
    const ast = parse('class 春\n春 : 春燕');
    const c = classifier(ast, '春');
    expect(c.members.some((m) => m.name === '春燕')).toBe(true);
  });

  it('accepts a Unicode note target (muvici-42-dumo371, note right of 春)', () => {
    const ast = parse('class 春\nnote right of 春\nhello\nend note');
    expect(ast.notes.some((n) => n.target === '春')).toBe(true);
  });
});

describe('T3 M5 -- json body premature close on an interior bare `}`', () => {
  it('does not close on an interior array-entry object brace (neticu-06-bafo691)', () => {
    const ast = parse(
      [
        'json J {',
        '"phoneNumbers": [',
        '{',
        '"type": "home",',
        '"number": "212 555-1234"',
        '},',
        '{',
        '"type": "office",',
        '"number": "646 555-4567"',
        '}',
        ']',
        '}',
      ].join('\n'),
    );
    const c = classifier(ast, 'J');
    expect(c.kind).toBe('json');
    expect(c.jsonValue).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// T4 Mechanism A -- CommandCreateElementMultilines
// ---------------------------------------------------------------------------

describe('T4 Mechanism A -- CommandCreateElementMultilines TYPE0/TYPE1', () => {
  it('TYPE0: rectangle CODE as "multi-line display" (boguko-42-zuda981 shape)', () => {
    const ast = parse('rectangle myalias as "\nline one\nline two"');
    const c = classifier(ast, 'myalias');
    expect(c.kind).toBe('descriptive');
    expect(c.usymbol).toBe('rectangle');
    expect(c.display).toBe('line one\nline two');
  });

  it('TYPE1: rectangle CODE [ multi-line description ] (buitin-newline-chr-0 shape)', () => {
    const ast = parse('rectangle A [\ntest 1\ntest 11\n]');
    const c = classifier(ast, 'A');
    expect(c.kind).toBe('descriptive');
    expect(c.display).toBe('test 1\ntest 11');
  });

  it('TYPE1 also owns entity/circle brackets, not just descriptive leaves (gogisu/felixe)', () => {
    const ast = parse('entity ABC [\ndetails1\ndetails2\n]');
    const c = classifier(ast, 'ABC');
    expect(c.kind).toBe('descriptive');
    expect(c.usymbol).toBe('entity');
  });
});

// ---------------------------------------------------------------------------
// T4 Mechanism B -- crow's-foot arrow grammar gaps
// ---------------------------------------------------------------------------

describe("T4 Mechanism B -- crow's-foot arrow grammar gaps", () => {
  it('accepts a dotted crow\'s-foot body (dajela-44-zovi778)', () => {
    const ast = parse('Entity01 }|..|| Entity02');
    expect(ast.relationships).toHaveLength(1);
  });

  it('accepts a style bracket inside a decorated crow\'s-foot arrow (mujega-45-mexi048)', () => {
    const ast = parse('Bob |o--|{ Alice : hello\nTed |o-[thickness=5]-|{ Alice : hello');
    expect(ast.relationships).toHaveLength(2);
  });

  it('accepts the CIRCLE "0" head/tail token (zefefo-37-xigo245)', () => {
    const ast = parse('a 0-[dashed]--0 b: test1');
    expect(ast.relationships).toHaveLength(1);
  });
});

describe('T4 Mechanism C -- CLASS_ID ignores a configured namespaceSeparator', () => {
  it('accepts a backslash-separated endpoint under set namespaceSeparator (gemepu-46-dido441)', () => {
    const ast = parse('set namespaceSeparator \\\\\nCustomController --|> App\\\\Http\\\\Controllers\\\\Controller');
    expect(ast.relationships).toHaveLength(1);
  });
});

describe('T4 Mechanism D -- dotted note name', () => {
  it('accepts a dot in a freestanding note alias (rexupa-61-nezi165)', () => {
    const ast = parse('note as n\nmy note\nend note\nnote as X.n\nmy other note\nend note');
    expect(ast.notes.some((n) => n.id === 'X.n')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T5 M2 -- descriptive-container silent-drop
// ---------------------------------------------------------------------------

describe('T5 M2 -- descriptive-container body silently swallowed', () => {
  it('opens a real container for action/process and refuses its unmatched body line (nicere-96-keje834)', () => {
    const refusal = refusalOf('action action {\naction action1\naction action2\n}');
    expect(refusal?.kind).toBe('execution');
    expect(refusal?.message).toContain('allowmixing');
  });

  it('refuses a truly-unmatched line inside a container instead of silently dropping it (xipane-40-dune740)', () => {
    const refusal = refusalOf(
      'rectangle "a" as he {\n' + 'rectangle "b""c""" as pn\n' + '}',
    );
    expect(refusal).toBeDefined();
  });
});

describe('T5 M3 -- lollipop auto-creates the "existing" side', () => {
  it('refuses "No class X" when the existing side was never declared (vagipu-81-xuse929)', () => {
    const refusal = refusalOf('B1 -() A1');
    expect(refusal?.kind).toBe('execution');
    expect(refusal?.message).toBe('No class B1');
  });
});

// ---------------------------------------------------------------------------
// T2 M8 -- class over-claims a target-less positioned note
// ---------------------------------------------------------------------------

describe('T2 M8 -- class note with no target and no prior entity', () => {
  it('refuses "Nothing to note to" (tiseze-53-gace410 shape)', () => {
    const refusal = refusalOf('note right: hello world');
    expect(refusal?.kind).toBe('execution');
    expect(refusal?.message).toBe('Nothing to note to');
  });
});
