# Data flow — the two channels, before and after

## Upstream (the reference)

Two channels, structurally independent because they are different method
calls on different objects. Nothing computes an "ink box" — the narrowing is
emergent.

```mermaid
sequenceDiagram
    participant Sheet as SheetBlock1
    participant Atom as AtomSprite
    participant Nano as SvgNanoParser
    participant FP as Footprint

    Note over Sheet,Atom: LAYOUT channel
    Sheet->>Atom: calculateDimensionSlow()
    Atom-->>Sheet: DECLARED box (16x16)

    Note over Nano,FP: INK channel
    Nano->>Nano: drawU() walks raw SVG
    loop each path / circle / ellipse
        Nano->>FP: drawPath(primitive)
        FP->>FP: record real min/max corners
    end
    FP-->>FP: ellipse fits OBSERVED ink
```

## This port, before the mission (the bug)

One channel. `drawAtoms` emits a single opaque `UImage`, so the jar-verified
`svgInkBox` precomputation has nowhere to go but the field `SheetBlock1` also
reads for line stacking.

```mermaid
sequenceDiagram
    participant Leaf as leaf-sizing#fitToInk
    participant Res as AtomImageResolver
    participant Draw as drawAtoms
    participant Sheet as SheetBlock1

    Leaf->>Res: substitute INK box as the resolved dimension
    Res-->>Draw: {href, width=INK, height=INK}
    Draw->>Draw: one opaque UImage
    Draw->>Sheet: cursor advances by INK width
    Note over Sheet: line 1 correct (only the ellipse reads it)
    Note over Sheet: line 2 stacks on INK height -> 0.029321in widening
```

## This port, after the mission

Two channels again, and structurally unable to recollapse: ink exists only
inside `primitives`, layout only in `width`/`height`.

```mermaid
sequenceDiagram
    participant Res as resolveSpriteAtom (T9)
    participant Nano as SvgNanoParser (T6/T8)
    participant Draw as drawAtoms (T7)
    participant Sheet as SheetBlock1
    participant FP as Footprint

    Res->>Nano: decompose sprite SVG
    Nano-->>Res: UPath[] primitives
    Res-->>Draw: {kind:'drawable', primitives, width=DECLARED, height=DECLARED}

    Note over Draw,Sheet: LAYOUT channel
    Draw->>Sheet: cursor advances by DECLARED width

    Note over Draw,FP: INK channel
    loop each primitive
        Draw->>FP: draw UPath
        FP->>FP: record real min/max corners
    end
```
