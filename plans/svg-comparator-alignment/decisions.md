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
