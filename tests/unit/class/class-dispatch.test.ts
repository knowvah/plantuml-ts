import { describe, it, expect } from 'vitest';
import { classAccepts } from '../../../src/diagrams/class/class-dispatch.js';

/** Split markup into trimmed, non-empty content lines (as accepts() receives). */
const L = (s: string): string[] =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x !== '');

describe('classAccepts — class/description routing (Batch 1: Δ2 note-body)', () => {
  it('accepts an ordinary class diagram', () => {
    expect(classAccepts(L('class A\nclass B\nA <|-- B'))).toBe(true);
    expect(classAccepts(L('interface I\nenum E\nabstract class C'))).toBe(true);
  });

  it('is not tripped by shorthand inside a block-note body (Δ2, taxemo-34)', () => {
    // `(palegreen)` inside a note body must not read as a `(usecase)` shorthand
    expect(
      classAccepts(L('class C\nnote left of C\n(palegreen)\nend note')),
    ).toBe(true);
    // a `::member` qualifier on the note target must not defeat body-stripping
    expect(classAccepts(L('class C\nnote right of C::m\n(x)\nend note'))).toBe(
      true,
    );
  });

  it('keeps an inline single-line note from being treated as a block note', () => {
    // `note left of C : text` is inline (has ` : `), no body to strip; a later
    // descriptive shorthand line is still seen as descriptive.
    // Claimed by class (unambiguous `class C`), then refused by the
    // allowmixing gate -- which is what the jar does with this input.
    expect(
      classAccepts(L('class C\nnote left of C : a note\ncomponent X')),
    ).toBe(true);
  });

  it('is not tripped by a class NAMED like a descriptive keyword in a relationship', () => {
    // `Queue`/`QueueEntry` are class names used as relationship endpoints
    expect(classAccepts(L('class Queue\nclass QueueEntry\nQueue -- QueueEntry'))).toBe(
      true,
    );
  });

  it('is not tripped by a class named after a descriptive keyword with members (Δ3)', () => {
    // `Person : guid OID` starts with the `person` keyword but is a class member
    // (the namespace fixtures dudimi/duvuti/pareli/xodopa)
    expect(
      classAccepts(L('class Person\nPerson : guid OID\nPerson : string FirstName')),
    ).toBe(true);
  });

  it('declines pure descriptive blocks — bare leaves stay in description', () => {
    expect(classAccepts(L('node A\ncomponent B\nA --> B'))).toBe(false);
    expect(classAccepts(L('component X\ndatabase Y\nX -- Y'))).toBe(false);
  });

  it('declines a pure descriptive block with no class keyword and no allow_mixing', () => {
    // `entity Entity {…}` alone (no class-forcing keyword) stays description
    expect(classAccepts(L('entity Entity {\n* id\n}'))).toBe(false);
  });

  it('accepts an allow_mixing block (Δ1 — class-only directive)', () => {
    expect(classAccepts(L('allow_mixing\nclass foo\ncomponent c'))).toBe(true);
  });
});

describe('classAccepts — Δ4 scoped entity/circle routing (Batch 2)', () => {
  it('routes a class+entity/circle block to class (has a class keyword)', () => {
    // tepazu/xidura shape: class keyword alongside entity
    expect(
      classAccepts(L('class CLASS\nenum ENUM\ninterface I\nentity ENTITY')),
    ).toBe(true);
    // niduni shape: class + interface + circle
    expect(classAccepts(L('class P\ninterface A1\ncircle A2\nP --( A2'))).toBe(
      true,
    );
  });

  it('does NOT steal a pure entity-as-sequence-participant block', () => {
    // `entity` here declares sequence participants; no class keyword → not class
    expect(classAccepts(L('entity Alice\nentity Bob\nAlice -> Bob'))).toBe(
      false,
    );
  });

  it('leaves a pure entity/circle block (no class keyword) with description', () => {
    expect(classAccepts(L('entity Entity {\n* id\n}'))).toBe(false);
    expect(classAccepts(L('circle C1\ncircle C2\ncircle C3'))).toBe(false);
  });
});

describe('classAccepts — database leaf under allow_mixing (Tier 3)', () => {
  it('routes allow_mixing + class + database to class', () => {
    expect(classAccepts(L('allow_mixing\nclass A\ndatabase B'))).toBe(true);
  });

  it('CLAIMS class + database without allow_mixing, so the gate can refuse it', () => {
    // Upstream errors on a bare `database` leaf without allowmixing
    // (jar-verified 2026-08-02). It reaches that error by having
    // ClassDiagramFactory OWN the block first -- so this port must claim it
    // too, and refuse it via `adjudicateAllowMixing`, rather than re-routing
    // to a factory upstream never reached. Routing away was the A3-era
    // workaround for a port that could not yet error.
    expect(classAccepts(L('class A\ndatabase B'))).toBe(true);
  });
});

describe('classAccepts — descriptive container routing (Δ4b, Tier 3b)', () => {
  it('routes a container block with an inner class to class', () => {
    expect(classAccepts(L('stack a as a {\nclass foo1\n}'))).toBe(true);
    expect(classAccepts(L('package X {\nrectangle Y {\nclass A\n}\n}'))).toBe(true);
  });

  it('leaves a pure descriptive container tree (no class) to description', () => {
    expect(classAccepts(L('rectangle A {\nrectangle B {\n}\n}'))).toBe(false);
  });
});

describe('classAccepts — state-diagram signal disqualifies class (mission A4 Phase L final, maruju-55-soko478)', () => {
  it('declines a state block that also carries a valid class-accept line (embedded json)', () => {
    // maruju-55-soko478 shape: `state "A" as stateA` / `state "C" as stateC {
    // state B }` are pure StateDiagramFactory syntax; the trailing
    // `json foo1 { "foo2": "foo3" }` line alone matches CLASS_ACCEPTS_PATTERNS
    // (mission A3's json accept delta) and, before this fix, won the race
    // since classPlugin is tried before statePlugin.
    expect(
      classAccepts(
        L('state "A" as stateA\nstate "C" as stateC {\nstate B\n}\njson foo1 {\n"foo2": "foo3"\n}'),
      ),
    ).toBe(false);
  });

  it('declines a bare state declaration with no other signal', () => {
    expect(classAccepts(L('state A\nstate B\nA --> B'))).toBe(false);
  });

  it('declines a `[*]` pseudostate transition', () => {
    expect(classAccepts(L('[*] --> Idle\nIdle --> [*]'))).toBe(false);
  });

  it('still accepts a genuine class diagram embedding a json element (no state signal)', () => {
    expect(classAccepts(L('class Foo\njson bar {\n"a": "b"\n}'))).toBe(true);
  });

  it('is not tripped by a class member line literally named "state"', () => {
    // `state : String` is a member line (MEMBER_LINE_RE), not a `state X`
    // declaration -- must not disqualify an otherwise-ordinary class.
    expect(classAccepts(L('class Foo\nstate : String'))).toBe(true);
  });
});

describe('classAccepts — T6: map declaration widening (D3 exception 2, decisions.md#d3)', () => {
  it('claims a bare map declaration (CommandCreateMap, objectdiagram/command/CommandCreateMap.java)', () => {
    expect(
      classAccepts(L('map "Arrows legend " as arrows {\n"a" -> "b"\n}')),
    ).toBe(true);
  });

  it('claims a map declaration nested inside legend+embed (object/zuvila-56-nuda425 shape)', () => {
    // zuvila's only top-level content is `legend { {{ ... map ... }} }
    // endlegend`; hasMapDeclaration must see the map BEFORE
    // stripLegendRegions/scopeToEnclosingDiagram remove it.
    expect(
      classAccepts(
        L(
          'legend\n{{\nmap "Arrows legend " as arrows {\n"a" -> "b"\n}\n}}\nendlegend',
        ),
      ),
    ).toBe(true);
  });

  it('declines a bare `map` with no name (unlike `object`, which allows one)', () => {
    expect(classAccepts(L('map'))).toBe(false);
  });
});

describe('classAccepts — T6 AC2: object declaration checked by its own grammar', () => {
  it('claims `object Foo {` and `object Foo` (CommandCreateEntityObject)', () => {
    expect(classAccepts(L('object Foo {\nfoo = 1\n}'))).toBe(true);
    expect(classAccepts(L('object Foo'))).toBe(true);
  });

  it('claims a BARE `object` with no name too — map has no equivalent form', () => {
    // `^object\s*$` (CLASS_ACCEPTS_PATTERNS) has no `map` counterpart: the
    // two grammars are not spelled alike, per this task's own AC2.
    expect(classAccepts(L('object'))).toBe(true);
  });
});

describe('classAccepts — T6: scope to the enclosing diagram (over-claim narrowing)', () => {
  it('declines a class declaration reachable only inside a note-embedded {{ }} sub-diagram (rizove-01-move566 shape)', () => {
    expect(
      classAccepts(
        L(
          'Alice -> Bob : hello1\nnote bottom\n{{\nclass Object {\nname : token\n}\n}}\nend note',
        ),
      ),
    ).toBe(false);
  });

  it('declines an object declaration reachable only inside a note-embedded {{ }} sub-diagram (dasutu-58-saje713 shape)', () => {
    expect(
      classAccepts(
        L(
          'Bob -> Alice : hello\nnote left\nthis is a note\n{{\nobject o1 {\nfoo\n}\no1 --> o2\n}}\nOn the end\nend note',
        ),
      ),
    ).toBe(false);
  });

  it('declines a class declaration reachable only inside a !procedure body', () => {
    expect(
      classAccepts(
        L(
          '!unquoted procedure OBJ()\nclass Object {\nname : token\n}\n!endprocedure\nAlice -> Bob : hello',
        ),
      ),
    ).toBe(false);
  });

  it('still accepts a class declaration OUTSIDE the embedded/procedure region', () => {
    expect(
      classAccepts(L('class Real\nnote left\n{{\nobject o1\n}}\nend note')),
    ).toBe(true);
  });
});

describe('classAccepts — T6: sequence arrow decorations are not class relations (tuxido-23-xide677)', () => {
  it.each([
    ['Alice o-> Bob : hello', 'o-> dressing, CommandArrow.java ARROW_DRESSING1 "[%s][ox]"'],
    [
      'Alice <<--o Bob : ok',
      '<<--o dressing, ARROW_DRESSING1 "<<?_?" + ARROW_DRESSING2 "[ox][%s]"',
    ],
  ])('declines "%s" (%s)', (line) => {
    expect(classAccepts(L(line))).toBe(false);
  });

  it('declines both lines together, with no class keyword present', () => {
    expect(
      classAccepts(L('Alice o-> Bob : hello\nAlice <<--o Bob : ok')),
    ).toBe(false);
  });

  it('still accepts a genuine class aggregation arrow with a single navigability glyph', () => {
    // class/givoli-70-rade072 shape: single `<`, never doubled -- real class
    // syntax, not sequence's `<<` dressing.
    expect(
      classAccepts(L('Potential "0..*" <--o "1" CompositePotential')),
    ).toBe(true);
  });
});

describe('classAccepts — T6 inherited scope: CommandCreateClassMultilines TYPE alternation siblings', () => {
  it.each(['protocol', 'struct', 'exception', 'metaclass', 'dataclass', 'record'])(
    'claims a bare `%s X {` declaration',
    (kw) => {
      expect(classAccepts(L(`${kw} Foo as "Bar" {\nC1\n}`))).toBe(true);
    },
  );

  it('claims `static class X {}` and bare `abstract X {}`', () => {
    expect(classAccepts(L('static class Foo {\n}'))).toBe(true);
    expect(classAccepts(L('abstract Foo {\n}'))).toBe(true);
  });

  it('claims a protocol declaration nested inside container blocks (component/gutute-00-gaki684 shape)', () => {
    expect(
      classAccepts(
        L('node N1 {\nnode N11 {\nprotocol X as "INOUT" {\nC1\nC2\n}\n}\n}'),
      ),
    ).toBe(true);
  });

  it('does NOT claim on "stereotype" — collides with <style> selectors and note prose', () => {
    // sequence/dudeku-78-naju581, usecase/lunexo-59-fupo775: `stereotype {` /
    // `Stereotype {` open a <style> block selector, not a class declaration;
    // component/jegure-48-cesi766: "stereotype not working" is plain note
    // prose. This per-line heuristic cannot disambiguate either from a
    // genuine TYPE keyword the way CommandCreateClassMultilines's real
    // parser can, so `stereotype` stays excluded (unlike its TYPE-alternation
    // siblings above).
    expect(classAccepts(L('stereotype {\nFontColor blue\n}'))).toBe(false);
  });
});
