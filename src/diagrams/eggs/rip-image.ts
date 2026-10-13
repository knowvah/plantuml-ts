/**
 * `RIP_PNG` -- the image `jean canouet` draws under its text (`PSystemRIP.java:63`,
 * `SImageIO.read(imm)`: the inline JPEG `imm`, java:71-435), as the pinned jar re-encodes it in SVG
 * (the D4 approach). The PNG is the jar's own decode + re-encode, copied byte for byte from the
 * authored jar oracle `tests/fixtures/utility/rip.svg` (`scripts/oracle-render.sh`).
 *
 * The bytes ship as `assets/eggs/rip.png` (T1i, stop 12), reached through the `AssetStore` seam
 * (ADR-2) under `assetKey`; `sha256` pins them. See `apple2-image.ts`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java
 */
import type { EggImage } from './apple2-image.js';

/** 162x135, `assets/eggs/rip.png`. */
export const RIP_PNG: EggImage = {
  assetKey: 'eggs:rip.png',
  width: 162,
  height: 135,
  sha256: '091e5dcfe3e05e0a933036e75415f81658ec12b6bea2257ce805c741e05f874b',
};
