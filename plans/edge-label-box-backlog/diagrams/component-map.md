# Component map — what this mission touches

Solid arrows are call edges after the mission; the dotted one is M3's suspected
origin, unconfirmed until T3 reports.

```plantuml
@startuml
title Components touched by edge-label-box-backlog

package "src/core" {
  component [edge-label-box] as EB
  component [style-cascade-class] as SC
  component [svek-dot-emit-labels] as EM
}

package "src/diagrams" {
  component [class-layout-edge-labels] as CL
  component "link-edge-attrs (description)" as DL
  component [state-dot-graph] as SD
  component [class-edge-geo] as CG
}

package "gates and instruments" {
  component [dot-sync-report] as DS
  component [shape-match-report] as SH
  component [label-size-backlog.json] as BL
  component [label-box-triage] as TR
}

CL --> SC : cardinality font (T1)
CL --> EB : quantifier and merged box (T6, T10)
DL --> EB : quantifier box (T7)
SD --> EB : merged box (T9)
EB --> EM : reserved dimensions
EM --> DS : emitted DOT, compared to oracle
DS --> BL : asserts each slug fails label size only
TR --> BL : reports per-slug mismatches (T2)
CG ..> CL : tail and head assignment (M3, T3)
EM --> SH : rendered geometry census
@enduml
```

## Ownership, one writer per file

| Component | Owned by |
|---|---|
| `edge-label-box` | T5, then T8 — never concurrently |
| `style-cascade-class` | T1 |
| `class-layout-edge-labels` | T6, then T10 |
| `link-edge-attrs` | T7 |
| `state-dot-graph`, `state-composite-edge-label` | T9 |
| `class-edge-geo` | T11, only if T3 confirms it |
| class + object backlogs | T6, then T10 |
| description backlog | T7 |
| state backlog | T9 |

`edge-label-box` is the only file two tasks both need, which is why Batches 2
and 4 each hold a single task. Everything else is disjoint within its batch.
