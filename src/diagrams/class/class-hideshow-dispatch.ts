/**
 * `hide`/`show` directive dispatch (rule 3 of class-commands.ts's COMMANDS
 * table) — CommandHideShow2 / CommandHideShowByGender /
 * CommandHideShowByVisibility upstream. Split out of
 * class-command-directives.ts: the original single `execute` body chained
 * six try-this-parser-then-that-one branches (31 NLOC, CCN 17 — over both
 * complexity caps). Restructured below as a first-match-wins resolver table
 * — same order, same "push to state and stop" semantics, no behavior change.
 */
import type { ParseState } from './parser.js';
import {
  parseHideShowDirective,
  parseHideShowEntityDirective,
  parseHideShowKindDirective,
  parseHideShowPatternDirective,
  parseHideShowVisibilityDirective,
  parseHideStereotypeDirective,
} from './class-directives.js';

/** One resolver = "try this hide/show parser variant; if it matches, record
 *  the result on `state.ast` and report success." Returns `true` iff it
 *  handled the line (stopping the chain) — table form of the original
 *  `if (x !== null) { push; return; }` branches, same order. */
type HideShowResolver = (state: ParseState, input: string) => boolean;

/**
 * A2s R2g: record the enclosing package/namespace onto a just-parsed
 * `CommandHideShowByGender`-family directive — upstream ANDs the gender with
 * `byPackage(getCurrentGroup())` whenever the current group is non-root
 * (classdiagram/command/CommandHideShowByGender.java:272-273; the apply-side
 * gate is `class-directives-removal.ts#directiveAppliesTo`). Only the THREE
 * gender-command forms are stamped (global-portion, entity-qualified,
 * type-keyword): `CommandHideShow2`'s pattern form and
 * `CommandHideShowByVisibility` have no such AND upstream, and the
 * `hide [<<pattern>>] stereotype(s)` label form's applier lives in
 * `class-stereotype.ts` (unscoped today — no corpus reach, out of R2g's
 * write-set).
 */
function stampGroupScope(state: ParseState, directive: { scopeNsId?: string }): void {
  if (state.activeNamespace !== null) directive.scopeNsId = state.activeNamespace;
}

const HIDE_SHOW_RESOLVERS: readonly HideShowResolver[] = [
  // G2 N24: `hide [<<pattern>>] stereotype(s)` — tried BEFORE the entity-
  // pattern parser below: that parser's own `\S+` alternative ambiguously
  // matches a BARE "hide stereotype" (no bracket) as if "stereotype" were a
  // literal entity id (upstream registers both `CommandHideShowByGender` and
  // `CommandHideShow2` against the same single-token shape) — the keyword-
  // specific parser wins the collision, an entity actually named
  // "stereotype" is not a realistic corpus case.
  (state, input) => {
    const directive = parseHideShowDirective(input);
    if (directive === null) return false;
    stampGroupScope(state, directive);
    state.ast.directives.push(directive);
    return true;
  },
  (state, input) => {
    const stereotype = parseHideStereotypeDirective(input);
    if (stereotype === null) return false;
    (state.ast.hideStereotypeDirectives ??= []).push(stereotype);
    return true;
  },
  // Entity-qualified compound form (`hide C2 circle`, G2 N26) — tried BEFORE
  // both the single-token pattern parser (that one's `\S+` never matches a
  // two-token line anyway, so ordering here is purely for readability) and
  // the visibility-compound parser below (this parser itself excludes the
  // four visibility keywords as a valid entity id, so `hide private members`
  // still falls through to it).
  (state, input) => {
    const entity = parseHideShowEntityDirective(input);
    if (entity === null) return false;
    stampGroupScope(state, entity);
    (state.ast.hideEntityDirectives ??= []).push(entity);
    return true;
  },
  // G3/O3: type-keyword GENDER form (`hide object fields`) -- the OTHER
  // alternative of the same upstream command, see
  // `parseHideShowKindDirective`'s own doc comment. Mutually exclusive with
  // the entity-id form above by construction (that parser rejects every
  // recognized type keyword as an entity id).
  (state, input) => {
    const kindDirective = parseHideShowKindDirective(input);
    if (kindDirective === null) return false;
    stampGroupScope(state, kindDirective);
    (state.ast.hideKindDirectives ??= []).push(kindDirective);
    return true;
  },
  (state, input) => {
    const pattern = parseHideShowPatternDirective(input);
    if (pattern === null) return false;
    (state.ast.hidePatternDirectives ??= []).push(pattern);
    return true;
  },
  // Compound qualifier form (`hide private members`, G2 N12) — tried last:
  // neither parser above matches a multi-word, visibility-prefixed target.
  (state, input) => {
    const visibility = parseHideShowVisibilityDirective(input);
    if (visibility === null) return false;
    (state.ast.hideVisibilityDirectives ??= []).push(visibility);
    return true;
  },
];

/**
 * hide/show directives, tried in order: (a) global targets (empty
 * members/members/circle/empty fields/empty methods, singular/alias
 * spellings included -- A2s F-A/A6), (b) entity-selector
 * forms (`hide $tag`/`*`/name/<<stereotype>>/@unlinked, upstream
 * hideOrShow2 -> hides2, G2 N7), (c) entity-QUALIFIED compound forms
 * (`hide C2 circle`/`hide X members`/`hide Dummy2 methods`, upstream
 * CommandHideShowByGender, G2 N26 -- entity-id AND `<<stereotype>>` GENDERs,
 * the latter A2s F-A/B2; the type-keyword GENDER form is the kind parser
 * below, G3/O3), (d) visibility-qualified
 * member forms (`hide private members`/`hide public fields`, upstream
 * CommandHideShowByVisibility, G2 N12). All four only ever gate SVG drawing,
 * never the svek DOT export — a hidden entity/member still occupies its
 * node/row (oracle: doseko-41's `hide *`+`show $z` DOT equals directive-free
 * sevaxa-72).
 */
export function executeHideShow(state: ParseState, match: RegExpExecArray): void {
  for (const resolve of HIDE_SHOW_RESOLVERS) {
    if (resolve(state, match.input)) return;
  }
}
