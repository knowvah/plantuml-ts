# Component map — what SI11a touches

```mermaid
graph TD
    subgraph src["src/ — browser-safe, no Node built-ins"]
        IDX["index.ts<br/>T7 · exports<br/>AT the 500-line cap"]
        REM["tim/StdlibRemote.ts<br/>T1 · CREATE"]
        REG["tim/StdlibRegistry.ts<br/>T2 · resolveResource"]
        RES["include-resolver.ts<br/>T3 routing · T4 concurrency<br/>AT the 500-line cap"]
        STO["tim/StdlibStore.ts<br/>READ-ONLY · owns alias + key semantics"]
        FET["include-resolver.ts#fetchInclude<br/>REUSED · CORS/CSP differentiation"]
    end

    subgraph scripts["scripts/ — Node built-ins fine"]
        EMIT["build-stdlib-packages/<br/>emit-remote-manifest.ts<br/>T5 · CREATE"]
        SPEC["build-stdlib-packages/<br/>package-specs.ts + types.ts<br/>T5 · modify"]
        VEND["vendor-stdlib.ts --verify<br/>GATE · must stay green"]
    end

    subgraph pkg["packages/ — generated"]
        AWS["stdlib-aws/**<br/>T6 · regenerate"]
        TUP["stdlib-tupadr3/**<br/>T6 · regenerate"]
    end

    subgraph tests["tests/"]
        UT1["unit/stdlib-remote.test.ts · T1"]
        UT2["unit/stdlib-registry.test.ts · T2 extends"]
        UT3["unit/stdlib-remote-prefetch.test.ts · T3, T4"]
        UT6["unit/stdlib-package-files.test.ts · T6 · the packaging trap"]
        E2E["integration/stdlib-remote-e2e.test.ts · T8"]
    end

    REM --> FET
    REM --> STO
    REG --> REM
    RES --> REG
    RES --> STO
    IDX --> REM
    EMIT --> SPEC
    EMIT -.emits.-> AWS
    EMIT -.emits.-> TUP
    VEND -.guards.-> AWS
    VEND -.guards.-> TUP
    E2E -.reads real output.-> TUP
    E2E -.reads real output.-> AWS

    style REM fill:#d4f8d4
    style EMIT fill:#d4f8d4
    style UT1 fill:#d4f8d4
    style UT3 fill:#d4f8d4
    style UT6 fill:#d4f8d4
    style E2E fill:#d4f8d4
    style STO fill:#ffe9c7
    style FET fill:#ffe9c7
    style VEND fill:#ffd6d6
```

Green = created. Orange = deliberately read-only reuse. Red = the gate that
proves stop condition 5 was not violated.

## What is NOT touched — and why that matters

```mermaid
graph LR
    A["sprite-commands.ts<br/>SpriteRegistry"] -.->|SI11b| B["per-sprite loading"]
    C["renderSync + the whole<br/>sync render pipeline"] -.->|never| D["unchanged by design"]
    E["BundleData / stdlibStore /<br/>withStdlib / stdlibRegistry"] -.->|additive only| F["eager offline path intact"]
    G["assets/stdlib/** content"] -.->|pure file copy| H["sha256 manifest unchanged"]
    I["packages/stdlib, -all"] -.->|already solved by SI8| J["out of scope"]

    style D fill:#e8e8e8
    style F fill:#e8e8e8
    style H fill:#e8e8e8
    style J fill:#e8e8e8
```

The sync pipeline's exclusion is structural, not incidental: `renderSync` cannot
await, so every byte of this mission lives in the async prefetch pass.
