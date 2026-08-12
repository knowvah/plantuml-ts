import { describe, it, expect } from 'vitest';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

describe('toSvekDot — Svek-shaped DOT emission', () => {
  it('emits the digraph unix header and the standard graph attrs', () => {
    const dot = toSvekDot({ nodes: [{ id: 'a', width: 72, height: 36 }], edges: [] });
    expect(dot.startsWith('digraph unix {\n')).toBe(true);
    expect(dot).toContain('nodesep=0.486111;'); // 35px min ÷ 72
    expect(dot).toContain('ranksep=0.833333;'); // 60px min ÷ 72
    expect(dot).toContain('remincross=true;');
    expect(dot).toContain('searchsize=500;');
    expect(dot.trimEnd().endsWith('}')).toBe(true);
  });

  it('emits rankdir=LR only for LR graphs', () => {
    const lr = toSvekDot({ nodes: [], edges: [], rankDir: 'LR' });
    expect(lr).toContain('rankdir=LR;');
    const tb = toSvekDot({ nodes: [], edges: [], rankDir: 'TB' });
    expect(tb).not.toContain('rankdir');
  });

  it('emits rect nodes with empty label, inch sizes, and a color tag', () => {
    const dot = toSvekDot({ nodes: [{ id: 'a', width: 144, height: 72 }], edges: [] });
    expect(dot).toMatch(
      /sh\d{4} \[shape=rect,label="",width=2\.000000,height=1\.000000,color="#[0-9a-f]{6}"\];/,
    );
  });

  it('maps node shapes (rounded → rect+style=rounded; circle/diamond passthrough)', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'r', width: 10, height: 10, shape: 'rounded' },
        { id: 'c', width: 10, height: 10, shape: 'circle' },
        { id: 'd', width: 10, height: 10, shape: 'diamond' },
      ],
      edges: [],
    });
    expect(dot).toContain('shape=rect,style=rounded');
    expect(dot).toContain('shape=circle');
    expect(dot).toContain('shape=diamond');
  });

  it('emits edges with arrowtail/head=none and minlen', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 10, height: 10 },
        { id: 'b', width: 10, height: 10 },
      ],
      edges: [{ id: 'e0', from: 'a', to: 'b', attributes: { minLen: 2 } }],
    });
    expect(dot).toMatch(/sh\d{4}->sh\d{4}\[arrowtail=none,arrowhead=none,minlen=2,color="#[0-9a-f]{6}"\];/);
  });

  it('emits HTML-TABLE edge labels and style=invis', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 10, height: 10 },
        { id: 'b', width: 10, height: 10 },
      ],
      edges: [
        { id: 'e0', from: 'a', to: 'b', attributes: { label: 'x', labelWidth: 30, labelHeight: 17 } },
        { id: 'e1', from: 'a', to: 'b', attributes: { invis: true } },
      ],
    });
    expect(dot).toContain('label=<<TABLE BGCOLOR="#');
    expect(dot).toContain('FIXEDSIZE="TRUE" WIDTH="30" HEIGHT="17">');
    expect(dot).toContain('style=invis');
  });

  it('emits a cluster subgraph with title table and member nodes inside', () => {
    const g: DotInputGraph = {
      nodes: [
        { id: 'a', width: 10, height: 10 },
        { id: 'b', width: 10, height: 10 },
        { id: 'c', width: 10, height: 10 },
      ],
      edges: [],
      clusters: [{ id: 'cluster6', label: 'P', labelWidth: 55, labelHeight: 11, nodeIds: ['a', 'b'] }],
    };
    const dot = toSvekDot(g);
    expect(dot).toMatch(/subgraph cluster6 \{style=solid;color="#[0-9a-f]{6}";labeljust="c";label=<<TABLE/);
    // Members a,b live inside the cluster block; c stays at top level.
    const clusterBody = dot.slice(dot.indexOf('subgraph cluster6'), dot.indexOf('\n}\n}'));
    expect(clusterBody).toContain('width=0.138889'); // 10/72 — a member node line
  });

  it('emits rank constraint subgraphs', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 10, height: 10, attributes: { rank: 'same' } },
        { id: 'b', width: 10, height: 10, attributes: { rank: 'same' } },
      ],
      edges: [],
    });
    expect(dot).toMatch(/\{rank=same; sh\d{4}; sh\d{4}\}/);
  });

  it('emits a plaintext-shielded node as a shape=plaintext HTML TABLE with a PORT="h" cell', () => {
    const dot = toSvekDot({
      nodes: [{ id: 'a', width: 40, height: 20, shape: 'plaintext' }],
      edges: [],
    });
    expect(dot).toContain('shape=plaintext,label=<<TABLE');
    expect(dot).toContain('CELLBORDER="0"');
    expect(dot).toMatch(/BGCOLOR="#[0-9a-f]{6}" FIXEDSIZE="TRUE" WIDTH="40" HEIGHT="20" PORT="h"/);
    expect(dot).not.toMatch(/\bwidth=[\d.]+,height=[\d.]+/); // no bare width=/height= attrs
  });

  it('routes edges to a plaintext node through its ":h" port (Bibliotekon.getNodeUid)', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 10, height: 10 },
        { id: 'b', width: 20, height: 20, shape: 'plaintext' },
      ],
      edges: [{ id: 'e0', from: 'a', to: 'b', attributes: { minLen: 1 } }],
    });
    expect(dot).toMatch(/sh\d{4}->sh\d{4}:h\[arrowtail=none,arrowhead=none,minlen=1,/);
  });
});

// ===========================================================================
// ── PORT CLUSTERS — ClusterDotString port branch: rank groups INSIDE the
//    cluster ({rank=sink;shX;}), port nodes + bare constraint chains in the
//    outer cluster, clusterNee wrapping the title placeholder
// ===========================================================================

describe('toSvekDot — port cluster emission', () => {
  const portGraph = (): DotInputGraph => ({
    nodes: [
      {
        id: 'p1', width: 12, height: 12,
        shape: 'rect', isPort: true,
        attributes: { rank: 'sink' },
      },
      {
        id: 'anchor', width: 0.72, height: 0.72,
        shape: 'rect', titleLabelWidth: 70, titleLabelHeight: 16,
      },
    ],
    edges: [],
    clusters: [{
      id: 'cluster0',
      nodeIds: ['p1', 'anchor'],
      labelWidth: 70, labelHeight: 16,
      portRanks: [{ rank: 'sink', nodeIds: ['p1'] }],
      portAnchorId: 'anchor',
    }],
  });

  it('emits the rank group inside the cluster braces, svek format', () => {
    const dot = toSvekDot(portGraph());
    expect(dot).toMatch(/subgraph cluster0 \{style=solid;color="#[0-9a-f]+";labeljust="c";\{rank=sink;sh\d+;\}/);
  });

  it('wraps the placeholder in clusterNee and omits the cluster label attr', () => {
    const dot = toSvekDot(portGraph());
    expect(dot).toContain('subgraph cluster0ee {label="";');
    expect(dot).not.toMatch(/subgraph cluster0 \{[^\n]*label=</);
  });

  it('emits bare (bracket-less) port->anchor constraint chain', () => {
    const dot = toSvekDot(portGraph());
    expect(dot).toMatch(/sh\d+ \[arrowhead=none\];/);
    expect(dot).toMatch(/sh\d+->sh\d+;\n/);
  });

  it('does not duplicate port ranks at top level', () => {
    const dot = toSvekDot(portGraph());
    expect(dot).not.toMatch(/\{rank=sink; /);
  });
});

// ClusterDotString.java:148-149: `if (thereALinkFromOrToGroup2)
// sb.append(getSpecialPointId(group) + " [shape=point,width=.01,label=\"\"];")`
// runs UNCONDITIONALLY of hasPort() -- when a port cluster's anchor id is
// ALSO the target of a real edge (a note or link attached to the group
// itself, not one of its members), the oracle emits BOTH declarations for
// the same id: `shape=point` first, then the ee-placeholder's
// `shape=rect,...,label=<TABLE>` -- verified against gurive-62-ricu497 /
// repite-70-vabe533 oracle dumps. The comparator's `parseNodes` dedupes by
// first-seen id (tests/oracle/svek-dot.ts), so the FIRST line (`point`) is
// what the shape multiset actually asserts.
describe('toSvekDot — port cluster anchor also targeted by an outer edge', () => {
  const portGraphWithGroupEdge = (): DotInputGraph => ({
    nodes: [
      {
        id: 'p1', width: 12, height: 12,
        shape: 'rect', isPort: true,
        attributes: { rank: 'sink' },
      },
      {
        id: 'anchor', width: 0.72, height: 0.72,
        shape: 'rect', titleLabelWidth: 70, titleLabelHeight: 16,
        groupAnchorAlsoPoint: true,
      },
      { id: 'note', width: 100, height: 20 },
    ],
    edges: [{ id: 'e1', from: 'anchor', to: 'note' }],
    clusters: [{
      id: 'cluster0',
      nodeIds: ['p1', 'anchor'],
      labelWidth: 70, labelHeight: 16,
      portRanks: [{ rank: 'sink', nodeIds: ['p1'] }],
      portAnchorId: 'anchor',
    }],
  });

  it('emits the point pre-declaration before the ee-placeholder rect/table line', () => {
    const dot = toSvekDot(portGraphWithGroupEdge());
    const anchorSh = /(sh\d+) \[shape=rect,width=\.01,height=\.01,label=<<TABLE/.exec(dot)![1]!;
    const pointRe = new RegExp(`${anchorSh} \\[shape=point,width=\\.01,label=""\\];`);
    expect(dot).toMatch(pointRe);
    const pointIdx = dot.search(pointRe);
    const rectIdx = dot.indexOf(`${anchorSh} [shape=rect,width=.01,height=.01,label=<<TABLE`);
    expect(pointIdx).toBeGreaterThanOrEqual(0);
    expect(pointIdx).toBeLessThan(rectIdx);
  });

  it('does NOT emit the point pre-declaration when the anchor is not targeted by an outer edge', () => {
    const graph = portGraphWithGroupEdge();
    graph.edges = [];
    graph.nodes = graph.nodes.filter((n) => n.id !== 'note');
    const anchor = graph.nodes.find((n) => n.id === 'anchor')!;
    delete anchor.groupAnchorAlsoPoint;
    const dot = toSvekDot(graph);
    expect(dot).not.toMatch(/shape=point,width=\.01,label=""/);
  });
});

// ===========================================================================
// ── KERMOR — `!pragma kermor on` (svek/ClusterDotStringKermor.java,
//    Cluster.java:595-609 printCluster3_forKermor, DotStringFactory.java
//    :111-114/247-249). See description-dot-100 decision-journal.md I2.
// ===========================================================================

describe('toSvekDot — kermor cluster/ranksep path (`!pragma kermor on`)', () => {
  it('floors ranksep at 40px (not 60px) under kermor — DotStringFactory.getMinRankSep():247-249', () => {
    const dot = toSvekDot({ nodes: [{ id: 'a', width: 72, height: 36 }], edges: [], kermor: true });
    expect(dot).toContain('ranksep=0.555556;'); // 40px ÷ 72
    expect(dot).not.toContain('ranksep=0.833333;');
  });

  it('leaves nodesep at the 35px floor under kermor (getMinNodeSep never checks kermor)', () => {
    const dot = toSvekDot({ nodes: [{ id: 'a', width: 72, height: 36 }], edges: [], kermor: true });
    expect(dot).toContain('nodesep=0.486111;');
  });

  it('respects an explicit rankSepExplicit override even under kermor', () => {
    const dot = toSvekDot({
      nodes: [{ id: 'a', width: 72, height: 36 }],
      edges: [],
      kermor: true,
      rankSep: 30,
      rankSepExplicit: true,
    });
    expect(dot).toContain('ranksep=0.416667;'); // 30px ÷ 72, no floor applied
  });

  it('emits a top-level `rootEmpty` point placeholder when every node is clustered', () => {
    const dot = toSvekDot({
      nodes: [{ id: 'leaf', width: 72, height: 36 }],
      edges: [],
      kermor: true,
      clusters: [{ id: 'cluster0', nodeIds: ['leaf'] }],
    });
    expect(dot).toContain('rootEmpty [shape=point,label=""];');
    // Root placeholder precedes the cluster subgraph (DotStringFactory.java:184
    // calls root.printCluster3_forKermor before recursing into children).
    expect(dot.indexOf('rootEmpty')).toBeLessThan(dot.indexOf('subgraph cluster0gamma'));
  });

  it('does NOT emit the root placeholder when a top-level unclustered node exists', () => {
    const dot = toSvekDot({
      nodes: [{ id: 'top', width: 72, height: 36 }],
      edges: [],
      kermor: true,
    });
    expect(dot).not.toContain('Empty [shape=point');
  });

  it('names the cluster subgraph `${id}gamma`, never bare `clusterN` — matches the oracle: under kermor no subgraph is ever named literally `clusterN` (always …alpha/…beta/…gamma), which is why the comparator\'s clusterOk always sees an empty oracle cluster list for kermor fixtures', () => {
    const dot = toSvekDot({
      nodes: [{ id: 'leaf', width: 72, height: 36 }],
      edges: [],
      kermor: true,
      clusters: [{ id: 'cluster0', nodeIds: ['leaf'] }],
    });
    expect(dot).toContain('subgraph cluster0gamma {');
    expect(dot).not.toMatch(/subgraph cluster0 \{/);
  });

  it('emits an empty-cluster placeholder when a cluster has zero direct non-port members', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'port1', width: 10, height: 10, shape: 'plaintext', isPort: true },
      ],
      edges: [],
      kermor: true,
      clusters: [{
        id: 'cluster0',
        nodeIds: ['port1'],
        portRanks: [{ rank: 'sink', nodeIds: ['port1'] }],
      }],
    });
    expect(dot).toContain('cluster0empty [shape=point,label=""];');
  });

  it('emits port nodes at their rank WITHOUT an anchor/rank-chain edge (ClusterDotStringKermor.printRanks has no hasPort() chain branch)', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'normal', width: 72, height: 36 },
        { id: 'port1', width: 10, height: 10, shape: 'plaintext', isPort: true },
      ],
      edges: [],
      kermor: true,
      clusters: [{
        id: 'cluster0',
        nodeIds: ['normal', 'port1'],
        portRanks: [{ rank: 'sink', nodeIds: ['port1'] }],
      }],
    });
    expect(dot).toMatch(/\{rank=sink;sh\d+;\}/);
    expect(dot).not.toContain('[arrowhead=none]');
    expect(dot).not.toMatch(/sh\d+->sh\d+;\n/); // no bare (bracket-less) anchor chain link
  });

  it('nests child clusters inside their parent gamma subgraph', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'parentLeaf', width: 72, height: 36 },
        { id: 'childLeaf', width: 72, height: 36 },
      ],
      edges: [],
      kermor: true,
      clusters: [
        { id: 'cluster0', nodeIds: ['parentLeaf'] },
        { id: 'cluster1', nodeIds: ['childLeaf'], parentId: 'cluster0' },
      ],
    });
    const outerBody = dot.slice(dot.indexOf('subgraph cluster0gamma'));
    expect(outerBody).toContain('subgraph cluster1gamma {');
  });
});

/**
 * M1 — `SvekNode#appendLabelHtmlSpecialForLink` (svek/SvekNode.java:268-296)
 * and its `appendTr` helper (`:298-311`).
 *
 * Every constant below is READ OFF a committed jar oracle DOT, never chosen:
 * `test-results/dot-cache/object/{fusopu-05-loxo960,rozuxo-44-fudi093,
 * gatefi-65-curu360}/svek-1.dot`. The md5 port ids are the jar's own
 * (`Ports#encodePortNameToId`, svek/Ports.java:53-55).
 */
describe('toSvekDot — RECTANGLE_HTML_FOR_PORTS row-port tables', () => {
  /** gatefi-65-curu360/svek-1.dot sh0006: `map map0`, zero rows. */
  const GATEFI_BOX_WIDTH = 49;
  const GATEFI_BOX_HEIGHT = 18;

  /** fusopu-05-loxo960/svek-1.dot sh0006 (`map User`, one row `method3`):
   *  box 74.425 x 36, an 18px title filler then the 18px `method3` port row. */
  const FUSOPU_USER_WIDTH = 74.425;
  const FUSOPU_USER_HEIGHT = 36;
  const FUSOPU_TITLE_HEIGHT = 18;
  const FUSOPU_ROW_HEIGHT = 18;
  /** jar's `Ports.encodePortNameToId("method3")`, read off sh0006. */
  const FUSOPU_METHOD3_PORT = 'p48c4d45fdb68cdc056e4871ac668c7e5';
  /** jar's id for `__method1__`, read off sh0007's first port row. */
  const FUSOPU_METHOD1_PORT = 'pcb851aedb8f4a103116df5644c66a401';

  /** rozuxo-44-fudi093/svek-1.dot sh0006 (`object CC`, port on member `USA`):
   *  36px filler (18 header + 4 body margin + 14 `UK`), 14px port row, 18px
   *  trailer (14 `Germany` + 4 bottom body margin). */
  const ROZUXO_CC_WIDTH = 69.48750000000001;
  const ROZUXO_CC_HEIGHT = 68;
  const ROZUXO_USA_POSITION = 36;
  const ROZUXO_MEMBER_HEIGHT = 14;
  const ROZUXO_USA_PORT = 'pf75d91cdd36b85cc4a8dfeca4f24fa14';

  it('emits a portless node as one full-height trailer row (gatefi-65-curu360)', () => {
    const dot = toSvekDot({
      nodes: [{
        id: 'map0',
        width: GATEFI_BOX_WIDTH,
        height: GATEFI_BOX_HEIGHT,
        shape: 'plaintext',
        portRows: [],
      }],
      edges: [],
    });
    expect(dot).toContain(
      'shape=plaintext,label=<<TABLE BGCOLOR="#000006" BORDER="0" CELLBORDER="0" ' +
      'CELLSPACING="0" CELLPADDING="0">' +
      '<TR><TD  FIXEDSIZE="TRUE" WIDTH="49.0" HEIGHT="18"></TD></TR></TABLE>>];',
    );
    // No width=/height= node attribute at all — graphviz sizes it from the
    // label and pads it (SvekNode.java:268-296 emits neither).
    expect(dot).not.toMatch(/shape=plaintext,label=<<TABLE[^\n]*width=/);
  });

  it('emits a filler row, then the port row, then the trailer (fusopu-05-loxo960)', () => {
    const dot = toSvekDot({
      nodes: [{
        id: 'User',
        width: FUSOPU_USER_WIDTH,
        height: FUSOPU_USER_HEIGHT,
        shape: 'plaintext',
        portRows: [
          { id: FUSOPU_METHOD3_PORT, position: FUSOPU_TITLE_HEIGHT, height: FUSOPU_ROW_HEIGHT },
        ],
      }],
      edges: [],
    });
    expect(dot).toContain(
      '<TR><TD  FIXEDSIZE="TRUE" WIDTH="74.425" HEIGHT="18"></TD></TR>' +
      `<TR><TD  FIXEDSIZE="TRUE" WIDTH="74.425" HEIGHT="18" PORT="${FUSOPU_METHOD3_PORT}">` +
      '</TD></TR></TABLE>',
    );
  });

  it('drops zero-height filler and trailer rows (appendTr `if (height <= 0) return`)', () => {
    // A port at position 0 covering the whole box: no filler before it, no
    // trailer after it — exactly one TR.
    const dot = toSvekDot({
      nodes: [{
        id: 'only',
        width: FUSOPU_USER_WIDTH,
        height: FUSOPU_ROW_HEIGHT,
        shape: 'plaintext',
        portRows: [{ id: FUSOPU_METHOD1_PORT, position: 0, height: FUSOPU_ROW_HEIGHT }],
      }],
      edges: [],
    });
    const table = dot.slice(dot.indexOf('<TABLE'), dot.indexOf('</TABLE>'));
    expect(table.match(/<TR>/g)).toHaveLength(1);
    expect(table).toContain(`PORT="${FUSOPU_METHOD1_PORT}"`);
  });

  it('truncates the trailer height to an int (rozuxo-44-fudi093 object rows)', () => {
    const dot = toSvekDot({
      nodes: [{
        id: 'CC',
        width: ROZUXO_CC_WIDTH,
        height: ROZUXO_CC_HEIGHT,
        shape: 'plaintext',
        portRows: [
          { id: ROZUXO_USA_PORT, position: ROZUXO_USA_POSITION, height: ROZUXO_MEMBER_HEIGHT },
        ],
      }],
      edges: [],
    });
    expect(dot).toContain(
      '<TR><TD  FIXEDSIZE="TRUE" WIDTH="69.48750000000001" HEIGHT="36"></TD></TR>' +
      `<TR><TD  FIXEDSIZE="TRUE" WIDTH="69.48750000000001" HEIGHT="14" PORT="${ROZUXO_USA_PORT}">` +
      '</TD></TR>' +
      '<TR><TD  FIXEDSIZE="TRUE" WIDTH="69.48750000000001" HEIGHT="18"></TD></TR>',
    );
  });

  it('anchors edges to the named row ports, not to ":h" (fusopu-05-loxo960)', () => {
    const dot = toSvekDot({
      nodes: [
        {
          id: 'User', width: FUSOPU_USER_WIDTH, height: FUSOPU_USER_HEIGHT, shape: 'plaintext',
          portRows: [{ id: FUSOPU_METHOD3_PORT, position: FUSOPU_TITLE_HEIGHT, height: FUSOPU_ROW_HEIGHT }],
        },
        {
          id: 'Interface', width: FUSOPU_USER_WIDTH, height: FUSOPU_USER_HEIGHT, shape: 'plaintext',
          portRows: [{ id: FUSOPU_METHOD1_PORT, position: FUSOPU_TITLE_HEIGHT, height: FUSOPU_ROW_HEIGHT }],
        },
      ],
      edges: [{
        id: 'e0',
        from: 'User',
        to: 'Interface',
        attributes: { minLen: 1, tailport: FUSOPU_METHOD3_PORT, headport: FUSOPU_METHOD1_PORT },
      }],
    });
    expect(dot).toMatch(
      new RegExp(`sh\\d{4}:${FUSOPU_METHOD3_PORT}->sh\\d{4}:${FUSOPU_METHOD1_PORT}\\[`),
    );
  });

  it('still routes a portRows node with no edge port through ":h"', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 20, height: 20, shape: 'plaintext' },
        { id: 'b', width: 20, height: 20, shape: 'plaintext' },
      ],
      edges: [{ id: 'e0', from: 'a', to: 'b', attributes: { minLen: 1 } }],
    });
    expect(dot).toMatch(/sh\d{4}:h->sh\d{4}:h\[/);
  });

  /**
   * B1 (SI17, `plans/si17-class-row-ports/decision-journal.md`) — the `:h`
   * fall-through. `Bibliotekon#getNodeUid` (svek/Bibliotekon.java:126-132)
   * gates `:h` on `SvekNode#isShielded()` (a qualified-association test,
   * `:383-396`), NOT on having port rows — a `RECTANGLE_HTML_FOR_PORTS`
   * node whose link named no member row must get the BARE uid.
   * Jar-verified: bicabi-42-coto932 `sh0009->sh0007` (no `:h`), pijiju-95-
   * xexi872 `sh0007->sh0008`/`sh0007->sh0009`, refeku-65-gapu585
   * `sh0007->sh0008` (`test-results/dot-cache/class/{bicabi-42-coto932,
   * pijiju-95-xexi872,refeku-65-gapu585}/svek-1.dot`).
   */
  it('routes a portRows node with no matching row port to the BARE uid, not ":h"', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 20, height: 20 },
        {
          id: 'b', width: 20, height: 20, shape: 'plaintext',
          portRows: [{ id: FUSOPU_METHOD1_PORT, position: 0, height: FUSOPU_ROW_HEIGHT }],
        },
      ],
      edges: [{ id: 'e0', from: 'a', to: 'b', attributes: { minLen: 1 } }],
    });
    expect(dot).toMatch(/sh\d{4}->sh\d{4}\[arrowtail=none,arrowhead=none,minlen=1,/);
    expect(dot).not.toMatch(/->sh\d{4}:h\[/);
  });

  /**
   * B1 regression guard: a portRows node that IS ALSO the qualified end of
   * some link (`DotInputNode.qualifierShielded`) must keep the `:h` suffix
   * — `isShielded()` is independent of the `RECTANGLE_HTML_FOR_PORTS` shape
   * (svek/SvekNode.java:383-396 has no type check at all). No corpus
   * fixture combines port short names with a qualified association, so
   * this is the fixture-free coverage for that combination.
   */
  it('still shields a portRows node marked qualifierShielded', () => {
    const dot = toSvekDot({
      nodes: [
        { id: 'a', width: 20, height: 20 },
        {
          id: 'b', width: 20, height: 20, shape: 'plaintext', qualifierShielded: true,
          portRows: [{ id: FUSOPU_METHOD1_PORT, position: 0, height: FUSOPU_ROW_HEIGHT }],
        },
      ],
      edges: [{ id: 'e0', from: 'a', to: 'b', attributes: { minLen: 1 } }],
    });
    expect(dot).toMatch(/sh\d{4}->sh\d{4}:h\[arrowtail=none,arrowhead=none,minlen=1,/);
  });
});
