/**
 * cdd6-T0b (D9): unit tests for the survey's split-out `dotEqual` comparison
 * — the three instrument defects cdd5 found (nested-embed graphs counted,
 * pragma-in-comment matched, newpage compared past page 1) and the
 * comment-stripping primitive they share.
 *
 * cdd7-T1g' (D6 amendment, journal rows 10/24): defect 1's fix was itself
 * corrected — a nested embed is excluded only when it is Smetana-routed
 * (json/yaml/hcl); a graphviz-routed nested embed (rojida's `{{ class }}`)
 * IS compared, as a deduplicated structural-identity SET. The two tests this
 * replaces (`nested-embed graphs are excluded, degenerate outer -> true` and
 * `a nested-embed graph is excluded even when an outer graph also exists`)
 * encoded the now-corrected over-broad premise using GENERIC markup (no
 * actual `{{yaml}}`/`{{json}}` keyword) — under the new mechanism that
 * markup no longer signals exclusion, so their expectations are rewritten
 * below using real-shaped markup instead.
 */
import { describe, it, expect } from 'vitest';
import {
  nonCommentLines,
  hasActiveSmetanaPragma,
  hasNewpage,
  hasSmetanaRoutedEmbed,
  computeDotEqual,
} from '../../../scripts/lib/survey-dot-equal.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import type { LayoutInputEvent } from '../../../src/core/graph-layout.js';

const graphA: DotInputGraph = { nodes: [{ id: 'A', width: 72, height: 36 }], edges: [] };
const graphB: DotInputGraph = { nodes: [{ id: 'B', width: 72, height: 36 }], edges: [] };
const outer = (graph: DotInputGraph): LayoutInputEvent => ({ graph, nestedDepth: 0 });
const nested = (graph: DotInputGraph): LayoutInputEvent => ({ graph, nestedDepth: 1 });

// unknown/rojida-14-fuli428's real shape (T1g report): 1 outer graph (4
// package nodes, 4 dependency edges) plus TWO DISTINCT nested `{{ class }}`
// embed shapes, each dumped twice by the jar (measure + draw) and captured
// three times by this port (measure + ink + draw) — see the module under
// test's doc comment, defect 1 correction.
const rojidaOuter: DotInputGraph = {
  nodes: [
    { id: 'P1', width: 100, height: 70 },
    { id: 'P2', width: 120, height: 70 },
    { id: 'P3', width: 130, height: 70 },
    { id: 'P4', width: 160, height: 70 },
  ],
  edges: [
    { id: 'e1', from: 'P1', to: 'P2' },
    { id: 'e2', from: 'P2', to: 'P3' },
    { id: 'e3', from: 'P2', to: 'P4' },
    { id: 'e4', from: 'P4', to: 'P3' },
  ],
};
const nestedShapeX: DotInputGraph = {
  nodes: [
    { id: 'X1', width: 90, height: 48 },
    { id: 'X2', width: 90, height: 48 },
  ],
  edges: [],
};
const nestedShapeY: DotInputGraph = {
  nodes: [
    { id: 'Y1', width: 60, height: 48 },
    { id: 'Y2', width: 60, height: 48 },
  ],
  edges: [],
};
const rojidaMarkup =
  '@startuml\npackage A [\n{{\nclass foo\n}}\n]\npackage B [\n{{\ninterface bar\ninterface baz\n}}\n]\nA..>B\n@enduml';
const rojidaDots = [
  toSvekDot(nestedShapeX),
  toSvekDot(nestedShapeY),
  toSvekDot(rojidaOuter),
  toSvekDot(nestedShapeX),
  toSvekDot(nestedShapeY),
];
const rojidaEvents: LayoutInputEvent[] = [
  nested(nestedShapeX),
  nested(nestedShapeX),
  nested(nestedShapeY),
  nested(nestedShapeY),
  outer(rojidaOuter),
  nested(nestedShapeX),
  nested(nestedShapeY),
];

// unknown/gubeca-19-lemu434's real shape: a degenerate outer (`file n [ ... ]`
// needs no graphviz on either side, 0 dumps) wrapping ONE `{{yaml ...}}`
// embed, which this port's own `layoutGraph()` seam still calls three times
// even though the jar Smetana-routes yaml and dumps nothing at all for it.
const gubecaMarkup = '@startuml\nfile n [\nExample:\n{{yaml\nfruit: Apple\nsize: Large\n}}\n]\n@enduml';
const gubecaEvents: LayoutInputEvent[] = [nested(graphA), nested(graphA), nested(graphA)];

// ---------------------------------------------------------------------------
// nonCommentLines — ReadFilterQuoteComment.java:51-78
// ---------------------------------------------------------------------------

describe('nonCommentLines', () => {
  it('drops a line whose first non-space char is a single quote', () => {
    expect(nonCommentLines("'!pragma layout smetana\na |o-- b")).toEqual(['a |o-- b']);
  });

  it('keeps a line where the quote is not the first non-space char', () => {
    expect(nonCommentLines("a |o-- b's edge")).toEqual(["a |o-- b's edge"]);
  });

  it('drops a one-line block comment', () => {
    expect(nonCommentLines("/' note '/\nfoo")).toEqual(['foo']);
  });

  it('drops every line inside a multi-line block comment, inclusive', () => {
    expect(nonCommentLines("/' start\nmiddle\nend '/\nfoo")).toEqual(['foo']);
  });

  it("keeps a line that opens AND closes a block comment mid-line (java:70: opener only when no '/ follows)", () => {
    // ReadFilterQuoteComment.java:70 — `trim.startsWith("/'") && trim.contains("'/") == false`
    // opens the long comment; a `/' x '/ foo` line reaches removeInnerComment and is kept.
    expect(nonCommentLines("/' x '/ foo\nbar")).toEqual(["/' x '/ foo", 'bar']);
  });

  it('folds tabs to spaces before trimming, matching the jar', () => {
    expect(nonCommentLines("\t'commented\nfoo")).toEqual(['foo']);
  });
});

// ---------------------------------------------------------------------------
// hasActiveSmetanaPragma — cdd5 S2 harness:pragma-regex-matches-comment
// ---------------------------------------------------------------------------

describe('hasActiveSmetanaPragma', () => {
  it('true for an active pragma line', () => {
    expect(hasActiveSmetanaPragma('@startuml\n!pragma layout smetana\na--b\n@enduml')).toBe(true);
  });

  it('unknown/xicili-92-foke737: false when the pragma line is commented out', () => {
    const markup = "@startuml\n'!pragma layout smetana\n'breaks\na |o-- b\n@enduml";
    expect(hasActiveSmetanaPragma(markup)).toBe(false);
  });

  it('false when no pragma line exists at all', () => {
    expect(hasActiveSmetanaPragma('@startuml\na--b\n@enduml')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasNewpage — descdiagram/command/CommandNewpage.java:58-60
// ---------------------------------------------------------------------------

describe('hasNewpage', () => {
  it('unknown/racujo-01-veme537: true for a bare newpage line', () => {
    expect(hasNewpage('@startuml\npackage "One" {\n}\nnewpage\npackage "Two" {\n}\n@enduml')).toBe(true);
  });

  it('false when no newpage line exists', () => {
    expect(hasNewpage('@startuml\na--b\n@enduml')).toBe(false);
  });

  it('false when the newpage line is commented out', () => {
    expect(hasNewpage("@startuml\n'newpage\na--b\n@enduml")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasSmetanaRoutedEmbed — cdd7-T1g' (D6): defect 1 correction
// ---------------------------------------------------------------------------

describe('hasSmetanaRoutedEmbed', () => {
  it('unknown/gubeca-19-lemu434: true for a {{yaml ...}} embed', () => {
    expect(hasSmetanaRoutedEmbed(gubecaMarkup)).toBe(true);
  });

  it('unknown/jixibu-01-xave465: true for a {{json ...}} embed', () => {
    expect(hasSmetanaRoutedEmbed('@startuml\nfile n [\n{{json\n{"a":1}\n}}\n]\n@enduml')).toBe(true);
  });

  it('unknown/rojida-14-fuli428: false for a bare {{ }} embed (default type "uml")', () => {
    expect(hasSmetanaRoutedEmbed(rojidaMarkup)).toBe(false);
  });

  it('false when there is no embed at all', () => {
    expect(hasSmetanaRoutedEmbed('@startuml\na--b\n@enduml')).toBe(false);
  });

  it('false when the {{yaml}} line is commented out', () => {
    expect(hasSmetanaRoutedEmbed("@startuml\n'{{yaml\na--b\n@enduml")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeDotEqual
// ---------------------------------------------------------------------------

describe('computeDotEqual', () => {
  const markup = '@startuml\na--b\n@enduml';

  it('true when both sides skip graphviz (degenerate diagrams)', () => {
    expect(computeDotEqual([], [], false, markup)).toBe(true);
  });

  it('false when the oracle dumped DOT but we fed no candidate graph', () => {
    expect(computeDotEqual([toSvekDot(graphA)], [], false, markup)).toBe(false);
  });

  it('false on a graph-count mismatch (no newpage in the source)', () => {
    expect(computeDotEqual([toSvekDot(graphA), toSvekDot(graphA)], [outer(graphA)], false, markup)).toBe(false);
  });

  it('false when oracleBlind, even if both sides trivially agree', () => {
    expect(computeDotEqual([], [], true, markup)).toBe(false);
    expect(computeDotEqual([toSvekDot(graphA)], [outer(graphA)], true, markup)).toBe(false);
  });

  it('true when the emitted DOT is structurally equal to the oracle DOT', () => {
    expect(computeDotEqual([toSvekDot(graphA)], [outer(graphA)], false, markup)).toBe(true);
  });

  it('false when node shape diverges structurally', () => {
    const oracleDot = toSvekDot(graphA);
    const differentGraph: DotInputGraph = {
      nodes: [{ id: 'A', width: 200, height: 36, shape: 'diamond' }],
      edges: [],
    };
    expect(computeDotEqual([oracleDot], [outer(differentGraph)], false, markup)).toBe(false);
  });

  // -- defect 1 (corrected cdd7-T1g', D6): Smetana-routed nested embeds are
  // excluded; graphviz-routed nested embeds are compared as a structural SET --

  it('unknown/gubeca-19-lemu434: a Smetana-routed (yaml) nested embed is excluded, degenerate outer -> true', () => {
    // The outer "file n [ ... {{yaml ... }} ]" diagram needs no graphviz of
    // its own (0 svek dumps); the yaml embed's OWN measure+ink+draw layout
    // calls (nestedDepth 1) must not be compared against them, because the
    // markup names a Smetana-routed type keyword.
    expect(computeDotEqual([], gubecaEvents, false, gubecaMarkup)).toBe(true);
  });

  it('unknown/rojida-14-fuli428: a graphviz-routed nested embed IS compared, as a deduplicated SET', () => {
    // 5 oracle dumps (1 outer + 2 distinct nested shapes x2) vs 7 port events
    // (1 outer + 2 distinct nested shapes x3, one extra pass per embed) — the
    // outer matches positionally-independent, and the two nested SETS (each
    // deduplicated to its 2 distinct shapes) correspond.
    expect(computeDotEqual(rojidaDots, rojidaEvents, false, rojidaMarkup)).toBe(true);
  });

  it('a nested embed with NO markup type keyword but NO matching oracle dump is a genuine mismatch (false)', () => {
    // Not Smetana-routed (no {{yaml}}/{{json}}/{{hcl}} keyword in the
    // markup), so it enters the graphviz-routed comparison tier — and the
    // jar never dumped anything for it (`dots` holds only the outer graph),
    // so it has no partner: a real divergence, not an exclusion.
    const events = [outer(graphA), nested(graphB)];
    expect(computeDotEqual([toSvekDot(graphA)], events, false, markup)).toBe(false);
  });

  // compareStructural's `structurallyEqual` deliberately excludes node
  // width/height (svek-dot.ts:434, "ids/colors/sizes excluded") -- rojida's
  // own two real nested shapes differ ONLY in width (both 2 nodes, 0 edges),
  // so per this comparator's own documented scope they occupy the SAME
  // structural bucket (harmless: computeDotEqual has never compared sizes,
  // not even for the outer graph). A genuine structural mismatch therefore
  // needs a TOPOLOGY difference (edge count here), not a width change.
  const connectedNestedShape: DotInputGraph = {
    nodes: [
      { id: 'Z1', width: 90, height: 48 },
      { id: 'Z2', width: 90, height: 48 },
    ],
    edges: [{ id: 'ze1', from: 'Z1', to: 'Z2' }],
  };
  const disconnectedAndConnectedDots = [
    toSvekDot(nestedShapeX),
    toSvekDot(connectedNestedShape),
    toSvekDot(rojidaOuter),
    toSvekDot(nestedShapeX),
    toSvekDot(connectedNestedShape),
  ];

  it('rojida-shaped mismatch: one nested embed diverges structurally from the oracle -> false', () => {
    const wrongConnectedShape: DotInputGraph = {
      nodes: [
        { id: 'Z1', width: 90, height: 48 },
        { id: 'Z2', width: 90, height: 48 },
      ],
      edges: [], // oracle's twin has an edge; ours doesn't -- a real divergence.
    };
    const brokenEvents: LayoutInputEvent[] = [
      nested(nestedShapeX),
      nested(nestedShapeX),
      nested(wrongConnectedShape),
      nested(wrongConnectedShape),
      outer(rojidaOuter),
      nested(nestedShapeX),
      nested(wrongConnectedShape),
    ];
    expect(computeDotEqual(disconnectedAndConnectedDots, brokenEvents, false, rojidaMarkup)).toBe(false);
  });

  it('rojida-shaped mismatch: a nested embed the jar dumped is entirely missing from our events -> false', () => {
    const missingOneEmbed: LayoutInputEvent[] = [
      nested(nestedShapeX),
      nested(nestedShapeX),
      outer(rojidaOuter),
      nested(nestedShapeX),
    ];
    expect(computeDotEqual(disconnectedAndConnectedDots, missingOneEmbed, false, rojidaMarkup)).toBe(false);
  });

  // -- defect 3: newpage sources are compared against page 1 only --

  it('unknown/racujo-01-veme537: newpage truncates to the first dots.length outer graphs', () => {
    const newpageMarkup = '@startuml\npackage "One" {\n}\nnewpage\npackage "Two" {\n}\n@enduml';
    const events = [outer(graphA), outer(graphB)];
    expect(computeDotEqual([toSvekDot(graphA)], events, false, newpageMarkup)).toBe(true);
  });

  it('a genuine mismatch survives newpage truncation (fewer port graphs than oracle dumps)', () => {
    const newpageMarkup = '@startuml\nnewpage\n@enduml';
    const events = [outer(graphB)];
    // slice(0, 2) of a 1-element array is still 1 element -- truncation can
    // only ever shrink, never manufacture a page the port didn't render.
    expect(computeDotEqual([toSvekDot(graphA), toSvekDot(graphA)], events, false, newpageMarkup)).toBe(false);
  });
});
