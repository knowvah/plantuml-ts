/**
 * class-namespace-title-runs.ts — cdd-T26: resolves a namespace/package
 * folder-tab or rect title's `<img:>`/`<$sprite>` markup, split out of
 * `class-namespace-shape.ts` purely to keep that file under the repo's
 * 500-line cap (same precedent as that file's own `class-namespace-folder-
 * outline.ts` split — a pure move, no behavior change to the moved code
 * beyond the new functions this task adds).
 *
 * See {@link namespaceTitleRuns}'s own doc comment for the full mechanism
 * and its jar citation.
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { atomFontSpec } from './class-member-creole-sea.js';
import { text } from '../../core/svg.js';

/** `class-namespace-shape.ts#titleFont`'s `FontConfiguration` counterpart
 *  and `#titleFontColor` — needed to route a folder/rect title through the
 *  shared creole atom lexer (`buildLineAtoms`), which speaks
 *  `FontConfiguration` (`core/klimt/shape/UText.ts`), not that module's
 *  plain `FontSpec`. Duplicated (not imported) per this module's own
 *  small-enough-to-duplicate precedent (`class-namespace-title-table.ts
 *  #namespaceTitleFont`'s identical doc-commented rationale) rather than
 *  widening `class-namespace-shape.ts`'s public surface for one caller. */
function titleFontConfiguration(theme: Theme): FontConfiguration {
  const size = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  const override = theme.colors.elements?.package?.font;
  const color = typeof override === 'string' ? override : '#000000';
  return { family: theme.fontFamily, size, color, styles: new Set([FontStyle.BOLD]) };
}

/** One resolved title run: text plus the `FontConfiguration` it draws at
 *  (which may differ from the title's own base font — see below). */
export interface NamespaceTitleRun {
  readonly text: string;
  readonly font: FontConfiguration;
}

/**
 * cdd-T26: resolves a folder/rect title's plain text PLUS any `<img:>`
 * cannot-decode fallback run via the shared creole atom lexer
 * (`buildLineAtoms`, `core/klimt/creole/legacy/StripeSimple.ts`) — the SAME
 * pipeline class member rows already go through
 * (`class-member-creole.ts#resolveOneAtom`). A markup-free label reduces to
 * exactly one `{kind:'text', text: label, font}` atom (`StripeSimple.ts`'s
 * own single-atom line shape), so every pre-existing conformant namespace
 * fixture is measurement- and render-IDENTICAL after this cutover — the
 * `runs.length <= 1` branches in `class-namespace-shape.ts#getWTitle`/
 * `renderNamespaceFolder` take the untouched pre-existing code path.
 *
 * `<img:HelloWorld.png{scale=1.5}>` (a plain file path, no data URI/http) is
 * exactly upstream's non-decodable case: `AtomImg.create`'s file-exists
 * check (`AtomImg.java:171-177`) fails under this browser-safe port's
 * no-filesystem-access architecture (project CLAUDE.md), and — matching
 * upstream's own non-`INSECURE` default (`SecurityUtils.getSecurityProfile
 * () == SecurityProfile.INSECURE`, java:173) — always resolves to the short
 * `(Cannot decode)` fallback text, at the jar's hardcoded monospace-14
 * `IMG_FALLBACK_FONT` (`StripeSimple.ts`), NOT this title's own bold font.
 * `jabama-09-kago823` jar-verified: `MyNamespaceName` (bold sans, 130.725px)
 * + `(Cannot decode)` (monospace, non-bold, 100.363px), same baseline y,
 * sequential x (10 -> 140.725, `geo.x+4` plus the first run's own width).
 *
 * A `<$sprite>` or successfully-decoded `<img:data:...>` atom (the
 * 'inline' `CreoleAtom` kind) is a named, narrow gap: no namespace/cluster-
 * title fixture in this mission's corpus exercises it (cdd-T26 diagnosis),
 * so it is skipped (contributes no run) rather than drawn — a future task
 * with a fixture to verify against should extend this the way
 * `class-member-atom-resolve.ts#resolveInlineAtom` already does for member
 * rows.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java:171-177
 */
export function namespaceTitleRuns(label: string, theme: Theme): readonly NamespaceTitleRun[] {
  const font = titleFontConfiguration(theme);
  const runs: NamespaceTitleRun[] = [];
  for (const atom of buildLineAtoms(label, font).atoms) {
    if (atom.kind === 'text') runs.push({ text: atom.text, font: atom.font });
  }
  return runs.length > 0 ? runs : [{ text: label, font }];
}

/** Sum of {@link namespaceTitleRuns}' own per-run measured widths — the
 *  multi-font-aware replacement for a single `measurer.measure(label,
 *  ...).width` call, reducing to that exact call for a markup-free label
 *  (one run, at the SAME base font). */
export function namespaceTitleWidth(measurer: StringMeasurer, theme: Theme, label: string): number {
  let width = 0;
  for (const run of namespaceTitleRuns(label, theme)) width += measurer.measure(run.text, atomFontSpec(run.font)).width;
  return width;
}

/** Draws {@link namespaceTitleRuns}' MULTI-run branch: one `<text>` per
 *  run, each at its OWN font, sequentially placed from `x0` — jar-verified
 *  `jabama-09-kago823`: `MyNamespaceName` (bold sans) then `(Cannot
 *  decode)` (monospace, non-bold) at `x = x0 + run1.width`, same baseline
 *  `y` for both (`class-namespace-shape.ts#renderNamespaceTitleLabel`'s own
 *  doc comment for the single-run byte-identical fallback this complements). */
export function renderNamespaceTitleRuns(
  x0: number,
  y: number,
  runs: readonly NamespaceTitleRun[],
  measurer: StringMeasurer,
): string {
  let x = x0;
  let out = '';
  for (const run of runs) {
    const width = measurer.measure(run.text, atomFontSpec(run.font)).width;
    out += text(x, y, run.text, {
      fontFamily: run.font.family,
      fontSize: run.font.size,
      ...(run.font.styles.has(FontStyle.BOLD) ? { fontWeight: '700' } : {}),
      fill: run.font.color ?? '#000000',
      lengthAdjust: 'spacing' as const,
      textLength: width,
    });
    x += width;
  }
  return out;
}
