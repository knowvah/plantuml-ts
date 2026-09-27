# T5: close batch 1 and set the drive's post-re-pin baseline

Follow [close-procedure.md](../close-procedure.md) with `N = 1`, with these
additions.

1. **Before step 1:** apply T3's reported census call-site changes to
   `scripts/svg-conformance-census.ts` (one commit, gates).
2. **Step 6:** run `render-all --tree all` into `$M/b1.json`. `prev` is
   `b0-8beta1/render-all-class.json` for the class rows only; unknown rows have no
   prior render-all, so compare them against `b0-8beta1/parity-unknown.json`
   verdicts.
3. **Step 10:** pin sokevu (`--tree class`) and every unknown-bucket CLASS fixture
   that is survey-conformant and census 0-diff (`--tree unknown`), in one
   pin-goldens run per tree.
4. **Re-seed `fixtures.md`** from b1: one row per non-conformant CLASS fixture, both
   trees. Rows unpinned by T0e or flagged by T0f keep their notes. Assign `shard`
   by first diff, using these rules in order:
   - **S1 text:** `text[..]` attrs (`textLength`, `x`, `y`, `font-*`, `fill`) or
     `text` childCount
   - **S2 edge:** `path`/`polygon` `@d`/`@points`, `line`, or `dotEqual: false`
   - **S3 structure:** `[childCount]`, `@id`, `@class`, `defs`, `errored`
   - **S4 style/shape:** everything else (`fill`, `stroke`, `rx`, `ellipse`,
     `background`, `rect` geometry)
   Rebalance so no shard exceeds 1.5× the smallest by moving whole first-diff
   groups. Journal the counts.
5. The b1 CLASS conformant count, both trees, is the reference for D6's losses.
   Journal it.

**Write-set:** close-procedure write-set, plus `scripts/svg-conformance-census.ts`
(T3 call sites) and `fixtures.md`.

**Acceptance.**
- Given `fixtures.md`, then every non-conformant CLASS row at b1 is present with a
  shard, and the shard sizes are within 1.5×.
- Given the ratchet, then sokevu and every eligible unknown CLASS fixture are pinned.

**Commit:** `chore(cdd5-b1): close batch 1 — <counts>`.

**Observability:** N/A (measurement and pin task). **Rollback:** Reversible (revert the close commit).
