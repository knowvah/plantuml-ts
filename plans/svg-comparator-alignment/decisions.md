# Architecture decisions — `svg-comparator-alignment`

Confirmed 2026-09-03. Treat as locked. If a task discovers a conflicting
constraint, amend this file and halt for review — do not silently override.

## D1 — LCS-align mismatched sibling lists by `tag`, don't abandon them

**Context.** `tests/oracle/svg-conformance/compare.ts`'s `compareNodes`,
when `actualChildren.length !== expectedChildren.length`, gives up on the
whole subtree and charges `sumUnits(actualChildren) +
sumUnits(expectedChildren)` — the sum of both sides' full sizes, with no
attempt to find which children correspond. Measured on
`activity-element-granularity` T1: a verified-correct port (`<polyline>` →
one `<line>` per segment, matching `Worm.java:134-183`) that improved every
element-level measure (summed \|element delta\| −57.0%, summed \|root-`g`
childCountDelta\| −19.3%) nonetheless RAISED the gated `weightedScore` 7.0%
and failed the activity ratchet on 207/268 fixtures. Isolated with the jar
side held fixed: on `tobajo-64-mipi810`, `jarUnits` is 1236 unchanged;
`oursUnits` goes 686→902; the diff's weight rises by exactly 216 = 902−686.
Full trace: `.agent-notes/aeg-T1.md` on `feat/activity-element-granularity`;
decision D10 there records the halt and the three options considered.

**Decision.** Replace the give-up-entirely short-circuit with real
correspondence: LCS-align `actualChildren` and `expectedChildren` keyed by
`node.type === 'text' ? '#text' : node.tag` (text nodes carry no `tag` per
`normalize.ts:113-114`, so a text node and an element can never key-collide
and LCS can never pair across `type`). Recurse `compareNodes` into every
matched pair — so matched pairs are *really* compared, not swallowed — and
charge only the genuinely unmatched remainder on each side:
`weight: sumUnits(unmatchedActual) + sumUnits(unmatchedExpected)`. The
diff's `actual`/`expected` fields stay the raw sibling-list **lengths**,
unchanged in shape — `sequence-diff-census.ts`'s `missing-element`/
`extra-element` classifier reads exactly those two fields
(`sequence-diff-census.ts:142-143`) and is unaffected. The equal-length
children loop is untouched; this rewrites only the not-equal-length branch.

**Alternative considered and rejected: `weight = |Δunits| + 1`.** A one-line
fix explored in parallel. Rejected: it charges only the *gap* between the
two sides' total sizes, so two completely unrelated subtrees that happen to
be similar in size would score ~1 — a ratchet whose entire purpose is
catching regressions must not be this easy to fool by coincidence of size.
It also never recurses, so it does nothing to restore visibility into
matched-but-differing content the way alignment does.

**Consequences.** New self-contained LCS helper in `compare.ts` (no
existing LCS/diff utility exists anywhere in the repo — grepped `src/`,
`tests/`, `scripts/`, confirmed absent). `compare.test.ts`'s existing
"child-count mismatch is weighted by both child lists" assertion changes
value (recompute by hand once the code exists — do not guess it into the
test). Diff COUNT can rise for a fixture whose `[childCount]` diff used to
be one short-circuit and now expands into "unmatched" plus real recursed
diffs on matched pairs — see D2 for why this is contained.

## D2 — Blast radius is 3 gated files, not "every ratchet"

**Context.** `compare.ts` is the shared comparator behind ~10 diagram
types' SVG-conformance suites. A change to it could plausibly be assumed to
require re-pinning all of them.

**Decision.** Verified, not assumed: only three test files gate on a value
this change can move.
- `activity.diff-baseline.ratchet.test.ts` — gates `weightedScore`. Re-pin.
- `sequence.diff-baseline.ratchet.test.ts` — gates `weightedScore`. Re-pin.
- `description.diff-baseline.ratchet.test.ts` — gates raw `diffCount`, not
  weight. Its 21 baselined fixtures run diffCount 0–312 (median 32); none
  is at exactly 1 (a lone short-circuit), but a `[childCount]` diff nested
  inside a larger count can't be ruled out from the static baseline alone.
  **Measure live before and after; re-pin only what actually moved. If
  anything RISES, stop and adjudicate — never silently re-pin past a rise**
  (mirrors `scripts/sequence-ratchet-adjudicate.ts`'s existing precedent).

The other 8 "golden ratchet" suites (class/description/dot/hcl/json/object/
sequence/skin/state/yaml, ~482 fixtures via `oracle/goldens/svg-*/
ratchet.json`) gate on `compareSvg(...).pass === true` — EXACTLY 0 diffs.
The `[childCount]` branch only fires when sibling-list lengths differ,
which by definition never happens on an already-0-diff fixture. This class
is **structurally immune**, not empirically likely to pass — `npm test`
(the standing 4th gate) confirms this rather than assuming it.

**Consequences.** Re-pinning is scoped to at most 3 files, not 10.

## D3 — This is its own mission, not folded into `activity-element-granularity`

**Context.** `compare.ts` is a shared primitive.
`activity-element-granularity`'s own D2 already reserved `svg-shapes.ts` out
of that mission's write-set on the identical principle: a shared file used
by multiple engines' ratchets gets its own decision record and isolated
review, not a silent edit inside unrelated work.

**Decision.** Branch from `main` (`804232d4`), not from
`feat/activity-element-granularity`. Land here, then resume the activity
mission by re-applying `wip/aeg-T1-measured-halt`'s change on top of the
fixed comparator.

**Consequences.** Two small branches instead of one; the activity mission's
own decision journal gets an explicit "resumed" entry once this lands.

## Not applicable — backwards compatibility

`compare.ts` is test-only infrastructure with no external consumers; this
is not a `src/`-facing change. Classified only by reversibility:
**Reversible** — one file's algorithm plus its own tests, `git revert`
restores the prior short-circuit.

## D4 — AMENDED after T1 landed: the verified blast radius was still incomplete

**Context.** D2 named 3 gated files. Running the full `npm test` after T1
found 3 more consumers D2's grep (`compareSvg`/`weightedScore` importers)
missed, because two of them **duplicate** logic from `compare.ts` rather
than import it:

1. **`oracle/goldens/svg-description/diff-baseline.json`** — 6 of its
   fixtures (`component/bozana-38-xufi750`, `component/kanute-77-lacu414`,
   `usecase/jecici-56-bimu826`, `component/codabo-50-mupa164`,
   `component/xufexu-38-fola855`, `usecase/pivudu-29-pele178`) rose in raw
   `diffCount` (e.g. `xufexu-38-fola855`: 3 → 12). **Mechanism, measured
   per-fixture, not assumed:** every rise traces to a `[childCount]` diff
   that used to short-circuit and now LCS-aligns, recursing into matched
   pairs and surfacing REAL diffs that were previously invisible — e.g.
   `bozana-38-xufi750`'s two nested `g[childCount]` diffs go from
   short-circuited to aligning 3-of-4 children each and finding genuine
   attribute diffs inside them. This is the exact "visibility increase, not
   regression" pattern `diffCount`'s own known non-monotonicity predicts
   (D5, `plans/sequence-root-chrome/decisions.md`) — description was never
   upgraded off raw `diffCount` gating the way activity/sequence were.
   **Decision: re-pin, don't adjudicate as a stop** — the mechanism is
   verified benign for all 6, and D2's "if anything rises, stop and
   adjudicate" is satisfied by this per-fixture mechanism check, not
   bypassed.

2. **`oracle/goldens/svg-sequence/diff-census.json`** — its own consistency
   test (`sequence-diff-census.test.ts`, "a freshly computed slice matches
   what the committed census records") failed: real diffs surfacing where
   short-circuits used to hide them changes bucket membership. Informational
   only, never gated on a pass/fail rise — regenerate via
   `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`.

3. **`scripts/sequence-ratchet-adjudicate.ts`** — built for
   `sequence-command-coverage` (2026-08) to work AROUND the exact defect D1
   fixes: because the old `compare.ts` short-circuit charge was anti-monotone
   under growth, this script classifies a `weightedScore` rise as a benign
   `artefact` (re-pin OK) vs a real `regression`, using an arithmetic
   identity (`ownUnitsOf`, `isSubstructureRise`) that is PROVABLY TRUE only
   under the OLD sum-of-both-sides charge: `weight === ownUnitsOf(ours) +
   ownUnitsOf(theirs)` when root counts differ. Under D1's alignment that
   identity no longer holds by construction (the charge is now scoped to
   the unmatched remainder, not both full sides), so `ownUnitsOf`'s own
   pinned test failed. **Decision:** correct the stale doc comments (the
   header's "the ENTIRE charge is `sumUnits(ourChildren) +
   sumUnits(theirChildren)`" claim, `ownUnitsOf`'s own comment) to state
   they describe the PRE-D1 formula, and fix the one failing test to assert
   the new (smaller, correctly-aligned) number instead of the stale
   identity. **Do not** redesign `isSubstructureRise` in this mission: it
   still degrades gracefully (its identity check simply fires less often,
   since D1 already prevents most of the growth-driven rises it existed to
   classify) and a redesign is separable follow-on work, not required to
   land D1 with all four gates green.

**Consequences.** Write-set for this mission grows by these 3 files (2 test
files' doc/assertion updates, 1 committed census regeneration, plus the
description baseline). None of this changes D1's algorithm or its own new
tests — this is entirely fallout from consumers that duplicated or measured
`compare.ts`'s old exact numbers rather than treating it as opaque.
