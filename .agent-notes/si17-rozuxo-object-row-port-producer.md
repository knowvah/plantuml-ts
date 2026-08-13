# Observation: `rozuxo-44-fudi093` is object's missing row-port producer — the object-corpus twin of SI17

> **STATUS: LANDED — SI20, `feat/si20-object-row-ports`, 2026-08-12.**
> `rozuxo-44-fudi093` closed; object DOT **77/80 → 78/80**, object `portOk`
> 1 → 0; `oracle/goldens/object/port-backlog.json` empty and deleted
> (`83bc0e98`). The mechanism landed in `62a356ca` (T2). Full record:
> `plans/si20-object-row-ports/ledger.md`.
>
> **This note's own scope claim was wrong, and the correction is the point.**
> The Impact section below says the mission is *"scoped by precedent rather
> than by discovery — the ADRs, the band frame and the file-by-file shape all
> transfer."* The band frame did transfer. **The file-by-file shape did
> not, and neither did the upstream route.** Two corrections, both measured
> in SI20 T0 and preserved in full in the sections that follow:
>
> 1. **Different upstream construction.** An object body is `BodyEnhanced1`
>    via `BodierLikeClassOrObject.java:225-233` → `BodyFactory.java:71`, and
>    its margin of 4 comes from `BodyEnhancedAbstract#decorate:111-113`'s
>    `withMargin(block, 6, 4)` — **not** from `MethodsOrFieldsArea#
>    asBlockMemberImpl`, which the class branch reaches and an object leaf
>    never touches (`:234-235` asserts `type.isLikeClass()`). The two
>    constructions coincide at 4 independently; copying the class one gets
>    the right number for the wrong reason. It also carries a behavior class
>    has no analogue for: `MinimumWidth > 0` wraps the body in
>    `TextBlockMinWidth`, which does not implement `WithPorts`
>    (`klimt/shape/TextBlockMinWidth.java:45`), suppressing every port while
>    the shape still flips. See
>    `.agent-notes/si20-object-body-is-bodyenhanced1.md`.
> 2. **Different port file.** The class-side model named below points at
>    `class-layout-generic-classifier.ts#buildNormalClassifierResult` as the
>    publisher of the header height and per-member heights. The object sizing
>    path is `measureObjectClassifier` / `buildFieldBasedObjectGeo`
>    (`class-object-map-sizing.ts`, relocated to `class-object-sizing.ts` by
>    SI20 S1), so `portMemberSections` had to be published **from a different
>    file entirely** — and the election text had to come from
>    `formatObjectMemberText`, not `formatMemberText`, a drift that no gate
>    could see (`.agent-notes/si20-object-election-text-and-import-cycle.md`).
>
> Generalizing: "scoped by precedent" is a claim about the *destination*
> files, and it can only be made after opening them. This note made it from
> the upstream symmetry of the two image classes, which is real but bounds
> only the flip predicate — not the composition beneath it.
>
> The original note is preserved verbatim below as history.

- **Context**: SI17 closed the class row-port debt (`portOk` 22 → 0, class DOT
  710/711). B1's shared-emitter fix also moved object DOT 74/80 → **77/80**.
  The one `portOk` failure left in the object corpus is `rozuxo-44-fudi093`,
  and it correctly did **not** close — nothing SI17 built produces object row
  ports.

- **Finding**: Object needs the same mechanism class just got, against
  `EntityImageObject` rather than `EntityImageClass`. The upstream shape is
  already known and does not need re-deriving:

  - The shape flip is the *same* predicate, in the object image:
    `getPortShortNames().size() > 0` → `RECTANGLE_HTML_FOR_PORTS`
    (`svek/image/EntityImageObject.java:249-253`, character-for-character the
    same test as `EntityImageClass.java:255-259` — SI17's ADR-4 cites both).
  - The bands come from the same block-tree composition SI17's ADR-1 resolved
    by measurement: `getPorts` on the image translated by the header height,
    then `MethodsOrFieldsArea#getPorts`
    (`cucadiagram/MethodsOrFieldsArea.java:194-211`) accumulating each member's
    own measured height, with `TextBlockMarged`'s `top = 4`
    (`klimt/shape/TextBlockUtils.java:64-69`). Do **not** re-derive it from a
    flat sizer: SI17 measured that path and it drops bands outright, because
    `dividerYs` is the compartment separator list, not one entry per row.
  - The edge suffix is unconditional (SI17 ADR-3) and discriminated from the
    PORTIN/PORTOUT `:P` path by the target leaf's own `EntityPosition`
    (ADR-2).

  The class-side files that are the model for the port:
  `src/diagrams/class/class-port-rows.ts` (the pure producer — `classPortRows`,
  `classifierPortShortNames`, `classPortShortNamesById`),
  `src/diagrams/class/class-dot-graph.ts` (`buildOneDotNode`, the call site),
  `src/diagrams/class/class-layout-generic-classifier.ts`
  (`buildNormalClassifierResult`, which publishes the header height and the
  per-member heights that the producer needs), and
  `src/diagrams/class/class-classifier-ast.ts` (the persistent
  `portShortNames` registry mirroring `abel/Entity.java:112,538`, without which
  subsumption destroys the port name — see the B2 entry in SI17's ledger).

- **Impact**: This is the natural next mission after SI17 and is scoped by
  precedent rather than by discovery — the ADRs, the band frame and the
  file-by-file shape all transfer. Closing it takes object DOT to 78/80
  (`besepi-37-rori892`, `directionOk`, belongs to object-close B33; plus the
  remaining no-candidate/oracle-blind entries). It was deliberately left open:
  closing it from SI17's change would have been a result without a mechanism.

- **Confidence**: High — the residual was re-measured by the orchestrator after
  B2, and the upstream symmetry is quoted from both image classes.
