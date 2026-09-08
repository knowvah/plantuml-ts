# Data flow — where the per-element size is lost

Today the activity engine takes one number, the diagram-wide root font
size, and applies it to every element. Upstream resolves a distinct value
per element kind from a diagram-scoped style signature.

```plantuml
@startuml
title Font size resolution -- today vs upstream

skinparam defaultTextAlignment left

package "upstream (plantuml.skin)" {
  card RootSkin as "root FontSize 14\n(plantuml.skin:10)"
  card ActivityBlock as "activityDiagram block\n(plantuml.skin:358-385)\nactivity 12 / diamond 11 / arrow 11"
  card NoteBlock as "note FontSize 13\n(plantuml.skin:317-321)"
  card Signature as "StyleSignatureBasic\n(root, element, activityDiagram, <sname>)"
}

package "plantuml-ts today" {
  card ThemeRoot as "theme.fontSize = 14\n(theme.ts:330)"
  card Sizer as "activity-layout-helpers.ts\nmeasures at 14"
  card Renderer as "activity-renderer-shapes.ts\ndraws at 14"
  card Bucket as "theme.colors.elements\nFLAT map, no activity SNames"
}

RootSkin --> Signature : contributes the base tier
ActivityBlock --> Signature : overrides per element kind
NoteBlock --> Signature : contributes the note tier
Signature --> Renderer : upstream resolves 12 / 11 / 13 here

RootSkin --> ThemeRoot : baked in as a constant
ActivityBlock ..> Bucket : NEVER reaches it
Bucket ..> Sizer : no activity key to read
ThemeRoot --> Sizer : the only value that arrives
ThemeRoot --> Renderer : the only value that arrives
Sizer --> Renderer : geometry, measured at the wrong size

note bottom of Bucket
  style-map-element.ts:76-85 collapses
  a diagramType-dot-sname selector to the
  bare sname, so the map cannot carry a
  diagram-scoped default. See decision D2.
end note
@enduml
```

## After this mission

```plantuml
@startuml
title Font size resolution -- the two-tier cascade this mission installs

card Defaults as "activity-style-defaults.ts\none constant per plantuml.skin value"
card Bucket as "theme.colors.elements\nuser overrides only"
card Resolver as "activityFontSize(theme, sname)"
card Sizer as "activity-layout-helpers.ts"
card Renderer as "activity-renderer-shapes.ts"

Bucket --> Resolver : tier 1 -- user override, may be absent
Defaults --> Resolver : tier 2 -- built-in default, always present
Resolver --> Sizer : one resolved number per element kind
Resolver --> Renderer : the SAME resolved number

note right of Resolver
  resolveElementFontSize returns undefined
  when the element declares no override --
  its doc comment reserves the fallback to
  the caller. That fallback is tier 2.
end note

note bottom of Renderer
  Sizer and renderer must read the same
  resolver. A divergence here is the
  mission's second defect (decision D6).
end note
@enduml
```
