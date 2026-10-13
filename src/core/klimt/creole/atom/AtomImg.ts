/**
 * `AtomImg.createQrcode` — the image atom a creole `<qrcode:...>` adds
 * (`StripeSimple#addQrcode`, java:216-218).
 *
 * The rest of `AtomImg` (`create` and its `<img>` branches, the dimension
 * and draw methods) is ported as the `'img'` `InlineAtomToken`
 * (`core/creole-atoms.ts`: `ImgAtomToken`, measured by
 * `creole-atoms-measure.ts#measureInlineAtom`, drawn by
 * `creole-atoms-image-resolver.ts#resolveImgAtom`); `createQrcode` returns
 * that same token. `new AtomImg(image, 1, null, null)` (java:97-99) is a token
 * at `scale` 1 whose `dataUri` is the PNG `SvgGraphics` embeds for `image`
 * (`SImageIO.write(image, "png")`, the jar's own encoder — `png-encoder.ts`).
 *
 * MIT edition (D13): `FlashCodeFactory.getFlashCodeUtils()` is
 * `FlashCodeUtilsNone`, so `im` is always the blank
 * `PortableImageFactory.build(10, 10, TYPE_INT_RGB)` — opaque black — scaled.
 * The port is not TeaVM (java:92, :100-101 never reached).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java
 */
import type { ImgAtomToken } from '../../../creole-atoms.js';
import { getFlashCodeUtils } from '../../../flashcode/FlashCodeFactory.js';
import type { ResolvedColor } from '../../color/HColorSet.js';
import { encodePng, toBase64DataUri } from '../../sprite/png-encoder.js';
import { buildPortableImage, scalePortableImage, TYPE_INT_RGB } from './AtomImgPortableImage.js';

/** `XColor.BLACK`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/XColor.java:7 */
const BLACK: ResolvedColor = { r: 0, g: 0, b: 0, a: 255 };

/** `XColor.WHITE`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/XColor.java:8 */
const WHITE: ResolvedColor = { r: 255, g: 255, b: 255, a: 255 };

/** The fallback image's side, `PortableImageFactory.build(10, 10, ...)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java:95 */
const BLANK_SIZE = 10;

/** `new AtomImg(..., 1, null, null)`: the image is already scaled.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java:97-99 */
const ATOM_SCALE = 1;

/**
 * Port residual: at `scale` 1 `PixelImage.getImage` returns the
 * `TYPE_INT_RGB` source itself (PixelImage.java:72-73), which `ImageIO`
 * writes as an RGB (colour type 2) PNG; `png-encoder.ts` writes RGBA only, so
 * that one case embeds the same pixels with different bytes. Every other
 * scale goes through `PortableImageAwt#scale`'s `TYPE_INT_ARGB` image and
 * matches the jar byte for byte.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java:90-103
 */
export function createQrcode(flash: string, scale: number): ImgAtomToken {
  const exported = getFlashCodeUtils().exportFlashcode(flash, BLACK, WHITE);
  const im = exported ?? buildPortableImage(BLANK_SIZE, BLANK_SIZE, TYPE_INT_RGB);
  const image = scalePortableImage(im, scale);
  return {
    kind: 'img',
    dataUri: toBase64DataUri(encodePng(image.rgba, image.width, image.height)),
    scale: ATOM_SCALE,
    width: image.width,
    height: image.height,
  };
}
