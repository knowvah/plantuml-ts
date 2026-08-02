# Component map — module dependencies

Arrows point consumer → dependency. Task ownership in parentheses.
Everything is NEW this brief; no existing module is modified.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "tests/oracle/svg-conformance" {
  [normalize.ts (T1)] as norm
  [compare.ts (T1)] as cmp
  [emitter.golden.test.ts (T6)] as suite
}

package "src/core/klimt" {
  [UGraphic / AbstractCommonUGraphic /\nUParam / UTranslate / UStroke (T2)] as model
  [shape/UPath UEllipse ULine URectangle\nUPolygon UText UComment UGroup DotPath (T3)] as shapes
  [drawing/svg: xml-writer + SvgGraphics (T4)] as ser
  [drawing/svg: driver-*-svg + UGraphicSvg (T5)] as drv
}

[core/paint.ts (existing, render-fidelity)] as paint

cmp --> norm
suite --> cmp
suite --> drv
shapes --> model
ser --> shapes
drv --> model
drv --> shapes
drv --> ser
model --> paint
drv --> paint
@enduml
```

## Batch → module

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[Batch 1\nT1 harness ∥ T2 model] as B1
[Batch 2\nT3 shapes] as B2
[Batch 3\nT4 serializer] as B3
[Batch 4\nT5 drivers] as B4
[Batch 5\nT6 suite ∥ T7 docs+charter] as B5

B1 --> B2
B2 --> B3
B3 --> B4
B4 --> B5
B1 --> B5
@enduml
```

## Coexistence (program view)

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[18 diagram renderers] as renderers
[core/svg.ts (legacy emitter)] as svgts
[description engine] as desc
[core/klimt (this brief)] as klimt2
[remaining renderers] as others
[✕] as gone

renderers --> svgts : today
desc ..> klimt2 : Brief 2
others ..> klimt2 : follow-up missions
svgts ..> gone : retired after last migration
@enduml
```
