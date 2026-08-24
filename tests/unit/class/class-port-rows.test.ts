/**
 * Unit tests for `class-port-rows.ts#classPortRows` (T1, SI17) -- the
 * ADR-1 "block tree" producer of a class leaf's port bands. NOT wired to
 * any caller in this task; these tests exercise the pure function directly,
 * reproducing T0's jar-verified oracle table
 * (`plans/si17-class-row-ports/decision-journal.md`).
 */
import { describe, it, expect } from 'vitest';
import {
  classPortRows,
  classifierPortShortNames,
  classPortShortNamesById,
  type PortRowCompartmentInput,
} from '../../../src/diagrams/class/class-port-rows.js';
import { formatMemberText } from '../../../src/diagrams/class/class-layout-helpers.js';
import { Ports } from '../../../src/core/svek/Ports.js';
import type { ClassDiagramAST, ClassifierKind } from '../../../src/diagrams/class/ast.js';
import { isRowPortKind } from '../../../src/diagrams/class/class-shield-helpers.js';

/** T0's oracle header height for a plain single-line class header at
 *  default font -- `dimHeader.getHeight()` read off three independent
 *  oracle SVGs (decision-journal.md's T0 entry). */
const HEADER_HEIGHT = 32;
/** T0's oracle per-row member height for a plain single-line text row at
 *  default font (`dekaba`/`fm-both`/`xefeme`, all 14). */
const ROW_HEIGHT = 14;

describe('classPortRows (T1, SI17, ADR-1 block tree)', () => {
  it('dekaba-54-fafi485: single compartment, one whole-word election -> 36/14', () => {
    const compartments: PortRowCompartmentInput[] = [{ members: [{ text: 'ID: int', height: ROW_HEIGHT }] }];

    const result = classPortRows(compartments, ['ID'], HEADER_HEIGHT);

    expect(result).toEqual([{ id: Ports.encodePortNameToId('ID'), position: 36, height: ROW_HEIGHT }]);
  });

  it('fm-both: fields+methods -- methods compartment carries the whole fields height (field2 50/14, method1 72/14)', () => {
    const compartments: PortRowCompartmentInput[] = [
      {
        members: [
          { text: 'field1', height: ROW_HEIGHT },
          { text: 'field2', height: ROW_HEIGHT },
        ],
      },
      {
        members: [
          { text: 'method1()', height: ROW_HEIGHT },
          { text: 'method2()', height: ROW_HEIGHT },
        ],
      },
    ];

    const result = classPortRows(compartments, ['field2', 'method1'], HEADER_HEIGHT);

    expect(result).toEqual([
      { id: Ports.encodePortNameToId('field2'), position: 50, height: ROW_HEIGHT },
      { id: Ports.encodePortNameToId('method1'), position: 72, height: ROW_HEIGHT },
    ]);
  });

  it('xefeme-77-fagu709: two elected members in ONE compartment accumulate through a non-electing member -> 36/14, 50/14', () => {
    const compartments: PortRowCompartmentInput[] = [
      {
        members: [
          { text: 'alpha', height: ROW_HEIGHT },
          { text: 'noise', height: ROW_HEIGHT },
        ],
      },
    ];

    const result = classPortRows(compartments, ['alpha', 'noise'], HEADER_HEIGHT);

    expect(result).toEqual([
      { id: Ports.encodePortNameToId('alpha'), position: 36, height: ROW_HEIGHT },
      { id: Ports.encodePortNameToId('noise'), position: 50, height: ROW_HEIGHT },
    ]);
  });

  it('a substring-only match (score 50, MethodsOrFieldsArea.java:232) still produces a band', () => {
    // "widget" contains "id" as a bare substring but NOT at a \b-bounded
    // word ("w-id-get" has no boundary either side of "id"), so this can
    // only be the score-50 CONTAINS tier -- a score-0 non-match would
    // produce no row at all, per DotInputPortRow having no `score` field
    // to assert on directly.
    const compartments: PortRowCompartmentInput[] = [{ members: [{ text: 'widget', height: ROW_HEIGHT }] }];

    const result = classPortRows(compartments, ['id'], HEADER_HEIGHT);

    expect(result).toEqual([{ id: Ports.encodePortNameToId('id'), position: 36, height: ROW_HEIGHT }]);
  });

  it('Ports#add (svek/Ports.java:70-76): a later 100 (word-boundary) beats an earlier 50 (substring) for the same id', () => {
    const compartments: PortRowCompartmentInput[] = [
      {
        members: [
          // "widget" substring-matches "id" (score 50).
          { text: 'widget', height: ROW_HEIGHT },
          // "id: int" word-boundary-matches "id" (score 100) -- SAME id.
          { text: 'id: int', height: 20 },
        ],
      },
    ];

    const result = classPortRows(compartments, ['id'], HEADER_HEIGHT);

    // Exactly one band survives, at the WORD-MATCH member's own
    // position/height (36 + 14 = 50), not the substring member's (36/14).
    expect(result).toEqual([{ id: Ports.encodePortNameToId('id'), position: 50, height: 20 }]);
  });

  it('no port short names -> [] (bicabi-42-coto932: no bands at all)', () => {
    const compartments: PortRowCompartmentInput[] = [{ members: [{ text: 'field1', height: ROW_HEIGHT }] }];

    expect(classPortRows(compartments, [], HEADER_HEIGHT)).toEqual([]);
  });

  it('no compartments -> []', () => {
    expect(classPortRows([], ['id'], HEADER_HEIGHT)).toEqual([]);
  });

  it('ADR-5: the election input is Member.getDisplay(false), asserted on a member WITH a visibility char', () => {
    // A member fixture whose EXPLICIT visibility char makes the "rendered"
    // row text (class-member-rows.ts's ClassifierGeo.rows[i].text, built
    // with keepVisibilityChar=true) genuinely differ from the ADR-5
    // election text (keepVisibilityChar=false) -- a test built only from
    // unprefixed members can't tell these two forms apart at all (they'd
    // be byte-identical strings), so it would pass even if classPortRows'
    // caller silently fed the wrong one. This fixture proves the two forms
    // differ, then proves classPortRows is called with the correct one.
    const member = { visibility: '+', visibilityExplicit: true, name: 'field2' };
    const electionText = formatMemberText(member, false);
    const renderedText = formatMemberText(member, true);
    expect(electionText).toBe('field2');
    expect(renderedText).toBe('+field2');
    expect(electionText).not.toBe(renderedText);

    const compartments: PortRowCompartmentInput[] = [{ members: [{ text: electionText, height: ROW_HEIGHT }] }];

    const result = classPortRows(compartments, ['field2'], HEADER_HEIGHT);

    expect(result).toEqual([{ id: Ports.encodePortNameToId('field2'), position: 36, height: ROW_HEIGHT }]);
  });
});

describe('classifierPortShortNames (Entity#getPortShortNames, abel/Link.java:515-524)', () => {
  it('collects fromPort names for edges originating at the classifier', () => {
    const relationships = [{ from: 'Foo', to: 'Bar', fromPort: 'field2' }];

    expect(classifierPortShortNames('Foo', relationships)).toEqual(new Set(['field2']));
  });

  it('collects toPort names for edges targeting the classifier', () => {
    const relationships = [{ from: 'Bar', to: 'Foo', toPort: 'method1' }];

    expect(classifierPortShortNames('Foo', relationships)).toEqual(new Set(['method1']));
  });

  it('dedups a name registered by multiple edges, ignores unrelated classifiers', () => {
    const relationships = [
      { from: 'Foo', to: 'Bar', fromPort: 'field2' },
      { from: 'Baz', to: 'Foo', toPort: 'field2' },
      { from: 'Bar', to: 'Baz', fromPort: 'unrelated' },
    ];

    expect(classifierPortShortNames('Foo', relationships)).toEqual(new Set(['field2']));
  });

  it('returns an empty set when no relationship names the classifier', () => {
    expect(classifierPortShortNames('Foo', [])).toEqual(new Set());
  });
});

describe('classPortShortNamesById (B2, SI17: unions Classifier.portShortNames)', () => {
  it('unions a classifier\'s persistent portShortNames with its live relationship scan', () => {
    const ast: ClassDiagramAST = {
      classifiers: [
        { id: 'Foo', display: 'Foo', kind: 'class', typeParams: [], members: [], portShortNames: new Set(['method']) },
        { id: 'Bar', display: 'Bar', kind: 'class', typeParams: [], members: [] },
      ],
      relationships: [{ from: 'Foo', to: 'Bar', type: 'association' }],
      namespaces: [],
      directives: [],
      notes: [],
    };

    const result = classPortShortNamesById(ast);

    // 'method' comes ONLY from Foo.portShortNames -- the live relationship
    // above names no port at all.
    expect(result.get('Foo')).toEqual(new Set(['method']));
    expect(result.has('Bar')).toBe(false);
  });

  it('a classifier with no persistent portShortNames falls back to the relationship scan alone', () => {
    const ast: ClassDiagramAST = {
      classifiers: [
        { id: 'Foo', display: 'Foo', kind: 'class', typeParams: [], members: [] },
        { id: 'Bar', display: 'Bar', kind: 'class', typeParams: [], members: [] },
      ],
      relationships: [{ from: 'Foo', to: 'Bar', type: 'association', fromPort: 'field2' }],
      namespaces: [],
      directives: [],
      notes: [],
    };

    expect(classPortShortNamesById(ast).get('Foo')).toEqual(new Set(['field2']));
  });
});

/**
 * Fitness function for the `isRowPortKind` <-> `electionTextFor` coupling.
 *
 * `class-port-rows.ts#electionTextFor` picks the member-text reconstructor by
 * kind: `formatObjectMemberText` for `object`, `formatMemberText` for
 * everything else. That `else` is the class family *by construction* -- every
 * kind reaching it has passed `isRowPortKind` -- but the two live in
 * different modules and the invariant is not expressible in the type system,
 * because `LIKE_CLASS_KINDS` is a runtime `Set` reachable from
 * `class-shield-helpers.ts` only through an import cycle.
 *
 * So a kind added to `isRowPortKind` without a matching branch in
 * `electionTextFor` would silently take the class reconstructor and elect the
 * wrong row -- exactly the defect SI20's T2 shipped into its own wiring and
 * caught late, invisible to every DOT gate because the one corpus fixture
 * has bare-word members that reconstruct identically under both.
 *
 * Two guards, per `rules/architecture.md`'s "express every architectural
 * constraint as a test":
 *   1. `ALL_KINDS_BY_NAME` is a `Record<ClassifierKind, true>`, so adding a
 *      member to the union fails to COMPILE here until it is listed.
 *   2. The pinned set below fails the moment `isRowPortKind` accepts anything
 *      new, sending the author to `electionTextFor` to make the choice
 *      deliberately.
 * Neither guard adds defensive code to the production path.
 */
const ALL_KINDS_BY_NAME: Record<ClassifierKind, true> = {
  class: true, abstract: true, interface: true, enum: true, annotation: true,
  object: true, map: true, json: true, entity: true, circle: true,
  descriptive: true, usecase: true, state: true, association: true,
  'assoc-circle': true, lollipop: true, protocol: true,
};

describe('row-port kind set is pinned (isRowPortKind <-> electionTextFor)', () => {
  it('accepts exactly the class family plus object', () => {
    const rowPort = (Object.keys(ALL_KINDS_BY_NAME) as ClassifierKind[])
      .filter(isRowPortKind)
      .sort();
    expect(rowPort).toEqual([
      'abstract', 'annotation', 'class', 'entity', 'enum', 'interface', 'object', 'protocol',
    ]);
  });

  it('excludes map and json, whose bands are mapPortRows own concern (ADR-4)', () => {
    expect(isRowPortKind('map')).toBe(false);
    expect(isRowPortKind('json')).toBe(false);
  });

  it('excludes descriptive, which owns the PORTIN/PORTOUT `:P` path (ADR-5)', () => {
    expect(isRowPortKind('descriptive')).toBe(false);
  });
});
