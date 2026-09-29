/**
 * T5 — degenerate-diagram skip (0-1 entities -> no DOT graph).
 *
 * GraphvizImageBuilder.buildImage:211-223 (dotData.isDegeneratedWithFewEntities,
 * dot/DotData.java:69-71) skips graphviz entirely for a diagram with zero
 * groups, zero links, and 0 or 1 leaf entities. This mirrors the description
 * engine's `degenerateSingleLeaf` (description/layout-helpers.ts:410) into
 * `layoutClass` (see `degenerateSingleClassifier` in ../../../src/diagrams/
 * class/layout.ts).
 */
import { describe, it, expect } from 'vitest';
import { layoutClass, classifierLeaves, noteLeaves } from '../../../src/diagrams/class/layout.js';
import type {
  ClassDiagramAST,
  Classifier,
  Namespace,
  Relationship,
  ClassNote,
} from '../../../src/diagrams/class/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { renderFixture } from '../../helpers/render.js';

const measurer = new FormulaMeasurer();

function makeAST(overrides?: Partial<ClassDiagramAST>): ClassDiagramAST {
  return {
    classifiers: [],
    relationships: [],
    namespaces: [],
    directives: [],
    notes: [],
    ...overrides,
  };
}

function makeClassifier(id: string, overrides?: Partial<Classifier>): Classifier {
  return { id, display: id, kind: 'class', typeParams: [], members: [], ...overrides };
}

/** Run layoutClass while counting how many DOT graphs the layout engine sees. */
function layoutAndCount(ast: ClassDiagramAST): { geo: ReturnType<typeof layoutClass>; captured: number } {
  let captured = 0;
  const graphs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph: g }) => {
    captured++;
    graphs.push(g);
  });
  try {
    const geo = layoutClass(ast, defaultTheme, measurer);
    return { geo, captured };
  } finally {
    setLayoutInputObserver(undefined);
  }
}

describe('layoutClass -- degenerate diagram skip (T5)', () => {
  it('single classifier, no relationships, no namespaces -- 0 graphs', () => {
    const ast = makeAST({ classifiers: [makeClassifier('A')] });
    const { geo, captured } = layoutAndCount(ast);
    expect(captured).toBe(0);
    expect(classifierLeaves(geo.leaves)).toHaveLength(1);
    expect(classifierLeaves(geo.leaves)[0]?.id).toBe('A');
    // G2 N3: the degenerate single-classifier box is no longer drawn flush
    // at the canvas origin -- `EntityImageDegenerated.java`'s own `delta =
    // 7` translate (jar-verified, `plans/g2-class-svg/ledger.md` N3) is now
    // reproduced as a fixed (7, 7) near-edge margin.
    expect(classifierLeaves(geo.leaves)[0]?.x).toBe(7);
    expect(classifierLeaves(geo.leaves)[0]?.y).toBe(7);
    expect(geo.totalWidth).toBeGreaterThan(0);
    expect(geo.totalHeight).toBeGreaterThan(0);
    expect(geo.edges).toHaveLength(0);
    expect(geo.namespaces).toHaveLength(0);
    expect(noteLeaves(geo.leaves)).toHaveLength(0);
  });

  it('two classifiers + one relationship -- exactly 1 graph (unchanged)', () => {
    const ast = makeAST({
      classifiers: [makeClassifier('A'), makeClassifier('B')],
      relationships: [{ from: 'A', to: 'B', type: 'association' } satisfies Relationship],
    });
    const { geo, captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
    expect(classifierLeaves(geo.leaves)).toHaveLength(2);
    expect(geo.edges).toHaveLength(1);
  });

  it('one classifier + a note attached to it -- NOT degenerate (notes count as leafs upstream)', () => {
    const note: ClassNote = { id: '__note_0', target: 'A', position: 'right', text: 'hi' };
    const ast = makeAST({ classifiers: [makeClassifier('A')], notes: [note] });
    const { geo, captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
    expect(classifierLeaves(geo.leaves)).toHaveLength(1);
    expect(noteLeaves(geo.leaves)).toHaveLength(1);
  });

  it('one classifier + a floating (unattached) note -- NOT degenerate', () => {
    const note: ClassNote = { id: 'N1', text: 'floating' };
    const ast = makeAST({ classifiers: [makeClassifier('A')], notes: [note] });
    const { geo, captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
    expect(classifierLeaves(geo.leaves)).toHaveLength(1);
    expect(noteLeaves(geo.leaves)).toHaveLength(1);
  });

  it('single classifier inside a declared namespace -- NOT degenerate (any declared group disqualifies, even non-empty)', () => {
    const ns: Namespace = { id: 'P', display: 'P', classifiers: ['A'] };
    const ast = makeAST({ classifiers: [makeClassifier('A')], namespaces: [ns] });
    const { captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
  });

  it('single hexagon-usymbol descriptive classifier -- excluded, falls through to normal layout', () => {
    const ast = makeAST({
      classifiers: [makeClassifier('A', { kind: 'descriptive', usymbol: 'hexagon' })],
    });
    const { captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
  });

  it('single freestanding note, zero classifiers -- degenerate (cdd5-T4a degenerate-excludes-notes)', () => {
    // GraphvizImageBuilder.java's isDegeneratedWithFewEntities(1) counts notes
    // as leafs too (DotData.java:69-71 -- getLeafs() includes LeafType.NOTE),
    // and GeneralImageBuilder.java:118-119 routes the single NOTE leaf
    // through EntityImageNote, wrapped in the SAME EntityImageDegenerated
    // (delta=7) translate as a single classifier -- see
    // `degenerateNoteGeo` (class-geo-builders-degenerate-note.ts).
    const note: ClassNote = { id: 'N1', text: 'alone' };
    const ast = makeAST({ notes: [note] });
    const { geo, captured } = layoutAndCount(ast);
    expect(captured).toBe(0);
    expect(noteLeaves(geo.leaves)).toHaveLength(1);
    expect(noteLeaves(geo.leaves)[0]?.x).toBe(7);
    expect(noteLeaves(geo.leaves)[0]?.y).toBe(7);
    expect(noteLeaves(geo.leaves)[0]?.connector).toEqual([]);
    expect(geo.totalWidth).toBeGreaterThan(0);
    expect(geo.totalHeight).toBeGreaterThan(0);
  });

  it('single empty package, zero classifiers -- NOT degenerate (group counted pre-collapse mute)', () => {
    // cdd5-T4a degenerate-check-after-group-mute: DotData.java:69-70 reads
    // entityFactory.groups().size() BEFORE the empty-package mute-to-leaf,
    // which upstream defers to DOT-export time
    // (GraphvizImageBuilder.java:416-418). This port's own equivalent mute
    // (collapseEmptyNamespacesFinal) runs at layout time, before this
    // check -- so the raw (pre-collapse) namespace count must gate it, not
    // the post-collapse one. `package foo1 { }`-shaped AST: one namespace,
    // zero classifiers before collapse.
    const ns: Namespace = { id: 'foo1', display: 'foo1', classifiers: [] };
    const ast = makeAST({ namespaces: [ns] });
    const { captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
  });

  it('single circle classifier -- canvas grows to the label\'s ensureVisible baseline, not LimitFinder ink (cdd6-T2c item 1)', () => {
    // cdd5-T4a/cdd6-T2c degenerate-text-ensurevisible: SvgGraphics.java:
    // 757-758,:129-133 -- a circle/`() "name"` interface's label is drawn
    // BELOW its fixed 18x18 icon (measureCircleInterfaceInk); the degenerate
    // path's box-only rawDims must widen/heighten to the label's real
    // ensureVisible corner. `symbolInk.maxY` alone overshoots by
    // LimitFinder's own text-height hack (LimitFinder.java:217, `y -=
    // dim.getHeight() - 1.5`) -- jar-verified 44, not the un-corrected 46
    // (`unknown/rupigu-89-xabo757`/`unknown/vabobu-24-temi990`).
    const ast = makeAST({ classifiers: [makeClassifier('A', { kind: 'circle' })] });
    const { geo, captured } = layoutAndCount(ast);
    expect(captured).toBe(0);
    const leaf = classifierLeaves(geo.leaves)[0]!;
    expect(leaf.x).toBe(7);
    expect(leaf.y).toBe(7);
    // The 18x18 icon alone would total 7+18+13=38; the label drawn below it
    // must push the canvas taller than that box-only figure, to the EXACT
    // ensureVisible-corrected value, not the LimitFinder-ink-derived 46.
    expect(geo.totalHeight).toBeGreaterThan(38);
    expect(geo.totalHeight).toBe(44);
  });

  it('single collapsed-empty usymbol container -- NOT degenerate (mechanism A: a group before its own parse-time leaf collapse, cdd6-T2c item 2A)', () => {
    // dot/DotData.java:69-70 counts a group BEFORE the mute-to-leaf that
    // upstream defers to DOT-export time (svek/GraphvizImageBuilder.java:
    // 416-418); this port's `usymbol X { }` collapse happens at PARSE time
    // instead (class-container.ts#closeContainer), stamping
    // `Classifier.collapsedGroup = true` -- the gate must read THAT flag,
    // since the collapsed container is already gone from `ast.namespaces`.
    // Jar-verified: `unknown/febuli-89-dusi249`/`unknown/fezaro-08-nopo877`
    // (diagnosis/verify.md's "empty usymbol containers").
    const ast = makeAST({
      classifiers: [makeClassifier('A', { kind: 'descriptive', usymbol: 'queue', collapsedGroup: true })],
    });
    const { captured } = layoutAndCount(ast);
    expect(captured).toBe(1);
  });

  it('empty diagram (0 classifiers, 0 namespaces) -- 0 graphs, 10x10 EntityImageSimpleEmpty geometry', () => {
    // T3a (empty-diagram-simple-empty-body, diagnosis/S4-style.md):
    // `GraphvizImageBuilder.buildImage:211-212` returns a 10x10
    // `EntityImageSimpleEmpty` for this case (`GraphvizImageBuilder.java:
    // 168-169`), not a 0x0 body -- `totalWidth`/`totalHeight` are that 10x10
    // margined (`layout-ink-extent.ts#applyClassDocumentMargin`: 10+5 ->
    // floor(15+1) = 16), and `rawWidth`/`rawHeight` are the pre-margin 10x10.
    const { geo, captured } = layoutAndCount(makeAST());
    expect(captured).toBe(0);
    expect(geo.totalWidth).toBe(16);
    expect(geo.totalHeight).toBe(16);
    expect(geo.rawWidth).toBe(10);
    expect(geo.rawHeight).toBe(10);
    expect(classifierLeaves(geo.leaves)).toHaveLength(0);
  });

  it('end-to-end: "class A" alone renders an SVG containing the class box', () => {
    const svg = renderFixture('@startuml\nclass A\n@enduml');
    expect(svg).toContain('<svg');
    expect(svg).toContain('A');
  });

  it('end-to-end: a frame with an embedded nested diagram grows the degenerate canvas to the DRAWN image corner, not LimitFinder\'s shrunk-by-1 ink (cdd6-T2c item 3)', () => {
    // `frame X [ {{ nested }} ]` is a single descriptive leaf, no
    // relationships, no namespaces -- degenerate in both this port and the
    // jar (no svek-*.dot). Its embedded raster is drawn through the SAME
    // generic EntityImageDescription walk `descriptionLeafSymbolInk`/
    // `measureEntityLeafInk` uses for `frame`'s own label ink -- LimitFinder's
    // `drawImage` rule shrinks the tracked corner by 1 on both axes
    // (LimitFinder.java:198-201), which SvgGraphics#ensureVisible does NOT
    // (SvgGraphics.java:1033-1034/987-999). This fixture isolates that "+1"
    // channel from `unknown/josebu-55-seje426`'s own unrelated (a) defect
    // (T3e's nested-SEQUENCE-image-size bug) by nesting a plain CLASS
    // diagram instead -- diagnosis/verify.md's "nested renders — josebu"
    // section, sub-mechanism (b).
    const src = '@startuml\nframe FooBar [\n{{\nclass Foo\n}}\n]\n@enduml';
    const svg = renderFixture(src);
    const height = /height="(\d+)px"/.exec(svg)?.[1];
    const width = /width="(\d+)px"/.exec(svg)?.[1];
    // Width stays box-dominated (102) regardless of the correction -- only
    // height is ink-dominated for this fixture, moving 95 -> 96 once the
    // embed's drawn corner (not its LimitFinder-shrunk ink) is used.
    expect(width).toBe('102');
    expect(height).toBe('96');
  });
});
