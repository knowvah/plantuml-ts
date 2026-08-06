import type { Stereotype } from '../stereo/Stereotype.js';
import type { Style, StyleBuilder } from './ISkinParam.js';

/**
 * EntityImageStateCommon — ADR-2 consumed-function stub.
 * `Entity#getStateDescription` opens with
 * `EntityImageStateCommon.getStyleStateDescription(stereotype, styleBuilder)`;
 * upstream that is
 * `STYLE.addSName(SName.description).withTOBECHANGED(stereotype).getMergedStyle(styleBuilder)`
 * — the `StyleSignatureBasic` merge machinery ADR-2 scopes out of SI1
 * (this port's `style/StyleSignatureBasic.ts` is a bare signature shape
 * with no merge support). Throws until the svek/image state slice
 * lands; move to `src/core/svek/image/EntityImageStateCommon.ts` then.
 * Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateCommon.java:96-98
 */
export const EntityImageStateCommon = {
  getStyleStateDescription(stereotype: Stereotype | undefined, styleBuilder: StyleBuilder): Style {
    void stereotype;
    void styleBuilder;
    throw new Error(
      'deferred per SI1/ADR-2: EntityImageStateCommon.getStyleStateDescription needs the StyleSignatureBasic merge machinery (style/) not yet ported',
    );
  },
} as const;
