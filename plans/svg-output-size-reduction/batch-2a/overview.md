# Batch 2a — Port both emitters

⚠️ **Gate deferred (ADR-5).** Do not run the full gates at the end of this
batch and do not treat a red suite as a stop condition. From here until the
end of batch-2d the goldens and the emitters are inconsistent by design.
`npm run typecheck` and `npm run lint` should still pass — those are not
output-dependent, and a failure in either IS a real defect.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | klimt core: rules 1, 2, 4, 6 + root `g` attrs | typescript-pro | `svg-graphics-core.ts` + test | T1 | [ ] |
| T4 | klimt text: rules 3, 5 | typescript-pro | `svg-graphics-elements.ts`, `driver-text-svg.ts` + tests | T3 | [ ] |
| T5 | `core/svg.ts`: central format + all six rules | typescript-pro | `src/core/svg.ts`, `src/core/svg-shapes.ts` + test | T1 | [x] |
| T5b | Root `<g>` attributes across all shells | typescript-pro | `document-shell.ts`, class/state `renderer-shell.ts`, `svg.ts` + tests | T3, T5 | [ ] |

**Parallelism.** T3 and T5 run in parallel (different emitters, no shared
files). T4 must follow T3 — it removes the per-text attributes that T3's
root `g` starts inheriting, so running it first would emit text with
neither the per-element nor the inherited attribute.

## Why the klimt half splits in two

`svg-graphics-core.ts` owns the document skeleton, the style-string
builder, colors and numeric formatting; `svg-graphics-elements.ts` owns
per-element attributes. Rule 3 straddles them — the root `g` gains the
attributes (T3) and each text element loses them (T4) — which is exactly
why the interface contract between the two tasks is written down.
