# T2f diagnosis — where the empty-source check is applied

Written before any source edit (diagnosis mode). Measured 2026-10-28 on
`ddc/T2f` off `e6b7688ea`, `DeterministicMeasurer`, oracles rendered with
`scripts/oracle-render.sh` (deterministic text on) from 34 authored probes
(`@start<t>` / `@end<t>` with an empty, a blank, a comment-only and a
`skinparam`-only body).

## Mechanism
The jar tests "empty source" inside each factory, and only three factory
bases test it (`PSystemCommandFactory`, `PSystemBasicFactory`,
`PSystemSingleLineFactory`); `PSystemAbstractFactory`'s direct subclasses
(json, yaml, hcl, files, git) never test it and build their diagram from the
empty source. This port hoists `PSystemCommandFactory`'s test
(`UmlSource#isEmpty`) out of the factory loop and applies it to EVERY block
before dispatch, so the four abstract-factory engines get the
*Empty description* page instead of their own diagram.

## Origin
`src/index.ts:374` (`renderPagesSync`) and `src/index.ts:481`
(`renderBlockPages`): `if (isBlockEmpty(block)) return [emptySvg(block, options)];`
— before `prepareBlock` → `registry.resolve` (`src/index.ts:312`) has chosen
a candidate. `isBlockEmpty` itself (`src/core/BlockUmlBuilder.ts:268-287`)
is a correct mirror of `UmlSource#isEmpty` and documents itself as the test
`PSystemCommandFactory#createSystem` makes; the defect is where it is called,
not what it computes.

## The jar, factory by factory
`PSystemBuilder#createPSystem` (`PSystemBuilder.java:257-287`) tries every
factory whose type is in the `@start` line's set (`:258-260`); the first
whose result `isOk` (`:298-303`: not null, not `PSystemError`) wins; when all
fail, `PSystemErrorUtils.merge` picks the page (`:286`). Emptiness is
therefore decided per factory class:

| Factory base (Java) | Empty test | Engines here | Jar output, empty body (oracle) |
|---|---|---|---|
| `PSystemCommandFactory#createSystem` (`PSystemCommandFactory.java:117-122`: `if (source.isEmpty()) … return buildEmptyError(…)`; and `finalizeDiagram` `:155-157`, `getTotalLineCount() == 2`) | `UmlSource#isEmpty` (`UmlSource.java:255-270`: skips start/end directives, `\s*'.*`, blank) | every command engine (sequence, class, description, state, activity, salt, mindmap, wbs, chart, packetdiag, gantt, board, …) | `@startuml` 2 lines: Welcome, 532x227 (`PSystemWelcomeFactory.java:49-56`, first in the list `PSystemBuilder.java:133`); 3 lines (blank body): *Empty description (Assumed diagram type: sequence)* 532x284 |
| `PSystemBasicFactory#createSystem` (`PSystemBasicFactory.java:75-101`: `removeInitialNoise` `:77`, then at `@end` `getTotalLineCount() == 2 && !isStartDef()` → `buildEmptyError` `:89-90`, else `return system` `:92`) | line count after `UmlSource#removeInitialNoise` (`UmlSource.java:79-106`: drops leading blank / `skinparam ` / `skinparamlocked ` / `!pragma ` lines) | dot (`PSystemDotFactory`, registered); ditaa, math, latex, creole, def, jcckit (not registered here) | dot, ditaa, math, latex, creole: *Empty description (Assumed diagram type: <t>)* 532x284 for empty, blank, comment-only AND `skinparam`-only bodies (noise is stripped first); def (`isStartDef`): draws `@startdef`, 61x15; jcckit: "Diagram not supported by this release" |
| `PSystemSingleLineFactory#createSystem` (`PSystemSingleLineFactory.java:70-94`: `getTotalLineCount() != 3` → `null` `:75`; `isEmpty()` → `buildEmptyError` `:79-81`) | own | the `@startuml` utility pages (colors, license, version, donors, …) | never `isOk` on an empty source; reachable only through `@startuml`, whose set also holds the command factories |
| `PSystemAbstractFactory` direct (`PSystemAbstractFactory.java:50-79` defines `buildEmptyError` `:59-65` but calls it nowhere) | **none** | files, json, yaml, hcl (registered); git (not) | files: `FilesDiagramFactory.java:53-59` → `new FilesDiagram` over an empty listing → 21x21, `data-diagram-type="FILES"`, empty `<g>` (= `tests/fixtures/files/empty-diagram.svg`). json: `JsonDiagramFactory.java:67-111` → `Json.parse("")` throws → `json = null` (`:94-96`) → `JsonDiagram` draws "Your data does not sound like JSON data" (`JsonDiagram.java:116-122`), 288x39. yaml: `YamlDiagramFactory.java:67-108`, parse yields null → "…YAML data", 289x39. hcl: `HclDiagramFactory.java:61-94` → one empty node, 35x40. git: `GitDiagramFactory.java:55-70` → 21x21 |

Same outcome for the blank-body (`@start<t>\n\n@end<t>`) and comment-only
probes of files/json (TIM drops the comment; files/json skip blank lines).

## Causal chain (jar → ours)
1. `@startfiles\n@endfiles` → jar: `diagramTypes = {FILES}`; the only
   candidate, `FilesDiagramFactory`, has no empty test and returns a
   `FilesDiagram` (ok) → 21x21.
2. Ours: `buildBlockUmls` → `block.source.lines = []`, no styles, no
   skinparams → `isBlockEmpty(block) === true` at `src/index.ts:374` →
   `emptySvg` (`src/core/error/error-diagrams.ts:133-143`): not
   `isWelcomeSource` (suffix `files`) → `PSystemErrorEmpty`
   *Empty description (Assumed diagram type: files)*, plus the Welcome block
   the error page adds under 5 lines (`PSystemError.java:217-219`) → 532x270.
   The files plugin is never asked.
3. Identical for `@startjson`/`@startyaml`/`@starthcl` (our current output:
   the same 532x270 error page, assumed type json/yaml/hcl).

## Evidence
- `npx tsx plans/data-diagram-conformance/tools/diff-one.mts files empty-diagram`:
  5 diffs (svg width/height/viewBox 532x270 vs 21x21, `g[1]` childCount 26 vs 0).
- Counterfactual (scratch copy of `src/` with only the two `index.ts` checks
  gated off, then `renderSync` + `compareSvg` vs the jar oracle):
  files empty → **0** diffs, files blank-body → 0, json empty → 0,
  json blank-body → 0, yaml empty → 0, hcl empty → 0. So the plugins already
  build the jar's diagram; only the hoisted check stands in the way.
- Same counterfactual, `@startuml\n@enduml` → 16x16 blank (jar: Welcome):
  the command engines DO need the hoisted check — it is their
  `PSystemCommandFactory#createSystem:117-122`, which our command parsers do
  not carry themselves.
- Same counterfactual, `@startdot\n@enddot` → the dot plugin's OWN
  `PSystemBasicFactory` mirror (`src/diagrams/dot/parser.ts:110-126`,
  `refuse('syntax', …, 'Empty description')`) produces the error page: 5 diffs
  vs the jar, all version-string / `[From …]` filename text (accepted
  error-page variance), height 284 = jar. The current hoisted path gives
  19 diffs (height 270 vs 284: `emptySvg` lists the `@start` line only, the
  jar's trace lists `@startdot` + `@enddot`). dot is error-vs-error either way
  (conformant by the 2026-10-10 error-page rule).

## Ruled out
- **`isBlockEmpty` computes the wrong thing.** No: for the command path it
  matches `UmlSource#isEmpty` (blank/comment lines are already gone, and it
  keeps `skinparam`/`<style>`-only bodies non-empty as upstream does); the
  `@startuml` Welcome and *Empty description* pages are the jar's. The probe
  `es-uml` (`skinparam handwritten true` only) is non-empty in both.
- **The files port draws the wrong thing for an empty listing.** No: with the
  check gated off, files empty → 0 diffs (counterfactual above).
- **A preprocessor/block-extraction difference** (e.g. the block arrives
  non-empty or with a different type). No: `block.suffix === 'files'`,
  `block.source.lines.length === 0`; the jar's `diagramTypes` is `{FILES}`
  (`DiagramType.java:137`) and ours routes `files` to `filesPlugin`.
- **dot / single-line plugins need the same fix to reach the jar.** No:
  each already mirrors its own factory's empty test in its parse
  (`src/diagrams/dot/parser.ts:110-126`;
  `src/core/command/PSystemSingleLineFactory.ts:118-169`); the hoisted check
  only pre-empts them with an equivalent error page.
- **Using an existing plugin member as the discriminator.** `styleInput` is
  present on exactly json/yaml/hcl/files today (`json/index.ts:38`,
  `yaml/index.ts:47`, `hcl/index.ts:40`, `files/index.ts:238`), but it
  declares the `StyleExtractor` style cut (lad D9), not the factory base;
  keying the empty test on it couples two unrelated properties — a disguised
  per-engine branch. Rejected. No other member of `SyncPlugin`/`AsyncPlugin`
  (`src/core/dispatcher-types.ts:313-363`) or of `DiagramRegistry`
  (`src/core/dispatcher.ts:91-121`) distinguishes command factories, and our
  command engines share no `PSystemCommandFactory` mirror in `src/core/`
  (`grep -rn PSystemCommandFactory src/core` finds only doc comments): the
  hoisted check at `index.ts:374/481` IS the port's only copy of
  `PSystemCommandFactory.java:117-122`.

## Write-set the faithful fix needs — exceeds the 3-src-file budget (STOP)
The faithful change keeps the check as the port's `PSystemCommandFactory`
test and lets each plugin declare the factory base it mirrors, absent meaning
`PSystemCommandFactory` (the overwhelming majority, so they stay untouched),
and applies the test per candidate inside the factory loop
(`PSystemBuilder.java:258-282`), where candidate filtering already lives:

1. `src/core/dispatcher-types.ts:313-347`, `:351-363` — optional plugin member
   naming the upstream factory base (e.g. `'PSystemAbstractFactory'`),
   JSDoc `@see PSystemAbstractFactory.java` / `PSystemCommandFactory.java:117-122`.
   Not in `dist/plantuml-ts.d.ts` (`b0-plantuml-ts.d.ts.txt` declares only
   `RenderFragment` of the seam), so stop 6 is not triggered.
2. `src/core/dispatcher.ts:113-121` — `DiagramRegistry`: answer "on an empty
   source, does any candidate (type in `source.types`, `:117`) build without
   the command-factory test?" (or skip command-kind candidates on an empty
   source inside `resolve`).
3. `src/index.ts:374`, `:481` (+ import `:1`) — apply `emptySvg` only when no
   candidate builds from the empty source. `index.ts` is at 497/500 lines
   (hook cap): the change must be net ≤ +3 lines there.
4. `src/diagrams/json/index.ts:27-38`, 5. `src/diagrams/yaml/index.ts:33-47`,
6. `src/diagrams/hcl/index.ts:27-40`, 7. `src/diagrams/files/index.ts:228-238`
   — declare `PSystemAbstractFactory` (`JsonDiagramFactory.java:61`,
   `YamlDiagramFactory.java:61`, `HclDiagramFactory.java:55`,
   `FilesDiagramFactory.java:47`).
8. (fidelity, optional) `src/diagrams/dot/index.ts:18` — declare
   `PSystemBasicFactory` (`PSystemDotFactory.java:45`) so dot's own
   `parser.ts:110-126` empty refusal is reached (19 → 5 error-page diffs).
Tests: `tests/unit/core/` beside the dispatcher (candidate rule) and the
`index` empty-source tests (uml Welcome / *Empty description* byte-identical;
files 21x21; json/yaml "does not sound like" pages; hcl empty node).

Minimum: 7 src files (1-7); 8 with dot. A 6-file variant inlining the
candidate filter in `index.ts` duplicates `dispatcher.ts:117` and does not
fit `index.ts`'s line budget. Both exceed the task's ≤ 3 src-file write-set,
so per the T2f spec this task stops here; no source was edited.

## Not in scope, observed
- `emptySvg`'s listing is the `@start` line alone; the jar's trace for a
  3-line `@startuml` (blank body) lists `@startuml` + the blank line
  (`PSystemCommandFactory.java:118-121`, `it.next()` before `getTrace()`),
  so our page is 14 px shorter (rect 91 vs 105). Error-vs-error, conformant
  by rule; recorded, not chased.
- Unregistered `PSystemBasicFactory`/abstract engines with no plugin (def →
  61x15 `@startdef` text; git → 21x21; jcckit → "not supported") render our
  *Empty description* page today; they have no plugin to route to.
- `@startuml` + `skinparam handwritten true` only: jar draws CLASS 287x36
  "Please use '!option handwritten true'…"; ours 16x16. Separate defect
  (command path, non-empty source).
