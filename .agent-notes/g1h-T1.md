## Observation: renderFixtureSequence — omitted-step census and test-suite timing
- **Context**: T1 of `sequence-oracle-harness`, writing
  `tests/oracle/svg-conformance/render-fixture-sequence.ts` by mirroring
  `render-fixture-state.ts`.
- **Finding**:
  - `SequenceDiagramAST` has no `.pages` field (`src/diagrams/sequence/ast.ts`)
    and `renderSequence` (`src/diagrams/sequence/renderer.ts:433`) never sets
    `RenderFragment.preChromeWidth` — both sibling steps (multi-page
    stripping, post-chrome margin re-application) are guaranteed no-ops here,
    same as state.
  - A THIRD omission not present in the state/class/json siblings:
    `parseSequence` (`src/diagrams/sequence/parser.ts:104`) takes only
    `readonly string[]`, not a `UmlSource`-shaped block — confirmed by
    `sequencePlugin.parse` (`src/diagrams/sequence/index.ts:45-47`), which
    discards everything but `source.lines`. So there is no
    `{ ...first.source, rawStyles: ... }` block-widening step to perform
    before parse, unlike every other sibling helper.
  - `sprites` is parsed onto `SequenceDiagramAST` but `renderSequence` never
    reads a `sprites` field at all (no `sprite` token anywhere in
    `src/diagrams/sequence/renderer.ts`), so — unlike
    `render-fixture-class.ts`'s `geo.sprites` passthrough for
    usecase/actor icons — there is no consumer to wire it into.
  - Full-suite `npx vitest run` measured 61.5s–62.6s wall-clock across two
    consecutive runs today (2026-08-20), both over the mission's 60.3s bar.
    Isolated run of only `render-fixture-sequence.test.ts` (4 tests) took
    4.09s. `git status --short` before these runs showed only my two new
    files plus T0's untouched `test-results/`/`scripts_scratch/` changes —
    nothing else in the working tree could explain a suite-wide slowdown from
    my write-set. Not diagnosed further (T0 was concurrently active in the
    same working tree during both runs, and several VS Code helper/tsserver
    Node processes were also running) — flagging for whichever task next
    treats the 60.3s bar as a hard gate, since re-measuring in isolation
    would need T0 to be idle first.
- **Impact**: Confirms the doc-comment's three-way delta from
  `render-fixture-state.ts` is real and citation-backed, not asserted. The
  timing figure is reported as required by the quality bar, but is not
  something this task's write-set (two new test-tree files) could plausibly
  have caused on its own.
- **Confidence**: High (code citations, direct inspection); Medium on the
  timing finding's cause (environmental, not isolated under a quiet system).
