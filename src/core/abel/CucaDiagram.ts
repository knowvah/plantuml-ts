import type { Entity } from './Entity.js';
import type { Link } from './Link.js';
import type { ISkinParam } from './ISkinParam.js';

/**
 * DiagramType — the 39-value diagram-kind selector
 * (`core/DiagramType.java`). SI1/T5 consumed-slice LOCAL declaration
 * (values only — `Entity#getDiagramType` pipes it through untouched;
 * `isLegacyUML`/`findStartTypes`/`getSpecial` land with the `core/`
 * package port, which should move this to `src/core/code/` alongside
 * the other core types). NOT this port's `block-extractor.ts`
 * `DiagramType` (a lowercase engine-routing union — different
 * semantics, per that file's own scope). Journaled (T5).
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
 * CucaDiagram — ADR-2 consumed-interface stub for the diagram backref
 * (`net/atmp/CucaDiagram.java`, T10's write-set). Declares exactly the
 * member surface `Entity` calls on `this.diagram`; T10's real class
 * (`src/core/cucadiagram/CucaDiagram.ts`) implements it, keeping these
 * exact signatures. Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java
 */
export interface CucaDiagram {
  /** Feeds `StringUtils.getUid("ent", ...)` in the `Entity` constructor.
   * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (getUniqueSequenceValue) */
  getUniqueSequenceValue(): number;

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (getLinks) */
  getLinks(): readonly Link[];

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (removeLink) */
  removeLink(link: Link): void;

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (isHidden) */
  isHidden(leaf: Entity): boolean;

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (isRemoved) */
  isRemoved(leaf: Entity): boolean;

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (isRemovedIgnoreUnlinked) */
  isRemovedIgnoreUnlinked(leaf: Entity): boolean;

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (getSkinParam) */
  getSkinParam(): ISkinParam;

  /** @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (getDiagramType) */
  getDiagramType(): DiagramType;

  /** The plantuml#2171 backward-compatibility probe read by
   * `Entity#getCurrentStyleBuilder`.
   * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java (isSkinParamUsed) */
  isSkinParamUsed(): boolean;
}
