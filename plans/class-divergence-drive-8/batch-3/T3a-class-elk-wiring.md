# T3a: class ELK wiring + the 7 ELK rows (D3, D12, D13)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
1. **`src/diagrams/class/class-elk-adapter.ts`.** Implement `ElkDiagramAdapter` over the
   class engine's existing pieces:
   - the classifier pre-measure/sizing that feeds dot today, so the leaf dimension is
     the same number that becomes the dot node width/height
   - the existing classifier/leaf draw, behind `drawLeaf(id, ug)`
   - groups/namespaces and links, from the same structures `class-dot-*.ts` reads

   Cite the Java each member stands in for. **Reuse, do not re-size.** A leaf whose
   ELK size differs from its svek size is a stop 3 finding: upstream feeds both makers
   the same entity image.
2. **`layoutSync`** (`src/diagrams/class/index.ts`). When `ast.layoutEngine === 'elk'`:
   - build the adapter
   - run `makeElkLayout(adapter, services.elk)`
   - carry the `ElkMakerResult` and the adapter on the geometry, as an optional
     `elk` field in `class-geo-types.ts`
3. **`renderClass`** (`renderer.ts`). When `geo.elk` is present, draw
   `new MyElkDrawing(adapter, result)` into the document in place of the svek/dot body.
   Keep the document chrome (margins, title, legend, frame) composed exactly as the
   svek path does. Upstream wraps both makers' `TextBlock` in the same exporter
   (`CucaDiagramFileMakerElk.java:494-500`).
4. **D12 eligibility.** Change `class.golden.ratchet.test.ts:242-251` to accept
   `dotEqual: true`, OR `oracleBlind: true` with `!pragma layout elk` in the fixture's
   `in.puml`. Read it from the cache directory. Add a test that a non-ELK `oracleBlind`
   row is still ineligible.
5. **Drive each row to 0/0** with `render-diff`:
   cadutu, cirojo, gokoru, lagudi, rutefe, tegefa, temofi. Every residual needs a
   Java-cited mechanism. **No ELK residue may be accepted** (D11, stop 11).

## Rows
`class/{cadutu-02-lazu601, cirojo-62-dubo306, gokoru-18-daba136, lagudi-03-rucu383,
rutefe-49-xeju709, tegefa-14-koxo759, temofi-63-vega763}`.

## Write-set
`src/diagrams/class/index.ts`, `src/diagrams/class/class-elk-adapter.ts` (new),
`src/diagrams/class/renderer.ts`, `src/diagrams/class/class-geo-types.ts`,
`src/core/elk/**` (residual fixes only; journal each),
`tests/oracle/svg-conformance/class.golden.ratchet.test.ts` (the eligibility block only),
`tests/unit/class/class-elk-*.test.ts`, `docs/catalog.md`.

## Read-set
`src/core/elk/**`; `src/diagrams/class/index.ts:60-110`; `renderer.ts:170-260`;
`class-dot-graph-assembly.ts` (how leaves, groups and links reach dot);
`CucaDiagramFileMakerElk.java:480-500`; the 7 rows' `in.puml`/`in.svg`.

## Acceptance
- Given each of the 7 rows, then render-diff reports 0/0, it is survey-conformant and
  census 0-diff, and it is eligible under D12.
- Given a class diagram without the pragma, then its output bytes are unchanged (the
  class ratchet stays green).
- Given a non-ELK `oracleBlind` row, then the eligibility test rejects it.
- Given an ELK leaf, then its size equals the svek size of the same leaf, asserted on
  one fixture.

## Architecture decisions (locked)
D3, D11, D12, D13.
