import { describe, it, expect } from 'vitest';
import {
  ALL_TYPES,
  KEYWORD_TO_SYMBOL,
  DESCRIPTIVE_ONLY_KEYWORDS,
  hasDescriptiveSignal,
  hasDescriptiveElement,
  stripLegendRegions,
  isLegendOpenLine,
  isLegendCloseLine,
} from '../../../src/core/descriptive-keywords.js';
import { classPlugin } from '../../../src/diagrams/class/index.js';
import { descriptionPlugin } from '../../../src/diagrams/description/index.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';

describe('descriptive-keywords — ALL_TYPES / KEYWORD_TO_SYMBOL', () => {
  it('covers the full upstream ALL_TYPES keyword set, plus `archimate` (T8)', () => {
    // Upstream CommandCreateElementFull.ALL_TYPES, in declaration order --
    // plus `archimate` (CommandArchimate.java, its own dedicated command,
    // never part of ALL_TYPES upstream), deliberately folded into this
    // port's single keyword-dispatch table so it gets the SAME
    // hasDescriptiveSignal/hasDescriptiveElement/KEYWORD_RE machinery every
    // other descriptive-only keyword uses -- see descriptive-keywords.ts's
    // KEYWORD_SYMBOL_ENTRIES comment for why it maps to 'rectangle', not a
    // new USymbol tag.
    expect(ALL_TYPES).toEqual([
      'person',
      'artifact',
      'actor/',
      'actor',
      'folder',
      'card',
      'file',
      'package',
      'rectangle',
      'hexagon',
      'label',
      'node',
      'frame',
      'cloud',
      'action',
      'process',
      'database',
      'queue',
      'stack',
      'storage',
      'agent',
      'archimate',
      'usecase/',
      'usecase',
      'component',
      'boundary',
      'control',
      'entity',
      'interface',
      'circle',
      'collections',
      'port',
      'portin',
      'portout',
    ]);
  });

  it('maps every keyword to a USymbol', () => {
    for (const keyword of ALL_TYPES) {
      expect(KEYWORD_TO_SYMBOL.has(keyword)).toBe(true);
    }
    expect(KEYWORD_TO_SYMBOL.size).toBe(ALL_TYPES.length);
  });

  it('maps business variants to the -business symbols', () => {
    expect(KEYWORD_TO_SYMBOL.get('actor/')).toBe('actor-business');
    expect(KEYWORD_TO_SYMBOL.get('actor')).toBe('actor');
    expect(KEYWORD_TO_SYMBOL.get('usecase/')).toBe('usecase-business');
    expect(KEYWORD_TO_SYMBOL.get('usecase')).toBe('usecase');
  });

  it('folds portin/portout onto the port symbol', () => {
    expect(KEYWORD_TO_SYMBOL.get('port')).toBe('port');
    expect(KEYWORD_TO_SYMBOL.get('portin')).toBe('port');
    expect(KEYWORD_TO_SYMBOL.get('portout')).toBe('port');
  });
});

describe('descriptive-keywords — DESCRIPTIVE_ONLY_KEYWORDS (D3)', () => {
  it.each(['node', 'cloud', 'usecase', 'rectangle'])(
    '%s is a known symbol and descriptive-only',
    (keyword) => {
      expect(KEYWORD_TO_SYMBOL.has(keyword)).toBe(true);
      expect(DESCRIPTIVE_ONLY_KEYWORDS.has(keyword)).toBe(true);
    },
  );

  it.each(['interface', 'package', 'actor'])(
    '%s is a known symbol but NOT descriptive-only',
    (keyword) => {
      expect(KEYWORD_TO_SYMBOL.has(keyword)).toBe(true);
      expect(DESCRIPTIVE_ONLY_KEYWORDS.has(keyword)).toBe(false);
    },
  );

  it('excludes interface/package/actor plus the T4 sequence-type overlap', () => {
    // interface, package, actor (D3) + boundary, control, entity, database,
    // collections, queue (T4, SEQUENCE_TYPE_OVERLAP) = 9.
    expect(DESCRIPTIVE_ONLY_KEYWORDS.size).toBe(ALL_TYPES.length - 9);
    // The business actor `actor/` stays descriptive-only.
    expect(DESCRIPTIVE_ONLY_KEYWORDS.has('actor/')).toBe(true);
    expect(DESCRIPTIVE_ONLY_KEYWORDS.has('entity')).toBe(false);
    expect(DESCRIPTIVE_ONLY_KEYWORDS.has('queue')).toBe(false);
  });
});

describe('descriptive-keywords — hasDescriptiveSignal', () => {
  it('fires on a paren shorthand even when paired with bare actor', () => {
    expect(hasDescriptiveSignal(['actor Bob', '(Login)'])).toBe(true);
  });

  it('fires on a component bracket shorthand', () => {
    expect(hasDescriptiveSignal(['[Comp]'])).toBe(true);
  });

  it('fires on the empty () interface shorthand', () => {
    expect(hasDescriptiveSignal(['() Foo'])).toBe(true);
  });

  it.each(['node Server', 'cloud "AWS"', 'usecase UC1', 'rectangle r', 'actor/ Biz', 'archimate #Business "Hello"'])(
    'fires on descriptive-only keyword line: %s',
    (line) => {
      expect(hasDescriptiveSignal([line])).toBe(true);
    },
  );

  it('does not fire on a pure class block', () => {
    expect(hasDescriptiveSignal(['class Foo', 'Foo : x'])).toBe(false);
  });

  it('does not fire on bare actor + messages (sequence)', () => {
    expect(hasDescriptiveSignal(['actor Bob', 'Bob -> Alice : hi'])).toBe(false);
  });

  it('does not fire on a pure interface/package block', () => {
    expect(hasDescriptiveSignal(['interface Drawable', 'package p {}'])).toBe(
      false,
    );
  });

  it('does not treat a keyword prefix as a match (node vs nodes)', () => {
    expect(hasDescriptiveSignal(['nodes are here'])).toBe(false);
  });

  it('only scans the first 20 lines', () => {
    const padding = Array.from({ length: 20 }, (_, i) => `note line ${i}`);
    expect(hasDescriptiveSignal([...padding, 'node Late'])).toBe(false);
  });
});

describe('descriptive-keywords — association-class couple exclusion (T5b)', () => {
  // Upstream CommandLinkClass's COUPLE grammar: `(A,B) <arrow>` is a
  // classdiagram association-class endpoint reference, not the descdiagram
  // `(Use Case)` shorthand — a comma-separated pair immediately followed by
  // an arrow must NOT be a descriptive signal.
  it.each(['(A,B) .. R1', '(A,B) - X', '(ClassA,ClassB)--R'])(
    'does not fire on the association-class couple: %s',
    (line) => {
      expect(hasDescriptiveSignal([line])).toBe(false);
      expect(hasDescriptiveElement([line])).toBe(false);
    },
  );

  it('still fires on a genuine single-phrase use-case shorthand', () => {
    expect(hasDescriptiveSignal(['(Use Case)'])).toBe(true);
    expect(hasDescriptiveElement(['(Use Case)'])).toBe(true);
  });

  it('still fires on a comma-bearing phrase with no trailing arrow', () => {
    // A single descriptive phrase that happens to contain a comma, but is
    // not followed by an arrow, is not the association-class couple.
    expect(hasDescriptiveSignal(['(Login, Logout)'])).toBe(true);
  });

  it('routes the association-class fixture to the class engine', () => {
    const lines = ['class R1', 'class R2', 'A-B', '(A,B) .. R1', 'R2 .. (A,B)'];
    expect(classPlugin.accepts(lines)).toBe(true);
    expect(descriptionPlugin.accepts(lines)).toBe(false);
  });

  it('still routes a bare use-case shorthand to the description engine', () => {
    const lines = ['(Use Case)'];
    expect(classPlugin.accepts(lines)).toBe(false);
    expect(descriptionPlugin.accepts(lines)).toBe(true);
  });
});

describe('descriptive-keywords — legend-region exclusion (iter 23b)', () => {
  // Upstream registers `legend`/`endlegend` as a CommonCommand available to
  // every diagram type (command/CommonCommands.java:115-116,
  // command/UBrexCommonCommands.java:102-103); its body is display-only text
  // that must never be read as a descriptive-element declaration.
  it.each(['legend', 'legend top', 'legend bottom', 'legend left', 'legend right', 'legend center', 'legend top left', 'legend bottom right'])(
    'recognizes opener variant: %s',
    (line) => {
      expect(isLegendOpenLine(line)).toBe(true);
    },
  );

  it.each(['endlegend', 'end legend', 'ENDLEGEND', 'End Legend', 'end\tlegend'])(
    'recognizes closer variant: %s',
    (line) => {
      // `[%s]?` upstream (CommandMultilinesLegend.END) is any ONE whitespace
      // char, not just a literal space — a tab separator closes it too.
      expect(isLegendCloseLine(line)).toBe(true);
    },
  );

  it.each(['end  legend', 'endlegend2', 'legendary', 'legend: "text"', 'legend some text'])(
    'does not misfire on non-legend-boundary text: %s',
    (line) => {
      expect(isLegendOpenLine(line)).toBe(false);
      expect(isLegendCloseLine(line)).toBe(false);
    },
  );

  it('strips a legend block (opener, body, closer) from the line list', () => {
    const lines = ['class foo', 'legend', '()one', '[ok]', 'endlegend', 'class bar'];
    expect(stripLegendRegions(lines)).toEqual(['class foo', 'class bar']);
  });

  it('strips multiple legend blocks independently', () => {
    const lines = ['legend', 'a', 'end legend', 'class X', 'legend top', 'b', 'endlegend'];
    expect(stripLegendRegions(lines)).toEqual(['class X']);
  });

  it('an unterminated legend block strips to end of input (no closer to resync on)', () => {
    const lines = ['class foo', 'legend', '()one', '[ok]'];
    expect(stripLegendRegions(lines)).toEqual(['class foo']);
  });

  it('hasDescriptiveSignal ignores salt-widget shorthand inside a legend body', () => {
    expect(hasDescriptiveSignal(['class foo', 'legend', '()one', '[ok]', 'endlegend'])).toBe(
      false,
    );
  });

  it('hasDescriptiveElement ignores salt-widget shorthand inside a legend body', () => {
    expect(
      hasDescriptiveElement(['class foo', 'legend', '()one', '[ok]', 'endlegend']),
    ).toBe(false);
  });

  it('a descriptive signal after the legend closer is still detected', () => {
    expect(
      hasDescriptiveSignal(['legend', '()one', 'endlegend', 'node Server']),
    ).toBe(true);
  });
});

describe('descriptive-keywords — hasArrowDecoratedTarget (arrow-then-paren dispatch, A1 P2/i25)', () => {
  // `foo --> (Use case)` — a paren-decorated TARGET is not a legal sequence
  // PART2 (CommandArrow.java's PART2CODE/PART2LONG never allow bare parens),
  // so this must route to description even though `-->` also matches
  // sequence's own arrow heuristic.
  it.each([
    'foo --> (Use case)',
    'm-->(do)',
    'User -> (Start)',
    'N2 .. (Use)',
  ])('fires on a decorated target after an arrow: %s', (line) => {
    expect(hasDescriptiveElement([line])).toBe(true);
  });

  it('does not fire on the arrow-inclination numeric form (CommandArrow ARROW_DRESSING2)', () => {
    expect(hasDescriptiveElement(['Alice --> (5) Bob'])).toBe(false);
  });

  it('does not fire on the legacy activity start/stop marker forms', () => {
    expect(hasDescriptiveElement(['-right-> (*1)'])).toBe(false);
    expect(hasDescriptiveElement(['--> (*)'])).toBe(false);
  });

  it('does not fire on the classdiagram association-class couple, reversed shape', () => {
    // R1 .. (A,B) — arrow BEFORE a comma-pair couple, not a descdiagram target.
    expect(hasDescriptiveElement(['R2 .. (A,B)'])).toBe(false);
  });

  it('does not fire on a single-character arrow-body run before a parenthetical', () => {
    // A lone sentence-ending period or `=` before a parenthetical remark is
    // common free text, not a real PlantUML arrow token.
    expect(hasDescriptiveElement(['Fixed the bug. (#130)'])).toBe(false);
    expect(hasDescriptiveElement(['f(t)=(a_0)/2'])).toBe(false);
  });

  it('does not widen the class/sequence decline guard (hasDescriptiveSignal untouched)', () => {
    expect(hasDescriptiveSignal(['foo --> (Use case)'])).toBe(false);
  });

  it('routes a usecase-arrow-only block to description ahead of sequence (registration order)', () => {
    const lines = ['actor foo', 'foo --> (Use case) : a label'];
    expect(descriptionPlugin.accepts(lines)).toBe(true);
  });
});

describe('descriptive-keywords — BARE_ALIAS_DECL_RE (keyword-less alias declaration, A1 P2/i25)', () => {
  // CommandCreateElementFull.java:84 — the SYMBOL/keyword group is OPTIONAL,
  // so a bare `"Display" as code` / `code as "Display"` line is a fully
  // valid descdiagram declaration with zero keyword.
  it.each([
    '"Website/Webview" as Website',
    '"Main Admin" as Admin',
    'Website as "Website/Webview"',
  ])('fires on a keyword-less quoted alias declaration: %s', (line) => {
    expect(hasDescriptiveElement([line])).toBe(true);
  });

  it('does not fire on an arrow line (not a bare alias declaration)', () => {
    expect(hasDescriptiveElement(['SDK -> Website: /loginstart'])).toBe(false);
  });

  it('routes an all-bare-arrow block with one bare-alias line to description', () => {
    const lines = [
      '"Website/Webview" as Website',
      'SDK -> Website: /loginstart?clientid=?',
      'Website -> SDK: /selectprovider',
    ];
    expect(descriptionPlugin.accepts(lines)).toBe(true);
    // Without the bare-alias line, sequence's own heuristic still claims a
    // pure bare-to-bare arrow chain (genuinely ambiguous; unaffected by this
    // fix — description does not steal ordinary sequence diagrams).
    expect(
      sequencePlugin.accepts(['SDK -> Website: /loginstart', 'Website -> SDK: /select']),
    ).toBe(true);
  });
});

describe('descriptive-keywords — sequence/descdiagram participant-type overlap (T4)', () => {
  // `boundary|control|entity|database|collections|queue` are BOTH descdiagram
  // ALL_TYPES keywords AND sequence's own CommandParticipant TYPE alternation
  // (sequencediagram/command/CommandParticipant.java:79-83, mirrored locally
  // by SEQUENCE_PATTERNS[1] in src/diagrams/sequence/index.ts). Every shape a
  // CommandParticipantA/A2/A3/A4 variant accepts is matched, shape-for-shape,
  // by descdiagram's CommandCreateElementFull (CommandCreateElementFull.java
  // :84-100) too -- there is no per-line grammar telling them apart. A bare
  // declaration of one of these six must not, by itself, decide the block is
  // descriptive.
  it('does not fire hasDescriptiveSignal on a bare overlap-keyword declaration', () => {
    expect(hasDescriptiveSignal(['queue bar as q'])).toBe(false);
    expect(hasDescriptiveSignal(['database Foo5 #Pink'])).toBe(false);
    expect(hasDescriptiveSignal(['boundary boundary1'])).toBe(false);
    expect(hasDescriptiveSignal(['control control1'])).toBe(false);
    expect(hasDescriptiveSignal(['collections B'])).toBe(false);
    expect(hasDescriptiveSignal(['entity "This is my Entity" as entity1'])).toBe(
      false,
    );
  });

  it('does not fire hasDescriptiveElement on a bare overlap-keyword declaration', () => {
    expect(hasDescriptiveElement(['queue bar as q'])).toBe(false);
    expect(hasDescriptiveElement(['database postgresql as db101_postgresql'])).toBe(
      false,
    );
  });

  it('AC1: sequence accepts an unambiguous sequence diagram using `queue` as a participant type', () => {
    const lines = [
      'participant foo as f',
      'queue bar as q',
      'participant baz as b',
      'f -> q: Enqueue',
    ];
    expect(sequencePlugin.accepts(lines)).toBe(true);
  });

  it('AC2: the guard still declines the use-case/deployment shape it was added for', () => {
    expect(sequencePlugin.accepts(['actor Bob', '(Login)'])).toBe(false);
  });

  it('an unambiguous descriptive-only keyword elsewhere still wins (zotake-65-cabi912 shape)', () => {
    // `node`/`component`/`cloud` are NOT in the overlap set, so they still
    // decide the block is descriptive even though `database ... as ...`
    // alone would not.
    const lines = [
      'node "db101" {',
      'database postgresql as db101_postgresql',
      '}',
      'app101_app --> db101_postgresql',
    ];
    expect(hasDescriptiveSignal(lines)).toBe(true);
    expect(descriptionPlugin.accepts(lines)).toBe(true);
  });

  it('an unambiguous descriptive-only keyword elsewhere still wins (vibunu-17-guso486 shape)', () => {
    const lines = [
      'usecase UC_THIS_IS_MY_DISPLAY_TO_SHOW as UC',
      'boundary boundary1',
      'control control1',
      'entity1 --> control1 : test',
    ];
    expect(descriptionPlugin.accepts(lines)).toBe(true);
  });

  it('a bracket shorthand elsewhere still wins over a bare overlap-keyword line', () => {
    const lines = ['[First Component]', 'database "MySql" {'];
    expect(hasDescriptiveSignal(lines)).toBe(true);
    expect(descriptionPlugin.accepts(lines)).toBe(true);
  });
});

describe('descriptive-keywords — bracket shorthand excludes nested brackets (T4)', () => {
  // The residual 3 of the 34 SEQUENCE -> DESCRIPTION misroutes, after the
  // overlap-keyword fix above, are a SEPARATE mechanism: the `[Component]`
  // shorthand pattern was `/^\[.+\]/`, un-anchored at the end and greedy, so
  // it also matched anything starting with `[` that had a `]` ANYWHERE later
  // on the line. Upstream's own bracket grammar
  // (`descdiagram/command/CommandCreateElementFull.java:126`'s CODE_CORE,
  // the `\[[^\[\]]+\]` alternative) explicitly excludes nested brackets. Two
  // real sequence-only shapes tripped the loose version: a `[[url]]`
  // double-bracket hyperlink (inside `ref over`/`note` bodies, cusiro-03-
  // mebe823 and nibiju-55-kavu710) and sequence's own `[<[#color]-Node`
  // found-message bracket-arrow syntax (repudi-21-rovo448).
  it('does not fire on a [[url]] double-bracket hyperlink', () => {
    expect(hasDescriptiveSignal(['[[http://www.google.com]]'])).toBe(false);
    expect(
      hasDescriptiveSignal(['[[http://www.cot{cloud} my link]] hello']),
    ).toBe(false);
  });

  it('does not fire on a found-message bracket-arrow line', () => {
    expect(hasDescriptiveSignal(['[<[#blue]-Node: Succ'])).toBe(false);
    expect(hasDescriptiveSignal(['[<[#red]--Node: Fail'])).toBe(false);
  });

  it('still fires on a genuine single-level bracket shorthand', () => {
    expect(hasDescriptiveSignal(['[Comp]'])).toBe(true);
    expect(hasDescriptiveSignal(['[First Component]'])).toBe(true);
  });

  it('AC3: the three residual fixtures route to sequence', () => {
    expect(
      sequencePlugin.accepts([
        'Dummy -> Alice : foo1',
        'ref over Alice, Dummy',
        '[[http://www.google.com]]',
        'end',
      ]),
    ).toBe(true);
    expect(
      sequencePlugin.accepts([
        'Alice -> Bob : hello',
        'note left',
        '[[http://www.cot{cloud} my link]] hello',
        'end note',
      ]),
    ).toBe(true);
    expect(
      sequencePlugin.accepts([
        '[-> Node: Start TC',
        'Node -> SUT : RAR',
        '[<[#blue]-Node: Succ',
      ]),
    ).toBe(true);
  });
});

describe('descriptive-keywords — keyword-prefix does not swallow an arrow line (T4)', () => {
  // repudi-21-rovo448's second line, `Node -> SUT : RAR`: the participant is
  // NAMED "Node", which happens to be a descriptive-only keyword too. Upstream
  // `CommandCreateElementFull`'s CODE_CORE (`descdiagram/command/
  // CommandCreateElementFull.java:126`) never allows `-` or `<` as the first
  // character after SYMBOL — no CODE_CORE alternative starts with either, so
  // "keyword immediately followed by an arrow token" can never be a real
  // descdiagram declaration. `buildKeywordPattern` matched on the keyword
  // prefix alone, with no check on what followed it.
  it('does not fire when a keyword-named identifier starts an arrow line', () => {
    expect(hasDescriptiveSignal(['Node -> SUT : RAR'])).toBe(false);
    expect(hasDescriptiveSignal(['queue <- foo'])).toBe(false);
    expect(hasDescriptiveElement(['Node -> SUT : RAR'])).toBe(false);
  });

  it('still fires on the genuine declaration form of the same keyword', () => {
    expect(hasDescriptiveSignal(['node Server'])).toBe(true);
    expect(hasDescriptiveSignal(['node "Server 1"'])).toBe(true);
  });
});

describe('descriptive-keywords — BARE_QUOTED_DECL_RE (keyword-less quoted declaration, A1 P2/i26)', () => {
  // CommandCreateElementFull.java:84 SYMBOL is optional; CODE1
  // (CODE_WITH_QUOTE, :88) is a bare quoted string with no "as" alias at
  // all — `symbol == null` defaults to LeafType.DESCRIPTION /
  // actorStyle().toUSymbol() (:273-275). `isForbidden` (:134-138,
  // `^[\p{L}0-9_.]+$`) excludes a pure bare token, so only quoted content
  // qualifies (camevo-41-suki094: `"Only one actor --><u:red>...KO"`, the
  // sole line in the diagram — no keyword, no arrow, no "as").
  it.each([
    '"Only one actor --><u:red>Transparent: KO"',
    '"Lone"',
    '"Lone" #blue',
    '"Lone" <<stereo>>',
  ])('fires on a keyword-less bare quoted declaration: %s', (line) => {
    expect(hasDescriptiveElement([line])).toBe(true);
  });

  it('does not fire on a pure bare token (isForbidden excludes it upstream)', () => {
    expect(hasDescriptiveElement(['justAnIdentifier'])).toBe(false);
  });

  it('does not fire on an arrow line with quoted endpoints', () => {
    expect(hasDescriptiveElement(['"A" -> "B"'])).toBe(false);
  });

  it('does not fire on a keyword-prefixed quoted line (title/note own it)', () => {
    expect(hasDescriptiveElement(['title "My Title"'])).toBe(false);
  });
});
