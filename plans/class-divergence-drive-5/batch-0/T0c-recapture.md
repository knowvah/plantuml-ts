# T0c: recapture every engine's oracle cache and the DOT goldens

**Context.** The fixture SET must not change, only the oracle bytes. The source list
`tests/visual/data/<type>.json` holds more fixtures than are cached (for example
activity 771 vs 373, usecase 351 vs 94), so a bare `--rebuild` would add new cache
directories. Scope every run to the existing directories. Two slugs in
`json`'s cache, `babico-87-soxo095` and `json-escaped`, are not in the data file.
Other engines may have the same kind of orphans.

**Task.**
1. For each engine `e`:
   `npx jiti scripts/capture-oracle-cache.ts $e --rebuild --only "$(ls test-results/dot-cache/$e | paste -sd, -)"`.
   Log to `measurements/t0c/capture-<e>.log`.
2. Find the orphans: cache directories whose slug is not in the data file. Recapture
   each with `scripts/oracle-render.sh test-results/dot-cache/<e>/<slug> test-results/dot-cache/<e>/<slug>/in.puml`,
   keeping the `.done` marker. A capture script that errors on an unknown `--only`
   slug: capture the rest, then handle the orphans this way.
3. Run `oracle/capture-corpus.sh`, which regenerates `svek-*.dot`/`input.svg` beside
   every `oracle/goldens/**/input.puml`: class, description, object, state and the
   4 in `svg-conformance`.
4. **Jar-failure parity.** The set of cache dirs with no `in.svg` must be the same
   before and after. Compare `git ls-files test-results/dot-cache | grep /in.svg$`
   (before) with `find test-results/dot-cache -name in.svg` (after). Journal every
   difference. A NEW failure: re-render twice to confirm that 8beta1 genuinely
   fails, then delete the stale 7beta11 `in.svg`, so no 7beta11 bytes survive
   (stop 8), and journal it as an oracle-effect mover.
5. **No 7beta11 bytes survive.** `git diff --stat test-results/dot-cache oracle/goldens`
   shows what moved. Then, for a random sample of 20 UNCHANGED `in.svg` across
   engines, re-render with `scripts/oracle-render.sh` and `cmp`. All must match.
   An unchanged file that differs on re-render means a partial capture (memory:
   y-axis-and-oracle-staleness): recapture that engine.
6. Update `tests/oracle/svg-conformance/oracle-freshness.test.ts` so its sentinels and
   `EMISSION_FORM_PROBES` expectations reflect the 8beta1 bytes, and run it. Read the
   file's header first; its probes check emission form across every cached file.
7. Commit `chore(cdd5-T0c): recapture every oracle cache with 8beta1`. The body
   gives per-engine changed-file counts, the orphan handling, jar-failure parity and
   the sample-cmp result. This is a generated commit, exempt from the 400-line
   guideline.

**Write-set:** `test-results/dot-cache/**`,
`oracle/goldens/{class,description,object,state,pending,svg-conformance}/**/{svek-*.dot,input.svg}`,
`tests/oracle/svg-conformance/oracle-freshness.test.ts`, `measurements/t0c/`, journal.
**Read-set:** `scripts/capture-oracle-cache.ts:1-160`, `oracle/capture-corpus.sh`,
`oracle-freshness.test.ts` (header + probes).

**Acceptance.**
- Given `oracle-freshness.test.ts`, when run, then green.
- Given the sample re-render, then 20 of 20 unchanged files `cmp`-match the 8beta1 jar.
- Given the cache directory list, then it is identical before and after (`ls | sort`
  per engine).

**Observability:** N/A. **Rollback:** Reversible with data restore (`git revert`).
