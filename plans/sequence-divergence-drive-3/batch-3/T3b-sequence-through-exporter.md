# T3b — sequence exported through the core exporter

Agent: `typescript-pro` (sonnet), worktree `sdd3-T3b`. Commit:
`fix(sequence): compose chrome before the export scale`.
Read [../task-contract.md](../task-contract.md) first. Depends on T3a.

## Mechanism
As T3a's artifact (`diagnosis/scale-chrome.md`): jar `TextBlockExporter.java:
159-177,205-209` and `UgDiagram.java:123-145`. Re-mirror, do not patch:
sequence takes the same `UgDiagram.ts`/`TextBlockExporter.ts` route as
mindmap/wbs/salt. If the Java disagrees with the artifact, the Java wins.

## Targets (15)
baketu-62-cumu838, tumuke-16-xomo243, dolefo-13-kovu702, javedu-98-pibi325,
kepuxa-88-juxu405, nabesa-52-nufu501, vikelu-53-faga789, jujigi-41-zodo151,
suzumi-85-nuzo693, bocudo-94-jode371, jesari-34-mudu065, regate-07-rore899,
mozoza-90-biru865, zavacu-31-dola792, zunile-23-zezi158: ws to 0.

## Write-set
Per T3a's artifact, journaled before work starts. Expected:
`src/diagrams/sequence/renderer.ts`, `src/diagrams/sequence/scale-geo.ts`,
`src/index.ts`, `src/core/annotations/chrome-export.ts`, and probably
`src/core/assemble-svg-sequence.ts`; their tests. Any file T3a omits is
stop 1.

## Read-set
`diagnosis/scale-chrome.md` (in full); the T3a read-set ranges, re-verified.

## Acceptance
- Given a `scale`/`skinparam dpi` sequence with title and sprite, when
  rendered, then chrome and body share one factor derived from the chromed
  dimension (unit test quoting `TextBlockExporter.java:205-209`).
- Given the 15 targets, then each is zero-diff in classify.
- Given every other engine's rows, then render hashes are byte-identical
  (`svg-hashes.mts`, all-engine survey via `chain.sh`); no conformant row in
  any engine is lost (stop 4).
- Given the 1042 pins, then all stay byte-equal (stop 6).

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
