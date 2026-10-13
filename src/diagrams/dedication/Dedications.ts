/**
 * `Dedications` — the 10 public sentences then the 3 secret ones, tried in
 * order on any line longer than 25 chars.
 *
 * The static list is built from `DEDICATION_IMAGES` (T0e), which keys the 10
 * `DedicationSimple` sentences in `Dedications.java:55-65` order. `load`
 * (java:81-86, a classpath read) is the asset store a caller passes (D4).
 * `synchronized` has no counterpart in single-threaded JS.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedications.java
 */
import type { AssetStore } from '../../core/asset-store.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import type { Dedication } from './Dedication.js';
import { DedicationEncrypted } from './DedicationEncrypted.js';
import { DEDICATION_IMAGES } from './dedication-images.js';
import { DedicationSimple } from './DedicationSimple.js';
import { TinyHashableString } from './TinyHashableString.js';

/** `if (line.length() > 25)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedications.java:92 */
const MIN_LENGTH_EXCLUSIVE = 25;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedications.java:51-75 */
const ALL: readonly Dedication[] = [
  ...Object.entries(DEDICATION_IMAGES).map(([sentence, image]) => new DedicationSimple(image, sentence)),
  new DedicationEncrypted(5, '835ff5d643b58cd35a20db6480071d05751aa6a0e01da78662ceafd0161f3f5e'),
  new DedicationEncrypted(3, '514816d583044efbd336882227deb822194ff63e3bdc3cf707a01f17770d5a6a'),
  new DedicationEncrypted(1, 'ae8a7cf3997ccd6418866fc59e596502e1bd1c0265bba2fc380ad7f51c76518f'),
];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedications.java:49 */
export const Dedications = {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedications.java:91-103 */
  get(line: string, assetStore: AssetStore | undefined): RasterImage | undefined {
    if (line.length <= MIN_LENGTH_EXCLUSIVE) return undefined;
    const sentence = new TinyHashableString(line);
    for (const dedication of ALL) {
      const image = dedication.getImage(sentence, assetStore);
      if (image !== undefined) return image;
    }
    return undefined;
  },
};
