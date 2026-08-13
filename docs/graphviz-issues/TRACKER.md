# dot-engine issue tracker

One checklist item per issue file in this folder — nothing else. Check
the box only when the fix has landed in the pinned dot-engine `.tgz`
AND the affected plantuml-ts fixtures re-measure clean (the class /
object ratchets and census re-run instantly against an updated `.tgz`).

- [x] 01-getlayout-render-spline-mismatch.md
- [x] 02-cluster-node-fractional-centering.md
- [x] 03-splines-attr-unsupported.md
- [x] 04-anchor-point-rank-assignment.md
- [x] 05-cluster-label-dimensions-ignored.md
- [x] 06-cluster-bbox-not-in-getlayout.md
- [x] 07-html-label-mark-not-exported.md
- [x] 08-cluster-scoped-rank-subgraph-bbox.md
- [ ] 09-routesplines-drops-edge-on-record-ports.md
<!-- 09/10/11 left unchecked on dot-engine 1.4.0 (2026-08-13): the box means
     "fixed in the pinned version AND the affected fixtures re-measure clean".
     1.4.0 moved no measured count -- all five DOT gates and all three censuses
     are byte-identical to 1.3.0, distributions included -- and the symptoms
     could not be reproduced on 1.3.0 either, so there is nothing to observe
     going green. Per-issue detail is in each file's own "Verification
     attempt" section. -->
- [ ] 10-edge-spline-sp-ep-not-exposed.md
- [ ] 11-flat-edge-label-width-ignored-in-nodesep.md
- [ ] 12-port-label-placement-near-head-node.md
- [x] 13-edge-tail-head-label-positions-not-in-getlayout.md
