# @knowvah/plantuml-emoji

Vendored [Twemoji](https://github.com/jdecked/twemoji) artwork for
[plantuml-ts](https://github.com/sseely/plantuml-ts), so `<:name:>` creole
emoji render as real glyphs instead of measuring as text.

**1,174 SVG files**, copied byte-for-byte from upstream PlantUML's own emoji
resources. No re-encoding, no optimisation — verifiable, see
[Modifications](#modifications).

## ⚠️ This package is CC-BY 4.0, not MIT

`@knowvah/plantuml-ts` is MIT. **This package is not.** The artwork is
licensed **CC BY 4.0** and carries an attribution requirement that flows to
you when you redistribute it.

That licence difference is exactly why the artwork lives here instead of in
the core package: installing `plantuml-ts` does not silently pull a CC-BY
obligation into your project. You opt in.

If you ship this package, you must attribute. The Twemoji project accepts
attribution "through mentions in project documentation, website footers, or
app settings sections". The minimum text:

> Twemoji © by Twitter — graphics licensed
> [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)

See [`LICENSE`](./LICENSE) for the full licence and
[`LICENSES.md`](./LICENSES.md) for provenance.

## Install

```sh
npm install @knowvah/plantuml-ts @knowvah/plantuml-emoji
```

Or take everything at once with
[`@knowvah/plantuml-all`](../all) — which pulls this package, and therefore
its CC-BY obligation, with it.

## Use

This package ships **data plus a key scheme**, not a loader — it is
browser-safe by design (no `fs`, no I/O), because how bytes reach your
renderer depends on your bundler and hosting. It fixes the *naming* so every
loader agrees with the core resolver.

```js
import { emojiAssetKey, emojiAssetPath, emojiAssets } from '@knowvah/plantuml-emoji';

emojiAssetKey('1f680');   // -> "emoji:1f680.svg"   (RenderOptions.assetStore key)
emojiAssetPath('1f680');  // -> "1f680.svg"         (path within assets/)
emojiAssets.attribution;  // -> the line you must display
```

Wire the bytes into `RenderOptions.assetStore` under those keys, then render:

```js
renderSync(markup, { assetStore: myStore });
```

## The files are `<path>` fragments, not SVG documents

Each asset is a bare run of `<path>`/`<circle>` elements with **no `<svg>`
root and no `viewBox`** — that is how upstream stores them
(`Emoji.java` feeds them to `SvgSpriteParserFactory.create(data, null, null)`).

They are not malformed. **Do not "repair" them** into well-formed documents:
that both modifies a CC-BY work and changes the geometry PlantUML measures,
which will desynchronise diagram layout from upstream.

## Modifications

**None.** Every file is byte-identical to upstream. Prove it:

```sh
npx tsx scripts/vendor-emoji.ts --verify   # from the repo root
```

Per-file SHA-256 digests live in `assets/emoji.manifest.json`.

## Licences

| Component | Licence |
| --- | --- |
| Twemoji artwork (`assets/**`) | [CC BY 4.0](./LICENSE) |
| This package's own code (`index.js`) | [MIT](./LICENSE-CODE) |
