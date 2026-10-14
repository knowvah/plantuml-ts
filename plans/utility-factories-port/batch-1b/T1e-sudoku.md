# T1e: `sudoku/` (DLX solver + graphics)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Task (TDD)
Port `sudoku/PSystemSudokuFactory.java` (`^sudoku(?:[%s]+([0-9a-zA-Z]+))?[%s]*$`, null seed java:58,
base-36 seed java:60), `PSystemSudoku.java`, `SudokuDLX.java`, `GraphicsSudoku.java` and
`DLXEngine.java` (1149 lines — split along its inner classes `dlx_solver`/`dlx_generator`/… into
files that keep the Java names; journal the split) over `src/core/klimt/drawing/hand/JavaRandom.ts`
(`java.util.Random` semantics — verify `nextInt(bound)`/`nextLong` match the JDK). Seedless (D7):
a fixed default seed, injectable via render options — read how render options reach a plugin
(`src/index.ts` `renderSync` options) and STOP if threading one needs a public-API change (stop 11):
then use the fixed seed only. Jar values: `unknown/lazama-75-loli189` (`sudoku 1234`),
`unknown/gazale-13-tadu312` (`sudoku 5678`).

## Write-set
`src/diagrams/sudoku/**`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1e.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `sudokuPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given seeds `1234` and `5678`, then the generated grid digits and positions equal the jar's exactly.
- Given a seedless `sudoku`, then the output is deterministic across runs.
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
