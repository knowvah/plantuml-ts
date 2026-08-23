# si33 / T3 — the sequence ratchet has a SECOND rise mechanism, one level below `[childCount]`

## Observation: a diff-count rise can mean better alignment, not worse output

- **Context**: T3 of `sequence-root-chrome` adopted the document shell and
  replaced sequence's `<marker>` arrowheads with inline geometry. The
  ratchet went red on 256 of 1140 fixtures (884 fell, 0 unchanged).
  `sequence.diff-baseline.ratchet.test.ts`'s doc comment documents exactly
  one rise-that-means-progress mechanism — the `[childCount]`
  short-circuit at `compare.ts:353` — and its 2026-08-23 correction
  concludes that a chrome fix produces a mass FALL only.

- **Finding**: `compareSvg` short-circuits in **two** places, not one.
  Besides `compare.ts:346-353` (`[childCount]`), `compare.ts:172-183`
  pushes ONE diff and `return`s when two positionally-aligned element
  nodes have different tags. So the comparator charges:

  - **1** for a tag substitution (`rect` where the jar has `text`) —
    attributes and children are never looked at;
  - **N** for a tag match with N differing attributes, plus recursion.

  Any change that shifts our content-group child list therefore moves
  cost in both directions. The 256 rises are all of this shape. Worked
  example, `zuluja-50-zore143` (baseline 31 -> 50), which never carried a
  `svg/g[1][childCount]` diff either before or after:

  | | before | after |
  |---|---|---|
  | root chrome diffs | 10 attrs + `defs[1][childCount]` = 11 | 0 |
  | body: tag substitutions (1 each) | 13 | 6 |
  | body: attribute/text diffs on tag-matched pairs | 7 (1 pair) | 44 (5 pairs) |
  | total | 31 | 50 |

  Four more element pairs aligned by tag, and each swapped a 1-diff tag
  substitution for ~10 attribute diffs on an element that was equally
  wrong before — it just was not being measured. The shift itself comes
  from `finalizeSequenceBody` correctly dropping the `#FFFFFF` background
  rect (T2's jar-verified paint guard), which removes one leading child,
  plus one inline head element per message.

- **Impact**: the ratchet's documented "baseline == 12" heuristic for
  telling progress from regression is a proxy for the `[childCount]`
  mechanism only, and it does not cover this one — 83 of the 256 risers
  have a baseline of 11, 24, 30, 31, 32, 33, 38, 51, 63 or 72. Read the
  diff PATHS, not the baseline value: a rise whose new diffs are
  attribute-level on element pairs that previously reported a bare tag
  substitution is the same class of measurement artefact.

  Reproduce the per-fixture path sets with `compareSvg(ours, golden,
  'deterministic')` against `renderFixtureSequence`; the ratchet's own
  `measure()` (`:176-190`) discards the paths and keeps only the count,
  which is why the distinction is invisible from a red run alone.

- **Confidence**: High — measured over all 1141 cached goldens, and the
  before/after path sets were captured for four risers by checking out
  the pre-change `renderer.ts` and re-measuring.
