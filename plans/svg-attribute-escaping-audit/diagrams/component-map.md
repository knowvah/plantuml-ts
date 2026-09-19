# Component map — two emission paths, one escaper

```plantuml
@startuml
package "src/core" {
  component [svg-format.ts] as FMT
  component [svg.ts\nattrs / attrsFromRecord / formatAttrValue] as SVG
  component [svg-shapes.ts] as SHP
  component [svg-markers.ts] as MRK
  component [paint.ts] as PNT
  component [klimt/drawing/svg/xml-writer.ts] as XW
  component [klimt/drawing/svg/svg-graphics*.ts] as SG
  component [klimt/document-shell.ts] as SHELL
}
package "src/diagrams" {
  component [shadow / chart / board / pseudostate emitters] as DIA
}
component [eslint no-restricted-syntax\n(TemplateElement …="$)] as LINT

SVG --> FMT : escapeAttribute / escapeText (D1)
XW --> FMT : escapeAttribute / escapeText (D1)
SG --> XW : XmlNode tree (faithful path)
SHP --> SVG : attrs() (T4)
MRK --> SVG : attrs() (T4)
PNT --> SVG : attrs() (T3b)
SHELL --> FMT : escapeAttribute (T3b)
DIA --> SVG : attrs() (T5a)
LINT ..> SHP : forbids name="${…}
LINT ..> MRK : forbids name="${…}
LINT ..> DIA : forbids name="${…}
@enduml
```

Touched by this mission: everything except `svg-graphics*.ts` (already on
the faithful path) — it is shown because `xml-writer.ts` is the proof that
the character sets in `svg-format.ts` are the jar's.
