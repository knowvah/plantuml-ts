# Component map — module dependencies

Arrows point from consumer to dependency. `paint.ts` is the root; the descriptive
renderers are the leaves. Task ownership in parentheses.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[core/paint.ts\nPaint, Gradient, parseColor, paintToSvg (T1)] as paint
[core/svg.ts\nprimitives accept Paint, emit defs (T2)] as svg
[core/theme.ts\ncolors: Paint, buckets, resolveElementPaint (T3/T9)] as theme
[core/skinparam.ts\nparse gradient + per-element keys (T4)] as skin
[core/style-map-theme.ts\nelement-scoped routing (T5)] as stylemap
[core/usymbol-shapes.ts\nfaithful 4-USymbol geometry (T6)] as usym
[diagrams/description/renderer-helpers.ts (T7)] as desc
[diagrams/class/renderer.ts (T8)] as cls

svg --> paint
theme --> paint
skin --> paint
skin --> theme
stylemap --> theme
stylemap --> paint
usym --> svg
usym --> theme
desc --> usym
desc --> theme
cls --> usym
cls --> theme
@enduml
```

## Batch → module

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[Batch 1\nT1 paint] as B1
[Batch 2\nT2 svg · T3 theme] as B2
[Batch 3\nT4 skin · T5 stylemap · T6 usymbol] as B3
[Batch 4\nT7 description · T8 class] as B4
[Batch 5\nT9 default flip + baselines] as B5

B1 --> B2
B2 --> B3
B3 --> B4
B4 --> B5
@enduml
```
