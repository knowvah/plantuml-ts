# Batch 1a — Display unification ∥ USymbol/atom helpers ∥ color-override

Three independent pure moves; disjoint write-sets; run in parallel. May be
combined with batch 1b into one 7-way batch (write-sets are disjoint across
1a/1b too — verified at planning).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | ONE `Display.getWithNewlines` port: retire class `splitEdgeLabelLines`/`resolveLabelEscape` and core `splitCreoleLines` into `core/klimt/creole/` | typescript-pro | `core/klimt/creole/{Display,DisplayNewlines}.ts`, `core/edge-label-box.ts`, `class/{class-edge-label-lines,class-layout-edge-labels}.ts` + 13 callers | T0 | [ ] |
| T2 | USymbol/atom helpers → core (`renderer-symbol.ts`, `render-atoms.ts#makeAtomImageResolverFor`) | typescript-pro | `core/decoration/symbol/usymbol-resolve.ts`, `core/creole-atoms-image-resolver.ts`, description `renderer-symbol.ts`(del) `render-atoms.ts` + 5 callers | T0 | [ ] |
| T4 | `resolveBareOrBackColor` → `core/color-override.ts` | typescript-pro | `core/color-override.ts`, `class/class-color-override.ts`(del) + 5 callers | T0 | [ ] |
