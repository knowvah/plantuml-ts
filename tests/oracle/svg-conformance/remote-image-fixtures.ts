/**
 * Remote images the oracle jar fetched, served to the synchronous harness
 * through the asset-store seam (sdd3-T6g). The harness never touches the
 * network.
 *
 * `fixtures/remote-images/foo1.svg` is the `data:image/svg+xml;base64,` payload
 * decoded once from the golden `sequence/fifasu-62-pipo979/in.svg`. It is the
 * jar's RE-SERIALISATION of what `http://beta.plantuml.net/foo1.svg` returned
 * (2753 B against a 2995 B live fetch), so it must never be compared with a
 * live fetch.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java:223-233
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AssetPayload, AssetStore } from '../../../src/core/asset-store.js';
import { remoteImageKey, remoteImageStoreFrom } from '../../../src/core/remote-image-store.js';

const FOO1_URL = 'http://beta.plantuml.net/foo1.svg';
const SVG_MIME_TYPE = 'image/svg+xml';

let store: AssetStore | undefined;

/** The remote images the golden corpus embedded, keyed `remote-image:<url>`. */
export function remoteImageFixtureStore(): AssetStore {
  store ??= remoteImageStoreFrom(
    new Map<string, AssetPayload>([
      [
        remoteImageKey(FOO1_URL),
        {
          bytes: new Uint8Array(
            readFileSync(fileURLToPath(new URL('./fixtures/remote-images/foo1.svg', import.meta.url))),
          ),
          mimeType: SVG_MIME_TYPE,
        },
      ],
    ]),
  );
  return store;
}
