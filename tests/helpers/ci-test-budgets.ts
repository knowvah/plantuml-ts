/**
 * Per-test budgets for suites whose cost is measured on the CI runner, not the
 * dev box. Both values are derived from per-test durations read out of the
 * `vitest-blob-*` artifacts of three `ubuntu-latest` runs (39783015253,
 * 39788016398, 39799137906; 2026-10-22), merged locally with
 * `vitest --merge-reports --reporter=json`. The runner renders 2-8x slower
 * than a quiet 12-core dev box, and the SAME test varied up to 2.2x between
 * those runs, so a test past ~50% of vitest's 5,000ms default on CI is one
 * slow runner away from a timeout that looks exactly like a regression.
 *
 * Set per file with `vi.setConfig({ testTimeout: ... })`, never in
 * `vitest.config.ts`, so the rest of the suite keeps the tight default and a
 * genuinely hung test still fails fast.
 */

/**
 * For a file that renders a fixture (or a whole corpus slice) per test and
 * ran past 2,500ms on CI. The worst observed was 5,046ms
 * (`class.golden.ratchet` `unknown/xuloxo-85-vibu502`, a `classy-c4` stdlib
 * fixture that renders in ~2.6s locally), which timed out; 30,000ms is ~5.9x
 * that, and the value the description ratchets already used for the same
 * failure (`usecase/sprite-svg-bootstrap-0`, 2026-08-12/13).
 */
export const CI_RENDER_BUDGET_MS = 30_000;

/** A golden above this size takes {@link LARGE_GOLDEN_BUDGET_MS}: a zero-diff
 *  comparison walks the whole tree with no child-count short-circuit. */
export const LARGE_GOLDEN_BYTES = 1_000_000;

/**
 * For the sequence ratchets' one >1 MB golden, `zudize-61-vomi445` (8.2 MB).
 * It measured 21,932 / 41,398 / 29,446ms on the three CI runs against the
 * previous 30,000ms budget (one timeout, one with 0.6s to spare); ~5.4s on a
 * quiet dev box. Its cost degrades super-linearly with concurrent workers
 * (memory/GC on an 8 MB string, `.agent-notes/ratchet-zudize-timeout.md`).
 * 120,000ms is ~2.9x the worst observed run.
 */
export const LARGE_GOLDEN_BUDGET_MS = 120_000;
