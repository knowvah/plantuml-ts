# cdd8 T1a: the ElkBackend seam

## Observation: the jar's own proxy layer is runnable as an oracle
- **Context**: pinning the `ElkBackend` contract-suite coordinates.
- **Finding**: `javac -cp oracle/dist/plantuml-oracle.jar Probe.java` compiles
  against `net.sourceforge.plantuml.elk.proxy.*` and the bundled ELK 0.12.0;
  `java -cp <jar>:<out> Probe` lays a graph out exactly as
  `CucaDiagramFileMakerElk` would and prints every coordinate. The six
  contract graphs (2-node DOWN, cluster padding, inline+TAIL edge labels,
  bend points, INCLUDE_CHILDREN cross-cluster edge, proxy EnumSet) gave
  values elkjs 0.12.0 reproduces bit for bit (e.g. bend x
  27.666666666666657). The graphs are the ones built in
  `tests/unit/elk/elk-backend.contract.ts`.
- **Impact**: any ELK question (option semantics, a maker detail) can be
  settled against the jar in seconds without a fixture; no need to infer
  from SVG.
- **Confidence**: High

## Observation: the proxy EnumSet defect is observable, and `[OUTSIDE]` reproduces it
- **Context**: `ElkWithProperty.java:30-39` passes `EnumSet<proxy NodeLabelPlacement>`.
- **Finding**: through the jar, a 100x40 label on a 100x50 node with
  `NODE_LABELS_PLACEMENT = EnumSet.of(INSIDE, H_CENTER, V_CENTER)` lands at
  (0, 0); the same set passed to ELK directly (real enums) lands at (0, 5);
  unset also gives (0, 0). The jar's stored value prints
  `[INSIDE, V_CENTER, H_CENTER]` with element class
  `net.sourceforge.plantuml.elk.proxy.core.options.NodeLabelPlacement`.
  "Unset" is NOT equivalent in ELK's code (isEmpty differs:
  `ElkGraphLayoutTransferrer:196-199`, `GraphTransformer:683-692`); `[OUTSIDE]`
  is equivalent at every reader of the option in ELK 0.12.0 (argument in
  `src/core/elk/elkjs-options.ts`).
- **Impact**: the elkjs backend serialises a proxy set on
  `nodeLabels.placement` as `[OUTSIDE]`; any other ENUMSET option given a
  proxy set throws (upstream sets none: `CucaDiagramFileMakerElk.java:403-408`
  is commented out).
- **Confidence**: High (jar probe + ELK source read)

## Observation: elkjs's worker module hijacks a Web Worker
- **Context**: `elk-worker.js:79597-79604`.
- **Finding**: when `document` is undefined and `self` is defined, the module
  sets `self.onmessage` and exports nothing, so `loadElk()` in a Web Worker
  throws `ElkBackendError` (no Worker constructor). Node and a bundled browser
  main thread take the `module.exports = {default, Worker}` branch.
- **Impact**: a consumer rendering inside a Web Worker cannot use `loadElk()`;
  it would need its own `ElkBackend`.
- **Confidence**: High (source read; not exercised in a real Web Worker)

## Observation: `npm run build` now bundles elkjs into dist
- **Context**: verifying D1's separate chunk.
- **Finding**: vite emits `dist/elk-worker.min-*.js` (1.84 MB) and
  `.cjs` (1.42 MB) chunks, loaded lazily, plus a 0.7 kB
  `rolldown-runtime-*` interop chunk the main entry imports statically.
  `vite.config.ts` keeps `@knowvah/dot-engine` external because it is
  EPL-2.0 ("we DEPEND on it rather than redistribute it"); elkjs is
  `EPL-2.0 OR GPL-3.0-or-later` and is not in that list.
- **Impact**: the published tarball redistributes elkjs unless
  `external` gains `/^elkjs(\/|$)/`; a licensing decision, not made here.
- **Confidence**: High
