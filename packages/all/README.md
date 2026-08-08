# @knowvah/plantuml-all

One install for every [plantuml-ts](https://github.com/sseely/plantuml-ts)
asset package: the stdlib bundles, the ArchiMate sprites, and the Twemoji
emoji artwork.

```sh
npm install @knowvah/plantuml-ts @knowvah/plantuml-all
```

## ⚠️ Not an MIT-only dependency tree

This package's own code is MIT, but it pulls asset packages that are not:

| Package | Licence |
| --- | --- |
| `@knowvah/plantuml-emoji` | **CC BY 4.0** — attribution required |
| `@knowvah/plantuml-stdlib-aws` | **CC BY-ND 2.0** — attribution, no derivatives |

Installing this package opts you into both. If you need MIT-only, install the
individual packages and omit those two. See [`LICENSES.md`](./LICENSES.md) for
the full table and the exact attribution text.

```js
import { assetPackages } from '@knowvah/plantuml-all';

assetPackages.filter((p) => p.license !== 'MIT');
// enumerate your obligations rather than reading five READMEs
```

## What you get

- **stdlib bundles** via [`@knowvah/plantuml-stdlib-all`](../stdlib-all) —
  `c4`, `archimate` (`.puml` macros), `cloudinsight`, `cloudogu`, `bootstrap`,
  plus the AWS and tupadr3 remote manifests.
- **ArchiMate sprite artwork** via
  [`@knowvah/plantuml-sprites-archimate`](../sprites-archimate) — the 139
  jar-internal icons behind `<<$archimate/...>>`.
- **Twemoji artwork** via [`@knowvah/plantuml-emoji`](../emoji) — 1174 glyphs
  behind `<:name:>`.

Note that `archimate` appears twice and means two different things: the
stdlib bundle is `.puml` macros; the sprites package is the binary artwork.
They are disjoint corpora with separate provenance.

## Remote manifests still need a baseUrl

`awslib14Remote`, `awslibRemote` and `tupadr3Remote` are `{ key: path }` maps,
not bundles — each requires a `baseUrl` (via `remoteStdlib()`) before it
resolves anything. See [`docs/stdlib-remote.md`](../../docs/stdlib-remote.md).
The sprite and emoji packages ship their bytes directly instead.
