# T1b — swap, re-capture everything, measure b1, classify (orchestrator)

No agents running for the whole task (load; stop 7). `$M` = `measurements/`.

1. **Merge T1a** (stops 15/16). `oracle/pin.json`: seamCommit = T1a's fork SHA,
   `seamCommitCount: 4`, `patches` += 0004, a `seamHistory` row. Build via
   `oracle/build-oracle.sh` (drift guard must pass); `shasum` equals T1a's
   staged jar.
2. **Re-capture:** `npx jiti scripts/recapture-oracles.ts --write --workers 6`
   (T0b). Every target CHANGED or SAME is expected; FAILED = investigate before
   continuing. Spot-check 5 random targets against a solo `oracle-render.sh`.
   `npx vitest run tests/oracle/svg-conformance/oracle-freshness.test.ts` green.
3. **Measure b1:** survey-all → `$M/b1-eng`; `seq-scores` → `$M/b1-seq.json`;
   `elements.mts` → `$M/b1-elements.json`; `production-manifest.mts --diff
   $M/b0-prod.json` → 0 changes (stop 6).
4. **Classify** (write `$M/classify.py`): per fixture per engine — unchanged,
   fell (score down / → conformant), owed (conformant loss, score up, or any
   element AWAY). Group owed rows into families by their first diff path with
   indices stripped (and the engine); write `$M/families.md` (family, signature,
   count, 3 sample fixtures) and the `fixtures.md` family table. > 25 families =
   stop 13.
5. **Owed:** `$M/owed.json` = `{ "<engine>/<slug>": { family, b0, b1 } }`.
   Unpin owed golden/ratchet fixtures (precedent cdd5 D1: journal each);
   rises are recorded with their b0 value and the gates taught to read owed
   (a small shared helper next to each ratchet — journal the design).
6. **Re-pin** unchanged/fell rows (close-procedure step 7), promote new
   zero-diff rows, update routing/refusal counts with derivations.
7. **Crash fixtures:** if all four render as real diagrams, delete
   `ORACLE_CRASH_FIXTURES` from `tests/oracle/description-parity.ratchet.test.ts`
   (re-capture their DOT goldens) — else journal why.
8. **Gates** green on `pinned ∪ owed`; dashboard; catalog; `fixtures.md` b1;
   commit `chore(isw-b1): instrument space width 44 — re-capture and classify`.

## Acceptance
- Given b1, when the production manifest is diffed against b0, then 0 changes.
- Given every moved row, when classified, then it is unchanged, fell, or in
  `owed.json` with a family.
- Given the gates, when run, then green, with `owed.json` the only tolerated
  regressions.

**Observability:** families.md + owed.json counts journaled.
**Rollback:** reversible (revert the merge; rebuild seam #3 jar from pin history).
