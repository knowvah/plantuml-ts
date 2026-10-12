# Batch 3: engine wiring, ELK rows, ruling docs

Starts after batch 2c closes. The three tasks run in parallel in worktrees with disjoint
write-sets. A fix that must land in `src/core/elk/**` during this batch belongs to
**T3a only**. T3b reports such a need as stop 1, and the orchestrator re-slots it.
Close via [../close-procedure.md](../close-procedure.md). This is the main pin close:
the 7 ELK class rows and the D12 eligibility rule. Every agent prompt is
[../batch-1/task-preamble.md](../batch-1/task-preamble.md) followed by the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-class-elk-wiring.md) | class `ElkDiagramAdapter` + route `layoutEngine === 'elk'` through `MyElkDrawing`; 7 ELK rows conformant; D12 eligibility | typescript-pro (opus) | `src/diagrams/class/{index,class-elk-adapter,renderer,class-geo-types}.ts`, `src/core/elk/**` (residual fixes), `tests/oracle/svg-conformance/class.golden.ratchet.test.ts` (eligibility only) (+tests) | T2b, T2e | [x] |
| [T3b](T3b-description-elk-wiring.md) | description ELK wiring for the c4/component/unknown ELK fixtures (conditional, D3) | typescript-pro (sonnet) | `src/diagrams/description/{index,description-elk-adapter,renderer}.ts` (+tests) | T2b, T2e | [x] |
| [T3c](T3c-ruling-docs.md) | DIVERGENCES ELK entry reopened + latex note corrected; CLAUDE.md one line (D4) | orchestrator | `DIVERGENCES.md`, `CLAUDE.md` | T1d's journal counts | [x] |
