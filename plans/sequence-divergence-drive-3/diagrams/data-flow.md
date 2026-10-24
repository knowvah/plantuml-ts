# sdd3 — data flows

Three flows change in this drive. Each diagram shows the target (post-sdd3)
behaviour, not the current one.

## 1. Remote images: async pre-fetch, sync render (D3)

`render()` resolves remote image URLs before the sync pipeline runs;
`renderSync` never fetches.

```plantuml
@startuml
title Remote image resolution (D3)
actor Caller
participant "render()" as R
participant "ImageProvider\n(browser or network)" as P
participant "asset store seam" as A
participant "sync pipeline\n(parse, layout, render)" as S

Caller -> R : source + imageProvider
R -> R : preprocess, collect unique\nhttp(s) image URLs
loop each URL allowed by SecurityProfile / SURL
  R -> P : fetch(url)
  alt CSP allows origin and fetch succeeds
    P --> R : bytes + mimeType
    R -> A : store under the remote-image key
  else blocked by connect-src
    P -> P : console.warn(origin, directive, fix)
    P --> R : blocked
  else timeout or HTTP error
    P --> R : failed
  end
end
R -> S : render with the asset store
S -> A : look up the URL
alt bytes present
  A --> S : bytes
  S --> R : SVG embeds data URI (jar: AtomImgSvg / AtomImg)
else absent
  S --> R : jar text "(Cannot decode SVG: url)"
end
R --> Caller : SVG
@enduml
```

## 2. Sequence export: chrome, then scale (D7)

The jar composes the chrome around the body first and applies the export
scale to the whole block, the factor taken from the chromed size.

```plantuml
@startuml
title Sequence export order after T3b (D7)
participant "sequence renderer" as Seq
participant "core UgDiagram" as Ug
participant "core TextBlockExporter" as Tbe
participant "SVG driver" as Svg

Seq -> Ug : body as a text block (unscaled)
Ug -> Ug : add chrome: title, legend,\nheader, footer, caption
Ug -> Tbe : chromed block
Tbe -> Tbe : factor from the chromed dimension\n(TextBlockExporter.java:160-177)
Tbe -> Tbe : handwritten? wrap the graphic\n(TextBlockExporter.java:174-175, T8f)
Tbe -> Svg : draw scaled, margin, ensureVisible
Svg --> Tbe : SVG
@enduml
```

## 3. SAX sprite parsing: two passes (D2)

```plantuml
@startuml
title SAX sprite parsing (D2)
participant "sprite drawing" as D
participant "SvgSpriteParserFactory" as F
participant "xmldom event adapter" as X
participant "DefsCollector (pass 1)" as C
participant "RenderHandler (pass 2)" as H
participant "UGraphic" as U

D -> F : sprite SVG + svgparser pragma
alt pragma is sax
  F -> X : parse (strict, no DOCTYPE)
  X -> C : start / end / characters events
  C --> F : definitions by id
  F -> X : parse again
  X -> H : start / end / characters events
  H -> U : shapes, text, images, use, gradients
else default
  F -> D : nano parser (unchanged)
end
@enduml
```
