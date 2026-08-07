# @knowvah/plantuml-sprites-archimate

Vendored [ArchiMate](https://www.opengroup.org/archimate-forum) sprite artwork
for [plantuml-ts](https://github.com/sseely/plantuml-ts), so
`<<$archimate/technology-device>>` stereotypes and
`sprite $x jar:archimate/name` resolve to real icons.

**139 files** (116 SVG, 23 PNG), copied byte-for-byte from upstream PlantUML's
jar-internal `/sprites/` resource root.

## Why a separate package

Icon libraries are opt-in. Installing `@knowvah/plantuml-ts` gets you the
renderer; it does not drag every icon set into your bundle. Take only the
libraries you use — or take everything with
[`@knowvah/plantuml-all`](../all).

## Install

```sh
npm install @knowvah/plantuml-ts @knowvah/plantuml-sprites-archimate
```

## Use

Ships **data plus a key scheme**, not a loader — browser-safe by design (no
`fs`, no I/O), because how bytes reach your renderer depends on your bundler
and hosting. It fixes the *naming* so every loader agrees with the core
resolver.

```js
import { spriteAssetKey, archimateSprites } from '@knowvah/plantuml-sprites-archimate';

spriteAssetKey('archimate/interface', '.svg');  // -> "sprite:archimate/interface.svg"
archimateSprites.trademark;                     // -> the notice you must carry
```

Wire the bytes into `RenderOptions.assetStore` under those keys, then render:

```js
renderSync(markup, { assetStore: myStore });
```

Paths keep their folder (`archimate/interface`, not `interface`) — the key
scheme includes it, so flattening the tree breaks resolution.

## Licence and attribution

MIT — see [`LICENSE`](./LICENSE) and [`LICENSES.md`](./LICENSES.md) for the
full provenance review (the PNGs derive from the
[Archi](https://www.archimatetool.com) modelling tool; the SVGs are original
contributions to PlantUML).

Two notices travel with these bytes:

> Archimate sprites are from Archi: http://www.archimatetool.com

> ArchiMate is a registered trademark of The Open Group.

## Modifications

**None.** Every file is byte-identical to upstream. Prove it:

```sh
npx tsx scripts/vendor-sprites.ts --verify   # from the repo root
```

Per-file SHA-256 digests live in `assets/sprites.manifest.json`.
