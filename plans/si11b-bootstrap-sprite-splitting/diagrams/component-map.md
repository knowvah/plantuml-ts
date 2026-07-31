# Component map — what this mission touches

```mermaid
graph TD
    subgraph vendored["assets/stdlib/ — READ ONLY (ADR-1)"]
        BP["bootstrap1.13.1/bootstrap.puml<br/>1,085,342 B · 2,078 sprites"]
        MAN["stdlib.manifest.json<br/>license field — ADR-2 keys on this"]
    end

    subgraph scripts["scripts/ — Node OK"]
        SPLIT["split-sprite-bundle/split.ts<br/>T1 CREATE"]
        ALLOW["split-sprite-bundle/allowlist.ts<br/>T1 CREATE · fail-closed"]
        SPECS["build-stdlib-packages/package-specs.ts<br/>T1 MODIFY"]
        BUILD["build-stdlib-packages.ts<br/>T1 MODIFY — the wiring"]
    end

    subgraph pkg["packages/stdlib/ — derived output"]
        FRAG["assets/bootstrap1.13.1/sprites/*.puml<br/>2,078 fragments · T1 emits, T5 ships"]
        SMAN["generated/*.split.js<br/>name list · 7,289 B gzip"]
    end

    subgraph src["src/ — browser-safe, NO Node built-ins"]
        SCAN["core/sprite-prefetch.ts<br/>T2 CREATE"]
        CREOLE["core/creole-atoms.ts<br/>T2 export only"]
        RESOLVER["core/include-resolver.ts<br/>T4 MODIFY · AT 500-line cap"]
        SPRITES["core/sprite-commands.ts<br/>T3 MODIFY · collisions[]"]
        INDEX["index.ts<br/>T3 MODIFY · AT 500-line cap"]
    end

    subgraph reuse["SI11a — reused UNCHANGED"]
        REMOTE["tim/StdlibRemote.ts"]
        REG["tim/StdlibRegistry.ts"]
    end

    BP -->|read| SPLIT
    MAN -->|license| ALLOW
    ALLOW --> SPLIT
    SPLIT --> FRAG
    SPLIT --> SMAN
    SPECS --> BUILD
    BUILD --> SPLIT

    CREOLE -->|SPRITE_PATTERN| SCAN
    SCAN --> RESOLVER
    INDEX -->|onWarning, sprites| RESOLVER
    SPRITES -->|collisions| INDEX
    SMAN --> RESOLVER
    FRAG --> RESOLVER
    REMOTE --> RESOLVER
    REG --> RESOLVER

    style BP fill:#2d3748,stroke:#e53e3e,color:#fff
    style MAN fill:#2d3748,stroke:#e53e3e,color:#fff
    style RESOLVER fill:#2c5282,stroke:#63b3ed,color:#fff
    style INDEX fill:#2c5282,stroke:#63b3ed,color:#fff
```

**Red** = read-only vendored input; writing there is stop condition 5.
**Blue** = files already AT the 500-line cap; budget lines before writing.

`StdlibRemote.ts` and `StdlibRegistry.ts` are consumed but **never modified** —
SI11a's surface is frozen (stop condition 4).

## Ownership, one writer per file

| File | Owner |
|---|---|
| `scripts/split-sprite-bundle/**`, `package-specs.ts`, `build-stdlib-packages.ts` | T1 |
| `src/core/sprite-prefetch.ts`, `src/core/creole-atoms.ts` | T2 |
| `src/core/sprite-commands.ts`, `src/index.ts` | T3 |
| `src/core/include-resolver.ts` | T4 |
| `packages/stdlib/**` | T5 |
| `tests/integration/sprite-split-e2e.test.ts` | T6 |
| `planning/mission-index.md`, this brief's `README.md` | T7 |

**`scripts/vendor-stdlib/**` has NO owner — by design.** ADR-1 removed the
need to touch it, and doing so is stop condition 5.
