# Architecture decisions — shared-seam-extraction

Approved 2026-08-17. Every task treats these as locked; a conflict is a stop
condition (README stop 3), not a judgment call.

## D1 — Placement: core, with the upstream path in the `@see`

Code that upstream keeps in ONE place and imports from several
`*DiagramFactory`s — even when that place is a diagram package
(`objectdiagram/command/CommandCreateJson`, later `classdiagram/command/
CommandRemoveRestore`) — moves to `src/core/…`, never to one engine for the
others to import. Java shares by import because it has no "core" convention;
the four factories importing it are the proof it is shared. The `@see` carries
the upstream path, so provenance is not lost by the move.

Rejected: keep in the origin engine and let state import from class — keeps
the engine→engine edge this mission exists to remove.

## D2 — `assemble-svg`: one field, one shell, no engine imports

`RenderFragment` gains `diagramType?: string` (the `data-diagram-type` value —
`CLASS`, `STATE`, `DESCRIPTION`, `JSON`, `YAML`, `HCL`). `core/assemble-svg.ts`:
`diagramType` set → `assembleDocumentShell(fragment, diagramType)`; unset →
`svgRoot`. `klimtShell`/`classShell`/`stateShell`/`jsonShell` and the four
imports are removed. Each engine's per-type body preparation (class: border /
background-rect splice; json: colour canonicalisation + splice; state: `<g>`
wrap) runs inside that engine's own renderer BEFORE it returns the fragment.
Upstream: `core/TextBlockExporter.java:293` — one shared exporter,
`withRootAttribute("data-diagram-type", diagramType.name())`; the diagram
supplies only its type. The single central `svgRoot`/shell call site (an
earlier mission's D2) is preserved.

Rejected: an `assemble` callback on the fragment (function on a data object);
engines returning `CompleteSvg` (loses the central choke point).

## D3 — Leaf sizing takes a core `LeafSizingSubject`

`core/svek/image/LeafSizingSubject.ts` declares the structural interface =
exactly the fields `measureLeafNode` and its family read from
`DescriptiveNode`. `DescriptiveNode` and class's synthesized node satisfy it
without change. Pure move; no AST leaves its engine. Eventual convergence onto
`core/abel/Entity` is Track SI-1 (`planning/mission-guide.md`), named in the
file's doc, not done here.

## D4 — One generic `Command<S>`

`core/command/Command.ts`: `interface Command<S> { pattern: RegExp;
execute(state: S, match: RegExpExecArray): void; passes?: readonly
ParserPass[] }` (`command/Command.java:58` — `getMatcher`/`execute`/
`isEligibleFor`; `passes` is state's existing `isEligibleFor` mirror,
`core/command/ParserPass.ts`). Engines: `export type Command =
CoreCommand<ParseState>`. No behaviour change.

## D5 — Fitness function with justified allowlist

`tests/architecture/layering.test.ts` (textual static-import scan, same shape
as `cucadiagram-base-imports.test.ts`). Rules: (1) no `src/core/**` →
`src/diagrams/**`; (2) no `src/diagrams/X/**` → `src/diagrams/Y/**`. `ALLOWLIST`
entries are `{ from, to, why }` — `why` mandatory. Seeded: registry/dispatcher
→ `diagrams/*/index.js` (upstream `PSystem*Factory` dispatch); `hcl|yaml →
json` (CLAUDE.md JsonDiagram ruling). `KNOWN_DEBT` entries `{ from, to,
retiredBy }` list the measured violations at T0; the test FAILS on a debt entry
whose edge no longer exists (stale debt); T10 empties it.

## D6 — Evidence: full-corpus render manifest

`scripts/render-manifest.ts` renders every `in.puml` under
`test-results/dot-cache/*/` (~1,530) and `oracle/goldens/**` (484) with the
deterministic measurer, writing `{ [fixture]: { svg: sha256, dot?: sha256 } }`.
T0 captures the baseline on the branch point into `test-results/shared-seam-
baseline-manifest.json` (gitignored; sha256 journalled); every task's gate is an empty `--diff`. Ratchets,
`dot-sync-report` and the four gates run in addition. Rejected: goldens/ratchets
alone — they compare to the JAR and cannot see an accidental change on a
fixture we already differ on.

## D7 — JSON merge: the Java decides

`core/command/CommandCreateJson.ts` ports `objectdiagram/command/
CommandCreateJson.java` + `CommandCreateJsonSingleLine.java` as the spec;
`core/command/JsonNode.ts` is the one node type (the two engine copies are
already 100 % identical). Per-engine glue is a small `sink` that appends the
resulting entity to the engine's AST. Neither former copy is "the base"; where
they differ, `file:line` in the Java settles it, else stop (README stop 5).
Description is NOT wired this mission (follow-on).

## D8 — Naming

Upstream-mirroring name where a Java class exists (`FrontierCalculator.ts`,
`CommandCreateJson.ts`, `JsonNode.ts`, `Command.ts`); current kebab helper
names where none does (`leaf-sizing*.ts`, `color-override.ts`,
`usymbol-resolve.ts`, `creole-atoms-image-resolver.ts`).
