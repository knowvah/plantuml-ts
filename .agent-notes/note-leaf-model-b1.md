# note-leaf-model — Batch 1 observations

## Observation: `::member` note command routing diverges from upstream in two forms
- **Context**: Deciding T2's `NoteGeo.leafType` stamp rule; read
  `ClassDiagramFactory.java:146-155` and both note command factories.
- **Finding**: Upstream registers `CommandFactoryTipOnEntity` (the TIPS leaf)
  ONLY as `createMultiLine(true/false)` and ONLY for `(right|left)`. A
  single-line `note left of A::m : text` therefore falls to
  `CommandFactoryNoteOnEntity`, whose `codeForClass()` CODE class
  `[^%s{}%g<>]+` admits `::`, so `quarkInContext(true, "A::m")` — an
  unknown quark → `"Not known: A::m"` error (no note drawn). Likewise
  `note top|bottom of A::m` never matches the TIPS regex. This port's
  `class-notes.ts#addNote` treats ANY `::` target as a member-tip
  (`targetPort`), for all four positions and both single/multi-line.
- **Impact**: Not a Batch-1 concern (0 corpus fixtures hit it; T2 stamps by
  the shape drawn, which is unambiguous). A parser-fidelity item for a
  later mission — fixing it moves fixtures, which this mission forbids.
- **Confidence**: High (Java read; port grammar read).

## Observation: the brief's baseline numbers were stale on day one
- **Context**: T1 measured shape-match 779/25975 and class DOT 680/711 vs the
  brief's 776/25695 and "100% EQUAL of 712".
- **Finding**: `feat/edge-label-box-closeout` merged (`0cc54633`) after the
  brief was drafted the same morning (`b535c1d2`) and re-baselined both on
  purpose (`labelSizeOk`). Baselines now live as files under
  `plans/note-leaf-model/baseline/`; gates diff against those.
- **Impact**: A brief drafted the same day as another mission's close-out
  should re-measure at batch-1 start, not trust its own numbers.
- **Confidence**: High.

## Observation: `scripts/note-order-report.ts` is a reusable byte-identity gate
- **Context**: T1.
- **Finding**: `npx tsx scripts/note-order-report.ts --check <saved>` runs in
  ~4 s over all 802 class/object fixtures and compares a whole-SVG sha per
  note-carrying fixture plus the entity/link document order and uids.
- **Impact**: Any class-engine restructure that promises "no output change"
  can use it (save a report on the base commit, `--check` after).
- **Confidence**: High.
