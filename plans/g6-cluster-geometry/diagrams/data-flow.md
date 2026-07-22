# Data flow — cluster geometry pipeline and where each batch acts

```mermaid
sequenceDiagram
    participant P as state parser/AST
    participant C as state-composite-cluster.ts
    participant B as graph-layout-build.ts (seam)
    participant G as graphviz-ts (layout)
    participant R as state renderers
    participant O as oracle ratchet

    P->>C: composite states + classification
    Note over C: titleTableEligible?<br/>B3 relaxes lineCount gate (T7)<br/>B4 relaxes border-point gate (T9)
    C->>B: DotInputCluster<br/>(titleTableWidth/Height, innerMarginLevels)
    Note over C,B: B3: titleTableHeight = derived formula (T7)<br/>B1: vertical margin input, if seam-side (T2)
    B->>G: DOT text (wrapper subgraphs, rank chains)
    Note over G: B1: rank-sep fix, if library-side (T2)<br/>B4: border-point rank-chain shape (T9)
    G-->>B: DotLayoutResult (+ clusters)
    B-->>C: positioned geometry
    C->>R: composite boxes
    Note over R: B2: class="cluster" (T3)<br/>B2: style cascade colors (T4)
    R->>O: SVG string
    Note over O: byte-compare vs jar oracle<br/>pin zero-diffs, tighten backlog (T5/T10)
```
