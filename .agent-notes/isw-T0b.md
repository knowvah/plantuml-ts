# isw-T0b — one-JVM-per-fixture oracle re-capture tool

## Observation: zidebi-71-nocu387 cannot be byte-equal solo vs solo
- **Context**: acceptance asks tool == solo for `usecase/zidebi-71-nocu387`.
- **Finding**: 3 consecutive solo `oracle-render.sh` renders gave 3 distinct md5s
  (canvas width 865 / 911 / 878 px; `svek-1.dot` also differs), and the committed
  cache is a 4th. It is one of the four crash-page fixtures (random
  `IconLoader.getRandom()` icon; `.agent-notes/oracle-svg-seam.md`), so no tool can
  reproduce it. The tool reports it CHANGED on every run. Equality of tool vs solo
  is shown instead on deterministic `{{ }}` fixtures (activity/bozido-07-geze049,
  fikuki-99-kulu790, gufuma-85-zoce945: SAME) and all 5 `oracle/goldens/svg-dot/*`
  (SAME). Exclude the four crash-page fixtures from any equality gate until
  instrument-space-width removes the crash.
- **Confidence**: High (3 solo renders, md5s).

## Observation: manifest sizes (this checkout)
- 8374 targets: dot-cache 4903, svg-golden 1703, dot-golden 1211, fixture-svg 557.
- 4 `oracle/goldens/svg-conformance/*/golden.svg` have no `in.puml`
  (gradient-fill, class-boxes-and-link, database-cylinder-dashed, delta-shadow):
  not re-capturable by any tool, not in the manifest.
- 214 `oracle/goldens/{class,object,state,description}` dirs with `input.puml` have
  no committed `svek-*.dot`; not in the manifest (a re-capture must not invent files).
- Jar errors are not failures: exit code is reported (`jarExit`), files decide.
- `oracle/dist` in a worktree is a symlink to the MAIN checkout's; Batik and the
  jar therefore resolve there.

## Report
Commits: one, `git log isw/T0b -1` (tool, libs, rebaseline delegation, tests, notes).

Java -> ours: no new port. Mirrors `scripts/oracle-render.sh` (flags
`-DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<out> -cp jar[:batik/*]
net.sourceforge.plantuml.Run -tsvg -o <out>`; 25 s timeout =
`ORACLE_JAR_TIMEOUT_MS`), `PSystemError.java:221-229` minute guard reused.

Fixtures before -> after: n/a (no src/ change). Engdiff / ratchet movers / owed
rows: none. DIVERGENCES.md: no text.

Verification run (small `--only` sets, `--workers 2`, no `--write`):
- svg-dot x5 + 3 `{{` cache fixtures: SAME=8.
- class 01-assoc, 02-members, state/style-stereotype-on-arrow-5, 2 activity/T1p-a
  fixtures, 6 lgm-T1e fixtures: SAME=11.
- zidebi-71-nocu387: CHANGED (non-deterministic, see above).
- `git status` after verify: no tracked file changed.

Orchestrator full verify (after merge, NOT run by me — thousands of JVMs):
`npx jiti scripts/recapture-oracles.ts --verify --workers 6 --scratch /private/tmp/claude-501/isw-T0b --report /private/tmp/claude-501/isw-T0b/full.json`
Write (T1b, new jar; needs oracle/pin.json drift guard to pass or ORACLE_ALLOW_DRIFT=1):
`npx jiti scripts/recapture-oracles.ts --write --jar <new.jar> --workers 6 --report out.json`
`--jar` is the jar to adopt; fixture-svg "is a jar render" is always judged by
`oracle/dist/plantuml-oracle.jar`. A decorated clock minute (1,8,13,15,30,39,48,55)
makes each render wait (D9 guard), so a full run stalls ~8 min/hour.

Not done: `--write` path exercised only by unit tests with an injected renderer
(real writes would modify tracked oracle files, forbidden here).
`rebaseline-svg-goldens.ts` now delegates to the shared renderer (one JVM per
fixture, 4 concurrent); its `parseErroredFiles`/`captureBatch` were removed.
