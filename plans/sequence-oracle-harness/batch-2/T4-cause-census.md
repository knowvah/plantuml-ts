# T4 — The cause census, computed not interpreted

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. **No `src/`** — stop 3.

The point of this task is to hand the future rebuild a ranked work queue
instead of N opaque diff counts. **The risk it introduces is a census that
reads confidently and measures wrong** — that failure mode occurred twice in
SI32 alone, at "High" stated confidence both times. D5 is the guard: every
number here must be reproducible by re-running committed code, never the
product of an agent looking at SVGs and forming an impression.

## Task
1. Write `sequence-diff-census.ts`: a module that classifies each `Diff`
   record (`compare.ts:35` — `path`, `actual`, `expected`, `delta`,
   `tolerance`) into exactly one of the buckets D5 fixes:
   `missing-element`, `extra-element`, `geometry`, `text-metrics`,
   `format-units`, `other`.
   Classification is **mechanical**, derived from the record's own fields.
   If a diff does not clearly belong to a bucket it is `other` — a large
   `other` is a legitimate finding to report, never a reason to invent a
   bucket or to guess.
2. Unit-test every bucket rule against a **synthetic `Diff`**, so each rule is
   pinned independently of any fixture.
3. Emit `oracle/goldens/svg-sequence/diff-census.json`: per fixture, the
   bucket counts; plus a corpus-wide total per bucket.

## Write-set
- `tests/oracle/svg-conformance/sequence-diff-census.ts`
- `tests/oracle/svg-conformance/sequence-diff-census.test.ts`
- `oracle/goldens/svg-sequence/diff-census.json`
- `.agent-notes/g1h-T4.md`

## Read-set
- `tests/oracle/svg-conformance/compare.ts` — the `Diff` shape at `:35`
- `oracle/goldens/svg-sequence/diff-baseline.json` — T2's fixture list
- `.agent-notes/g1h-T2.md`
- `plans/sequence-oracle-harness/decisions.md` D5, D6

## Interface contracts
Consumes `diff-baseline.json`'s fixture list. Emits per fixture
`{ slug, buckets: Record<BucketName, number> }` plus a corpus total. Bucket
names are exactly D5's six — adding a seventh is stop 9.

## Acceptance
- Given a synthetic `Diff` for each bucket, then the classifier assigns it to
  that bucket and no other — one test per rule.
- Given the corpus, when the census runs twice, then the output is
  byte-identical.
- Given `diff-baseline.json`, then every non-errored fixture in it appears
  exactly once in the census.
- Given a fixture recorded `status:"error"` by T2, then it is excluded from
  bucket counts and reported separately, never counted as zero diffs.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one commit; the census is regenerable from the committed cache.

## Quality bar
Four gates green, coverage >= 90/90/90. TDD — the synthetic-`Diff` tests are
written before the classifier. Complexity hook: extract a NAMED helper.

## Boundaries
- **Always:** derive every bucket from the `Diff` record's own fields; report
  a large `other` honestly.
- **Never:** touch `src/`; classify by eyeballing an SVG; add a bucket outside
  D5's fixed set; state a count you have not computed from committed code;
  run git.

## Opus behavioural notes
Do NOT infer unstated requirements. Do NOT over-engineer. Do NOT spawn
subagents. The bucket set is fixed and the acceptance list is a requirement
list, not scope to trim.

## Report (<=450 tokens)
The six bucket totals corpus-wide; the three fixtures with the highest counts
per bucket; the size of `other` and your honest read of what is in it; the
four gates.
