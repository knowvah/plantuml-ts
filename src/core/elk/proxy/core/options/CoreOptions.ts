import { ELK_OPTION_TYPE, elkProperty } from '../../../elk-object.js';

/**
 * The `org.eclipse.elk.core.options.CoreOptions` fields upstream reflects, in
 * upstream's declaration order. Each carries ELK's option id and its
 * `LayoutOptionData.Type`, both read off the option's registration in ELK
 * 0.12.0 (elkjs `lib/elk-worker.js`, line cited per field).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/proxy/core/options/CoreOptions.java:5-23
 */
export const CoreOptions = {
  /** elk-worker.js:68700, `Direction` */
  DIRECTION: elkProperty('DIRECTION', 'org.eclipse.elk.direction', ELK_OPTION_TYPE.ENUM),
  /** elk-worker.js:68767, `Boolean` */
  EDGE_LABELS_INLINE: elkProperty('EDGE_LABELS_INLINE', 'org.eclipse.elk.edgeLabels.inline', ELK_OPTION_TYPE.BOOLEAN),
  /** elk-worker.js:68762, `EnumSet<SizeConstraint>` */
  NODE_SIZE_CONSTRAINTS: elkProperty(
    'NODE_SIZE_CONSTRAINTS',
    'org.eclipse.elk.nodeSize.constraints',
    ELK_OPTION_TYPE.ENUMSET,
  ),
  /** elk-worker.js:68703, `HierarchyHandling` */
  HIERARCHY_HANDLING: elkProperty('HIERARCHY_HANDLING', 'org.eclipse.elk.hierarchyHandling', ELK_OPTION_TYPE.ENUM),
  /** elk-worker.js:68766, `EdgeLabelPlacement` */
  EDGE_LABELS_PLACEMENT: elkProperty(
    'EDGE_LABELS_PLACEMENT',
    'org.eclipse.elk.edgeLabels.placement',
    ELK_OPTION_TYPE.ENUM,
  ),
  /** elk-worker.js:68796, `EdgeType` */
  EDGE_TYPE: elkProperty('EDGE_TYPE', 'org.eclipse.elk.edge.type', ELK_OPTION_TYPE.ENUM),
  /** elk-worker.js:68756, `EnumSet<NodeLabelPlacement>` */
  NODE_LABELS_PLACEMENT: elkProperty(
    'NODE_LABELS_PLACEMENT',
    'org.eclipse.elk.nodeLabels.placement',
    ELK_OPTION_TYPE.ENUMSET,
  ),
  /** elk-worker.js:68763, `EnumSet<SizeOptions>` */
  NODE_SIZE_OPTIONS: elkProperty('NODE_SIZE_OPTIONS', 'org.eclipse.elk.nodeSize.options', ELK_OPTION_TYPE.ENUMSET),
  /** elk-worker.js:68704, `ElkPadding` */
  PADDING: elkProperty('PADDING', 'org.eclipse.elk.padding', ELK_OPTION_TYPE.OBJECT),
} as const;
