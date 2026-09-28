/**
 * `note on link` + `constraint on links` — split out of `class-notes.ts`
 * (500-line file cap, cdd5-T3c) to make room for the namespace-qualification
 * fix in that file. Pure move, no behavior change; re-exported from
 * `class-notes.ts` so existing `from './class-notes.js'` import sites are
 * unchanged.
 */

import type { ClassDiagramAST, NotePosition } from './ast.js';
import { isNoteId } from './class-notes.js';

// T14 (dispatch-by-parse-attempt): `note on link`'s color group cannot reuse
// the shared `NOTE_COLOR` approximation below -- that charset admits a bare
// `:` anywhere, so on a multi-attribute color (`#blue;line:yellow;text:purple`,
// nuvake-96-gofe203) the single-line rule's trailing `\s*:\s*(.+)$` backtracks
// INTO the color, splitting off "purple" as fake note text and leaving
// `NOTE_ON_LINK_MULTI_RE` (the line's real match) never tried -- the
// multi-line note body then dispatches as an ordinary line and refuses.
// Upstream never has this ambiguity: `CommandFactoryNoteOnLink`'s color group
// is `ColorParser.simpleColor(ColorType.BACK).getRegex()`
// (CommandFactoryNoteOnLink.java:106-108), whose grammar is bounded to a
// fixed attribute-keyword vocabulary, so a color string fully consumes every
// `keyword:value` pair it contains and leaves no interior `:` for the
// single-line rule to find. Ported verbatim (COLOR_REGEXP/PART2/
// COLORS_REGEXP), scoped to these two regexes only -- the shared `NOTE_COLOR`
// constant has 5 other call sites (class-command-notes.ts,
// class-container.ts) with no fixture evidence of the same ambiguity, and
// CLAUDE.md's "do not refactor while porting" counsels against widening it
// speculatively.
// @see ~/git/plantuml/.../klimt/color/ColorParser.java:43-46
const NOTE_ON_LINK_COLOR_REGEXP = String.raw`#\w+[-\\|/]?\w+`;
const NOTE_ON_LINK_COLOR_PART2 =
  String.raw`#(?:\w+[-\\|/]?\w+;)?(?:(?:text|back|header|line|line\.dashed|line\.dotted|line\.bold|shadowing)` +
  String.raw`(?::\w+[-\\|/]?\w+)?(?:;|(?![\w;:.])))+`;
const NOTE_ON_LINK_COLOR =
  String.raw`(?:\s*(` + `(?:${NOTE_ON_LINK_COLOR_PART2})|(?:${NOTE_ON_LINK_COLOR_REGEXP})` + String.raw`))?`;

/**
 * `note [pos] on|of link [#color] : text` (CommandFactoryNoteOnLink,
 * single-line form) — a note attached to the LAST relationship parsed, not
 * to an entity. Matched BEFORE the attached-note commands (class-commands.ts
 * rules 6b/6c), which require an explicit `left|right|top|bottom` position
 * and would otherwise treat a position-less `note on link:` as a bare
 * `note <pos>` targeting `lastEntity`, or read `link` as a literal entity
 * id. T10: position is now CAPTURED (group 1, optional) rather than
 * discarded -- mirrors the state engine's identical
 * `state-notes.ts#NOTE_ON_LINK_RE`; the color group's own capture (group 2)
 * and the text group (group 3) shift accordingly.
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnLink.java:76-91
 */
export const NOTE_ON_LINK_RE = new RegExp(
  String.raw`^note\s+(left|right|top|bottom)?\s*(?:on|of)\s+link` + NOTE_ON_LINK_COLOR + String.raw`\s*:\s*(.+)$`,
  'i',
);

/**
 * `note [pos] on|of link [#color]` (CommandFactoryNoteOnLink, multi-line
 * form) — same target/position rule as {@link NOTE_ON_LINK_RE}, opens a
 * block closed by `end note` (no bracket variant upstream). Anchored at `$`
 * with no colon so it never overlaps the single-line form. T10: previously
 * unbuilt -- a `note on link` block (no trailing `: text`) matched no
 * command at all, so `Relationship.linkNote` was never populated for the
 * block form (`lozego-15-coci435`'s `note on link #aqua/aliceblue` /
 * `<$test>Note on rel` / `end note`). Mirrors
 * `state-notes.ts#NOTE_ON_LINK_MULTI_RE`.
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnLink.java:93-102
 */
export const NOTE_ON_LINK_MULTI_RE = new RegExp(
  String.raw`^note\s+(left|right|top|bottom)?\s*(?:on|of)\s+link` + NOTE_ON_LINK_COLOR + String.raw`\s*$`,
  'i',
);

/** {@link parseNoteOnLinkColors}'s result — the two slots `ComponentRoseNote`'s
 *  `symbolContext` reads (`Style.java:270-282`). */
export interface NoteOnLinkColors {
  readonly back?: string;
  readonly line?: string;
}

/**
 * cdd2-T19c: `Colors.java:96-124`'s tokenizer (the constructor
 * `ColorParser.getColor` calls, `ColorParser.java:58-67`), scoped to the
 * two slots a note-on-link's own paint actually reads. `CommandFactoryNoteOnLink
 * .java:217-218` builds `colors = color().getColor(arg, ...)` (`color()` =
 * `ColorParser.simpleColor(ColorType.BACK)`, `:106-108`) and hands it to
 * `CucaNote.build`; `EntityImageNoteLink` -> `Rose#createComponentNote` ->
 * `ComponentRoseNote` reads it back via `Style#getSymbolContext(set, colors)`
 * (`style/Style.java:270-282`): `colors.getColor(BACK)` for the fill,
 * `colors.getColor(LINE)` for the outline stroke — both paths fall back to
 * the NOTE style's own default when the slot is unset. A `text:`/`header:`
 * sub-token is tokenized here too (so it does not leak into BACK/LINE, e.g.
 * `line.dotted:blue` keying LINE via `ColorType.getType`'s first-`.`
 * truncation, `ColorType.java:41-47`) but its VALUE is dropped: upstream
 * itself never applies it, because `ComponentRoseNote`'s text draws through
 * the no-`colors` `getFontConfiguration()` overload
 * (`skin/AbstractComponent.java:129-130` -> `Style.java:255-257`, `colors ==
 * null`) — jar-verified against `nuvake-96-gofe203`, whose `text:white`/
 * `text:purple` sub-tokens draw plain `#000` note body text. A bare
 * `line.dashed`/`.dotted`/`.bold` DASH-STYLE token (no colon) is excluded by
 * the same `contains(".")` guard Java uses (`:100-103`) — it sets
 * `Colors#lineStyle`, a separate mechanism this port's `UStroke` has no dash
 * -array plumbing for yet; no fixture in this corpus needs it.
 * @see ~/git/plantuml/.../klimt/color/Colors.java:96-124
 */
/**
 * One `keyword:value` (or bare-color) token from a note-on-link color spec,
 * mutating `state.back`/`state.line` in place — split out of
 * {@link parseNoteOnLinkColors} to stay under the function NLOC cap; pure
 * extraction of that function's own loop body, no behavior change.
 */
function applyColorToken(token: string, state: { back?: string; line?: string }): void {
  const x = token.indexOf(':');
  if (x === -1) {
    if (!token.includes('.')) state.back = token;
    return;
  }
  const name = token.slice(0, x);
  const value = token.slice(x + 1);
  const dot = name.indexOf('.');
  const type = dot === -1 ? name : name.slice(0, dot);
  if (type === 'back') state.back = value;
  else if (type === 'line') state.line = value;
  // `text`/`header`/`shadowing` intentionally dropped -- see doc comment.
}

export function parseNoteOnLinkColors(spec: string | undefined): NoteOnLinkColors {
  if (spec === undefined) return {};
  const data = spec.toLowerCase().replace(/#/g, '');
  const state: { back?: string; line?: string } = {};
  for (const token of data.split(';')) {
    if (token !== '') applyColorToken(token, state); // `StringTokenizer` yields no empty token
  }
  return { ...(state.back !== undefined ? { back: state.back } : {}), ...(state.line !== undefined ? { line: state.line } : {}) };
}

/** Parse an optional `left|right|top|bottom` capture, defaulting to BOTTOM
 *  (`CommandFactoryNoteOnLink.java:203`, `abel/CucaNote.java:76-78`) --
 *  shared by the single- and multi-line `note on link` rules
 *  (class-command-containers.ts). Mirrors
 *  `state-commands-notes.ts#linkNotePosition`. */
export function resolveLinkNotePosition(raw: string | undefined): NotePosition {
  return (raw?.toLowerCase() as NotePosition | undefined) ?? 'bottom';
}

/**
 * Attach `text` as the `linkNote` (+ `linkNotePosition`) of the last
 * relationship — mirrors `Link#addNote`/`diagram.getLastLink()`. Silent
 * no-op with no prior relationship (upstream:
 * `CommandExecutionResult.error("No link defined")`). class-assoc-couple.ts
 * moves this text onto an association-class couple's circle edges if that
 * relationship later gets subsumed (position is NOT carried across that
 * move -- see `class-assoc-couple.ts`'s own doc comment, untouched by T10).
 *
 * cdd2-T19c: `colorSpec` is the raw `NOTE_ON_LINK_COLOR` capture (group 2
 * of `NOTE_ON_LINK_RE`/`NOTE_ON_LINK_MULTI_RE`) — parsed via
 * {@link parseNoteOnLinkColors} and stored as `linkNoteBack`/`linkNoteLine`,
 * mirroring `CommandFactoryNoteOnLink.java:217-218`'s `colors =
 * color().getColor(arg, ...)` + `link.addNote(CucaNote.build(display,
 * position, colors))`. Like `linkNote`/`linkNotePosition` above, NOT
 * carried by `class-assoc-couple.ts`'s subsumed-note move -- no corpus
 * fixture combines a coloured note-on-link with an association-class
 * couple; named remainder if one surfaces.
 */
export function applyNoteOnLink(ast: ClassDiagramAST, position: NotePosition, text: string, colorSpec?: string): void {
  const last = ast.relationships.at(-1);
  if (last === undefined) return;
  last.linkNote = text.trim();
  last.linkNotePosition = position;
  const colors = parseNoteOnLinkColors(colorSpec);
  if (colors.back !== undefined) last.linkNoteBack = colors.back;
  if (colors.line !== undefined) last.linkNoteLine = colors.line;
}

/** `constraint on links [#color] : text` — upstream CommandConstraintOnLinks
 *  (command/note/CommandConstraintOnLinks.java) marks the TWO most-recent
 *  links whose endpoints are not NOTE leaves with a LinkConstraint
 *  (CucaDiagram#constraintOnLinks via getTwoLastLinks, CucaDiagram.java:660,
 *  712). svek then emits a fixed 10x10 label spot on each constrained edge
 *  carrying no note/label text (SvekEdge.java:430; CONSTRAINT_SPOT at :122)
 *  plus the constraint's own TEXT, drawn post-layout
 *  (SvekEdge.java:993-1011's `linkConstraint.drawMe`). Fewer than two links
 *  → upstream errors; here a consumed no-op. Group 1 is the display text
 *  (T5/M9 — previously captured then discarded at the call site). */
export const CONSTRAINT_ON_LINKS_RE = /^constraint\s*on\s+links\s*(?:#\w+\s*)?:\s*(.*)$/i;

export function applyConstraintOnLinks(ast: ClassDiagramAST, text: string): void {
  const links = ast.relationships.filter((r) => !isNoteId(ast, r.from) && !isNoteId(ast, r.to));
  if (links.length < 2) return;
  const constraint = { text: text.trim() };
  links[links.length - 1]!.linkConstraint = constraint;
  links[links.length - 2]!.linkConstraint = constraint;
}
