/**
 * The `.tagname` stereotype sub-selector cascade (`StyleSignatureBasic
 * #matchAllImpl` / `StyleStorage#computeMergedStyle`, G2 N36/N37) -- moved
 * verbatim out of `style-map-element.ts` to keep that module under the
 * 500-line cap (cdd6 T1a, a pure file-cap move; `style-map-element.ts`
 * re-exports every public function so every importer is unchanged).
 */

import type { ElementColors } from './theme.js';
import type { StyleMap } from './skinparam.js';
import { parseColor } from './paint.js';

/**
 * `StyleSignatureBasic#clean` (java): lowercase every char, DROPPING `_`
 * and `.` entirely (not just case-folding) -- upstream's own stereotype-
 * token normalization, applied to BOTH a `.tagname` selector's own token
 * and the element's resolved stereotype label(s) before comparing, so
 * `.MyStyle`/`<<my_style>>`/`<<My.Style>>` all normalize to the SAME
 * comparable key (`"mystyle"`). G2 N37.
 */
export function cleanStereotypeToken(name: string): string {
  let out = '';
  for (const ch of name) {
    if (ch !== '_' && ch !== '.') out += ch.toLowerCase();
  }
  return out;
}

/**
 * Parses a StyleMap selector PATH (the flattened, dot-joined map key --
 * NOT a single stack segment) for a trailing `.tagname` stereotype
 * sub-selector -- G2 N37. `parseStyleBlock`'s selector-open regex captures
 * a dot-led token WITH its leading dot intact (`.mystyle`), so when the
 * parser's stack is joined with `.`, a NESTED tag selector produces a
 * DOUBLE dot right before the tag segment (`classdiagram..mystyle` for
 * `classDiagram { .mystyle {...} } }`), while a TOP-LEVEL bare tag selector
 * is just the lone dot-led token itself (`.mystyle` for a bare `.mystyle {
 * ... }` at the document root, `fexuta-62-piko653`). Nesting depth is
 * capped at 2 (`parseStyleBlock`'s own doc comment), so the tag segment --
 * when present -- is always the LAST one; this does not attempt to parse a
 * tag selector nested under ANOTHER tag selector (no corpus sample needs
 * it). Returns `undefined` for every non-tag selector (including the
 * top-level bare-declarations key `""`).
 */
function parseTagSelector(path: string): { snamePath: string; tag: string } | undefined {
  if (path.startsWith('.')) {
    return { snamePath: '', tag: cleanStereotypeToken(path.slice(1)) };
  }
  const idx = path.indexOf('..');
  if (idx === -1) return undefined;
  return { snamePath: path.slice(0, idx), tag: cleanStereotypeToken(path.slice(idx + 2)) };
}

/**
 * Every DISTINCT `.tagname` token appearing ANYWHERE in `styleMap`
 * (CLEANED, deduplicated) -- G2 N37. Used to enumerate which per-tag
 * cascade entries are worth precomputing at Theme-build time
 * (`style-cascade-class.ts#computeClassStyleCascadeOverrides`'s
 * `classTagCascade`, this module's own `computeNoteStyleTagCascade`) --
 * a tag with no class/note-relevant declaration simply resolves every
 * property to `undefined` and is dropped, so no snames-scoping filter is
 * needed here.
 */
export function collectStyleTagNames(styleMap: StyleMap): ReadonlySet<string> {
  const tags = new Set<string>();
  for (const selector of styleMap.keys()) {
    const parsed = parseTagSelector(selector);
    if (parsed !== undefined) tags.add(parsed.tag);
  }
  return tags;
}

/**
 * Generic ancestor-cascade StyleMap resolver (G2 N36; `.tagname` stereotype
 * sub-selector support added G2 N37) — walks EVERY declaration in
 * `styleMap` (in parse/insertion order, i.e. textual source order) and
 * returns the value of `property` from the LAST declaration that matches
 * BOTH the caller's `snames` query AND (when the declaration itself is a
 * `.tagname` sub-selector) the caller's `stereotypeTags`.
 *
 * Mirrors upstream's real style-matching algorithm far more faithfully than
 * a fixed precedence array ({@link resolveDocumentBackground}'s own
 * `DOCUMENT_BACKGROUND_SELECTOR_PRECEDENCE`, G2 N7): `StyleSignatureBasic
 * #matchAllImpl` runs TWO independent subset tests -- SName
 * (`element.key.snames.containsAll(declaration.key.snames)`) AND
 * stereotype (`element.stereotypes.containsAll(declaration.stereotypes)`,
 * where the element side is built one-label-at-a-time via
 * `withTOBECHANGED`, so a declaration's tag matches when it equals ANY ONE
 * of the element's own stereotype labels) -- and `StyleStorage
 * #computeMergedStyle` merges every matching declaration, LAST-REGISTERED
 * wins per property (`MergeStrategy.OVERWRITE_EXISTING_VALUE`), with NO
 * specificity-based reordering (a plain `LinkedHashMap` walk). Since
 * `parseStyleBlock` stores a nested selector's OWN dot-joined path as its
 * map key and a `Map`'s iteration order is insertion (= textual encounter)
 * order, {@link parseTagSelector} recovers a `.tagname` declaration's own
 * ancestor SName path + tag token from that SAME flattened key, letting
 * this ONE pass reproduce jar's exact two-dimensional algorithm: a bare
 * `classDiagram {}`/`root {}` block cascades DOWN to every more-specific
 * element (unconditionally), while a `.tagname` sub-selector (nested or
 * top-level bare) additionally requires the element to carry that
 * stereotype -- both kinds interleave in ONE registration-order merge, so a
 * more-specific tag declaration naturally overrides a less-specific
 * ancestor declaration whenever it is registered later (every sampled
 * corpus fixture nests its `.tagname` block INSIDE the ancestor it
 * overrides, so this is always the case in practice -- G2 N37 ledger).
 *
 * `property` values are returned RAW (e.g. `"Green"`, `"lightblue"`) --
 * callers resolve through
 * {@link import('./klimt/color/HColorSet.js').resolveColorToSvgHex}
 * themselves, matching the existing inline-override precedent
 * (`core/color-override.ts`).
 */
export function resolveStyleCascade(
  styleMap: StyleMap,
  snames: readonly string[],
  property: string,
  // G2 N37: the element's OWN resolved stereotype label(s) -- raw or
  // pre-cleaned, cleaned internally via `cleanStereotypeToken`. Defaults to
  // empty, which makes every `.tagname` selector fail the tag-membership
  // test exactly as before this parameter existed -- 100% backward-
  // compatible for every pre-existing call site.
  stereotypeTags: readonly string[] = [],
): string | undefined {
  const querySet = new Set(snames);
  const tagSet = new Set(stereotypeTags.map(cleanStereotypeToken));
  let result: string | undefined;
  for (const [selector, props] of styleMap.entries()) {
    const tag = parseTagSelector(selector);
    if (tag !== undefined) {
      if (!tagSet.has(tag.tag)) continue;
      const ancestorTokens = tag.snamePath === '' ? [] : tag.snamePath.split('.');
      if (!ancestorTokens.every((t) => querySet.has(t))) continue;
    } else {
      const tokens = selector.split('.');
      if (!tokens.every((t) => querySet.has(t))) continue;
    }
    const value = props.get(property);
    if (value !== undefined) result = value;
  }
  return result;
}

/**
 * `PName.ShowStereotype` per `.tagname`, for the sequence participant header.
 *
 * `AbstractTextualComponent`'s constructor runs every display through
 * `Display#withoutStereotypeIfNeeded(style)` (`:84`), and that keeps the
 * stereotype unless the resolved style says otherwise: a `ValueNull` (unset)
 * or truthy `ShowStereotype` returns the display unchanged, and ONLY an
 * explicit false strips it (`Display.java:127-136`). So an absent entry here
 * means "show", exactly as upstream's absent value does -- this returns only
 * the tags that actually declare the property.
 *
 * Scoped to `participant` plus the bare `.tag {}` form, which matches
 * regardless of the query set (a tag selector with an empty `snamePath` has
 * no ancestor tokens to satisfy). Deliberately narrow for the same reason
 * {@link computeNoteStyleTagCascade} is: `cusiru-97-buco277` is the corpus
 * sample and it uses the bare form.
 */
export function computeShowStereotypeByTag(styleMap: StyleMap): Readonly<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const tag of collectStyleTagNames(styleMap)) {
    const raw = resolveStyleCascade(styleMap, ['participant'], 'showstereotype', [tag]);
    if (raw === undefined) continue;
    result[tag] = raw.trim().toLowerCase() !== 'false';
  }
  return result;
}

/**
 * G2 N37: the `.tagname` cascade applied to the NOTE bucket (`note {
 * .faint { BackgroundColor red } } }`) -- mirrors `style-cascade-class.ts
 * #computeClassStyleCascadeOverrides`'s `classTagCascade` precedent but
 * scoped to `note` alone (no corpus sample exercises a bare root-level
 * `.tag {}` reaching a note the way `rakici-44-tivo701` does for
 * classifiers, so this does not add `root`/`element` to the query set --
 * narrower by design, not by oversight). Returns only the properties each
 * tag actually sets (empty entries are dropped).
 */
export function computeNoteStyleTagCascade(styleMap: StyleMap): Readonly<Record<string, ElementColors>> {
  const result: Record<string, ElementColors> = {};
  for (const tag of collectStyleTagNames(styleMap)) {
    const bg = resolveStyleCascade(styleMap, ['note'], 'backgroundcolor', [tag]);
    if (bg === undefined) continue;
    result[tag] = { background: parseColor(bg) };
  }
  return result;
}
