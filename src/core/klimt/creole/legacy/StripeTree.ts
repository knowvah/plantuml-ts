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
 * fallthrough), and `computeLevel` (exported standalone, see below).
 *
 * ## `getAtoms()` return type: this port's OOP `Atom`, NOT `Stripe.ts`'s
 * `CreoleAtom` — `implements Stripe` is deliberately NOT declared today
 *
 * Upstream's real `klimt/creole/Stripe.java` interface is `List<Atom>
 * getAtoms()` where `Atom` is the general OOP interface (any concrete
 * `AtomText`/`AtomImg`/`AtomTable`/`AtomTree`/...). This port's
 * `../Stripe.ts` instead declares `getAtoms(): readonly CreoleAtom[]` — a
 * narrowing that is faithful ONLY for `StripeSimple` (`legacy/
 * StripeSimple.ts`'s `buildLineAtoms`), whose real atoms genuinely are a
 * flat run of `CreoleAtom`-shaped text/inline/latex tokens. `StripeTree`'s
 * real upstream return value — `Collections.singletonList(marged)`, a
 * SINGLE nested `AtomWithMargin<AtomTree>` — has no representation in the
 * `CreoleAtom` data union (it is a measured/drawn sub-block, not text), so
 * this class cannot honestly satisfy `../Stripe.ts`'s current signature.
 * `T9a` already found the identical shape for `StripeTable`
 * (`.agent-notes/T9a-creoleparser.md`: "several (`StripeTable`,
 * `EmbeddedDiagram`) pulling in the OOP `Atom`/`AtomTable`/`HColor`
 * machinery `atom/Atom.ts`'s own doc comment documents as deliberately
 * NOT re-ported") but that finding stopped at "seam the whole branch,
 * never construct anything" — this file is the first to actually WRITE a
 * `getAtoms()` body and hit the type mismatch concretely. `../Stripe.ts`
 * is shared, cross-cutting infrastructure (also needed, identically, by
 * T10b's concurrent `StripeTable`) and outside this task's write-set —
 * widening it is flagged here for T10g (the task that reinstates every
 * `lastStripe instanceof Stripe*` seam together) rather than patched
 * unilaterally. `getAtoms()` below is typed against the REAL upstream
 * contract (`readonly Atom[]`, `Atom` from `../SheetBlock1.js`) so the
 * gap is visible at the type level, not silently cast away.
 *
 * ## `HColor` -> `Paint` (established T2 substitution — see `AtomTree.ts`'s
 * identical note): `fontConfiguration.getColor()` (java:66, an `HColor`)
 * becomes `fontConfiguration.color` (`string | null`, `UText.ts`'s own
 * `FontConfiguration`); `null` maps to the port-wide `NONE_PAINT = 'none'`
 * sentinel (`Cluster.ts`/`AbstractCommonUGraphic.ts`'s established local
 * constant, redeclared here per this port's per-file convention — neither
 * file exports it) before reaching `AtomTree`'s `Paint`-typed constructor.
 *
 * ## `analyzeAndAdd` — blocked on the CONCURRENT sibling `StripeTable`, not
 * an unported dependency (ADR-8 corollary does not forbid this)
 *
 * `analyzeAndAdd`'s very first statement (java:80,
 * `StripeTable.getWithNewlinesInternal(line)`) and its per-line atom build
 * (java:87-88, `StripeTable.asAtom(...)`) both call STATIC helpers on
 * `StripeTable` — batch-3a/T10b's own write-set, running CONCURRENTLY with
 * this task in the same batch (not "not ported yet" in the ADR-8
 * corollary's forbidden sense: it is being ported, by a named sibling,
 * right now). Since the very first line blocks every subsequent line,
 * there is no faithful partial execution to perform before the throw
 * (contrast `StripeStyle.ts#getHeader`'s `LIST_WITH_NUMBER` branch, whose
 * counter side effect is independently reachable and IS executed before
 * ITS seam throw) — the entire method body throws immediately, mirroring
 * `CreoleHorizontalLine.ts#getTitle()`'s non-empty-line branch. The
 * constructor calls `analyzeAndAdd` unconditionally (java:68, no branch),
 * so EVERY construction attempt throws — `getAtoms`/`getLHeader` are
 * therefore unreachable BY CONSTRUCTION today (no completed `StripeTree`
 * instance can ever exist), the identical shape T10a's
 * `CreoleHorizontalLine.ts#getHorizontalLine()` already documents in-line
 * rather than forcing artificial coverage. `CreoleParser.ts`'s own "a tree
 * line" seam already throws before ever reaching this constructor, so
 * this is a build/test-time signal only, not a runtime one in any shipped
 * path.
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

/** Upstream `HColors.none()` stand-in for a resolved-`Paint` "no color"
 *  sentinel — see this file's own module doc comment. */
const NONE_PAINT: Paint = 'none';

/** One labelled, cited "blocked on the concurrent-sibling `StripeTable`"
 *  seam — thrown, never silently dropped or stubbed to wrong output
 *  (ADR-8 corollary). Mirrors `CreoleParser.ts`'s own `blockedOnSibling`/
 *  `StripeStyle.ts`'s own `blockedOnAtomLayer` shape (no shared helper is
 *  exported anywhere in this batch — each file declares its own).
 *  `javaPath` is relative to `net/sourceforge/plantuml/` in
 *  `~/git/plantuml`. */
function blockedOnStripeTable(what: string, javaPath: string, javaLines: number): Error {
  return new Error(
    `StripeTree: ${what} needs ${javaPath} (${javaLines} lines) -- its ` +
      `"getWithNewlinesInternal" and "asAtom" static helpers are batch-3a/` +
      `T10b's own write-set, running CONCURRENTLY with this file (T10c) in ` +
      `the same batch, not landed at the time this file was written (see ` +
      `.agent-notes/T10c-tree.md). Nothing in this port calls StripeTree ` +
      `yet -- CreoleParser.ts's own "a tree line" seam throws before ever ` +
      `constructing one -- so reaching this is a build/test-time signal only.`,
  );
}

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

export class StripeTree {
  private readonly fontConfiguration: FontConfiguration;
  private readonly skinParam: ISkinSimple;
  private readonly tree: AtomTree;
  private readonly marged: Atom;
  private readonly stripeStyle = new StripeStyle(StripeStyleType.TREE, 0, '\0');

  constructor(fontConfiguration: FontConfiguration, skinParam: ISkinSimple, line: string) {
    this.fontConfiguration = fontConfiguration;
    this.skinParam = skinParam;
    this.tree = new AtomTree(fontConfiguration.color === null ? NONE_PAINT : fontConfiguration.color);
    this.marged = new AtomWithMargin(this.tree, 2, 2);
    this.analyzeAndAdd(line);
  }

  /** Upstream's real return type (`List<Atom>`) — see this file's own
   *  module doc comment for why `../Stripe.ts`'s `CreoleAtom[]`-shaped
   *  `getAtoms()` is not implemented against here. Unreachable by
   *  construction today (see module doc comment). */
  getAtoms(): readonly Atom[] {
    return [this.marged];
  }

  /** Unreachable by construction today (see module doc comment). */
  getLHeader(): Atom | null {
    return null;
  }

  analyzeAndAdd(_line: string): void {
    // this.fontConfiguration / this.skinParam / this.stripeStyle are all
    // consumed by the real per-line StripeSimple-cell construction this
    // seam blocks -- referenced here so TS doesn't (rightly) flag them as
    // write-only until the seam is lifted (T10g).
    void this.fontConfiguration;
    void this.skinParam;
    void this.stripeStyle;
    throw blockedOnStripeTable(
      'the per-line tree cell construction ("analyzeAndAdd")',
      'klimt/creole/legacy/StripeTable.java',
      219,
    );
  }
}
