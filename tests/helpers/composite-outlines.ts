/**
 * The drawn outline `<rect>` of every state composite in an SVG, as
 * `x,y,width,height` strings in document order. A composite outline is the
 * `fill="none"` rect with `rx="12.5"`; jar writes the stroke in a `style`
 * attribute and ours as presentation attributes, so only the geometry is read.
 */
const OUTLINE = /<rect\b[^>]*>/g;

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

export function compositeOutlines(svg: string): string[] {
  return (svg.match(OUTLINE) ?? [])
    .filter((tag) => attr(tag, 'rx') === '12.5' && attr(tag, 'fill') === 'none')
    .map((tag) => ['x', 'y', 'width', 'height'].map((n) => attr(tag, n)).join(','));
}
