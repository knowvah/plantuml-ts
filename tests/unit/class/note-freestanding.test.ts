import { describe, it, expect } from 'vitest';
import {
  findFreestandingNoteRelationshipIndices,
  findFreestandingNoteConnectors,
} from '../../../src/diagrams/class/note-freestanding.js';
import type { ClassNote, Namespace, Relationship } from '../../../src/diagrams/class/ast.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeNote(id: string, overrides?: Partial<ClassNote>): ClassNote {
  return { id, text: 'x', ...overrides };
}

function makeRelationship(from: string, to: string, overrides?: Partial<Relationship>): Relationship {
  return { from, to, type: 'association', ...overrides };
}

function makeNamespace(id: string): Namespace {
  return { id, display: id, classifiers: [] };
}

function makeEdgeGeo(id: string, from: string, to: string): EdgeGeo {
  return { id, from, to, points: [], targetDecor: 'none', sourceDecor: 'none', dashed: false };
}

// ---------------------------------------------------------------------------
// findFreestandingNoteRelationshipIndices (PRE-layout, class-dot-graph.ts's
// noArrow gate)
// ---------------------------------------------------------------------------

describe('findFreestandingNoteRelationshipIndices', () => {
  it('returns the index of a relationship connecting a freestanding note to a real entity', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('N1', 'Bar')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels)).toEqual(new Set([0]));
  });

  it('matches when the note is the TO endpoint instead of FROM', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('Bar', 'N1')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels)).toEqual(new Set([0]));
  });

  it('excludes an ATTACHED note (target set -- not freestanding)', () => {
    const notes = [makeNote('N1', { target: 'Bar', position: 'right' })];
    const rels = [makeRelationship('N1', 'Bar')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels).size).toBe(0);
  });

  it('excludes a note with TWO connections (isOpalisable requires exactly one)', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('N1', 'Bar'), makeRelationship('N1', 'Baz')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels).size).toBe(0);
  });

  it('excludes a note-to-note relationship', () => {
    const notes = [makeNote('N1'), makeNote('N2')];
    const rels = [makeRelationship('N1', 'N2')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels).size).toBe(0);
  });

  it('excludes an invisible relationship', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('N1', 'Bar', { invis: true })];
    expect(findFreestandingNoteRelationshipIndices(notes, rels).size).toBe(0);
  });

  it("preserves the relationship's own index among several unrelated ones", () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('Foo', 'Goo'), makeRelationship('N1', 'Bar'), makeRelationship('Baz', 'Qux')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels)).toEqual(new Set([1]));
  });

  it('returns an empty set when there are no freestanding notes at all', () => {
    expect(findFreestandingNoteRelationshipIndices([], [makeRelationship('Foo', 'Bar')]).size).toBe(0);
  });

  it('two DIFFERENT freestanding notes each with their own single connection are both eligible', () => {
    const notes = [makeNote('N1'), makeNote('N2')];
    const rels = [makeRelationship('N1', 'Bar'), makeRelationship('N2', 'Baz')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels)).toEqual(new Set([0, 1]));
  });

  // cdd3-T15 (E3-21): `GraphvizImageBuilder.java:133-148`'s `isOpalisable`
  // has NO synthetic-entity exclusion -- `single.getOther(entity)
  // .getLeafType() != LeafType.NOTE` is the ONLY "other end" condition, and
  // an assoc-circle/lollipop leaf's `LeafType` is never `NOTE`. The
  // synthetic-entity scope guard this test used to assert (added against a
  // regression measured BEFORE E3-7/E3-19 landed) is removed -- see
  // `temise-16-neco018` in `.agent-notes/cdd3-T15.md`.
  it('MATCHES a relationship whose other endpoint is an assoc-circle synthetic entity ((A,B) couple point) -- temise-16-neco018', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('N1', '__assoc0')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels)).toEqual(new Set([0]));
  });

  it('MATCHES a relationship whose other endpoint is a lollipop synthetic entity', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('N1', '__lol0')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels)).toEqual(new Set([0]));
  });

  // cdd5-T3c (freestanding-note-opale-group-endpoint): the "other end" must
  // have a SvekNode (`GraphvizImageBuilder.java:245-251`'s `other != null`) --
  // a package/namespace is drawn as an SvekCluster and has none.
  it('EXCLUDES a relationship whose other endpoint is a package/namespace -- cikifu-97-pasu472', () => {
    const notes = [makeNote('monolit')];
    const rels = [makeRelationship('decoder_core', 'monolit')];
    const namespaces = [makeNamespace('decoder_core')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels, namespaces).size).toBe(0);
  });

  it('still MATCHES when the other endpoint is an ordinary classifier, not a namespace id', () => {
    const notes = [makeNote('N1')];
    const rels = [makeRelationship('N1', 'Bar')];
    const namespaces = [makeNamespace('SomeOtherPackage')];
    expect(findFreestandingNoteRelationshipIndices(notes, rels, namespaces)).toEqual(new Set([0]));
  });
});

// ---------------------------------------------------------------------------
// findFreestandingNoteConnectors (POST-layout, layout.ts's connector-point
// + edge-suppression source)
// ---------------------------------------------------------------------------

describe('findFreestandingNoteConnectors', () => {
  it('maps the freestanding note id to its ONE connecting EdgeGeo', () => {
    const notes = [makeNote('N1')];
    const edges = [makeEdgeGeo('edge-0', 'N1', 'Bar')];
    const result = findFreestandingNoteConnectors(notes, edges);
    expect(result.get('N1')).toBe(edges[0]);
    expect(result.size).toBe(1);
  });

  it('excludes a note with two connecting edges', () => {
    const notes = [makeNote('N1')];
    const edges = [makeEdgeGeo('edge-0', 'N1', 'Bar'), makeEdgeGeo('edge-1', 'N1', 'Baz')];
    expect(findFreestandingNoteConnectors(notes, edges).size).toBe(0);
  });

  it('excludes an edge unrelated to any note', () => {
    const notes = [makeNote('N1')];
    const edges = [makeEdgeGeo('edge-0', 'Foo', 'Goo')];
    expect(findFreestandingNoteConnectors(notes, edges).size).toBe(0);
  });

  it('excludes an ATTACHED note (its connector comes from note-layout.ts, not this module)', () => {
    const notes = [makeNote('N1', { target: 'Bar', position: 'right' })];
    const edges = [makeEdgeGeo('edge-0', 'N1', 'Bar')];
    expect(findFreestandingNoteConnectors(notes, edges).size).toBe(0);
  });

  it('returns an empty map for an empty edge list', () => {
    expect(findFreestandingNoteConnectors([makeNote('N1')], []).size).toBe(0);
  });

  // cdd3-T15 (E3-21): see the matching test above.
  it('MATCHES an edge whose other endpoint is an assoc-circle synthetic entity (N1 .. (A,B)) -- temise-16-neco018', () => {
    const notes = [makeNote('N1')];
    const edges = [makeEdgeGeo('edge-0', 'N1', '__assoc0')];
    const result = findFreestandingNoteConnectors(notes, edges);
    expect(result.get('N1')).toBe(edges[0]);
  });

  // cdd5-T3c: see the matching PRE-layout test above.
  it('EXCLUDES an edge whose other endpoint is a package/namespace -- cikifu-97-pasu472', () => {
    const notes = [makeNote('monolit')];
    const edges = [makeEdgeGeo('edge-0', 'decoder_core', 'monolit')];
    const namespaces = [makeNamespace('decoder_core')];
    expect(findFreestandingNoteConnectors(notes, edges, namespaces).size).toBe(0);
  });
});
