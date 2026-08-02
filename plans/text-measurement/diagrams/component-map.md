# Component Map

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[StringMeasurer interface\n+measure()\n+getDescent(] as IF
[FormulaMeasurer\nWIDTH table port\nheight=size\ngetDescent=size/4.5] as FM
[CanvasMeasurer\nCanvas API\nLRU cache 8192\ngetDescent=size/4.5] as CM
[FixedMeasurer\ndeterministic tests\ngetDescent=lineHeight/4.5] as FX
[WIDTH: readonly number[]\n96 values, raw px @ 12px\nfrom StringBounderFixed.java] as W
[diagram layouts\nsequence / class / activity\nstate / usecase / component] as DL

IF --> FM
IF --> CM
IF --> FX
FM --> W
CM --> FM : fallback
DL --> IF : inject
@enduml
```
