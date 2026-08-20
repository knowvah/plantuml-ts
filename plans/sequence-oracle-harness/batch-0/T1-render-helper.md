# T1 — The sequence render helper

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/sequence-oracle-harness`. vitest; tests never colocate with source.
**You write no `src/`** — stop 3.

Every svg-conformance suite has a per-engine render helper. Yours mirrors
`render-fixture-state.ts` procedurally. Read that file's doc comment for the
rationale common to all of them: **one measurer instance injected into BOTH
the layout and the render stage**, and the low-level pipeline rather than
`renderSync`, so production's own measurer default cannot leak into a
conformance measurement.

## Task
Write `renderFixtureSequence`, mirroring `render-fixture-state.ts`. Read
`render-fixture-json.ts` too — it documents which sibling steps are omitted
deliberately rather than by oversight (multi-page stripping, post-chrome
document-margin re-application), and you must make the same call explicitly
for sequence rather than silently dropping them.

State in your doc comment which sibling steps sequence needs, which it does
not, and why — citing the field or call that makes each one a no-op.

## Write-set
- `tests/oracle/svg-conformance/render-fixture-sequence.ts`
- `tests/oracle/svg-conformance/render-fixture-sequence.test.ts`
- `.agent-notes/g1h-T1.md`

## Read-set
- `tests/oracle/svg-conformance/render-fixture-state.ts` — the shape to mirror
- `tests/oracle/svg-conformance/render-fixture-json.ts` — the omission rationale
- `src/diagrams/sequence/index.ts`, `parser.ts`, `layout.ts`, `renderer.ts` —
  READ ONLY, to learn the pipeline's real entry points
- `plans/sequence-oracle-harness/decisions.md` D1, D6

## Interface contracts
Export `renderFixtureSequence` with the signature its siblings use — read
`render-fixture-state.ts` for the real one rather than inventing a variant.
Consumed by T2, T4, T5.

## Acceptance
- Given a sequence `.puml`, when rendered through the helper, then exactly ONE
  measurer instance reaches both the layout and the render stage — assert it,
  do not merely arrange it.
- Given the helper, then it never calls `renderSync`.
- Given `tests/fixtures/corpus/sequence/A0001_Test.puml`, then the helper
  returns a string beginning `<svg`.
- Given the doc comment, then every omitted sibling step is named with the
  reason it is a no-op for sequence.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: two new test-tree files, one commit.

## Quality bar
Four gates green, coverage >= 90/90/90. TDD. The complexity hook blocks >500
lines/file, >30 NLOC/function, CCN >10, >5 params — extract a NAMED helper;
never widen an exemption (stop 12).

## Boundaries
- **Always:** mirror the sibling helper; assert the single-measurer property.
- **Never:** touch `src/`; call `renderSync`; invent a signature; run git.

## Report (<=350 tokens)
The exported signature; which sibling steps you kept, which you omitted and
the citation for each; the four gates.
