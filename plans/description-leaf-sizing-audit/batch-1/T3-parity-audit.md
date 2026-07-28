# T3 — Renderer↔sizer parity audit

## Context

**The** recurring gap: a feature reaches the RENDERER and the SIZER never
calls it. Four instances, all found the expensive way:

| feature | renderer had it | sizer did not |
|---|---|---|
| creole lexer | `buildLineAtoms` | sizer still used `parseCreole`, disagreeing on unclosed tags |
| `skinparam wrapWidth` | `Fission#getSplitted` ported AND wired | sizer never called it — wrapped diagrams measured unwrapped |
| use-case fit | `Footprint` + SEC | sizer used a closed-form bbox |
| per-element `FontSize` | `resolveElementFontSize` via `renderer-symbol.ts#textFont` | sizer measured at the diagram font |

Measured starting evidence (`grep -rl` over renderer vs sizer modules):

```
resolveElementShadowing        renderer=2 sizer=0   GAP CANDIDATE
resolveElementLineThickness    renderer=1 sizer=0   GAP CANDIDATE
resolveElementPaint            renderer=2 sizer=0   likely size-neutral
resolveElementFontSize/Font    renderer=1 sizer=2   threaded (S1L-h)
resolveElementMinimumWidth     renderer=0 sizer=1   sizer-only by design
HeaderFont/HeaderBackground/Background/BucketSelector  0/0  UNUSED
```

## Task

Produce `planning/sizer-renderer-parity.md`: every per-element and
per-diagram setting, where the renderer consults it, where the sizer does,
and a verdict.

## Write-set

- `planning/sizer-renderer-parity.md` (new)

## Read-set

- `src/core/theme-element-resolve.ts` — all 10 `resolveElement*`
- `src/diagrams/description/renderer-*.ts`, `src/core/svek/image/EntityImageDescription*.ts`
- `src/diagrams/description/layout.ts` — `ClassifyCtx` construction
- `src/diagrams/description/layout-dot-tree.ts` — what reaches `BoxSizingOpts`
- `src/diagrams/description/leaf-sizing*.ts`
- `planning/mission-guide.md` — the files-diagram 14pt/12pt entry, same class

## Interface contract (consumed by T4, T5, Batch 4)

```
| setting | resolver / source | renderer call site | sizer call site | verdict |
```

`verdict` ∈ `threaded` | `GAP` | `size-neutral (<reason>)`. The
`size-neutral` reasons become T5's allow-list verbatim.

## Acceptance criteria

- Given all 10 `resolveElement*` PLUS the non-resolver per-diagram
  settings (`wrapWidth`, `guillemet`, `componentStyle`, `sprites`,
  `inkSprites`, `tabSize`), then each has a row and a verdict
- Given a `size-neutral` verdict, then it states WHY in the row (e.g.
  "colour only — never enters `calculateDimension`")
- Given the four historical instances, then the doc records that **only
  ONE was resolver-shaped**, so a resolver-grep guard cannot cover the
  class (this feeds ADR-3's known limit)
- Given the doc, then it has a "reuse for another engine" section naming
  the files-diagram 14pt/12pt bug as an open instance elsewhere
- Given a `GAP` verdict, then it does NOT get fixed here — it becomes a
  Batch-4 row

## Observability

N/A — documentation only.

## Rollback

Reversible. No source or pin changes.

## Quality bar

No code changes. Do not "helpfully" thread a gap you find — recording it
is this task's whole job; fixing it belongs to a task with a write-set.
