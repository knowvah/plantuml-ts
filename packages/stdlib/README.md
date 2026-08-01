# @knowvah/plantuml-stdlib

Vendored PlantUML stdlib bundles — C4, Archimate, Cloudinsight, Cloudogu, and
Bootstrap Icons — packaged as [plantuml-ts](https://github.com/plantuml/plantuml-ts)
`BundleData` values, for use with `plantuml-ts`'s `stdlibStore()` /
`withStdlib()` include seam.

## Install

```sh
npm install plantuml-ts @knowvah/plantuml-stdlib
```

`plantuml-ts` is a peer dependency — this package supplies data, not the
renderer.

## Usage

```ts
import { renderSync, stdlibStore, withStdlib, MapIncludeStore } from 'plantuml-ts';
import { c4, archimate, cloudinsight, cloudogu, bootstrap } from '@knowvah/plantuml-stdlib';

const includeStore = withStdlib(
  new MapIncludeStore(),
  stdlibStore(c4, archimate, cloudinsight, cloudogu, bootstrap),
);

const svg = renderSync(
  ['@startuml', '!include <C4/C4_Context>', '@enduml'].join('\n'),
  { includeStore },
);
```

Import only what you need via subpath exports to keep bundle size down:

```ts
import { c4 } from '@knowvah/plantuml-stdlib/c4';
```

## Licensing

Each bundle keeps its own upstream license — see [`LICENSES.md`](./LICENSES.md).
This package's own code is MIT (see [`LICENSE`](./LICENSE)).
