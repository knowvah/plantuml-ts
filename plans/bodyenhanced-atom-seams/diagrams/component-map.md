# Component map — what this mission adds and rewires

```mermaid
graph TD
  subgraph NEW["NEW — ported this mission"]
    BF["BodyFactory<br/>create2 / create3"]
    BEA["BodyEnhancedAbstract<br/>decorate + getMarginX"]
    BE1["BodyEnhanced1<br/>getMarginX = 6"]
    BE2["BodyEnhanced2<br/>getMarginX = 0"]
    TBLB["TextBlockLineBefore<br/>separator rule"]
  end

  subgraph SHARED["SHARED pipeline — seams wired"]
    AIR["AtomImageResolver<br/>+ ink fields (T3)"]
    BLA["buildLineAtoms<br/>imgFallbackFont ALREADY exists,<br/>never passed (T3)"]
  end

  EID["EntityImageDescription<br/>name = create2, desc = create3"]
  SUP["EntityImageDescriptionSupport<br/>buildTextBlock / buildDesc"]
  SIZ["measureLeafNode<br/>routes here since T6"]
  REN["renderer-entity / renderer-symbol"]

  BF --> BE1 & BE2
  BE1 & BE2 --> BEA --> TBLB
  BF --> EID
  SUP -.->|"superseded by T4"| EID
  AIR --> SUP
  BLA --> SUP
  EID --> SIZ & REN
```

## Reading it

- `EntityImageDescription` is the convergence point. Because the SIZER has
  routed through `calculateDimensionSlow` since T6, wiring `BodyFactory`
  there serves BOTH paths — that is ADR-1, and it is why there is no
  sizer-only shim.
- The dotted edge is what T4 supersedes: our local `buildTextBlock`/
  `buildDesc` stop being the builder.
- `buildLineAtoms` is drawn as a seam that EXISTS and is never passed —
  ADR-3. The fix is threading, not new API.
- `getMarginX` 6 vs 0 is the entire folder/package story: `name` goes
  through `create2`, `desc` through `create3`.
