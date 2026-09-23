# cdd-T4 — couple half-edge decor inversion

## Observation: the doc-comment/code contradiction was real, and the live
render confirmed the exact inversion before any edit
- **Context**: step 1 of T4, confirming `pajoka-72-reju527` before touching
  `class-assoc-couple.ts`.
- **Finding**: `npx jiti plans/class-divergence-drive/tools/render-diff.mts
  pajoka-72-reju527` (pre-fix) gave `exp=Foo-apoint5 | act=Foo-to-apoint5` and
  `exp=apoint5-to-Bar | act=apoint5-Bar` — the exact inversion the diagnosis
  described. `makeCoupleCircle`'s `aEdge`/`bEdge` (`class-assoc-couple.ts:
  263-291`, pre-fix) placed `subsumed.bSideDecor`/`.aSideDecor` at the CIRCLE
  end of each edge and hardcoded `'none'` at the classifier end — backwards
  from the function's own doc comment three lines above ("NONE at the circle
  end always, the original a/b-side decor at the classifier end").
- **Impact**: swapped `aEdge`'s `sourceDecor`/`targetDecor` and `bEdge`'s
  mirror to match the doc comment's stated (and jar-verified) intent. Fixed
  `pajoka-72-reju527` to `pass=true structural=0 numeric=0`; the other 7 SB8
  fixtures (cenubi/filoxo/givofi/popesa/rakopi/tunelu/vonago) are
  byte-identical to their pre-fix baselines — the fix is scoped exactly to
  the decor-value bug, not touching their unrelated GEO4/gradient/font/note
  residuals.
- **Confidence**: High (live render before AND after, 24/24 unit tests,
  4/4 quality gates green).

## Observation: a SEPARATE, deeper divergence surfaced on besepi-37-rori892
(NOT one of the 8 SB8 fixtures) — topology direction, not decor value
- **Context**: `pin-diff t123.json t4.json` flagged `besepi-37-rori892: diff
  count rose 656 -> 664` (structural 32->30, numeric 624->634) alongside
  pajoka's expected verdict flip. Instrumented per diagnosis discipline
  before writing this note.
- **Finding**: besepi's couple is `(ia_123, ia_1000042) . ia_..._has_father_123`
  (a=ia_123, b=ia_1000042), subsuming `ia_1000042 -up-> ia_123` — an explicit
  association declared in the OPPOSITE order from the couple's own (A,B)
  parameter list (b written first, a second). Live render (post-T4-fix)
  shows jar's actual ids are `ia_1000042-backto-apoint46` and
  `apoint46-ia_123` — i.e. jar's real topology for THIS couple is
  `ia_1000042(B)->circle` and `circle->ia_123(A)`, the REVERSE of this
  port's hardcoded `A->circle, circle->B` invariant (`makeCoupleCircle`'s
  `aEdge`/`bEdge`, always `{from:aId,to:circleId}`/`{from:circleId,to:bId}`).
  Root: `AbstractClassOrObjectDiagram.java:259-260` (`Association#createNew`)
  sets `entity1real = existingLink.getEntity1()` / `entity2real =
  existingLink.getEntity2()` with NO `isInverted()`-style reordering (unlike
  the DOUBLE-couple `insertPointBetween` at `:152-153`, which DOES normalize
  via `existingLink1.isInverted()`) — so `entity1ToPoint`/`pointToEntity2`
  attach to whichever entity the ORIGINAL explicit link named first, not to
  the couple's own A/B order. This port's `aEdge`/`bEdge` (structurally
  always A->circle/circle->B, per the file's own header doc "verified
  against the oracle") is only faithful when the subsumed edge happened to
  be declared in the SAME order as the couple's own (A,B) list — pajoka and
  the other 7 SB8 fixtures all satisfy that precondition; besepi does not.
- **Impact**: besepi's verdict stayed `diverged` in both t123.json and
  t4.json (not a stop-3 verdict-mover regression, and not a
  previously-conformant fixture losing conformance) — T4's fix is a strict
  correctness improvement (structural 32->30) for the decor-VALUE bug, but
  cannot fully resolve besepi because the topology-DIRECTION bug is a
  separate, deeper mechanism (which edge's `.from`/`.to` a couple attaches
  to) that T4's write-set (`class-assoc-couple.ts`'s decor assignment only)
  was not scoped to touch, per the task's own boundary against expanding
  into other mechanisms riding the same fixtures. A fix would need
  `makeCoupleCircle` to resolve `aEdge`/`bEdge` direction from the SUBSUMED
  edge's own original `.from`/`.to` (mirroring `entity1real`/`entity2real`)
  rather than always hardcoding A->circle/circle->B, and would ripple into
  every consumer of `CoupleCircle.aEdge`/`.bEdge` (multiplicities, labels,
  note-split, the length-flip/inversion helpers) — genuinely separable, not
  chased here.
- **Confidence**: High (live jar render read verbatim for both edge ids;
  Java read at both `createNew` and `insertPointBetween` to confirm the
  asymmetry between the single- and double-couple paths).
