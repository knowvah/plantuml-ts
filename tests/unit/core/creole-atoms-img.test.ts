/**
 * `data:image/svg+xml;base64,` creole images -- `AtomImg.java:153-161`
 * (`AtomImgSvg(TileImageSvg(svg, scale))`), `UImageSvg.java:118-146`
 * (extent), `SvgGraphics.java:1015-1026` (the emitted payload).
 */
import { describe, expect, it } from 'vitest';
import { scanLineForAtoms, matchAtomAt } from '../../../src/core/creole-atoms.js';
import { decodeSvgDataImage, isSvgDataImage, stripImgSrc } from '../../../src/core/creole-atoms-img.js';
import { makeAtomImageResolverFor } from '../../../src/core/creole-atoms-image-resolver.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';

const PREFIX = 'data:image/svg+xml;base64,';
const SVG = '<svg width="10px" height="20px" viewBox="0 0 10 20" xmlns="http://www.w3.org/2000/svg"><g/></svg>';
const b64 = (s: string): string => btoa(s);
const decodeHref = (href: string): string => atob(href.slice(PREFIX.length));
const FONT: FontConfiguration = { family: 'SansSerif', size: 12, color: null, styles: new Set() };

describe('data:image/svg+xml creole images', () => {
  it('recognises the AtomImg.java:77 prefix only', () => {
    expect(isSvgDataImage(PREFIX + 'AAAA')).toBe(true);
    expect(isSvgDataImage('data:image/png;base64,AAAA')).toBe(false);
  });

  it('scale 1: extent is the viewBox, href re-rooted per SvgGraphics.java:1015-1026', () => {
    const decoded = decodeSvgDataImage(PREFIX + b64(SVG), 1);
    if (typeof decoded === 'string') throw new Error(decoded);
    expect(decoded.width).toBe(10);
    expect(decoded.height).toBe(20);
    expect(decodeHref(decoded.dataUri)).toBe(
      '<svg height="20" width="10" xmlns="http://www.w3.org/2000/svg" ><g/></svg>',
    );
  });

  it('scale 2: href is scaled (SvgGraphics#manageScale), native extent kept', () => {
    const decoded = decodeSvgDataImage(PREFIX + b64(SVG), 2);
    if (typeof decoded === 'string') throw new Error(decoded);
    expect(decoded.width).toBe(10);
    expect(decodeHref(decoded.dataUri)).toBe(
      '<svg height="40" width="20" xmlns="http://www.w3.org/2000/svg" >' + '<g transform="scale(2,2)" ><g/></g></svg>',
    );
  });

  it('a markup line yields an svg img atom, not the cannot-decode text', () => {
    const scan = scanLineForAtoms(`a <img ${PREFIX}${b64(SVG)}{scale=2}> b`);
    expect(scan.textWithoutAtoms).toBe('a  b');
    const atom = scan.atoms[0];
    expect(atom).toMatchObject({ kind: 'img', width: 10, height: 20, scale: 2, svg: true });
    expect(matchAtomAt(`<img ${PREFIX}${b64(SVG)}>`, 0)?.atom).toMatchObject({ kind: 'img', svg: true });
  });

  it('resolves to an unrounded, raster-less image (AtomImgSvg draws a UImageSvg)', () => {
    const scan = scanLineForAtoms(`<img ${PREFIX}${b64(SVG)}{scale=1.5}>`);
    const resolved = makeAtomImageResolverFor(undefined)(FONT)(scan.atoms[0]!);
    expect(resolved).toMatchObject({ kind: 'image', width: 15, height: 30 });
    expect(resolved).not.toHaveProperty('rasterWidth');
  });

  it('bad base64 length and characters give the AtomImg.java:159 ERROR text', () => {
    expect(decodeSvgDataImage(PREFIX + 'AAA', 1)).toBe(
      'ERROR java.lang.IllegalArgumentException: Length of Base64 encoded input string is not a multiple of 4.',
    );
    expect(decodeSvgDataImage(PREFIX + 'AA!A', 1)).toBe(
      'ERROR java.lang.IllegalArgumentException: Illegal character in Base64 encoded data.',
    );
  });

  it('an svg without an extent degrades to ERROR text (UImageSvg.java:118-146 throws)', () => {
    const result = decodeSvgDataImage(PREFIX + b64('<svg><g/></svg>'), 1);
    expect(result).toBe('ERROR UImageSvg: cannot find height');
  });

  it('stripImgSrc drops src= and surrounding quotes (CommandCreoleImg.java:79-84)', () => {
    expect(stripImgSrc(' SRC="a.png" ')).toBe('a.png');
  });
});
