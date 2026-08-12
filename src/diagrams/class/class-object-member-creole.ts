/**
 * An object leaf's member rows, built through the creole engine — with tab
 * stops preserved.
 *
 * ## Why creole at all
 *
 * `MethodsOrFieldsArea#createTextBlock` (`cucadiagram/MethodsOrFieldsArea
 * .java:238-265`) builds EVERY member row as
 * `Display.getWithNewlines(…).create8(config, align, skinParam,
 * CreoleMode.SIMPLE_LINE, style.wrapWidth())`. A member row is a creole line
 * upstream, not raw text. This port measured and emitted the raw string, so an
 * object row rendered no creole markup at all.
 *
 * `CommandCreoleBuilder.java:85-86` registers the creole `__underline__`
 * command ONLY under `CreoleMode.FULL`:
 *
 * ```java
 * if (modeSimpleLine == CreoleMode.FULL)
 *     addCommand(CommandCreoleStyle.createCreole(FontStyle.UNDERLINE));
 * ```
 *
 * Strike (`--x--`) and monospace (`""x""`) are added unconditionally. That
 * asymmetry is exactly what the jar draws for `object/pavizi-27-xupe815`:
 * `__underscored__` stays literal while `""monospaced""` and `--crossed--`
 * each become their own styled runs. Creole's `~` escape rides the same path
 * (`CharHidder`), which is why that fixture's `~__underscored__` lost its
 * tilde in the jar and kept it here — 8.225px of excess node width.
 *
 * ## Why tabs need composing rather than replacing
 *
 * The class engine's member path does NOT do tab-stop positioning, but the
 * object path did (G3/O4's `layoutTabRuns`), and five object fixtures use a
 * literal tab. Upstream has no conflict here because tab expansion lives
 * INSIDE the text atom — `AtomText#getWidth`/`drawU` tokenize on `\t` and
 * advance to the next stop — i.e. after creole has produced the runs, not
 * instead of it.
 *
 * So the order here is creole first, tab stops within each resulting text
 * atom, and the output stays ONE ROW PER DRAWN RUN — the shape the object
 * path already had. A tab advances x and contributes no run.
 *
 * A zero-width spacer ATOM was tried first and is wrong: an empty text atom
 * still emits a `<text></text>`, which changed the element count
 * `object/nufoju-44-dabi767`'s golden ratchet pins.
 */

import { resolveMemberAtoms } from './class-member-creole.js';
import { buildStripeAtoms, buildLiteralAtoms, fontConfigurationForHeading } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { classifyStripeLine } from '../../core/klimt/creole/legacy/CreoleStripeSimpleParser.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { CharHidder } from '../../core/utils/CharHidder.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { StringMeasurer } from '../../core/measurer.js';

/** One drawn run: a single styled atom at its x within the row. */
export interface ObjectMemberRun {
  readonly atom: MemberRenderAtom;
  readonly x: number;
}

export interface ObjectMemberRow {
  /** One entry per DRAWN run. A tab contributes no run — it only advances
   *  x — which is why a tab cannot be modelled as a zero-width spacer ATOM:
   *  an empty text atom still emits a `<text></text>` and would change the
   *  element count the object golden ratchet pins
   *  (`object/nufoju-44-dabi767`). */
  readonly runs: readonly ObjectMemberRun[];
  /** Total advance, tab gaps included. */
  readonly width: number;
  /** This row's OWN height — the max of its atoms' line contributions, so a
   *  sprite/image row is taller than the font size.
   *  `MethodsOrFieldsArea#calculateDimensionOnlyMembers` advances
   *  `y += dim.getHeight()` per MEMBER (java:161-166), not by a uniform
   *  step. */
  readonly height: number;
}

/** One member row's creole atoms, with tab stops expanded into spacer atoms. */
export function buildObjectMemberRow(
  text: string,
  font: FontConfiguration,
  measurer: StringMeasurer,
  tabStopPx: number,
): ObjectMemberRow {
  // `CreoleMode.SIMPLE_LINE`, NOT the `FULL` that `buildMemberAtoms` defaults
  // to. That is the whole point of `CommandCreoleBuilder.java:85-86`: under
  // SIMPLE_LINE the creole `__underline__` command is never registered, so
  // `__underscored__` stays literal while `""x""` and `--x--` still style.
  // Building with FULL splits `__underscored__` into runs the jar does not
  // produce (measured: it WIDENED pavizi-27 from 0.114 to 0.286).
  // Same classification dispatch as `class-member-creole.ts#buildMemberAtoms`
  // (that one hardcodes the FULL default, which is why it is not reused).
  // `StripeSimple#analyzeAndAdd` hides the tilde escapes BEFORE the command
  // scan (`StripeSimple.java:150`): `~X` becomes the private-use char
  // U+E000+X, so no creole command can match it, and `AtomText`'s constructor
  // unhides it afterwards (`AtomText.java:78`). Both halves are needed here --
  // pavizi-27's `This is not ~""monospaced"".` must keep its quotes UNSTYLED
  // and lose the tilde, which hiding alone or dropping alone cannot do.
  const cls = classifyStripeLine(CharHidder.hide(text));
  const atoms =
    cls.type === 'NORMAL'
      ? buildStripeAtoms(cls.content, font, CreoleMode.SIMPLE_LINE)
      : cls.type === 'HEADING'
        ? buildStripeAtoms(cls.content, fontConfigurationForHeading(font, cls.order), CreoleMode.SIMPLE_LINE)
        : cls.type === 'LITERAL'
          ? buildLiteralAtoms(cls.content, font)
          : // HORIZONTAL_LINE has no member-row analogue upstream; keep the
            // untouched text as one atom rather than lose it.
            [{ kind: 'text' as const, text, font }];
  const build = resolveMemberAtoms(atoms, font, measurer);
  const out: ObjectMemberRun[] = [];
  let x = 0;
  for (const atom of build.atoms) {
    if (atom.kind !== 'text') {
      out.push({ atom, x });
      x += atom.width;
      continue;
    }
    // `AtomText.java:78` unhides in the constructor, i.e. per atom, once the
    // commands have already been resolved against the hidden text.
    const shown = CharHidder.unhide(atom.text);
    if (!shown.includes('\t')) {
      const width = shown === atom.text
        ? atom.width
        : measurer.measure(shown, { family: atom.font.family, size: atom.font.size }).width;
      out.push({ atom: { ...atom, text: shown, width }, x });
      x += width;
      continue;
    }
    // `AtomText#getWidth`'s own walk: a tab advances to the next multiple of
    // the stop and draws nothing; everything else advances by its measured
    // width. Split so each drawn piece keeps this atom's font.
    for (const token of shown.split(/(\t)/).filter((t) => t.length > 0)) {
      if (token === '\t') {
        x += tabStopPx - (x % tabStopPx);
        continue;
      }
      const width = measurer.measure(token, { family: atom.font.family, size: atom.font.size }).width;
      out.push({ atom: { ...atom, text: token, width }, x });
      x += width;
    }
  }
  return { runs: out, width: x, height: build.height };
}
