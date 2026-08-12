# Architecture decisions — si20-object-row-ports

Confirmed by the maintainer 2026-08-12, except **ADR-1 and ADR-2, which are
deliberately unresolved** and are Batch 0's whole job.

Most of SI17's reasoning transfers and is cited rather than re-derived —
`plans/si17-class-row-ports/decisions.md` is the source, and its
`decision-journal.md` carries the measurements behind it.

---

## ADR-1 — What is the object header translate? *(UNRESOLVED — Batch 0)*

**Status:** Proposed. Resolved by [batch-0/T0](batch-0/T0-band-source-gono-go.md).

**Context.** `EntityImageObject#getPorts`
(`svek/image/EntityImageObject.java:265-270`) is structurally identical to the
class one — `fields instanceof WithPorts` →
`getPorts(stringBounder).translateY(dimHeader.getHeight())` — but the header
it translates by is `getNameAndSteretypeDimension(stringBounder)` (`:266`),
where class uses `header.calculateDimension`. Our object sizer's candidate
analogue is `title.height` (`class-object-map-sizing.ts`
`#buildFieldBasedObjectGeo`, the value already used to offset field rows).

**The frame** (SI17 ADR-1, resolved by measurement) is
`position = H + margin + Σ(prior member heights)`.

**Why the obvious fixture cannot decide it.** `rozuxo-44-fudi093`'s oracle:

| node | members | port on | filler | row | trailer | total |
|---|---|---|---|---|---|---|
| `sh0006` (CC) | 3 | member 2 | 36 | 14 | 18 | 68 |
| `sh0007` (users) | 3 | member 3 | 50 | 14 | 4 | 68 |

That gives `H + m + 14 = 36` and `H + m + 28 = 50`. Subtracting yields
`14 = 14` — always true. **The fixture pins only `H + m = 22`.**

**Options.**
- **A** — the class margin of 4 transfers (`TextBlockMarged#getPorts`
  `translateY(top)`, `top = marginY` from `TextBlockUtils.java:64-69`)
  ⇒ `H = 18`.
- **B** — object's body wrapper carries no margin ⇒ `H = 22`.

Both reproduce `rozuxo` exactly.

**Decision.** Not by argument — by measurement, and **not from `rozuxo`
alone**. Read what `BodierLikeClassOrObject#getBody` actually wraps for a
non-`isLikeClass()` leaf, AND author a discriminating control: a
**stereotyped** object, where `H` moves and `margin` does not.

**Consequences.** T1 cannot start until this resolves. An agent that assumes
`m = 4`, derives `H = 18`, and "verifies" against `rozuxo` **will pass while
being wrong**, and the error surfaces only on a stereotyped object. If
neither option reproduces the discriminating control, that is a **stop**, not
a tie-break.

---

## ADR-2 — Is the object election input `getDisplay(false)`? *(UNRESOLVED — Batch 0)*

**Status:** Proposed. Resolved by [batch-0/T0](batch-0/T0-band-source-gono-go.md).

**Context.** SI17's ADR-5 fixed the election's input as upstream's
`Member.getDisplay(false)` — the display form **without** the visibility
character (`MethodsOrFieldsArea.java:213-217`'s `convert`). The object path
formats members through `formatObjectMemberText`
(`class-object-map-sizing.ts:207`), which is a different function from the
class path's `formatMemberText`.

**Decision.** Verify by measurement whether the two forms agree.

**Consequences.** `rozuxo`'s members are bare words (`UK`, `USA`, `1`, `2`,
`3`), so any drift is **silent** — it elects a different row rather than
failing. Must be asserted on a control whose member HAS a visibility
character, where the two forms differ. This is the same trap SI17's ADR-5
called out, in a path SI17 never exercised.

---

## ADR-3 — Reuse `classPortRows`; do not write an object producer

**Status:** Accepted.

**Decision.** `classPortRows(compartments, portShortNames, headerHeight)`
(`class-port-rows.ts`) is already generic over compartments — SI17 wrote it
that way deliberately ("a caller with one compartment or more than two is
handled identically"). Object passes exactly one.

**Consequences.** The election, the `Ports` higher-score-wins merge, and the
md5 id encoding are all reused verbatim. A second producer would be a second
source of truth for one upstream mechanism.

---

## ADR-4 — `map` and `json` stay on the flat sizer, explicitly OUT of scope

**Status:** Accepted.

**Context.** `mapPortRows` reads `measured.dividerYs[i]` as row *i*'s top.
SI17's ADR-1 rejected that recipe — but **only for class**, where `dividerYs`
is the compartment separator list.

**Decision.** Leave `map`/`json` alone. For a `map` leaf, `dividerYs` **is**
one entry per data row, which is exactly what makes the recipe correct there;
it is jar-verified against `method3`, `__method1__`, `method2`, `USA` and `3`.

**Consequences.** This ADR exists to stop a well-meaning agent "unifying" map
onto the block tree and breaking a working, verified path. Any movement in a
map or json fixture is a stop condition, not a cleanup.

---

## ADR-5 — `memberPortIsP` narrows to `object` ONLY

**Status:** Accepted.

**Context.** SI17 retired the PORTIN/PORTOUT `:P` marking for class-family
leaves and scoped the change narrowly on purpose: `memberPortIsP` returns
`true` (keep `:P`) for every non-`LIKE_CLASS_KINDS` leaf, object included,
because fixing object needed object's own row-port producer — this mission.

**Decision.** Add `object` to the narrow set. `map`, `json` and `descriptive`
keep their current behavior untouched.

**Consequences.** The predicate stays a derivation of upstream's
`usePortP()` (SI17 ADR-2) rather than an invention: `port`/`portin`/`portout`
route to the `'descriptive'` kind (`class-descriptive-leaf-keywords.ts`),
disjoint from both `LIKE_CLASS_KINDS` and `object`, so no object leaf can
reach `EntityPosition.PORTIN`/`PORTOUT`.

---

## ADR-6 — The honest ceiling is 78/80

**Status:** Accepted. Mirrors SI17's ADR-6, including its prohibition.

**Decision.** Object DOT's other non-EQUAL fixtures are not this mission's.
Read the arithmetic correctly before claiming progress: the report's
denominator is 80 and today it breaks down as `77 EQUAL + 1 portOk
(rozuxo-44-fudi093) + 2 no-candidate`, with 1 oracle-blind already **inside**
the 77 (it passes trivially because the jar dumps no DOT to disagree with).

**Consequences.** Closing `rozuxo` moves the count to **78/80**. The
remaining two are `no-candidate` — we feed nothing — and are a separate
mechanism. `besepi-37-rori892` fails `directionOk` and belongs to
object-close B33. **Do not silently redefine the bar to make it look met.**

---

## ADR-7 — Split only what must grow, along seams that already exist

**Status:** Accepted. Ruled up-front by the maintainer rather than left to
opportunistic splitting.

**Context.** The hook at `hooks/check-complexity.py` **blocks the write** at
500 lines. Measured headroom:

| File | Lines | Headroom | Split? |
|---|---|---|---|
| `class-dot-graph.ts` | 499 | **1** | Only if touched — then mandatory |
| `class-object-map-sizing.ts` | 490 | 10 | **Yes** (S1) — must gain the publish |
| `class-layout-helpers.ts` | 490 | 10 | **Yes** (S2) |
| `class-port-rows.ts` | 469 | 31 | No |

**Decision.** S1 and S2 relocate along already-named groups: object geo
builders → `class-object-sizing.ts`; shield helpers
(`memberPortIsP`/`shieldedClassifierIds`/`packageEndpointAnchors`) →
`class-shield-helpers.ts`. Both have repo precedent in both directions
(`class-object-map-header.ts` was split out of the sizing file;
`class-port-rows.ts` out of `class-dot-graph.ts`).

**Consequences.** Mechanical relocations only — no logic change, no
signature change, no reordering. CLAUDE.md forbids refactoring while
porting, so these are moves, not redesigns. Each is its own commit with all
four gates green, so each reverts independently. **If a split changes any
measured number, the seam is wrong and it is a stop condition** — a pure
relocation cannot move a count.
