# si17-class-row-ports ledger — batch-2 remediation items

**Status.** Batch 2 complete: two B-items, two mechanisms, both fixed at their
origin. This file is the per-item record required by
[batch-2/overview.md](batch-2/overview.md); the full causal chains, ruled-out
alternatives and confirming experiments live in
[decision-journal.md](decision-journal.md) and are cited here rather than
repeated.

**Entry state.** T2 wired the row-port mechanism and moved class DOT
**688 → 706 EQUAL of 711** (`portOk` 22 → 4). T3 re-measured, deleted the 18
earned pins, and diagnosed the four residuals into the two mechanisms below.

**Exit state, re-measured by the orchestrator (not taken on an agent report):**

| Gate | Before batch 2 | After batch 2 |
|---|---|---|
| class DOT | 706/711 — `portOk` 4, `directionOk` 1 | **710/711** — `portOk` **0**, `directionOk` 1 (`besepi-37-rori892`) |
| object DOT | 74/80 | **77/80** — see B1, this MOVED a frozen count |
| component · usecase · state DOT | 262/262 · 93/93 · 267/267 | unmoved |
| class · object SVG census | 343/722 · 35/80 | unmoved |
| description SVG census | 26/358 | unmoved (the brief's "48-set" figure is stale — see below) |
| four quality gates | green | green — 575 files / 12795 tests |

`oracle/goldens/class/port-backlog.json` is **empty and deleted**, and
`tests/oracle/class-dot-parity.test.ts`'s now-dead `portBacklog` const and
branch went with it. No slug was added to any backlog.

---

## B1 — the `:h` fall-through (commit `4051eeb0`)

**Mechanism.** `edgeRef` suffixed `:h` to *any* `shape=plaintext` endpoint
whose link named no member row. Upstream appends `:h` only when
`SvekNode#isShielded()` is true — a **qualified-association** test
(`hasKal1`/`hasKal2`, plus a non-zero `image.getShield()`), never a test on the
node's shape and never a ports test. So a `RECTANGLE_HTML_FOR_PORTS` node's
non-port edges take the bare uid.

**Origin.** `src/core/svek-dot-emit.ts:146`. Upstream:
`svek/Bibliotekon.java:126-132` (`getNodeUid`) gated on
`svek/SvekNode.java:383-396` (`isShielded`), with the qualifier predicate at
`abel/Link.java:569-575` and the shield source at
`svek/image/EntityImageClass.java:262-264` (`getShield` returns
`getEntity().getMargins()`, zero absent a qualifier).

**Causal chain.** T2 flips a classifier with ≥1 port short name to
`shape=plaintext` (ADR-4 — gated on port-name *count*, so it flips even when
some of its edges name no row). Every remaining edge touching that node then
fell through the `plaintext` branch and gained `:h`, so `portOk`'s sorted
endpoint list carried an `"h"` where the oracle carried `"-"`.

**Closed (class, 3 slugs):** `bicabi-42-coto932` (`sh0009->sh0007:h`),
`pijiju-95-xexi872` (`sh0007:h->sh0008`, `sh0007:h->sh0009`),
`refeku-65-gapu585` (`sh0007:h->sh0008`, the `style=invis` note-attach edge).

**Measured before/after.** class DOT 706 → 709 of 711 (`portOk` 4 → 1).

**A frozen count MOVED — object 74/80 → 77/80. Flagged for maintainer review.**
`edgeRef` is a shared emitter and `SvekNode#isShielded` is type-independent, so
the fall-through was never a class-only defect; fixing it at its origin
necessarily fixed object too. Repairing class while leaving object broken would
have required a type-specific guard — inventing a divergence to protect a
number. Two pieces of evidence, both jar-side:

- The old output was **wrong**, not merely different: `guzojo-14-muxa584`'s
  oracle (`test-results/dot-cache/object/guzojo-14-muxa584/svek-1.dot:10`)
  emits `sh0006:p48c4d45f…->sh0007` — a **bare** `sh0007`, where we emitted
  `sh0007:h`.
- The `:h` path was **gated, not disabled**: `fonulu-92-libi014` is the one
  object oracle that genuinely carries `PORT="h"`, and it is still EQUAL inside
  the new 77.

Three earned slugs were deleted from `oracle/goldens/object/port-backlog.json`
in B1's commit. If the maintainer's ruling is that 74/80 was inviolable, the
remedy is to **revise the frozen table, not to re-break object**.

**Also ruled out during diagnosis**, so it is not re-litigated: the brief's
`Gtk::Window` parse hypothesis for `bicabi`. The oracle SVG renders the literal
edge label `:Frame     ' remove this to fix the error`, i.e. upstream parsed
entity `Gtk` plus a **label**, not a port — and this port emits the identical
178×15 label table on the same edge. The parse agrees end-to-end; ADR-3 is
untouched and still holds.

**Filed, not fixed — invisible to every gate.** `pijiju-95-xexi872`'s oracle
carries `sametail=ent0002` on both `implements` edges
(`skinparam groupInheritance 2`) and we emit neither, but `compareStructural`
does not check `sametail`. Recorded in
`.agent-notes/si17-sametail-gate-blindness.md` so it is not lost.

---

## B2 — a subsumed port carried onto the split association edge (commit `7fccbef5`)

**Mechanism as first stated (T3).** When `(Foo, Bar) --> Qux` subsumes an
existing `Foo::method --> Bar` link, we copied the subsumed link's port onto the
new `Foo → point` edge. Upstream builds `entity1ToPoint` from a fresh `LinkArg`
carrying label, quantifier and label-distance but **no port**, so the split link
has `port1 == null` and `EntityPort.create(uid, null)` yields the bare uid.

**Mechanism as it actually is (refined during B2, and this is the finding).**
The carry is a *symptom*. The defect is a structural divergence one level up:
upstream's `Entity.portShortNames` is a **persistent field on the entity**
(`abel/Entity.java:112`), populated by `Link#setPortMembers`
(`abel/Link.java:515-522`) and outliving any individual link — which is exactly
why upstream can build a port-free split edge without losing the node's port
row. This port reconstructed the same set by scanning `ast.relationships[]
.fromPort/.toPort` at **render time**, which is *after* subsumption has spliced
the originating relationship out of that array. `aEdge.fromPort` was therefore
the only surviving carrier of `'method'`, feeding two consumers that must
disagree: the node table (which needs the name) and the DOT edge tailport
(which must not have it).

**The defect is symmetric.** T3 named only the A side;
`AbstractClassOrObjectDiagram.java:264-273` builds **both** `entity1ToPoint`
and `pointToEntity2` port-free, so `bEdge.toPort` leaked the same way.

**Origin.** Symptom: `src/diagrams/class/class-assoc-couple.ts:274`. Root:
`src/diagrams/class/class-port-rows.ts:423-433,446-454`
(`classPortShortNamesById` / `classifierPortShortNames`). Upstream:
`objectdiagram/AbstractClassOrObjectDiagram.java:264-273`,
`abel/Link.java:226-230` (`getEntityPort`),
`cucadiagram/EntityPort.java:56-61` (`getFullString`),
`abel/Entity.java:112,538`.

**Fix.** Re-mirrored upstream rather than suppressing the symptom:
`Classifier.portShortNames` is now a persistent per-classifier registry
(`src/diagrams/class/class-classifier-ast.ts`), populated by
`class-assoc-couple.ts#registerPersistentPort` at subsumption time and read by
`classPortShortNamesById` **alongside** — not instead of — its live
`ast.relationships` scan. Neither split edge carries a port any more, on either
side.

**Closed (class, 1 slug):** `pajoka-72-reju527`.

**Measured before/after.** class DOT 709 → **710** of 711; `portOk` 1 → **0**.
`maxSizeDeltaIn` 0.0000 throughout.

### The methodological finding: an incomplete "ruled out"

T3's B2 diagnosis ruled out "the persistent entity flag being unreproduced" on
the evidence that `sh0006` carries `PORT="pea9f6…"` **identically on both
sides**. The observation was correct; the inference from it was wrong. The node
table was right *because of* the carry, not independently of it. Deleting the
carry in isolation flips `sh0006` back to `shape=rect` with no port row at all
— `shapeOk` FAILS and `maxSizeDeltaIn` goes 0.0000 → 0.6111, measured on
`--slug pajoka-72-reju527` and then reverted before anything was kept.

**The reusable lesson: an observation that holds only because of the thing you
are about to remove is not a ruling-out.** A "ruled out" line has to survive
the counterfactual, not just the current tree. What caught it was measuring the
isolated removal instead of reporting a plausible fix.

---

## Two write-set expansions — both crossing a stated stop condition

Recorded here because the brief's stop condition is "a task needs to write a
file outside its declared write-set", and this mission crossed it twice,
deliberately and on the record.

| # | Task | Files added | Why no in-write-set file could do it |
|---|---|---|---|
| 1 | T2 | `class-layout-generic-classifier.ts` (**publish-only**) | `buildNormalClassifierResult` (`:450-473`) is the unique site where the block-tree frame's three terms — `stereoGeo.headerRowHeight`, `memberSections.fieldFlat`/`.methodFlat` — are simultaneously live, and `MeasuredClassifier` published **none** of them. Recomputing in `class-layout-helpers.ts` would have created a second source of truth for the same geometry; reconstructing from `rows[]` was already disproven in T0 (baselines, not row tops; deltas give 22 not 14). |
| 2 | B2 | `class-classifier-ast.ts`, `class-port-rows.ts` | No in-write-set change can decouple the node table from the edge tailport while both derive from the same render-time scan. The alternative was a conditional suppression that ADR-3 forbids. The expansion moves the port **toward** upstream's own structure (`abel/Entity.java:112`), not away from it. `class-port-rows.ts` was already a mission file (T1, T2). |

---

## Corrections to the brief's own record

- **The frozen description-census figure is stale, not regressed.** The brief
  freezes it at a "48-set intact"; that is a pre-SI16 number (`48/355`, from
  `plans/g4-state-svg/ledger.md:346,721,1037`) measured against the oracle
  cache SI16 re-captured. The real post-SI16 baseline is **26/358**. Corrected
  in [README.md](README.md)'s frozen-counts table; method and evidence in
  `.agent-notes/si17-stale-frozen-count-and-closure-proof.md`.
- **The exit bar's "class DOT back to 711/711" was falsified, not rewritten.**
  ADR-6's arithmetic: 711 = 688 EQUAL + 22 `portOk` + 1 `directionOk`, with the
  7 oracle-blind already *inside* the EQUAL count. Closing all 22 lands at
  **710/711**. The 711th is `besepi-37-rori892`, which fails `directionOk` and
  belongs to object-close B33's remainder.

## Follow-ups leaving this mission

- `besepi-37-rori892` — `directionOk`, owned by **object-close B33**. Not a
  divergence; a backlog item with a named owner.
- `rozuxo-44-fudi093` — object's own missing row-port producer, the
  object-corpus twin of this mission. Scoped by precedent in
  `.agent-notes/si17-rozuxo-object-row-port-producer.md`.
- `sametail` unimplemented **and** unchecked by `compareStructural` —
  `.agent-notes/si17-sametail-gate-blindness.md`.
