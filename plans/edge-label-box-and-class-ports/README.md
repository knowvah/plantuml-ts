# Mission: edge-label-box-and-class-ports

**Close the three feature-sized gaps left by the DOT-attribute audit.** That
audit (2026-08-13) shipped `sametail`, `constraint=false` and `style=invis`,
and left three findings that were each too large to fold into the change that
surfaced them. All three are the same species: our DOT disagrees with the jar's
in a way no gate could see.

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
4. Every remaining miss on these fixtures carries a named mechanism.

**Do not redefine the bar to make it look met.** If a number cannot be
reached, say which one and why, with the measurement.

## Why one mission, and why this order

Batches 1 and 2 are the same seam — *what dimensions an edge label reserves,
and how we tell the engine* — with a **proven dependency**. Wiring batch 2
alone was measured during the `constraint` work: handing the engine
`labelWidth`/`labelHeight` as the box took
`class-inheritance-interface-assoc` from **202 diffs to 13** and simultaneously
regressed `jecici` from **143 to 159**. `jecici` is a multi-line, creole-bearing
label. That regression *is* batch 1: the box was right in shape and wrong in
value, because the measurement feeding it is wrong.

Batch 3 is independent — a different subsystem, no shared write-set. It is last
only because it is separable; it could be split into its own mission without
touching batches 1–2.

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

Small populations, but the label measurement also feeds
`computeGraphSpacing` via `computeLinkDzeta`, so `ranksep`/`nodesep` move on
those fixtures too. Expect census movement and measure it per fixture.

## Batches

- [ ] **batch-1** — correct the edge-label measurement (items 2)
- [ ] **batch-2** — hand the engine a FIXEDSIZE box, not plain text (item 4)
- [ ] **batch-3** — model class-side `port` declarations (item 3)

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

## Push-forward conditions

- A gate fails on a pre-existing violation in a file you are touching and the
  fix is under 3 lines.
- The census moves a fixture DOWN. Record it and continue.
