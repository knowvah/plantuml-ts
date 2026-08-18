# Batch 2 — State text (G1+G8+G23) and note bodies (G2) — consume T1's seam

Serialized after Batch 1 (both import `creoleTextLines`). Disjoint write-sets.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | F1 — route state display/description/field text through the seam; `<<O-O>>` +10; composite own-description table; sizer+renderer lockstep | general-purpose (Opus, effort high) | `src/diagrams/state/state-sizing.ts`, `state-composite-sizing.ts`, `renderer-box.ts`, `renderer-composite-box.ts`, `tests/unit/state/state-sizing-creole.test.ts` (+ existing state tests it must update), ratchet entries | T1 | [ ] |
| T7 | F2 — note bodies through the seam (creole + table rows), sizer+renderer lockstep | typescript-pro | `src/diagrams/state/state-note-layout.ts`, `state-composite-edge-label.ts`, `renderer-note.ts`, `tests/unit/state/state-note-layout.test.ts`, ratchet entries | T1 | [ ] |

**Expected manifest moves.** T6 → the 22 fixtures: G1 `corumi-91-mizo869`,
`gupeto-19-mesa256`, `juvagu-33-dupa212`, `kubona-45-boso556`,
`lokija-02-dipe348`, `fibudu-53-bode309`, `papifi-44-caxo706`,
`rovado-96-boda672`, `xasoka-58-temi462`, `feziva-71-gufo538`,
`mujipe-99-fume794`, `nixoja-06-guxe431`, `jafazu-60-leca675`,
`rejike-58-rote606`, `mefici-97-tudu030`, `xeziki-47-zomo866`; G8
`dogeji-46-sapo750`, `mosigo-88-rove013`, `rijoki-89-teno556`,
`viguto-81-gana093`, `resido-15-reza040`; G23 `kinuca-03-nice683` — PLUS any
state fixture whose text carries creole markup that was previously drawn
literally (T6 must list them from a pre-run diff and confirm each is jar-ward
by inspecting `in.svg`; that list is journaled, not a stop). T7 →
`fatupo-62-bemu777`, `xeziki-47-zomo866`, plus notes elsewhere carrying
markup/table syntax (same rule).
