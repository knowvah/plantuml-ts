# T0c — gantt harness, dormant ratchets, capture clock

Agent: `typescript-pro` (sonnet), worktree `gep-T0c`. Commit:
`test(gantt): gantt conformance harness and the capture-clock record`.
Read [../task-contract.md](../task-contract.md) and decisions D3, D7, D9.

## Task
1. `tests/oracle/svg-conformance/render-fixture-gantt.ts`: copy
   `render-fixture-wbs.ts`'s shape over `tests/fixtures/gantt/` and the corpus
   (`test-results/dot-cache/gantt/`), rendering through `renderSync` with the
   options built by ONE local function `ganttRenderOptions(slug)` (T1b adds
   the clock there).
2. `gantt.golden.ratchet.test.ts` + `gantt.diff-baseline.ratchet.test.ts`:
   copy the wbs pair; pin files start EMPTY (`[]` / `{ rows: [] }`) so the
   ratchets pass while gantt still refuses (dormant until batch 7).
3. `oracle/capture-clock.json`: `{ "<engine>/<slug>": { "epochMillis":
   <ms>, "zone": "<IANA>" } }`. Backfill `gantt/lituri-55-caju105` and the
   `unknown` row whose source uses a clock-dependent `%date` (find it:
   `grep -lE '%date\(\)|%date\("[^"]*"\)' test-results/dot-cache/*/*/in.puml`)
   from their `in.svg` mtime (`stat -f %m`, ×1000), zone `America/Chicago`.
4. `tests/oracle/svg-conformance/capture-clock.test.ts` (D3c): every corpus
   and fixture source that is clock-dependent (`today` without a date or
   `N days after start`; `%now()`; `%date` with no fixed timestamp argument)
   has a sidecar entry; the detector is one exported function with its own
   unit cases.
5. `scripts/oracle-render.sh` and `scripts/oracle-corpus.ts`: after a
   successful render of a clock-dependent source, write/update its sidecar
   entry (instant just before the JVM starts, zone from `TZ` or the host).
   Keep `oracle-render.sh`'s deterministic-text flag untouched.

## Write-set
`tests/oracle/svg-conformance/{render-fixture-gantt.ts,
gantt.golden.ratchet.test.ts,gantt.diff-baseline.ratchet.test.ts,
capture-clock.test.ts}`, their empty pin files, `oracle/capture-clock.json`,
`scripts/oracle-render.sh`, `scripts/oracle-corpus.ts`,
`tests/unit/oracle/capture-clock-detector.test.ts`.

## Acceptance
- Given today's tree (gantt refuses), then both gantt ratchets pass with empty
  pins and the 28-engine survey is unchanged.
- Given a clock-dependent source with no sidecar entry, when the D3c test
  runs, then it fails naming the slug; given the two backfilled rows, it passes.
- Given `today is 2021-01-11 and is colored`, then the detector says NOT
  clock-dependent; given `today is colored in #ff8080`, it says dependent.

Observability: N/A. Rollback: Reversible.
