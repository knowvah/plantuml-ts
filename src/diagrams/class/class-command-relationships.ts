/**
 * Member and relationship commands for the class diagram dispatch table
 * (rules 6-pre, 6, 6a of the original class-commands.ts COMMANDS array):
 * the standalone-member shorthand, the general relationship dispatch, and
 * the interface-lollipop relationship shorthand. Split out of
 * class-commands.ts to stay under the line cap; order preserved (spread
 * third in COMMANDS, right after the container group).
 */
import { dropsAsSingleDuplicate } from '../../core/cucadiagram/linkDedup.js';
import { resolveNoteEndpoint } from './class-note-endpoint.js';
import { applyLollipop, LOLLIPOP_RE } from './class-lollipop.js';
import { parseMemberLine } from './class-member-parser.js';
import { parseObjectField } from './class-object-commands.js';
import { parseRelationshipLine, REL_DISPATCH_RE, stripQuotes } from './class-relationship-parser.js';
import type { Command } from './class-command-types.js';
import { ensureClassifier, type ParseState } from './parser.js';
import { materializeClassifier, registerPendingLeaf, resolveClassifierRef } from './class-ensure-classifier.js';
import { resolveReference } from './class-namespace.js';
import { refuse } from '../../core/parse-refusal.js';

/**
 * cdd3-T9 S-1b: `CommandLinkClass#executeArg`'s endpoint pair, in its two
 * upstream phases -- resolve BOTH quarks (`quarkInContextSafe`,
 * `CommandLinkClass.java:320-325`, registration only, no tick), THEN create
 * each missing leaf in source order (`reallyCreateLeaf`, `:327-333`, tick +
 * like-class sweep). So the first leaf's sweep already numbers the second
 * endpoint's freshly registered package chain. A note-naming endpoint
 * resolves to itself (a note alias is never auto-created as a classifier).
 * Returns the two resolved ids in the order given (`first`, `second` are
 * `ent1String`, `ent2String`: source-text order).
 */
function resolveRelationshipEndpoints(state: ParseState, first: string, second: string): [string, string] {
  // cdd5-T5d: a note endpoint is found through the same quark resolution
  // as a classifier (`class-note-endpoint.ts#resolveNoteEndpoint`), since a
  // freestanding note's id is now group-qualified (`CommandFactoryNote.java:192`).
  const note1 = resolveNoteEndpoint(state.ast, first, state.activeNamespace);
  const note2 = resolveNoteEndpoint(state.ast, second, state.activeNamespace);
  const ref1 = note1 !== undefined ? undefined : resolveClassifierRef(state, first, undefined, true);
  const pending1 = ref1 === undefined ? undefined : registerPendingLeaf(state, ref1);
  const ref2 =
    note2 !== undefined
      ? undefined
      : resolveClassifierRef(state, second, undefined, true, pending1 === undefined ? [] : [pending1]);
  // `quark2` IS `quark1` when both name the same new leaf: registered once.
  const pending2 = ref2 === undefined || ref2.id === ref1?.id ? undefined : registerPendingLeaf(state, ref2);
  const id1 = ref1 === undefined ? note1! : materializeClassifier(state, ref1, 'class', pending1 !== undefined).id;
  const id2 = ref2 === undefined ? note2! : materializeClassifier(state, ref2, 'class', pending2 !== undefined).id;
  return [id1, id2];
}

/** A `Relationship` reduced to its two connection identities for the shared
 *  `-[single]->` dedup (`Link.sameConnections` compares `Entity`
 *  references; `rel.from`/`rel.to` are the resolved fully-qualified ids at
 *  the push point, carrying the same identity contract). Scanning
 *  `ast.relationships` mirrors upstream's flat `CucaDiagram.links` for
 *  every pair a `single` class link can form: lollipop/assoc-couple edges
 *  live in the SAME array, and note-attachment edges (kept separately)
 *  always involve a note entity no classifier pair can equal.
 *  @see src/core/cucadiagram/linkDedup.ts */
const relationshipConnection = (r: { from: string; to: string }): readonly [string, string] => [r.from, r.to];

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const RELATIONSHIP_COMMANDS: readonly Command[] = [
  // 6-pre. Standalone member (dotted ids allowed) — BEFORE relationship
  //    dispatch: CommandAddMethod runs before CommandLinkClass upstream; a
  //    bare `.` is a valid bodyless REL_ARROW (vuresa-33-kumu160).
  //    A2s R2f (dibinu-95-kavo178): upstream's NAME group is
  //    `([%pLN_.]+|[%g][^%g]+[%g])` (`%g` = double quote) — the quoted
  //    alternative was missing here, silently dropping
  //    `"this is my class" : dummy() ...` member-add lines.
  //    `ensureClassifier` already strips surrounding quotes (parser.ts,
  //    `stripQuotes(rawName)`), so the quoted form resolves to the SAME
  //    classifier a quoted declaration/relationship endpoint created.
  //    @see ~/git/plantuml/.../classdiagram/command/CommandAddMethod.java:63
  //    T3 (unknown-bucket-routing-repair): NAME's charset was ASCII `\w`
  //    (`[A-Za-z0-9_]`); upstream's is `[%pLN_.]+` -- Unicode
  //    letter/number plus underscore and dot (`CommandAddMethod.java:64`),
  //    the SAME `\p{L}\p{N}` fragment the relationship grammar's `CLASS_ID`
  //    already uses two lines earlier in the same fixture
  //    (`class-relationship-parser.ts`'s `ID_ATOM`) -- widened to match,
  //    `u` flag added for `\p{}` support.
  //    cdd5-T5d (zolaza-45-sepi570): whitespace is REQUIRED on both sides
  //    of the `:` -- `RegexLeaf.spaceOneOrMore()` twice
  //    (`CommandAddMethod.java:65,67`; `[%s]+`, `RegexLeaf.java:85-86`).
  //    `A:foo` matches no class command upstream, so the class factory
  //    refuses the block and the state factory claims it.
  {
    pattern: /^("[^"]+"|[\p{L}\p{N}_.]+)\s+:\s+(.+)$/u,
    execute(state, match) {
      const classId = match[1]!;
      const memberStr = match[2]!.trim();
      const classifier = ensureClassifier(state, classId, undefined, undefined, true);
      // An already-`object`-kind target uses object field semantics
      // (`name = value`); a missing target is created as a plain `class`
      // (CommandAddMethod always uses LeafType.CLASS) and parsed as a
      // class member line. See class-object-commands.ts#parseObjectField.
      const member = classifier.kind === 'object' ? parseObjectField(memberStr) : parseMemberLine(memberStr);
      if (member !== null) {
        classifier.members.push(member);
      }
    },
  },

  // 6. Relationship lines — BEFORE classifier declarations so a class NAMED
  //    like a keyword used as a relationship endpoint (`CLASS *-- f1`, where
  //    `CLASS` is a class named "CLASS") is parsed as a relationship, not a
  //    declaration named `*-- f1`. Declarations never match REL_DISPATCH_RE
  //    (they carry no arrow), so this ordering does not steal them. The dispatch
  //    pattern mirrors REL_RE's endpoint/qualifier/arrow alternatives (built from
  //    the same CLASS_ID/REL_ARROW fragments) so only genuine relationship lines
  //    reach parseRelationshipLine.
  {
    pattern: REL_DISPATCH_RE,
    execute(state, match) {
      // match.input is always a string on a successful RegExp match
      const rel = parseRelationshipLine(match.input, state.namespaceSeparator, state.ast.classifiers);
      if (rel === null) return;
      // A note-referencing endpoint (e.g. `N4 .> DrawableAdapter`) must not
      // spawn a phantom classifier for the note's alias. For class endpoints,
      // rewrite from/to to the resolved fully-qualified id so the edge connects
      // the same node the (namespace-qualified) classifier was created under.
      // reuseExistingChild=true mirrors CommandLinkClass's endpoint resolution
      // (CucaDiagram.java quarkInContext(true, ...)) — a bare endpoint name
      // that uniquely matches an existing classifier reuses it instead of
      // spawning a scope-local duplicate.
      // G2 N59: auto-create endpoints in jar's REAL creation order -- pure
      // left-to-right SOURCE TEXT order, NOT `rel.from`/`rel.to` order
      // (`rel.swapDirection`'s own doc comment, ast.ts, derives this from
      // `CommandLinkClass.executeArg:295-333`: `ent1String`/`ent2String`
      // are always created in that order, entirely independent of
      // arrowhead/`LinkType` semantics). A relationship with NEITHER
      // endpoint auto-created (the overwhelmingly common case -- both
      // already declared) is unaffected either way, since `ensureClassifier`
      // reuses the existing entry without re-stamping `creationIndex`.
      if (rel.swapDirection === true) {
        [rel.to, rel.from] = resolveRelationshipEndpoints(state, rel.to, rel.from);
      } else {
        [rel.from, rel.to] = resolveRelationshipEndpoints(state, rel.from, rel.to);
      }
      // G2 N2 (mechanism 3): stamp AFTER both endpoints resolve/auto-create
      // -- matches upstream's shared-counter ordering (an auto-created
      // endpoint's own uid always precedes the link's), see
      // ast.ts#Relationship.creationIndex's doc comment.
      state.creationCounter.value += 1;
      // B21/M20: an inverted link costs TWO ticks upstream, not one --
      // `new Link(...)` takes one in its constructor (`abel/Link.java:135`)
      // and `getInv()` constructs a SECOND (`:145-146`), which is the one
      // that renders. Record the discarded first as a phantom so the dense
      // re-numbering in `renderer-uid.ts` leaves the same hole, then stamp
      // this link from the second.
      if (rel.invertedLinkBurnsTick === true) {
        rel.phantomSlot = true;
        state.creationCounter.value += 1;
      }
      rel.creationIndex = state.creationCounter.value;
      // G2 N9: `<path codeLine="...">` -- see ast.ts#Relationship.sourceLine's
      // doc comment.
      if (state.currentLine !== undefined) rel.sourceLine = state.currentLine;
      // SI1/T11: `CucaDiagram.addLink`'s `-[single]->` add-time dedup
      // (net.atmp.CucaDiagram.java:896-901) via the shared hook (ADR-3).
      // Placed AFTER the creationIndex stamp: upstream constructs the
      // `Link` (burning its `lnk` uid tick, abel/Link.java:135) before
      // `addLink`'s dedup ever runs, so a dropped duplicate still burns
      // its tick and both endpoints stay auto-created -- only the
      // relationship record itself is skipped.
      if (dropsAsSingleDuplicate(rel.single === true, state.ast.relationships, rel, relationshipConnection)) {
        return;
      }
      state.ast.relationships.push(rel);
    },
  },

  // 6a. Interface lollipop shorthand (CommandLinkLollipop) — registered right
  //     after the general relationship dispatch (rule 6), mirroring upstream's
  //     ClassDiagramFactory registration order (CommandLinkClass immediately
  //     followed by CommandLinkLollipop). Creates a NEW small-circle leaf and
  //     links it to an already-declared entity; see class-lollipop.ts for why
  //     this needs its own command (distinct from both the general relationship
  //     arrow's single `(`/`)` decor glyph and the standalone `() "name"`
  //     declaration, rule 5b'' above).
  {
    pattern: LOLLIPOP_RE,
    execute(state, match) {
      // G2 N19: creationIndex/synthetic-name tracking -- see
      // `LollipopCounter`'s doc comment (class-lollipop.ts).
      const outcome = applyLollipop(
        state.ast,
        (id) => {
          // T5 M3: existence must be checked BEFORE `ensureClassifier`
          // creates it -- mirrors upstream's `quark.getData()` read-only
          // lookup, which never creates (CommandLinkLollipop.java:183-186).
          const existed = existingClassifierExists(state, id);
          return { classifier: ensureClassifier(state, id, undefined, undefined, true), existed };
        },
        state.activeNamespace,
        match.input,
        state.creationCounter,
      );
      if (typeof outcome === 'object') {
        state.executionRefusal = refuse(
          'execution',
          state.currentLine ?? 0,
          state.currentLine ?? 0,
          outcome.refusalMessage,
          0,
        );
      }
    },
  },
];

/** T5 M3 (unknown-bucket-routing-repair): whether `rawName` already
 *  resolves to a declared classifier, WITHOUT creating one -- the same
 *  `resolveReference` + `classifierIndex` lookup `ensureClassifier` itself
 *  performs, mirroring `class-url-command.ts#applyUrlStatement`'s identical
 *  existence-check precedent. */
function existingClassifierExists(state: ParseState, rawName: string): boolean {
  const { id } = resolveReference({
    namespaces: state.ast.namespaces,
    sep: state.namespaceSeparator,
    activeNamespace: state.activeNamespace,
    name: stripQuotes(rawName),
    display: undefined,
    classifiers: state.ast.classifiers,
    reuseExistingChild: true,
  });
  return state.classifierIndex.has(id);
}
