/**
 * EmbeddedDiagram — a creole `{{ ... }}` block: a whole nested PlantUML
 * (or other `@start`/`@end`) diagram embedded inline inside a description
 * text, e.g. `{{salt\n...\n}}` or a bare `{{\n@startuml...@enduml\n}}`.
 *
 * Upstream: net/sourceforge/plantuml/EmbeddedDiagram.java (368 lines,
 * `class EmbeddedDiagram extends TextBlockMemoized implements Line,
 * Atom`) — the ROOT `net.sourceforge.plantuml` package, NOT
 * `klimt/creole/legacy/` (the batch overview's placement was wrong;
 * corrected at task assignment). Placed here at `src/core/
 * EmbeddedDiagram.ts` to mirror that root-package location, since this
 * port has no `net.sourceforge.plantuml`-root equivalent directory and
 * `src/core/` is the closest analog (other root-package ports —
 * `error/PSystemUnsupported.ts` — live one level deeper only because
 * they belong to an upstream SUBpackage; `EmbeddedDiagram.java` does
 * not).
 *
 * ## Ported in full
 *
 *  - `EMBEDDED_START`/`EMBEDDED_END` constants (java:77-78).
 *  - `getEmbeddedType(CharSequence)` (java:257-366) — a pure, self-
 *    contained text scan with no other class dependency. Ported FRESH
 *    here rather than imported from `klimt/creole/legacy/CreoleParser.ts`
 *    (T9a), even though T9a already carries an algorithmically identical
 *    copy — see "On `getEmbeddedType` and T9a" below for why reuse
 *    (import) was not possible within this task's boundaries.
 *  - `createAndSkip(String, Iterator<CharSequence>, ISkinSimple)`
 *    (java:97-115) — the line-collection algorithm: consumes lines from
 *    an iterator, tracking nesting depth via recursive `getEmbeddedType`
 *    hits and bare `"}}"` closes, until the OUTER `"}}"` is found (which
 *    is consumed but NOT appended to the collected block), wrapping the
 *    result in a synthetic `@start<type>`/`@end<type>` pair. Ported
 *    verbatim, including the easy-to-miss detail that a NESTED closing
 *    `"}}"` (one that only decrements `nested` without reaching 0) IS
 *    still appended to the result — only the outermost one is swallowed.
 *  - `from(ISkinSimple, List<String>)` (java:117-119) — construction
 *    entry point.
 *  - the `Line`/`Atom` surface (java:75, `TextBlockMemoized`/`Line`/
 *    `Atom`): `getHorizontalAlignment()` (always LEFT, java:248-250),
 *    `getStartingAltitude` (always 0, java:121-123), `calculateDimensionSlow`
 *    and `drawU` — both ADAPTED, see below.
 *  - `getNeutrons()` (java:252-255) — throws, ADR-9 (see below).
 *
 * ## `calculateDimensionSlow`/`drawU`: bound to an injected
 * `NestedDiagramRenderer` seam, not upstream's raster/TeaVM branch split
 *
 * Upstream's real bodies (java:126-152, 165-195) each start with `if
 * (!TeaVM.isTeaVM())`: the non-TeaVM branch rasterizes the nested
 * diagram to a PNG/SVG-embedded-image/TIKZ blob via `Diagram
 * #exportDiagram` + `SImageIO`/`UImageSvg`/`UImageTikz`; the TeaVM
 * branch — upstream's OWN browser/JS-transpile target, i.e. exactly this
 * port's runtime niche — instead asks the already-built `Diagram` (cast
 * to `UgDiagram`) for a `TextBlock` via `getTextBlock(0,
 * FileFormatOption)` and draws THAT directly (java:154-163, 184-189:
 * `tb.drawU(ug.apply(HColors.transparent().bg()))`).
 *
 * `src/` is browser-only and rasterization-free (CLAUDE.md's architecture
 * notes: no AWT, no `java.io`, no canvas) — the raster branch has no
 * analog anywhere in this port (`StringBounder.ts`/`UGraphic.ts` both
 * document dropping `matchesProperty`/`getFileFormat` entirely, "no
 * caller anywhere" — there is no SVG-vs-TIKZ-vs-raster distinction left
 * to dispatch on). So only the TeaVM branch's SHAPE is portable at all;
 * it is what this class adapts.
 *
 * But `getInternalTextBlock`'s OWN body (java:154-163) still needs a real
 * `Diagram`/`UgDiagram` — i.e. the FULL parse -> layout -> render
 * pipeline, constructed from the collected `@start.../@end...` lines.
 * That pipeline lives above `src/core/klimt/` (parsing, diagram dispatch,
 * the SVG renderer entry point); `EmbeddedDiagram.ts` sits (mirroring
 * upstream) at the OPPOSITE end — the leaf creole/atom layer other
 * top-level code depends ON. Importing the top-level pipeline here would
 * invert that dependency direction into a cycle (`src/core/EmbeddedDiagram
 * .ts` -> top-level parse/render -> ... -> creole atoms -> back to this
 * file's own `Atom`/`Line` surface), exactly the case the task boundary
 * calls out to STOP and report — reported per that instruction rather
 * than silently importing across it.
 *
 * The resolution is the callback seam `CLAUDE.md`'s architecture note
 * prescribes for exactly this shape ("If the Java reads a file ..., expose
 * it as a parameter/callback"), mirrored on `include-resolver.ts`'s
 * `IncludeFetcher` precedent: {@link NestedDiagramRenderer}. `EmbeddedDiagram`
 * carries the algorithm (line collection, dimension memoization via
 * `TextBlockMemoized`, the `HColors.transparent().bg()` draw wrapper —
 * ported as `new Back(NONE_PAINT)`, this port's documented `HColor`-free
 * equivalent, see `klimt/Back.ts`) faithfully; the renderer supplies the
 * ONE capability this port's architecture forbids this file from having
 * itself: turning diagram source text into a `TextBlock`. See
 * {@link NestedDiagramRenderer}'s own doc comment for the exact contract
 * a caller must satisfy.
 *
 * ## `getNeutrons()`: ADR-9, matching `AbstractAtom`/`StripeCode` precedent
 *
 * Upstream overrides `getNeutrons()` to return `Arrays.asList(Neutron
 * .create(this))` (java:252-255). `Neutron.java` has no TS counterpart —
 * T10d's own verdict (`.agent-notes/T10d-code.md`): its one upstream call
 * site (`Fission.java#getSplitted`) is already re-implemented, bound to
 * the data-oriented `CreoleAtom` model, as `Fission.ts#getNeutronsForAtom`.
 * `EmbeddedDiagram` is never an `AtomText`, so `Neutron.create(this)`
 * would always take the SAME generic `new Neutron(null, UNKNOWN, this)`
 * branch `getNeutronsForAtom` already reproduces for any non-`'text'`
 * atom — porting `Neutron.ts` here would duplicate that logic, not add
 * coverage. `getNeutrons()` throws, matching `AbstractAtom.ts`/
 * `StripeCode.ts`'s established precedent. This class does NOT extend
 * `AbstractAtom` — upstream's own `EmbeddedDiagram` extends
 * `TextBlockMemoized` directly (implementing `Atom` itself, with its own
 * explicit `getNeutrons` override), unlike `AtomWithMargin`/
 * `CreoleHorizontalLine`, which upstream DOES route through
 * `klimt/creole/atom/AbstractAtom.java` — mirrored here exactly, matching
 * `StripeCode.ts`'s identical choice for the identical reason.
 *
 * ## `Line` (klimt/shape/Line.java, 5 lines: `interface Line extends
 * TextBlock { HorizontalAlignment getHorizontalAlignment(); }`) — ported
 * INLINE, not as a new file
 *
 * Trivial (one method beyond `TextBlock`) and, per the ADR-8 corollary,
 * not droppable merely because nothing else in this port implements it
 * yet. Declaring it as a local interface here (rather than a new
 * `klimt/shape/Line.ts` file) keeps the port faithful without widening
 * this task's write-set — no other file needs to import it, since
 * `Atom`/`TextBlock` already cover every member any current caller reads.
 *
 * ## On `getEmbeddedType` and T9a — reused the ALGORITHM, not the binding
 *
 * `klimt/creole/legacy/CreoleParser.ts` (T9a) already carries an
 * algorithmically identical `getEmbeddedType` — necessarily, since
 * `EmbeddedDiagram.ts` did not exist yet when T9a needed the SAME
 * dispatch to decide whether a display line opens an embedded block.
 * That copy is MODULE-PRIVATE (no `export` keyword) and this task's
 * boundary is explicit: do not modify `CreoleParser.ts` (T10g owns
 * removing seams). A private, unexported function cannot be imported
 * without editing the module that hides it — true reuse (one shared
 * binding) was therefore not achievable inside this task's write-set,
 * not skipped by choice. What IS achieved: byte-for-byte identical
 * ALGORITHM (same leading/trailing-whitespace skip, same first-character
 * dispatch table, same keyword set), verified side-by-side against
 * `CreoleParser.ts`'s copy line-by-line while writing this file, so nothing
 * diverges even though the binding is temporarily duplicated. Upstream
 * itself only ever has ONE `getEmbeddedType` (a static method ON
 * `EmbeddedDiagram`, called BY `CreoleParser`) — this file is that
 * method's true canonical home; `CreoleParser.ts`'s copy was always a
 * stand-in for this file not existing yet. Flagged for T10g: replace
 * `CreoleParser.ts`'s local `getEmbeddedType` with `import {
 * getEmbeddedType } from '../../../EmbeddedDiagram.js'` and delete the
 * local copy, closing the loop upstream's own single-definition shape
 * already has.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java
 */
import { TextBlockMemoized } from './klimt/shape/TextBlockMemoized.js';
import { Back } from './klimt/Back.js';
import { HorizontalAlignment } from './klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from './klimt/geom/XDimension2D.js';
import type { TextBlock } from './klimt/shape/TextBlock.js';
import type { UGraphic } from './klimt/UGraphic.js';
import type { StringBounder } from './klimt/font/StringBounder.js';
import type { Atom } from './klimt/creole/SheetBlock1.js';
import type { ISkinSimple } from './style/ISkinSimple.js';
import type { Paint } from './paint.js';

/** `klimt/shape/Line.java` (5 lines), ported inline — see the module doc
 *  comment's "`Line`" section for why this is not a separate file. */
export interface Line extends TextBlock {
  getHorizontalAlignment(): HorizontalAlignment;
}

/**
 * The nested-diagram rendering seam (CLAUDE.md's callback-seam
 * architecture note; mirrors `include-resolver.ts`'s `IncludeFetcher`).
 *
 * Upstream's TeaVM branch (java:154-163: `((UgDiagram)
 * diagram).getTextBlock(0, new FileFormatOption(fileFormat))`) parses,
 * lays out, and renders the collected `@start.../@end...` source through
 * the FULL top-level diagram pipeline, then hands back a `TextBlock`.
 * That pipeline is not reachable from `src/core/klimt/` (see the module
 * doc comment) — a caller supplies it here instead.
 *
 * @param source    The collected `@start<type>` / ... / `@end<type>`
 *                   lines `createAndSkip` produced — feed this straight
 *                   to whatever this port's caller uses to parse+render a
 *                   top-level diagram (e.g. joined with `\n` and handed to
 *                   the same entry point `renderSync`/`parse` already use).
 * @param skinParam  The enclosing diagram's skin parameters (or `null`),
 *                   threaded through so the nested diagram can inherit
 *                   skin state — upstream's `Previous.createFrom(skinParam
 *                   .values())` (java:89, inside the private constructor)
 *                   achieves the same continuity; here that responsibility
 *                   moves to the renderer, since it alone can construct a
 *                   real nested diagram context.
 * @returns A `TextBlock` that measures and draws the fully rendered
 *          nested diagram — `calculateDimensionSlow`/`drawU` below call
 *          `calculateDimension`/`drawU` on it directly, matching
 *          upstream's own `tb.calculateDimension(stringBounder)` /
 *          `tb.drawU(ug)` calls in the TeaVM branch verbatim.
 */
export interface NestedDiagramRenderer {
  render(source: readonly string[], skinParam: ISkinSimple | null): TextBlock;
}

/** Upstream: `HColors.transparent()` (java:186, inside `drawU`'s TeaVM
 *  branch). This port carries no `HColor` model (`klimt/UBackground.ts`'s
 *  own seam note; `svek/Cluster.ts`'s identical local `NONE_PAINT`); `Paint`
 *  is the seam's equivalent everywhere upstream carries `HColor`, and the
 *  literal SVG `'none'` paint is the faithful transparent-fill value. */
const NONE_PAINT: Paint = 'none';

/** `StringUtils.trim2(CharSequence)` (java: `StringUtils.java:534-565`) —
 *  trims characters `<= ' '` (0x20) from both ends; NOT the same predicate
 *  as `CreoleParser.ts`'s own `isJavaWhitespace` (`Character.isWhitespace`),
 *  a genuinely different upstream method, so reusing that one would not be
 *  faithful even if it were exported. */
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

/**
 * `EmbeddedDiagram#getEmbeddedType(CharSequence)` (java:257-366). Pure
 * text scan: skips leading/trailing `Character.isWhitespace` runs, then
 * requires a `"{{"` prefix; `"{{"` alone (nothing else) is `"uml"`;
 * otherwise the remaining text must exactly match one of a fixed keyword
 * set, dispatched by first character to avoid scanning every keyword for
 * a non-matching input. See the module doc comment ("On `getEmbeddedType`
 * and T9a") for why this is a fresh, ALGORITHM-identical port rather than
 * an import of `CreoleParser.ts`'s existing private copy.
 */
export function getEmbeddedType(cs: string): string | null {
  const len = cs.length;

  let p = 0;
  while (p < len && isJavaWhitespace(cs.charAt(p))) p++;

  if (p + 2 > len || cs.charAt(p) !== '{' || cs.charAt(p + 1) !== '{') return null;
  p += 2;

  let end = len;
  while (end > p && isJavaWhitespace(cs.charAt(end - 1))) end--;

  const suffixLen = end - p;
  if (suffixLen === 0) return 'uml';

  const candidates = EMBEDDED_TYPE_KEYWORDS.get(cs.charAt(p));
  if (candidates === undefined) return null;
  for (const key of candidates) {
    if (matchEmbedded(cs, p, end, key)) return key;
  }
  return null;
}

/** Approximates `Character.isWhitespace(char)` for this port's realistic
 *  ASCII/Latin inputs — same approach `CreoleParser.ts`'s own local copy
 *  documents (excluding the three non-breaking-space code points Java's
 *  method also excludes). */
function isJavaWhitespace(ch: string): boolean {
  if (ch === ' ' || ch === ' ' || ch === ' ') return false;
  return /[\s-]/.test(ch) || /\p{Zs}|\p{Zl}|\p{Zp}/u.test(ch);
}

function matchEmbedded(cs: string, from: number, end: number, key: string): boolean {
  if (end - from !== key.length) return false;
  return cs.slice(from, end) === key;
}

/** java:284-354's `switch (cs.charAt(p))` dispatch table, ported as a
 *  lookup for the same reason `CreoleParser.ts`'s copy documents: avoids
 *  re-scanning every keyword for a non-matching first character. */
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

export class EmbeddedDiagram extends TextBlockMemoized implements Line, Atom {
  static readonly EMBEDDED_START = '{{';
  static readonly EMBEDDED_END = '}}';

  private readonly lines: readonly string[];
  private readonly skinParam: ISkinSimple | null;
  private readonly renderer: NestedDiagramRenderer;
  private textBlock: TextBlock | undefined;

  private constructor(skinParam: ISkinSimple | null, lines: readonly string[], renderer: NestedDiagramRenderer) {
    super();
    this.skinParam = skinParam;
    this.lines = lines;
    this.renderer = renderer;
  }

  /** java:117-119. */
  static from(skinParam: ISkinSimple | null, lines: readonly string[], renderer: NestedDiagramRenderer): EmbeddedDiagram {
    return new EmbeddedDiagram(skinParam, lines, renderer);
  }

  /**
   * java:97-115. Collects lines from `it` until the matching outer `"}}"`,
   * tracking nesting depth: a line that itself opens a nested embedded
   * block (`getEmbeddedType(s2) !== null`) increments `nested`; a line
   * that trims to exactly `"}}"` decrements it, and if that reaches 0 the
   * loop stops WITHOUT appending that line. A `"}}"` that only closes a
   * NESTED block (nested count > 0 afterward) IS still appended — only
   * the outermost terminator is swallowed. Wraps the collected lines in a
   * synthetic `@start<type>` / `@end<type>` pair.
   *
   * `it`'s element type mirrors upstream's `Iterator<CharSequence>` as
   * `string` (this port's `CharSequence` translation, CLAUDE.md's
   * table) — the caller (`CreoleParser.ts`'s `processEmbedded`, currently
   * a cited `blockedOnSibling` throw) already coerces a `DisplayLine` to
   * `string` the identical way for this same check (`String(cs)` at its
   * own `getEmbeddedType` call site) before reaching here.
   */
  static createAndSkip(
    type: string,
    it: Iterator<string>,
    skinParam: ISkinSimple | null,
    renderer: NestedDiagramRenderer,
  ): EmbeddedDiagram {
    const result: string[] = [`@start${type}`];
    let nested = 1;
    let step = it.next();
    while (step.done !== true) {
      const s2 = step.value;
      if (getEmbeddedType(s2) !== null) {
        nested++;
      } else if (trim2(s2) === EmbeddedDiagram.EMBEDDED_END) {
        nested--;
        if (nested === 0) break;
      }
      result.push(s2);
      step = it.next();
    }
    result.push(`@end${type}`);
    return EmbeddedDiagram.from(skinParam, result, renderer);
  }

  /** java:121-123. */
  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  /** java:248-250. */
  getHorizontalAlignment(): HorizontalAlignment {
    return HorizontalAlignment.LEFT;
  }

  /** java:252-255 — see the module doc comment's `getNeutrons()` section
   *  (ADR-9: `Neutron` is not ported; matches `AbstractAtom.ts`/
   *  `StripeCode.ts`'s established throw). */
  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }

  /**
   * java:154-163 (`getInternalTextBlock`, the TeaVM branch's own
   * memoization — folded into this class directly since this port has no
   * separate `getImage`/`getImageSvg`/`getImageTikz` raster paths to keep
   * it distinct from, see the module doc comment). Memoizes the
   * renderer's result exactly once per `EmbeddedDiagram` instance,
   * matching upstream's `if (textBlock == null) { ... }` guard.
   */
  private getInternalTextBlock(): TextBlock {
    if (this.textBlock === undefined) {
      this.textBlock = this.renderer.render(this.lines, this.skinParam);
    }
    return this.textBlock;
  }

  /**
   * java:126-152's TeaVM branch (java:142-146): delegates to the rendered
   * nested diagram's own `calculateDimension`. Upstream's `catch
   * (Exception e) { Logme.error(e); } return new XDimension2D(42, 42);`
   * fallback is preserved — a renderer failure degrades to a fixed-size
   * placeholder rather than propagating and breaking the enclosing
   * diagram's own layout pass, matching upstream's own resilience
   * contract for this one call.
   */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    try {
      return this.getInternalTextBlock().calculateDimension(stringBounder);
    } catch (err) {
      // Upstream: `catch (Exception e) { Logme.error(e); }` (java:148-150) --
      // logged, not silently swallowed (this project's error-handling
      // convention, `svek/Cluster.ts#drawU`'s identical precedent), which
      // also matches upstream's own observable behavior (diagnostic
      // output, degrade to the fixed placeholder size, layout continues).
      console.error('EmbeddedDiagram.calculateDimensionSlow: renderer failed', err);
      return new XDimension2D(42, 42);
    }
  }

  /**
   * java:165-195's TeaVM branch (java:184-189): `ug =
   * ug.apply(HColors.transparent().bg()); tb.drawU(ug);` — ported as
   * `new Back(NONE_PAINT)` (see the module doc comment's `HColor` note).
   * Same `catch (Exception e) { Logme.error(e); }` resilience as
   * `calculateDimensionSlow`: a renderer failure draws nothing rather
   * than throwing through the enclosing diagram's draw pass.
   */
  drawU(ug: UGraphic): void {
    try {
      const target = ug.apply(new Back(NONE_PAINT));
      this.getInternalTextBlock().drawU(target);
    } catch (err) {
      // Upstream: `catch (Exception e) { Logme.error(e); }` (java:191-193) --
      // logged, not silently swallowed (same convention/precedent as
      // `calculateDimensionSlow` above). Draws nothing on failure, matching
      // upstream's own observable behavior on this path.
      console.error('EmbeddedDiagram.drawU: renderer failed', err);
    }
  }
}
