# @knowvah/plantuml-stdlib-aws

Vendored AWS Architecture Icons for PlantUML (`awslib14`, plus the `awslib`
alias) — packaged as [plantuml-ts](https://github.com/plantuml/plantuml-ts)
`StdlibRemoteManifest` values plus the raw `.puml` assets they describe, for
use with `plantuml-ts`'s `remoteStdlib()` / `stdlibRegistry()` include seam.
There is no eager `BundleData` export — see "Usage" below.

## Attribution and license

The icon artwork in this package (`awslib14` — the `.puml` sprite files
under `generated/`) is licensed under **Creative Commons
Attribution-NoDerivatives 2.0 (CC BY-ND 2.0)** by Amazon.com, Inc. or its
affiliates. Full text: [`LICENSE`](./LICENSE).

- Upstream license (canonical):
  https://github.com/awslabs/aws-icons-for-plantuml/blob/main/LICENSE
- Source repository (credit):
  https://github.com/awslabs/aws-icons-for-plantuml — "AWS Icons for
  PlantUML", awslabs.

This package vendors those files **byte-verbatim** (copy + sha256 checksum,
never a transform — see `plans/si5b-stdlib/decisions.md` D1/D3 in the
plantuml-ts source repo). The ND (No-Derivatives) term forbids modifying,
re-encoding, or recoloring the artwork; verbatim reproduction inside this
"Collective Work" is permitted (CC BY-ND 2.0 §3(a)/§4(a) — see
`planning/s4-stdlib-audit.md`'s license analysis in the plantuml-ts source
repo). This package's own glue code (the `.puml` macro definitions that
accompany each sprite, and the generated `BundleData` wrapper) is MIT —
see [`LICENSE-CODE`](./LICENSE-CODE), matching upstream's own split between
`LICENSE` (icons) and `LICENSE-CODE` (macros).

## Install

```sh
npm install plantuml-ts @knowvah/plantuml-stdlib-aws
```

`plantuml-ts` is a peer dependency — this package supplies data, not the
renderer.

## Usage

**Eager registration is unavailable for this bundle.** `awslib14` is an
8.3 MB `BundleData` value; shipping it as an importable module (and
generating it on every build) was the exact cost mission SI12 removes. The
`.` entry point and the `./awslib14`/`./awslib` subpaths that used to export
the eager `BundleData` are gone — only the manifest-based `.remote` exports
remain.

Register the bundle through `remoteStdlib()` instead, pointed at this
package's `assets/` directory (self-hosted) or a pinned CDN URL. Both
recipes, plus the full `baseUrl` contract, are documented once in
[`docs/stdlib-remote.md`](../../docs/stdlib-remote.md) — "Recipe: self-hosted
assets" and "Recipe: pinned CDN" — and are not duplicated here.

```ts
import { renderSync, remoteStdlib, stdlibRegistry } from 'plantuml-ts';
import { awslib14Remote } from '@knowvah/plantuml-stdlib-aws/awslib14.remote';

const registry = stdlibRegistry({
  awslib14: () =>
    Promise.resolve(
      remoteStdlib({
        manifest: awslib14Remote,
        baseUrl: 'https://static.example.com/plantuml-stdlib/awslib14/',
      }),
    ),
});

const svg = renderSync(
  ['@startuml', '!include <awslib14/General/User>', '@enduml'].join('\n'),
  { stdlibRegistry: registry },
);
```

`awslib` (the alias `link:` target upstream registers for the "current"
release) is also exported as a manifest, `awslibRemote` — an alias of
`awslib14` with an empty `files` map (`aliasOf: 'awslib14'`) — from
`@knowvah/plantuml-stdlib-aws/awslib.remote`, and resolves through to the
same `awslib14` assets:

```ts
import { awslibRemote } from '@knowvah/plantuml-stdlib-aws/awslib.remote';
// registry entry for 'awslib' using awslibRemote resolves `<awslib/...>`
// against the same assets/awslib14/ files.
```
