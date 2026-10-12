# T0c: ELK spike gate (D3; stop 13)

Agent: typescript-pro (opus). Return only the structured report: verdict
(PASS/FAIL), the per-node coordinate table, timings, files. No preamble or summary.

## Context
upstream picks `CucaDiagramFileMakerElk` for `!pragma layout elk`
(`net/atmp/CucaDiagram.java:478-479`). The jar bundles ELK **0.12.0** (the
`org.eclipse.elk.core` pom.properties inside `oracle/dist/plantuml-oracle.jar`). elkjs
0.12.0 is the same Java ELK compiled to JavaScript by GWT. Planning proved that it lays
out synchronously through its worker dispatcher (decisions.md#D2). This spike answers
the one question that gates the port: **does elkjs reproduce the jar's ELK node
positions?**

## Task
1. `npm install --save-exact elkjs@0.12.0`. Confirm with `npm view elkjs@0.12.0 license`
   (EPL-2.0 OR GPL-3.0-or-later) and record it.
2. In `plans/class-divergence-drive-8/spike/`, write a script (not under `src/`) that
   builds cadutu-02-lazu601's ELK graph exactly as `CucaDiagramFileMakerElk` does.
   - Read the whole Java file first, including `MyElkCluster` and the proxy layer.
   - Root properties come from `CucaDiagramFileMakerElk.java:478-490`, cluster
     properties from `:320-340`, and label/edge properties from `:390-460`.
   - Take node sizes from the jar's own SVG: entity rect width and height. That
     isolates layout from sizing.
3. Run it through elkjs synchronously:
   - `const W = require('elkjs/lib/elk-worker.min.js')`
   - `new W.Worker()`, set `onmessage`
   - `dispatcher.dispatch` with `register`, then `layout`
4. Compare every node's x/y, after the jar's document translate, with the entity
   positions in `test-results/dot-cache/class/cadutu-02-lazu601/in.svg`. Also compare edge
   section points with the jar's `<line>` segments.
5. Record the ELK layout time per call, the module load time and the peak heap.

## Write-set
`package.json`, `package-lock.json`, `plans/class-divergence-drive-8/spike/**`.

## Acceptance
- Given cadutu's graph, when elkjs lays it out, then every node's x/y equals the jar's
  within the deterministic tolerance (`compare.ts` deterministic class). Report PASS.
- Given any mismatch, then report FAIL with the first diverging node and coordinate, and
  the property or size suspected, quoted from the Java. The orchestrator halts (stop 13).
- Then the timings are reported in ms.

**Observability:** N/A. **Rollback:** Reversible (remove the dependency).
