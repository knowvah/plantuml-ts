/**
 * SI20 T2 — an object's `Class::member` edge anchors to that member's own
 * ROW port, not to the PORTIN/PORTOUT `:P` compass point.
 *
 * Upstream: `EntityImageObject#getShapeType` returns
 * `RECTANGLE_HTML_FOR_PORTS` whenever `getEntity().getPortShortNames()
 * .size() > 0` (`svek/image/EntityImageObject.java:249-253`, character-for-
 * character the class test at `EntityImageClass.java:255-259`), and
 * `#getPorts` translates the body's own `Ports` down by
 * `getNameAndSteretypeDimension().getHeight()` (`:264-270`). The `:P` form
 * is reserved for `leaf.getEntityPosition().usePortP()`
 * (`abel/Link.java:227-231` -> `EntityPort.forPort`,
 * `cucadiagram/EntityPort.java:60-62`), which an object leaf can never
 * satisfy — `port`/`portin`/`portout` declare `'descriptive'` leaves
 * (`class-descriptive-leaf-keywords.ts`), a kind disjoint from `'object'`.
 *
 * The band numbers below are the jar's, read off
 * `test-results/dot-cache/object/rozuxo-44-fudi093/svek-1.dot` — NOT fitted:
 * ../../../plans/si20-object-row-ports/decision-journal.md's T0 entry derives
 * them independently as `position = H + margin + Σ(prior member heights)`
 * with `H = title.height` (18 plain) and `margin = 4`
 * (`klimt/shape/TextBlockMarged.java:100-102`).
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph, DotInputNode } from '../../../src/core/graph-layout.js';
import { Ports } from '../../../src/core/svek/Ports.js';
import { classPortShortNamesById } from '../../../src/diagrams/class/class-port-rows.js';
import { shieldedClassifierIds } from '../../../src/diagrams/class/class-shield-helpers.js';
import type { ClassDiagramAST, Classifier, ClassifierKind } from '../../../src/diagrams/class/ast.js';

const measurer = new WidthTableMeasurer();

function captureAll(puml: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

function nodeById(graphs: DotInputGraph[], id: string): DotInputNode {
  const node = graphs.flatMap((g) => g.nodes).find((n) => n.id === id);
  expect(node, `expected a dot node for ${id}`).toBeDefined();
  return node!;
}

/** `oracle/goldens/object/rozuxo-44-fudi093/input.puml`, verbatim. */
const ROZUXO = [
  '@startuml',
  'object CC {',
  ' UK',
  ' USA',
  ' Germany',
  '}',
  '',
  'object users {',
  ' 1',
  ' 2',
  ' 3',
  '}',
  '',
  'CC::USA --> users::3',
  '@enduml',
].join('\n');

/** The oracle's own `PORT=` ids, spelled as the md5 encoder produces them
 *  (`svek/Ports.java:53-55`): `pf75d91cdd36b85cc4a8dfeca4f24fa14` for `USA`
 *  and `peccbc87e4b5ce2fe28308fd9f2a7baf3` for `3`. */
const PORT_USA = Ports.encodePortNameToId('USA');
const PORT_3 = Ports.encodePortNameToId('3');

/** T0's plain-object band frame, reproduced by the oracle rows below. */
const ROW_HEIGHT = 14;

function classifier(id: string, kind: ClassifierKind): Classifier {
  return { id, display: id, kind, typeParams: [], members: [] };
}

function astWith(kind: ClassifierKind): ClassDiagramAST {
  return {
    classifiers: [classifier('Foo', kind), classifier('Bar', 'class')],
    relationships: [{ from: 'Foo', to: 'Bar', type: 'association', fromPort: 'USA' }],
    namespaces: [],
    directives: [],
    notes: [],
  };
}

describe('SI20 T2 — object member-row port bands (rozuxo-44-fudi093)', () => {
  it('flips both object endpoints to shape=plaintext carrying the oracle bands', () => {
    const graphs = captureAll(ROZUXO);

    // Oracle sh0006: rows 36 / 14(PORT=pf75d91…) / 18 -> band at 36.
    expect(nodeById(graphs, 'CC').shape).toBe('plaintext');
    expect(nodeById(graphs, 'CC').portRows).toEqual([
      { id: PORT_USA, position: 36, height: ROW_HEIGHT },
    ]);
    // Oracle sh0007: rows 50 / 14(PORT=peccbc87…) / 4 -> band at 50.
    expect(nodeById(graphs, 'users').shape).toBe('plaintext');
    expect(nodeById(graphs, 'users').portRows).toEqual([
      { id: PORT_3, position: 50, height: ROW_HEIGHT },
    ]);
  });

  it('retires the `:P` compass shield on both endpoints (ADR-5)', () => {
    const graphs = captureAll(ROZUXO);

    expect(nodeById(graphs, 'CC').isPort).toBeUndefined();
    expect(nodeById(graphs, 'users').isPort).toBeUndefined();
  });

  it('names both member ports on the edge (`sh0006:pf75d91…->sh0007:peccbc87…`)', () => {
    const edges = captureAll(ROZUXO).flatMap((g) => g.edges);
    const edge = edges.find((e) => e.from === 'CC' && e.to === 'users');

    expect(edge, 'expected the CC -> users edge').toBeDefined();
    expect(edge!.attributes!.tailport).toBe(PORT_USA);
    expect(edge!.attributes!.headport).toBe(PORT_3);
  });
});

describe('SI20 T2 — classPortShortNamesById covers object leaves', () => {
  it('collects an object leaf\'s declared `::member` port names', () => {
    expect(classPortShortNamesById(astWith('object')).get('Foo')).toEqual(new Set(['USA']));
  });

  it('still collects a class-family leaf (SI17, unchanged)', () => {
    expect(classPortShortNamesById(astWith('class')).get('Foo')).toEqual(new Set(['USA']));
  });

  it('ADR-4: still EXCLUDES map, whose bands are mapPortRows\' own flat-sizer concern', () => {
    expect(classPortShortNamesById(astWith('map')).has('Foo')).toBe(false);
    expect(classPortShortNamesById(astWith('json')).has('Foo')).toBe(false);
  });
});

describe('SI20 T2 — memberPortIsP narrows to object ONLY (ADR-5)', () => {
  it('an object `::member` target is no longer a `:P` port', () => {
    expect(shieldedClassifierIds(astWith('object')).get('Foo')).toEqual({
      isPort: false,
      hasQualifier: false,
    });
  });

  it('a `portin`/`portout`/`port` leaf (kind `descriptive`) KEEPS `:P`', () => {
    expect(shieldedClassifierIds(astWith('descriptive')).get('Foo')).toEqual({
      isPort: true,
      hasQualifier: false,
    });
  });

  it('map and json marking is untouched (ADR-4)', () => {
    expect(shieldedClassifierIds(astWith('map')).get('Foo')!.isPort).toBe(true);
    expect(shieldedClassifierIds(astWith('json')).get('Foo')!.isPort).toBe(true);
  });
});

/**
 * SI20 ADR-2 (resolved by T0): the election's input text is upstream's
 * `Member.getDisplay(false)` — which for an OBJECT leaf this port
 * reconstructs with `formatObjectMemberText`
 * (`class-object-sizing.ts`), not with the class family's
 * `formatMemberText`. The two reconstructors are genuinely different
 * functions over the same parsed `Member`, and `MethodsOrFieldsArea
 * #getScore`'s `.*\bshortName\b.*` tier (`java:228-235`) is sensitive to the
 * difference — so feeding the class one to an object silently elects a
 * DIFFERENT row rather than failing.
 *
 * `rozuxo` cannot catch that: its members are bare words (`UK`, `USA`, `1`)
 * that both reconstructors render identically. The control below is built to
 * separate them, on the `\t` axis (G3/O4): `formatObjectMemberText` unescapes
 * a literal `\t` to a real tab byte (`Display.java:302-304`),
 * `formatMemberText` does not.
 */
describe('SI20 T2 — the object election text is formatObjectMemberText (ADR-2)', () => {
  // `zzz\tbar` reconstructs as `zzz<TAB>bar` (object) vs `zzz\tbar` (class).
  // For short name `bar`, the tab is a word BOUNDARY -> score 100, while the
  // literal `t` is a word CHARACTER -> no boundary -> the weaker CONTAINS
  // tier, score 50. `xbary` scores 50 under both. `Ports#add` replaces only
  // on a STRICTLY greater score (`svek/Ports.java:70-76`), so the wrong
  // reconstructor leaves member 1 (50, declared first) holding the band and
  // the right one hands it to member 2.
  const TAB_CONTROL = [
    '@startuml',
    'object O {',
    ' xbary',
    ' zzz\\tbar',
    '}',
    '',
    'object P {',
    ' target',
    '}',
    '',
    'O::bar --> P::target',
    '@enduml',
  ].join('\n');

  it('elects the tab-separated member (row 2), not the substring member (row 1)', () => {
    const rows = nodeById(captureAll(TAB_CONTROL), 'O').portRows;

    // Row 1 top = H(18) + margin(4) = 22; row 2 top = 22 + 14.
    expect(rows).toEqual([{ id: Ports.encodePortNameToId('bar'), position: 36, height: ROW_HEIGHT }]);
  });
});

/**
 * `BodyEnhanced1#getArea` wraps its area in `TextBlockUtils.withMinWidth(
 * area, minClassWidth, align)` when `style.value(PName.MinimumWidth) > 0`
 * (`cucadiagram/BodyEnhanced1.java:182-184`), and `TextBlockMinWidth` does
 * NOT implement `WithPorts` (`klimt/shape/TextBlockMinWidth.java:45`) — so
 * `BodyEnhanced1#getPorts`'s `area instanceof WithPorts` test (`:228-232`)
 * fails and the body reports an EMPTY `Ports`. Jar-confirmed on T0's
 * `ctl-minwidth.puml` control: the node still flips to
 * `RECTANGLE_HTML_FOR_PORTS` (the shape gate keys only on the port-name
 * COUNT) and the edge still names both md5 port ids — only the member
 * `PORT=` rows disappear.
 */
describe('SI20 T2 — skinparam minClassWidth suppresses every object band', () => {
  const MIN_WIDTH = ['@startuml', 'skinparam minClassWidth 300', ROZUXO.slice('@startuml\n'.length)].join('\n');

  it('emits NO member band, while keeping the shape flip and both edge ports', () => {
    const graphs = captureAll(MIN_WIDTH);

    expect(nodeById(graphs, 'CC').shape).toBe('plaintext');
    expect(nodeById(graphs, 'CC').portRows).toEqual([]);
    expect(nodeById(graphs, 'users').portRows).toEqual([]);
    const edge = graphs.flatMap((g) => g.edges).find((e) => e.from === 'CC' && e.to === 'users');
    expect(edge!.attributes!.tailport).toBe(PORT_USA);
    expect(edge!.attributes!.headport).toBe(PORT_3);
  });
});
