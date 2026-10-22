# Batch 3 — horizontal extents; reverse self

Mechanisms: `research/research-b-width.md` (M1–M7). Instrument:
`prototypes/width-predictor.mts` (upstream width over port geometry;
reproduces 377/419 pinned widths) — copy it into the worktree and point it
at the current classify to see which rows each term should move.

All three tasks write `sequence-layout-width.ts`, so they run **in order**,
each merged (ratchet + classify) before the next starts. Approved
decomposition order is T3a → T3c → T3b (reverse self needs both the width
and the constraint modules).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-width-terms.md) | self reservation, delete label loop, posC2, self spacing | typescript-pro (sonnet) | `sequence-layout-width.ts`, `sequence-layout-participant-constraints.ts` + tests | B2 | [x] |
| [T3c](T3c-frame-extents.md) | frame extent from own children/header/else, +9 | typescript-pro (opus) | `sequence-layout-frame.ts`, `sequence-layout-width.ts` + tests | T3a | [x] |
| [T3b](T3b-reverse-self.md) | reverse self `A <- A` | typescript-pro (sonnet) | `command-arrow.ts`, `ast*.ts`, `sequence-layout-message-self.ts`, `renderer-message.ts`, `sequence-layout-participant-constraints.ts`, `sequence-layout-width.ts`, `DIVERGENCES.md` + tests | T3c | [x] |
| close | standard close, pin round 3 | orchestrator | per close-procedure | T3a–T3c | [x] |

Risk note (research B): 7 pinned rows contain a self message and 1 a group
frame; none of them is width-setting today. M6 must be non-binding on
those 7 — they are byte-exact against a jar that applies the constraint.
