/**
 * class-assoc-subsume.ts — the "subsume an explicit A-B association into a
 * couple" mechanism (`Association#createNew`'s `existingLink`/`removeLink`
 * lookup), split out of `class-assoc-couple.ts` to keep that file under the
 * project's 500-line cap (G2 N20 -- pure move, no behavior change; every
 * symbol here was previously defined verbatim in that file).
 */
import type { ClassDiagramAST, Relationship, LinkDecor } from './ast.js';
import { EDGE_DECORATION_MAP } from './class-dot-edges.js';

export interface SubsumedLink {
  /**
   * E3-17: the removed link's own `getEntity1()`
   * (`Association#createNew`, `objectdiagram/AbstractClassOrObjectDiagram
   * .java:259`) — this is the entity the couple's "a-edge" (jar's
   * `entity1ToPoint`) attaches to, NOT necessarily the couple's own `aId`.
   * Sourced from `Relationship.idEntity1FullId` (swapped ONLY by the
   * removed link's own `-up-`/`-left-` direction word — the ONE swap
   * jar's `cl1`/`cl2` actually undergo via `Link#getInv()`), NEVER
   * `Relationship.from` (swapped by `swapDirection`, which ALSO folds in
   * arrowhead-decor direction — "no longer upstream's cl1/cl2", that
   * field's own doc comment, class-relationship-ast.ts). `idEntity1FullId`
   * is absent for a subsumed edge built outside the arrow-token grammar
   * (couple/lollipop/map row); falls back to `ex.from` there. `undefined`
   * when no explicit A-B association existed to subsume — `makeCoupleCircle`
   * then falls back to the couple's own `aId`, matching jar's own fallback
   * `existingLink = new Link(location, ..., entity1, entity2, LinkDecor
   * .NONE, LinkDecor.NONE, ...)`, whose `entity1` IS the couple's `aId`
   * (`Association`'s ctor stores the couple's own params, `:222-225`).
   */
  entity1Id: string | undefined;
  /** The removed link's own `getEntity2()`, `Relationship.idEntity2FullId`
   *  — see {@link entity1Id}'s doc comment. */
  entity2Id: string | undefined;
  a: string | undefined;
  b: string | undefined;
  portA: string | undefined;
  portB: string | undefined;
  length: number | undefined;
  label: string | undefined;
  linkNote: string | undefined;
  /**
   * G2 N8/E3-17: the subsumed edge's own per-end decor AT {@link
   * entity1Id}'s/{@link entity2Id}'s own end — `Relationship
   * .idEntity1Decor`/`.idEntity2Decor` when present (already resolved
   * against the SAME entity1/2 orientation as `entity1Id` above), else
   * `ex.sourceDecor`/`targetDecor` (falling back to
   * `EDGE_DECORATION_MAP[ex.type]`, `layout.ts#buildEdgeGeos`'s own
   * resolution) re-oriented by whether `ex.from` landed on the entity1 or
   * entity2 side — feeds `Association#createNew`'s `getPart1()`/
   * `getPart2()` split (decor1→`entity1ToPoint`'s OWN end, NONE at the
   * circle end; decor2→`pointToEntity2`'s OWN end, NONE at the circle
   * end). No re-orientation by the couple's `aId`/`bId`.
   */
  aSideDecor: LinkDecor | undefined;
  bSideDecor: LinkDecor | undefined;
  /** The subsumed edge's own body dash-style — carried to BOTH new entity
   *  edges unchanged (`LinkType`'s `linkStyle` is untouched by `getPart1()`/
   *  `getPart2()`, only `decor1`/`decor2` are split). */
  dashed: boolean | undefined;
  /**
   * G2 N19: the REMOVED explicit edge's own `Relationship.creationIndex`
   * (when it had one) — jar's raw shared counter ALREADY advanced past this
   * relationship's own real `Link()` construction, back when the plain
   * `A -- B` line was first parsed; `removeLink(existingLink)`
   * (`Association#createNew`, no NEW `Link()` call) does NOT un-burn that
   * slot. Dense re-numbering must NOT silently collapse this gap the way it
   * correctly collapses a phantom classifier stub that never became a real
   * jar `Entity` at all (`renderer-uid.ts`'s own module doc comment) — this
   * removed link WAS real. Fed into `Classifier.subsumedLinkCreationIndex`
   * (ast.ts) so `renderer-uid.ts` can inject the missing phantom rank.
   * Jar-verified: `jaloja-18-tisu915`'s `Enrollment` (auto-created by the
   * couple's own `ensure(c)` AFTER the subsumed `Student -- Course` line)
   * numbers ent0004, not the naively-dense ent0003.
   */
  creationIndex: number | undefined;
  /**
   * E3-16: true when the removed link ITSELF burned a preceding phantom
   * uid rank (`Relationship.phantomSlot`'s own doc comment — the removed
   * link was an INVERTED `-up-`/`-left-` link, whose jar `getInv()`
   * construction burns TWO `cpt1` ticks, `abel/Link.java:135,145-146`).
   * `removeLink(existingLink)` un-burns neither tick, so `makeCoupleCircle`
   * must inject BOTH the removed link's own rank ({@link creationIndex},
   * already carried via `Classifier.subsumedLinkCreationIndex`) AND this
   * earlier one (`Classifier.subsumedLinkPhantomSlot`) — otherwise every
   * uid after the couple is numbered one too low (jar-verified:
   * `besepi-37-rori892`'s `ent0028`/`ia_125` renders `ent0027` without it).
   */
  phantomSlot: boolean | undefined;
}

export const EMPTY_SUBSUMED: SubsumedLink = {
  entity1Id: undefined,
  entity2Id: undefined,
  a: undefined,
  b: undefined,
  portA: undefined,
  portB: undefined,
  length: undefined,
  label: undefined,
  linkNote: undefined,
  aSideDecor: undefined,
  bSideDecor: undefined,
  dashed: undefined,
  creationIndex: undefined,
  phantomSlot: undefined,
};

/** Index of the LAST relationship directly between aId/bId (either direction),
 *  mirroring `AbstractClassOrObjectDiagram#foundLink`'s backward scan — when
 *  TWO relationships exist between the same pair (begico-70-guva302: a
 *  composition AND a later separate dotted association between
 *  `research`/`correlations`), the couple subsumes the MOST RECENTLY declared
 *  one, leaving earlier ones as their own separate edges. -1 when none. */
function findLastAssociationIndex(rels: readonly Relationship[], aId: string, bId: string): number {
  for (let i = rels.length - 1; i >= 0; i--) {
    const r = rels[i]!;
    if ((r.from === aId && r.to === bId) || (r.from === bId && r.to === aId)) return i;
  }
  return -1;
}

/** `existingLink.getEntity1()`/`getEntity2()` for the removed edge `ex` --
 *  see `SubsumedLink.entity1Id`'s doc comment. Split out purely for the
 *  complexity-hook CCN cap. */
function subsumedEntityIds(ex: Relationship): [entity1Id: string, entity2Id: string] {
  return [ex.idEntity1FullId ?? ex.from, ex.idEntity2FullId ?? ex.to];
}

/** {@link subsumeExplicitAssociation}'s from/to-keyed sided fields
 *  (multiplicity/port/decor), re-oriented onto the entity1/entity2 sides —
 *  split out purely for the complexity-hook CCN cap. `fromIsEntity1` is
 *  `ex.from === entity1Id` (see that function's own doc comment). */
function orientSidedFields(
  ex: Relationship,
  fromIsEntity1: boolean,
  exSourceDecor: LinkDecor,
  exTargetDecor: LinkDecor,
): Pick<SubsumedLink, 'a' | 'b' | 'portA' | 'portB' | 'aSideDecor' | 'bSideDecor'> {
  const [a, b] = fromIsEntity1 ? [ex.fromMultiplicity, ex.toMultiplicity] : [ex.toMultiplicity, ex.fromMultiplicity];
  const [portA, portB] = fromIsEntity1 ? [ex.fromPort, ex.toPort] : [ex.toPort, ex.fromPort];
  const [defaultA, defaultB] = fromIsEntity1 ? [exSourceDecor, exTargetDecor] : [exTargetDecor, exSourceDecor];
  return {
    a,
    b,
    portA,
    portB,
    aSideDecor: ex.idEntity1Decor ?? defaultA,
    bSideDecor: ex.idEntity2Decor ?? defaultB,
  };
}

/**
 * Remove an explicit `A -- B` association (the couple subsumes it) and return
 * its multiplicities/ports/length/label/linkNote/entity ids, ALWAYS relative
 * to the removed link's own `getEntity1()`/`getEntity2()`
 * (`Association#createNew`) — E3-17: the couple's `(A,B)` syntax order plays
 * NO part in this orientation (see `SubsumedLink.entity1Id`'s doc comment);
 * `makeCoupleCircle` applies the `aId`/`bId` fallback only when nothing was
 * subsumed. A `Class::member` port on the subsumed edge still shields the
 * classifier — see `makeCoupleCircle`'s `portA`/`portB` comment. Returns
 * all-`undefined` when none existed.
 */
export function subsumeExplicitAssociation(ast: ClassDiagramAST, aId: string, bId: string): SubsumedLink {
  const idx = findLastAssociationIndex(ast.relationships, aId, bId);
  if (idx < 0) return EMPTY_SUBSUMED;
  const ex = ast.relationships[idx]!;
  ast.relationships.splice(idx, 1);
  // Effective per-end decor, resolved the same way `layout.ts#buildEdgeGeos`
  // resolves a relationship's own decor (explicit override, else the
  // type-derived default) — see `SubsumedLink.aSideDecor`'s doc comment.
  const decor = EDGE_DECORATION_MAP[ex.type];
  const exSourceDecor = ex.sourceDecor ?? decor.sourceDecor;
  const exTargetDecor = ex.targetDecor ?? decor.targetDecor;
  const exDashed = ex.dashed ?? decor.dashed;
  // E3-17: see SubsumedLink.entity1Id's doc comment. `fromIsEntity1` then
  // re-orients the from/to-keyed multiplicity/port/decor fields onto the
  // entity1/entity2 sides.
  const [entity1Id, entity2Id] = subsumedEntityIds(ex);
  const fromIsEntity1 = ex.from === entity1Id;
  return {
    entity1Id,
    entity2Id,
    ...orientSidedFields(ex, fromIsEntity1, exSourceDecor, exTargetDecor),
    phantomSlot: ex.phantomSlot,
    length: ex.length,
    label: ex.label,
    linkNote: ex.linkNote,
    dashed: exDashed,
    creationIndex: ex.creationIndex,
  };
}
