# An orphaned `coverage/.tmp` makes vitest SILENTLY under-collect — exit 0

`activity-oracle-harness` close-out, 2026-09-02.

## Observation: the known `coverage/.tmp` race has a second, worse symptom
- **Context**: final gates on the mission branch. Three consecutive `npm test`
  runs on an unchanged tree at one commit reported **683**, then **675**, then
  **673** test files — every one exiting **0**, every one printing a complete
  `Test Files` summary line, none printing a single `FAIL`.
- **Finding**: collection is not the variable. `npx vitest list --filesOnly`
  returns **683** every time, and `find tests -name '*.test.ts' -o -name
  '*.test.tsx'` counts **683** on disk. Files were dropped during EXECUTION.
  The cause is an orphaned `coverage/.tmp` left by two overlapping coverage
  runs — here because a `npm test` invocation hit a 600 s tool timeout, was
  moved to the background, and kept running while another started.
  `rm -rf coverage/.tmp` restores the full count immediately: **683 files /
  18198 tests** both with coverage (68.2 s, load 21) and without (50.4 s).
  Load is a red herring — the clean run happened at load 21, the 673-file run
  at load 9.5.
- **Impact**: `.agent-notes/si33-T5-manifest-baseline-untracked.md` records
  this race with the tell "the run aborts ... with NO `Test Files` summary
  line, so exit code alone cannot distinguish it from a real failure." That
  tell is **not sufficient**. The same race also produces a run that looks
  entirely healthy — summary line present, zero failures, exit 0 — while
  silently skipping up to 10 test files. A gate that "passed" this way has
  not run everything it claims.
- **How to apply**: never trust `npm test` on the exit code alone. Check the
  `Test Files` total against the on-disk count (`npx vitest list --filesOnly`
  is authoritative and cheap). `rm -rf coverage/.tmp` before any run that
  follows a killed, timed-out or backgrounded one. Never let two coverage runs
  overlap — including the case where YOUR OWN long run was moved to the
  background by a tool timeout and is still alive.
- **Confidence**: High — reproduced across five runs, isolated by toggling
  coverage and by clearing `.tmp`, with collection independently pinned at 683.
