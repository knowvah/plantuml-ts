import type { ISkinParam } from './abel/ISkinParam.js';
import type { Pragma } from './skin/Pragma.js';
import type { PreprocessingArtifact } from './tim/PreprocessingArtifact.js';
import { ClockwiseTopRightBottomLeft } from './klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { XDimension2D } from './klimt/geom/XDimension2D.js';

/**
 * DiagramType — the 39-value diagram-kind selector
 * (`core/DiagramType.java`). SI1/T5 consumed-slice LOCAL declaration
 * (values only — `isLegacyUML`/`findStartTypes`/`getSpecial` land with
 * the `core/` package port, which should move this to `src/core/code/`
 * alongside the other core types); moved here from the retired
 * `abel/CucaDiagram.ts` stub by T10 (this file is its first consumer:
 * the `TitledDiagram` ctor stores one). NOT this port's
 * `block-extractor.ts` `DiagramType` (a lowercase engine-routing union
 * — different semantics, per that file's own scope). Journaled (T5,
 * T10).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramType.java:44-47
 */
export type DiagramType =
  | 'SEQUENCE'
  | 'STATE'
  | 'CLASS'
  | 'OBJECT'
  | 'ACTIVITY'
  | 'DESCRIPTION'
  | 'COMPOSITE'
  | 'TIMING'
  | 'HELP'
  | 'BPM'
  | 'DITAA'
  | 'DOT'
  | 'JCCKIT'
  | 'SALT'
  | 'FLOW'
  | 'CREOLE'
  | 'MATH'
  | 'LATEX'
  | 'DEFINITION'
  | 'GANTT'
  | 'CHRONOLOGY'
  | 'NWDIAG'
  | 'MINDMAP'
  | 'WBS'
  | 'WIRE'
  | 'JSON'
  | 'GIT'
  | 'BOARD'
  | 'YAML'
  | 'HCL'
  | 'EBNF'
  | 'REGEX'
  | 'FILES'
  | 'CHEN_EER'
  | 'CHART'
  | 'PACKET'
  | 'SPRITES'
  | 'CRASH'
  | 'UNKNOWN';

/**
 * UmlSource — ADR-2 opaque brand for `core/UmlSource.java` (the raw
 * `@start…`/`@end…` block). The consumed slice here only STORES one
 * (the `LinkConstraint.ts`-stub precedent); this port's own line-level
 * source handling lives in `src/core/error/UmlSource.ts` (a free
 * function, different consumed surface). The diagram-stack port should
 * reconcile the two.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java
 */
export interface UmlSource {
  /** TS-only nominal brand; never assigned. No member is consumed. */
  readonly __umlSourceBrand?: never;
}

/**
 * Previous — ADR-2 opaque brand for `Previous.java` (the carried-over
 * skinparam state of a preceding diagram in the same file). The
 * consumed slice here only STORES one; the real class (58 lines,
 * `copyAllFrom` target) lands with the diagram-stack port.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/Previous.java
 */
export interface Previous {
  /** TS-only nominal brand; never assigned. No member is consumed. */
  readonly __previousBrand?: never;
}

/**
 * TitledDiagram — the diagram-stack base of `CucaDiagram`. SI1/T10
 * ADR-2 minimal CONSUMED slice, NOT the full 480-line class: exactly
 * the members `CucaDiagram` (and its T5/T6 stub contract) reaches,
 * ported faithfully, plus the constructor's field stores. The
 * supertype boundary drawn (journaled, T10):
 *
 * - `getSkinParam()` is ABSTRACT here — upstream builds a `SkinParam`
 *   in the constructor (`SkinParam.create(...)`, the unported `skin/`
 *   subsystem) and every skinparam/pragma accessor flows through it.
 *   Concrete diagrams (and tests) supply one.
 * - `getPragma()` reads through `getSkinParam()` instead of the
 *   private `skinParam` field (same object upstream).
 * - Title/caption/legend/header/footer state, sprites, `loadSkin`,
 *   annotations, and the export chain (`UgDiagram`/`AbstractPSystem`
 *   supers) stay unported — nothing in this closure consumes them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:84
 */
export abstract class TitledDiagram {
  /** @see TitledDiagram.java:87 (upstream's only assignment, :361, is
   * commented out — the field constantly stays null there too). */
  private lastInfo: XDimension2D | undefined = undefined;

  /** @see TitledDiagram.java:89-90 */
  static FORCE_SMETANA = false;
  static FORCE_ELK = false;

  /** @see TitledDiagram.java:100 */
  private readonly type: DiagramType;

  /** @see TitledDiagram.java:103 */
  private namespaceSeparator: string | undefined = undefined;

  /** Stored by the unported `UgDiagram`/`AbstractPSystem` supers
   * upstream (`super(source, preprocessing)`); held here so the
   * faithful constructor signature survives until the diagram stack
   * lands. `previous` is consumed upstream by
   * `skinParam.copyAllFrom(previous)` (:110-111) — deferred with the
   * `SkinParam` boundary above. */
  protected readonly source: UmlSource;
  protected readonly previous: Previous | undefined;
  protected readonly preprocessing: PreprocessingArtifact;

  /** @see TitledDiagram.java:104-112 */
  constructor(source: UmlSource, type: DiagramType, previous: Previous | undefined, preprocessing: PreprocessingArtifact) {
    this.source = source;
    this.type = type;
    this.previous = previous;
    this.preprocessing = preprocessing;
  }

  /** @see TitledDiagram.java:121-123 */
  setNamespaceSeparator(namespaceSeparator: string | undefined): void {
    this.namespaceSeparator = namespaceSeparator;
  }

  /** @see TitledDiagram.java:125-127 */
  getNamespaceSeparator(): string | undefined {
    return this.namespaceSeparator;
  }

  /** @see TitledDiagram.java:133-135 */
  getDiagramType(): DiagramType {
    return this.type;
  }

  /** ABSTRACT boundary member — see the class doc comment.
   * @see TitledDiagram.java:137-139 */
  abstract getSkinParam(): ISkinParam;

  /** @see TitledDiagram.java:141-145 */
  private skinParamUsed = false;

  /** The plantuml#2171 backward-compatibility probe read by
   * `Entity#getCurrentStyleBuilder`.
   * @see TitledDiagram.java:143-145 */
  isSkinParamUsed(): boolean {
    return this.skinParamUsed;
  }

  /** @see TitledDiagram.java:147-149 */
  setSkinParamUsed(skinParamUsed: boolean): void {
    this.skinParamUsed = skinParamUsed;
  }

  /** @see TitledDiagram.java:250-251 */
  private useSmetana = false;
  private useElk = false;

  /** @see TitledDiagram.java:253-255 */
  setUseSmetana(useSmetana: boolean): void {
    this.useSmetana = useSmetana;
  }

  /** @see TitledDiagram.java:257-259 */
  setUseElk(useElk: boolean): void {
    this.useElk = useElk;
  }

  /** @see TitledDiagram.java:261-265 */
  isUseElk(): boolean {
    if (TitledDiagram.FORCE_ELK) return true;
    return this.useElk;
  }

  /** @see TitledDiagram.java:267-271 */
  isUseSmetana(): boolean {
    if (TitledDiagram.FORCE_SMETANA) return true;
    return this.useSmetana;
  }

  /** Upstream `skinParam.getPragma()` — the same object
   * `getSkinParam()` returns (boundary adaptation, class doc comment).
   * @see TitledDiagram.java:316-318 */
  getPragma(): Pragma {
    return this.getSkinParam().getPragma();
  }

  /** @see TitledDiagram.java:273-276 */
  getDefaultMargins(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.same(10);
  }

  /** The `widthwarning` probe. `lastInfo` is never assigned in current
   * upstream (see its field note) — the body below is faithfully
   * ported dead code until the export pipeline lands (ADR-1 callerless
   * mandate).
   * @see TitledDiagram.java:440-462 */
  getWarningOrError(): string | undefined {
    if (this.lastInfo === undefined) return undefined;

    const actualWidth = this.lastInfo.getWidth();
    if (actualWidth === 0) return undefined;

    const value = this.getSkinParam().getValue('widthwarning');
    if (value === null) return undefined;

    if (DIGITS.test(value) === false) return undefined;

    const widthwarning = Number.parseInt(value, 10);
    if (actualWidth > widthwarning)
      return 'The image is ' + String(Math.trunc(actualWidth)) + ' pixel width. (Warning limit is ' + String(widthwarning) + ')';

    return undefined;
  }
}

/** @see TitledDiagram.java:86 (`Pattern.compile("\\d+")`, used via
 * `matcher(value).matches()` — whole-string anchors added). */
const DIGITS = /^\d+$/;
