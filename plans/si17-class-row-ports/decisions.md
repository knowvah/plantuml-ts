# Architecture decisions — si17-class-row-ports

Confirmed by the maintainer 2026-08-12, except **ADR-1, which is
deliberately unresolved** and is Batch 0's whole job.

---

## ADR-1 — Where do the class port bands come from? *(UNRESOLVED — Batch 0)*

**Status:** **Accepted — Option A (block tree)**, resolved by measurement in
[batch-0/T0](batch-0/T0-band-source-gono-go.md); numbers in
[decision-journal.md](decision-journal.md) under "T0". `headerTranslate =
dimHeader.getHeight()`. Option B is not a near miss: `MeasuredClassifier
.dividerYs` is the *compartment* separator list for a class, not one entry
per row as it is for a `map`, so `mapPortRows`' recipe drops bands outright.

**Context.** Upstream reads the bands off the live `TextBlock` tree:
`EntityImageClass#getPorts` (`svek/image/EntityImageClass.java:247-253`)
delegates to `body` when it is `WithPorts`, then `.translateY(header
height)`; `MethodsOrFieldsArea#getPorts` (`cucadiagram/MethodsOrFieldsArea
.java:194-211`) accumulates each member's own measured height. Both are
already ported and faithful — and have **zero callers from the class
engine**. Meanwhile this engine sizes classes through flat tables
(`class-*-sizing.ts`), and `mapPortRows` set the precedent of reading bands
off those numbers instead.

**Options.**
- **A — block tree.** `BodyEnhanced1#getPorts` → `MethodsOrFieldsArea
  #getPorts`. Upstream's own path; multi-compartment offsets and the header
  translate come free. Cost: constructs text blocks to measure member
  heights, per leaf per layout.
- **B — flat sizer.** Derive from `MeasuredClassifier.rows` / `dividerYs` /
  `headerRowCount`. Matches `mapPortRows`; no new measurement cost. Risk:
  our flat frame and upstream's per-compartment `y` are not obviously the
  same frame once a class has BOTH fields and methods.

**Decision.** Not by argument — by measurement. This is a live instance of
the standing T6 finding that the ported classes and the flat tables are
faithful in **different places**, so a plausible reading of either is worth
nothing here. Batch 0 computes both against jar oracle DOT and the brief
adopts whichever reproduces it.

**Consequences.** T1 cannot start until this resolves. If neither
reproduces the oracle, that is a **stop**, not a tie-break — picking the
closer one is fitting.

---

## ADR-2 — Discriminate a member port from a PORTIN/PORTOUT port using upstream's own predicate

**Status:** Accepted.

**Context.** Both mechanisms produce a `:`-suffixed endpoint, and this port
currently routes class `::member` links through the PORTIN/PORTOUT one — see
`.agent-notes/T8-member-ports-wrong-mechanism.md`.

**Decision.** Use `leaf.getEntityPosition().usePortP()`
(`abel/Link.java:227-229`), already ported at `src/core/abel/EntityBase.ts
:332`. True → `EntityPort.forPort` → `:P`. False → `EntityPort.create` →
`:p<md5(portName)>` (`cucadiagram/EntityPort.java:50-56`).

**Consequences.** No new predicate of our own invention, so description's
entry/exit points keep working unchanged. Anything that wants a different
rule is diverging from upstream and needs its own ADR.

---

## ADR-3 — The edge port suffix is emitted UNCONDITIONALLY

**Status:** Accepted. **Jar-proven, not inferred.**

**Context.** `EntityPort.create` hashes the port name with no reference to
whether the target node actually declares a matching row.

**Evidence.** `bicabi-42-coto932`'s oracle DOT: three edges anchor to
`sh0007:pc89686…` / `sh0007:pcd2581…`, while the whole file contains **zero
`PORT=`**. `sh0007` is `shape=plaintext` with a single filler
`<TR><TD FIXEDSIZE="TRUE" WIDTH="53.7" HEIGHT="48">`.

**Decision.** Emit the suffix whenever the link names a port and ADR-2 says
it is not a `:P` leaf. **Do not add a "only if a matching row exists"
guard.**

**Consequences.** Graphviz tolerates a dangling port and falls back. This
is precisely the behavior a well-meaning implementer would "fix", which is
why it is an ADR and not a code comment.

---

## ADR-4 — The shape flip is gated on port-name COUNT, not on election success

**Status:** Accepted. Same evidence as ADR-3.

**Decision.** `getPortShortNames().size() > 0` → `RECTANGLE_HTML_FOR_PORTS`
(`svek/image/EntityImageClass.java:255-259`), identical to
`EntityImageObject.java:249-253`. A class whose every member LOSES its
election still becomes a plaintext node — with one trailer row of
`(int)(getHeight() - 0)`.

**Consequences.** `portRows` being **present** (not its length) is what
switches the emitter and the layout adapter, exactly as
`class-port-rows.ts`'s existing map comment already documents.

---

## ADR-5 — The election's input string is upstream's `Member.getDisplay(false)`

**Status:** Accepted.

**Context.** The election is literal string matching:
`.*\b<shortName>\b.*` scores 100, `contains` scores 50, first match in
longest-first order wins (`MethodsOrFieldsArea.java:180-192, 219-236`).

**Decision.** Feed it `convert(cs)` = `Member.getDisplay(false)` — the
display form **without** the visibility character.

**Consequences.** Any drift between our `formatMemberText` and that form
does not fail loudly; it silently elects a **different row**. Must be
asserted on a member that HAS a visibility char, where the two forms differ.

---

## ADR-6 — Scope excludes the oracle-blind 7 and `besepi-37-rori892`

**Status:** Accepted.

**Decision.** Class DOT's other 23 non-EQUAL fixtures are not this
mission's. The 7 oracle-blind carry `!pragma layout smetana|elk` (the jar
dumps nothing to compare); `besepi-37-rori892` fails `directionOk` and
belongs to object-close B33's remainder.

**Consequences.** The exit bar is "711/711 under the port-aware gate"
measured the way `dot-sync-report.ts` already reports it. **Read that
arithmetic correctly before claiming progress:** the report's denominator is
711 and it breaks down as `688 EQUAL + 23 non-EQUAL`, where the 23 are
exactly the 22 `portOk` plus the 1 `directionOk`. The 7 oracle-blind are
already **inside** the 688 — they pass trivially because the jar dumps no
DOT to disagree with, so they are neither a debt to pay nor a denominator to
subtract. (An earlier draft of this ADR asserted they were excluded from the
denominator; the numbers say otherwise, and the arithmetic above is the
check that caught it.)

So closing the 22 moves the count to 710/711, and this mission cannot reach
711 alone: **`besepi-37-rori892` must also land**, and it belongs to
object-close B33's remainder. Either that fixture is fixed there first, or
SI17 closes at 710/711 with `besepi-37` named as the single outstanding
cause. Do not silently redefine the bar to make it look met.
