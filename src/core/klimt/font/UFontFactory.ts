import { NORMAL_FONT_FACE, type FontFace } from '../shape/UText.js';
import { FontStack } from './FontStack.js';
import { UFont } from './UFont.js';

/**
 * UFontFactory — `build` (the factory `Style#getUFont` calls) and the
 * `serif`/`sansSerif`/`monospace`/`byDefault` shortcuts, each
 * `build(FontStack.X, UFontFace.normal(), size)`. `byDefault` ignores its
 * argument and returns `sansSerif(12)`, as upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFontFactory.java:38-70
 */
export const UFontFactory = {
  /** A null face is `UFontFace.normal()` (applied by the `UFont` constructor). @see UFontFactory.java:48-52 */
  build(fullDefinition: string, face: FontFace | undefined, fontSize: number): UFont {
    return new UFont(FontStack.build(fullDefinition), face, fontSize);
  },

  /** @see UFontFactory.java:54-56 */
  serif(size: number): UFont {
    return UFontFactory.build(FontStack.SERIF, NORMAL_FONT_FACE, size);
  },

  /** @see UFontFactory.java:58-60 */
  sansSerif(size: number): UFont {
    return UFontFactory.build(FontStack.SANS_SERIF, NORMAL_FONT_FACE, size);
  },

  /** @see UFontFactory.java:62-64 */
  monospace(size: number): UFont {
    return UFontFactory.build(FontStack.MONOSPACE, NORMAL_FONT_FACE, size);
  },

  /** `sansSerif(12)`; `size` is unused upstream too. @see UFontFactory.java:66-68 */
  byDefault(_size: number): UFont {
    return UFontFactory.sansSerif(12);
  },
} as const;
