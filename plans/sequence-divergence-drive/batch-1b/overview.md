# Batch 1b — wire the seam (no-op)

Two file-disjoint tasks in parallel worktrees, both depending on T1a. Neither
changes a rendered byte: the close runs `close-procedure.md` with the batch-1b
check (every corpus fixture byte-identical to b0 on both paths — stop 7) and
pins nothing.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1b](T1b-parser-capture.md) | `parseSequence(UmlSource)`; per-event builder capture; ~27 test callers via a helper | typescript-pro | `parser.ts`, `sequence-command-registry.ts`, `ast.ts`, `index.ts`, `render-fixture-sequence.ts`, `tests/helpers/sequence-source.ts`, the test callers | T1a | [ ] |
| [T1c](T1c-geo-paint.md) | `paint` field on every geo node; `scale-geo.ts` scales it | typescript-pro | `geo.ts`, `geo-participant.ts`, `geo-message.ts`, `geo-frame.ts`, `geo-annotation.ts`, `scale-geo.ts`, their tests | T1a | [ ] |

Memory `no-op-seam-gate-cannot-see-consumers`: byte-identical output proves
nothing about consumers of the seam's NEW outputs. The close therefore also
checks that T1b's captured builders are reachable from every event a batch-2
family reads (T1b's acceptance), not only that bytes did not move.
