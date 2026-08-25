/**
 * `newpage` (upstream `CommandNewpage` / `NewpagedDiagram`) — parser splits a
 * multi-page class source into per-page ASTs (decision D1, T6).
 *
 * @see ~/git/plantuml/.../descdiagram/command/CommandNewpage.java:77-88
 * @see ~/git/plantuml/.../NewpagedDiagram.java:61-162
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseClass } from './parse-helper.js';
import { parseClass as parseClassRaw } from '../../../src/diagrams/class/parser.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import { extractBlocks } from '../../../src/core/block-extractor.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

// ---------------------------------------------------------------------------
// Single-page sources: `pages` must stay absent, AST unchanged.
// ---------------------------------------------------------------------------

describe('newpage absent — single page', () => {
  it('leaves `pages` undefined when no newpage appears', () => {
    const ast = parse(`
      class A
      class B
      A --> B
    `);
    expect(ast.pages).toBeUndefined();
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.relationships).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Two-page source: classifiers must be page-local.
// ---------------------------------------------------------------------------

describe('newpage — two pages', () => {
  it('splits into two page-local ASTs, source order preserved', () => {
    const ast = parse(`
      class A
      newpage
      class B
    `);

    expect(ast.pages).toBeDefined();
    const pages = ast.pages!;
    expect(pages).toHaveLength(2);

    // The returned AST IS the first page.
    expect(pages[0]).toBe(ast);

    expect(pages[0]!.classifiers.map((c) => c.id)).toEqual(['A']);
    expect(pages[1]!.classifiers.map((c) => c.id)).toEqual(['B']);
  });

  it('keeps relationships and notes page-local', () => {
    const ast = parse(`
      class A
      class C
      A --> C
      note left of C : hello
      newpage
      class B
      class D
      B --> D
      note right of D : world
    `);

    const pages = ast.pages!;
    expect(pages).toHaveLength(2);

    const [page1, page2] = pages as [
      ReturnType<typeof parse>,
      ReturnType<typeof parse>,
    ];

    expect(page1.classifiers.map((c) => c.id)).toEqual(['A', 'C']);
    expect(page1.relationships).toHaveLength(1);
    expect(page1.relationships[0]).toMatchObject({ from: 'A', to: 'C' });
    expect(page1.notes).toHaveLength(1);
    expect(page1.notes[0]).toMatchObject({ target: 'C', text: 'hello' });

    expect(page2.classifiers.map((c) => c.id)).toEqual(['B', 'D']);
    expect(page2.relationships).toHaveLength(1);
    expect(page2.relationships[0]).toMatchObject({ from: 'B', to: 'D' });
    expect(page2.notes).toHaveLength(1);
    expect(page2.notes[0]).toMatchObject({ target: 'D', text: 'world' });
  });

  it('keeps namespaces page-local', () => {
    const ast = parse(`
      namespace ns1 {
        class A
      }
      newpage
      namespace ns2 {
        class B
      }
    `);

    const pages = ast.pages!;
    expect(pages).toHaveLength(2);

    expect(pages[0]!.classifiers.map((c) => c.id)).toEqual(['ns1.A']);
    expect(pages[0]!.namespaces.map((n) => n.id)).toEqual(['ns1']);

    expect(pages[1]!.classifiers.map((c) => c.id)).toEqual(['ns2.B']);
    expect(pages[1]!.namespaces.map((n) => n.id)).toEqual(['ns2']);
  });

  it('resets parser-local settings (namespace separator, pragma) per page', () => {
    const ast = parse(`
      set namespaceSeparator ::
      !pragma useIntermediatePackages false
      class a::b::C
      newpage
      class x.y.Z
    `);

    const pages = ast.pages!;
    // Page 1: separator '::', intermediate packages disabled → one flat
    // namespace 'a::b' (collapsed, not nested a -> a::b).
    expect(pages[0]!.classifiers.map((c) => c.id)).toEqual(['a::b::C']);
    expect(pages[0]!.namespaces.map((n) => n.id)).toEqual(['a::b']);

    // Page 2: settings reset to defaults ('.' separator, intermediate
    // packages enabled) → nested namespaces x, x.y.
    expect(pages[1]!.classifiers.map((c) => c.id)).toEqual(['x.y.Z']);
    expect(pages[1]!.namespaces.map((n) => n.id).sort()).toEqual(['x', 'x.y']);
  });
});

// ---------------------------------------------------------------------------
// Three-plus pages: source order preserved, every page standalone.
// ---------------------------------------------------------------------------

describe('newpage — three pages', () => {
  it('preserves source order across multiple newpage boundaries', () => {
    const ast = parse(`
      class A
      newpage
      class B
      newpage
      class C
    `);

    const pages = ast.pages!;
    expect(pages).toHaveLength(3);
    expect(pages.map((p) => p.classifiers.map((c) => c.id))).toEqual([
      ['A'],
      ['B'],
      ['C'],
    ]);
  });

  it('applies hide/show directives independently per page', () => {
    const ast = parse(`
      class A {
        +field1 : int
      }
      hide empty members
      newpage
      class B {
        +field2 : int
      }
    `);

    const pages = ast.pages!;
    expect(pages).toHaveLength(2);
    expect(pages[0]!.directives).toHaveLength(1);
    // Page 2 never saw the directive — a fresh diagram, matching upstream.
    expect(pages[1]!.directives).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Corpus fixture: sadamo-18-siva346.puml (50+ newpages).
// ---------------------------------------------------------------------------

describe('newpage — corpus fixture sadamo-18-siva346', () => {
  const corpusPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../fixtures/corpus/class/sadamo-18-siva346.puml',
  );

  // T5 (dispatch-by-parse-attempt): this fixture used to cross-check the
  // page count against the source's `newpage` lines. It cannot any more, and
  // the reason is upstream's, not this port's.
  //
  // Line 8 is a relationship whose right-hand identifier is a run of ~1,900
  // literal backticks. Upstream's own class identifier is
  // `([%pLN_$]+(?:…)*|[%g][^%g]+[%g])` -- letters, digits, `_`, `$`, or a
  // quoted form (`CommandLinkClass.java#getClassIdentifier`, :176-178).
  // Backtick is in neither alternative, so `CommandLinkClass` cannot match
  // the line, and nothing else in `ClassDiagramFactory` can either.
  //
  // The jar's own answer is on disk and agrees: this fixture's committed
  // golden is one of PlantUML's graphical error pages -- `jarRendered: false`
  // in `oracle/goldens/svg-conformance/refusal-baseline.json`, one of only 8
  // such fixtures in 3,158. So BOTH parsers refuse it.
  //
  // Asserted rather than skipped. A conditional `return` on the refusal would
  // pass whether or not the refusal fired, which is precisely the way a
  // regression in the refusal mechanism would go unnoticed. The other seven
  // tests in this file cover page splitting on hand-written sources; what
  // this fixture pins now is the agreement with the jar.
  // @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:176-178
  it('is REFUSED, exactly as upstream refuses it', () => {
    if (!existsSync(corpusPath)) {
      console.warn(`skip: corpus fixture not found at ${corpusPath}`);
      return;
    }
    const source = readFileSync(corpusPath, 'utf8');
    expect((source.match(/^newpage\s*$/gim) ?? []).length).toBeGreaterThanOrEqual(10);

    const blocks = extractBlocks(source.split('\n'));
    const block = blocks[0];
    expect(block, 'expected at least one @startuml block').toBeDefined();

    const refusal = parseRefusalOf(parseClassRaw(block!));
    expect(refusal, 'the backtick identifier must be refused, as it is upstream').toBeDefined();
    expect(refusal?.kind).toBe('syntax');
  });
});
