# sdd3 — component map

Components the drive touches, grouped by layer, with the batch that changes
each. Core components (bottom) reach every engine, so their batches run the
all-engine survey after every commit.

```plantuml
@startuml
title sdd3 component map
skinparam componentStyle rectangle

package "public API" {
  [render / renderSync] as API
  [RenderOptions\n+imageProvider +filename (B6)] as OPT
  [image-providers entry\nbrowser, network (B6)] as IMP
}

package "sequence engine (src/diagrams/sequence)" {
  [parser + commands\npar2, topurl, svgparser pragma (B1, B4)] as SP
  [layout + live boxes\nnote anchor, life step (B1)] as SL
  [renderer modules\nmove to UGraphic (B8)] as SR
  [scale-geo\nreplaced by the core exporter (B3)] as SG
}

package "core (src/core)" {
  [UgDiagram / TextBlockExporter\nchrome then scale, handwritten (B3, B8)] as EXP
  [SVG drivers\nalpha fill, strokeless path, lengthAdjust, xlink (B0, B2, B3)] as DRV
  [creole commands\nURL split, svg attribute (B2)] as CR
  [SAX sprite parser (B4)] as SAX
  [image resolver + asset store (B4, B6)] as IMG
  [preprocessor env: filename (B6)] as PRE
  [latex-metrics: array (B7)] as TEX
  [document margin from style (B2)] as DM
}

API --> OPT : reads
API --> PRE : preprocess
API --> SP : parse
SP --> SL : AST
SL --> SR : geometry
SR --> EXP : body block
EXP --> DM : margin
EXP --> DRV : draw
SR --> CR : labels
CR --> IMG : image atoms
IMG --> SAX : svgparser sax
IMG --> TEX : math images
OPT --> IMP : imageProvider
API --> IMP : pre-fetch (async render only)
IMP --> IMG : bytes via the asset store
SG ..> EXP : superseded in B3
@enduml
```
