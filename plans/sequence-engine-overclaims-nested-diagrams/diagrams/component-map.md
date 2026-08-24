# Component map — what decides what

The decision surface is four modules plus thirteen per-plugin `accepts`
implementations. Highlighted components are written by this mission.

```plantuml
@startuml
skinparam componentStyle rectangle

package "src/core" {
  component [block-extractor.ts\ndetectUmlType] as BE #LightYellow
  component [dispatcher.ts\nDiagramRegistry.resolve] as REG #LightYellow
  component [descriptive-keywords.ts\nhasDescriptiveSignal] as DK #LightYellow
}

package "src/diagrams" {
  component [sequence/index.ts\nSEQUENCE_PATTERNS] as SEQ #LightYellow
  component [class/class-dispatch.ts\nclassAccepts] as CLS #LightYellow
  component [json/index.ts + yaml/index.ts] as JY #LightYellow
  component [nine other plugins] as OTH
}

component [src/index.ts\nregistration order] as IDX #LightYellow

package "tests/oracle" {
  component [routing-conformance.test.ts] as GATE #LightGreen
  component [routing-baseline.json] as BASE #LightGreen
}

IDX --> REG : registers plugins\nin order
BE --> REG : candidate type
REG --> SEQ : accepts(lines)
REG --> CLS : accepts(lines)
REG --> JY : accepts(lines)
REG --> OTH : accepts(lines)
SEQ --> DK : declines on\ndescriptive signal
CLS --> DK : shares the helper
GATE --> REG : renders every fixture
GATE --> BASE : compares against\nthe jar's own type

note bottom of GATE
  The only thing that can
  detect a misroute: every
  affected fixture still
  renders successfully.
end note
@enduml
```

## Ownership per bucket

| Bucket | Component | Task |
|---|---|---|
| 70 sequence underclaims | `src/index.ts` order | T2 |
| fast-path scoping | `dispatcher.ts`, `block-extractor.ts` | T3 |
| `-->` in a string literal | `sequence/index.ts` | T4 |
| `queue`/`entity` over-decline | `descriptive-keywords.ts` | T5 |
| `{...}` in prose | `json/index.ts`, `yaml/index.ts` | T6 |
| `map ... {` object syntax | `class/class-dispatch.ts` | T7 |
