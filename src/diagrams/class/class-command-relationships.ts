/**
 * Member and relationship commands for the class diagram dispatch table
 * (rules 6-pre, 6, 6a of the original class-commands.ts COMMANDS array):
 * the standalone-member shorthand, the general relationship dispatch, and
 * the interface-lollipop relationship shorthand. Split out of
 * class-commands.ts to stay under the line cap; order preserved (spread
 * third in COMMANDS, right after the container group).
 */
import { dropsAsSingleDuplicate } from '../../core/cucadiagram/linkDedup.js';
import { isNoteId } from './class-notes.js';
import { applyLollipop, LOLLIPOP_RE } from './class-lollipop.js';
import { parseMemberLine } from './class-member-parser.js';
import { parseObjectField } from './class-object-commands.js';
import {
  parseRelationshipLine,
  REL_DISPATCH_RE,
} from './class-relationship-parser.js';
import type { Command } from './class-command-types.js';
import { ensureClassifier, type ParseState } from './parser.js';

/** A relationship endpoint resolves to itself when it names a note (a note
 *  alias is never auto-created as a classifier); otherwise it auto-creates/
 *  reuses a classifier and resolves to that classifier's (possibly
 *  namespace-qualified) id. Shared by the relationship-dispatch execute
 *  below for both the `from` and `to` endpoint. */
function resolveRelationshipEndpoint(state: ParseState, id: string): string {
  return isNoteId(state.ast, id) ? id : ensureClassifier(state, id, undefined, undefined, true).id;
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
const relationshipConnection = (r: { from: string; to: string }): readonly [string, string] => [
  r.from,
  r.to,
];

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
  {
    pattern: /^("[^"]+"|\.?\w+(?:\.\w+)*)\s*:(?!:)\s*(.+)$/,
    execute(state, match) {
      const classId = match[1]!;
      const memberStr = match[2]!.trim();
      const classifier = ensureClassifier(state, classId, undefined, undefined, true);
      // An already-`object`-kind target uses object field semantics
      // (`name = value`); a missing target is created as a plain `class`
      // (CommandAddMethod always uses LeafType.CLASS) and parsed as a
      // class member line. See class-object-commands.ts#parseObjectField.
      const member =
        classifier.kind === 'object' ? parseObjectField(memberStr) : parseMemberLine(memberStr);
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
        rel.to = resolveRelationshipEndpoint(state, rel.to);
        rel.from = resolveRelationshipEndpoint(state, rel.from);
      } else {
        rel.from = resolveRelationshipEndpoint(state, rel.from);
        rel.to = resolveRelationshipEndpoint(state, rel.to);
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
      if (
        dropsAsSingleDuplicate(
          rel.single === true,
          state.ast.relationships,
          rel,
          relationshipConnection,
        )
      ) {
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
      applyLollipop(
        state.ast,
        (id) => ensureClassifier(state, id, undefined, undefined, true),
        state.activeNamespace,
        match.input,
        state.creationCounter,
      );
    },
  },
];
