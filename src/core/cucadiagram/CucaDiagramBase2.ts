import { CucaDiagramBase, EntityHideOrShow } from './CucaDiagramBase.js';
import type { Entity } from '../abel/Entity.js';
import type { EntityGender } from '../abel/EntityGender.js';
import { EntityPortion, asSet } from '../abel/EntityPortion.js';
import { HideOrShow } from './HideOrShow.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { PragmaKey } from '../skin/PragmaKey.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import { GUILLEMET_DOUBLE_COMPARATOR } from '../stereo/StereotypeDecoration.js';
import { BackSlash } from '../text/BackSlash.js';

/**
 * CucaDiagramBase2 — the SECOND segment of the TS-ONLY three-file
 * split of upstream's single `net/atmp/CucaDiagram.java` (see
 * `CucaDiagramBase.ts` for the split rationale; this repo's 500-line
 * cap forces three segments for the 953-line class). This segment
 * carries members :397-644: the dot-string export, the ADR-2 deferred
 * export pipeline, the pragma label accessors, and the
 * hide/show/remove recording machinery. Never instantiate — always a
 * `CucaDiagram` subclass.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:397-644
 */
export abstract class CucaDiagramBase2 extends CucaDiagramBase {
  /** @see net/atmp/CucaDiagram.java:397 */
  protected abstract getDotStrings(): readonly string[];

  /** @see net/atmp/CucaDiagram.java:399-415 */
  getDotStringSkek(): string[] {
    const result: string[] = [];
    for (const s of this.getDotStrings())
      if (s.startsWith('nodesep') || s.startsWith('ranksep') || s.startsWith('layout')) result.push(s);

    let aspect = this.getPragma().getValue(PragmaKey.ASPECT);
    if (aspect !== null) {
      // Java replace(char, char) replaces every occurrence.
      aspect = aspect.split(',').join('.');
      result.push('aspect=' + aspect + ';');
    }
    const ratio = this.getPragma().getValue(PragmaKey.RATIO);
    if (ratio !== null) result.push('ratio=' + ratio + ';');

    return result;
  }

  /** Deferred per SI1/ADR-2: constructs the unported
   * `CucaDiagramGraphmlMaker`. `OutputStream` is unported → `unknown`.
   * @see net/atmp/CucaDiagram.java:417-420 */
  private createFilesGraphml(suggestedFile: unknown): void {
    void suggestedFile;
    throw new Error('deferred per SI1/ADR-2: CucaDiagramGraphmlMaker not yet ported (net/atmp/CucaDiagram.java:417-420)');
  }

  /** Deferred per SI1/ADR-2: constructs the unported
   * `CucaDiagramXmiMaker`. @see net/atmp/CucaDiagram.java:422-425 */
  private createFilesXmi(suggestedFile: unknown, fileFormat: unknown): void {
    void suggestedFile;
    void fileFormat;
    throw new Error('deferred per SI1/ADR-2: CucaDiagramXmiMaker not yet ported (net/atmp/CucaDiagram.java:422-425)');
  }

  /** The trailing `return ImageDataSimple.ok()` of each export member
   * below is unreachable until its maker lands (`ImageData` unported →
   * `unknown`). @see net/atmp/CucaDiagram.java:427-431 */
  protected exportXmi(os: unknown, fileFormat: unknown): unknown {
    this.createFilesXmi(os, fileFormat);
    return undefined; // ImageDataSimple.ok()
  }

  /** @see net/atmp/CucaDiagram.java:433-437 */
  protected exportScxml(os: unknown): unknown {
    this.createFilesScxml(os);
    return undefined; // ImageDataSimple.ok()
  }

  /** @see net/atmp/CucaDiagram.java:439-443 */
  protected exportGraphml(os: unknown): unknown {
    this.createFilesGraphml(os);
    return undefined; // ImageDataSimple.ok()
  }

  /** @see net/atmp/CucaDiagram.java:445-449 */
  protected exportTxt(os: unknown, index: number, fileFormat: unknown): unknown {
    this.createFilesTxt(os, index, fileFormat);
    return undefined; // ImageDataSimple.ok()
  }

  /** Deferred per SI1/ADR-2: constructs the unported
   * `StateDiagramScxmlMaker` over a `StateDiagram` cast.
   * @see net/atmp/CucaDiagram.java:451-454 */
  private createFilesScxml(suggestedFile: unknown): void {
    void suggestedFile;
    throw new Error('deferred per SI1/ADR-2: StateDiagramScxmlMaker not yet ported (net/atmp/CucaDiagram.java:451-454)');
  }

  /** Deferred per SI1/ADR-2: constructs the unported
   * `CucaDiagramTxtMaker`. @see net/atmp/CucaDiagram.java:456-459 */
  private createFilesTxt(os: unknown, index: number, fileFormat: unknown): void {
    void os;
    void index;
    void fileFormat;
    throw new Error('deferred per SI1/ADR-2: CucaDiagramTxtMaker not yet ported (net/atmp/CucaDiagram.java:456-459)');
  }

  /** Deferred per SI1/ADR-2 AFTER the faithful
   * `eventuallyBuildPhantomGroups(null)` prefix: the maker selection
   * (TeaVM/elk/smetana/svek `CucaDiagramFileMaker` chain, gated by
   * `dotIsAvailable`) is the unported assembly pipeline.
   * @see net/atmp/CucaDiagram.java:461-480 */
  getTextBlock(num: number, fileFormatOption: unknown): TextBlock {
    void num;
    void fileFormatOption;
    this.eventuallyBuildPhantomGroups(undefined);
    void this.dotIsAvailable;
    throw new Error(
      'deferred per SI1/ADR-2: the CucaDiagramFileMaker chain is not yet ported (net/atmp/CucaDiagram.java:461-480)',
    );
  }

  /** Deferred per SI1/ADR-2: reads the unported
   * `GraphvizRuntimeEnvironment` (vizjs probe + dot version probe).
   * @see net/atmp/CucaDiagram.java:482-498 */
  private dotIsAvailable(): boolean {
    throw new Error('deferred per SI1/ADR-2: GraphvizRuntimeEnvironment not yet ported (net/atmp/CucaDiagram.java:482-498)');
  }

  /** @see net/atmp/CucaDiagram.java:500-510 */
  override getWarningOrError(): string | undefined {
    const generalWarningOrError = super.getWarningOrError();
    if (this.warningOrError === undefined) return generalWarningOrError;

    if (generalWarningOrError === undefined) return this.warningOrError;

    return generalWarningOrError + BackSlash.NEWLINE + this.warningOrError;
  }

  /** @see net/atmp/CucaDiagram.java:518-521 */
  resetPragmaLabel(): void {
    this.getPragma().undefine(PragmaKey.LABEL_DISTANCE);
    this.getPragma().undefine(PragmaKey.LABEL_ANGLE);
  }

  /** Java calls `isNumber(s)` unguarded (a value-less define would
   * NPE); the `s !== null` conjunct keeps TS sound — unreachable via
   * commands, which always define a value.
   * @see net/atmp/CucaDiagram.java:523-538 */
  getLabeldistance(): string {
    if (this.getPragma().isDefine(PragmaKey.LABEL_DISTANCE)) {
      const s = this.getPragma().getValue(PragmaKey.LABEL_DISTANCE);
      if (s !== null && isNumber(s)) return s;
    }
    if (this.getPragma().isDefine(PragmaKey.DEFAULT_LABEL_DISTANCE)) {
      const s = this.getPragma().getValue(PragmaKey.DEFAULT_LABEL_DISTANCE);
      if (s !== null && isNumber(s)) return s;
    }
    // Default in dot 1.0
    return '1.7';
  }

  /** @see net/atmp/CucaDiagram.java:540-555 */
  getLabelangle(): string {
    if (this.getPragma().isDefine(PragmaKey.LABEL_ANGLE)) {
      const s = this.getPragma().getValue(PragmaKey.LABEL_ANGLE);
      if (s !== null && isNumber(s)) return s;
    }
    if (this.getPragma().isDefine(PragmaKey.DEFAULT_LABEL_ANGLE)) {
      const s = this.getPragma().getValue(PragmaKey.DEFAULT_LABEL_ANGLE);
      if (s !== null && isNumber(s)) return s;
    }
    // Default in dot -25
    return '25';
  }

  /** @see net/atmp/CucaDiagram.java:557-560 */
  isEmpty(entity: Entity): boolean {
    return entity.isEmpty();
  }

  /** @see net/atmp/CucaDiagram.java:562-564 */
  isVisibilityModifierPresent(): boolean {
    return this.visibilityModifierPresent;
  }

  /** @see net/atmp/CucaDiagram.java:566-568 */
  setVisibilityModifierPresent(visibilityModifierPresent: boolean): void {
    this.visibilityModifierPresent = visibilityModifierPresent;
  }

  /** @see net/atmp/CucaDiagram.java:570-580 */
  showPortion(portion: EntityPortion, entity: Entity): boolean {
    if (this.getSkinParam().strictUmlStyle() && portion === EntityPortion.CIRCLED_CHARACTER) return false;

    let result = true;
    for (const cmd of this.hideOrShows) if (cmd.portion === portion && cmd.gender.contains(entity)) result = cmd.show;

    return result;
  }

  /** @see net/atmp/CucaDiagram.java:582-587 */
  hideOrShowVisibilityModifier(visibilities: ReadonlySet<VisibilityModifier>, show: boolean): void {
    if (show) for (const v of visibilities) this.hideVisibilityModifier.delete(v);
    else for (const v of visibilities) this.hideVisibilityModifier.add(v);
  }

  /** @see net/atmp/CucaDiagram.java:589-602 */
  getVisibleStereotypeLabels(entity: Entity): readonly string[] | undefined {
    const stereotype = entity.getStereotype();

    if (stereotype === undefined) return undefined;

    const visibleStereotypeLabels: string[] = [];
    for (const stereoTypeLabel of (entity.getStereotype() as Stereotype).getLabels(GUILLEMET_DOUBLE_COMPARATOR))
      if (this.isStereotypeLabelShown(stereoTypeLabel)) visibleStereotypeLabels.push(stereoTypeLabel);

    return visibleStereotypeLabels;
  }

  /** @see net/atmp/CucaDiagram.java:604-614 */
  private isStereotypeLabelShown(stereoTypeLabel: string): boolean {
    let result = true;
    for (const cmd of this.hideOrShows) {
      if (cmd.portion !== EntityPortion.STEREOTYPE) continue;
      const gender = cmd.gender.getGender();
      if (gender === undefined || gender === stereoTypeLabel) result = cmd.show;
    }
    return result;
  }

  /** @see net/atmp/CucaDiagram.java:616-620 */
  hideOrShow(gender: EntityGender, portions: EntityPortion, show: boolean): void {
    for (const portion of asSet(portions)) this.hideOrShows.push(new EntityHideOrShow(gender, portion, show));
  }

  /** @see net/atmp/CucaDiagram.java:622-625 */
  hideOrShow2(what: string, show: boolean): void {
    what = this.fixWhat(what);
    this.hides2.push(new HideOrShow(what, show));
  }

  /** @see net/atmp/CucaDiagram.java:627-630 */
  removeOrRestore(what: string, show: boolean): void {
    what = this.fixWhat(what);
    this.removed.push(new HideOrShow(what, show));
  }

  /** @see net/atmp/CucaDiagram.java:632-640 */
  private fixWhat(what: string): string {
    const sep = this.getNamespaceSeparator();
    if (sep !== undefined) {
      const currentQuark = this.getCurrentGroup().getQuark();
      if (currentQuark.getQualifiedName().length > 0) what = currentQuark.getQualifiedName() + sep + what;
    }
    return what;
  }

  /** Upstream returns `Collections.unmodifiableSet` — a LIVE read-only
   * view; the `ReadonlySet` type over the live set is the TS
   * equivalent (later `hide`/`show` directives must stay visible
   * through it). @see net/atmp/CucaDiagram.java:642-644 */
  getHidesVisibilityModifier(): ReadonlySet<VisibilityModifier> {
    return this.hideVisibilityModifier;
  }
}

/** @see net/atmp/CucaDiagram.java:512 */
const NUMBER_PATTERN = /^[+-]?(\.?\d+|\d+\.\d*)$/;

/** Java `matcher(s).matches()` — whole-string anchors added above.
 * @see net/atmp/CucaDiagram.java:514-516 */
function isNumber(s: string): boolean {
  return NUMBER_PATTERN.test(s);
}
