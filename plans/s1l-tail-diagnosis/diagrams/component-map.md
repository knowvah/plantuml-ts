# Modules under investigation

Component rather than class: the question is *what talks to what* along the
sizing path, not the type hierarchy. Every module here is **read-only** for
this mission (ADR-2) — the diagram marks where each bucket's investigation
starts, not where a fix will land.

```plantuml
@startuml
title Description sizing path — read-only investigation surface

package "description engine" {
  component [parser.ts\nelement-grammar.ts] as Parser
  component [layout.ts\nlayout-dot-tree.ts] as Layout
  component [leaf-sizing.ts] as LeafSizing
  component [leaf-sizing-text.ts] as LeafText
  component [leaf-sizing-entity.ts] as LeafEntity
  component [frontier-cluster-bbox.ts] as ClusterBbox
}

package "shared core" {
  component [creole-atoms.ts] as Atoms
  component [klimt/creole/\nStripeSimple] as Stripe
  component [skinparam.ts] as Skin
  component [measurer-deterministic.ts] as Measurer
}

component [dot-engine] as Dot
database "jar oracle\n(dot-cache)" as Oracle

Parser --> Layout : AST
Layout --> LeafSizing : measure each leaf
Layout --> ClusterBbox : container extent
Layout --> Dot : node sizes for layout
LeafSizing --> LeafText : text block width/height
LeafSizing --> LeafEntity : entity/icon shapes
LeafText --> Atoms : inline atom footprints
LeafText --> Stripe : line classification
LeafSizing --> Skin : per-element font resolution
LeafText --> Measurer : string widths
Oracle ..> Layout : compared against

note bottom of ClusterBbox
  T1 starts here (9 fixtures) --
  but the label has previously
  collected six unrelated bugs.
end note

note bottom of Atoms
  T2 (sprite, 5) and T7 (icon, 1)
  start here. Note inkSprites is a
  dead FIELD; ink is consumed via
  inlineFootprintBox.
end note

note bottom of Skin
  T3 (element-font, 5). The
  recurring gap: the renderer
  resolves it, the sizer never
  calls it.
end note

note bottom of Stripe
  T4 (titled separators, 2). Sizer
  and renderer share this
  classifier -- verify that is
  still true.
end note

note bottom of Parser
  T5 (multiline display, 2) -- a
  PARSER bug whose size delta is
  downstream.
end note
@enduml
```

## The one structural fact worth carrying into the fix mission

`leaf-sizing-text.ts` and `creole-atoms.ts` each sit on **two** buckets' paths
(T4 + T2, and T2 + T7 respectively). That is why the fix mission cannot batch
by bucket, and why T8's write-set overlap column is its most load-bearing
output.
