/**
 * `ElkWithProperty#setProperty`'s three branches (ElkWithProperty.java:29-46):
 * what each kind of value becomes before ELK sees it.
 */
import { describe, expect, it } from 'vitest';

import { trueValueOf } from '../../../src/core/elk/proxy/graph/ElkWithProperty.js';
import { Direction } from '../../../src/core/elk/proxy/core/options/Direction.js';
import { EdgeLabelPlacement } from '../../../src/core/elk/proxy/core/options/EdgeLabelPlacement.js';
import { HierarchyHandling } from '../../../src/core/elk/proxy/core/options/HierarchyHandling.js';
import { NodeLabelPlacement } from '../../../src/core/elk/proxy/core/options/NodeLabelPlacement.js';
import { SizeConstraint } from '../../../src/core/elk/proxy/core/options/SizeConstraint.js';
import { ElkPadding } from '../../../src/core/elk/proxy/core/math/ElkPadding.js';
import { CoreOptions } from '../../../src/core/elk/proxy/core/options/CoreOptions.js';

describe('trueValueOf', () => {
  it('keeps an EnumSet as a set of PROXY enums, in ordinal order (ElkWithProperty.java:30-39)', () => {
    // The jar's ELK label holds exactly this, printed as
    // `[INSIDE, V_CENTER, H_CENTER]` with element class
    // net.sourceforge.plantuml.elk.proxy.core.options.NodeLabelPlacement.
    expect(
      trueValueOf(new Set([NodeLabelPlacement.INSIDE, NodeLabelPlacement.H_CENTER, NodeLabelPlacement.V_CENTER])),
    ).toEqual({
      kind: 'proxyEnumSet',
      proxyClassName: 'net.sourceforge.plantuml.elk.proxy.core.options.NodeLabelPlacement',
      names: ['INSIDE', 'V_CENTER', 'H_CENTER'],
    });
  });

  it('turns an empty EnumSet into null, the `result == null` the loop leaves', () => {
    expect(trueValueOf(new Set())).toBeNull();
  });

  it('unwraps a single proxy enum through getTrueObject (ElkWithProperty.java:40-42)', () => {
    expect(trueValueOf(EdgeLabelPlacement.TAIL)).toEqual({
      kind: 'enum',
      className: 'org.eclipse.elk.core.options.EdgeLabelPlacement',
      name: 'TAIL',
    });
    expect(trueValueOf(EdgeLabelPlacement.HEAD)).toEqual({
      kind: 'enum',
      className: 'org.eclipse.elk.core.options.EdgeLabelPlacement',
      name: 'HEAD',
    });
    expect(trueValueOf(SizeConstraint.NODE_LABELS)).toEqual({
      kind: 'enum',
      className: 'org.eclipse.elk.core.options.SizeConstraint',
      name: 'NODE_LABELS',
    });
    expect(trueValueOf(new ElkPadding(1, 2, 3, 4))).toEqual({
      kind: 'ElkPadding',
      top: 1,
      right: 2,
      bottom: 3,
      left: 4,
    });
  });

  it('passes a reflected ELK value or a primitive through unchanged (ElkWithProperty.java:43-44)', () => {
    expect(trueValueOf(Direction.DOWN)).toBe(Direction.DOWN);
    expect(Direction.DOWN).toEqual({ kind: 'enum', className: 'org.eclipse.elk.core.options.Direction', name: 'DOWN' });
    expect(HierarchyHandling.INCLUDE_CHILDREN).toEqual({
      kind: 'enum',
      className: 'org.eclipse.elk.core.options.HierarchyHandling',
      name: 'INCLUDE_CHILDREN',
    });
    expect(trueValueOf(true)).toBe(true);
  });

  it('names each proxy enum as Java prints it', () => {
    expect(String(NodeLabelPlacement.H_CENTER)).toBe('H_CENTER');
    expect(
      [NodeLabelPlacement.INSIDE, NodeLabelPlacement.V_CENTER, NodeLabelPlacement.H_CENTER].map((e) => e.ordinal),
    ).toEqual([0, 1, 2]);
  });
});

describe('CoreOptions', () => {
  it('carries the ELK option id and LayoutOptionData type of every field upstream reflects', () => {
    expect(Object.entries(CoreOptions).map(([field, p]) => [field, p.field, p.id, p.type])).toEqual([
      ['DIRECTION', 'DIRECTION', 'org.eclipse.elk.direction', 'ENUM'],
      ['EDGE_LABELS_INLINE', 'EDGE_LABELS_INLINE', 'org.eclipse.elk.edgeLabels.inline', 'BOOLEAN'],
      ['NODE_SIZE_CONSTRAINTS', 'NODE_SIZE_CONSTRAINTS', 'org.eclipse.elk.nodeSize.constraints', 'ENUMSET'],
      ['HIERARCHY_HANDLING', 'HIERARCHY_HANDLING', 'org.eclipse.elk.hierarchyHandling', 'ENUM'],
      ['EDGE_LABELS_PLACEMENT', 'EDGE_LABELS_PLACEMENT', 'org.eclipse.elk.edgeLabels.placement', 'ENUM'],
      ['EDGE_TYPE', 'EDGE_TYPE', 'org.eclipse.elk.edge.type', 'ENUM'],
      ['NODE_LABELS_PLACEMENT', 'NODE_LABELS_PLACEMENT', 'org.eclipse.elk.nodeLabels.placement', 'ENUMSET'],
      ['NODE_SIZE_OPTIONS', 'NODE_SIZE_OPTIONS', 'org.eclipse.elk.nodeSize.options', 'ENUMSET'],
      ['PADDING', 'PADDING', 'org.eclipse.elk.padding', 'OBJECT'],
    ]);
  });
});
