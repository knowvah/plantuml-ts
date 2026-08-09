# T1b — diff-count baseline ratchet for the 22 candidates (2026-07-29)

## Observation: render-fixture.ts and the census script fully agree on all
## 20 non-stdlib-include fixtures; the 2 stdlib-include fixtures disagree
## for an already-documented, harness-scoped reason

- **Context**: Cross-checking `description.diff-baseline.ratchet.test.ts`'s
  measurement (via `render-fixture.ts#renderFixture`, no stdlib
  `includeStore`) against `scripts/svg-conformance-census.ts`'s own pipeline
  (which wires `censusIncludeStore()`), for all 22 T1b candidates.
- **Finding**: Diff counts are byte-identical between the two harnesses for
  all 20 fixtures that don't use a stdlib `!include` (4, 55, 80, 78, 77, 79,
  312, 32, 143, 388, 3, 57, 30, 9, 35, 35, 24, 31, 5 — see
  `diff-baseline.json`). `usecase/bootstrap-0` and `usecase/ruziru-69-xixo434`
  disagree: `render-fixture.ts` throws (`Cannot resolve !include
  <bootstrap/bootstrap>`, no include store wired) while the census-style
  pipeline succeeds with diffCount 22 for both (stdlib store wired). This
  matches the T1 notes' documented mechanism exactly and is moot for the
  ratchet either way — both are `dotEqual=false` in `parity.json`, already
  AC3-ineligible for promotion regardless of which harness renders them.
- **Impact**: Confirms `render-fixture.ts` (the harness this ratchet and its
  sibling golden ratchet both use) is measuring correctly for the
  overwhelming majority of the population; the only disagreement with the
  census is a known, already-documented harness capability gap, not a new
  correctness question.
- **Confidence**: High — verified by running both pipelines side-by-side in
  scratch scripts against the same `test-results/dot-cache` goldens.

## Observation: `usecase/fepuvo-06-rugi981` is malformed on BOTH sides, not
## just the jar golden

- **Context**: Investigating why `fepuvo-06-rugi981` errors under
  `render-fixture.ts` with `comment is not well-formed at position 2937`,
  while the census-style/`isWellFormed` check reports the golden itself
  malformed at position 3575.
- **Finding**: Isolated each side independently: `normalizeSvg(golden)`
  throws (`comment is not well-formed at position 3575`) — this is T1's
  already-documented finding. But `normalizeSvg(ours)` (our own render
  output, via `render-fixture.ts`, no stdlib store) ALSO throws, at a
  different offset (2937) — a previously undocumented, independent
  malformity in our own emission for this fixture. The source markup
  contains a literal `: <include>` edge label plus creole separator lines
  with raw `----`/`__foo1__`/`--foo2--`/`====foo3====` runs; XML forbids the
  two-character sequence `--` inside a comment, so if any of that text lands
  inside an emitted SVG `<!-- -->` comment on our side, our own output
  becomes malformed independent of the golden's own (likely similarly
  caused) malformity. Not investigated further — out of this task's
  test/manifest-only write-set; flagged here for the maintainer.
- **Impact**: Regardless of which side's malformity gets fixed first, this
  fixture stays `status: "error"` in `diff-baseline.json` (compareSvg cannot
  produce a diff count when either side fails to parse) and stays
  AC3-ineligible for promotion (`dotEqual=false` in `parity.json`). But a
  future contributor debugging *why* this fixture errors should know it's
  two independent malformities, not one shared cause.
- **Confidence**: High — verified by calling `normalizeSvg` on each side in
  isolation and observing two distinct throw positions.

## Observation: recomputed diff counts are in the same range T1 reported,
## but were derived independently (not copied)

- **Context**: Per the task spec's explicit instruction not to copy T1's
  numbers into the baseline.
- **Finding**: T1's notes report a range of "3 to 388" across the 22
  candidates; this task's independently-measured range is also 3 (component/
  xufexu-38-fola855) to 388 (component/codabo-50-mupa164) — consistent, but
  measured fresh via a new scratch script calling `render-fixture.ts`
  directly, not read from T1's report.
- **Impact**: No discrepancy found; T1's qualitative description of the
  population (folder/package `[childCount]` bail for group 1, no separator
  support at all for groups 2-3) is corroborated by this independent
  measurement, though the exact per-fixture numbers were not compared
  field-by-field against T1's (per instruction, T1's numbers were never
  read into this task's derivation).
- **Confidence**: High.

## What NOT to write here (per memory.md) — n/a, all findings above are
novel and not derivable from source/docs without the cross-run comparison.
