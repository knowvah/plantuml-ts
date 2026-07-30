# Data flow — before and after

## Before: the sizer is told the ink

```mermaid
sequenceDiagram
  participant LS as leaf-sizing.ts
  participant FB as footprintBoxes
  participant UFP as usecase-footprint.ts
  participant AIR as AtomImageResolver

  LS->>LS: hasUnroutedUsecaseMarkup? GUARD -> legacy path
  LS->>FB: footprintBoxes(display)
  FB->>AIR: resolve(atom)
  AIR-->>FB: {href,width,height, inkX,inkY,inkWidth,inkHeight}
  FB->>UFP: analytic box from DECLARED + ink fields
  UFP-->>LS: FootprintBox[]
  Note over UFP,AIR: multi-line stacking reuses one resolved<br/>value for both ink and cursor advance -> mis-stacks
```

## After: the sizer observes the ink

```mermaid
sequenceDiagram
  participant LS as leaf-sizing.ts
  participant TBIE as TextBlockInEllipse.ts
  participant FP as Footprint.ts
  participant UG as MyUGraphic

  LS->>TBIE: new TextBlockInEllipse(text, alpha)
  TBIE->>FP: new Footprint(stringBounder)
  FP->>UG: draw the text block through a point collector
  UG-->>FP: XPoint2D per drawn mark
  FP-->>TBIE: getEllipse(text, alpha)
  TBIE-->>LS: dimension
  Note over FP,UG: ink is OBSERVED, not declared --<br/>no channel needed, stacking dissolves
```

The renderer already runs the second flow (`USymbolUsecase.ts` →
`TextBlockInEllipse.ts`). This mission makes the sizer run it too.
