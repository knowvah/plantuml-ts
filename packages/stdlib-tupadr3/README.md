# @knowvah/plantuml-stdlib-tupadr3

The `tupadr3` PlantUML stdlib bundle (Font Awesome 4/5/6, Devicons,
Devicons2, Material, Weather, Govicons — ~6,850 icon-font sprites) —
packaged as a single [plantuml-ts](https://github.com/plantuml/plantuml-ts)
`StdlibRemoteManifest` value plus the raw `.puml` assets it describes, for
use with `plantuml-ts`'s `remoteStdlib()` / `stdlibRegistry()` include seam.
**There is no eager `BundleData` export** — see "Usage" below.

Only an index export is provided (no per-category subpaths): `tupadr3` is a
single resolution unit in upstream's `Stdlib.java` (one bundle name, e.g.
`<tupadr3/font-awesome-5/ban>`), so splitting the manifest across
subpath-exported category modules would not compose back into one bundle for
`stdlibRegistry()` — passing multiple partial manifests sharing the name
`'tupadr3'` overwrites rather than merges. `remoteStdlib()` still resolves
each icon on its own request, so per-category granularity is unnecessary at
the package-export level.

## Install

```sh
npm install plantuml-ts @knowvah/plantuml-stdlib-tupadr3
```

`plantuml-ts` is a peer dependency — this package supplies data, not the
renderer.

## Usage

**Eager registration is unavailable for this bundle.** `tupadr3` is a
20.5 MB `BundleData` value; shipping it as an importable module (and
generating it on every build) was the exact cost mission SI12 removes. The
package has never had a dedicated eager subpath — even before SI12 the
20.5 MB module was only reachable through `.` — and now `.` re-exports the
manifest (`tupadr3Remote`) instead.

Register the bundle through `remoteStdlib()`, pointed at this package's
`assets/tupadr3/` directory (self-hosted) or a pinned CDN URL. Both
recipes, plus the full `baseUrl` contract, are documented once in
[`docs/stdlib-remote.md`](../../docs/stdlib-remote.md) — "Recipe: self-hosted
assets" and "Recipe: pinned CDN" — and are not duplicated here.

```ts
import { renderSync, remoteStdlib, stdlibRegistry } from '@knowvah/plantuml-ts';
import { tupadr3Remote } from '@knowvah/plantuml-stdlib-tupadr3/tupadr3.remote';

const registry = stdlibRegistry({
  tupadr3: () =>
    Promise.resolve(
      remoteStdlib({
        manifest: tupadr3Remote,
        baseUrl: 'https://static.example.com/plantuml-stdlib/tupadr3/',
      }),
    ),
});

const svg = renderSync(
  ['@startuml', '!include <tupadr3/font-awesome-5/ban>', '@enduml'].join('\n'),
  { stdlibRegistry: registry },
);
```

## Licensing

Mixed licensing — MIT glue plus several third-party icon-font artwork
licenses. See [`LICENSES.md`](./LICENSES.md).
