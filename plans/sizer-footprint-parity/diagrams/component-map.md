# Component map

What this mission touches, and the sizer↔renderer split it closes.

```mermaid
graph TD
  subgraph upstream["upstream (the spec)"]
    AI["AtomImg.create<br/>java:106-107<br/>HARDCODES monospace(14)"]
    TBIE_J["TextBlockInEllipse.java:60"]
    FP_J["Footprint<br/>point-collecting UGraphic"]
    TBIE_J --> FP_J
  end

  subgraph renderer["our RENDERER — already faithful"]
    USU["USymbolUsecase.ts:14"]
    TBIE["TextBlockInEllipse.ts:37-38"]
    FP["Footprint.ts"]
    USU --> TBIE --> FP
  end

  subgraph sizer["our SIZER — the divergence"]
    LS["leaf-sizing.ts<br/>(two guards, T3)"]
    LST["leaf-sizing-text.ts<br/>footprintBoxes"]
    UFP["usecase-footprint.ts<br/>152-line SUBSTITUTE<br/>DELETED by T2"]
    LS --> LST --> UFP
  end

  subgraph seams["dead seams — DELETED"]
    IFF["imgFallbackFont<br/>StripeSimple + Support<br/>DELETED by T1"]
    INK["AtomImageResolver<br/>ink fields<br/>DELETED by T2"]
  end

  AI -.->|T1 reproduces| IFF
  FP_J -.->|T2 routes sizer to| FP
  LST -.->|T2 re-points| TBIE

  UNTOUCHED["Sea / SheetBlock1 / AtomOps<br/>ADR-3: one value per atom is FAITHFUL<br/>NOT TOUCHED"]

  style UFP fill:#fdd,stroke:#900
  style IFF fill:#fdd,stroke:#900
  style INK fill:#fdd,stroke:#900
  style UNTOUCHED fill:#dfd,stroke:#090
```

**The shape of the bug:** the renderer already reaches upstream's real
`Footprint`; the sizer runs a parallel analytic substitute. Everything red
above exists only to feed that substitute. Delete it and the seams have no
reason to exist.
