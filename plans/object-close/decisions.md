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
