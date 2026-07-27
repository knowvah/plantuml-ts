# Batch 2 — Unify: shared visible-atoms helper (after the spike passes)

Extract ONE shared "line → visible atoms/text" helper and route BOTH the
renderer's `buildLine` and the sizer's `creoleVisibleText` through it, so the
sizer strips exactly what the renderer strips (ADR-1/2/3). Renderer output stays
byte-identical; only the sizer's width changes.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2 | Shared helper in StripeSimple.ts; rewire buildLine + creoleVisibleText | typescript-pro | `StripeSimple.ts`, `EntityImageDescriptionSupport.ts`, `leaf-sizing.ts`, new unit test | T1 | ☑ |

**Exit bar:** `measure` exit 0 (zero widened) with lurupu-11 + gafico/nujito
nodes a+b SHRUNK; `dot-sync component usecase` stays 262/262 + 90/90;
`buildLine`'s renderer output unchanged (no SVG golden moves); typecheck + lint +
build green; the shared helper is the ONLY stripping path (no `parseCreole` in
`creoleVisibleText`). Files stay ≤500 lines. STOP if a non-target fixture widens
or structure moves.
