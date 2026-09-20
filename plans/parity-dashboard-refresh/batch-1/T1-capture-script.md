# T1 — `scripts/capture-oracle-cache.ts`

## Context
plantuml-ts is a TypeScript port of PlantUML; the Java jar is the oracle.
Committed oracle caches live at `test-results/dot-cache/<type>/<slug>/
{in.puml,in.svg,.done}` (+ `svek-N.dot` for graphviz-backed types). The
last corpus capture (activity, 373 fixtures) was a hand-rolled loop whose
two findings are recorded in `.agent-notes/aoh-T0.md`: (1) `net.sourceforge
.plantuml.Run` exits 200 when ANY per-diagram error occurred, even though
it wrote a complete valid SVG, so exit code is not a success signal;
(2) a block that opens `@startuml <name>` writes `<name>.svg`, not
`in.svg`. Scripts run via `jiti`; tests are vitest under `tests/unit/`.
The only permitted way to run the jar is `scripts/oracle-render.sh` (it
sets `-DPLANTUML_DETERMINISTIC_TEXT=true`; a hand-typed `java -jar` is
forbidden by CLAUDE.md).

## Task
Write `scripts/capture-oracle-cache.ts`:

```
npx jiti scripts/capture-oracle-cache.ts <type> [--rebuild] [--only <slug>[,<slug>]]
```

- Reads `tests/visual/data/<type>.json` (array of `{ slug, markup }`).
- For each entry: skip if `<cache>/<slug>/.done` exists and not
  `--rebuild`; else write `in.puml` (markup verbatim), run
  `scripts/oracle-render.sh <dir> <dir>/in.puml` with `execFileSync`,
  `stdio: 'ignore'`, `timeout: 25_000`, catching the throw.
- Success = `in.svg` exists after the run, OR exactly one `*.svg` exists
  (then rename it to `in.svg` and record the slug under `renamed`). Zero
  `.svg` = `jarFailed`; more than one = `jarFailed` with a reason.
- Write `.done` only on success. Never delete a written SVG.
- Print one JSON object on stdout: `{ type, captured: string[],
  jarFailed: string[], renamed: string[] }`. Progress to stderr.
- Keep the pure parts pure and exported for tests: `classifyOutput(dir)`
  → `{ kind: 'in-svg' | 'renamed' | 'none' | 'ambiguous', file?: string }`,
  and `planEntries(manifest, existingDone, opts)`.

## Write-set
`scripts/capture-oracle-cache.ts`, `tests/unit/scripts/capture-oracle-cache.test.ts`

## Read-set
- `.agent-notes/aoh-T0.md` (whole file — the two findings)
- `scripts/oracle-render.sh` (whole file, 60 lines)
- `scripts/dot-sync-report.ts:95-132` — `plantumlDots`, the existing
  per-fixture capture shape (`.done`, `in.puml`, timeout, stdio)
- `scripts/svg-parity-survey.ts:218-232` — `listFixtureDirs`, what a
  consumer requires of a cache dir
- `tests/unit/scripts/dot-sync-fixtures.test.ts` — test style in this dir

## Architecture decisions
`decisions.md#d6`. Do not add capture logic to `dot-sync-report.ts`.

## Interface contracts
Output dir layout exactly `{in.puml, in.svg, .done}`; stdout JSON as
above. Consumed by T5 (the orchestrator runs this for five types).

## Acceptance criteria
1. Given a manifest entry, when the jar exits non-zero but `in.svg`
   exists, then the slug is in `captured`, not `jarFailed`, and `.done`
   is written.
2. Given the jar wrote exactly one `.svg` not named `in.svg`, when
   classified, then it is renamed to `in.svg` and the slug is in `renamed`.
3. Given no `.svg` produced, when classified, then the slug is in
   `jarFailed` and no `.done` exists.
4. Given an existing `.done`, when run without `--rebuild`, then the
   fixture is skipped and not re-rendered.
5. Tests cover `classifyOutput` and `planEntries` with a temp dir; the
   jar is never invoked in unit tests (mock `execFileSync` or test only
   the pure functions).

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one new script, one new test.

## Quality bar
`npm test`, `npm run typecheck`, `npm run lint` green. Hook limits:
≤30 NLOC per function, CCN ≤10, ≤5 params, file ≤500 lines. Every
function that mirrors an existing script cites it in a comment.

## Boundaries
- Always: use `oracle-render.sh`; judge success from files.
- Never: run the capture for real in this task (T5 does); touch any file
  outside the write-set.

## Commit
`feat(pdr-T1): add capture-oracle-cache script` — body explains the two
encoded findings.
