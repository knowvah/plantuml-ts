/**
 * StripeTree — one `|_`-prefixed tree-list creole block. Wraps a single
 * `AtomTree` (one cell per physical raw-text line of the block, each cell
 * itself a small `StripeSimple`-built creole run) in a 2px top/bottom
 * `AtomWithMargin`, and exposes it as the block's sole atom.
 *
 * Upstream: klimt/creole/legacy/StripeTree.java (`implements Stripe`).
 * Ported in full: the constructor's field assignment + `AtomTree`/
 * `AtomWithMargin` construction order, `getAtoms`, `getLHeader` (always
 * `null` — bullet-list-style headers are TREE-irrelevant, matching
 * `StripeStyle.ts`'s own `NORMAL`/`HEADING`/`HORIZONTAL_LINE`/`TREE`
 * fallthrough), `computeLevel` (exported standalone, see below), and (T10g)
 * `analyzeAndAdd`'s real per-line tree-cell construction (java:80-90).
 *
 * ## `implements Stripe<Atom>` (batch-3a/T10g)
 *
 * Upstream's real `klimt/creole/Stripe.java` interface is `List<Atom>
 * getAtoms()` where `Atom` is the general OOP interface. This port's
 * `../Stripe.ts` was originally non-generic, declaring `getAtoms(): readonly
 * CreoleAtom[]` — a narrowing faithful only for `StripeSimple`'s flat text/
 * inline/latex run — so `StripeTree` could not honestly satisfy it (T10c's
 * own finding, `.agent-notes/T10c-tree.md`). T10g made `Stripe<A>` generic
 * over its atom type (bare `Stripe` still defaults to `CreoleAtom`, so every
 * OTHER file's usage is unchanged — see `../Stripe.ts`'s own doc comment for
 * the full rationale), so this class now declares `implements Stripe<Atom>`
 * and `getAtoms()`/`getLHeader()` below return `Atom`/`Atom | null` directly,
 * matching upstream's real contract exactly.
 *
 * ## `HColor` -> `Paint` (established T2 substitution — see `AtomTree.ts`'s
 * identical note): `fontConfiguration.getColor()` (java:66, an `HColor`)
 * becomes `fontConfiguration.color` (`string | null`, `UText.ts`'s own
 * `FontConfiguration`); `null` maps to the port-wide `NONE_PAINT = 'none'`
 * sentinel (`Cluster.ts`/`AbstractCommonUGraphic.ts`'s established local
 * constant, redeclared here per this port's per-file convention — neither
 * file exports it) before reaching `AtomTree`'s `Paint`-typed constructor.
 *
 * ## `analyzeAndAdd` (T10g): the per-cell "`StripeSimple`" build is
 * `buildStripeAtoms`, not a real `StripeSimple` instance
 *
 * Upstream's real body (java:80-90) constructs `new StripeSimple
 * (fontConfiguration, stripeStyle, new CreoleContext(), skinParam,
 * CreoleMode.FULL)` per `\n`-split sub-line, then calls its
 * `analyzeAndAdd(text)`. `StripeSimple#analyzeAndAdd` dispatches on
 * `style.getType()` (java:143-152 of `StripeSimple.java`): for `TREE`
 * (neither `HEADING` nor `HORIZONTAL_LINE`), that is the plain
 * `modifyStripe(line)` branch — the IDENTICAL algorithm this port's
 * `legacy/StripeSimple.ts#buildStripeAtoms` already implements (ADR-9: bind
 * to the existing data-oriented pipeline rather than port a parallel OOP
 * `StripeSimple`). `stripeStyle.getHeader(fontConfiguration, context)`
 * (upstream's own `StripeSimple` constructor, before `analyzeAndAdd` is
 * even called) is UNCONDITIONALLY `null` with NO side effect for
 * `StripeStyleType.TREE` (`StripeStyle.ts#getHeader`'s own fallthrough,
 * verified directly against that file) — so the header-atom step
 * (`if (this.header != null) this.atoms.add(this.header);`) never fires for
 * a tree cell and is not built here. `manageCellAlignment`/`CharHidder.hide`
 * (upstream's `analyzeAndAdd` calls both before dispatch) are the SAME
 * already-accepted gap `StripeTable.ts`'s own doc comment documents (no
 * `<left>`/`<center>`/`<right>` markup or hidden-newline-sentinel handling
 * reaches a tree cell in this port) — not a new omission.
 *
 * `this.atomOps` (an extra, LAST-positioned constructor parameter, ADR-9's
 * established `SheetBlock1.ts`/`StripeTable.ts` precedent) threads through
 * to `StripeTable.asAtom`, which wraps each cell's one-line `Sheet` in a
 * `SheetBlock1`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeTree.java
 */
import type { FontConfiguration } from '../../shape/UText.js';
import type { ISkinSimple } from '../../../style/ISkinSimple.js';
import { AtomTree } from '../atom/AtomTree.js';
import { AtomWithMargin } from '../atom/AtomWithMargin.js';
import { StripeStyle } from '../StripeStyle.js';
import { StripeStyleType } from '../StripeStyleType.js';
import type { Atom } from '../SheetBlock1.js';
import type { Paint } from '../../../paint.js';
import type { Stripe } from '../Stripe.js';
import type { AtomOps } from '../Sea.js';
import { StripeTable } from './StripeTable.js';
import { buildStripeAtoms } from './StripeSimple.js';
import { ClockwiseTopRightBottomLeft } from '../../geom/ClockwiseTopRightBottomLeft.js';

/** Upstream `HColors.none()` stand-in for a resolved-`Paint` "no color"
 *  sentinel — see this file's own module doc comment. */
const NONE_PAINT: Paint = 'none';

/** Upstream: `s.replaceFirst("^\\s*\\|_", "")` (java:84) — strips ONE
 *  leading `|_` tree marker (with any preceding whitespace); `^` anchors to
 *  the start, so there is at most one match regardless of engine, matching
 *  Java's `replaceFirst` semantics exactly for this pattern. */
const TREE_MARKER_PATTERN = /^\s*\|_/;

/**
 * `StripeTree#computeLevel` (`@JawsStrange` upstream — the annotation
 * marks a method whose shape looks unusual but is intentional, java:93):
 * counts leading 2-space groups OR tab characters at the start of `s`,
 * starting at level 1 — mixed indentation (some 2-space groups, some
 * tabs) all count, stopping at the first character that is neither.
 *
 * Exported as a standalone pure function (upstream: a private instance
 * method with no field access — a pure string transform) so it is
 * independently testable even though the CLASS itself cannot be
 * constructed today (see this file's own module doc comment).
 * `src/diagrams/class/class-body-enhanced.ts#computeTreeLevel` already
 * re-derived this SAME algorithm independently and jar-verified it (G2
 * N42) — see this task's own report for the side-by-side formula check.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeTree.java#computeLevel
 */
export function computeLevel(s: string): number {
  let result = 1;
  let rest = s;
  for (;;) {
    if (rest.startsWith('  ')) {
      result++;
      rest = rest.slice(2);
      continue;
    }
    if (rest.startsWith('\t')) {
      result++;
      rest = rest.slice(1);
      continue;
    }
    return result;
  }
}

export class StripeTree implements Stripe<Atom> {
  private readonly fontConfiguration: FontConfiguration;
  private readonly skinParam: ISkinSimple;
  private readonly tree: AtomTree;
  private readonly marged: Atom;
  private readonly atomOps: AtomOps;
  private readonly stripeStyle = new StripeStyle(StripeStyleType.TREE, 0, '\0');

  constructor(fontConfiguration: FontConfiguration, skinParam: ISkinSimple, line: string, atomOps: AtomOps) {
    this.fontConfiguration = fontConfiguration;
    this.skinParam = skinParam;
    this.atomOps = atomOps;
    this.tree = new AtomTree(fontConfiguration.color === null ? NONE_PAINT : fontConfiguration.color);
    this.marged = new AtomWithMargin(this.tree, 2, 2);
    this.analyzeAndAdd(line);
  }

  getAtoms(): readonly Atom[] {
    return [this.marged];
  }

  getLHeader(): Atom | null {
    return null;
  }

  /** java:80-90. See the module doc comment's own "`analyzeAndAdd`"
   *  section for the per-cell build's exact mapping onto this port's
   *  data-oriented `buildStripeAtoms` pipeline. `this.skinParam` is stored
   *  (matching upstream's field) but not read here — upstream's own
   *  `StripeSimple.analyzeAndAdd` only reaches it via image/sprite creole
   *  commands, which this port's `buildStripeAtoms` does not yet thread a
   *  skin-param-resolving path for (a pre-existing gap, not new here — see
   *  `legacy/StripeSimple.ts`'s own doc comment). */
  analyzeAndAdd(line: string): void {
    void this.skinParam;
    void this.stripeStyle;
    const lines = StripeTable.getWithNewlinesInternal(line);
    for (const s of lines) {
      const text = s.replace(TREE_MARKER_PATTERN, '');
      const level = computeLevel(s);
      const atoms = buildStripeAtoms(text, this.fontConfiguration);
      const cell: Stripe = { getLHeader: () => null, getAtoms: () => atoms };
      this.tree.addCell(StripeTable.asAtom([cell], ClockwiseTopRightBottomLeft.none(), this.atomOps), level);
    }
  }
}
