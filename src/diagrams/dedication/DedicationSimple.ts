/**
 * `DedicationSimple` — a public sentence and its image.
 *
 * Upstream holds the RSA-encrypted image bytes and decodes them on a match
 * (`RBlocks.readFrom(..., 513).change(E, N)`, then
 * `SFile.getImageFromWebpButHeader`, java:58-64). The port holds the
 * `DedicationImage` T0e vendored from the jar's renders (decisions.md D4) and
 * reads its PNG through the asset store. A store that cannot serve the bytes
 * is upstream's failed decode: the `catch (Throwable)` returns null
 * (java:65-68).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationSimple.java
 */
import type { AssetStore } from '../../core/asset-store.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import { toBase64DataUri } from '../../core/klimt/sprite/png-encoder.js';
import { equalsIgnoreCase } from './equals-ignore-case.js';
import type { Dedication } from './Dedication.js';
import type { DedicationImage } from './dedication-images.js';
import type { TinyHashableString } from './TinyHashableString.js';

/** `replaceAll("[^\\p{L}0-9]+", "")`: Java's regex reads code points, as `u` does.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationSimple.java:72-73 */
const NOT_LETTER_OR_DIGIT = /[^\p{L}0-9]+/gu;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationSimple.java:71-75 */
function same(s1: string, s2: string): boolean {
  return equalsIgnoreCase(s1.replace(NOT_LETTER_OR_DIGIT, ''), s2.replace(NOT_LETTER_OR_DIGIT, ''));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationSimple.java:44 */
export class DedicationSimple implements Dedication {
  /** `encrypted` is the vendored image (D4).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationSimple.java:49-52 */
  constructor(
    private readonly image: DedicationImage,
    private readonly sentence: string,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationSimple.java:54-69 */
  getImage(sentence: TinyHashableString, assetStore: AssetStore | undefined): RasterImage | undefined {
    if (!same(this.sentence, sentence.getSentence())) return undefined;
    const payload = assetStore?.get(this.image.assetKey);
    if (payload === undefined) return undefined;
    return { width: this.image.width, height: this.image.height, href: toBase64DataUri(payload.bytes) };
  }
}
