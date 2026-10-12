# Batch 1: ElkBackend seam + three independent fixes

Starts only after T0c reports PASS. The four tasks run in parallel, each in its own
worktree (`measurements/mkwt.sh T1x`), and no two of them write the same file. Close
via [../close-procedure.md](../close-procedure.md). Every agent prompt is
[task-preamble.md](task-preamble.md) followed by the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-elk-backend-seam.md) | `ElkBackend` seam: proxy port, elkjs backend, `loadElk()`, `options.elk`, services plumbing, contract suite (D2, D2b) | typescript-pro (opus) | `src/core/elk/proxy/**`, `src/core/elk/{elkjs-backend,load-elk,elk-backend}.ts`, `src/core/dispatcher.ts` (SyncPlugin), `src/core/render-options.ts`, `src/index.ts`, `tests/unit/elk/**`, `docs/catalog.md` | T0c | [x] |
| [T1b](T1b-class-elk-pragma.md) | class `!pragma layout elk` → `ast.layoutEngine = 'elk'`; class plugin `requiresElk` | typescript-pro (sonnet) | `src/diagrams/class/{class-command-directives,ast,index}.ts` (+tests) | T0c | [x] |
| [T1c](T1c-dezobu-archimate.md) | dezobu: archimate sprite stereotype | typescript-pro (opus) | `src/diagrams/description/**` as listed (+tests) | b0 | [x] |
| [T1d](T1d-latex-texicon-sizing.md) | sapofa: latex TeXIcon sizing (D6) | typescript-pro (opus) | `src/core/latex.ts`, `src/core/latex-metrics.ts` (new, optional) (+tests) | b0 | [x] |
| [T1e](T1e-xagomi-hexagon.md) | xagomi: class svek hexagon shape + polygon (re-slotted from T0b, journal row 6) | typescript-pro (opus) | class DOT/geometry under `src/diagrams/class/` except T1b's three files; `renderer-usymbol-entity.ts` (+tests) | T0b | [x] |

T1b consumes T1a's `requiresElk` hook signature. It is fixed in T1a's interface
contract below, so the two can run in parallel. T1b types against the contract and
the orchestrator merges T1a first.
