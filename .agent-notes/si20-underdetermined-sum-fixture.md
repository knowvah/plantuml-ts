# Observation: a fixture whose unknowns appear only as a SUM cannot resolve them individually, however many nodes it has

- **Context**: SI20 T0, resolving ADR-1 — the object port band frame is
  `position = H + margin + Σ(prior member heights)`, where `H` is the header
  translate (`EntityImageObject#getPorts`'s
  `translateY(getNameAndSteretypeDimension())`,
  `svek/image/EntityImageObject.java:264-270`) and `margin` is the body
  wrapper's top marge. Two candidate splits both reproduced the only fixture
  in the corpus that exercises object row ports:
  **A** `(H = 18, margin = 4)` and **B** `(H = 22, margin = 0)`.

- **Finding**: `rozuxo-44-fudi093` **cannot** decide between them, and no
  amount of re-reading it would have. Its two nodes give
  `H + m + 14 = 36` and `H + m + 28 = 50`; subtracting yields `14 = 14`,
  an identity. The fixture pins only the **sum** `H + m = 22`. Both nodes,
  both member counts, both port positions are the same equation twice.

  The general shape, which is the reusable part: **if every equation a
  fixture yields contains the unknowns in the same linear combination, the
  fixture has rank 1 in those unknowns and adding more of its rows adds no
  rank.** Separating them needs a control that moves ONE unknown while
  holding the other — here a **stereotyped** object, because
  `getNameAndSteretypeDimension` grows by the stereotype block (`H` 18 → 30)
  while the body wrapper's marge cannot see the stereotype at all. Measured
  on the authored control: filler `22 → 34`, trailer **unchanged at 4**.

  A second control shape earned its keep the same way: a port on the **last**
  member makes `trailer == bottom margin` exactly, which reads `m` off the
  oracle directly instead of inferring it.

- **Impact — the ruling-out came from ABSENT markup, not from a better fit.**
  Option B predicts `margin = 0`, and `SvekNode#appendTr` drops any row of
  height `<= 0` (`svek/SvekNode.java:298-311`), so under B the trailer `<TR>`
  would not be **emitted at all**. The jar emits it, with `HEIGHT="4"`. That
  is a refutation, not a score: B produces markup the oracle does not contain.
  Prefer this kind of evidence over comparing residuals — it survives the
  "never fit a value" rule, and a numeric tie-break does not.

  Both shapes generalize past ports: any geometry ported as
  `a + b + Σ(...)` where the corpus only ever shows `a + b` needs an authored
  control before either half is written down as a constant. Assuming the
  class-side value transfers is exactly the failure mode — it happened to be
  right here (`m = 4`), by way of a *different* upstream construction (see
  `si20-object-body-is-bodyenhanced1.md`), so "verified against rozuxo"
  would have been a true statement about a wrong derivation.

- **Confidence**: High — all four control readings
  (`ctl-plain`, `ctl-stereo`, `ctl-stereo3`, `ctl-vis`) reproduce under
  `(H = title.height, m = 4)` and none reproduces under `m = 0`; controls
  were rendered with `scripts/oracle-render.sh` against the pinned jar.
  Full tables in `plans/si20-object-row-ports/decision-journal.md`, T0.
