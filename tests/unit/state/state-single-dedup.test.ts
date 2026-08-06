/**
 * SI1/T11 — state parser adoption of the shared `-[single]->` add-time
 * dedup (ADR-3): `CommandLinkStateCommon` links flow through
 * `net.atmp.CucaDiagram#addLink` (:896-901) upstream — a `single` link
 * (the `single` ARROW_STYLE token, `WithLinkType.goSingle`/`isSingle`) is
 * silently dropped when ANY other link already connects the same two
 * entities (`Link.sameConnections`, abel/Link.java:462-470). Wired at
 * `state-link-add.ts#emitTransition` over the flat
 * `ParseState.linkConnections` mirror of upstream's one links list.
 * Mirrors description's LG-10..LG-16 suite. Jar-oracle fixture:
 * oracle/goldens/state/si1-single-dedup-state/.
 */
import { describe, it, expect } from 'vitest';
import { parseState } from '../../../src/diagrams/state/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { StateDiagramAST } from '../../../src/diagrams/state/ast.js';

function parse(source: string): StateDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'state' };
  return parseState(block);
}

describe('state transitions — single keyword (add-time dedup, not a render style)', () => {
  it('SSD-1: A -[single]-> B parses and is kept (first of its pair)', () => {
    const ast = parse('A -[single]-> B');
    expect(ast.transitions).toHaveLength(1);
    expect(ast.transitions[0]).toMatchObject({ from: 'A', to: 'B', arrowStyle: 'single' });
  });

  it('SSD-2: three identical single links between the same pair collapse to one', () => {
    const ast = parse(['A -[single]-> B', 'A -[single]-> B', 'A -[single]-> B'].join('\n'));
    expect(ast.transitions).toHaveLength(1);
  });

  it('SSD-3: a single link dedups against a same-pair link in EITHER direction', () => {
    const ast = parse(['A -[single]-> B', 'B -[single]-> A'].join('\n'));
    expect(ast.transitions).toHaveLength(1);
    expect(ast.transitions[0]).toMatchObject({ from: 'A', to: 'B' });
  });

  it('SSD-4: single dedup does not cross different endpoint pairs', () => {
    const ast = parse(['A -[single]-> B', 'A -[single]-> C', 'C -[single]-> B'].join('\n'));
    expect(ast.transitions).toHaveLength(3);
  });

  it('SSD-5: non-single links never dedup, even between the same pair', () => {
    const ast = parse(['A --> B', 'A --> B', 'A --> B'].join('\n'));
    expect(ast.transitions).toHaveLength(3);
  });

  it('SSD-6: a single link still dedups against a prior NON-single link on the same pair', () => {
    const ast = parse(['A --> B', 'A -[single]-> B'].join('\n'));
    expect(ast.transitions).toHaveLength(1);
    expect(ast.transitions[0]!.arrowStyle).toBeUndefined();
  });

  it('SSD-7: [*] as source and [*] as target are DISTINCT entities (start vs final) — never conflated', () => {
    // Upstream getStart()/getEnd() are different per-group entities
    // (CommandLinkStateCommon#getStateOrGroup) — a naive string compare
    // would reverse-match these two and wrongly drop the second.
    const ast = parse(['[*] --> A', 'A -[single]-> [*]'].join('\n'));
    expect(ast.transitions).toHaveLength(2);
  });

  it('SSD-8: a duplicate [*]-pair in the SAME scope does dedup', () => {
    const ast = parse(['[*] --> A', '[*] -[single]-> A'].join('\n'));
    expect(ast.transitions).toHaveLength(1);
  });

  it('SSD-9: dedup scans the whole diagram, across composite scopes (upstream links list is flat)', () => {
    const ast = parse(['state S {', 'X --> Y', '}', 'X -[single]-> Y'].join('\n'));
    // The inner X --> Y lives on S's scope; the outer single duplicate must
    // still see it (same resolved entities via global by-name reuse).
    expect(ast.transitions).toHaveLength(0);
    const s = ast.states.find((st) => st.id === 'S');
    expect(s?.transitions).toHaveLength(1);
  });

  it('SSD-10: a dropped duplicate still burns its shared-counter tick (Link ctor uid, abel/Link.java:135)', () => {
    // Pass two: A(1), B(2), kept link(3), dropped link burns 4, C(5), link(6).
    const ast = parse(['A --> B', 'A -[single]-> B', 'B --> C'].join('\n'));
    expect(ast.transitions).toHaveLength(2);
    expect(ast.transitions[0]!.creationIndex).toBe(3);
    expect(ast.transitions[1]!.creationIndex).toBe(6);
  });

  it('SSD-11: dedup applies with single combined with other bracket tokens', () => {
    const ast = parse(['A --> B', 'A -[dotted,single]-> B'].join('\n'));
    expect(ast.transitions).toHaveLength(1);
  });
});
