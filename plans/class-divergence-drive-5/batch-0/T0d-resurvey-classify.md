# T0d: re-survey every engine on 8beta1; classify every mover

**Context.** T0b measured the 7beta11 baseline, and `src/` has not changed since. So
every verdict or `dotEqual` change is an oracle effect (D2): either the upstream
output moved away from the port (a **loss**), or the port already followed 8beta1
(a **gain**, a reveal of earlier port work).

**Task.**
1. Survey every engine into `measurements/b0-8beta1/parity-<e>.json`, then census
   class and run render-all class, exactly as T0b did (same load rule; timeouts
   are stop 7).
2. Run `npx jiti $T/pin-diff.mts b0-7beta11/parity-<e>.json b0-8beta1/parity-<e>.json`
   per engine. Save the outputs to `b0-8beta1/diff-<e>.txt`.
3. **Class, both buckets, every mover.** Movers are class-bucket rows, plus
   unknown-bucket rows typed CLASS (routing-baseline `jarType`/`ourType` = CLASS).
   For each one:
   - run render-diff (unknown-bucket rows: until T4 extends the tool, copy the
     cache dir to a scratch class-shaped layout, or render via
     `scripts/svg-parity-survey.ts` one-mode; state which);
   - name the upstream change by grepping `git -C ~/git/plantuml log --oneline 11ed6720..97a5992a -- <java path>`
     for the file the diff points at;
   - add a journal row: `slug · before -> after · upstream commit/file · loss|gain`.
   - besepi is expected to become conformant. If it doesn't, state its residual.
4. **Non-class engines (D2).** For each engine, count gains and losses. Classify
   every mover when an engine has 20 or fewer; otherwise sample ≥ 5, stating the
   count. Write `b0-8beta1/NONCLASS.md`, one section per engine, plus one journal
   row per engine.
5. Seed `plans/class-divergence-drive-5/fixtures.md` with one row per CLASS fixture
   (both buckets) that is non-conformant at b0-8beta1. Columns:
   `tree/slug | verdict | dotEqual | firstDiff | shard | mechanism | family | final`.
   Leave `shard` through `final` empty; T5 re-seeds from b1.
6. Commit `chore(cdd5-T0d): classify 8beta1 oracle movers`.

**Write-set:** `measurements/b0-8beta1/**`, `fixtures.md`, `decision-journal.md`.
**Read-set:** `decisions.md#D1`, `#D2`; `$T/README.md`; the Java diff list
(`git -C ~/git/plantuml diff --stat 11ed6720 97a5992a -- src/main/java`).

**Acceptance.**
- Given every class/CLASS mover, then it has a journal row naming an upstream
  file or commit.
- Given `NONCLASS.md`, then every engine with movers has a gain/loss count and a
  classification (full, or a sample with n stated).

**Observability:** N/A. **Rollback:** Reversible.
