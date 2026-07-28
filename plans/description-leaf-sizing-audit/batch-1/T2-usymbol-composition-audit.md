# T2 — USymbol composition audit

## Context

Four times last session the defect was that a symbol **composes
differently upstream**, not that one of our constants was wrong. Each was
found the expensive way — one fixture at a time:

| symbol(s) | upstream truth | our error |
|---|---|---|
| interface, circle | `hideText = symbol == INTERFACE`; `asSmall` built from EMPTY name/desc/stereo → bare `CircleInterface2` (radius 8 + margin 1 = 18px = 0.25in), label drawn OUTSIDE | sized as a generic text box |
| folder, package | ONE `USymbolFolder(sname, showTitle)`; `asSmall = getMargin().addDimension(dimName.mergeTB(dimStereo, dimLabel))`, so the tab is a mergeTB BLOCK that FLOORS width | modelled as margin + a fixed icon allowance, which cannot express a width floor |
| usecase | `TextBlockInEllipse`: alpha from `calculateDimension`, but the ellipse is fit to `Footprint` POINTS via smallest-enclosing-circle | closed-form bounding-box diagonal (right only for 2 opposite corners / a rectangle's 4) |
| control, entity, boundary | `USymbolSimpleAbstract`: fixed drawing STACKED above the label (Control 32×32, EntityDomain 32×32, Boundary 49×32 — all `radius*2 + 2*margin`) | fell to `measureBox`'s generic [20,20] |

There are **36** symbols in `USymbols.java` and our `SYMBOL_BOX_MARGIN`
has ~21 entries. The rest of the mismatches are still unfound.

## Task

Produce `planning/usymbol-composition.md`: one row per upstream symbol,
read from the Java, with every mismatch named.

## Write-set

- `planning/usymbol-composition.md` (new)

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/symbol/`
  — the WHOLE package (`USymbols.java` first, then every `USymbol*.java`)
- the `svek/` drawing classes those symbols instantiate:
  `CircleInterface2`, `Control`, `Boundary`, `EntityDomain`, and any
  others the package references
- `src/diagrams/description/leaf-sizing.ts` — `measureLeafNode`'s switch
- `src/diagrams/description/leaf-sizing-consts.ts` — the five tables
- `src/core/descriptive-keywords.ts` — our `USymbol` union / keyword map

## Interface contract (consumed by Batch 4)

Row schema, exactly:

```
| symbol | upstream class | asSmall composition | drawing calculateDimension | our dispatch | verdict |
```

`verdict` ∈ `match` | `MISMATCH` | `untested`. `MISMATCH` rows are the
Batch-4 task list; `untested` means no fixture exercises it AND no probe
was run.

## Acceptance criteria

- Given all 36 `USymbols.java` entries, then every one has a row and no
  `verdict` cell is blank
- Given a symbol we route to `measureBox`, when upstream extends
  `USymbolSimpleAbstract` or `USymbolFolder`, then the row is `MISMATCH`
  and names the composition
- Given a `MISMATCH` with no failing fixture, then the row carries a jar
  probe — the exact command and the numbers — as evidence (ADR-4)
- Given the doc, then it has a "reuse for another engine" section: the
  procedure must be engine-agnostic (ADR-5)
- Given any row, then its composition column cites a Java `file:line` —
  NOT one of our source files

## Observability

N/A — documentation only.

## Rollback

Reversible. No source or pin changes in this task.

## Quality bar

No code changes, so gates cannot regress — but run `npm test` once to
confirm you did not accidentally edit source. A row filled in from our
own code is a STOP condition, not a defect to fix later.
