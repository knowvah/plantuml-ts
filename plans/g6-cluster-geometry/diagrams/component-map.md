# Component map — what G6 touches

```mermaid
graph TD
    subgraph state["src/diagrams/state/"]
        SCC["state-composite-cluster.ts<br/>titleTableEligible · title height (T7)<br/>border-point gate (T9)"]
        SCS["state-composite-sizing.ts<br/>WithLabel port-block sizing (T9)"]
        SDG["state-dot-graph.ts<br/>border-point rank-chain DOT (T9)"]
        RG["renderer-group.ts /<br/>renderer-composite-box.ts<br/>class attr (T3)"]
        SRC["state-render-colors.ts<br/>style cascade consumption (T4)"]
    end
    subgraph core["src/core/"]
        GLB["graph-layout-build.ts<br/>vertical margin, if seam-side (T2)"]
        GLT["graph-layout.types.ts<br/>DotInputCluster seam fields (T2/T7)"]
        SKP["skinparam.ts<br/>style-block selectors (T4)"]
    end
    GVTS["graphviz-ts (pinned .tgz)<br/>rank-sep fix, if library-side (T2)"]
    ORACLE["oracle/goldens/state/<br/>pins + size-backlog.json (T5/T7/T10)"]

    SCC -->|DotInputCluster| GLB
    GLB -->|DOT| GVTS
    SDG -->|DOT shape| GLB
    SKP --> SRC
    SRC --> RG
    SCC --> SCS
    RG -.->|byte-compare| ORACLE
```

Read-only references: `~/git/plantuml` (svek Cluster/ClusterHeader,
EntityImageStateBorder, net/atmp), `~/git/graphviz/lib/dotgen/
position.c` (cluster rank-sep).
