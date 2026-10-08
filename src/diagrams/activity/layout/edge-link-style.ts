/**
 * The `LinkStyle` of an edge's `CommandArrow3` COLOR group (`edge.color`,
 * e.g. `#red,dashed`): `HtmlColorAndStyle.build`'s comma-token scan, the
 * last non-normal keyword winning (`HtmlColorAndStyle.java:86-106`,
 * `LinkStyle.fromString1`). Only the first `;` rainbow member is read
 * (`Rainbow#getColors().get(0)`, `Rainbow.java:134-136`). Shared by the
 * renderer (stroke) and the compressor (a hidden worm draws nothing,
 * `Worm.java:123-124`).
 */
import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import { LinkStyle } from '../../../core/decoration/LinkStyle.js';

/** The first rainbow member's comma tokens, `[]` without a COLOR group. */
export function edgeColorTokens(edge: Pick<ActivityEdgeGeo, 'color'>): readonly string[] {
  return edge.color === undefined ? [] : edge.color.split(';')[0]!.split(',');
}

export function edgeLinkStyle(edge: Pick<ActivityEdgeGeo, 'color'>): LinkStyle {
  let style = LinkStyle.NORMAL();
  for (const token of edgeColorTokens(edge)) {
    const tmp = LinkStyle.fromString1(token);
    if (!tmp.isNormal()) style = tmp;
  }
  return style;
}
