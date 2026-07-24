# G8 data flow — labeled transition

```mermaid
sequenceDiagram
  participant P as state pipeline
  participant B as graph-layout-build
  participant G as graphviz-ts
  participant A as attachTransitionLabel
  participant R as renderer / ink walk
  P->>B: edge + label text + measured box (13pt w, split h)
  B->>G: addEdge + setHtmlAttr FIXEDSIZE TABLE (T2)
  G->>G: dot places label virtual node (ED_label.pos)
  G-->>B: EdgeGeometry {points, label:{x,y}}
  B-->>P: DotLayoutResult {points, labelX, labelY, labelW, labelH}
  P->>A: transition + points + label coords
  alt labelX defined
    A->>A: centre + box -> draw anchor (T1 spec, D2)
  else no coords
    A->>A: legacy perpendicular formula (D1 fallback)
  end
  A-->>P: TransitionGeo.label {text,x,y,width,height}
  P->>R: geo
  R->>R: draw text at anchor; fold box into ink walk (T20b)
```
