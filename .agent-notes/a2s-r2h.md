# A2s round 2 — R2h observations

## Observation: lozego-15 has NO note node — `note on link` is the edge label
- **Context**: R2h item 4 asked to verify "lozego-15's note node".
- **Finding**: the block-form `note on link` renders as the relationship's
  edge LABEL in the svek DOT (jar: `label=<<TABLE ... WIDTH="137"
  HEIGHT="135">>` on the Order->OrderItem edge), never as a node. The class
  engine's `linkNote` (class-notes.ts#applyNoteOnLink) covers only the
  colon form; the label dims are not part of the size ratchet (nodes only).
  rotisi-30's `note left : <$printer4>` IS the note-node case and closed
  byte-exact (0.5x0.347222in) with the sprite threading.
- **Impact**: on-link note label sizing is a separate seam if it ever gates.
- **Confidence**: High (jar svek-1.dot + capture dump).

## Observation: same-line `package X <<Db>> {}` bypasses closeContainer
- **Context**: R2h item 3 (daxeno-00) gated USymbol-stereotype fix.
- **Finding**: the CommandPackage same-line `{}` branch
  (class-command-containers.ts, match[5]) calls `collapseEmptyNamespace`
  directly, so a USymbol-naming stereotype stored in
  `descriptiveContainers` by the R2h fix is not attached there — only the
  multi-line `}` close path (`closeContainer`) attaches it. daxeno uses the
  multi-line form; no known corpus fixture uses the same-line form with a
  USymbol stereotype. Routing that branch through `closeContainer` first
  (idempotent: collapseEmptyNamespace no-ops once the ns is gone) would
  unify them, but the file was outside R2h's write-set.
- **Impact**: known residual for a future container task.
- **Confidence**: High (code read; behavior verified by unit tests).

## Observation: class-layout-helpers.ts sits at EXACTLY the 500-line cap
- **Context**: adding the 2-line association dispatch tripped the hook.
- **Finding**: any addition requires freeing lines; R2h merged the two
  stacked doc comments above `tryMeasureNonGenericClassifier` and put the
  new measure helper in class-layout-leaf-shapes.ts (the established home
  for fixed-size leaf measures). The function also carries a
  `#lizard forgives` for its inherent kind-dispatch CCN (now 11).
- **Impact**: next branch added there must move something out first.
- **Confidence**: High.
