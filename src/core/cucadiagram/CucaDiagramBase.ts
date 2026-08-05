import { TitledDiagram } from '../TitledDiagram.js';
import type { DiagramType, Previous, UmlSource } from '../TitledDiagram.js';
import type { PreprocessingArtifact } from '../tim/PreprocessingArtifact.js';
import { Plasma } from '../plasma/Plasma.js';
import type { Quark } from '../plasma/Quark.js';
import { Entity } from '../abel/Entity.js';
import { Together } from '../abel/Together.js';
import type { Bag } from '../abel/Bag.js';
import type { EntityGender } from '../abel/EntityGender.js';
import type { EntityPortion } from '../abel/EntityPortion.js';
import { GroupType } from '../abel/GroupType.js';
import { type LeafType, isLikeClass } from '../abel/LeafType.js';
import type { Link } from '../abel/Link.js';
import type { StyleBuilder } from '../abel/ISkinParam.js';
import type { Bodier } from './Bodier.js';
import type { HideOrShow } from './HideOrShow.js';
import { Display } from '../klimt/creole/Display.js';
import type { USymbol } from '../decoration/symbol/USymbol.js';
import type { LineLocation } from '../tim/LineLocation.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import { Failable } from '../gantt/Failable.js';
import { CommandExecutionResult } from '../command/CommandExecutionResult.js';
import type { ParserPass } from '../command/ParserPass.js';
import type { CucaDiagram } from './CucaDiagram.js';

/**
 * EntityHideOrShow — one recorded `hide`/`show` PORTION directive
 * (gender predicate + portion + show flag). Upstream: a static inner
 * class of `CucaDiagram` with private fields the outer class reads
 * directly (Java inner-class access); `readonly` publics here because
 * the TS file split puts the readers in `CucaDiagram.ts`. Exported for
 * that file only.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:111-121
 */
export class EntityHideOrShow {
  readonly gender: EntityGender;
  readonly portion: EntityPortion;
  readonly show: boolean;

  constructor(gender: EntityGender, portion: EntityPortion, show: boolean) {
    this.gender = gender;
    this.portion = portion;
    this.show = show;
  }
}

/**
 * CucaDiagramBase — TS-ONLY file-split artifact, NOT an upstream
 * class: upstream `net/atmp/CucaDiagram.java` is a single 953-line
 * class, and this repo's 500-line file cap forces a split with no
 * upstream file boundary to split along (`EntityBase.ts`/`LinkBase.ts`
 * precedent). This base carries the fields (:123-143), the constructor
 * (:151-158), and every member through `isGroup` (:145-395);
 * `CucaDiagram.ts` extends it with the rest (:397-953). All member
 * names/bodies are upstream's; Java-`private` fields become
 * `protected` solely so the derived half can reach them, and
 * `eventuallyBuildPhantomGroups` becomes `protected` because the
 * derived half's `getTextBlock` calls it. Members the base calls but
 * the derived half defines are declared `abstract` here (the
 * `EntityBase#isGroup` pattern). Never instantiate this class — always
 * a `CucaDiagram` subclass.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:109-395
 */
export abstract class CucaDiagramBase extends TitledDiagram {
  /** Fields, upstream order (Java: all private; `AtomicInteger` →
   * `number`, single-threaded JS). @see net/atmp/CucaDiagram.java:123-143 */
  protected readonly hideOrShows: EntityHideOrShow[] = [];
  protected readonly hideVisibilityModifier = new Set<VisibilityModifier>();

  protected readonly hides2: HideOrShow[] = [];
  protected readonly removed: HideOrShow[] = [];

  protected cpt1 = 0;
  protected cpt2 = 0;

  private stacks: Bag[] = [];

  protected visibilityModifierPresent = false;

  protected readonly links: Link[] = [];

  protected readonly namespace: Plasma<Entity>;
  protected readonly root: Quark<Entity>;

  protected rawLayout = 0;
  protected lastEntity: Entity | undefined = undefined;
  protected warningOrError: string | undefined = undefined;

  /** @see net/atmp/CucaDiagram.java:145-149 */
  override setNamespaceSeparator(namespaceSeparator: string | undefined): void {
    super.setNamespaceSeparator(namespaceSeparator);
    this.setSeparator(namespaceSeparator);
  }

  /** The root `Entity` is created with Java `null` styleBuilder/bodier
   * (the one null-passing call site of T5's merged constructor, whose
   * parameter types follow every OTHER caller — cast, journaled), and
   * `this` is cast to the finished `CucaDiagram` type every real
   * instance has.
   * @see net/atmp/CucaDiagram.java:151-158 */
  constructor(
    source: UmlSource,
    type: DiagramType,
    previous: Previous | undefined,
    preprocessing: PreprocessingArtifact,
  ) {
    super(source, type, previous, preprocessing);
    this.namespace = new Plasma<Entity>();
    this.root = this.namespace.root();
    new Entity(
      undefined as unknown as StyleBuilder,
      undefined,
      this.root,
      this as unknown as CucaDiagram,
      undefined as unknown as Bodier,
      undefined,
      GroupType.ROOT,
      0,
    );

    this.stacks.push(this.root.getData() as Entity);
  }

  /** @see net/atmp/CucaDiagram.java:160-166 */
  startingPass(pass: ParserPass): void {
    void pass;
    this.setLastEntity(undefined);
    this.cpt2 = 0;
    if (this.stacks.length > 1) this.stacks.splice(1);
  }

  /** @see net/atmp/CucaDiagram.java:168-175 */
  getPortFor(entString: string, ident: Quark<Entity>): string | undefined {
    const x = entString.lastIndexOf('::');
    if (x === -1) return undefined;
    if (entString.startsWith(ident.getName())) return entString.substring(x + 2);
    return undefined;
  }

  /** @see net/atmp/CucaDiagram.java:177-186 */
  getCurrentGroup(): Entity {
    let pos = this.stacks.length - 1;
    while (pos >= 0) {
      const tmp = this.stacks[pos];
      if (tmp instanceof Entity) return tmp;
      pos--;
    }
    throw new Error('IllegalStateException');
  }

  /** @see net/atmp/CucaDiagram.java:188-194 */
  currentTogether(): Together | undefined {
    const pos = this.stacks.length - 1;
    const tmp = this.stacks[pos];
    if (tmp instanceof Together) return tmp;
    return undefined;
  }

  /** @see net/atmp/CucaDiagram.java:196-200 */
  cleanId(id: string | undefined): string | undefined {
    if (id === undefined) return undefined;
    return StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote(id);
  }

  /** NOTE: transitively reaches `Entity#hasUrl`, whose `Display.hasUrl`
   * seam is a pre-existing ADR-8 deferred throw (T5 note) — this
   * member throws today for any diagram with a displayed entity.
   * @see net/atmp/CucaDiagram.java:202-211 */
  hasUrl(): boolean {
    for (const quark of this.quarks()) {
      const ent = quark.getData();
      if (ent !== undefined && ent.hasUrl()) return true;
    }

    return false;
  }

  /** @see net/atmp/CucaDiagram.java:213-215 */
  setLastEntity(last: Entity | undefined): void {
    this.lastEntity = last;
  }

  /** @see net/atmp/CucaDiagram.java:217-218 */
  protected updateLasts(result: Entity): void {
    void result;
  }

  /** @see net/atmp/CucaDiagram.java:220-244 */
  reallyCreateLeaf(
    location: LineLocation | undefined,
    ident: Quark<Entity>,
    display: Display,
    type: LeafType,
    symbol: USymbol | undefined,
  ): Entity {
    if (type == null) throw new Error('NullPointerException');
    if (ident.getData() !== undefined) throw new Error('IllegalStateException');
    if (Display.isNull(display)) throw new Error('IllegalArgumentException');

    const result = this.createLeaf(location, ident, this as unknown as CucaDiagram, type, this.getHidesVisibilityModifier());
    result.setUSymbol(symbol);
    this.lastEntity = result;

    result.setTogether(this.currentTogether());

    this.updateLasts(result);
    //			if (type == LeafType.OBJECT)
    //				((EntityImp) parent.getData()).muteToType2(type);
    result.setDisplay(display);

    if (isLikeClass(type)) this.eventuallyBuildPhantomGroups(location);

    return result;
  }

  /** @see net/atmp/CucaDiagram.java:246-248 */
  quarkInContext(reuseExistingChild: boolean, full: string): Quark<Entity> {
    return this.quarkInContextSafe(reuseExistingChild, full).get();
  }

  /** The `firstPackageDoesExist` flag survives; the "not a package"
   * probe checks `first` directly so TS narrows it (same evaluation
   * order). The `TeaVM.a()`-gated assert is dropped (T5 precedent) —
   * `byName` is non-null whenever `countByName(full) == 1`.
   * @see net/atmp/CucaDiagram.java:250-288 */
  quarkInContextSafe(reuseExistingChild: boolean, full: string): Failable<Quark<Entity>> {
    // #lizard forgives -- upstream's own branch matrix
    // (net/atmp/CucaDiagram.java:250-288), ported branch-for-branch;
    // do-not-refactor-while-porting.
    const sep = this.getNamespaceSeparator();
    if (sep === undefined) {
      const result = this.firstWithName(full);
      if (result !== undefined) return Failable.ok(result);
      return Failable.ok(this.getCurrentGroup().getQuark().child(full));
    } else {
      if (badName(sep, full)) return Failable.error('Bad name since ' + sep + ' is a separator', 3);
    }

    const currentQuark = this.getCurrentGroup().getQuark();
    if (full.startsWith(sep)) return Failable.ok(this.root.child(full.substring(sep.length)));
    const x = full.indexOf(sep);
    if (x === -1) {
      if (reuseExistingChild && this.countByName(full) === 1) {
        const byName = this.firstWithName(full) as Quark<Entity>;
        if (byName !== currentQuark) return Failable.ok(byName);
      }
      return Failable.ok(currentQuark.child(full));
    }

    const first = this.root.childIfExists(full.substring(0, x));

    const firstPackageDoesExist = first !== undefined;

    if (first !== undefined && first.getData() !== undefined && (first.getData() as Entity).isGroup() === false)
      return Failable.error('Not a package: ' + full.substring(0, x));

    if (firstPackageDoesExist) return Failable.ok(this.root.child(full));
    return Failable.ok(currentQuark.child(full));
  }

  /** @see net/atmp/CucaDiagram.java:300-308 */
  removePortId(id: string): string {
    // To be kept
    if (this.getNamespaceSeparator() === '::') return id;
    const x = id.lastIndexOf('::');
    if (x === -1) return id;
    return id.substring(0, x);
  }

  /** @see net/atmp/CucaDiagram.java:310-318 */
  getPortId(id: string): string | undefined {
    // To be kept
    if (this.getNamespaceSeparator() === '::') return undefined;
    const x = id.lastIndexOf('::');
    if (x === -1) return undefined;
    return id.substring(x + 2);
  }

  /** @see net/atmp/CucaDiagram.java:320-323 */
  getChildrenGroups(entity: Entity): readonly Entity[] {
    return entity.groups();
  }

  /** Private upstream; `protected` because the derived half's
   * `getTextBlock` calls it (file-split visibility, class doc).
   * @see net/atmp/CucaDiagram.java:325-337 */
  protected eventuallyBuildPhantomGroups(location: LineLocation | undefined): void {
    for (const quark of this.quarks()) {
      if (quark.getData() !== undefined) continue;
      const countChildren = quark.countChildren();
      if (countChildren > 0) {
        // final Display display = Display.getWithNewlines(quark.getQualifiedName());
        const display = Display.getWithNewlines(this.getPragma(), quark.getName());
        const result = this.createGroup(location, quark, GroupType.PACKAGE);
        result.setDisplay(display);
      }
    }
  }

  /** @see net/atmp/CucaDiagram.java:339-342 */
  gotoTogether(): CommandExecutionResult {
    this.stacks.push(new Together(this.currentTogether()));
    return CommandExecutionResult.ok();
  }

  /** Java's 4-arg overload (:344-347) delegates to the 5-arg one with
   * `null` — merged via the optional trailing parameter.
   * @see net/atmp/CucaDiagram.java:344-365 */
  gotoGroup(
    location: LineLocation | undefined,
    quark: Quark<Entity>,
    display: Display,
    type: GroupType,
    usymbol?: USymbol,
  ): CommandExecutionResult {
    if (quark.getData() === undefined) {
      const result = this.createGroup(location, quark, type);
      result.setTogether(this.currentTogether());
      result.setDisplay(display);
    }
    const ent = quark.getData() as Entity;
    ent.muteToGroupType(type);
    if (usymbol !== undefined) ent.setUSymbol(usymbol);

    this.stacks.push(quark.getData() as Entity);

    return CommandExecutionResult.ok();
  }

  /** @see net/atmp/CucaDiagram.java:367-374 */
  endGroup(): boolean {
    if (this.stacks.length > 0) {
      this.stacks.pop();
      return true;
    }
    return false;
  }

  /** @see net/atmp/CucaDiagram.java:376-381 */
  getGroup(code: string): Entity | undefined {
    const quark = this.firstWithName(code);
    if (quark === undefined) return undefined;
    return quark.getData();
  }

  /** Java's `isGroup(String)` (:383-388) / `isGroup(Quark)` (:390-395)
   * overload pair, `typeof`-dispatched (runtime-discriminable, unlike
   * T5's LeafType/GroupType constructor case).
   * @see net/atmp/CucaDiagram.java:383-395 */
  isGroup(code: string | Quark<Entity>): boolean {
    if (typeof code === 'string') {
      const quark = this.firstWithName(code);
      if (quark === undefined) return false;
      return this.isGroup(quark);
    }
    const ent = code.getData();
    if (ent === undefined) return false;
    return ent.isGroup();
  }

  // ---- members the derived half (`CucaDiagram.ts`) defines and this
  // half calls — abstract declarations only (file-split seam).

  /** Defined in the derived half (:824-839). */
  abstract createLeaf(
    location: LineLocation | undefined,
    quark: Quark<Entity>,
    diagram: CucaDiagram,
    entityType: LeafType,
    hideVisibilityModifier: ReadonlySet<VisibilityModifier>,
  ): Entity;

  /** Defined in the derived half (:840-850). */
  abstract createGroup(location: LineLocation | undefined, quark: Quark<Entity>, groupType: GroupType): Entity;

  /** Defined in the derived half (:918-924). */
  abstract quarks(): readonly Quark<Entity>[];

  /** Defined in the derived half (:931-933). */
  abstract setSeparator(namespaceSeparator: string | undefined): void;

  /** Defined in the derived half (:935-937). */
  abstract firstWithName(full: string): Quark<Entity> | undefined;

  /** Defined in the derived half (:939-941). */
  abstract countByName(full: string): number;

  /** Defined in the derived half (:642-644). */
  abstract getHidesVisibilityModifier(): ReadonlySet<VisibilityModifier>;
}

/** Private upstream member of `CucaDiagram` — a module-level function
 * here (it touches no instance state).
 * @see net/atmp/CucaDiagram.java:290-298 */
function badName(separator: string, full: string): boolean {
  if (full.endsWith(separator)) return true;

  if (full.includes(separator + separator)) return true;

  return false;
}

/** `StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote` slice —
 * same local-slice convention as `abel/EntityBase.ts`'s `getUid` slice;
 * move when the full `StringUtils` port lands. The 1-arg form (:83-87)
 * delegates to the 2-arg form (:63-81) with format `"([:`; smart/
 * guillemet double quotes count as `"` (:89-91).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:63-91 */
const StringUtils = {
  eventuallyRemoveStartingAndEndingDoubleQuote(s: string, format = '"([:'): string {
    if (format.includes('"') && s.length > 1 && isDoubleQuote(s.charAt(0)) && isDoubleQuote(s.charAt(s.length - 1)))
      return s.substring(1, s.length - 1);

    if (format.includes('(') && s.startsWith('(') && s.endsWith(')')) return s.substring(1, s.length - 1);

    if (format.includes('[') && s.startsWith('[') && s.endsWith(']')) return s.substring(1, s.length - 1);

    if (format.includes(':') && s.startsWith(':') && s.endsWith(':')) return s.substring(1, s.length - 1);

    // #lizard forgives -- CCN 14 is upstream's own quote-format branch
    // matrix (StringUtils.java:63-81), ported branch-for-branch;
    // do-not-refactor-while-porting.
    return s;
  },
} as const;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:89-91 */
function isDoubleQuote(c: string): boolean {
  return c === '"' || c === '“' || c === '”' || c === '«' || c === '»';
}
