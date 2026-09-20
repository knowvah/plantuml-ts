# Capturing the five never-captured families (board, chart, chronology, files, packet)

`parity-dashboard-refresh` / T5, 2026-09-20. 41/41 captured with
`scripts/capture-oracle-cache.ts`; both routing/refusal baselines re-pinned
additively; freshness sentinels added.

## Observation: the pinned jar has no chronology factory, so its chronology "oracle" is a placeholder page
- **Context**: `test-results/dot-cache/chronology/lenudo-53-nade902/in.svg` is
  the only golden that carries no `data-diagram-type`.
- **Finding**: it is `PSystemUnsupported`'s page ("Diagram not supported by this
  release of PlantUML", `PSystemUnsupported.java:62`). `PSystemBuilder.java:284`
  returns that system when NO factory in the block's candidate set produced a
  diagram and no `PSystemError` was collected — i.e. `plantuml-1.2026.8beta1`
  (the pinned `oracle/dist/plantuml-oracle.jar`) ships no `DiagramType.CHRONOLOGY`
  factory. It is a rendered document, not an error page: `isJarErrorPage` (no
  version banner) says rendered, so routing pins it `agree` at NONE == NONE and
  refusal pins it `ok`.
- **Impact**: every survey/census verdict for chronology compares our render
  against a placeholder; it is not a fidelity number and must not be quoted as
  one. Whoever ports chronology needs a jar that supports it before any oracle
  work; the freshness sentinel for chronology flips the moment such a jar is
  pinned, which is deliberate.
- **Confidence**: High (Java read; golden inspected).

## Observation: `oracle-freshness.test.ts` trusted the jar's exit code
- **Context**: adding the chronology sentinel turned the suite red in `beforeAll`.
- **Finding**: `SourceFileReaderAbstract.java:108-114` marks the whole run
  errored for a `PSystemUnsupported` block exactly as for a `PSystemError`, and
  `Run` exits 200 AFTER writing every SVG — the same Finding 1 that
  `.agent-notes/aoh-T0.md` records and `capture-oracle-cache.ts` encodes. The
  freshness gate's single-invocation `renderAll` threw on that exit.
- **Impact**: fixed in the test (exit ignored; per-sentinel byte comparison is
  the success test). Any other harness that shells out to `oracle-render.sh`
  and treats non-zero as failure has the same latent bug once any block in the
  run is unsupported or errors.
- **Confidence**: High (reproduced, fixed, 30/30).

## Observation: all four new engines omit the root `data-diagram-type`
- **Finding**: `renderBoard` (`board/renderer.ts:75-81`), `renderChart`
  (`chart/renderer.ts:336-341`), `renderFiles` (`files/renderer.ts:64-69`) and
  the packetdiag renderer (`packetdiag/renderer.ts:104-109`) return a
  `RenderFragment` with no `diagramType`, so `assemble-svg.ts:496-497` never
  stamps the attribute `TextBlockExporter.java:292-294` writes on every jar
  export. 40 fixtures, one mechanism, pinned `known-misroute`; they fall to
  `agree` (logged `[FIXED]`) when each engine sets `diagramType`.
- **Impact**: a one-line change per engine closes 40 routing pins; a candidate
  follow-on mission.
- **Confidence**: High (measured through the gate's own seam).
