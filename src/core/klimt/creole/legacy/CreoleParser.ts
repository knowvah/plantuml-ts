/**
 * CreoleParser — the ONLY upstream implementor of `SheetBuilder`: turns a
 * `Display` into a `Sheet` of `Stripe`s, one physical display line at a
 * time, dispatching each line to a table/tree/code/latex/plain-text
 * classifier.
 *
 * Upstream: klimt/creole/legacy/CreoleParser.java (196 lines). Ported:
 * the constructor (with its `Objects.requireNonNull(skinParam)` guard),
 * `isTableLine`/`doesStartByColor` (public static, both regex patterns),
 * `createSheet`'s `Map<Display, Sheet>` memoization, `createSheetSlow`'s
 * full per-line dispatch (embedded-diagram detection, `Stereotype`
 * expansion, guillemet substitution), and `createStripes`'s full
 * table/tree/code/latex/plain-text dispatch AND (batch-3a/T10g) the three
 * `lastStripe instanceof StripeRaw/StripeTable/StripeTree` continuation
 * checks (java:81-98).
 *
 * `checkColor(Display)` (java:187-195) is NOT ported: it is commented out
 * IN THE JAVA ITSELF (`// public static void checkColor(...) {...}`) —
 * dead code upstream, not merely unreached (same precedent as T8's
 * `Position#drawDebug`, `.agent-notes/T8-sheetblocks.md`).
 *
 * ## T10g: every `blockedOnSibling` seam removed — all six branches now
 * dispatch to a real, constructed sibling
 *
 * T9a (batch-3a) left `createStripes`'s table/tree/code/latex branches,
 * the plain-text path's `HORIZONTAL_LINE` classification, and
 * `createSheetSlow`'s embedded-diagram branch as six labelled, cited,
 * THROWING seams (`.agent-notes/T9a-creoleparser.md`) because each named
 * sibling class (`StripeTable.java`/`StripeTree.java`/`StripeCode.java`/
 * `StripeLatex.java`/`CreoleHorizontalLine.java`/`EmbeddedDiagram.java`)
 * was, at that time, unported. T10a-T10f landed every one of them; this
 * task (T10g) is the consolidation that removes all six throws and
 * reinstates the three continuation checks java:81-98 omitted for the
 * identical reason (`.agent-notes/T9a-creoleparser.md`'s own note: "reach
 * them faithfully in the same change that replaces the seam throws").
 *
 * `getEmbeddedType` is imported from `EmbeddedDiagram.ts` rather than
 * declared locally — T9a's own copy was a stand-in for that file not
 * existing yet (T10f's own doc comment, "On `getEmbeddedType` and T9a").
 *
 * ## `atomOps`/`renderer`: two extra, LAST-positioned constructor
 * parameters (ADR-9's established `SheetBlock1.ts`/`StripeTable.ts`
 * precedent)
 *
 * `atomOps: AtomOps` is required to construct a `StripeTable`/`StripeTree`
 * (each threads it into `SheetBlock1`, T8's own adaptation). `renderer:
 * NestedDiagramRenderer` is required to construct an `EmbeddedDiagram`
 * (`EmbeddedDiagram.ts`'s own callback seam, T10f) — wiring it through here
 * is the "wire it through `createSheetSlow`'s embedded branch" instruction
 * this task's brief poses; nothing above `src/core/klimt/` is imported to
 * do so (a caller supplies both, exactly as `EmbeddedDiagram.ts`'s own doc
 * comment describes). Neither parameter has a real production caller yet
 * (ADR-8: `Display`/T9c has not landed, so nothing constructs a
 * `CreoleParser` in a live diagram path today) — both are exercised here
 * only via test doubles, matching every other seam this batch threads
 * ahead of its first live caller.
 *
 * The constructor groups `creoleMode`/`stereotype` into {@link
 * CreoleTextStyle} and `atomOps`/`renderer` into {@link
 * CreoleParserAdapters} (5 total parameters, this project's parameter-count
 * ceiling) rather than 7 flat positional arguments — a shape-only change
 * (every upstream value is still threaded through unchanged); every real
 * caller here is a test double, so no production call site is affected.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/CreoleParser.java
 */
import { Sheet } from '../Sheet.js';
import type { Stripe, StripeAtom } from '../Stripe.js';
import { CreoleContext } from '../CreoleContext.js';
import type { CreoleMode } from '../CreoleMode.js';
import type { SheetBuilder, DisplayLike, DisplayLine } from '../SheetBuilder.js';
import { isNullDisplay } from '../SheetBuilder.js';
import type { FontConfiguration } from '../../shape/UText.js';
import type { HorizontalAlignment } from '../../geom/HorizontalAlignment.js';
import type { ISkinSimple } from '../../../style/ISkinSimple.js';
import { manageGuillemet } from '../../../text/Guillemet.js';
import { buildLineAtoms } from './StripeSimple.js';
import type { CreoleAtom } from '../atom/Atom.js';
import { isTreeStart, isCodeStart, isLatexStart, MONOSPACED } from '../Parser.js';
import type { AtomOps } from '../Sea.js';
import { StripeTable } from './StripeTable.js';
import { StripeTree } from './StripeTree.js';
import { StripeCode } from './StripeCode.js';
import { StripeLatex } from './StripeLatex.js';
import type { StripeRaw } from './StripeRaw.js';
import { CreoleHorizontalLine } from '../CreoleHorizontalLine.js';
import { EmbeddedDiagram, getEmbeddedType, type NestedDiagramRenderer } from '../../../EmbeddedDiagram.js';

/** `StringUtils.trim2(CharSequence)` (java: `StringUtils.java:534-565`) —
 *  trims characters `<= ' '` (0x20) from both ends. Duplicated here rather
 *  than imported from `EmbeddedDiagram.ts` (that file's own copy is
 *  module-private) — the SAME "small utility, cite it" precedent
 *  `EmbeddedDiagram.ts`'s own doc comment already applies to
 *  `getEmbeddedType`'s pre-T10g duplication. Used ONLY by the
 *  `StripeTree` CONTINUATION check below (java:88), which trims before
 *  testing `isTreeStart` — the "new StripeTree" branch further down does
 *  NOT trim, a deliberate upstream asymmetry preserved verbatim. */
function trim2(s: string): string {
  const len = s.length;
  if (len === 0) return '';
  let start = 0;
  let end = len - 1;
  while (start <= end) {
    if (s.charCodeAt(start) <= 0x20) {
      start++;
      continue;
    }
    if (s.charCodeAt(end) <= 0x20) {
      end--;
      continue;
    }
    break;
  }
  if (start > end) return '';
  return s.slice(start, end + 1);
}

/** `Iterator<DisplayLine>` -> `Iterator<string>` adapter —
 *  `EmbeddedDiagram.createAndSkip` needs the latter (upstream:
 *  `Iterator<CharSequence>`); a `DisplayLine` that is not already a
 *  `string` is coerced via `String(...)`, mirroring
 *  `processDisplayLine`'s own identical coercion for the SAME
 *  `getEmbeddedType` check one level up. */
function toStringIterator(it: Iterator<DisplayLine>): Iterator<string> {
  return {
    next(): IteratorResult<string> {
      const step = it.next();
      if (step.done === true) return { done: true, value: undefined };
      return { done: false, value: typeof step.value === 'string' ? step.value : String(step.value) };
    },
  };
}

/** `CreoleParser`'s own `Stripe` implementation for the plain-text
 *  (NORMAL/HEADING/LITERAL/HORIZONTAL_LINE) path — upstream's
 *  `StripeSimple` (a full class, `legacy/StripeSimple.java`) reduced to
 *  the two `Stripe` members this port's `legacy/StripeSimple.ts
 *  #buildLineAtoms` pipeline already computes. `cellAlignment` is carried
 *  so a FOLLOWING line's `align` lookup (java:110-112: `lastStripe
 *  instanceof StripeSimple ? ((StripeSimple) lastStripe)
 *  .getCellAlignment() : this.horizontalAlignment`) can read it back —
 *  see `isSimpleStripe`/`createStripes` below. A `HORIZONTAL_LINE`-
 *  classified line ALSO becomes one of these (matching upstream: the SAME
 *  `StripeSimple` instance handles every classification, HORIZONTAL_LINE
 *  included — java:154-155 just `atoms.add(...)`s the `CreoleHorizontalLine`
 *  atom into it) — generic over its atom type so the SAME shape serves
 *  both the flat-text case (`A = CreoleAtom`) and the horizontal-line case
 *  (`A = Atom`, a singleton `[CreoleHorizontalLine]`). */
interface TaggedSimpleStripe<A extends StripeAtom = CreoleAtom> extends Stripe<A> {
  readonly stripeKind: 'simple';
  readonly cellAlignment: HorizontalAlignment;
}

function isSimpleStripe(stripe: Stripe<StripeAtom> | null): stripe is TaggedSimpleStripe<StripeAtom> {
  return stripe !== null && (stripe as { stripeKind?: unknown }).stripeKind === 'simple';
}

/** Upstream: `lastStripe instanceof StripeRaw` (java:81). TS interfaces
 *  have no runtime representation to `instanceof` against — `StripeRaw`'s
 *  own doc comment documents this as the intended duck-type check, keyed
 *  on the two members no other `Stripe` producer in this port declares. */
function isStripeRaw(stripe: Stripe<StripeAtom> | null): stripe is StripeRaw {
  return stripe !== null && 'addAndCheckTermination' in stripe && 'isTerminated' in stripe;
}

/** `StripeStyle#getHeader(fontConfiguration, context)` — the bullet-list
 *  (`LIST_WITHOUT_NUMBER`/`LIST_WITH_NUMBER`) header-glyph atom. Always
 *  `null` here: bullet lists are out of L1 scope everywhere else in this
 *  port's creole layer (`Stripe.ts`'s own doc comment, `StripeStyleType.ts`)
 *  — `context` is threaded through (matching the upstream call's own
 *  signature) for the same reason `CreoleContext.ts` itself was ported
 *  ahead of its first caller: a small, self-contained value class this
 *  future bullet-list work will need, wired to its real call site now. */
function bulletHeader(_context: CreoleContext): null {
  return null;
}

function createSimpleStripe<A extends StripeAtom>(
  atoms: readonly A[],
  cellAlignment: HorizontalAlignment,
  context: CreoleContext,
): TaggedSimpleStripe<A> {
  return {
    stripeKind: 'simple',
    cellAlignment,
    getLHeader: () => bulletHeader(context),
    getAtoms: () => atoms,
  };
}

/** Upstream positional params 4-5 (`creoleMode`, `stereotype`), grouped so
 *  the constructor stays at this project's 5-parameter ceiling — see the
 *  module doc comment's own note on this shape-only grouping. */
export interface CreoleTextStyle {
  readonly creoleMode: CreoleMode;
  readonly stereotype: FontConfiguration;
}

/** The two ADR-9 injected dependencies (neither has an upstream
 *  positional-parameter counterpart), grouped for the identical reason. */
export interface CreoleParserAdapters {
  readonly atomOps: AtomOps;
  readonly renderer: NestedDiagramRenderer;
}

/** One physical display line's dispatch context — bundles the loop-stable
 *  values `processDisplayLine`/`processEmbedded` need (`sheet`/`context`/
 *  `it` accumulate across the WHOLE `createSheetSlow` call; `showStereotype`/
 *  `checkColor` are per-call flags) so neither function's own parameter
 *  count grows with `createSheetSlow`'s loop state. Built once per
 *  `createSheetSlow` call, not per line. */
interface LineDispatchContext {
  readonly sheet: Sheet<StripeAtom>;
  readonly context: CreoleContext;
  readonly it: Iterator<DisplayLine>;
  readonly showStereotype: boolean;
  readonly checkColor: boolean;
}

export class CreoleParser implements SheetBuilder {
  private static readonly TABLE_LINE_PATTERN = /^(<#\w+(?:,#?\w+)?>)?\|(=)?.*\|$/;
  private static readonly STARTS_BY_COLOR_PATTERN = /^=?\s*(<#\w+(?:,#?\w+)?>).*/;

  /** java:121-123. */
  static isTableLine(line: string): boolean {
    return CreoleParser.TABLE_LINE_PATTERN.test(line);
  }

  /** java:125-127. */
  static doesStartByColor(line: string): boolean {
    return CreoleParser.STARTS_BY_COLOR_PATTERN.test(line);
  }

  private readonly fontConfiguration: FontConfiguration;
  private readonly skinParam: ISkinSimple;
  private readonly horizontalAlignment: HorizontalAlignment;
  private readonly creoleMode: CreoleMode;
  /** java's own field, also named `stereotype` (a `FontConfiguration`, NOT
   *  the `Stereotype` class) — the font used for stereotype-label lines. */
  private readonly stereotype: FontConfiguration;
  private readonly atomOps: AtomOps;
  private readonly renderer: NestedDiagramRenderer;
  private readonly cache = new Map<string, Sheet<StripeAtom>>();

  constructor(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    skinParam: ISkinSimple,
    textStyle: CreoleTextStyle,
    adapters: CreoleParserAdapters,
  ) {
    // java:75 -- Objects.requireNonNull(skinParam).
    if (skinParam == null) {
      throw new Error('CreoleParser: skinParam must not be null or undefined');
    }
    this.stereotype = textStyle.stereotype;
    this.creoleMode = textStyle.creoleMode;
    this.fontConfiguration = fontConfiguration;
    this.skinParam = skinParam;
    this.horizontalAlignment = horizontalAlignment;
    this.atomOps = adapters.atomOps;
    this.renderer = adapters.renderer;
  }

  /** java:131-140. Memoized on `display.cacheKey()` -- see
   *  `SheetBuilder.ts`'s doc comment for why this is a value-equality key,
   *  not object identity, matching upstream's `Display#hashCode`/`#equals`
   *  override. `Jaws.TRACE` debug printing (`false` by default upstream,
   *  so already dead in a normal build) is not ported. */
  createSheet(display: DisplayLike): Sheet<StripeAtom> {
    const key = display.cacheKey();
    let result = this.cache.get(key);
    if (result === undefined) {
      result = this.createSheetSlow(display, false);
      this.cache.set(key, result);
    }
    return result;
  }

  /** java:142-185. Manual iterator (not `for...of`) so `processEmbedded`
   *  can advance PAST an embedded block's lines via
   *  `EmbeddedDiagram.createAndSkip` before this loop resumes -- exactly
   *  upstream's own `while (it.hasNext())` + `it.next()` structure, which
   *  hands the SAME iterator to `EmbeddedDiagram.createAndSkip`. */
  private createSheetSlow(display: DisplayLike, checkColor: boolean): Sheet<StripeAtom> {
    const sheet = new Sheet<StripeAtom>(this.horizontalAlignment);
    if (!isNullDisplay(display)) {
      const it = display[Symbol.iterator]();
      const ctx: LineDispatchContext = {
        sheet,
        context: new CreoleContext(),
        it,
        showStereotype: display.showStereotype,
        checkColor,
      };
      let step = it.next();
      while (step.done !== true) {
        this.processDisplayLine(step.value, ctx);
        step = it.next();
      }
    }
    return sheet;
  }

  /** The body of `createSheetSlow`'s `while (it.hasNext())` loop
   *  (java:147-182). */
  private processDisplayLine(cs: DisplayLine, ctx: LineDispatchContext): void {
    const { sheet, context } = ctx;
    const type = getEmbeddedType(typeof cs === 'string' ? cs : String(cs));
    if (type !== null) {
      this.processEmbedded(type, ctx);
      return;
    }
    if (typeof cs !== 'string') {
      // java:168-173 -- `cs instanceof Stereotype`.
      if (!ctx.showStereotype) return;
      for (const label of cs.getLabels(this.skinParam.guillemet())) {
        const built = this.createStripes(label, context, sheet.getLastStripe(), this.stereotype);
        if (built !== null) sheet.add(built);
      }
      return;
    }
    const stripes = this.createStripes(
      manageGuillemet(cs, this.skinParam.guillemet()),
      context,
      sheet.getLastStripe(),
      this.fontConfiguration,
    );
    if (stripes !== null) sheet.add(stripes);
  }

  /** java:153-167's `type != null` branch. `createAndSkip` is called
   *  UNCONDITIONALLY (it must consume the embedded block's lines from `it`
   *  regardless of `checkColor`, matching upstream exactly); only the
   *  STRIPE construction is skipped when `checkColor` is set. `checkColor`
   *  is only ever `true` from the commented-out (dead upstream)
   *  `checkColor()` static method — see the module doc comment — so that
   *  branch is unreachable from any real caller today; kept for signature
   *  fidelity. */
  private processEmbedded(type: string, ctx: LineDispatchContext): void {
    const embeddedDiagram = EmbeddedDiagram.createAndSkip(
      type,
      toStringIterator(ctx.it),
      this.skinParam,
      this.renderer,
    );
    if (ctx.checkColor) return;
    ctx.sheet.add({ getLHeader: () => null, getAtoms: () => [embeddedDiagram] });
  }

  /** java:79-115, in full (batch-3a/T10g): the three `lastStripe
   *  instanceof StripeRaw/StripeTable/StripeTree` CONTINUATION checks
   *  (java:81-98) plus the table/tree/code/latex/horizontal-line
   *  dispatch, every branch now constructing a real sibling. */
  private createStripes(
    line: string,
    context: CreoleContext,
    lastStripeIn: Stripe<StripeAtom> | null,
    fontConfiguration: FontConfiguration,
  ): readonly Stripe<StripeAtom>[] | null {
    let lastStripe = lastStripeIn;

    // java:81-89.
    if (isStripeRaw(lastStripe)) {
      if (lastStripe.isTerminated()) {
        lastStripe = null;
      } else {
        lastStripe.addAndCheckTermination(line);
        return null;
      }
    }

    // java:91-107.
    if (lastStripe instanceof StripeTable && CreoleParser.isTableLine(line)) {
      lastStripe.analyzeAndAddLine(line);
      return null;
    } else if (lastStripe instanceof StripeTree && isTreeStart(trim2(line))) {
      lastStripe.analyzeAndAdd(line);
      return null;
    } else if (CreoleParser.isTableLine(line)) {
      return [new StripeTable(fontConfiguration, this.skinParam, line, this.atomOps)];
    } else if (isTreeStart(line)) {
      return [new StripeTree(fontConfiguration, this.skinParam, line, this.atomOps)];
    } else if (isCodeStart(line)) {
      return [new StripeCode({ ...fontConfiguration, family: MONOSPACED })];
    } else if (isLatexStart(line)) {
      return [new StripeLatex(fontConfiguration)];
    }

    // java:108-114.
    const align = isSimpleStripe(lastStripe) ? lastStripe.cellAlignment : this.horizontalAlignment;
    const build = buildLineAtoms(line, fontConfiguration);
    if (build.classification.type === 'HORIZONTAL_LINE') {
      const atom = CreoleHorizontalLine.create(fontConfiguration, '', build.classification.style, this.skinParam, this.atomOps);
      return [createSimpleStripe([atom], align, context)];
    }
    return [createSimpleStripe(build.atoms, align, context)];
  }
}
