/**
 * `Dedication` — one sentence that may unlock an image.
 *
 * `getImage` takes the render's `AssetStore` (port-only, ADR-2): upstream
 * reads each image off the classpath when `Dedications` loads
 * (`Dedications.java:81-86`); a browser-safe port receives the vendored bytes
 * through `ParseOptions.assetStore` instead (D4). `PortableImage` is the
 * port's `RasterImage`.
 *
 * `SIZE`, `E` and `N` (java:44-48) are read only by the RSA block decode
 * (`DedicationSimple.java:61-63`, `DedicationEncrypted`) and `tinyHash`; the
 * port vendors the decoded images (D4), so none of them is ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedication.java
 */
import type { AssetStore } from '../../core/asset-store.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import type { TinyHashableString } from './TinyHashableString.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedication.java:42 */
export interface Dedication {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/Dedication.java:50 */
  getImage(sentence: TinyHashableString, assetStore: AssetStore | undefined): RasterImage | undefined;
}
