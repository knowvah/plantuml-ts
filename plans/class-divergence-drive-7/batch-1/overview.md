# Batch 1: seven families in parallel

All tasks run in parallel, each in its own worktree
(`plans/class-divergence-drive-5/measurements/mkwt.sh T1x`). No two tasks write the
same file. The batch closes via [../close-procedure.md](../close-procedure.md).

Shared preamble for every agent prompt: [task-preamble.md](task-preamble.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-edge-paint.md) | edge paint: sejube `arrowLollipopColor` (D2) + bisefo gradient arrow (D3) | typescript-pro (opus) | `core/skinparam-key-handlers-table-a.ts`, `core/skinparam-accumulator.ts`, `core/theme*.ts` (one field), `core/paint.ts`, the `acc.arrow` consumers needing a flat string (journaled), `class/renderer-edge.ts`, `class/renderer-edge-extras.ts` (+tests) | b0 | [x] |
| [T1b](T1b-edge-label.md) | edge label: kexaba Δ(7,7) (D5) + xuloxo creole edge label | typescript-pro (sonnet) | `class/renderer-edge-label.ts`, `class/class-edge-label-anchor.ts`, `class/class-edge-label-measure.ts` (+tests) | b0 | [x] |
| [T1c](T1c-usymbol-leaf.md) | usymbol leaf: xuloxo title alignment / RoundCorner / wrapWidth + dezobu stereotype sprite | typescript-pro (opus) | `class/renderer-usymbol-entity.ts`, `class/class-stereotype.ts`, `class/class-geo-types.ts` (+tests) | b0 | [x] (partial; rest → T2b) |
| [T1d](T1d-stereo-key-order.md) | fepiko: `*ByStereo` declaration order | typescript-pro (sonnet) | `core/skinparam-stereo-keys.ts` (+tests) | b0 | [x] |
| [T1e](T1e-description-note-opale.md) | tefeco (b): description notes opale (D7) | typescript-pro (sonnet) | `description/renderer-entity.ts`, description goldens/diff-baseline rows it moves (+tests) | b0 | [x] (resumed in batch 2) |
| [T1f](T1f-sequence-sprite-atoms.md) | josebu (a): sequence labels keep sprite atoms (D7) | typescript-pro (opus) | `sequence/sequence-creole.ts`, `sequence/sequence-text.ts`, `sequence/sequence-layout-participant-sizing.ts`, `sequence/sequence-layout-participants.ts`, sequence goldens/diff-baseline rows it moves (+tests) | b0 | [x] |
| [T1g](T1g-rojida-pin-exemption.md) | rojida: DOT diff + `dotEqualExempt` (D6) | typescript-pro (sonnet) | `plans/class-divergence-drive/tools/pin-goldens.mts` (+test), `tests/oracle/svg-conformance/class.golden.ratchet.test.ts` | b0 | [x] (resumed in batch 2) |

`class-geo-builders.ts` belongs to T2a (batch 2): T1c populates its new geo field
through `class-stereotype.ts#stereotypeLabelFields` only. `class/renderer-edge.ts`
is T1a's: T1b must not touch it (report a stop 1 if the +8,+8 fix lands there).
