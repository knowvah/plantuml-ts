# Architecture decisions — object-close

Approved by the maintainer 2026-08-11 ("approve all six, continue").
**Treat every decision here as locked.** If a conflicting constraint
surfaces, STOP and log it to the decision journal — do not silently
override.

---

## D1 — Exit bar: 100% minus NAMED divergences

**Context.** The 2026-07-14 ruling retired the ≥90% slack: every
non-conformant fixture must be carried by a named entry, no anonymous misses.
G3 closed against that bar, but with names that do not survive
re-measurement.

**Decision.** Each of the 80 object fixtures is either SVG zero-diff against
the pinned jar, or has a `ledger.md` row naming a mechanism and a `file:line`.
`gvts-blocked` is admissible **only** with a measured delta as evidence.

**Consequences.** "gvts" stops being usable as a shrug. Closing requires the
audit (batch-1) regardless of how many fixtures get fixed.

---

## D2 — Narrow, do not delete, the `DIVERGENCES.md` geometry entry

**Context.** "Edge geometry follows modern graphviz, not the jar's
graphviz-2.38 transpile" claims a ~0.0097pt sub-pixel difference, generalized
from one class fixture (`bipudo-23-xavu432`). G3 leaned on it for 46 object
fixtures. Measurement: **zero object fixtures** are under 0.5px; deltas reach
1196px, and 19 fixtures carry non-numeric diffs.

**Decision.** The entry's scope is restricted to sub-pixel spline
quantization. Any object delta ≥1px is this port's defect until proven
otherwise, with the proof being a measurement, not a citation of this entry.

**Consequences.** Object geometry is a conformance target again — consistent
with CLAUDE.md, which scopes the accept-the-delta ruling to Smetana paths
(`@startjson`/`@startyaml`/`@starthcl`, `@startgit`, `!pragma layout
smetana`). Object is not one: it emits svek DOT and has a DOT-parity gate.
The entry is edited in T7, not before — the audit supplies its new wording.

---

## D3 — Fix order by shared mechanism, not by diff count

**Context.** All 8 DOT size-backlog slugs are SVG non-conformant and drive 4
of the 6 worst offenders; a wrong node size propagates through identical DOT
into every downstream coordinate. Separately, 19 fixtures share a non-numeric
(colour / DOM-shape) signature.

| Slug | Size pin (in) | SVG diffs | Max SVG delta |
|---|---|---|---|
| `tobuka-93-jale775` | 4.9516 | 148 | 1196px |
| `fonulu-92-libi014` | 0.0556 | 364 | 90px |
| `lisepi-64-mudo307` | 0.0556 | 192 | colour |
| `togixe-65-bepo490` | 0.0467 | 171 | colour |
| `lunike-70-xipi897` | 0.0734 | 102 | colour |
| `pikuba-31-faxo766` | 0.5535 | 7 | 80px |
| `tenalu-53-meri239` | 0.0556 | 24 | 2.2px |
| `fafozi-27-reja300` | ~1e-6 | 2 | 1.0px |

The three identical `0.055556` pins are the signature of one shared
mechanism, not three bugs.

**Decision.** Close the DOT size backlog first, re-measure SVG, then attack
remaining clusters largest-reach-first.

**Consequences.** Avoids chasing coordinates that a single sizing fix moves.
A re-measure after every size fix is mandatory, not optional.

---

## D3a — SUPERSEDES D3's ordering. Reach is measured, not inferred from pins

**Authorization.** Maintainer, 2026-08-11, on T3's falsification of D3's
premise (stop condition 4 raised and answered): "Re-rule D3: order by measured
reach."

**Context.** D3's table above is retained as the historical record, but its
load-bearing sentence — "The three identical `0.055556` pins are the signature
of one shared mechanism, not three bugs" — is **false**, measured:

- `tenalu-53-meri239` is not at 4px at all any more (0.027778 since
  `babcfa94`); the pin was never lowered.
- The two that are at 4px get there by unrelated arithmetic: `fonulu-92`'s is
  2×(badge radius 11−9) on width AND height; `lisepi-64`'s is 2 rows×(14−12)
  on height only. Fixing either leaves the other at exactly 0.055556.
- The genuine shared cause pairs `fonulu-92` with `lunike-70` — whose pins are
  **not** equal. Both are `scripts/compile-themes.py` dropping the theme file's
  `skinparam` blocks.

The root error is instrumentation: `maxSizeDeltaIn` pairs nodes by sorted pool,
so it cannot say which node or property moved (it reported 3.362px for
`togixe-65` where the true single-node error is 12px). **Equal pins were never
evidence of a shared mechanism.**

**Decision.** Batch-2 works in descending order of *measured* reach, taken from
`ledger.md`'s queue. The 8 size-backlog slugs are worked at their own reach,
not as a block — they are 8 fixtures with 6 distinct causes. The re-measure
after every landed mechanism stays mandatory.

**Consequences.** The map/port node-emission family leads (~28 of 80 fixtures)
rather than the size backlog (8). D3's re-measure discipline and its
shared-mechanism-before-coordinates principle are unchanged — only the claim
about *where* the sharing is.

---

## D7 — Large, separable subsystems are deferred as tracked missions

**Authorization.** Maintainer, 2026-08-11: "Defer as tracked missions, carry in
the ledger."

**Decision.** Work that is genuinely large AND separable from object closure is
filed as its own mission-index entry and carried in `ledger.md` by a named row
naming its mechanism and `file:line` — which satisfies D1's exit bar without
pretending the fixture is closed. Confirmed for the ~33 unported USymbol shapes
(`gapisu-00-celo011`, `ruturo-47-kapi300`) and the `{{ }}` embedded-diagram
pipeline (`zicope-62-pica490`, `zuvila-56-nuda425`).

**Consequences.** A deferral is a measured product decision with a tracked
owner, never an effort excuse — the standing CLAUDE.md bar. Everything not
deferred under this decision is fixed in batch-2.

> ## D7 RE-TAKEN, 2026-08-11 (mission `direction-close`, T4/T5)
>
> The authorization above was given against two claims that were **false when
> made or false by the time they were quoted**, and both are now replaced by
> measurement. The deferral itself still stands — but for different, smaller,
> and actually-stated reasons.
>
> **M9 — "~33 unported USymbol shapes" was wrong; nothing is unported.**
> `src/core/decoration/symbol/` holds 30 `USymbol*` classes and a 38-entry
> registry against upstream's 37 `record(...)` calls, and the description
> engine already draws through them. More: SI14 T4 already built the
> class-engine **render-side bridge** to `EntityImageDescription.drawU`
> (`class/renderer-usymbol-entity.ts`), and class **sizing** already routes
> descriptive leaves to the same place
> (`class-layout-generic-classifier.ts#tryMeasureDescriptionLeaf`). The bridge
> is symbol-agnostic apart from ONE expression (`symbolKeyword`) and its
> dispatch guard.
>
> Measured by spike (applied, measured, reverted): widening those two
> expressions takes `gapisu-00-celo011`'s NON-NUMERIC diffs **31 → 21** — the
> DOM moves structurally closer — while total diffs rise 168 → 297, the
> familiar count-inversion when a `childCount` barrier lifts and the
> comparator can finally descend. So the direction is right and the remaining
> work is **per-symbol conformance across ~37 symbols on two 165+-diff
> fixtures**, plus a runtime keyword guard (`ClassifierGeo.usymbol` is
> `string`; the bridge wants the `USymbol` union). That is more than one
> iteration, so it stays deferred — as a conformance drill, NOT a port.
>
> **M13 — "no `EmbeddedDiagram` equivalent anywhere in `src/`" was wrong; the
> plumbing is complete and invoked.** `src/core/EmbeddedDiagram.ts` exists with
> `EMBEDDED_START`/`END`, `getEmbeddedType` and `createAndSkip`, and it is
> CALLED — `klimt/creole/legacy/CreoleParser.ts:341` and
> `cucadiagram/MethodsOrFieldsArea.ts:139`.
>
> What is missing is one thing, precisely: **no producer of a
> `NestedDiagramRenderer` exists anywhere in `src/`.** Every reference is a
> type declaration or a pass-through, and `MethodsOrFieldsArea.ts:133-138`
> throws an explicit "deferred per SI1/ADR-2" when it meets an embedded block
> without one. The remaining work is implementing recursive nested-diagram
> render-and-measure and wiring it at the engine entry points — genuinely large
> and genuinely separable, which is what D7 is for.
>
> **Net:** both deferrals survive, on evidence this time. M9 is a bounded
> conformance drill over an existing seam; M13 is one missing implementation
> behind finished plumbing.

---

## D4 — The harness gets a freshness guard

**Context.** `svg-conformance-census.ts object` reported 0/80 for an unknown
period and nothing failed. A gate that cannot detect its own stale input is
not a gate.

**Decision.** Add an assertion that re-renders one sentinel fixture through
`oracle/dist/plantuml-oracle.jar` and fails loudly, naming the slug, when the
cached oracle diverges from it.

**Consequences.** One jar invocation per census run. The guard must be
verified by temporarily reverting a cached file to the pre-0.2.0 form and
observing the failure — asserting it works on faith repeats the original bug.

---

## D5 — `plans/object-close/ledger.md` is the authoritative attribution

**Context.** G3 is a closed mission whose README carries a now-falsified
residue table.

**Decision.** This mission's ledger is authoritative. G3's README gets a
superseded banner pointing here; its content and history are left intact.

**Consequences.** Closed missions remain historical record. Anyone reading
G3's table is routed forward rather than misled. G3's *mechanism writeups*
(`plans/g3-object-svg/ledger.md`) remain valid precedent — it is the residue
attribution, not the ported mechanisms, that failed.

---

## D6 — Genuine engine findings are filed, not chased

**Context.** Standing CLAUDE.md rule: verified `@knowvah/dot-engine` findings
get a self-contained `.md` in `docs/graphviz-issues/` plus a `TRACKER.md`
line, filed **before the iteration closes** — living only in a mission ledger
is not filed.

**Decision.** Any confirmed engine divergence is filed that way; the fixture
then stays non-conformant under a named `gvts-blocked` entry, which satisfies
D1.

**Consequences.** The mission can close with engine-blocked fixtures without
weakening the exit bar — but only for fixtures where the block was measured
and filed, never assumed.
