/**
 * class-scale-geo-body.ts — enhanced-body/json-body scaling helpers for
 * `class-scale-geo.ts` (cdd-T29, D4). Split out purely to keep the parent
 * module under this project's 500-line cap; depends on `class-scale-geo-
 * row.ts` for its row/atom-level primitives (`scaleRow`, `scaleAtom`,
 * `scaleDashArrayString`) -- see that module's header for the shared
 * scaling rationale.
 */
import type { JsonBodyItem } from './class-geo-types.js';
import type {
  EnhancedBodyGeo,
  EnhancedBodyPart,
  EnhancedDividerPart,
  EnhancedRowsPart,
  EnhancedTreePart,
  EmbeddedBlockGeo,
} from './class-body-enhanced-layout.js';
import type { EnhancedPortMemberInput } from './class-body-enhanced-ports.js';
import type { TreeConnector } from './class-body-tree.js';
import { scaleRow, scaleDashArrayString } from './class-scale-geo-row.js';

function scalePortMember(p: EnhancedPortMemberInput, k: number): EnhancedPortMemberInput {
  return { ...p, top: p.top * k, height: p.height * k };
}

function scaleTreeConnector(c: TreeConnector, k: number): TreeConnector {
  return {
    bulletX: c.bulletX * k,
    bulletY: c.bulletY * k,
    hx1: c.hx1 * k,
    hx2: c.hx2 * k,
    hy: c.hy * k,
    vx: c.vx * k,
    vy1: c.vy1 * k,
    vy2: c.vy2 * k,
  };
}

/** T27FU: an embedded `{{ }}` nested-diagram block's own placement/sizing
 *  numerics, scaled. `href` (a data URI or inline markup) is untouched. */
export function scaleEmbeddedBlock(block: EmbeddedBlockGeo, k: number): EmbeddedBlockGeo {
  return {
    ...block,
    y: block.y * k,
    width: block.width * k,
    height: block.height * k,
    sizingWidth: block.sizingWidth * k,
    sizingHeight: block.sizingHeight * k,
  };
}

function scaleDividerPart(part: EnhancedDividerPart, k: number): EnhancedDividerPart {
  return {
    ...part,
    y: part.y * k,
    strokeWidth: part.strokeWidth * k,
    ...(part.strokeDasharray !== undefined ? { strokeDasharray: scaleDashArrayString(part.strokeDasharray, k) } : {}),
    ...(part.title !== undefined
      ? { title: { ...part.title, x: part.title.x * k, y: part.title.y * k, width: part.title.width * k } }
      : {}),
  };
}

function scaleRowsPart(part: EnhancedRowsPart, k: number, themeFontSize: number): EnhancedRowsPart {
  return {
    ...part,
    rows: part.rows.map((r) => scaleRow(r, k, themeFontSize)),
    ...(part.embeds !== undefined ? { embeds: part.embeds.map((e) => scaleEmbeddedBlock(e, k)) } : {}),
    ...(part.portMembers !== undefined ? { portMembers: part.portMembers.map((p) => scalePortMember(p, k)) } : {}),
  };
}

function scaleTreePart(part: EnhancedTreePart, k: number, themeFontSize: number): EnhancedTreePart {
  return {
    ...part,
    rows: part.rows.map((r) => scaleRow(r, k, themeFontSize)),
    connectors: part.connectors.map((c) => scaleTreeConnector(c, k)),
  };
}

function scaleEnhancedBodyPart(part: EnhancedBodyPart, k: number, themeFontSize: number): EnhancedBodyPart {
  switch (part.kind) {
    case 'divider':
      return scaleDividerPart(part, k);
    case 'rows':
      return scaleRowsPart(part, k, themeFontSize);
    case 'tree':
      return scaleTreePart(part, k, themeFontSize);
  }
}

/** G2 N42: a classifier's enhanced (separator/tree) body, scaled. */
export function scaleEnhancedBody(body: EnhancedBodyGeo, k: number, themeFontSize: number): EnhancedBodyGeo {
  return {
    parts: body.parts.map((p) => scaleEnhancedBodyPart(p, k, themeFontSize)),
    width: body.width * k,
    height: body.height * k,
    portMembers: body.portMembers.map((p) => scalePortMember(p, k)),
  };
}

function scaleJsonBodyItem(item: JsonBodyItem, k: number, themeFontSize: number): JsonBodyItem {
  switch (item.kind) {
    case 'hline':
      return { ...item, x: item.x * k, y: item.y * k, width: item.width * k };
    case 'vline':
      return { ...item, x: item.x * k, y: item.y * k, height: item.height * k };
    case 'text':
      return { ...item, row: scaleRow(item.row, k, themeFontSize) };
  }
}

/** M3(c): a `kind:'json'` leaf's entries-area draw list, scaled. */
export function scaleJsonBody(
  items: readonly JsonBodyItem[],
  k: number,
  themeFontSize: number,
): readonly JsonBodyItem[] {
  return items.map((item) => scaleJsonBodyItem(item, k, themeFontSize));
}
