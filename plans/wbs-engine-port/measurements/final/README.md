# wep final measurements (T-exit)

- Gates on the branch tip (after the T5-cov merge): `vitest.json`, `npm-test.log`, `typecheck.log`,
  `lint.log`, `build.log` in this directory — collected 1292 = on-disk 1292, 28671 tests, 0 failed;
  coverage 96.88 / 92.28 / 97.66 / 97.91.
- All-engine survey: **pointer to `../b5w1-eng/`** (sep precedent). `git diff 1ef35abd0 HEAD -- src scripts`
  is empty: everything merged after the wave-1 close survey is tests, fixtures, goldens metadata and plans,
  so no rendered byte can have moved. b0 → b5w1: 204 wbs `diverged → conformant`, 0 other movers,
  0 dotEqual flips across 28 engines.
