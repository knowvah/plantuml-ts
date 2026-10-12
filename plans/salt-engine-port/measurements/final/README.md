# Final measurements (T-exit, 2026-10-12)

The exit measurement IS the batch-5 close measurement: the code HEAD at the b5 close
(`2336d5ff5`, merge of sep-T5c) is the branch's last `src/` change — every later commit
touches only `plans/`, `oracle/goldens/`, `.agent-notes/` and `planning/`. Re-running the
four gates and the 28-engine chain would measure the same bytes.

- Four gates: `../b5/` — vitest 1272/1272 files collected (= on disk), 28173 tests, 0 failed,
  0 timeouts; typecheck/lint/build exit 0; catalog drift 0.
- Surveys of every engine: `../b5-eng/` (28/28, load gate 40 — journal row 44).
- Diff vs `../b0-eng/` (and `../b3-eng/`): 0 conformant losses in any engine; movers are
  exactly the 51 salt rows (diverged → conformant), class bixogo-47/roxosu-00 and unknown
  lubicu-73 (structural-match → conformant, the `{{salt}}` embeds). Journal row 44.
- Salt: 51/51 conformant (50 byte-pinned in `oracle/goldens/svg-salt/ratchet.json`;
  lakari-33 conformant under the 2026-10-10 error-page rule, held by `diff-baseline.json`).
- Authored root: 25/30 at 0 diffs (`authored-baseline.json`; 1 jar-flake, 4 error-page/crash
  rows conformant by rule).
