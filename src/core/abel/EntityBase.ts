import type { Quark } from '../plasma/Quark.js';
import { Display } from '../klimt/creole/Display.js';
import { LeafType } from './LeafType.js';
import type { GroupType } from './GroupType.js';
import { EntityPosition, fromStereotype } from './EntityPosition.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import { GUILLEMET_DOUBLE_COMPARATOR } from '../stereo/StereotypeDecoration.js';
import { Stereostyles } from './Stereostyles.js';
import type { Stereotag } from './Stereotag.js';
import { Colors } from './Colors.js';
import { CucaNote } from './CucaNote.js';
import { Position } from './Position.js';
import type { Direction } from './Direction.js';
import type { Kal } from './Kal.js';
import type { Neighborhood } from './Neighborhood.js';
import type { IEntityImage } from './IEntityImage.js';
import type { Together } from './Together.js';
import type { DisplayPositioned } from './DisplayPositioned.js';
import type { CucaDiagram } from '../cucadiagram/CucaDiagram.js';
import type { StyleBuilder } from './ISkinParam.js';
import type { Bodier } from '../cucadiagram/Bodier.js';
import type { USymbol } from '../decoration/symbol/USymbol.js';
import { Margins } from '../svek/image/EntityImageDescriptionSupport.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Url } from '../url/Url.js';
import type { LineLocation } from '../tim/LineLocation.js';
import type { Entity } from './Entity.js';

/** `StringUtils.getUid` slice (`uid1 + String.format("%04d", uid2)`) —
 * same local-slice convention as `skin/VisibilityModifier.ts`'s
 * `StringUtils` object; move when the full `StringUtils` port lands.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:444-446 */
const StringUtils = {
  getUid(uid1: string, uid2: number): string {
    return uid1 + String(uid2).padStart(4, '0');
  },
} as const;

/**
 * EntityBase — TS-ONLY file-split artifact, NOT an upstream class:
 * upstream `abel/Entity.java` is a single 775-line class, and this
 * repo's 500-line file cap forces a split with no upstream file
 * boundary to split along. This base carries the fields (:91-134), the
 * constructor (:162-188), and every member through `checkNotGroup`
 * (:137-363); `Entity.ts` extends it with the rest (:365-773). All
 * member names/bodies are upstream's; Java-`private` fields become
 * `protected` solely so the derived half can reach them (each is
 * `private` upstream). Journaled (T5). Never instantiate this class —
 * always `Entity`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:89-363
 */
export abstract class EntityBase {
  /** Fields, upstream order (Java: all private). @see abel/Entity.java:91-134 */
  protected readonly currentStyleBuilder: StyleBuilder;
  protected readonly diagram: CucaDiagram;
  protected readonly quark: Quark<Entity>;
  protected url: Url | undefined;
  protected readonly bodier: Bodier;
  protected readonly uid: string;
  protected display: Display = Display.empty();
  protected legend: DisplayPositioned | undefined = undefined;
  protected leafType: LeafType | undefined;
  protected stereotype: Stereotype | undefined;
  protected stereostyles: Stereostyles = Stereostyles.NONE;
  protected generic: string | undefined;
  protected groupType: GroupType | undefined;
  // Other
  protected margins: Margins = Margins.NONE;
  protected readonly portShortNames = new Set<string>();
  protected xposition = 0;
  protected svekImage: IEntityImage | undefined;
  protected symbol: USymbol | undefined;
  protected readonly rawLayout: number;
  /** Java `char` (default `'\u0000'`). @see abel/Entity.java:118 */
  protected concurrentSeparator = '\u0000';
  protected readonly location: LineLocation | undefined;
  /** Java `LinkedHashSet<Stereotag>` with equals-by-name — reproduced as
   * a name-keyed insertion-ordered `Map` (first add wins, like
   * `Set#add`). @see abel/Entity.java:122 */
  protected readonly tags = new Map<string, Stereotag>();
  protected readonly notesTop: CucaNote[] = [];
  protected readonly notesBottom: CucaNote[] = [];
  protected together: Together | undefined;
  protected packed = false;
  /** Java field `isStatic` — renamed: TS cannot hold a field and a
   * method of the same name. @see abel/Entity.java:129 */
  protected staticFlag = false;
  protected readonly kals = new Map<Direction, Kal[]>();
  protected visibility: VisibilityModifier | undefined;
  protected neighborhood: Neighborhood | undefined;
  protected colors: Colors = Colors.empty();
  protected readonly tips = new Map<string, Display>();

  /** @see abel/Entity.java:137-142 */
  addNote(note: Display, position: Position, colors: Colors): void {
    if (position === Position.TOP) this.notesTop.push(CucaNote.build(note, position, colors));
    else if (position === Position.BOTTOM) this.notesBottom.push(CucaNote.build(note, position, colors));
  }

  /** @see abel/Entity.java:145-151 */
  getNotes(position: Position): readonly CucaNote[] {
    if (position === Position.TOP) return this.notesTop;
    if (position === Position.BOTTOM) return this.notesBottom;
    throw new Error('IllegalArgumentException');
  }

  /** @see abel/Entity.java:153-155 */
  addStereotag(tag: Stereotag): void {
    if (this.tags.has(tag.getName()) === false) this.tags.set(tag.getName(), tag);
  }

  /** @see abel/Entity.java:157-159 */
  stereotags(): readonly Stereotag[] {
    return [...this.tags.values()];
  }

  /**
   * Java's private base constructor (:162-176) merged with BOTH public
   * overloads (:178-188): `LeafType` and `GroupType` are string unions
   * sharing the value `'STATE'`, so the overload pair cannot be
   * runtime-discriminated — exactly one of `leafType`/`groupType` must
   * be non-undefined, enforced (as upstream) by `isGroup()`'s throw.
   *
   * @see abel/Entity.java:162-188
   */
  constructor(
    currentStyleBuilder: StyleBuilder,
    location: LineLocation | undefined,
    quark: Quark<Entity>,
    diagram: CucaDiagram,
    bodier: Bodier,
    leafType: LeafType | undefined,
    groupType: GroupType | undefined,
    rawLayout: number,
  ) {
    // #lizard forgives -- 8 PARAM/22 NLOC mirror upstream's constructor
    // chain verbatim (Entity.java:162-188, the merged overload pair per
    // this constructor's own doc comment); do-not-refactor-while-porting.
    this.location = location;
    this.currentStyleBuilder = currentStyleBuilder;
    this.quark = quark;
    this.diagram = diagram;
    if (quark.isRoot()) this.uid = 'entroot';
    else this.uid = StringUtils.getUid('ent', diagram.getUniqueSequenceValue());

    this.bodier = bodier;
    this.rawLayout = rawLayout;
    this.quark.setData(this as unknown as Entity);
    this.leafType = leafType;
    this.groupType = groupType;
  }

  /** @see abel/Entity.java:190-192 */
  getLeafType(): LeafType | undefined {
    return this.leafType;
  }

  /** Both upstream `muteToType` overloads: the 1-arg mutator (:194-199,
   * `void`) and the 2-arg guarded variant (:206-232, `boolean`),
   * dispatched on argument count.
   * @see abel/Entity.java:194-199 and :206-232 */
  muteToType(newType: LeafType): void;
  muteToType(newType: LeafType, newSymbol: USymbol | undefined): boolean;
  muteToType(newType: LeafType, ...rest: readonly [] | readonly [USymbol | undefined]): boolean | undefined {
    // #lizard forgives(cyclomatic_complexity, nloc, length, token_count) --
    // CCN 23/37 NLOC are upstream's own guard matrix (Entity.java:206-232:
    // the two seven/eight-way LeafType membership tests), ported
    // branch-for-branch; do-not-refactor-while-porting.
    if (rest.length === 0) {
      if (this.leafType === LeafType.CLASS && newType === LeafType.OBJECT) this.bodier.muteClassToObject();
      this.groupType = undefined;
      this.leafType = newType;
      return undefined;
    }
    const newSymbol = rest[0];
    // checkNotGroup();
    if (this.leafType !== LeafType.STILL_UNKNOWN) {
      if (newType === this.leafType) return true;

      if (
        this.leafType !== LeafType.ANNOTATION &&
        this.leafType !== LeafType.ABSTRACT_CLASS &&
        this.leafType !== LeafType.CLASS &&
        this.leafType !== LeafType.ENUM &&
        this.leafType !== LeafType.INTERFACE &&
        this.leafType !== LeafType.RECORD &&
        this.leafType !== LeafType.DATACLASS
      )
        return false;
      // throw new IllegalArgumentException("type=" + leafType);

      if (
        newType !== LeafType.ANNOTATION &&
        newType !== LeafType.ABSTRACT_CLASS &&
        newType !== LeafType.CLASS &&
        newType !== LeafType.ENUM &&
        newType !== LeafType.INTERFACE &&
        newType !== LeafType.RECORD &&
        newType !== LeafType.DATACLASS &&
        newType !== LeafType.OBJECT
      )
        return false;
      // throw new IllegalArgumentException("newtype=" + newType);
    }
    if (this.leafType === LeafType.CLASS && newType === LeafType.OBJECT) this.bodier.muteClassToObject();

    this.leafType = newType;
    this.symbol = newSymbol;
    return true;
  }

  /** @see abel/Entity.java:201-204 */
  muteToGroupType(newType: GroupType): void {
    this.groupType = newType;
    this.leafType = undefined;
  }

  /** @see abel/Entity.java:234-236 */
  getQuark(): Quark<Entity> {
    return this.quark;
  }

  /** @see abel/Entity.java:238-240 */
  getDisplay(): Display {
    return this.display;
  }

  /** @see abel/Entity.java:242-244 */
  setDisplay(display: Display): void {
    this.display = display;
  }

  /** @see abel/Entity.java:246-248 */
  getUid(): string {
    return this.uid;
  }

  /** @see abel/Entity.java:250-252 */
  getStereotype(): Stereotype | undefined {
    return this.stereotype;
  }

  /** @see abel/Entity.java:254-256 */
  setStereotype(stereotype: Stereotype | undefined): void {
    this.stereotype = stereotype;
  }

  /** Java `null` prints as `"null"` in string concatenation — preserved.
   * @see abel/Entity.java:258-260 */
  toString(): string {
    return `${this.quark.toString()} ${this.display.toString()}(${String(this.leafType ?? null)})[${String(
      this.groupType ?? null,
    )}] ${this.getUid()}`;
  }

  /** @see abel/Entity.java:262-264 */
  getUrl99(): Url | undefined {
    return this.url;
  }

  /** @see abel/Entity.java:266-277 */
  hasUrl(): boolean {
    if (Display.isNull(this.display) === false && this.display.hasUrl()) return true;

    if (this.bodier === undefined) return false;

    if (this.bodier.hasUrl()) return true;

    return this.url !== undefined;
  }

  /** @see abel/Entity.java:279-281 */
  addUrl(url: Url): void {
    this.url = url;
  }

  /** @see abel/Entity.java:283-286 */
  getMargins(): Margins {
    this.checkNotGroup();
    return this.margins;
  }

  /** @see abel/Entity.java:288-291 */
  ensureMargins(newMargins: Margins): void {
    // checkNotGroup();
    this.margins = this.margins.merge(newMargins);
  }

  /** @see abel/Entity.java:293-296 */
  getXposition(): number {
    this.checkNotGroup();
    return this.xposition;
  }

  /** @see abel/Entity.java:298-301 */
  setXposition(pos: number): void {
    this.checkNotGroup();
    this.xposition = pos;
  }

  /** @see abel/Entity.java:303-306 */
  getSvekImage(): IEntityImage | undefined {
    this.checkNotGroup();
    return this.svekImage;
  }

  /** @see abel/Entity.java:308-311 */
  setSvekImage(svekImage: IEntityImage): void {
    this.checkNotGroup();
    this.svekImage = svekImage;
  }

  /** @see abel/Entity.java:313-316 */
  setGeneric(generic: string): void {
    this.checkNotGroup();
    this.generic = generic;
  }

  /** @see abel/Entity.java:318-321 */
  getGeneric(): string | undefined {
    this.checkNotGroup();
    return this.generic;
  }

  /** @see abel/Entity.java:323-325 */
  getBodier(): Bodier {
    return this.bodier;
  }

  /** @see abel/Entity.java:327-349 */
  getEntityPosition(): EntityPosition {
    if (this.leafType === LeafType.PORTIN) return EntityPosition.PORTIN;

    if (this.leafType === LeafType.PORTOUT) return EntityPosition.PORTOUT;

    if (this.leafType !== LeafType.STATE) return EntityPosition.NORMAL;

    if (this.quark.isRoot()) return EntityPosition.NORMAL;

    const stereotype = this.getStereotype();
    if (stereotype === undefined) return EntityPosition.NORMAL;

    // Java would NPE on a label-less stereotype; '' yields NORMAL.
    return fromStereotype(stereotype.getLabel(GUILLEMET_DOUBLE_COMPARATOR) ?? '');
  }

  // ----------

  /** @see abel/Entity.java:353-357 */
  protected checkGroup(): void {
    if (this.isGroup() === false) throw new Error('UnsupportedOperationException');
  }

  /** @see abel/Entity.java:359-363 */
  protected checkNotGroup(): void {
    if (this.isGroup()) throw new Error('UnsupportedOperationException');
  }

  /** Defined in the derived half (`Entity.ts`, :378-391); declared here
   * because `checkGroup`/`checkNotGroup` call it. */
  abstract isGroup(): boolean;
}
