# T2b — action text through the core creole Sheet; embedded `{{ }}` (D5)

Agent: typescript-pro, worktree `add3-T2b`. Rules: [../common-rules.md](../common-rules.md).

## Task
Spike first: route every action-box label through the core creole `SheetBuilder` path (upstream draws a `Display` via the creole sheet; `EmbeddedDiagram` is an atom, `src/core/EmbeddedDiagram.ts`; nested renderer registered at `src/index.ts:383`). Commit the spike only if every pinned golden stays byte-equal — otherwise STOP 16 and report the diff (no special-casing of `{{`). Then mufixi-71-koma752 / pufuzi-99-vone170: draw the embedded SVG image, sized as the jar sizes it (verify against the golden; a 42x42 slot is upstream's failure fallback, not the normal size).

## Write-set
See [overview](overview.md) row T2b; anything else: stop and report.

## Acceptance
- Spike: pins byte-equal. mufixi/pufuzi draw the embedded image (report ws).
- 0 unexplained risers; every pinned golden byte-equal; harness-parity green.

Observability: N/A. Rollback: Reversible.
