# T8f — enable UGraphicHandwritten for sequence

Agent: `typescript-pro` (sonnet), worktree `sdd3-T8f`. Commit:
`feat(sequence): draw handwritten diagrams through UGraphicHandwritten`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (verify by opening the Java)
`core/TextBlockExporter.java:173-177`: after the margin translate,
`if (isHandwritten) ug = new UGraphicHandwritten(ug)`; every later `apply`
makes a fresh decorator with a fresh `Random(424242L)`
(`UGraphicHandwritten.java:54,114-116`). Ours:
`src/core/UgDiagram.ts:139-141` already does this for diagrams that go
through `exportTo`. Batch 3 routed sequence through
`TextBlockExporter.ts`/`UgDiagram.ts`: READ the batch-3 result first to see
where the wrap belongs. Then pass `handwritten true` (skinparam) so the
seam graphic is wrapped exactly there, with T8e's chrome outside it.
sdd2's filed lead: `fixtures.md` rows for the four targets, `handwritten-
unported` — re-read the Java; if it disagrees, the Java wins.

## Targets
jefoke-95-jara779, gepuce-64-pivu656, pafene-01-tedi758, menoke-22-luxo044:
0 structural diffs.

## Write-set
The seam wiring named by T8a (expected `renderer.ts` plus the batch-3
export entry); unit tests with golden `in.svg` values.

## Read-set
`diagnosis/handwritten.md`; `UgDiagram.ts:115-145`;
`src/core/klimt/drawing/hand/UGraphicHandwritten.ts`; the four fixtures'
`in.puml`/`in.svg`; `TextBlockExporter.java:150-215`.

## Interface contracts
Consumes the complete seam (T8b-T8e). Non-handwritten path untouched.

## Acceptance
- Given each of the 4 targets, when classified, then 0 diffs.
- Given every other sequence row and engine, then output is byte-identical
  to pre-T8f hashes.
- Given a `handwritten true` fixture whose jiggle depends on apply count,
  then a unit test pins one jiggled coordinate to the golden.

## Observability: N/A. Rollback: Reversible.
