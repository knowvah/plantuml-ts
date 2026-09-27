/**
 * `buildPlainRows` + C-2's `#`-prefixed numbered-list row builder — split
 * out of `note-layout-measure.ts` purely to keep that file under this
 * project's 500-line cap (T26; mirrors that file's own `note-layout-
 * measure-rows.ts` split precedent, same reason). `buildPlainRows` is a
 * PURE MOVE (no behavior change) — housed here (not `note-layout-measure-
 * rows.ts`) so `buildNumberedListRows`, which needs it, can sit alongside
 * it without pushing THAT file over the cap either.
 */
import {
  buildMemberAtoms,
  resolveMemberAtoms,
  buildWrappedMemberRows,
  atomsToPlainText,
} from './class-member-creole.js';
import type { MemberRenderAtom } from './class-member-render-atom.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import type { CreoleContext } from '../../core/klimt/creole/CreoleContext.js';
import { type NoteRow, type NoteLineBuildContext, noteLineHeight } from './note-layout-measure-rows.js';

/**
 * Plain creole line -> one row normally, 2+ when `ctx.maxWidth` wraps it
 * (G2 N66, mirrors `buildWrappedSectionRowBuilds`'s convention: single-row
 * keeps the source text verbatim; wrapped rows rebuild from their atoms).
 */
export function buildPlainRows(rawLine: string, ctx: NoteLineBuildContext): NoteRow[] {
  const { font, fontSpec, measurer, maxWidth, fontSize, sprites } = ctx;
  const ln = resolveTextEscapes(rawLine);
  const builds =
    maxWidth > 0
      ? buildWrappedMemberRows(ln, {}, fontSpec, measurer, maxWidth, sprites)
      : [resolveMemberAtoms(buildMemberAtoms(ln, font), font, measurer, sprites)];
  return builds.map((build) => ({
    text: builds.length === 1 ? ln : atomsToPlainText(build.atoms),
    width: build.width,
    atoms: build.atoms,
    height: noteLineHeight(build.atoms, fontSize),
  }));
}

/** `StringUtils.trin` (java:502-530) — strips chars `<= ' '` from both
 *  ends. Duplicated from `note-layout-measure.ts`'s own private copy
 *  (that file's own established "small private helper, no cross-module
 *  boundary for it" precedent — `note-layout-measure-rows.ts`'s module
 *  doc comment names the same convention). */
function trin(s: string): string {
  return s.replace(/^[\u0000- ]+/, '').replace(/[\u0000- ]+$/, '');
}

/** C-2: `CreoleStripeSimpleParser.java:72` — `HASH_HEADING_PATTERN`,
 *  `^(#+)(.+)$`, matched against `CharHidder.hide(line)` (this port's
 *  `CharHidder` is not ported; a leading `#` run plus the remainder is
 *  unaffected by anything `hide`/`unhide` rewrites, same documented
 *  narrowing `core/klimt/creole/legacy/CreoleStripeSimpleParser.ts`'s own
 *  `listClassification` carries for the identical pattern). `order =
 *  group(1).length - 1`, `text = trin(group(2))` (java:136-144, mirrors
 *  `note-layout-measure.ts#matchBulletLine`). */
const HASH_PREFIXED_LINE_PATTERN = /^(#+)(.+)$/;

export function matchNumberedLine(ln: string): { order: number; text: string } | undefined {
  const m = HASH_PREFIXED_LINE_PATTERN.exec(ln);
  if (m === null) return undefined;
  return { order: m[1]!.length - 1, text: trin(m[2]!) };
}

/** `AtomTextUtils.java:148` — the reference string whose width is ONE
 *  indent level (`marginLeft = width("9. ") * order`). */
const LIST_NUMBER_INDENT_REFERENCE = '9. ';
/** `AtomTextUtils.java:154` — the reference string whose width is the
 *  trailing gap after the number (`marginRight = width(".")`). */
const LIST_NUMBER_TRAILING_REFERENCE = '.';

/**
 * C-2: one `#`-prefixed numbered-list row — `StripeStyle#getHeader`'s
 * `LIST_WITH_NUMBER` branch (`StripeStyle.java:56-60`): `context
 * .getLocalNumber(order)` advances (and is evaluated) BEFORE the header
 * atom is built, then `AtomTextUtils.createListNumber` (java:145-159)
 * builds a `"N."` run with a per-depth LEFT margin (`width("9. ") *
 * order`) and a trailing-gap RIGHT margin (`width(".")`) — the SAME
 * "layout width reserved, glyph offset by an own translate" shape
 * `Bullet.java:63-68`'s cell-width split uses (`note-layout-measure.ts
 * #buildBulletRows`'s sibling; inlined here rather than instantiating the
 * OOP `AtomTextUtils#createListNumber`/`ListNumberAtom` for the SAME
 * reason `buildBulletRows` inlines `Bullet.java`'s geometry instead of the
 * OOP `Bullet` class — this module family never routes through the
 * `Sheet`/`Stripe` object model, `note-layout-measure.ts`'s own module doc
 * comment). `CreoleContext#getLocalNumber` (`klimt/creole/CreoleContext
 * .java`) IS reused verbatim — its first caller in this port.
 *
 * Word-wrap: the SAME generic `Fission#getSplitted` header/blank split
 * `buildBulletRows` implements — a numbered list is ALSO a `Stripe` with
 * an `LHeader` (`StripeStyle#getHeader`'s return feeds `StripeSimple`'s
 * ctor identically for both list kinds, `Fission.java:63-101` never
 * branches on WHICH header kind it received) — row 0 keeps the real
 * header atom, every continuation row gets `blank: true` (same reserved
 * width, empty draw, `Fission.java:87,226-245`), budget `maxWidth -
 * headerWidth`.
 */
export function buildNumberedListRows(
  numbered: { readonly order: number; readonly text: string },
  context: CreoleContext,
  ctx: NoteLineBuildContext,
): NoteRow[] {
  const { measurer, fontSpec, font } = ctx;
  const localNumber = context.getLocalNumber(numbered.order);
  const headerText = `${String(localNumber + 1)}.`;
  const dx = measurer.measure(LIST_NUMBER_INDENT_REFERENCE, fontSpec).width * numbered.order;
  const marginRight = measurer.measure(LIST_NUMBER_TRAILING_REFERENCE, fontSpec).width;
  const textWidth = measurer.measure(headerText, fontSpec).width;
  const headerWidth = dx + textWidth + marginRight;
  const textCtx = ctx.maxWidth > 0 ? { ...ctx, maxWidth: ctx.maxWidth - headerWidth } : ctx;
  const header: MemberRenderAtom = {
    kind: 'listNumber',
    text: headerText,
    font,
    dx,
    textWidth,
    width: headerWidth,
  };
  return buildPlainRows(numbered.text, textCtx).map((row, i) => ({
    text: row.text,
    width: headerWidth + row.width,
    atoms: [i === 0 ? header : { ...header, blank: true }, ...row.atoms],
    height: row.height,
  }));
}
