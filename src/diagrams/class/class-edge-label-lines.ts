/**
 * Per-line word-wrap for class-engine edge labels: `wrapPlainTextLine`.
 *
 * Split out of `class-layout-edge-labels.ts` (2026-08-16, mission
 * `edge-label-box-backlog` T12b) purely to keep that file under this
 * project's 500-line cap WITHOUT trimming any upstream-citation comment --
 * this function is a standalone algorithm with no dependency on the
 * `Relationship`/edge-attrs functions that stayed behind, so this is a pure
 * move: no behavior differs from the original inline code. Precedent:
 * `core/klimt/creole/DisplayNewlines.ts`, split out of `Display.ts` for the
 * identical reason. `class-layout-edge-labels.ts` re-exports the symbol
 * here so no external import path changes.
 *
 * Mission `shared-seam-extraction` T1 retired this file's OTHER two
 * exports, `splitEdgeLabelLines`/`resolveLabelEscape` -- an independent
 * re-derivation of `Display#getWithNewlines`'s escape scan
 * (`klimt/creole/Display.java:262-346`) that `core/klimt/creole/
 * DisplayNewlines.ts#splitDisplayLines` already ports faithfully. Every
 * former caller now imports that adapter directly; `wrapPlainTextLine`
 * (below) is NOT a `Display` port (word-wrap is a Fission/`MaximumWidth`
 * concern, not a newline-escape concern) and stays here unchanged.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { StringMeasurer } from '../../core/measurer.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';

/**
 * G2 N65 item 35: word-wraps ONE already-`\\n`/`\\l`/`\\r`-split line
 * (`splitDisplayLines`'s own output, `core/klimt/creole/DisplayNewlines.ts`)
 * via the SAME Fission engine E2r built for description word-wrap
 * (`Fission.ts#getSplitted`) -- upstream mirror:
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
