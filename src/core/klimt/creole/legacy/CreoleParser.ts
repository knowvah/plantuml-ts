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
 * expansion, guillemet substitution), and `createStripes`'s
 * table/tree/code/latex/plain-text dispatch structure.
 *
 * `checkColor(Display)` (java:187-195) is NOT ported: it is commented out
 * IN THE JAVA ITSELF (`// public static void checkColor(...) {...}`) —
 * dead code upstream, not merely unreached (same precedent as T8's
 * `Position#drawDebug`, `.agent-notes/T8-sheetblocks.md`).
 *
 * ## Genuinely large, separable, NOT silently dropped (ADR-8 corollary)
 *
 * `createStripes`'s table/tree/code/latex branches, and
 * `createSheetSlow`'s embedded-diagram branch, each need an unported
 * sibling class this task's write-set does not include:
 * `StripeTable.java` (219), `StripeTree.java` (111), `StripeCode.java`
 * (124), `StripeLatex.java` (118), `StripeRaw.java` (47),
 * `EmbeddedDiagram.createAndSkip` (part of a 368-line class), and
 * `CreoleHorizontalLine.java` (112, needed by the plain-text path's
 * `HORIZONTAL_LINE` classification). Combined ~1,100+ lines, several
 * pulling in the OOP `Atom`/`AtomTable`/`HColor` machinery this port's
 * `atom/Atom.ts` deliberately replaced with a data-only `CreoleAtom`
 * union for its OWN reachable scope (see that file's doc comment) — i.e.
 * genuinely separate architecture, not a small sibling. Per the mission's
 * ADR-8 corollary ("not ported yet" is never "unreachable" — port it or
 * STOP and report), these are each a labelled, cited, THROWING seam below
 * (never a silent drop, never a silent wrong-output stub) — reported in
 * full in `.agent-notes/T9a-creoleparser.md` as a follow-on task. Nothing
 * calls `CreoleParser` yet (batch-3a is a pure addition, ADR-8), so every
 * seam is a build-time/test-time signal today, not a runtime one in any
 * shipped path.
 *
 * The three `lastStripe instanceof StripeRaw/StripeTable/StripeTree`
 * CONTINUATION checks (java:81-98, extending an already-open block onto a
 * following line) are omitted entirely rather than seamed: reaching them
 * requires a `lastStripe` that is ITSELF a `StripeTable`/`StripeTree`/
 * `StripeRaw`, and the only place that could ever construct one — this
 * same method — throws instead. They are therefore unreachable BY
 * CONSTRUCTION of this file, not by omission of upstream behavior.
 * Reinstate them faithfully in the same change that replaces the seam
 * throws below with real constructors.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/CreoleParser.java
 */
import { Sheet } from '../Sheet.js';
import type { Stripe } from '../Stripe.js';
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
import { isTreeStart, isCodeStart, isLatexStart } from '../Parser.js';

/**
 * `EmbeddedDiagram.getEmbeddedType`'s (java:284-354) first-char dispatch
 * table, ported verbatim as a lookup instead of a `switch` — same
 * semantics, avoids re-scanning every keyword for a non-matching first
 * character.
 */
const EMBEDDED_TYPE_KEYWORDS: ReadonlyMap<string, readonly string[]> = new Map([
  ['b', ['board']],
  ['c', ['creole', 'chronology', 'chen', 'chart']],
  ['d', ['ditaa']],
  ['e', ['ebnf']],
  ['f', ['files']],
  ['g', ['gantt']],
  ['j', ['json']],
  ['m', ['mindmap']],
  ['n', ['nwdiag']],
  ['p', ['packetdiag']],
  ['r', ['regex']],
  ['s', ['salt']],
  ['u', ['uml']],
  ['w', ['wbs', 'wire']],
  ['y', ['yaml']],
]);

/** Approximates `Character.isWhitespace(char)` (java's own bound for the
 *  leading/trailing trim in `getEmbeddedType`) for this port's realistic
 *  inputs: ASCII space/tab/CR/LF/form-feed/vertical-tab plus Unicode space
 *  separators, EXCLUDING the three non-breaking variants Java's method
 *  also excludes (U+00A0, U+2007, U+202F). */
function isJavaWhitespace(ch: string): boolean {
  if (ch === ' ' || ch === ' ' || ch === ' ') return false;
  return /[\s-]/.test(ch) || /\p{Zs}|\p{Zl}|\p{Zp}/u.test(ch);
}

function matchEmbedded(cs: string, from: number, end: number, key: string): boolean {
  if (end - from !== key.length) return false;
  return cs.slice(from, end) === key;
}

/** Advances `p` past any leading `isJavaWhitespace` run — the first half
 *  of `getEmbeddedType`'s own leading-whitespace skip (java:263-266). */
function skipLeadingWhitespace(cs: string, len: number): number {
  let p = 0;
  while (p < len && isJavaWhitespace(cs.charAt(p))) p++;
  return p;
}

/** Retreats `end` past any trailing `isJavaWhitespace` run — the second
 *  half of `getEmbeddedType`'s own trailing-whitespace skip (java:274-276). */
function skipTrailingWhitespace(cs: string, from: number, len: number): number {
  let end = len;
  while (end > from && isJavaWhitespace(cs.charAt(end - 1))) end--;
  return end;
}

function matchEmbeddedKeyword(cs: string, from: number, end: number): string | null {
  const candidates = EMBEDDED_TYPE_KEYWORDS.get(cs.charAt(from));
  if (candidates === undefined) return null;
  for (const key of candidates) {
    if (matchEmbedded(cs, from, end, key)) return key;
  }
  return null;
}

/**
 * `EmbeddedDiagram#getEmbeddedType(CharSequence)` (java:257-366) — a pure,
 * self-contained text scan (no other class dependency), ported in full so
 * `createSheetSlow`'s "is this line an embedded-diagram start?" dispatch
 * is faithful. `EmbeddedDiagram.createAndSkip` (the actual sub-diagram
 * CONSTRUCTION) is NOT ported — see `createSheetSlow`'s throw below.
 */
function getEmbeddedType(cs: string): string | null {
  const len = cs.length;
  const start = skipLeadingWhitespace(cs, len);
  if (start + 2 > len || cs.charAt(start) !== '{' || cs.charAt(start + 1) !== '{') return null;
  const p = start + 2;
  const end = skipTrailingWhitespace(cs, p, len);
  if (end - p === 0) return 'uml';
  return matchEmbeddedKeyword(cs, p, end);
}

/** One labelled, cited "blocked on an unported sibling class" seam —
 *  thrown, never silently dropped or stubbed to wrong output (ADR-8
 *  corollary). `javaPath` is relative to
 *  `net/sourceforge/plantuml/` in `~/git/plantuml`. */
function blockedOnSibling(what: string, javaPath: string, javaLines: number): Error {
  return new Error(
    `CreoleParser: ${what} is not yet supported inside the real creole Sheet/Stripe ` +
      `layer -- ${javaPath} (${javaLines} lines) is unported (batch-3a/T9a, ADR-8 ` +
      `corollary: flagged as a genuinely large, separable follow-on, not silently ` +
      `dropped or stubbed -- see .agent-notes/T9a-creoleparser.md). Nothing in this ` +
      `port calls CreoleParser yet, so reaching this is a build/test-time signal.`,
  );
}

/** `CreoleParser`'s own `Stripe` implementation for the plain-text
 *  (NORMAL/HEADING/LITERAL) path — upstream's `StripeSimple` (a full
 *  class, `legacy/StripeSimple.java`) reduced to the two `Stripe` members
 *  this port's `legacy/StripeSimple.ts#buildLineAtoms` pipeline already
 *  computes. `cellAlignment` is carried so a FOLLOWING line's `align`
 *  lookup (java:110-112: `lastStripe instanceof StripeSimple ?
 *  ((StripeSimple) lastStripe).getCellAlignment() : this.horizontalAlignment`)
 *  can read it back — see `isSimpleStripe`/`createStripes` below. */
interface TaggedSimpleStripe extends Stripe {
  readonly stripeKind: 'simple';
  readonly cellAlignment: HorizontalAlignment;
}

function isSimpleStripe(stripe: Stripe | null): stripe is TaggedSimpleStripe {
  return stripe !== null && (stripe as { stripeKind?: unknown }).stripeKind === 'simple';
}

/** `StripeStyle#getHeader(fontConfiguration, context)` — the bullet-list
 *  (`LIST_WITHOUT_NUMBER`/`LIST_WITH_NUMBER`) header-glyph atom. Always
 *  `null` here: bullet lists are out of L1 scope everywhere else in this
 *  port's creole layer (`Stripe.ts`'s own doc comment, `StripeStyleType.ts`)
 *  — `context` is threaded through (matching the upstream call's own
 *  signature) for the same reason `CreoleContext.ts` itself was ported
 *  ahead of its first caller: a small, self-contained value class this
 *  future bullet-list work will need, wired to its real call site now. */
function bulletHeader(_context: CreoleContext): CreoleAtom | null {
  return null;
}

function createSimpleStripe(
  atoms: readonly CreoleAtom[],
  cellAlignment: HorizontalAlignment,
  context: CreoleContext,
): TaggedSimpleStripe {
  return {
    stripeKind: 'simple',
    cellAlignment,
    getLHeader: () => bulletHeader(context),
    getAtoms: () => atoms,
  };
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
  private readonly cache = new Map<string, Sheet>();

  constructor(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    skinParam: ISkinSimple,
    creoleMode: CreoleMode,
    stereotype: FontConfiguration,
  ) {
    // java:75 -- Objects.requireNonNull(skinParam).
    if (skinParam == null) {
      throw new Error('CreoleParser: skinParam must not be null or undefined');
    }
    this.stereotype = stereotype;
    this.creoleMode = creoleMode;
    this.fontConfiguration = fontConfiguration;
    this.skinParam = skinParam;
    this.horizontalAlignment = horizontalAlignment;
  }

  /** java:131-140. Memoized on `display.cacheKey()` -- see
   *  `SheetBuilder.ts`'s doc comment for why this is a value-equality key,
   *  not object identity, matching upstream's `Display#hashCode`/`#equals`
   *  override. `Jaws.TRACE` debug printing (`false` by default upstream,
   *  so already dead in a normal build) is not ported. */
  createSheet(display: DisplayLike): Sheet {
    const key = display.cacheKey();
    let result = this.cache.get(key);
    if (result === undefined) {
      result = this.createSheetSlow(display, false);
      this.cache.set(key, result);
    }
    return result;
  }

  /** java:142-185. */
  private createSheetSlow(display: DisplayLike, checkColor: boolean): Sheet {
    const sheet = new Sheet(this.horizontalAlignment);
    if (!isNullDisplay(display)) {
      const context = new CreoleContext();
      for (const cs of display) {
        this.processDisplayLine(sheet, context, cs, display.showStereotype, checkColor);
      }
    }
    return sheet;
  }

  /** The body of `createSheetSlow`'s `while (it.hasNext())` loop
   *  (java:147-182), extracted to keep `createSheetSlow` itself a plain
   *  iteration shell. */
  private processDisplayLine(
    sheet: Sheet,
    context: CreoleContext,
    cs: DisplayLine,
    showStereotype: boolean,
    checkColor: boolean,
  ): void {
    const type = getEmbeddedType(typeof cs === 'string' ? cs : String(cs));
    if (type !== null) {
      this.processEmbedded(type, checkColor);
      return;
    }
    if (typeof cs !== 'string') {
      // java:168-173 -- `cs instanceof Stereotype`.
      if (!showStereotype) return;
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

  /** java:153-167's `type != null` branch. `checkColor` is only ever
   *  `true` from the commented-out (dead upstream) `checkColor()` static
   *  method — see the module doc comment — so the `stripes = null` arm is
   *  unreachable from any real caller today; kept for signature fidelity. */
  private processEmbedded(type: string, checkColor: boolean): void {
    if (checkColor) return;
    throw blockedOnSibling(`an embedded diagram ("{{${type}...}}")`, 'EmbeddedDiagram.java (createAndSkip)', 368);
  }

  /** java:79-115. See the module doc comment for the omitted
   *  raw/table/tree CONTINUATION branches (java:81-98) and the
   *  table/tree/code/latex seams below. */
  private createStripes(
    line: string,
    context: CreoleContext,
    lastStripe: Stripe | null,
    fontConfiguration: FontConfiguration,
  ): readonly Stripe[] | null {
    if (CreoleParser.isTableLine(line)) {
      throw blockedOnSibling(
        'a table line ("|...|"/"|=...|", optionally "<#color>"-prefixed)',
        'klimt/creole/legacy/StripeTable.java',
        219,
      );
    }
    if (isTreeStart(line)) {
      throw blockedOnSibling('a tree line ("|_...")', 'klimt/creole/legacy/StripeTree.java', 111);
    }
    if (isCodeStart(line)) {
      throw blockedOnSibling('a "<code>" block', 'klimt/creole/legacy/StripeCode.java', 124);
    }
    if (isLatexStart(line)) {
      throw blockedOnSibling('a "<latex>" block', 'klimt/creole/legacy/StripeLatex.java', 118);
    }

    // java:110-112.
    const align = isSimpleStripe(lastStripe) ? lastStripe.cellAlignment : this.horizontalAlignment;
    // java:113-114 -- `new CreoleStripeSimpleParser(...).createStripes(context, align)`,
    // adapted to this port's data-oriented buildLineAtoms/CreoleAtom pipeline
    // (legacy/StripeSimple.ts) instead of a second OOP StripeSimple class.
    const build = buildLineAtoms(line, fontConfiguration);
    if (build.classification.type === 'HORIZONTAL_LINE') {
      throw blockedOnSibling(
        'a horizontal-line separator ("--...--"/"==...=="/".."...".."/bare "====")',
        'klimt/creole/CreoleHorizontalLine.java',
        112,
      );
    }
    return [createSimpleStripe(build.atoms, align, context)];
  }
}
