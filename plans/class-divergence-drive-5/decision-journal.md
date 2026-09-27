# Decision journal: cdd5

Append one row per decision, mover, halt or batch close. Never edit past rows;
correct with a new row that cites the old one.

| # | Date | Task | Entry | Evidence |
|---|---|---|---|---|
| 1 | 2026-09-27 | T0a | Fork cleaned per D8: `dot-output-pre-cdd5` -> 7726a27b; `dot-output` rebased to 377fbd12 (c0a38527, 377fbd12 on 97a5992201a). Brief's "97a5992a" is a typo for 97a5992 (full 97a5992201a7…); `dot-output~2^{tree}` == `97a5992^{tree}` == ff61bb50. Fork `master` == 97a5992 already (unchanged). Dropping 7726a27 un-ignored the fork's pre-existing local `.claude/` (Jul 7 settings), so the fork now shows `?? .claude/` and the jar describes as `-dirty`; left untouched (not ours to delete, no Java). | `git -C ~/git/plantuml log --oneline -3 dot-output` |
| 2 | 2026-09-27 | T0a | `build-oracle.sh` passed drift check with no override. Rebuilt jar not byte-identical (cmp differs at 6656052) — the only differing entry of 8344 is `git.properties` (commit id 377fbd1 vs 7726a27, commit count, email). All 8343 `.class` files identical by `unzip` + `diff -rq`. Class-identical = pass (T0a step 7). `oracle/dist/plantuml-oracle.jar` is now a real file copy, not a symlink. | diff -rq a b → 1 line |
| 3 | 2026-09-27 | T0a | besepi determinism: two `oracle-render.sh` runs byte-identical, sha256 17ca2bdb4a1f686b9ae178e3df6620484a5eecd591e51cb27321f3e563beb122. Differs from the 7beta11 cache `in.svg` (expected; recapture is T0c). | scratchpad r1/r2 |
| 4 | 2026-09-27 | T0b | 7beta11 baseline, all 28 engines surveyed at load 4.5–7.1, 0 timeouts. class 707/3/13 (dotEqual 714) = main; census + render-all class agree (render-all 707/3/13). Per-engine table in `measurements/b0-7beta11/SUMMARY.md`. Errored: sequence 6, unknown 3; oracle-error: ditaa 2, usecase 1 (pre-existing). | b0-7beta11/SUMMARY.md |
| 5 | 2026-09-27 | T0b | PLANNING CORRECTION: README's unknown CLASS/CLASS split "51 conformant / 35 SM / 196 diverged / 2 errored" is the committed `parity-unknown.json` of 2026-09-21 (ubrr-T14), stale across cdd2–cdd4. Fresh on the same 7beta11 cache: 121 / 49 / 112 / 2 (284 rows), plus CLASS/NONE 1, NONE/CLASS 3, STATE/CLASS 1 (all diverged). No action; b1 (T5) is the reference. | same file, filtered by routing-baseline |
