import type { FontFace } from '../shape/UText.js';
import { FontStack } from './FontStack.js';
import { UFont } from './UFont.js';

/**
 * UFontFactory — the `build` factory `Style#getUFont` calls. The
 * `serif`/`sansSerif`/`monospace` shortcuts are not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/UFontFactory.java:46-65
 */
export const UFontFactory = {
  /** A null face is `UFontFace.normal()` (applied by the `UFont` constructor). @see UFontFactory.java:48-52 */
  build(fullDefinition: string, face: FontFace | undefined, fontSize: number): UFont {
    return new UFont(FontStack.build(fullDefinition), face, fontSize);
  },
} as const;
