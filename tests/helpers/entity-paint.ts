/** First-shape paint of one `<g class="entity">` group. */
export interface EntityPaint {
  readonly fill: string | undefined;
  readonly stroke: string | undefined;
}

const ENTITY_GROUP_RE = /<g class="entity" data-qualified-name="([^"]*)"[^>]*>([\s\S]*?)<\/g>/g;
const SHAPE_RE = /<(?:rect|ellipse|path|polygon)\b[^>]*>/;
const FILL_RE = /\bfill="([^"]*)"/;
const STROKE_RE = /stroke:([^;"]*)/;

/**
 * Maps each entity's NAME (the last segment of its qualified name -- a port
 * is `comp.p80` in the jar but `p80` here, an attribute the conformance
 * comparator ignores) to the fill/stroke of the first shape its
 * `<g class="entity">` group draws (the symbol body, before any decoration).
 */
export function entityPaints(svg: string): Record<string, EntityPaint> {
  const out: Record<string, EntityPaint> = {};
  for (const match of svg.matchAll(ENTITY_GROUP_RE)) {
    const shape = SHAPE_RE.exec(match[2]!)?.[0] ?? '';
    out[match[1]!.slice(match[1]!.lastIndexOf('.') + 1)] = {
      fill: FILL_RE.exec(shape)?.[1],
      stroke: STROKE_RE.exec(shape)?.[1],
    };
  }
  return out;
}
