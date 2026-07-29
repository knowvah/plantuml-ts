/**
 * StripeTable — the `Stripe` a `|cell|cell|`/`|=Header|=Header|` creole
 * TABLE line (optionally `<#color>`/`<#backcolor,linecolor>`-prefixed,
 * per-cell OR per-line) becomes: parses the line into cells (each its
 * own nested `Sheet` of one-or-more `\n`-split sub-lines, `<r>`-aligned
 * or left-aligned), and wraps the whole grid in one `AtomTable`.
 *
 * Upstream: klimt/creole/legacy/StripeTable.java. Ported: the
 * constructor, `getAtoms`, `getLHeader`, `asAtom` (static, also the
 * upstream call site `klimt/creole/legacy/StripeTree.java:87` reuses —
 * kept `static`/exported for that reason), `getBackOrFrontColor`,
 * `withouBackColor` (upstream's own misspelling, preserved — "preserve
 * upstream names, including the ugly ones", `CLAUDE.md`), `hiddenBar`,
 * `analyzeAndAddInternal`, `getWithNewlinesInternal` (both branches, even
 * though `legacyReplaceBackslashNByNewline()` always returns `true` —
 * "don't refactor while porting"), `getFontConfiguration`,
 * `analyzeAndAddLine`.
 *
 * ## NOT a duplicate of `src/core/creole-table.ts`
 *
 * `creole-table.ts` is the CURRENT production creole-table renderer
 * (`EntityImageDescriptionSupport.ts`'s own "scoped substitute" for the
 * whole `Display`/`Sheet`/`SheetBlock1` layer, ADR-8's own framing) — a
 * DIFFERENT, simpler `|=Header|`-only grammar with no `<#color>` prefix,
 * `\n`-split multi-line cells, or `<r>`-alignment support. This file is
 * the REAL upstream layer ADR-8 mandates porting alongside `Display`/
 * `Sheet`/`SheetBlock1` — nothing here wires into `creole-table.ts` or
 * vice versa; a future task resumes the wiring exactly as ADR-8 already
 * describes for `EntityImageDescriptionSupport.ts#buildTextBlock`.
 *
 * ## ADR-9 adaptation: the OUTER `Stripe` contract is `Atom`-valued, not
 * `CreoleAtom`-valued — this class does NOT `implements Stripe` from
 * `Stripe.ts`
 *
 * Upstream's `klimt/creole/Stripe.java` interface is `{ Atom getLHeader();
 * List<Atom> getAtoms(); }` using the OOP `klimt.creole.atom.Atom`
 * (`SheetBlock1.ts`'s `Atom`, NOT `atom/Atom.ts`'s `CreoleAtom`). This
 * port's OWN `Stripe.ts` TS interface was written for a NARROWER case —
 * `legacy/CreoleParser.ts`'s plain-text (NORMAL/HEADING/LITERAL) path,
 * whose `getAtoms()` is always a flat `CreoleAtom[]` — and cannot
 * represent a genuinely COMPOSITE cell atom (a whole nested table/tree/
 * code-block `Atom`, `SheetBlock1`-shaped, not text). `StripeTable`
 * (this file), `StripeTree` (T10c), `StripeCode` (T10d), and `StripeLatex`
 * (T10e) ALL hit this same shape upstream: each is a `Stripe` whose
 * `getAtoms()` returns a SINGLETON `List<Atom>` wrapping one opaque
 * composite `Atom`. Rather than widen `Stripe.ts` (out of this task's
 * write-set, and two sibling tasks — T10c/T10d — independently discover
 * the identical gap this same batch), this class exposes `getAtoms()`/
 * `getLHeader()` returning `Atom` (not `CreoleAtom`) directly, matching
 * upstream's REAL `Stripe.java` contract exactly, and does not declare
 * `implements Stripe`. Reconciling the two `Stripe` shapes (e.g. a
 * `Stripe.ts` generic over its atom type, or a `CreoleAtom` variant that
 * wraps an opaque `Atom`) is a genuine, separable follow-on for whoever
 * wires `Sheet`/`CreoleParser.ts` to construct real
 * `StripeTable`/`StripeTree`/`StripeCode`/`StripeLatex` instances
 * (T10g's own reinstatement task, or later) — flagged here, not silently
 * decided.
 *
 * The CELL level is the opposite case: each cell's OWN content is flat
 * creole text, exactly what `Stripe.ts` (`CreoleAtom`-flavored) already
 * represents and what `legacy/StripeSimple.ts#buildLineAtoms` already
 * builds — so `TableCellStripe` (below, module-private) DOES implement
 * `Stripe.ts` and feeds `asAtom`'s nested `Sheet` exactly the way
 * `CreoleParser.ts`'s own plain-text `Stripe` implementor does.
 *
 * ## ADR-9 adaptation: `atomOps` is an extra, LAST-positioned constructor
 * parameter
 *
 * `asAtom`'s nested `Sheet` is wrapped in a `SheetBlock1`
 * (`SheetBlock1.ts`), which this port's own T8 adaptation requires an
 * injected `AtomOps` bundle for (`Sea.ts`'s own doc comment) — upstream's
 * virtual `Atom` dispatch needs no such thing. `StripeTable`'s
 * constructor and the `asAtom` static factory both gain this as an
 * EXTRA, LAST-positioned parameter, matching `SheetBlock1.ts`'s own
 * established precedent.
 *
 * ## Dropped: `stripeStyle`/`CreoleContext` fields (constructor-only
 * pass-through to the unported OOP `StripeSimple`)
 *
 * Upstream's `stripeStyle` field (java:74, always `new
 * StripeStyle(NORMAL, 0, '\0')`) and each cell's own `new CreoleContext()`
 * (java:152) exist SOLELY to be forwarded into `new StripeSimple(...)`'s
 * constructor — neither is read by `getLHeader()` (upstream's own body
 * is `return null;` UNCONDITIONALLY, ignoring `stripeStyle` entirely) or
 * by any other method. Since this port's cell content is built via
 * `buildLineAtoms` (not a `StripeSimple` instance), both become dead
 * constructor-forwarding parameters with zero observable behavior —
 * dropped, not silently approximated. `CreoleMode.FULL` (java:153, also
 * constructor-forwarding-only) needs no adaptation at all:
 * `buildLineAtoms` already always parses with full creole command
 * support, matching upstream's own HARDCODED `CreoleMode.FULL` (not
 * parameterized in the Java either) exactly — zero divergence.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeTable.java
 */
import type { Stripe } from '../Stripe.js';
import { Sheet } from '../Sheet.js';
import { SheetBlock1, type Atom } from '../SheetBlock1.js';
import type { AtomOps } from '../Sea.js';
import { AtomTable } from '../atom/AtomTable.js';
import { AtomWithMargin } from '../atom/AtomWithMargin.js';
import { LineBreakStrategy } from '../../LineBreakStrategy.js';
import { HorizontalAlignment } from '../../geom/HorizontalAlignment.js';
import type { ClockwiseTopRightBottomLeft } from '../../geom/ClockwiseTopRightBottomLeft.js';
import type { ISkinSimple } from '../../../style/ISkinSimple.js';
import { FontStyle, type FontConfiguration } from '../../shape/UText.js';
import { Pragma } from '../../../skin/Pragma.js';
import { BackSlash } from '../../../text/BackSlash.js';
import { parseSimpleColor } from '../../color/HColorSet.js';
import type { Paint } from '../../../paint.js';
import type { CreoleAtom } from '../atom/Atom.js';
import { buildLineAtoms } from './StripeSimple.js';
import { CreoleParser } from './CreoleParser.js';

/** Upstream: `StripeTable$Mode` (java:66-68). */
type CellMode = 'HEADER' | 'NORMAL';

/** `StringUtils.PRIVATE_BLOCK` (java:128) — upstream hardcodes this
 *  literal directly rather than importing `StringUtils`, so this port
 *  does too (matches `text/BackSlash.ts`'s own note on why it does not
 *  reuse a cross-module constant for the identical value either). */
const HIDDEN_BAR = '';

/** Upstream: `HColorSet#getColorOrWhite` (java:58-63) — this port has no
 *  `getIHtmlColorSet()`-returning OOP wrapper on `ISkinSimple.ts`
 *  (that file's own doc comment), so this resolves directly against
 *  `klimt/color/HColorSet.ts#parseSimpleColor`, the SAME free-function
 *  color resolver every other seam in this port already uses. Falls
 *  back to `'white'` (this port's own `Paint` spelling of
 *  `HColors.WHITE`) for an unrecognized token, exactly matching
 *  upstream's null -> WHITE fallback. */
function colorOrWhite(s: string): Paint {
  return parseSimpleColor(s) !== undefined ? s : 'white';
}

/** Upstream: `String#split(",")` (Java's default `limit=0` drops
 *  TRAILING empty strings only; JS `String#split` keeps them all). Used
 *  by {@link getBackOrFrontColorFor} below for `<#color1,color2>`
 *  parsing fidelity. */
function javaSplitDroppingTrailingEmpty(s: string, sep: string): string[] {
  const parts = s.split(sep);
  let end = parts.length;
  while (end > 0 && parts[end - 1] === '') end--;
  return parts.slice(0, end);
}

/** Upstream: `new StringTokenizer(line, "|")` — splits on `|`, producing
 *  NO empty tokens regardless of leading/trailing/consecutive delimiters
 *  (Java `StringTokenizer`'s own contract, unlike `String#split`). */
function tokenizeByPipe(line: string): string[] {
  return line.split('|').filter((t) => t.length > 0);
}

/** One table CELL's `Stripe` — the CreoleAtom-flavored inner contract
 *  (see the module doc comment's ADR-9 section). Upstream:
 *  `StripeSimple`'s `getLHeader`/`getAtoms`/`getCellAlignment`/
 *  `setCellAlignment` surface, reduced to what this port's
 *  `buildLineAtoms` pipeline already computes — mirrors
 *  `legacy/CreoleParser.ts`'s own local `Stripe` implementor for the
 *  plain-text path. */
class TableCellStripe implements Stripe {
  private readonly atoms: readonly CreoleAtom[];
  private cellAlignment: HorizontalAlignment = HorizontalAlignment.LEFT;

  constructor(atoms: readonly CreoleAtom[]) {
    this.atoms = atoms;
  }

  getLHeader(): CreoleAtom | null {
    return null;
  }

  getAtoms(): readonly CreoleAtom[] {
    return this.atoms;
  }

  setCellAlignment(alignment: HorizontalAlignment): void {
    this.cellAlignment = alignment;
  }

  getCellAlignment(): HorizontalAlignment {
    return this.cellAlignment;
  }
}

export class StripeTable {
  private readonly fontConfiguration: FontConfiguration;
  private readonly skinParam: ISkinSimple;
  private readonly table: AtomTable;
  private readonly marged: Atom;
  private readonly atomOps: AtomOps;

  constructor(fontConfiguration: FontConfiguration, skinParam: ISkinSimple, line: string, atomOps: AtomOps) {
    this.skinParam = skinParam;
    this.fontConfiguration = fontConfiguration;
    this.atomOps = atomOps;

    let lineColor = this.getBackOrFrontColor(line, 1);
    if (lineColor === null) lineColor = fontConfiguration.color ?? 'black';

    this.table = new AtomTable(lineColor);
    this.marged = new AtomWithMargin(this.table, 2, 2);
    this.analyzeAndAddInternal(line);
  }

  getAtoms(): readonly Atom[] {
    return [this.marged];
  }

  getLHeader(): Atom | null {
    return null;
  }

  /** Also called by `klimt/creole/legacy/StripeTree.java:87` upstream
   *  (T10c) — kept `static`/exported so this port's own `StripeTree.ts`
   *  can reuse it the same way. `cells` is `readonly Stripe[]` (this
   *  port's `Stripe.ts`, CreoleAtom-flavored), generalizing upstream's
   *  `List<StripeSimple>` since this port has no `StripeSimple` class. */
  static asAtom(cells: readonly Stripe[], padding: ClockwiseTopRightBottomLeft, atomOps: AtomOps): Atom {
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    for (const cell of cells) sheet.add(cell);
    return new SheetBlock1(sheet, LineBreakStrategy.NONE, atomOps, padding);
  }

  private getBackOrFrontColor(line: string, idx: number): Paint | null {
    if (!CreoleParser.doesStartByColor(line)) return null;

    const idx1 = line.indexOf('#');
    const idx2 = line.indexOf('>');
    if (idx2 === -1) throw new Error('IllegalStateException');

    const color = javaSplitDroppingTrailingEmpty(line.slice(idx1, idx2), ',');
    if (idx >= color.length) return null;
    return colorOrWhite(color[idx] as string);
  }

  /** Upstream's own misspelling (java:120), preserved verbatim. */
  private withouBackColor(line: string): string {
    const idx2 = line.indexOf('>');
    if (idx2 === -1) throw new Error('IllegalStateException');
    return line.slice(idx2 + 1);
  }

  private analyzeAndAddInternal(line: string): void {
    let workingLine = line.split('\\|').join(HIDDEN_BAR);
    const lineBackColor = this.getBackOrFrontColor(workingLine, 0);
    if (lineBackColor !== null) workingLine = this.withouBackColor(workingLine);

    this.table.newLine(lineBackColor);
    for (const token of tokenizeByPipe(workingLine)) {
      this.addOneCellGroup(token);
    }
  }

  /** Upstream: the body of `analyzeAndAddInternal`'s `for`
   *  (`StringTokenizer`) loop (java:139-162) — one `|`-delimited token
   *  becomes one table cell (itself possibly multiple stacked `\n`-split
   *  sub-lines). Split out of `analyzeAndAddInternal` to keep both
   *  functions under this project's per-function complexity budget. */
  private addOneCellGroup(token: string): void {
    let mode: CellMode = 'NORMAL';
    let v = token.split(HIDDEN_BAR).join('|');
    if (v.startsWith('=')) {
      v = v.slice(1);
      mode = 'HEADER';
    }
    const cellBackColor = this.getBackOrFrontColor(v, 0);
    if (cellBackColor !== null) v = this.withouBackColor(v);

    const font = this.getFontConfiguration(mode);
    const cells: TableCellStripe[] = [];
    for (const s of StripeTable.getWithNewlinesInternal(v)) {
      cells.push(this.buildCell(s, font));
    }
    this.table.addCell(StripeTable.asAtom(cells, this.skinParam.getPadding(), this.atomOps), cellBackColor);
  }

  /** Upstream: the inner `for (String s : lines)` body (java:151-160). */
  private buildCell(s: string, font: FontConfiguration): TableCellStripe {
    let content = s;
    const alignRight = content.startsWith('<r>');
    if (alignRight) content = content.slice('<r>'.length);

    const { atoms } = buildLineAtoms(content, font);
    const cell = new TableCellStripe(atoms);
    if (alignRight) cell.setCellAlignment(HorizontalAlignment.RIGHT);
    return cell;
  }

  /** Upstream: `StripeTable#getWithNewlinesInternal` (java:165-206). Both
   *  branches ported (even though `legacyReplaceBackslashNByNewline()`
   *  always returns `true` today) — see the module doc comment. */
  static getWithNewlinesInternal(s: string): readonly string[] {
    if (Pragma.legacyReplaceBackslashNByNewline()) {
      return splitWithBackslashN(s);
    }
    return splitOnHiddenNewlineOnly(s);
  }

  private getFontConfiguration(mode: CellMode): FontConfiguration {
    if (mode === 'NORMAL') return this.fontConfiguration;
    return { ...this.fontConfiguration, styles: new Set(this.fontConfiguration.styles).add(FontStyle.BOLD) };
  }

  analyzeAndAddLine(line: string): void {
    this.analyzeAndAddInternal(line);
  }
}

/** Upstream: `getWithNewlinesInternal`'s `legacyReplaceBackslashNByNewline()
 *  === true` branch (java:169-191) — recognizes BOTH a literal `\n`
 *  escape sequence AND `BackSlash.hiddenNewLine()`'s sentinel character
 *  as line-split points, and un-escapes a literal `\\`. */
function splitWithBackslashN(s: string): readonly string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    if (c === '\\' && i < s.length - 1) {
      const c2 = s.charAt(i + 1);
      i++;
      if (c2 === 'n') {
        result.push(current);
        current = '';
      } else if (c2 === '\\') {
        current += c2;
      } else {
        current += c;
        current += c2;
      }
    } else if (c === BackSlash.hiddenNewLine()) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

/** Upstream: `getWithNewlinesInternal`'s `legacyReplaceBackslashNByNewline()
 *  === false` branch (java:192-204) — unreachable today (that method
 *  always returns `true`), ported for fidelity per "don't refactor while
 *  porting". Splits ONLY on the hidden-newline sentinel, with no `\n`
 *  escape recognition. */
function splitOnHiddenNewlineOnly(s: string): readonly string[] {
  const result: string[] = [];
  let current = '';
  for (const c of s) {
    if (c === BackSlash.hiddenNewLine()) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
