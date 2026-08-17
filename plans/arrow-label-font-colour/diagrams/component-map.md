# Component map — arrow-label-font-colour

Which modules carry the arrow FontColor from source to ink, and which task
touches each. Solid = exists today (SI24 D3 built the font path); the
mission adds the `color`/`cardinalityFontColor` slots along the same edges.

```plantuml
@startuml
skinparam componentStyle rectangle

package "input" {
  [skinparam ArrowFontColor /\ndefaultFontColor] as SP
  [<style> arrow { FontColor }\narrow.cardinality { FontColor }] as ST
}

package "src/core (T1, T2)" {
  [skinparam-key-handlers.ts\n+ skinparam-accumulator.ts] as KH
  [skinparam-theme-builder.ts] as TB
  [style-cascade-class.ts\ncomputeArrowFontOverride\ncomputeCardinalityFontOverride] as SC
  [style-map-theme.ts] as SM
  database "Theme\ncolors.graph.arrowFontColor\ncardinalityFontColor" as TH
  [arrow-label-font.ts\nresolveArrowLabelFont().color\nresolveCardinalityFontColor()] as RES
}

package "renderers (T3, T4, T5)" {
  [class/renderer-edge.ts\ntext + magicArrowPolygon + tail/head] as CR
  [description/renderer-edge.ts\narrowLabelFontConfig] as DR
  [state/state-renderer-transitions.ts] as SR
}

SP --> KH : source-order handlers (T1)
KH --> TB : acc.arrowFontColor (T1)
TB --> TH : GRAPH_OVERRIDE_FIELDS (T1)
ST --> SC : resolveStyleCascade,\nlast declared wins (T2)
SC --> SM : arrowFontColor,\ncardinalityFontColor (T2)
SM --> TH : graph override + top-level fold (T2)
TH --> RES : the ONE reader (T1)
RES --> CR : color / cardinality color (T3)
RES --> DR : FontConfiguration.color (T4)
RES --> SR : fill (T5)
@enduml
```
