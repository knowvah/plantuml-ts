# Class engine ranks `..|>` realization edges on the wrong side

> ## ✅ FIXED 2026-08-08 — and the original diagnosis was incomplete
>
> The rank does not depend on the relationship TYPE at all. It depends on
> **which endpoint upstream's `Link` puts first**, which the jar emits
> verbatim and never reorders:
>
> | form | jar `Link` cl1 | dot edge |
> |---|---|---|
> | `A <|-- B` | A (parent) | `A -> B` |
> | `B --|> A` | B (child) | `B -> A` |
> | `D ..|> I` | D (child) | `D -> I` |
> | `I <|.. D` | I (parent) | `I -> D` |
> | `class D extends P` | P (parent) | `P -> D` |
> | `class D implements I` | I (parent) | `I -> D` |
>
> This port normalizes every inheritance form to `from` = child /
> `to` = parent, discarding that order, and then swapped unconditionally --
> correct only when the parent happened to be written first.
>
> **Why the original "remove `implementation` from HIERARCHICAL" broke four
> fixtures:** all four use the `implements` KEYWORD form
> (`class PA1 implements APA`), which the earlier grep for `|>` missed
> entirely. `manageExtends` builds `Link(cl1 = parent, cl2 = child)`
> regardless of writing order, so those must keep swapping. Only the
> child-first ARROW forms must stop.
>
> **The fix:** `Relationship.parentIsLinkEntity1` records which endpoint was
> upstream's `cl1` -- from `swapDirection` for arrow forms, unconditionally
> `true` for the keyword forms -- and `class-dot-graph.ts#ranksParentFirst`
> swaps on that instead of on the type.
>
> **Result:** class ratchet **314/314, zero regressions** (the blunt version
> regressed four), and `class-inheritance-interface-assoc` goes 427 diffs ->
> 204 with its height error 122px -> 1px.
>
> **Residual on that fixture, NOT this gap:** the remaining 204 diffs are
> essentially ONE cause -- a constant **1.500** offset accounts for 148 of
> them -- plus a ~58.8 horizontal placement difference for one entity. Both
> are separate, unowned gaps.


## Observation: `implementation` should not be in `HIERARCHICAL`, but removing it alone regresses 4 pinned fixtures

- **Context**: found while adding the maintainer-supplied fixture
  `oracle/goldens/svg-class/class-inheritance-interface-assoc` (2026-08-08),
  which combines `extends`, an `interface` + `..|>` realization, all three
  visibility modifiers, and a labelled association with cardinalities.

- **Symptom**: 427 diffs against its jar golden. Every entity box is
  **byte-identical in size** — sizing and measurement are correct — but
  placement is wrong, and the whole 122px height error is one entity:

  | entity | ours (x, y) | jar (x, y) |
  |---|---|---|
  | Animal | 137.54, 7 | 133.32, 7 |
  | Dog | 303.23, 173.5 | 7, 172 |
  | Cat | 7, 173.5 | 143.78, 172 |
  | **Pet** | 312.04, **21** | 12.82, **309** |
  | Toy | 160.62, 180.5 | 297.39, 179 |

  We put the interface `Pet` on the TOP rank beside `Animal`; the jar puts
  it on a third rank BELOW `Dog`.

- **Mechanism**: `src/diagrams/class/class-dot-graph.ts:63`

  ```ts
  const HIERARCHICAL = new Set<RelationshipType>(['extension', 'implementation']);
  ```

  Both relationship types get their `from`/`to` swapped before dot emission
  (`:199-201`), so the parent is emitted as the dot source and lands on the
  higher rank. The jar's own DOT (dumped with `-DPLANTUML_DUMP_DOT`) shows
  that is right for `extension` but wrong for `implementation`:

  ```
  sh0006->sh0007   Animal -> Dog    extends       SWAPPED (parent first)
  sh0006->sh0008   Animal -> Cat    extends       SWAPPED
  sh0007->sh0009   Dog    -> Pet    ..|>          NOT swapped -- interface BELOW
  sh0006->sh0010   Animal -> Toy    association   as written
  ```

  (`sh0006..sh0010` map to Animal, Dog, Cat, Pet, Toy in declaration order.)

- **Evidence the diagnosis is right**: removing `'implementation'` from
  `HIERARCHICAL` takes this fixture from **427 diffs to 202**, and the
  document height from `264` (vs jar `386`, a 122px error) to `387` — a
  1px error. Nothing else was changed.

- **Why it is NOT fixed here**: that same one-line change regresses **4
  pinned class goldens** — `likivi-72-liki123`, `tejena-50-nodo558`,
  `vaxaza-84-gune985`, `vutaki-77-seta063` — taking the class ratchet from
  314/315 to 310/315. So `implementation` behaves hierarchically in some
  configuration those four exercise. Shipping the change as-is would trade
  one gap for four regressions.

  (`bipudo-23-xavu432` also appears in that list, but it fails before the
  change too — that is the separate spline gap, now un-pinned from the
  ratchet and tracked as its own mission,
  `plans/class-edge-spline-conformance/`.)

- **Next step for whoever picks this up**: read the jar's DOT for those
  four fixtures and find what distinguishes their `..|>` edges from this
  one. Candidates worth separating: an interface that is itself a subtype;
  `..|>` combined with an explicit direction (`-up->`/`-down->`); a
  realization whose target is also the target of an `extension`; and
  `swappedEdges` (`:80`) feeding arrowhead orientation, which must stay
  correct however the rank swap is decided.

- **Confidence**: High on the mechanism (jar DOT read directly, one-line
  experiment measured both ways). Unknown on the shape of the real fix.
