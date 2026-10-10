# Decisions (approved 2026-10-10)

## The rule (user ruling, 2026-10-10)

> "For things that draw in the JAR, leave as is. For things that generate
> errors, conformance is looser: if we generate our error result, then we are
> conformant. We needn't exactly replicate the JAR error page since our code
> is different in too many ways."

Companion requirement: error pages must "ALSO error from an unaltered JAR".
Verified at planning for all 14 activity error rows: stock upstream
`97a5992` (1.2026.8beta1, built from `git archive`, `gradlew jar -x test -x
generateGitProperties`, seam strings absent), run with **no** `-D` flags,
gives the same message AND line as the oracle for all 14; the Welcome panel
on ticoxo/xesoze is present on stock too.

| Jar (stock record) | Ours | Verdict |
|---|---|---|
| errors | our error page | `conformant`, `errorPage: true` |
| errors | a diagram | `diverged`, `firstDiff: 'error-page'` |
| draws | anything | compared exactly, as today |
| oracle errors, stock not in record | anything | compared exactly (seam artifact; stop 9) |

`keep-own-version-string` (DIVERGENCES.md "Error pages print this port's
version") still holds — production error pages keep `plantuml-ts version`.

## D1 — identity seam: SUPERSEDED by the rule

Proposed a test-only seam printing the jar's version line. Unneeded: error
rows no longer compare geometry. Do not build it.

## D2 — activity execution errors: NARROWED by the rule

No porting of upstream messages or lines for their own sake. Only:
- **nakavu, velodu:** we draw where the jar refuses. Port the swimlane
  strategy: the first instruction before any swimlane sets
  `SWIMLANE_FORBIDDEN`; a later swimlane returns `"This swimlane must be
  defined at the start of the diagram."` (`ActivityDiagram3.java:80-95`).
  Return an `'execution'` `ParseRefusal`.
- **kedozi:** ours throws a JS `TypeError` (`reading 'kind'`) that lands on an
  error page. A crash is a defect even though the rule calls the row
  conformant: return a refusal for an instruction before the first `case`
  (`InstructionSwitch.java:97-101`).

## D3 — misfiled fixtures move to sequence

jetigu-21-zaje860, nuzise-60-temi305: the jar's own `in.svg` carries
`data-diagram-type="SEQUENCE"` (teoz). User: "if they are sequence — move
'em. Otherwise, they stay in activity." romuru-66-samu329 (jar CLASS) stays
(already conformant). Mechanism: a slug override in `scripts/populate-corpus.py`
citing the jar type (its regex classifier misses `Test <- Test`); cache dirs
move `activity/` → `sequence/`; routing/refusal pinned BEFORE the move commit
(memory: a new corpus tree trips two gates). Orchestrator only.

## D4 — bozido deferred (tracked exception)

Its `{{ }}` slots: mindmap 181x129 already exact; wbs, salt, gantt render as
300x60 placeholders — no engine exists for any of the three in
`src/diagrams/`. Three engine ports are genuinely large and separable; bozido
converges as they land. Filed in `planning/next-missions.md` at T-close.

## D5 — standing stock-jar gate

`scripts/stock-jar-verify.sh` builds stock upstream at `oracle/pin.json#upstreamSha`
(`git -C ~/git/plantuml archive <sha>` into a temp dir — never `git switch` the
fork; `./gradlew jar -x test -x generateGitProperties`), caches the jar under the
gitignored `oracle/dist/stock/`, renders every cached oracle fixture whose
`in.svg` is an error page (all buckets; 109 at planning: activity 14, unknown
38, wbs 26, gantt 11, timing 6, state 4, c4/class/mindmap/regex 2,
chronology/ebnf 1) with no `-D` flags, one JVM per fixture, and writes
`oracle/goldens/stock-error-pages.json`. The stock error signal is upstream's
own (`ExitStatus.java:43,104` exit 200 and/or `--check-syntax`,
`CliFlag.java:138-139`) — read and quote it; no text sniffing of SVGs for
the stock side. A test fails when the record's SHA ≠ `pin.json#upstreamSha`.

## D6 — exit bar

Activity survey: only bozido non-conformant. 0 conformant losses in any
engine (stop-4 exception listed). 0 census attributes away from the jar
(`census-away.py`). Four gates green; every merge gated on the full
conformance + activity + architecture set AND typecheck (memory:
gate-merges-on-full-set-and-typecheck).

## D7 — survey verdict over both signals, every engine

`setErrorPageObserver` in `src/core/error/error-renderer.ts` (internal, never
exported from `src/index.ts`; same pattern as `setLayoutInputObserver`) fires
once per `PSystemError`-family page we draw (syntax, execution, empty,
preprocessor, crash), never for Welcome. The survey worker frame gains
`errorPage: boolean`; `scripts/svg-parity-survey.ts` applies the table above
using `stock-error-pages.json`; the dashboard shows an error-conformant count
per bucket. Rule written into `CLAUDE.md` (the "Mirror the jar's output
exactly" bullet), `docs/svg-conformance.md`, and `DIVERGENCES.md`.
