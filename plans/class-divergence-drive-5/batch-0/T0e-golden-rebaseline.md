# T0e: re-baseline every svg golden and baseline; unpin what broke (D1)

**Context.** The `oracle/goldens/svg-*/` goldens are verbatim copies of cached
`in.svg` files, and the ratchet tests compare our output to them. After T0c, each
golden is either stale (the cache moved) or current. Several engines also keep diff
**baselines**: counts rather than goldens. Examples are
`svg-activity/{diff,text,element,style,swimlane}-baseline.json`,
`svg-sequence/diff-baseline.json`, `svg-description/diff-baseline.json`,
`svg-conformance/splines-baseline.json` and the `{size,label-size,direction}-backlog.json`
files under `oracle/goldens/{class,description,object,state}/`. Re-pin scripts
already exist: `scripts/repin-activity-baselines.ts`,
`scripts/repin-sequence-baselines.ts`, `scripts/sequence-repin-snapshot.ts` and
`scripts/pin-corpus-tree.ts`. Read each script's header before running it.

**Task.**
1. **Goldens.** For every `oracle/goldens/svg-*/**/golden.svg`, find its source
   cache file (each suite's README or ratchet test names the mapping). If the cache
   `in.svg` differs from the golden, copy it over.
2. Run the full `npm test` once and collect the failing ratchet cases.
   - A fixture whose output ≠ its new golden: remove it from that ratchet
     (**D1**), add a journal row plus a `fixtures.md` row (for CLASS), and add it to
     `b0-8beta1/NONCLASS.md` (non-class). Each must match a T0d loss. A ratchet
     failure T0d did not predict is stop 4.
   - Never re-pin a fixture the port does not match.
3. **Baselines.** Regenerate each counted baseline with its re-pin script. Then diff
   the JSON (memory: repin-script-raises-preexisting-red-pin): every entry that ROSE
   needs a T0d mechanism, or it is stop 5. Where no script exists, follow the owning
   test's header.
4. Commit the refreshed `tests/oracle/svg-conformance/parity-<e>.json` and
   `census-*.json` from `b0-8beta1` (copy; do not re-run), plus `dot-parity.json`
   if its generator runs off the cache (read its test).
5. Fix the hard-coded counts in `refusal-coverage.test.ts` and
   `routing-conformance.test.ts` if unpinning changed them, with a derivation comment.
   Check `routing-baseline.json` `jarType` for fixtures whose jar TYPE changed under
   8beta1: a row whose jar type moved is a journal row, not a silent edit.
6. Four gates green; collected = on-disk (stop 7). Class DOT parity green (stop 6
   applies from here on).
7. Commit `chore(cdd5-T0e): re-baseline goldens and baselines on 8beta1`. The body
   gives goldens refreshed per suite, fixtures unpinned (with slugs), and baselines
   regenerated.

**Write-set:** `oracle/goldens/svg-*/**`,
`oracle/goldens/{class,description,object,state}/*-backlog.json`,
`tests/oracle/svg-conformance/*.json`, the two gate test files, `fixtures.md`,
`b0-8beta1/NONCLASS.md`, journal.
**Read-set:** each `oracle/goldens/svg-*/README.md`; the headers of
`tests/oracle/svg-conformance/*.ratchet.test.ts`; `decisions.md#D1`.

**Acceptance.**
- Given every ratchet, then each pinned fixture is conformant against 8beta1 and
  its golden equals its cache `in.svg`.
- Given each unpinned fixture, then it has journal and ledger rows matching a T0d
  loss.
- Given the four gates, then green, with collected = on-disk.

**Observability:** N/A. **Rollback:** Reversible (`git revert`).
