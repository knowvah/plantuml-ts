# Component map

Green = created, amber = modified, grey = read-only context.
Task IDs in brackets.

```mermaid
graph TD
    subgraph new["New ports (982 Java lines)"]
        SP["SvgPath.ts<br/>[T1] &larr; openiconic/SvgPath.java 255"]
        CR["ColorResolver.ts<br/>[T2] &larr; emoji/ColorResolver.java 77"]
        UGS["UGraphicWithScale.ts<br/>[T3] &larr; emoji/UGraphicWithScale.java 128"]
        NANO["SvgNanoParser.ts<br/>[T6 core, T8 shapes]<br/>&larr; svg/parser/ 522"]
    end

    subgraph mod["Modified"]
        BBOX["svg-path-bbox.ts [T5]"]
        ATOMS["creole-atoms.ts [T4]<br/>AtomImageResolver union"]
        DRAW["EntityImageDescriptionSupport.ts [T7]<br/>drawAtoms"]
        RENDER["render-atoms.ts [T9]<br/>resolveSpriteAtom"]
        LEAF["leaf-sizing.ts [T10]<br/>retire fitToInk"]
    end

    subgraph ro["Read-only context"]
        UPATH["klimt/shape/UPath.ts<br/>minmax rule + getters"]
        SHEET["SheetBlock1.ts:180-182<br/>line-stacking cursor"]
        DRIVER["driver-path-svg.ts<br/>UPath to SVG path"]
        OIC["openiconic-glyphs.ts<br/>STOP if touched"]
        CLASS["class-layout-leaf-shapes.ts<br/>STOP if touched"]
    end

    SP --> NANO
    CR --> NANO
    UGS --> NANO
    SP --> BBOX
    UPATH -.-> SP
    UPATH -.-> BBOX
    NANO --> RENDER
    ATOMS --> DRAW
    ATOMS --> RENDER
    DRAW --> LEAF
    RENDER --> LEAF
    DRIVER -.-> DRAW
    SHEET -.-> DRAW
    OIC -.->|rejected ADR-1 C| SP
    CLASS -.->|blocks retiring<br/>the substitute| LEAF

    style SP fill:#d4f7d4
    style CR fill:#d4f7d4
    style UGS fill:#d4f7d4
    style NANO fill:#d4f7d4
    style BBOX fill:#ffe8b3
    style ATOMS fill:#ffe8b3
    style DRAW fill:#ffe8b3
    style RENDER fill:#ffe8b3
    style LEAF fill:#ffe8b3
    style UPATH fill:#e8e8e8
    style SHEET fill:#e8e8e8
    style DRIVER fill:#e8e8e8
    style OIC fill:#e8e8e8
    style CLASS fill:#e8e8e8
```

## Blast radius — why 390 goldens guard a description fix

`drawAtoms` is private to `EntityImageDescriptionSupport.ts` and called only
from `buildTextBlock#drawU` — but `buildTextBlock` is the SHARED creole
renderer:

```mermaid
graph LR
    DRAW["drawAtoms [T7]"] --> BTB["buildTextBlock#drawU"]
    BTB --> EID["EntityImageDescription.ts:287"]
    BTB --> DEL["EntityImageDescriptionDelegates.ts:254"]
    BTB --> RE["renderer-entity.ts:294,351"]
    BTB --> RC["renderer-cluster.ts:92,99"]
    BTB --> CM["class-member-creole.ts"]
    BTB --> COM["class-object-map-sizing.ts"]

    CM --> G1["svg-class: 310 goldens"]
    COM --> G2["svg-object: 23 goldens"]
    RE --> G3["svg-state: 57 goldens"]
```

None of those 390 goldens contains a sprite, so they cannot churn — any diff
is collateral damage in the shared renderer. That is why a diff is a STOP
rather than an expected update.
