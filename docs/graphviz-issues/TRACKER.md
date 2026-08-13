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
<!-- 09/10/11 on dot-engine 1.4.0 (2026-08-13), all still unchecked:
     09 is REPRODUCED and unchanged -- 34 warning lines / 17 lost edges on both
        1.3.0 and 1.4.0, identical sets. An earlier note here claimed it was
        unreproducible; that used the deterministic measurer, which the issue
        itself says suppresses the symptom. Corrected in the issue file, which
        now carries a working reproducer.
     10 has no consumer in this repo, so no fixture can move either way.
     11's three fixtures sit in the object census's 31+ bucket, which is
        byte-identical across the bump; separating "fix does not reach them"
        from "fix lands but something else dominates" needs per-fixture diff
        counts the census does not print. -->
- [ ] 10-edge-spline-sp-ep-not-exposed.md
- [ ] 11-flat-edge-label-width-ignored-in-nodesep.md
- [ ] 12-port-label-placement-near-head-node.md
- [x] 13-edge-tail-head-label-positions-not-in-getlayout.md
