# @knowvah/plantuml-stdlib-all

Meta-package: depends on and re-exports every non-GPL
[plantuml-ts](https://github.com/plantuml/plantuml-ts) stdlib package
(`@knowvah/plantuml-stdlib`, `@knowvah/plantuml-stdlib-aws`,
`@knowvah/plantuml-stdlib-tupadr3`) as a single discovery surface. `adaml`
(GPL) is deliberately never included — see [`LICENSES.md`](./LICENSES.md).

**"Register everything in one call" is conditional, not absolute.** This
package exports two different kinds of thing:

- **`stdlib`'s five bundles are eager** (`c4`, `archimate`, `cloudinsight`,
  `cloudogu`, `bootstrap`/`bootstrap1_13_1`) — register them directly, no
  further setup.
- **`awslib14Remote`, `awslibRemote`, and `tupadr3Remote` are manifests, not
  bundles** — `{ key: path }` maps with no `.puml` content. Registering a
  bare manifest does not work: each one **requires a `baseUrl`** (wrapped via
  `remoteStdlib()`) before it resolves anything. See
  [`docs/stdlib-remote.md`](../../docs/stdlib-remote.md) for the recipes
  (self-hosted assets, pinned CDN, hand-built manifest).

## Install

```sh
npm install plantuml-ts @knowvah/plantuml-stdlib-all
```

## Usage

Eager bundles register the same way they always have:

```ts
import { renderSync, stdlibStore, withStdlib, MapIncludeStore } from 'plantuml-ts';
import { c4, archimate, cloudinsight, cloudogu, bootstrap, bootstrap1_13_1 } from '@knowvah/plantuml-stdlib-all';

const includeStore = withStdlib(
  new MapIncludeStore(),
  stdlibStore(c4, archimate, cloudinsight, cloudogu, bootstrap, bootstrap1_13_1),
);

const svg = renderSync(
  ['@startuml', '!include <C4/C4_Context>', '@enduml'].join('\n'),
  { includeStore },
);
```

`awslib14Remote`, `awslibRemote`, and `tupadr3Remote` need a `baseUrl` before
they're usable — wrap each with `remoteStdlib()` and register it as a
`stdlibRegistry()` thunk. See
[`docs/stdlib-remote.md`](../../docs/stdlib-remote.md#recipe-self-hosted-assets)
for the full recipe; do not register the bare manifest import directly.

Prefer the individual `@knowvah/plantuml-stdlib*` packages directly if you only
need one or two bundles — `-all` pulls in every dependency's data (tupadr3
alone is the bulk of it).
