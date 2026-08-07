# Licences — @knowvah/plantuml-all

This meta-package ships **no assets of its own**. Its own code is
[MIT](./LICENSE). What it does is pull in every asset package, and those are
**not uniformly MIT** — installing this package opts you into all of the
obligations below.

If you need an MIT-only dependency tree, do not install this package. Install
the individual packages you need and omit the non-MIT ones.

## What you are agreeing to

| Package | Contents | Licence | Obligation |
| --- | --- | --- | --- |
| `@knowvah/plantuml-stdlib` | plantuml-stdlib `.puml` bundles | MIT | Preserve the notice |
| `@knowvah/plantuml-stdlib-aws` | AWS Architecture Icons (awslib14) | **CC BY-ND 2.0** | Attribution; **no derivatives** |
| `@knowvah/plantuml-stdlib-tupadr3` | tupadr3 icon bundle | MIT | Preserve the notice |
| `@knowvah/plantuml-sprites-archimate` | ArchiMate sprite artwork | MIT | Attribution + ArchiMate trademark notice |
| `@knowvah/plantuml-emoji` | Twemoji artwork | **CC BY 4.0** | **Attribution required on redistribution** |

`adaml` (GPL) is deliberately never included, here or in
`@knowvah/plantuml-stdlib-all`.

## The two that need real care

### Twemoji — CC BY 4.0

The artwork in `@knowvah/plantuml-emoji` is CC BY 4.0. If you redistribute it
— including bundling it into a web app you ship — **you must attribute**. The
Twemoji project accepts attribution in project documentation, a website
footer, or an app settings section. Minimum text:

> Twemoji © by Twitter — graphics licensed
> [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Modifications: none. The vendored bytes are byte-identical to upstream and
that is mechanically verifiable (`npx tsx scripts/vendor-emoji.ts --verify`).
If you modify them, CC-BY 4.0 requires you to say so.

### AWS icons — CC BY-ND 2.0

`@knowvah/plantuml-stdlib-aws` is **No-Derivatives**. You may redistribute the
icons as-is with attribution; you may **not** ship modified versions. Do not
re-encode, recolour or re-export them.

## Enumerating obligations in code

```js
import { assetPackages } from '@knowvah/plantuml-all';

assetPackages.filter((p) => p.license !== 'MIT');
// -> the packages whose licences impose more than notice preservation
```

## Per-package detail

Each package carries its own `LICENSE` and `LICENSES.md` with the full text
and provenance review. The emoji verdict — and why it differs from the MIT
verdict reached for the ArchiMate sprites, despite both being jar-resident
PlantUML resources — is in
`plans/s1l-tail-fix/findings/emoji-artwork-licence-review.md`.
