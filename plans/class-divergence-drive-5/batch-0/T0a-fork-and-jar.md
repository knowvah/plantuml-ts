# T0a: fork cleanup, jar rebuild, pin.json (D8)

**Context.** `oracle/dist/plantuml-oracle.jar` is a symlink to
`~/git/plantuml/build/libs/plantuml-1.2026.8beta1.jar`, while `oracle/pin.json`
still says 7beta11 (`11ed6720`), and every cache was captured with 7beta11. The fork's
`dot-output` branch is the upstream commit `97a5992a` plus two seam commits
(`c0a38527` DOT dump, `377fbd12` width-table bounder), plus one stray plantuml-ts
planning commit, `7726a27b` ("docs: brief sequence-coordinate-convergence": it adds
`plans/` and `.plan-mission-progress.md`, no Java). That stray commit breaks
`build-oracle.sh`'s check (`dot-output~seamCommitCount` tree == pin tree).

**Task.**
1. Create branch `feat/class-divergence-drive-5` from main in plantuml-ts.
2. In the fork: `git -C ~/git/plantuml status --short` must be clean (else HALT).
   Then `git -C ~/git/plantuml branch dot-output-pre-cdd5 dot-output`, then
   `git -C ~/git/plantuml rebase --onto 377fbd12dce 7726a27b12e dot-output`.
   Verify `git -C ~/git/plantuml log --oneline -3 dot-output` shows exactly the two
   seam commits on `97a5992a`.
3. Copy the existing jar aside:
   `mkdir -p ~/git/plantuml/build/libs-pre-cdd5 && cp ~/git/plantuml/build/libs/plantuml-1.2026.8beta1.jar ~/git/plantuml/build/libs-pre-cdd5/`.
4. Remove the symlink, `rm oracle/dist/plantuml-oracle.jar`. Otherwise
   `build-oracle.sh`'s `cp` targets the same file and aborts.
5. Edit `oracle/pin.json`:
   - `upstreamSha` = full sha of `97a5992a`; `plantumlVersion` = `1.2026.8beta1`;
   - `forkMasterSha` = `git -C ~/git/plantuml rev-parse master`;
   - `seamCommit` = new `dot-output` HEAD; `seamCommitCount` stays 2;
   - move the current 7beta11 block into `previousPin`, with a `retiredOn` date and a
     `why` citing cdd4 journal 6–7 (besepi: port = 8beta1 byte-for-byte). Keep the
     older 7beta3 block nested or listed; never delete history.
6. Run `oracle/build-oracle.sh` without `ORACLE_ALLOW_DRIFT`. It must pass the drift
   check.
7. `cmp oracle/dist/plantuml-oracle.jar ~/git/plantuml/build/libs-pre-cdd5/plantuml-1.2026.8beta1.jar`.
   - If identical: journal it and continue.
   - If different (jars embed timestamps): compare the class files instead,
     `unzip -o` both to temp dirs and run `diff -r` excluding `META-INF/MANIFEST.MF`
     and properties with build dates. Identical classes = pass, journaled with the
     method. Any `.class` difference = **stop 8**.
8. Render `tests/corpus/class/besepi-37-rori892.puml` (or the cache's `in.puml`)
   with `scripts/oracle-render.sh` twice. Both runs must be byte-identical to each
   other; journal their sha.
9. Commit `chore(cdd5-T0a): pin oracle to 1.2026.8beta1 (97a5992)`. The body
   covers: why (cdd4 journal 7), the fork cleanup (backup ref name), the jar
   equivalence method, and that no cache has been recaptured yet.

**Write-set:** `oracle/pin.json`, `decision-journal.md`. Outside the repo: the fork's
`dot-output` ref, `dot-output-pre-cdd5`, `build/libs-pre-cdd5/`.
**Read-set:** `oracle/build-oracle.sh`, `oracle/README.md:48-113`, `decisions.md#D8`.

**Acceptance.**
- Given the rebuilt jar, when compared to the pre-cdd5 8beta1 jar, then byte- or
  class-identical (else stop 8).
- Given `build-oracle.sh`, when run, then the drift check passes with no override.
- Given the fork, then `dot-output~2^{tree}` == `97a5992a^{tree}`, and
  `dot-output-pre-cdd5` still points at `7726a27b`.

**Observability:** N/A. **Rollback:** Reversible:
`git -C ~/git/plantuml branch -f dot-output dot-output-pre-cdd5`, restore the
symlink, then `git revert`.
