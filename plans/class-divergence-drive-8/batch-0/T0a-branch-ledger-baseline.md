# T0a: branch, ledger, b0 baseline, hygiene

Agent: orchestrator.

## Task
1. Create the branch `feat/class-divergence-drive-8` off a clean main and commit the brief.
   Run `cp plans/class-divergence-drive-8/settings.autonomous.json
   .claude/settings.autonomous.json` if it is not already in place.
2. Run the four gates. Write `measurements/b0-{vitest.json,npm-test.log,typecheck.log,lint.log,build.log}`.
3. Measure b0:
   - `npx jiti $T/render-all.mts measurements/b0.json --tree all`
   - surveys of every engine into `measurements/b0-eng/parity-<e>.json`
     (`npm run svg:survey -- <e> --out …`)
   - `census-class.json`
4. Correct `fixtures.md` against b0, with a journal row for each correction. Record the 3
   non-class ELK slugs (c4, component, unknown) in its last section.
5. **D8 hygiene.**
   - Remove the entries for `svg-class/bixogo-47-xulu385` and
     `svg-class/roxosu-00-pini153` from `oracle/accepted-divergences.json`. Move each to
     the file's `retired` list, with a reason quoting D8's measured mechanism.
   - Append "re-ruled 2026-10-11: no dot-engine fix pursued (cdd8 D5)" to the reason of
     `svg-class/nugecu-04-tona107` (D11.1).
   - Run the acceptance-ledger tests (`emitter.golden.test.ts` and any test reading
     the file).
6. Commit `chore(cdd8-b0): branch, ledger, b0 baseline, retire salt acceptances`.

## Read-set
README.md, decisions.md#D8 and #D11, fixtures.md, `oracle/accepted-divergences.json`
(`comment` and `retired` shape), the cdd7 close-procedure (format reference only).

## Acceptance
- Given b0, when tallied, then the class bucket reads 713/3/7 and unknown CLASS-routed
  reads 275/10/2. Any other count is journaled with its cause before continuing.
- Given `fixtures.md`, then all 20 rows carry a b0 verdict, S/N, mechanism and task.
- Given D8, then bixogo and roxosu are no longer active entries and their ledger `final`
  reads `open -> salt-engine-port`. The survey still prints them structural-match.

**Observability:** N/A. **Rollback:** Reversible (revert the commit).
