/**
 * cdd6-T0b (D9): unit tests for the survey's split-out `dotEqual` comparison
 * — the three instrument defects cdd5 found (nested-embed graphs counted,
 * pragma-in-comment matched, newpage compared past page 1) and the
 * comment-stripping primitive they share.
 */
import { describe, it, expect } from 'vitest';
import { nonCommentLines, hasActiveSmetanaPragma, hasNewpage, computeDotEqual } from '../../../scripts/lib/survey-dot-equal.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import type { LayoutInputEvent } from '../../../src/core/graph-layout.js';

const graphA: DotInputGraph = { nodes: [{ id: 'A', width: 72, height: 36 }], edges: [] };
const graphB: DotInputGraph = { nodes: [{ id: 'B', width: 72, height: 36 }], edges: [] };
const outer = (graph: DotInputGraph): LayoutInputEvent => ({ graph, nestedDepth: 0 });
const nested = (graph: DotInputGraph): LayoutInputEvent => ({ graph, nestedDepth: 1 });

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

  // -- defect 1: nested {{ }} embed graphs must not count against the oracle --

  it('unknown/gubeca-19-lemu434: nested-embed graphs are excluded, degenerate outer -> true', () => {
    // The outer "file n [ ... {{yaml ... }} ]" diagram needs no graphviz of
    // its own (0 svek dumps); the yaml embed's OWN measure+draw layout calls
    // (nestedDepth 1) must not be compared against them.
    const events = [nested(graphA), nested(graphA), nested(graphA)];
    expect(computeDotEqual([], events, false, markup)).toBe(true);
  });

  it('a nested-embed graph is excluded even when an outer graph also exists', () => {
    const events = [outer(graphA), nested(graphB)];
    expect(computeDotEqual([toSvekDot(graphA)], events, false, markup)).toBe(true);
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
