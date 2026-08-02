# Component map — what this mission touches

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "assets/stdlib/ — READ ONLY (ADR-1)" {
  [bootstrap1.13.1/bootstrap.puml\n1,085,342 B · 2,078 sprites] as BP
  [stdlib.manifest.json\nlicense field — ADR-2 keys on this] as MAN
}

package "scripts/ — Node OK" {
  [split-sprite-bundle/split.ts\nT1 CREATE] as SPLIT
  [split-sprite-bundle/allowlist.ts\nT1 CREATE · fail-closed] as ALLOW
  [build-stdlib-packages/package-specs.ts\nT1 MODIFY] as SPECS
  [build-stdlib-packages.ts\nT1 MODIFY — the wiring] as BUILD
}

package "packages/stdlib/ — derived output" {
  [assets/bootstrap1.13.1/sprites/*.puml\n2,078 fragments · T1 emits, T5 ships] as FRAG
  [generated/*.split.js\nname list · 7,289 B gzip] as SMAN
}

package "src/ — browser-safe, NO Node built-ins" {
  [core/sprite-prefetch.ts\nT2 CREATE] as SCAN
  [core/creole-atoms.ts\nT2 export only] as CREOLE
  [core/include-resolver.ts\nT4 MODIFY · AT 500-line cap] as RESOLVER
  [core/sprite-commands.ts\nT3 MODIFY · collisions[]] as SPRITES
  [index.ts\nT3 MODIFY · AT 500-line cap] as INDEX
}

package "SI11a — reused UNCHANGED" {
  [tim/StdlibRemote.ts] as REMOTE
  [tim/StdlibRegistry.ts] as REG
}

BP --> SPLIT : read
MAN --> ALLOW : license
ALLOW --> SPLIT
SPLIT --> FRAG
SPLIT --> SMAN
SPECS --> BUILD
BUILD --> SPLIT
CREOLE --> SCAN : SPRITE_PATTERN
SCAN --> RESOLVER
INDEX --> RESOLVER : onWarning, sprites
SPRITES --> INDEX : collisions
SMAN --> RESOLVER
FRAG --> RESOLVER
REMOTE --> RESOLVER
REG --> RESOLVER
@enduml
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
