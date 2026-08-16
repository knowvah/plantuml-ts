/**
 * Line-splitting/word-wrapping helpers for class-engine edge labels:
 * `\\n`/`\\l`/`\\r` escape splitting (`splitEdgeLabelLines`) and per-line
 * word-wrap (`wrapPlainTextLine`).
 *
 * Split out of `class-layout-edge-labels.ts` (2026-08-16, mission
 * `edge-label-box-backlog` T12b) purely to keep that file under this
 * project's 500-line cap WITHOUT trimming any upstream-citation comment --
 * every function below is a standalone algorithm with no dependency on the
 * `Relationship`/edge-attrs functions that stayed behind, so this is a pure
 * move: no behavior differs from the original inline code. Precedent:
 * `core/klimt/creole/DisplayNewlines.ts`, split out of `Display.ts` for the
 * identical reason. `class-layout-edge-labels.ts` re-exports every symbol
 * here so no external import path changes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { StringMeasurer } from '../../core/measurer.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';

/** G2 item 43: the alignment a `\\n`/`\\l`/`\\r`-split edge label resolves
 *  to -- see {@link splitEdgeLabelLines}'s doc comment. */
export type EdgeLabelAlign = 'center' | 'left' | 'right';

export interface EdgeLabelLines {
  lines: string[];
  align: EdgeLabelAlign;
}

/**
 * G2 item 43: split a relationship label's `\\n`/`\\l`/`\\r` line-break
 * escape sequences into individual lines, mirroring jar's
 * `Display#getWithNewlines` (`klimt/creole/Display.java:259-343`,
 * `Pragma.legacyReplaceBackslashNByNewline()` always `true`). `\\n` breaks
 * the line with no alignment change; `\\l`/`\\r` ALSO break the line and
 * additionally set the WHOLE block's horizontal alignment (the LAST
 * `\\l`/`\\r` in the string wins -- jar's `naturalHorizontalAlignment`
 * field is overwritten on each occurrence, not tracked per-line).
 * `\\t` -> a literal tab (`current.append('\t')`); `\\\\` -> a literal
 * backslash; any OTHER `\\x` pair is kept AS-IS (jar's trailing `else`
 * branch appends both characters unchanged, Display.java:308-310). Default
 * alignment (no `\\l`/`\\r` present) is CENTER
 * (`SvekEdge#getMessageTextAlignment` -> `getDefaultTextAlignment(CENTER)`,
 * SvekEdge.java:376-381). Jar-verified against `sicile-99-pefa679`'s 3
 * sibling edges (identical 3-line text, one `\\n`/`\\l`/`\\r` each).
 * Deliberately narrower than `Display.java`'s full state machine (no
 * `<math>`/`<latex>`/`[[`-raw-mode gating, no `%newline()`/`%n()` macro
 * forms, no `Jaws`-internal control-char handling) -- those branches are
 * unreached by any grep-confirmed edge-label fixture in this mission's
 * corpus (`ledger.md` item 43's own reach survey).
 */
/** One resolved `\\x` escape pair's effect on `splitEdgeLabelLines`'s scan
 *  state -- factored out purely to keep that function's CCN under the
 *  project's per-function cap; the resolution logic itself is unchanged. */
interface EscapeEffect {
  /** Literal text to append to the current line (empty when the escape
   *  breaks the line instead of appending anything). */
  append: string;
  /** True when this escape ends the current line (`\\n`/`\\l`/`\\r`). */
  breakLine: boolean;
  /** New whole-block alignment, when this escape sets one (`\\l`/`\\r`). */
  align?: EdgeLabelAlign | undefined;
}

function resolveLabelEscape(c2: string): EscapeEffect {
  if (c2 === 'n' || c2 === 'r' || c2 === 'l') {
    return { append: '', breakLine: true, align: c2 === 'r' ? 'right' : c2 === 'l' ? 'left' : undefined };
  }
  if (c2 === 't') return { append: '\t', breakLine: false };
  if (c2 === '\\') return { append: c2, breakLine: false };
  return { append: `\\${c2}`, breakLine: false };
}

export function splitEdgeLabelLines(text: string): EdgeLabelLines {
  const lines: string[] = [];
  let current = '';
  let align: EdgeLabelAlign = 'center';
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (c === '\\' && i < text.length - 1) {
      const c2 = text[i + 1]!;
      i++;
      const effect = resolveLabelEscape(c2);
      if (effect.align !== undefined) align = effect.align;
      if (effect.breakLine) {
        lines.push(current);
        current = '';
      } else {
        current += effect.append;
      }
    } else {
      current += c;
    }
  }
  lines.push(current);
  return { lines, align };
}

/**
 * G2 N65 item 35: word-wraps ONE already-`\\n`/`\\l`/`\\r`-split line
 * (`splitEdgeLabelLines`'s own output) via the SAME Fission engine E2r built
 * for description word-wrap (`Fission.ts#getSplitted`) -- upstream mirror:
 * `EntityImageClassHeader.java:108`'s `Display#create8(..., styleHeader
 * .wrapWidth())` call runs `Fission#getSplitted` on EACH already-newline-
 * split `CharSequence` independently (`Display.getWithNewlines` splits
 * first, `create8` wraps each resulting line second -- the two mechanisms
 * compose, never interact). A classifier header carries no creole markup
 * today (item 48, unattempted -- a header's `**bold**`/`<color:>` runs
 * render as literal text, not interpreted), so this wraps a SINGLE
 * synthetic plain-text `CreoleAtom` per line rather than a real multi-atom
 * sequence -- `getSplitted`'s own word-boundary scan (`Neutron
 * .getNeutronTypeFromChar`) operates identically on a lone text atom either
 * way. `maxWidth<=0` (no `MaximumWidth` cascade in effect) short-circuits to
 * `[text]`, byte-identical to pre-item-35 behavior.
 */
export function wrapPlainTextLine(
  text: string,
  fontSpec: { readonly family: string; readonly size: number },
  maxWidth: number,
  measurer: StringMeasurer,
): readonly string[] {
  if (maxWidth <= 0) return [text];
  const atom: CreoleAtom = {
    kind: 'text', text,
    font: { family: fontSpec.family, size: fontSpec.size, color: null, styles: new Set() },
  };
  const wrapped = getSplitted(
    [atom], maxWidth, (a) => (a.kind === 'text' ? measurer.measure(a.text, fontSpec).width : 0),
  );
  return wrapped.map((lineAtoms) => lineAtoms.filter((a) => a.kind === 'text').map((a) => a.text).join(''));
}
