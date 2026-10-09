/**
 * Link-path endpoints read out of a rendered SVG — the measurement behind the
 * lgm-T1b "clipped endpoints equal the jar's" assertions. A `<g class="link">`
 * carries one `<path d="M x,y C …">`; its first and last coordinate pairs are
 * the spline's two ends after `SvekEdge#solveLine`'s compound clip.
 */

export interface LinkEnds {
  readonly start: readonly [number, number];
  readonly end: readonly [number, number];
}

/** Both ends, keyed by the link's `id` (`lnkN`, the entity-uid counter — equal in a jar render and ours). */
export function linkEndsById(svg: string): Map<string, LinkEnds> {
  const out = new Map<string, LinkEnds>();
  for (const m of svg.matchAll(/<g class="link"([^>]*)>([\s\S]*?)<\/g>/g)) {
    const id = / id="(lnk\d+)"/.exec(m[1]!)?.[1];
    const d = /<path[^>]* d="([^"]+)"/.exec(m[2]!)?.[1];
    if (id === undefined || d === undefined) continue;
    const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((n) => parseFloat(n[0]));
    out.set(id, { start: [nums[0]!, nums[1]!], end: [nums.at(-2)!, nums.at(-1)!] });
  }
  return out;
}

const fmt = (l: LinkEnds): string => `${l.start.join(',')}->${l.end.join(',')}`;

const sameEnd = (a: readonly [number, number], b: readonly [number, number]): boolean => a[0] === b[0] && a[1] === b[1];

/**
 * The links whose ends differ from the jar's. A link our engine draws in the
 * opposite direction (`-left-`/`-up-` transitions keep semantic order, the jar
 * keeps graphviz's) is compared end-for-end swapped, since the SAME curve
 * reversed has the same two ends.
 */
export function mismatchedLinks(ours: string, jar: string): string[] {
  const o = linkEndsById(ours);
  const bad: string[] = [];
  for (const [id, j] of linkEndsById(jar)) {
    const mine = o.get(id);
    if (mine === undefined) bad.push(`${id}: missing`);
    else if (sameEnd(mine.start, j.start) && sameEnd(mine.end, j.end)) continue;
    else if (sameEnd(mine.start, j.end) && sameEnd(mine.end, j.start)) continue;
    else bad.push(`${id}: jar ${fmt(j)} ours ${fmt(mine)}`);
  }
  return bad;
}
