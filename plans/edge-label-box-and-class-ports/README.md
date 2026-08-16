# Mission: edge-label-box-and-class-ports

> ## CLOSED 2026-08-15 — 3 of 5 exit-bar clauses met, 2 unmet and named
>
> Clauses 3 (`sokevu` rank-chain + `constraint=false`) and 4 (`tobuka` port
> labels, 41 → 0) are MET; clause 5 (every miss named) is MET. Clauses 1 and
> 2 are **unmet as written and left that way** — see [Outcome](#outcome-2026-08-15).
> D7 landed: the DOT gate now asserts edge-label BOX SIZE, which re-baselined
> every type's EQUAL count and produced four `label-size-backlog.json` files
> (51 pinned goldens) as the follow-on work queue.

**Close the four gaps left by the DOT-attribute audit and its predecessors.**
That audit (2026-08-13) shipped `sametail`, `constraint=false` and
`style=invis`, and left three findings each too large to fold into the change
that surfaced them. Issue 12 — per-end port-label placement — joins them as
batch 4: same family, and the last open item with no owner.

The first three are the same species: our DOT disagrees with the jar's in a way
no gate could see. Batch 4 is the mirror of that — the DOT is right, and what
we *draw* from it is wrong.

**Authorization.** Follow-on to the audit merged `14a6fd9b` / `d566a4ae`.
Register as a `planning/mission-index.md` row — no row exists yet; the
close-out task creates it.

## Objective and exit bar

1. `class/class-inheritance-interface-assoc` is **pinned in
   `oracle/goldens/svg-class/ratchet.json`** — it is eligible today
   (`dotEqual: true`) and blocked only by geometry.
2. `usecase/jecici-56-bimu826`'s `diff-baseline.json` entry is **at or below
   133** — the number the structural half of `constraint=false` already
   reached before `norank` was wired. It sits at 151 today.
3. `class/sokevu-87-toce485` emits its port rank-chain and its
   `constraint=false`, with no change to
   `core/graph-layout-build-constraint.ts`.
4. `object/tobuka-93-jale775`'s **14 port-label y diffs go to zero**, via a
   rule whose every term traces to a Java line — not by hard-coding the two
   measured constants.
5. Every remaining miss on these fixtures carries a named mechanism.

**Do not redefine the bar to make it look met.** If a number cannot be
reached, say which one and why, with the measurement.

> **Scored 2026-08-15:** 1 ✗ (13 residual, predicted by batch 2's own
> watch-out; ratchet pins zero-diff only) · 2 ✗ (138; label boxes byte-exact,
> residue is elsewhere and unidentified) · 3 ✓ · 4 ✓ · 5 ✓.

## Why one mission, and why this order

Batches 1 and 2 are the same seam — *what dimensions an edge label reserves,
and how we tell the engine* — with a **proven dependency**. Wiring batch 2
alone was measured during the `constraint` work: handing the engine
`labelWidth`/`labelHeight` as the box took
`class-inheritance-interface-assoc` from **202 diffs to 13** and simultaneously
regressed `jecici` from **143 to 159**. `jecici` is a multi-line, creole-bearing
label. That regression *is* batch 1: the box was right in shape and wrong in
value, because the measurement feeding it is wrong.

Batches 3 and 4 are independent — different subsystems, no shared write-set
with 1–2 or with each other. They are last only because they are separable;
either could be lifted into its own mission.

Batch 4 has one ordering note rather than a dependency: batch 2 pins
`class-inheritance-interface-assoc`, today the only golden covering a
multiplicity-bearing edge, which makes it the guard for batch 4's change. If
both are in play, land batch 2 first.

## The finding that makes batch 1 small

`state-transition-label.ts#computeReservedLabelBox` **already implements the
correct box**: `splitCreoleLines`, max-width-over-lines,
`lines.length * font.size`, `+ 2 * marginLabel`, `Math.floor`. Only the state
engine uses it.

Fed the jar's own inputs it reproduces the oracle exactly:

| label | font | reserved | oracle |
|---|---|---|---|
| 2-line, creole stripped | 10 | **72 x 22** | 72 x 22 |
| 1-line, creole stripped | 10 | **67 x 12** | 67 x 12 |

So batch 1 is *not* "wire link labels into the creole stack". It is: reuse the
existing helper, add the one thing it lacks (creole-markup stripping), and port
the `arrowFontSize` skinparam. Check `.claude/catalog.md` before writing
anything — this mission exists partly because the correct code was already
there and unused.

## Scope, measured

| population | count |
|---|---|
| description fixtures with a multi-line link label | 6 of 358 |
| description fixtures with creole markup in a link label | 6 |
| fixtures anywhere setting `skinparam arrowFontSize` | 3 |
| class fixtures with `port` declarations (batch 3) | 1 (`sokevu-87-toce485`) |
| diffs on the port-label fixture (batch 4) | 41 on `tobuka-93-jale775` — 14 y, 14 x |

Small populations, but the label measurement also feeds
`computeGraphSpacing` via `computeLinkDzeta`, so `ranksep`/`nodesep` move on
those fixtures too. Expect census movement and measure it per fixture.

## Batches

- [x] **batch-1** — correct the edge-label measurement (items 2)
- [x] **batch-2** — hand the engine a FIXEDSIZE box, not plain text (item 4) — T7 closed as unmeetable-as-written, see Outcome
- [x] **batch-3** — model class-side `port` declarations (item 3) — T8/T9 landed by SI17, pinned here; T10 close-out 2026-08-15
- [x] **batch-4** — per-end port-label placement (issue 12) — `b24f6038`

## Branch

`feat/edge-label-box` off `main`. Merge back with a **merge commit, not
squash** — per-task commit IDs get cited in the journal.

## Quality Gates

Run all four between every batch. Never pipe a gate: `npm test | tail` returns
`tail`'s exit code and masks failures.

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx tsx scripts/svg-conformance-census.ts class object --per-fixture
  pass: no fixture's diff count RISES vs the pre-batch run
  on_fail: stop
```

Capture the census **before** touching anything; a per-fixture diff against
that baseline is the only way to tell a fix from a trade.

## Stop conditions

- A fixture's diff count rises and the cause is not identified. Raising a
  baseline is allowed only with the mechanism recorded, as
  `diff-baseline.json`'s `jecici` entry already demonstrates.
- Any change would require editing `hooks/complexity-ignore` — that file is for
  faithful ports, not for code we own.
- The `arrowFontSize` port would require restructuring `skinparam.ts`'s bucket
  model rather than adding to it.
- **Batch 4's T11 cannot produce a mechanism for the tail-end ≈15.2.** Do not
  ship `+18.244`/`+3.022` as constants to turn 14 diffs green — the issue file
  is explicit that they are evidence, not a formula.

## Push-forward conditions

- A gate fails on a pre-existing violation in a file you are touching and the
  fix is under 3 lines.
- The census moves a fixture DOWN. Record it and continue.

## Outcome (2026-08-15)

Closed on branch `feat/edge-label-box-closeout` (merge commit to `main`).
The mission had dangled since 2026-08-14, when its journal's tail spun off
`composite-state-dot`; on resumption every batch was checked against the tree
before a checkbox moved.

| Signal | Before | After |
|---|---|---|
| `tobuka-93-jale775` (clause 4) | 41 diffs | **0** (`b24f6038`) |
| `class-inheritance-interface-assoc` (clause 1) | 202 | **13** — bar said 0 |
| `jecici-56-bimu826` baseline (clause 2) | 151 | **138** — bar said ≤133 |
| `sokevu-87-toce485` (clause 3) | ungated | **pinned**, `structurallyEqual`, size delta 0.0000 |
| DOT gate label check | presence (`hasLabel`) | **presence + `WIDTHxHEIGHT`** (`labelSizeOk`) |
| Corpus EQUAL — component / usecase / class / object / state | 263 / 93 / 710 / 78 / 268 | **257 / 88 / 680 / 76 / 259** — every drop is `labelSizeOk` |
| Tests | 14,291 | 14,307; coverage 95.3 / 90.3 / 96.9 |

**What was actually delivered by this mission vs. by others.** Batch 1 (label
measurement) and batch 2's T5/T6 (FIXEDSIZE box to the engine) are this
mission's. Batch 4's T12 (`manageCollision` port) is this mission's. Batch 3's
mechanism (`isPort` on class-side ports, the rank-chain) was landed by **SI17**
under its own brief; this mission only pinned the fixture. Saying so matters:
a mechanism claimed here would have no journal entry behind it.

**Two clauses unmet, on purpose.** Clause 1 contradicted batch 2's own
watch-out (~13 residual predicted, 13 measured); the 13 are 8 `polygon/@points`,
3 `text/@x`, 2 `text/@y`, named in
`.agent-notes/class-realization-edge-rank-gap.md`. Clause 2's target of 133 was
measured with `norank` disabled and was never like-for-like; `jecici`'s label
boxes are now byte-exact (72×22, 67×12), so its residual 5 are **not** the label
box and are not identified. Neither number was moved to look met.

**D7 is the durable part.** `tests/oracle/svek-dot.ts#labelSizeOk` compares
every edge label's reserved box; a +1px perturbation fails 228 pinned fixtures,
so it discriminates. It surfaced 51 goldens (10 description, 29 class,
2 object, 10 state graphs) that were EQUAL with a wrong box — carried in
per-type `label-size-backlog.json` files with the direction-backlog contract
(must fail `labelSizeOk` and nothing else, shrink-only), and the contract lives
once in `tests/oracle/dot-parity-backlogs.ts`. The shapes are triaged in the
journal (multi-line-as-one-line, `<<stereotype>>` head boxes, a `T19x13` tail
in one family, the state note-on-link merged box); none is diagnosed here.

**Follow-on, unowned:** the 51-entry label-size backlog is a ready work queue —
read `SvekEdge.java:440-507` per shape, do not fit. `temuxi-28-cega322`'s
1px stays unattributed (journal, 08-14). Cluster TITLE tables are still
presence-only in the gate.
