/**
 * `AtomImg.createQrcode` (klimt/creole/atom/AtomImg.java:90-103), MIT edition
 * (D13): `FlashCodeUtilsNone` exports nothing, so the atom is a blank
 * `PortableImageFactory.build(10, 10, TYPE_INT_RGB)` scaled by `scale` and
 * carried at scale 1.
 *
 * The data URIs are a JDK probe of upstream's own MIT path: the 1.2026.8beta1
 * jar's classes running `new FlashCodeUtilsNone().exportFlashcode(...)`, the
 * `TYPE_INT_RGB` fallback, `new UImage(new PixelImage(im,
 * TYPE_NEAREST_NEIGHBOR)).scale(scale).getImage(1)` and `SImageIO.write(...,
 * "png", ...)` (the bytes `SvgGraphics` embeds). The GPL oracle jar draws a
 * real 33x33 QR code instead (99x99 at the default scale 3); the MIT edition
 * draws 30x30.
 */
import { describe, expect, it } from 'vitest';
import { createQrcode } from '../../../../../../src/core/klimt/creole/atom/AtomImg.js';

const PNG = 'data:image/png;base64,';

/** JDK probe, scale 3 (`Parser.getScale(null, 3)`, the default): 30x30 opaque black. */
const QR_3 = `${PNG}iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAS0lEQVR4XsXIIQEAMAwEsfdvuhNwPAMh2bb7JKEklISSUBJKQkkoCSWhJJSEklASSkJJKAkloSSUhJJQEkpCSSgJJaEklISSUBLEAzDIgKpxbTyPAAAAAElFTkSuQmCC`;

/** JDK probe, scale 1.05: 11x11, the last row and column left transparent. */
const QR_105 = `${PNG}iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAGklEQVR4XmNgYGD4TyQGA3RBXHhUMR0VEw0ASGxjnWep7RIAAAAASUVORK5CYII=`;

/** JDK probe, scale 0.15: 2x2, only the top-left pixel written. */
const QR_015 = `${PNG}iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAD0lEQVR4XmNgYGD4z4AMAA4EAQCOQgVwAAAAAElFTkSuQmCC`;

/** JDK probe, scale 2.5: 25x25 opaque black. */
const QR_25 = `${PNG}iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAQ0lEQVR4Xr3IMQEAIAAEoe9fWgOweg4sbNv5gCgQBaJAFIgCUSAKRIEoEAWiQBSIAlEgCkSBKBAFokAUiAJRIArEcxdT9W6ug017hAAAAABJRU5ErkJggg==`;

describe('AtomImg.createQrcode (MIT: FlashCodeUtilsNone, blank 10x10 RGB)', () => {
  it('at the default scale 3 is a 30x30 black image carried at scale 1', () => {
    expect(createQrcode('https://plantuml.com/patreon', 3)).toEqual({
      kind: 'img',
      dataUri: QR_3,
      scale: 1,
      width: 30,
      height: 30,
    });
  });

  it('ignores the encoded text: FlashCodeUtilsNone exports nothing for any input', () => {
    expect(createQrcode('abcdef', 3)).toEqual(createQrcode('https://plantuml.com/paypal', 3));
  });

  it('rounds the scaled size like PortableImageAwt.scale (Math.round(10 * scale))', () => {
    expect(createQrcode('x', 2.5)).toMatchObject({ dataUri: QR_25, width: 25, height: 25, scale: 1 });
    expect(createQrcode('x', 1.05)).toMatchObject({ dataUri: QR_105, width: 11, height: 11, scale: 1 });
    expect(createQrcode('x', 0.15)).toMatchObject({ dataUri: QR_015, width: 2, height: 2, scale: 1 });
  });

  it('at scale 1 keeps the unscaled 10x10 image (PixelImage.getImage, java:72-73)', () => {
    expect(createQrcode('x', 1)).toMatchObject({ width: 10, height: 10, scale: 1 });
  });

  it('throws the BufferedImage error when the scaled size rounds to zero, as the jar crashes', () => {
    expect(() => createQrcode('x', 0.04)).toThrow('Width (0) and height (0) cannot be <= 0');
  });
});
