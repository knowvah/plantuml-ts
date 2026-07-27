/**
 * Hide/show directive parsing and post-processing for class diagrams.
 *
 * Split out of `parser.ts` to keep that file within the module line budget.
 * These functions operate only on the public `ClassDiagramAST` — they hold no
 * parse state — so they compose cleanly with the command-dispatch table.
 */

import type {
  ClassDiagramAST,
  ClassifierKind,
  HideShowDirective,
  HideShowEntityDirective,
  HideShowKindDirective,
  HideShowPatternDirective,
  HideShowVisibilityDirective,
  HideTarget,
} from './ast.js';
import { isMethodMember } from './class-layout-helpers.js';
import { parseMemberLine } from './class-member-parser.js';
export { parseHideStereotypeDirective, applyStereotypeHideShow } from './class-stereotype.js';

/**
 * Map from the lowercase target string to the canonical HideTarget value.
 * Only the supported global targets are listed here.
 */
const HIDE_TARGET_MAP: Record<string, HideTarget> = {
  'empty members': 'empty members',
  'members':       'members',
  'circle':        'circle',
  'empty fields':  'empty fields',
  'empty methods': 'empty methods',
  // G2 N27: bare global `hide fields`/`hide methods` -- distinct from
  // `empty fields`/`empty methods` above (those only hide an
  // ALREADY-empty compartment; these hide UNCONDITIONALLY, corpus-verified
  // 5-fixture reach beyond the single fixture this was first spotted on).
  'fields':        'fields',
  'methods':       'methods',
};

/**
 * Parse a hide/show directive line.
 * Returns null if the line is not a recognised directive.
 *
 * Matches lines of the form:
 *   hide empty members
 *   hide members
 *   hide circle
 *   hide empty fields
 *   hide empty methods
 *   hide fields
 *   hide methods
 *   show <same targets>
 */
export function parseHideShowDirective(line: string): HideShowDirective | null {
  const m = /^(hide|show)\s+(.+)$/i.exec(line);
  if (m === null) return null;

  const action = m[1]!.toLowerCase() as 'hide' | 'show';
  const targetStr = m[2]!.trim().toLowerCase();
  const target = HIDE_TARGET_MAP[targetStr];
  if (target === undefined) return null;

  return { kind: 'hideshow', action, target };
}

/**
 * Parse a `hide`/`show <entity|$tag|<<stereotype>>|*|@unlinked>` entity-
 * pattern directive (upstream `CommandHideShow2`, G2 N7 --
 * {@link HideShowPatternDirective}'s own doc comment). `WHAT` must be either
 * a single whitespace-free token or a `<<...>>`-bracketed stereotype (which
 * MAY contain internal whitespace, e.g. `<<My Stereo>>`) -- upstream's own
 * regex (`"([^%s]+|\<\<.*\>\>)"`) requires exactly this shape, which is
 * what keeps a QUALIFIED form like `hide C2 circle` (two whitespace-
 * separated tokens, not bracketed) from matching here: that form belongs to
 * a different, unported upstream command
 * (`CommandHideShowByGender`/`CommandHideShowByVisibility`) and is left for
 * `parseHideShowDirective`'s null return to drop, same as today.
 * Returns null for the global-target forms `parseHideShowDirective` already
 * owns (`members`/`circle`/`empty members`/`empty fields`/`empty methods`) --
 * callers try that parser FIRST; this one is the fallback.
 */
export function parseHideShowPatternDirective(
  line: string,
): HideShowPatternDirective | null {
  const m = /^(hide(?:-class)?|show(?:-class)?)\s+(<<.*>>|\S+)$/i.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const what = m[2]!.trim();
  if (HIDE_TARGET_MAP[what.toLowerCase()] !== undefined) return null;

  return { kind: 'hideshowpattern', action, what };
}

/**
 * `hide|show <entity> circle|circles|circled|members|member|fields|field|
 * attributes|attribute|methods|method` (upstream `CommandHideShowByGender`,
 * G2 N26) -- the ENTITY-QUALIFIED compound form {@link
 * HideShowPatternDirective}'s own doc comment named as unported. GENDER is
 * restricted to a single bare/quoted entity id here -- the type-keyword
 * GENDER form (`hide class circled`, applies to every classifier of that
 * KIND) and the `<<stereotype>>` GENDER form for non-`stereotype` portions
 * (`hide <<even>> methods`) are both genuinely unbuilt, named for a future
 * iteration -- `TYPE_KEYWORD_GENDERS` below excludes the former from
 * matching as an entity id (so `hide class circled` is correctly left
 * unmatched/dropped rather than mis-parsed as an entity literally named
 * "class"); the `<<...>>` shape never matches the bare-id/quoted-string
 * alternation below at all. `public`/`private`/`protected`/`package` are
 * ALSO excluded -- `hide private members` is
 * {@link HideShowVisibilityDirective}'s territory (already landed, G2
 * N12), and upstream registers that as a separate, higher-precedence
 * command for exactly this literal token set.
 * @see ~/git/plantuml/.../classdiagram/command/CommandHideShowByGender.java
 */
const ENTITY_PORTION_MAP: Record<string, HideShowEntityDirective['target']> = {
  circle: 'circle', circles: 'circle', circled: 'circle',
  member: 'members', members: 'members',
  field: 'fields', fields: 'fields', attribute: 'fields', attributes: 'fields',
  method: 'methods', methods: 'methods',
  // G3/O4: `EntityPortion.STEREOTYPE` -- the GENDER/PORTION form
  // (`CucaDiagram#showPortion`), distinct from the LABEL-pattern `hide
  // [<<pattern>>] stereotype(s)` command already ported separately
  // (`class-stereotype.ts#parseHideStereotypeDirective`) -- jar-verified
  // `kocupi-02-ripa662` (`hide object stereotypes`). See `ast.ts
  // #Classifier.hideStereotype`'s own doc comment for the consuming side.
  stereotype: 'stereotype', stereotypes: 'stereotype',
};

const VISIBILITY_GENDER_WORDS = new Set(['public', 'private', 'protected', 'package']);

/** `CommandHideShowByGender.TYPE_KEYWORDS` -- excluded from the entity-id
 *  alternative so the type-keyword GENDER form ({@link parseHideShowKindDirective},
 *  G3/O3) is left unmatched here rather than mis-read as a literal entity
 *  name. Six of these (the {@link KIND_GENDER_MAP} keys) ARE ported by that
 *  parser; the rest have no distinct `ClassifierKind` in this port and are
 *  simply never matched by either parser (silently dropped, same posture as
 *  any unrecognized directive). */
const TYPE_KEYWORD_GENDERS = new Set([
  'class', 'object', 'interface', 'enum', 'abstract', 'annotation', 'protocol',
  'struct', 'exception', 'metaclass', 'dataclass', 'record',
]);

/** `CommandHideShowByGender.TYPE_KEYWORDS` entries with a genuine 1:1
 *  {@link ClassifierKind} mapping in this port -- the other six upstream
 *  keywords (`protocol`/`struct`/`exception`/`metaclass`/`dataclass`/
 *  `record`) have no distinct `ClassifierKind` value here (see that type's
 *  own union), so `parseHideShowKindDirective` never matches those tokens. */
const KIND_GENDER_MAP: Record<string, HideShowKindDirective['classifierKind']> = {
  class: 'class', abstract: 'abstract', interface: 'interface',
  enum: 'enum', annotation: 'annotation', object: 'object',
};

const HIDE_SHOW_ENTITY_RE = /^(hide|show)\s+("[^"]+"|[\p{L}\p{N}_.]+)\s+(\S+)\s*$/iu;

export function parseHideShowEntityDirective(line: string): HideShowEntityDirective | null {
  const m = HIDE_SHOW_ENTITY_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const rawEntity = m[2]!;
  const entityLower = rawEntity.toLowerCase();
  if (VISIBILITY_GENDER_WORDS.has(entityLower) || TYPE_KEYWORD_GENDERS.has(entityLower)) return null;
  const target = ENTITY_PORTION_MAP[m[3]!.toLowerCase()];
  if (target === undefined) return null;

  const entityId = rawEntity.startsWith('"') ? rawEntity.slice(1, -1) : rawEntity;
  return { kind: 'hideshowentity', action, entityId, target };
}

/**
 * Apply `hide`/`show <entity> circle|members|fields|methods` directives (G2
 * N26) -- last-writer-wins per `(entityId, target)` pair (mirrors {@link
 * applyDirectives}'s per-target resolution, scoped down to one entity).
 * `members` sets BOTH `suppressFields`/`suppressMethods` -- jar-verified an
 * entity-scoped `hide X members` fully collapses the box exactly like
 * `hide fields` + `hide methods` together (`nirija-04-veti140`), not the
 * `member.hidden`-marking `applyDirectives` uses for the diagram-GLOBAL
 * `hide members` (per-row marking is unnecessary here: `preMeasureClassifiers`
 * (layout.ts) already drops a suppressed compartment's rows entirely).
 * An unresolvable `entityId` (typo, forward-reference to a namespace, …) is
 * silently a no-op, matching this port's established directive-application
 * posture elsewhere in this file.
 */
export function applyHideShowEntityDirectives(ast: ClassDiagramAST): void {
  const directives = ast.hideEntityDirectives;
  if (directives === undefined || directives.length === 0) return;

  const effective = new Map<string, 'hide' | 'show'>();
  for (const d of directives) {
    effective.set(`${d.entityId}\u0000${d.target}`, d.action);
  }

  const byId = new Map(ast.classifiers.map((c) => [c.id, c] as const));
  for (const [key, action] of effective) {
    if (action !== 'hide') continue;
    const sep = key.indexOf('\u0000');
    const entityId = key.slice(0, sep);
    const target = key.slice(sep + 1) as HideShowEntityDirective['target'];
    const classifier = byId.get(entityId);
    if (classifier === undefined) continue;
    if (target === 'circle') { classifier.hideCircle = true; continue; }
    if (target === 'stereotype') { classifier.hideStereotype = true; continue; }
    if (target === 'members') { classifier.suppressFields = true; classifier.suppressMethods = true; continue; }
    if (target === 'fields') { classifier.suppressFields = true; continue; }
    classifier.suppressMethods = true;
  }
}

/**
 * `hide|show <TYPE_KEYWORD> circle|circles|circled|members|member|fields|
 * field|attributes|attribute|methods|method` (upstream
 * `CommandHideShowByGender`, the TYPE_KEYWORD GENDER alternative --
 * {@link HideShowKindDirective}'s own doc comment, G3/O3, `beruju-17-jigi548`).
 * SAME two-token grammar as {@link parseHideShowEntityDirective}, but the
 * first token must be a {@link KIND_GENDER_MAP} key rather than an
 * arbitrary entity id -- the two parsers are mutually exclusive by
 * construction (that parser explicitly REJECTS every `TYPE_KEYWORD_GENDERS`
 * token as an entity id), so callers may try either first with no collision.
 */
const HIDE_SHOW_KIND_RE = /^(hide|show)\s+(\S+)\s+(\S+)\s*$/i;

export function parseHideShowKindDirective(line: string): HideShowKindDirective | null {
  const m = HIDE_SHOW_KIND_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const classifierKind = KIND_GENDER_MAP[m[2]!.toLowerCase()];
  if (classifierKind === undefined) return null;
  const target = ENTITY_PORTION_MAP[m[3]!.toLowerCase()];
  if (target === undefined) return null;

  return { kind: 'hideshowkind', action, classifierKind, target };
}

/**
 * Apply `hide`/`show <TYPE_KEYWORD> circle|members|fields|methods`
 * directives (G3/O3) -- last-writer-wins per `(classifierKind, target)`
 * pair, mirrors {@link applyHideShowEntityDirectives} exactly except the
 * match set is every classifier of the matching KIND (diagram-wide)
 * instead of a single entity id.
 */
export function applyHideShowKindDirectives(ast: ClassDiagramAST): void {
  const directives = ast.hideKindDirectives;
  if (directives === undefined || directives.length === 0) return;

  const effective = new Map<string, 'hide' | 'show'>();
  for (const d of directives) {
    effective.set(`${d.classifierKind}\u0000${d.target}`, d.action);
  }

  for (const [key, action] of effective) {
    if (action !== 'hide') continue;
    const sep = key.indexOf('\u0000');
    const classifierKind = key.slice(0, sep) as ClassifierKind;
    const target = key.slice(sep + 1) as HideShowEntityDirective['target'];
    for (const classifier of ast.classifiers) {
      if (classifier.kind !== classifierKind) continue;
      if (target === 'circle') { classifier.hideCircle = true; continue; }
      if (target === 'stereotype') { classifier.hideStereotype = true; continue; }
      if (target === 'members') { classifier.suppressFields = true; classifier.suppressMethods = true; continue; }
      if (target === 'fields') { classifier.suppressFields = true; continue; }
      classifier.suppressMethods = true;
    }
  }
}

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

export function parseHideShowVisibilityDirective(
  line: string,
): HideShowVisibilityDirective | null {
  const m = VISIBILITY_HIDESHOW_RE.exec(line);
  if (m === null) return null;

  const action: 'hide' | 'show' = /^hide/i.test(m[1]!) ? 'hide' : 'show';
  const visibilities = [...new Set(
    m[2]!.toLowerCase().split(/[,\s]+/).filter((t) => t !== ''),
  )] as Array<'public' | 'private' | 'protected' | 'package'>;

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
    case '+': return 'public';
    case '-': return 'private';
    case '#': return 'protected';
    case '~': return 'package';
    default: return undefined;
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
function computeHiddenVisibilityPortions(
  directives: readonly HideShowVisibilityDirective[],
): Set<string> {
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
      classifier.rawBodyLines = classifier.rawBodyLines.filter(
        (raw) => !isRawLineHiddenByVisibility(raw, hidden),
      );
    }
  }
}


// Directive application + removal computation moved to a sibling module
// (line cap); re-exported so `from './class-directives.js'` is unchanged.
export {
  applyDirectives, computeRemovedIds, computeHiddenIds, filterRemovedEntities,
} from './class-directives-removal.js';
