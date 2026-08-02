# Component map — what SI11a touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "src/ — browser-safe, no Node built-ins" {
  [index.ts\nT7 · exports\nAT the 500-line cap] as IDX
  [tim/StdlibRemote.ts\nT1 · CREATE] as REM
  [tim/StdlibRegistry.ts\nT2 · resolveResource] as REG
  [include-resolver.ts\nT3 routing · T4 concurrency\nAT the 500-line cap] as RES
  [tim/StdlibStore.ts\nREAD-ONLY · owns alias + key semantics] as STO
  [include-resolver.ts#fetchInclude\nREUSED · CORS/CSP differentiation] as FET
}

package "scripts/ — Node built-ins fine" {
  [build-stdlib-packages/\nemit-remote-manifest.ts\nT5 · CREATE] as EMIT
  [build-stdlib-packages/\npackage-specs.ts + types.ts\nT5 · modify] as SPEC
  [vendor-stdlib.ts --verify\nGATE · must stay green] as VEND
}

package "packages/ — generated" {
  [stdlib-aws/**\nT6 · regenerate] as AWS
  [stdlib-tupadr3/**\nT6 · regenerate] as TUP
}

package "tests/" {
  [unit/stdlib-remote.test.ts · T1] as UT1
  [unit/stdlib-registry.test.ts · T2 extends] as UT2
  [unit/stdlib-remote-prefetch.test.ts · T3, T4] as UT3
  [unit/stdlib-package-files.test.ts · T6 · the packaging trap] as UT6
  [integration/stdlib-remote-e2e.test.ts · T8] as E2E
}

REM --> FET
REM --> STO
REG --> REM
RES --> REG
RES --> STO
IDX --> REM
EMIT --> SPEC
EMIT ..> AWS : emits
EMIT ..> TUP : emits
VEND ..> AWS : guards
VEND ..> TUP : guards
E2E ..> TUP : reads real output
E2E ..> AWS : reads real output
@enduml
```

Green = created. Orange = deliberately read-only reuse. Red = the gate that
proves stop condition 5 was not violated.

## What is NOT touched — and why that matters

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[sprite-commands.ts\nSpriteRegistry] as A
[per-sprite loading] as B
[renderSync + the whole\nsync render pipeline] as C
[unchanged by design] as D
[BundleData / stdlibStore /\nwithStdlib / stdlibRegistry] as E
[eager offline path intact] as F
[assets/stdlib/** content] as G
[sha256 manifest unchanged] as H
[packages/stdlib, -all] as I
[out of scope] as J

A ..> B : SI11b
C ..> D : never
E ..> F : additive only
G ..> H : pure file copy
I ..> J : already solved by SI8
@enduml
```

The sync pipeline's exclusion is structural, not incidental: `renderSync` cannot
await, so every byte of this mission lives in the async prefetch pass.
