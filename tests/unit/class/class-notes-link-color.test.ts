/**
 * cdd2-T19c: `note on link #color` colour capture — `class-notes.ts
 * #parseNoteOnLinkColors` (`Colors.java:96-124`'s tokenizer, scoped to
 * BACK/LINE) and `applyNoteOnLink`'s wiring of the parsed result onto
 * `Relationship.linkNoteBack`/`.linkNoteLine`.
 *
 * Expected BACK/LINE values are read directly off the three fixtures'
 * jar oracle SVGs (`lipazi-06-care921`, `nuvake-96-gofe203`,
 * `lozego-15-coci435` — `path/@fill`/`@stroke`), never fitted.
 */
import { describe, it, expect } from 'vitest';
import { parseNoteOnLinkColors, applyNoteOnLink } from '../../../src/diagrams/class/class-notes.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

function astWithOneRelationship(): ClassDiagramAST {
  return {
    classifiers: [],
    relationships: [{ from: 'A', to: 'B', type: 'association' }],
    notes: [],
    namespaces: [],
    directives: [],
  };
}

describe('parseNoteOnLinkColors', () => {
  it('returns {} for an undefined spec', () => {
    expect(parseNoteOnLinkColors(undefined)).toEqual({});
  });

  it('a bare colour token is BACK — lipazi-06-care921 #red', () => {
    expect(parseNoteOnLinkColors('#red')).toEqual({ back: 'red' });
  });

  it('back;line.dotted:blue;text:white — nuvake-96-gofe203 note 1 (fill #F00, stroke #00F)', () => {
    // jar SVG: path fill="#F00" stroke="#00F" -- text:white is captured but
    // dropped (ComponentRoseNote never applies a note-on-link's own TEXT
    // colour, see parseNoteOnLinkColors's own doc comment).
    expect(parseNoteOnLinkColors('#red;line.dotted:blue;text:white')).toEqual({ back: 'red', line: 'blue' });
  });

  it('#blue;line:yellow;text:purple — nuvake-96-gofe203 note 2 (fill #00F, stroke #FF0)', () => {
    expect(parseNoteOnLinkColors('#blue;line:yellow;text:purple')).toEqual({ back: 'blue', line: 'yellow' });
  });

  it('a gradient BACK token survives whole — lozego-15-coci435 #aqua/aliceblue', () => {
    expect(parseNoteOnLinkColors('#aqua/aliceblue')).toEqual({ back: 'aqua/aliceblue' });
  });

  it('a bare line-style keyword (no colour) sets neither slot', () => {
    expect(parseNoteOnLinkColors('#line.dashed')).toEqual({});
  });

  it('lowercases the whole spec, matching Colors.java:97 goLowerCase', () => {
    expect(parseNoteOnLinkColors('#RED;LINE:BLUE')).toEqual({ back: 'red', line: 'blue' });
  });
});

describe('applyNoteOnLink — colour wiring', () => {
  it('sets linkNoteBack from a bare colour spec', () => {
    const ast = astWithOneRelationship();
    applyNoteOnLink(ast, 'bottom', 'note red', '#red');
    expect(ast.relationships[0]?.linkNoteBack).toBe('red');
    expect(ast.relationships[0]?.linkNoteLine).toBeUndefined();
  });

  it('sets both linkNoteBack and linkNoteLine from a compound spec', () => {
    const ast = astWithOneRelationship();
    applyNoteOnLink(ast, 'bottom', 'note that is red', '#red;line.dotted:blue;text:white');
    expect(ast.relationships[0]?.linkNoteBack).toBe('red');
    expect(ast.relationships[0]?.linkNoteLine).toBe('blue');
  });

  it('leaves linkNoteBack/linkNoteLine unset with no colour spec', () => {
    const ast = astWithOneRelationship();
    applyNoteOnLink(ast, 'bottom', 'plain note');
    expect(ast.relationships[0]?.linkNoteBack).toBeUndefined();
    expect(ast.relationships[0]?.linkNoteLine).toBeUndefined();
  });

  it('is a silent no-op with no prior relationship (no colour crash either)', () => {
    const ast: ClassDiagramAST = { classifiers: [], relationships: [], notes: [], namespaces: [], directives: [] };
    expect(() => applyNoteOnLink(ast, 'bottom', 'note', '#red')).not.toThrow();
    expect(ast.relationships).toEqual([]);
  });
});
