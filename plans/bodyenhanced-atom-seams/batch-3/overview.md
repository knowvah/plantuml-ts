# Batch 3 — Port the Body classes

One task. `BodyEnhanced1` and `BodyEnhanced2` share `BodyEnhancedAbstract`
and are constructed by the same factory, so splitting them would mean two
agents writing the same conceptual unit.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2b | Port `BodyEnhanced1`/`2` + `BodyFactory.create2`/`create3` | typescript-pro | `src/core/cucadiagram/BodyEnhanced1.ts`, `BodyEnhanced2.ts`, `BodyFactory.ts` | T2a | [ ] |

Still not wired in. Ratchets must remain EXACTLY unchanged after this
batch — T4 is where behaviour moves.
