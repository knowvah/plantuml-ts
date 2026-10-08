/**
 * The Arecibo message -- the raster `PSystemVersion.getArecibo()` draws (`PSystemVersion.java:112-114`,
 * `src/main/resources/net/sourceforge/plantuml/version/arecibo.png`).
 *
 * The `href` is the data URI the oracle jar's SVG carries for it, byte for
 * byte: `SvgGraphics#svgImage` re-encodes the decoded image as PNG
 * (`SvgGraphics.java:970-983`), so these bytes differ from the resource
 * file's own; the pixels and the 69x219 size are the resource's.
 *
 * Licence: PlantUML resource, Copyright (C) 2009-2026 Arnaud Roques. Upstream
 * is multi-licensed (`LICENSES.md`); its MIT edition (`plantuml-mit`) ships
 * `src/main/resources` as-is (`plantuml-mit/build.gradle.kts:54-55`), so this
 * asset is used here under the MIT licence, as the rest of the port is.
 */
import type { RasterImage } from './raster-image.js';

export const ARECIBO_IMAGE: RasterImage = {
  width: 69,
  height: 219,
  href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAADbCAIAAAC0g8tNAAAFj0lEQVR4Xu2dQW7kRgxFvctukuxyzjlXzjHLHCNnyM5Bw9MlDZ/0/VmqktQGH7gwWJ/k/0AvZoA2/PbWxfuTg527QGd9nbtAZ32dM+BVdhw4xU4fuT1Us+PAKXb6yO2hmh0HTrHTh9qj3p6coOFT6/CJGtkCJ2j41Dp8oka2wAkaPrUOn6hRrWs7B5823q7tHHzaeLu2c/CpKL4sf//+I1RUvBaV504I9+y8AJXn3lSee/NF8tCr07kv9Op07gu9Op370rw6FYdvCE2LisM3hKZFxeGieC3++OdbqKjYglPOeErcyE3l1E845YynxI3cVE79hFPOeErcyE1Zomk4XsXTBjn1aCrPZ4iN7BAxTlLihphiJ6kGYpykxA0xxU5SDcQ4SYkbYoqdDbWoF5hiS1TnjTOn2BLVeeOKqaK4mPt/KHMOc+oryDnMqa/g/g6L4gU+pjmHOfUV5Bzm1FewOGw/ORXXnAJtiEqqr4A2RCXVV0AbouJwUUyl7yM4asoZT4mT6iejppzxlDipfjJqyhlPiRd1fEgyag/Jbc6p9xm1h+Q259T7jNpDcpubmmPsCMQeQrGYEhp2kup9xB5CsZgSGnaS6n3EHkKxmBIadjbUol5gii1RnTfOnGJLVOeNK6aK4mIOfijbb4XN+/WwnMOcGsQ0ledTDjrMEdNMyHMqMU3lmUXfxzSmmZkn5zCnfhLTVB6fxWH7yam4RhLT9OahDVFJdYaYpvJ8QBui4vBAYprePHchpqk8Y/j2/f2j4kMvw/PkHObUBpXnEzoddo49aTFG5Tno5+h8TFN5Agf9LLRFqY0xTW+e1FGLyvMgprlPHpJKmMqT2jyM1NXK424+lRZD5LmvexLTVJ7zSPkQeUhq8zBSVyuPu7mTvhstRioPSR21qDwPYprL8xxcdDAGOejn6Hzl+YROP51joOW5OFhOvU9MU3n2sBxaogwxTeXZw7JqiTLENK+epzEqT85hTp2h8mzT6bBzDFwco3F0/knl2WaUn3GLMrSj46+P32hQefLMuzFvs2Le1XmbFfOuztu84KymD079+9tfHyWm2tNEnGN0xqnKM4dRx5jnGirPNq+dp7l3Kg5PpfI8oGlRcXgqqTy0SPdC0zoN/q+pdVJPC5Vn2yuLmtZp0NnKbeIphzDEGI44Pmx5dYhbTIQPxnDE8aHyfGB9Xhurc7swhjAtiLdNh8tPjtqAMSrPg3h7nMMcdM+OQ3S6QmhWCwZB9+w4RKcrhGa1YBB0z45DdLpCaFYLnqT+fUDonh2H6NQjbnmrPAG6Z8chOvWIW95unCcqTCrPL9A9Ow4xzcl5mmm6F09nUHkeCNPiqSi+Gv+9/7lXUSrpmxoPY/Q565saD2P0OeubGg9j0JnTIdTM6yy0NxY1okOomddZaG8sakSHUDOvs9DeWFF6GG7u6yjWAUJF6WG4ua+jWAcIFaWH4ea+zl2gM3ZeCbpn55Wge3augX+LWlQcviE0LSoO3xCaFhWHL4cWD1Y8cDI0dLDigZOhoYMVD0yF50f54MJRmxU8NuoqF47arOCxUVe5cNTmDc64ASYenbh6n4lHJ67eZ/xRsZGdUXCzsJFDLGJnFNwsbOQQi9gZBTcLGxbOvKNJ4Sx0NBs4Y44mhbPQ0WzgjDmaFM5CR7OBo6aGHQdOsUMczYKjpoYdB06xQxzNgqOmhh0HTrFDHM2CoxYa8dQQGvHUcDQLjlpoxFNDaMRTw9EsOGqhEU8NoRFPDUeTw9lIDTvE0YzHuUoNO8TRjMe5Sg07xNGMJ3V1nngYqavzxMNIXZ0nHsa8q/M2K+ZdnbdZMe/qvM05xJc7+cTO7RAW+cTO7RAW+cTORNrXRkXFma1vFQs4tdr0Ex5lxZlNOMaKM5UnTK02/YRHWXFmxf+O4KSfoRItRQAAAABJRU5ErkJggg==',
};
