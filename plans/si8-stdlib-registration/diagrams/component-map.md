# Component map — what this mission touches

```mermaid
graph TD
    subgraph src["src/ — browser-safe, no Node built-ins"]
        IDX["index.ts<br/>T3: RenderOptions · T4: exports"]
        IR["core/include-resolver.ts<br/>T1: getPumlResource · T3: registry + recurse"]
        IS["core/tim/IncludeStore.ts<br/>T4: error rewrite"]
        SS["core/tim/StdlibStore.ts<br/>UNCHANGED — ADR-3"]
        SR["core/tim/StdlibRegistry.ts<br/>T2: NEW"]
        IE["core/tim/IncludeExecutor.ts<br/>UNCHANGED — sync read-back"]
    end

    subgraph tests["tests/ — Node built-ins allowed"]
        RF["oracle/svg-conformance/render-fixture.ts<br/>T5: wire includeStore"]
        RT["oracle/svg-conformance/<br/>description.golden.ratchet.test.ts<br/>54 pinned fixtures"]
    end

    subgraph goldens["oracle/goldens/svg-description/"]
        FX["usecase/sprite-svg-*<br/>T6: in.puml + golden.svg"]
        RJ["ratchet.json<br/>UNCHANGED — stays pinned"]
    end

    subgraph pkg["packages/ — UNCHANGED this mission (ADR-2)"]
        P1["@plantuml-ts/stdlib<br/>1.8 MB · bootstrap.js 1.06 MB"]
        P2["-aws · awslib14.js 7.93 MB"]
        P3["-tupadr3 · tupadr3.js 19.54 MB"]
    end

    SA["scripts/stdlib-assets-store.ts<br/>node:fs — script/test only"]

    IDX --> IR
    IR --> IS
    IR --> SR
    SR -.->|"dynamic import()"| P1
    SR -.-> P2
    SR -.-> P3
    SS --> IS
    IE --> IS
    RF --> SA
    RF --> RT
    RT --> FX
    RT --> RJ

    classDef changed fill:#2d6a4f,stroke:#95d5b2,color:#fff
    classDef untouched fill:#3d3d3d,stroke:#888,color:#ddd
    classDef risk fill:#7f1d1d,stroke:#fca5a5,color:#fff
    class IDX,IR,IS,SR,RF changed
    class SS,IE,RJ,P1,P2,P3,SA untouched
    class FX,RT risk
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
