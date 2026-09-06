/**
 * `hide`/`show <visibility> members|fields|methods` directive family for
 * class diagrams.
 *
 * Split out of `class-directives.ts` to keep that file within this
 * project's 500-line cap — a pure move, zero behavior change. This family
 * is self-contained (its own regex, parser, and applier), so it moves as
 * one cohesive unit; `class-directives.ts` re-exports both public symbols
 * so `from './class-directives.js'` is unchanged for existing consumers
 * (`parser.ts`, `class-hideshow-dispatch.ts`).
 */

import type { ClassDiagramAST, HideShowVisibilityDirective } from './ast.js';
import { isMethodMember } from './class-layout-helpers.js';
import { parseMemberLine } from './class-member-parser.js';

/**
 * `hide|show [public,private,protected,package[,...]] members|fields|methods`
 * (upstream `CommandHideShowByVisibility.getRegexConcat`, G2 N12) — a
 * COMPOUND-qualifier hide/show, distinct from both `parseHideShowDirective`'s
 * fixed single-word targets and `parseHideShowPatternDirective`'s
 * single-token entity selector (that parser's `\S+` can never match a
 * multi-word "private members" target, so the two never collide; callers try
 * both of those FIRST and this one last, mirroring the pattern-directive
 * doc's own precedence note). Visibility tokens may be `,`/whitespace-
 * separated in any combination (`hide private,public members`, `hide
 * private public members`); the portion word only needs a 3-char prefix
 * match (`getEntityPortion`), same normalization as upstream.
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByVisibility.java
 */
const VISIBILITY_HIDESHOW_RE =
  /^(hide|show)\s+((?:public|private|protected|package)(?:[,\s]+(?:public|private|protected|package))*)\s+(members?|attributes?|fields?|methods?)\s*$/i;

export function parseHideShowVisibilityDirective(line: string): HideShowVisibilityDirective | null {
  const m = VISIBILITY_HIDESHOW_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const visibilities = [
    ...new Set(
      m[2]!
        .toLowerCase()
        .split(/[,\s]+/)
        .filter((t) => t !== ''),
    ),
  ] as Array<'public' | 'private' | 'protected' | 'package'>;

  const portionWord = m[3]!.toLowerCase().slice(0, 3);
  const portion: HideShowVisibilityDirective['portion'] =
    portionWord === 'met' ? 'method' : portionWord === 'mem' ? 'member' : 'field';

  return { kind: 'hideshowvisibility', action, visibilities, portion };
}

/** `member.visibility` char -> the token vocabulary {@link
 *  parseHideShowVisibilityDirective} produces (`VisibilityModifier
 *  #getVisibilityModifierForField`/`ForMethod`'s char mapping — `*`
 *  (IE_MANDATORY) has no visibility-directive equivalent upstream, so it
 *  never matches any hide/show-by-visibility directive). */
function visibilityToken(char: string): 'public' | 'private' | 'protected' | 'package' | undefined {
  switch (char) {
    case '+':
      return 'public';
    case '-':
      return 'private';
    case '#':
      return 'protected';
    case '~':
      return 'package';
    default:
      return undefined;
  }
}

/** Pure fold of {@link parseHideShowVisibilityDirective} output into a single
 *  hidden `(visibility, field|method)` key set -- extracted from {@link
 *  applyVisibilityHideShow} (G2 N43) so a second consumer (the enhanced-body
 *  raw-line filter below) can share the SAME resolution without duplicating
 *  the union/hide-adds-show-removes fold. UNION semantics (mirrors
 *  `CucaDiagram#hideOrShowVisibilityModifier`'s mutable `Set<VisibilityModifier>`,
 *  NOT the last-writer-wins-per-target model {@link applyDirectives} uses for
 *  its fixed targets) -- two different visibility/portion directives are
 *  independent additions, not overrides of each other. */
function computeHiddenVisibilityPortions(directives: readonly HideShowVisibilityDirective[]): Set<string> {
  const hidden = new Set<string>(); // `${visibility}:${field|method}`
  for (const directive of directives) {
    for (const visibility of directive.visibilities) {
      const portions: Array<'field' | 'method'> =
        directive.portion === 'member' ? ['field', 'method'] : [directive.portion];
      for (const portion of portions) {
        const key = `${visibility}:${portion}`;
        if (directive.action === 'hide') hidden.add(key);
        else hidden.delete(key);
      }
    }
  }
  return hidden;
}

/** G2 N43: does a raw body line (freshly re-parsed, mirroring `class-body-
 *  enhanced-layout.ts#buildRowsBlockRows`'s own `parseMemberLine` call)
 *  fall in the hidden-visibility set? Mirrors upstream's `rawBodyWithoutHidden()`
 *  per-line predicate (`cucadiagram/BodierLikeClassOrObject.java:192-206`) --
 *  a block-separator (`--`/`==`/`..`/`__`) or `|_` tree-list line can never
 *  match: neither shape produces `visibilityExplicit === true` (`stripVisibility`'s
 *  leading-char test fails for both — see `class-member-parser.ts`), so this
 *  filter only ever removes a genuine, explicitly-visible member line. */
function isRawLineHiddenByVisibility(raw: string, hidden: ReadonlySet<string>): boolean {
  const member = parseMemberLine(raw);
  if (member === null || member.visibilityExplicit !== true) return false;
  const token = visibilityToken(member.visibility);
  if (token === undefined) return false;
  const portion = isMethodMember(member) ? 'method' : 'field';
  return hidden.has(`${token}:${portion}`);
}

/**
 * Apply `hide`/`show <visibility> members|fields|methods` directives
 * (G2 N12) — folds the accumulated directive list into a single hidden
 * `(visibility, field|method)` set (see {@link computeHiddenVisibilityPortions}),
 * then marks each classifier's matching members `hidden`.
 * A member with NO explicit visibility char (`visibilityExplicit` unset) is
 * NEVER matched — upstream's `Member#visibilityModifier` is `null` for an
 * implicit-visibility member (the constructor only assigns a modifier when
 * `VisibilityModifier.isVisibilityCharacter` recognized a leading char), so
 * `hideVisibilityModifier.contains(null)` is always false.
 */
export function applyVisibilityHideShow(ast: ClassDiagramAST): void {
  const directives = ast.hideVisibilityDirectives;
  if (directives === undefined || directives.length === 0) return;

  const hidden = computeHiddenVisibilityPortions(directives);
  if (hidden.size === 0) return;

  for (const classifier of ast.classifiers) {
    for (const member of classifier.members) {
      if (member.visibilityExplicit !== true) continue;
      const token = visibilityToken(member.visibility);
      if (token === undefined) continue;
      const portion = isMethodMember(member) ? 'method' : 'field';
      if (hidden.has(`${token}:${portion}`)) member.hidden = true;
    }

    // G2 N43 (mission priority 1, `benemi-22-dufo622` regression): the
    // enhanced-body render path (`class-body-enhanced-layout.ts`) never
    // consults `member.hidden` -- it re-parses `rawBodyLines` from scratch
    // via its OWN `parseMemberLine` pass, bypassing the mutation above
    // entirely. Mirrors upstream's real mechanism exactly: `BodierLikeClassOrObject
    // #getBody`'s enhanced branch feeds `BodyFactory.create1` the output of
    // `rawBodyWithoutHidden()` (`cucadiagram/BodierLikeClassOrObject.java:192-206`),
    // which builds a fresh `Member` per raw line and drops any whose
    // `hideVisibilityModifier.contains(m.getVisibilityModifier())` -- the
    // SAME visibility-hide set this function already computes, never the
    // bare `hide members`/`hide fields`/`hide methods` targets (those gate
    // `showFields`/`showMethods` as an all-or-nothing switch instead,
    // `getBody`'s `if (showMethods || showFields) return ...` -- a
    // DIFFERENT, unrelated mechanism, see `applyDirectives`'s own doc
    // comment; zero corpus overlap with enhanced bodies today, per that
    // function's doc, so deliberately NOT mirrored here). Filtering the
    // SOURCE raw lines (rather than threading directive state through the
    // layout pipeline) keeps both the classic and enhanced-body paths in
    // sync from one predicate, applied to a fresh per-line parse the same
    // way `buildRowsBlockRows` already parses every row.
    if (classifier.rawBodyLines !== undefined) {
      classifier.rawBodyLines = classifier.rawBodyLines.filter((raw) => !isRawLineHiddenByVisibility(raw, hidden));
    }
  }
}
