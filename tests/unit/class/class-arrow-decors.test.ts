/**
 * Arrow-decoration gap coverage (mission A2 iteration 12, Group 1): six
 * fixtures were silently dropping their relationship line because the
 * composed HEAD1/HEAD2 grammar in class-relationship-parser.ts didn't cover
 * every LinkDecor.java glyph — see that file's LinkDecor citations in
 * HEAD1_SAFE/HEAD2/HEAD1_KIND/HEAD2_KIND for the exact enum members. One
 * case per construct, plus regressions on arrows that already worked.
 *
 * @see ~/git/plantuml/.../decoration/LinkDecor.java:69-100 (enum values)
 * @see ~/git/plantuml/.../decoration/LinkDecor.java:238-263 (getRegexDecors1/2)
 * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:131-139
 *      (ARROW_HEAD1/ARROW_BODY1/.../INSIDE/.../ARROW_HEAD2 regex assembly)
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('LinkDecor.SQUARE ("#") — zerofa-77-caro506, zuramo-86-liku129', () => {
  it('parses a bare `#` head decor instead of dropping the line', () => {
    const rel = parseRelationshipLine('foo2 #-- foo1');
    expect(rel).not.toBeNull();
    expect(rel?.length).toBe(2);
  });

  it('composes with a COMPOSITION `*` on the other end (`#--*`)', () => {
    const rel = parseRelationshipLine('foo #--* bar');
    expect(rel).not.toBeNull();
    expect(rel?.type).toBe('composition');
  });

  it('auto-creates both endpoints via full parseClass', () => {
    const ast = parse('foo2 #-- foo1');
    expect(ast.classifiers.map((c) => c.id).sort()).toEqual(['foo1', 'foo2']);
    expect(ast.relationships).toHaveLength(1);
  });
});

describe('LinkDecor.EXTENDS second decor "^" — zuramo-86-liku129', () => {
  it('resolves `^` as an extends-like decor, not a parse failure', () => {
    const rel = parseRelationshipLine('foo <||--^ bar');
    expect(rel).not.toBeNull();
    expect(rel?.type).toBe('extension');
    expect(rel?.length).toBe(2);
  });

  // T5/M6: `LinkDecor.java:71` -- `EXTENDS(decors1("<|","^"),
  // decors2("|>","^"),...)` -- `^` resolves to EXTENDS via EITHER lookup, so
  // it renders as the SAME `'triangle'` decor `<|`/`|>` already use, never a
  // distinct `'arrowTriangle'` (that name belongs to the unrelated
  // `ARROW_TRIANGLE` enum member, glyphs `<<`/`>>` -- not reachable by this
  // port's arrow grammar, see class-arrow-decor-map.ts). `.agent-notes/
  // cdd-T5.md` records the end-binding derivation from `SvekEdge.java:
  // 677-709` (`extremity1`/near-source reads `LinkType#getDecor2()`,
  // extremity2/near-target reads `getDecor1()`).
  it('binds redefines to the source end and triangle (not arrowTriangle) to the target end', () => {
    const rel = parseRelationshipLine('foo <||--^ bar');
    expect(rel?.from).toBe('foo');
    expect(rel?.to).toBe('bar');
    expect(rel?.sourceDecor).toBe('redefines');
    expect(rel?.targetDecor).toBe('triangle');
  });
});

describe('LinkDecor.REDEFINES ("<||"/"||>") — zuramo-86-liku129, nixema-71-tuke505', () => {
  it('parses "<||" as ARROW_HEAD1 (folds into the extends-like kind)', () => {
    const rel = parseRelationshipLine('foo <||--^ bar');
    expect(rel).not.toBeNull();
  });

  it('parses "||>" as ARROW_HEAD2', () => {
    const rel = parseRelationshipLine('A --||>C');
    expect(rel).not.toBeNull();
    expect(rel?.type).toBe('extension');
  });

  it('T5/M6: "||>" carries the redefines decor at the target end', () => {
    const rel = parseRelationshipLine('A --||>C');
    expect(rel?.from).toBe('A');
    expect(rel?.to).toBe('C');
    expect(rel?.sourceDecor).toBe('none');
    expect(rel?.targetDecor).toBe('redefines');
  });
});

describe('LinkDecor.DEFINEDBY ("<|:"/":|>") — nixema-71-tuke505', () => {
  it('parses "<|:" as ARROW_HEAD1', () => {
    const rel = parseRelationshipLine('A <|:-- B');
    expect(rel).not.toBeNull();
    expect(rel?.type).toBe('extension');
    expect(rel?.length).toBe(2);
  });

  it('auto-creates both endpoints (previously the whole line was dropped)', () => {
    const ast = parse('class A\nclass B\nA <|:-- B');
    expect(ast.relationships).toHaveLength(1);
  });

  // T5/M6: an EXTENDS-like ARROW_HEAD1 alone (no decor at ARROW_HEAD2)
  // swaps from/to (parent written first) exactly like plain `<|--`; the
  // definedBy decor rides the target (parent) end, `'none'` at source.
  it('T5/M6: "<|:" swaps from/to and carries definedBy at the target (parent) end', () => {
    const rel = parseRelationshipLine('A <|:-- B');
    expect(rel?.from).toBe('B');
    expect(rel?.to).toBe('A');
    expect(rel?.sourceDecor).toBe('none');
    expect(rel?.targetDecor).toBe('definedBy');
  });
});

describe('LinkDecor.CIRCLE_CROWFOOT ("}o"/"o{") mixed with a real decor — zuramo-86-liku129', () => {
  it('parses "o{" as ARROW_HEAD2 alongside an EXTENDS ARROW_HEAD1 ("<|--o{")', () => {
    const rel = parseRelationshipLine('foo <|--o{ bar');
    expect(rel).not.toBeNull();
    expect(rel?.length).toBe(2);
  });

  it('parses "}o" as ARROW_HEAD1 (symmetric form)', () => {
    const rel = parseRelationshipLine('foo }o--> bar');
    expect(rel).not.toBeNull();
  });
});

describe('CommandLinkClass INSIDE middle-circle marker ("0)"/"(0"/"0"/"(0)") — cenubi-27-xova754', () => {
  it('parses "-0)-" as a plain association, not a dropped line', () => {
    const rel = parseRelationshipLine('foo1 -0)- foo2');
    expect(rel).not.toBeNull();
    expect(rel?.type).toBe('association');
    expect(rel?.length).toBe(2);
  });

  it('auto-creates both endpoints via full parseClass', () => {
    const ast = parse('foo1 -0)- foo2');
    expect(ast.classifiers.map((c) => c.id).sort()).toEqual(['foo1', 'foo2']);
    expect(ast.relationships).toHaveLength(1);
  });

  // T5/M6: `"0)"` is `LinkMiddleDecor.CIRCLE_CIRCLED1`
  // (`withMiddleCircleCircled1()`, CommandLinkClass.java:499-500) -- NOT
  // `LinkDecor.CIRCLE_CONNECT` (a different Java enum, a HEAD decor, glyph
  // "0)"/"(0" used only when NO body char separates it from an entity --
  // unreachable via this port's arrow grammar today, see
  // class-arrow-decor-map.ts's own doc comment). The task brief's own
  // acceptance text names this `'circleConnect'`; that is the wrong Java
  // member for THIS glyph position and is corrected here to the value
  // `LinkDecor.java`/`LinkType.java:143-149` actually specify.
  it('T5/M6: "-0)-" resolves to middleDecor "circleCircled1", not "circleConnect"', () => {
    const rel = parseRelationshipLine('foo1 -0)- foo2');
    expect(rel?.middleDecor).toBe('circleCircled1');
  });

  // The sibling three INSIDE forms (CommandLinkClass.java:498-507) -- same
  // four-armed Java method, ported alongside the corpus-reachable "0)" case
  // rather than as a speculative extension of it (zero corpus reach for
  // these three, verified by grep over test-results/dot-cache/class and
  // oracle/goldens/svg-class).
  it.each([
    ['foo1 -0- foo2', 'circle'],
    ['foo1 -(0- foo2', 'circleCircled2'],
    ['foo1 -(0)- foo2', 'circleCircled'],
  ] as const)('T5/M6: %s -> middleDecor %s', (line, expected) => {
    const rel = parseRelationshipLine(line);
    expect(rel?.middleDecor).toBe(expected);
  });

  it('T5/M6: an ordinary arrow with no INSIDE token carries no middleDecor', () => {
    const rel = parseRelationshipLine('foo1 --> foo2');
    expect(rel?.middleDecor).toBeUndefined();
  });
});

describe('T5/M4: dashed BODY independent of the decor that wins resolveType', () => {
  it('A ..> B (plain dependency) is unaffected: dashedBody true, type dependency', () => {
    const rel = parseRelationshipLine('A ..> B');
    expect(rel?.type).toBe('dependency');
    expect(rel?.dashedBody).toBe(true);
  });

  // CommandLinkClass.java:495-497: `goDashed()` applies whenever
  // ARROW_BODY1/ARROW_BODY2 contains "." REGARDLESS of decor -- composition
  // still resolves its TYPE from the `*` decor (resolveType's significance
  // order), but the body's own dottedness is an independent field.
  it('A *..> B (composition, dashed body): type composition, dashedBody true', () => {
    const rel = parseRelationshipLine('A *..> B');
    expect(rel?.type).toBe('composition');
    expect(rel?.dashedBody).toBe(true);
  });

  it('A *--> B (composition, solid body): dashedBody false', () => {
    const rel = parseRelationshipLine('A *--> B');
    expect(rel?.type).toBe('composition');
    expect(rel?.dashedBody).toBe(false);
  });
});

describe('T5/M12: -[hidden]- carried as its own field — guxode-39-dobi371', () => {
  it('A -[hidden]- B sets hidden true', () => {
    const rel = parseRelationshipLine('A -[hidden]- B');
    expect(rel?.hidden).toBe(true);
  });

  it('an ordinary association has no hidden field', () => {
    const rel = parseRelationshipLine('A -- B');
    expect(rel?.hidden).toBeUndefined();
  });

  // `plain`/`node` remain no-ops (NON_COLOR_KEYWORDS) -- only `hidden`
  // gained its own field.
  it('A -[plain]- B is still parsed with no hidden field', () => {
    const rel = parseRelationshipLine('A -[plain]- B');
    expect(rel).not.toBeNull();
    expect(rel?.hidden).toBeUndefined();
  });
});

describe('T5/M3: [[url]] on a relationship — fitini-85-kupo803', () => {
  it('a1 --> a2 [[http://x]] : foo captures the url (UrlInfo.url, not .href)', () => {
    const rel = parseRelationshipLine('a1 --> a2 [[http://x]] : foo');
    expect(rel?.url).toEqual({ url: 'http://x', tooltip: 'http://x', label: 'http://x' });
    expect(rel?.label).toBe('foo');
  });

  it('a relationship with no [[url]] carries no url field', () => {
    const rel = parseRelationshipLine('a1 --> a2 : foo');
    expect(rel?.url).toBeUndefined();
  });

  it('carries a labelled url ([[url label]])', () => {
    const rel = parseRelationshipLine('a1 --> a2 [[http://x my label]]');
    expect(rel?.url).toEqual({ url: 'http://x', tooltip: 'http://x', label: 'my label' });
  });
});

describe('inline `#color;attr` block after the arrow (ColorParser PART2) — nuvake-96-gofe203, xoxuni-96-fere626', () => {
  it('keeps the relationship label when a color block sits before the colon', () => {
    const rel = parseRelationshipLine('Dummy --> Foo2 #blue;text:red : Another link');
    expect(rel).not.toBeNull();
    expect(rel?.label).toBe('Another link');
    expect(rel?.from).toBe('Dummy');
    expect(rel?.to).toBe('Foo2');
  });

  it('does not swallow the label separator for a simple `#color;attr:value` block', () => {
    const rel = parseRelationshipLine('cl1 --> cl2 #red;text:blue : foo3');
    expect(rel).not.toBeNull();
    expect(rel?.label).toBe('foo3');
  });

  it('still parses when no color block is present (regression)', () => {
    const rel = parseRelationshipLine('Dummy --> Foo : A link');
    expect(rel).not.toBeNull();
    expect(rel?.label).toBe('A link');
  });
});

describe('regressions on already-working arrow forms', () => {
  it.each([
    ['foo --> bar', 'association'],
    ['foo <|.. bar', 'implementation'],
    ['foo *-- bar', 'composition'],
    ['foo o-- bar', 'aggregation'],
    ['foo <-- bar', 'association'],
    ['foo +--o bar', 'aggregation'],
  ] as const)('%s -> %s', (line, type) => {
    const rel = parseRelationshipLine(line);
    expect(rel).not.toBeNull();
    expect(rel?.type).toBe(type);
  });

  it('still parses symmetric crow-foot links as association (unaffected by new HEAD glyphs)', () => {
    const ast = parse('A |o--o| B\nC ||--|| D\nE }o--o{ F\nG }|--|{ H\nfoo1 }-- foo2');
    expect(ast.relationships).toHaveLength(5);
    expect(ast.relationships.every((r) => r.type === 'association')).toBe(true);
  });
});
