# T0c: core bases + the single-line plugin helper (D2, D3) — pre-declared core

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
1. Read `UgDiagram.java` (164), `UgSimpleDiagram.java` (51), `PlainStringsDiagram.java` (64),
   `PlainDiagram.java` if it is their base, and `command/PSystemSingleLineFactory.java` (whole),
   then how an existing TitledDiagram-free plugin exports (`src/core/dispatcher.ts:365-380`
   `ERROR_SENTINEL` is the only non-diagram `SyncPlugin`; `src/diagrams/salt/index.ts` /
   `src/diagrams/wbs/index.ts` for the `rawTextBlock`/`drawBodyAt` + `exportMargin` shape,
   `src/core/TextBlockExporter.ts`).
2. Port the three bases to `src/core/` with their export path: `getDefaultMargins()`
   (`UgDiagram.java:145`), background, `calculateDimension`/`drawU` contract.
3. `src/core/command/PSystemSingleLineFactory.ts`: `singleLinePlugin(spec)` (interface in
   `overview.md`) — `removeInitialNoise`, refuse unless `getTotalLineCount() === 3`, the empty
   source branch, `executeLine` on the one line (java:66-90), the `@startuml` candidate type via
   the `SEQUENCE` hack (java:61). Verify against `src/core/dispatcher.ts:416-440` that several
   plugins may share a candidate type and that registration order decides (D2) — a needed
   registry change is stop 10.
4. `src/diagrams/donors/PSystemDonors.ts` containing ONLY `getCols` (java:146-154) and its
   `@see`; T1g completes the file.
5. Tests: the 3-line gate (accept / refuse 2- and 4-line sources / leading noise), a fake plugin
   registered beside `sequencePlugin` in a local registry proving order, `getCols` on 0/1/7/22
   lines, a base-class render of a fixed `TextBlock` with the default margins (jar value from an
   authored probe of any UgDiagram page, e.g. `@startuml\nlicense\n@enduml` — read the margins
   from the jar SVG).

## Write-set
`src/core/{UgDiagram,UgSimpleDiagram,PlainStringsDiagram}.ts` (+ `PlainDiagram.ts` if needed),
`src/core/command/PSystemSingleLineFactory.ts`, `src/diagrams/donors/PSystemDonors.ts`, their
tests under `tests/unit/`, `docs/catalog.md`, `.agent-notes/ufp-T0c.md`. Any OTHER file is a stop
(the layering allowlist in `tests/architecture/layering.test.ts` may need a line if a core file
imports a diagram — report, the orchestrator decides).

## Acceptance
- Given a 3-line `@startuml` source, then `executeLine` receives the trimmed line; given 2 or 4
  lines, then the plugin refuses.
- Given two plugins sharing the candidate type, then the earlier-registered one that accepts wins.
- Given `getCols(lines, 7, 0)`, then the columns equal the Java's split.
- Given the base export, then margins equal the jar probe's.

**Observability:** N/A. **Rollback:** Reversible.
