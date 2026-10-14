# ufp final measurement

- **Gates** (this directory, tag `final/final`): run on the branch tip after the T3-cov merge
  `d0e4f1342`.
- **Survey:** pointer, not a re-run (wep precedent). `git diff e908d335e d0e4f1342 -- src` is empty:
  the batch-3 close and T3-cov changed only tests, goldens and records. So `../b3-eng/` (surveyed
  at `e908d335e`, 28 engines, 0 timeouts) is the final survey.
- **Verdict diffs:** `../b3-movers.txt` (vs the previous close b2-eng: 1 mover, xucoma-93 up) and
  `../b0-vs-b3-movers.txt` (vs b0-eng: 15 movers, all in-scope `unknown` utility rows up, 0 down,
  dotEqual unchanged).
