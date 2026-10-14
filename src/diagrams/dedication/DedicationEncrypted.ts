/**
 * `DedicationEncrypted` — one of the three secret dedications. Out of scope
 * (decisions.md D4): its match needs argon2 hashes and a 5-second wall-clock
 * throttle (java:68-79, `System.currentTimeMillis()`), and the rendering path
 * may not read a clock. The port keeps each entry's identity (`tinyHash`,
 * `argon2`, `Dedications.java:66-71`) and never yields an image; the
 * encrypted bytes and `pq` are not vendored. Follow-on, journaled.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationEncrypted.java
 */
import type { AssetStore } from '../../core/asset-store.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import type { Dedication } from './Dedication.js';
import type { TinyHashableString } from './TinyHashableString.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationEncrypted.java:48 */
export class DedicationEncrypted implements Dedication {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationEncrypted.java:58-63 */
  constructor(
    readonly tinyHash: number,
    readonly argon2: string,
  ) {}

  /** Always `undefined` (D4).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/DedicationEncrypted.java:65 */
  getImage(_sentence: TinyHashableString, _assetStore: AssetStore | undefined): RasterImage | undefined {
    return undefined;
  }
}
