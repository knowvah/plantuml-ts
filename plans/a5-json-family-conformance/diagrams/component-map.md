# Component map — what A5 touches

Written and read-only components, and the two seams the mission must not edit.

```plantuml
@startuml
title A5 blast radius

package "engines" {
  component [diagrams/json] as JSON
  component [diagrams/yaml] as YAML
  component [diagrams/hcl] as HCL
}

package "new in this mission" {
  component [json/Mirror.ts] as MIR
  component [json/JsonCurve.ts] as JC
}

package "shared seams — DO NOT EDIT" {
  component [core/graph-layout.ts] as SEAM
  component [core/graph-layout-build.ts] as BUILD
}

package "shell" {
  component [core/svg.ts\nsvgRoot] as SVGROOT
  component [index.ts\nassembleSvg] as ASM
}

package "oracle harness" {
  component [svg-conformance/\nrender-fixture-json.ts] as RF
  component [goldens/svg-json\nsvg-yaml, svg-hcl] as GOLD
  component [svg-conformance-census.ts] as CENSUS
}

YAML --> JSON : layoutJson
HCL --> JSON : layoutJson
JSON --> SEAM : layoutGraph
SEAM --> BUILD
JSON --> MIR : transpose (T6)
JSON --> JC : edge paths (T8)
JSON --> ASM : RenderFragment
ASM --> SVGROOT
RF --> JSON
CENSUS --> RF
RF --> GOLD : compare

note bottom of SEAM
  Any edit is BLOCKED by the
  complexity hook: three pre-existing
  violations. Stop condition.
end note

note bottom of BUILD
  Shared with the class engine.
  Ask before changing (T7).
end note

note bottom of SVGROOT
  Auto-embeds 13 arrowhead <defs>
  the jar does not emit. T4's target.
end note
@enduml
```

## Ownership by batch

| Component | Batch | Task |
|---|---|---|
| `tests/oracle/svg-conformance/render-fixture-json.ts` | 1 | T1 |
| `oracle/goldens/svg-{json,yaml,hcl}/` | 1, then appended | T1, T4, T8 |
| `test-results/dot-cache/{json,yaml,hcl}/` | 1 | T2 |
| `src/diagrams/json/renderer.ts` | 2, 3 | T4, T8 |
| `src/index.ts` (shell dispatch only) | 2 | T4 |
| `src/diagrams/json/Mirror.ts` | 3 | T6 |
| `src/diagrams/json/layout.ts` | 3 | T6, T7 |
| `src/diagrams/json/json-layout-prep.ts` | 3 | T7 |
| `src/diagrams/json/JsonCurve.ts` | 3 | T8 |
| `DIVERGENCES.md`, `planning/mission-index.md` | 4 | T10 |

**One writer per file per batch.** `layout.ts` is written by T6 and T7, which is
why Batch 3 is strictly sequential rather than parallel.
