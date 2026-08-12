# si20-object-row-ports ledger — per-task mechanisms

One section per task that changed behavior, plus the two relocation tasks
(neither surprised) and T0 (which changed no code but is where the mechanism
came from). Full causal chains, ruled-out alternatives and the confirming
experiments live in [decision-journal.md](decision-journal.md) and are cited
here rather than repeated.

**Entry state.** Object DOT **77/80** — 1 `portOk` failure
(`rozuxo-44-fudi093`), 2 `no-candidate`. Object `A::member` edges were routed
through the retired PORTIN/PORTOUT `:P` shield, which anchors to the whole
node, where upstream anchors to the member's own ROW.

**Exit state, re-measured by T4 at close-out (not taken on a task's report):**

| Gate | Before | After |
|---|---|---|
| object DOT | 77/80 — `portOk` 1 | **78/80** — `portOk` **0**, 2 `no-candidate` |
| class DOT | 710, `portOk` 0, 1 `directionOk` | **unmoved** — 710, `portOk` 0, `besepi-37-rori892` `directionOk` |
| component · usecase · state DOT | 262/262 · 93/93 · 267/267 | unmoved |
| class · object SVG census | 343/722 · 35/80 | unmoved |
| description SVG census | 26/358 | unmoved |
| four quality gates | green | green — 12,811 tests / 1 todo |

`oracle/goldens/object/port-backlog.json` is **empty and deleted**, together
with `tests/oracle/object-dot-parity.test.ts`'s now-dead `portBacklog` const
and branch. **No slug was added to any backlog.**

---

## T0 — ADR-1 and ADR-2 resolved by measurement (commit `c28a9cca`)

Changed no production code. Recorded here because every constant T1 and T2
wrote down came from it.

**Verdict.** `H = title.height` (18 plain, 30 stereotyped), `margin = 4` —
Option A. ADR-2: the object election input **does** reproduce
`Member.getDisplay(false)` on the visibility character.

**Origin.** `EntityImageObject#getPorts`
(`svek/image/EntityImageObject.java:264-270`) →
`BodyEnhanced1#getPorts` (`:228-232`) → `TextBlockLineBefore#getPorts`
(`klimt/shape/TextBlockLineBefore.java:103-107`) →
`TextBlockMarged#getPorts` `translateY(top = 4)`
(`klimt/shape/TextBlockMarged.java:100-102`) →
`MethodsOrFieldsArea#getPorts` (`cucadiagram/MethodsOrFieldsArea.java
:194-211`). So `position = H + 4 + Σ(prior member heights)`.

**Route correction — the mission's own premise was wrong.** The `.agent-notes`
follow-up that scoped this mission called it "scoped by precedent rather than
by discovery". An object body is **`BodyEnhanced1`**
(`BodierLikeClassOrObject.java:225-233` → `BodyFactory.java:71`), and its
margin of 4 comes from `BodyEnhancedAbstract#decorate:111-113` — **not** from
the class path's `MethodsOrFieldsArea#asBlockMemberImpl`, which an object leaf
never reaches (`:234-235` asserts `type.isLikeClass()`). The two constructions
coincide at 4 independently. Closing object from SI17's change would have been
a result without a mechanism, and the mechanism ran through a different
constructor than the brief assumed.

**How the split was resolved — refutation, not fit.** `rozuxo-44-fudi093`
pins only the **sum** `H + m = 22`; its two equations subtract to `14 = 14`.
Two authored controls separated them: a port on the LAST member makes
`trailer == bottom margin` (reads `m` directly), and a **stereotyped** object
moves `H` 18 → 30 while the trailer stays 4. Option B (`m = 0`) was refuted by
**absent markup** — `SvekNode#appendTr` drops rows of height `<= 0`
(`svek/SvekNode.java:298-311`), so B predicts no trailer `<TR>`; the jar emits
one at `HEIGHT="4"`. Generalized in
`.agent-notes/si20-underdetermined-sum-fixture.md`.

**Discovered hazard, handed to T2.** `MinimumWidth > 0` suppresses every
object port — see T2 below.

**Found and NOT fixed.** `formatObjectMemberText` normalizes the `=`
separator: `a=1` formats as `"a = 1"` where `getDisplay(false)` gives `"a=1"`.
Gate-invisible (`DeterministicMeasurer` measures a space as width 0) and
election-neutral (`getScore`'s `\bshortName\b` matches both identically).
Filed as a follow-up, not folded into a port-band change — it needs its own
SVG-census measurement. See "Known follow-ups" in [README.md](README.md).

---

## S1 · S2 — relocations for headroom (commits `c5be12be`, `3936ddb5`)

**Neither surprised.** Both are pure moves under ADR-7, with moved bodies
verified byte-identical against a `sed`-extracted range rather than retyped.
No count moved in either direction, which is the acceptance test for a
relocation.

- **S1** — object geo builders out of `class-object-map-sizing.ts`
  (490 lines, 10 from the blocking hook) into `class-object-sizing.ts`.
  `floorAtMinimumWidth` and the header-math re-exports stayed put: two other
  modules import them from that path, and a relocation may not disturb an
  import site.
- **S2** — `memberPortIsP` / `shieldedClassifierIds` / `packageEndpointAnchors`
  out of `class-layout-helpers.ts` (490 → 418) into
  `class-shield-helpers.ts`. `class-dot-graph.ts`, with one line of headroom,
  **shrank** by one rather than growing. All five DOT gates and all three
  censuses were re-run because `shieldedClassifierIds` feeds every classifier
  kind.

---

## T1 — publish the object port bands (commit `750387f7`)

**Mechanism.** Object leaves never reach `buildNormalClassifierResult`, so
they never received the `portMemberSections` publish SI17 added for the class
family. The object sizer already held both terms T0's frame needs: the header
as `title.height` (published as `dividerYs[0]`) and the per-member heights
from `measureObjectFields`.

**Origin.** `src/diagrams/class/class-object-sizing.ts` —
`buildFieldBasedObjectGeo` / `measureObjectClassifier`.

**What it closed.** Nothing on its own — **inert by construction**, and
measured to be so. Nothing reads the field for objects until T2 adds `object`
to `classPortShortNamesById`. No new measurement call, no changed field value,
no hardcoded header: T0 established that no production constant needed to move.

**Detail worth keeping.** Suppression is gated on `showFields`, mirroring
SI17: a suppressed field list omits the compartment entirely, while an
empty-but-shown one keeps it present with zero members. Upstream distinguishes
those two states and the sizer already did.

**Measured before/after.** Object DOT 77/80 and class DOT 710 `portOk` 0,
byte-identical to the batch-0 baseline.

---

## T2 — the atomic flip (commit `62a356ca`)

**Mechanism.** Three coupled changes in one commit because no subset is
coherent: bands without the edge suffix move every edge to `:h`; the suffix
without the shape flip anchors to ports no node declares; retiring `:P` first
leaves the pinned fixture failing differently.
`classPortShortNamesById` and `memberPortIsP` now gate on `isRowPortKind`
(= `LIKE_CLASS_KINDS` + `object`) instead of `LIKE_CLASS_KINDS`.

**Origin.** `src/diagrams/class/class-port-rows.ts` +
`class-shield-helpers.ts`. Upstream: the flip predicate is
`getPortShortNames().size() > 0` (`svek/image/EntityImageObject.java
:249-253`, character-identical to `EntityImageClass.java:255-259`, SI17
ADR-4); `map`, `json` and `descriptive` marking are untouched and a
PORTIN/PORTOUT leaf still emits `:P` (ADR-5).

**Measured before/after.** Object DOT **77 → 78 EQUAL of 80**, `portOk`
1 → 0. Every other gate unmoved, re-run in T2's own pass because the emitters
are shared. `class-dot-graph.ts` and `svek-dot-emit.ts` untouched.

### Three things this task must be read for, not summarized past

**1. A write-set expansion — flagged for maintainer review.** The
`MinimumWidth` suppression landed in `class-object-map-sizing.ts` (+30) and
`class-object-sizing.ts:421` (the call site), **outside** T2's declared
write-set of `class-port-rows.ts` + `class-shield-helpers.ts`. Journalled
under "SCOPE DECISION"; SI17's T2 made the identical call and recorded it the
same way (`5e074b8f`).

*Why the declared seam could not hold it.* The suppression needs the resolved
`MinimumWidth`, hence `Theme`. `class-port-rows.ts` has no `Theme` at that
seam and `applyShapeAndPorts` is already at the hook-enforced 5-parameter cap,
so threading one would have forced an edit to `class-dot-graph.ts` — which has
two lines of headroom and whose modification is an **explicit stop condition**
in this brief. The chosen site is also the faithful one: upstream applies the
wrapper at body construction, not at port emission.

*The behavior, cited.* `BodyEnhanced1#getArea` wraps the area in
`TextBlockUtils.withMinWidth(...)` when `PName.MinimumWidth > 0`
(`cucadiagram/BodyEnhanced1.java:182-184`), and `TextBlockMinWidth` implements
`TextBlock`, **not** `WithPorts` (`klimt/shape/TextBlockMinWidth.java:45`), so
`BodyEnhanced1#getPorts:228-232` returns an empty `Ports`. The shape still
flips, because `getShapeType` keys only on the port-name **count**. Net effect,
jar-confirmed: `RECTANGLE_HTML_FOR_PORTS` with a single row carrying no
`PORT=`, while the edge still names the port ids. This is real upstream
behavior now mirrored in the port — a suppression to reproduce, not a hazard
to guard against. Class has no analogue.

**2. A defect T2 found in its own wiring — ADR-2's predicted silent drift,
firing in code.** Diagnosed in full in the journal:

- **Mechanism.** `toPortCompartments` rebuilt the election text with
  `formatMemberText`, the **class** reconstructor, for object leaves too.
  ADR-2 had resolved the object election input as `formatObjectMemberText`.
- **Origin.** `src/diagrams/class/class-port-rows.ts`, `toPortCompartments`.
- **Causal chain.** The two reconstructors disagree on reachable input (`\t`
  unescaping, `=` vs `:`). `MethodsOrFieldsArea#getScore`'s
  `.*\bshortName\b.*` tier (`java:228-235`) is sensitive to exactly that — a
  literal `\t` puts a word character where a real tab puts a word boundary,
  dropping the score 100 → 50 — and `Ports#add` replaces only on a strictly
  greater score, so the band is handed to the wrong row.
- **Ruled out.** Not catchable by any gate: `rozuxo`'s members are bare words
  that render identically under both reconstructors, so every count stayed
  green while the code was wrong. Fixed by `electionTextFor(kind)`; the
  discriminating control asserted position 22 where 36 is correct, failed
  before the fix and passes after
  (`tests/unit/class/class-object-row-ports.test.ts`).

**3. `npm test` is RED at this commit, by construction.** `port-backlog.json`
still pinned `rozuxo` as a `portOk` failure while it now passed every check,
and the ratchet asserts a pinned fixture fails `portOk` **and nothing else** —
so passing completely is a failure of the pin, not of the port. T3 retires it
in the next commit. Identical to SI17's T2.

---

## T3 — retire the object port backlog (commit `83bc0e98`)

**Mechanism.** None — this task removes a pin, it does not change behavior.
It exists so the pin dies in the commit after the fix that earned it.

**Origin.** `oracle/goldens/object/port-backlog.json` (deleted — it held
exactly one slug, so retiring that slug emptied it) and
`tests/oracle/object-dot-parity.test.ts` (the `portBacklog` const, its
`existsSync`/`JSON.parse`, and the `else if (portBacklog.has(name))` branch).
No production code touched.

**What it closed.** `rozuxo-44-fudi093`, **verified beyond `portOk`**.
`portOk` is an edge-endpoint comparison that cannot see the node table
(`.agent-notes/si17-sametail-gate-blindness.md`), so the emitted DOT was
compared against the oracle in full: table widths, all three row `HEIGHT`s
(`36/14/18` and `50/14/4`), both `PORT=` md5 ids and both endpoints,
character-for-character identical, and byte-identical to the pinned golden
`oracle/goldens/object/rozuxo-44-fudi093/svek-1.dot`. That satisfies the
mission's own rule: measure the removal in isolation rather than believing
the prior task's claim of closure.

**Measured before/after.** Object DOT 78 EQUAL of 80, re-run from T3's commit
before any edit — matching T2's stated numbers exactly, no correction needed.
Deleting the pin is what turned `npm test` from T2's documented RED to green,
confirming T2 had already landed the whole mechanism.

---

## Follow-on: two stale comments repointed (commit `af82b0ee`, orchestrator)

`portMemberSections` is no longer published only from
`buildNormalClassifierResult`, and `classPortShortNamesById` no longer covers
`LIKE_CLASS_KINDS` alone. T2 found both and correctly declined to touch
`class-dot-graph.ts` mid-task. Both edits are line-neutral by construction and
verified so: `class-dot-graph.ts` still 498 lines, `class-layout-helpers.ts`
still 418.

---

## The honest ceiling — do not read past 78/80

Object DOT is **78/80. The corpus is not clean.** Per ADR-6, and re-measured
at close-out with the slugs named:

- **`zicope-62-pica490`** and **`zuvila-56-nuda425`** — `no-candidate`: we
  feed nothing into the comparison. Both are `!procedure`-generated `map`
  bodies whose arrow legends are embedded `{{ }}` sub-diagrams. A separate,
  unrelated mechanism this mission did not touch.
- **`robitu-34-vupe367`** — the one oracle-blind fixture (`!pragma layout
  elk`). **Correction to ADR-6's arithmetic:** it is *not* "already inside
  the 78". `buildAgg` `continue`s on the elk test **before**
  `analyzeFixture` (`scripts/dot-sync-report.ts:265-266`), and `a.total` is
  incremented inside it, so the oracle-blind fixture is excluded from the
  denominator entirely. The measured decomposition is
  **81 CLASS-tagged = 1 oracle-blind (excluded) + 80 comparable = 78 EQUAL +
  2 no-candidate.** The headline 78/80 is unaffected; only the composition
  claim was wrong. See
  `.agent-notes/si20-oracle-blind-is-outside-the-comparable-set.md`.
- **`besepi-37-rori892`** fails `directionOk`, belongs to the **class**
  corpus, and is tracked under object-close B33 — not this mission, and not
  part of object's 80.
