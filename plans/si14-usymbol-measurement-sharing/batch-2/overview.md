# Batch 2 — give the class renderer measurement capability

One task. It is separated from batch 3 because it changes the geometry type that
batch 3's drawing code consumes, and both would otherwise write
`class-geo-types.ts`.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | carry `StringMeasurer` + `SpriteRegistry` on `ClassGeometry` (ADR-1) | typescript-pro | `src/diagrams/class/class-geo-types.ts`, `src/diagrams/class/index.ts` | T1 | [ ] |

## Why it depends on T1

Only loosely — T3 does not call T1's code. The dependency is sequencing: if T1
hits stop condition 5 (fragment emission requires touching
`svg-graphics-core.ts`), ADR-2 collapses and the whole draw-side approach needs
rethinking, at which point T3's shape may change too. Do not start T3 until T1
is green.

## What this batch does NOT do

It adds the capability and nothing that uses it. After T3, `renderClass` can
measure but still draws usecase/actor exactly as before. All 449 goldens must
be byte-identical — this batch is behaviour-neutral by construction.
