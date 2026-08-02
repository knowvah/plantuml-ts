# Component map — what this mission touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "src/ — browser-safe, no Node built-ins" {
  [index.ts\nT3: RenderOptions · T4: exports] as IDX
  [core/include-resolver.ts\nT1: getPumlResource · T3: registry + recurse] as IR
  [core/tim/IncludeStore.ts\nT4: error rewrite] as IS
  [core/tim/StdlibStore.ts\nUNCHANGED — ADR-3] as SS
  [core/tim/StdlibRegistry.ts\nT2: NEW] as SR
  [core/tim/IncludeExecutor.ts\nUNCHANGED — sync read-back] as IE
}

package "tests/ — Node built-ins allowed" {
  [oracle/svg-conformance/render-fixture.ts\nT5: wire includeStore] as RF
  [oracle/svg-conformance/\ndescription.golden.ratchet.test.ts\n54 pinned fixtures] as RT
}

package "oracle/goldens/svg-description/" {
  [usecase/sprite-svg-*\nT6: in.puml + golden.svg] as FX
  [ratchet.json\nUNCHANGED — stays pinned] as RJ
}

package "packages/ — UNCHANGED this mission (ADR-2)" {
  [@plantuml-ts/stdlib\n1.8 MB · bootstrap.js 1.06 MB] as P1
  [-aws · awslib14.js 7.93 MB] as P2
  [-tupadr3 · tupadr3.js 19.54 MB] as P3
}

[scripts/stdlib-assets-store.ts\nnode:fs — script/test only] as SA

IDX --> IR
IR --> IS
IR --> SR
SR ..> P1 : dynamic import()
SR ..> P2
SR ..> P3
SS --> IS
IE --> IS
RF --> SA
RF --> RT
RT --> FX
RT --> RJ
@enduml
```

**Green** — modified or created. **Red** — the ratchet gate this mission can
break (T6). **Grey** — deliberately untouched.

## The boundary that must not blur

`src/` may not import Node built-ins; `tests/` and `scripts/` may. T2 builds a
browser-safe registry in `src/`; T5 wires a `node:fs`-backed assets store into a
test harness. Both are correct, for different reasons. A Node import reaching
`src/` is stop condition 1.

## Why `packages/` is untouched

Per-bundle laziness needs no change to the generated artifacts — the existing
per-bundle subpath exports (`@plantuml-ts/stdlib/bootstrap`) are exactly what a
dynamic-`import()` thunk targets. Changing the generated shape is the deferred
per-resource mission ([ADR-2](../decisions.md#adr-2)).
