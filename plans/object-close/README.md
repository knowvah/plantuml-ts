# Mission: object-close — close down object diagrams

**Authorization.** Maintainer, 2026-08-11: "plan out how to close down the
work on object diagrams" → scope calls + "approve all six" (decisions.md) →
"looks right, generate the brief".

## Objective

Bring object diagrams to the **D1 exit bar**: all 80 object fixtures either
SVG zero-diff against the pinned jar, or carried by a ledger entry naming a
mechanism and a `file:line`. Two prior missions closed on numbers that no
longer hold — A3 (DOT, 78/80 EQUAL) still holds, but **G3's SVG close is
built on a falsified residue table** and the census that would have caught it
has been reporting a stale-oracle artifact. This mission re-establishes an
honest baseline, re-audits every non-conformant fixture from measured
evidence, works the fixable ones, and closes with an attribution table that
survives re-measurement.

## The three findings that define this mission (measured 2026-08-11)

1. **The committed oracle cache is stale.** `test-results/dot-cache/object/`
   (tracked, 316 files) predates the 0.2.0 SVG-reduction port
   (`DIVERGENCES.md` → "SVG emission tracks upstream's reduced form"). The
   census therefore reports **0/80** — an artifact. The 24-test ratchet is
   green and is the trustworthy signal.
2. **The true baseline is 23/80**, measured against a freshly rendered
   pinned-jar oracle.
3. **G3's `gvts-blocked` attribution does not survive re-measurement.** G3
   filed 46/80 as sub-pixel graphviz noise. Measured max delta per
   non-conformant fixture: **0 fixtures under 0.5px**; 4 at 1.0px, 8 at
   2–10px, 26 at ≥10px (to 1196px), and 19 carrying at least one NON-numeric
   diff (colour, `@id`, `childCount`, text) — not geometry at all.

Load-bearing corollary: **all 8 DOT size-backlog slugs are SVG
non-conformant**, and they drive 4 of the 6 worst SVG offenders. Node sizing
is a shared upstream cause — see [decisions.md#d3](decisions.md).

## Branch

`feat/object-close` off `main`. Merge back with a **merge commit, not
squash** — per-task commit IDs are referenced throughout the journal and
ledger.

## Batches

| Batch | Description | Tasks | Status |
|---|---|---|---|
| [batch-0](batch-0/overview.md) | Clean tree + honest baseline + freshness guard | T0→T1→T2 (sequential) | [x] |
| [batch-1](batch-1/overview.md) | Re-audit all 57 non-conformant fixtures | T3‖T4a‖T4b‖T5a‖T5b → T6 | [x] |
| [batch-2](batch-2/overview.md) | Governed fix loop (B0…Bn) | loop — B0–B7, B10, B13, B20, B21, B22, B25, B31 landed; object census 23 → **34/80**, ratchet 22 → 33 | [ ] |
| [batch-3](batch-3/overview.md) | Close-out: divergences, index, filings | T7→T8→T9 | [ ] |

## Quality gates — all four, every task, before any commit

```sh
npm test         # vitest + 90/90/90 coverage
npm run typecheck
npm run lint
npm run build
```

**Never pipe a gate.** `npm test | tail` reports `tail`'s exit code and masks
vitest failures.

### Frozen counts — ANY movement, in EITHER direction, is a stop condition

| Gate | Frozen at | Command |
|---|---|---|
| object DOT structural | **73/80 EQUAL** (B31 re-baseline, was 74) (58 after B0's re-baseline, 78 under the old blind gate) | `npx tsx scripts/dot-sync-report.ts object` |
| component DOT | 262/262 | `npx tsx scripts/dot-sync-report.ts component` |
| usecase DOT | 93/93 | `npx tsx scripts/dot-sync-report.ts usecase` |
| class DOT | **661/711** (B31 re-baseline, was 689 under the orientation-blind gate) | `npx tsx scripts/dot-sync-report.ts class` |
| state DOT | **264/267** (B31 re-baseline, was 267) | `npx tsx scripts/dot-sync-report.ts state` |
| class SVG census | zero-diff set intact, non-dropping | `npx tsx scripts/svg-conformance-census.ts class` |
| description SVG census | 48-set intact | `npx tsx scripts/svg-conformance-census.ts component usecase` |
| object SVG census | non-dropping — **34/80** after B22 (was 23 at T1) | `npx tsx scripts/svg-conformance-census.ts object` |

**Object and class were re-baselined on 2026-08-11 by maintainer ruling** —
this is the one authorized movement of a frozen count in this mission. The DOT
comparison discarded edge endpoint ports, scoring 20 object and 22 class
fixtures EQUAL while they anchored every edge to the whole node where upstream
anchors to a specific member row. Making the gate port-aware surfaced them; it
did not cause them. Both sets are pinned in `oracle/goldens/{object,class}/
port-backlog.json`, which is not an exemption — the suites assert `portOk` is
those fixtures' ONLY failing check. The class fallout is tracked as SI17.
The component/usecase denominators were also stale in the original table
(93, not 90); they never moved.

An **unexplained gain** is as much a stop as a loss: it usually means a
normalizer went blind (see `plans/object-close/decisions.md#d4`, and the
known precedent that a DOM parse hides entity-form and colour-form bugs from
the gate).

## Write-set boundary

`src/diagrams/class/**` · `src/core/{svg*,skinparam*,theme*,preprocessor}.ts` ·
`src/diagrams/class/renderer-classifier-box.ts` · `tests/**` ·
`oracle/goldens/{svg-object,object}/**` · `test-results/dot-cache/object/**` ·
`scripts/svg-conformance-census.ts` · `docs/graphviz-issues/**` ·
`docs/graphviz-issues/TRACKER.md` · `DIVERGENCES.md` · `planning/mission-index.md` ·
`plans/g3-object-svg/README.md` (banner only) · this plan directory.

**Anything else: STOP.** In particular: no other type's `dot-cache`, no other
type's goldens.

## Stop conditions

1. Files outside the write-set boundary need changes.
2. Any frozen count in the table above moves — **up or down**.
3. Two consecutive gate failures on the same check.
4. A decision D1–D6 proves wrong in practice.
5. The same location is changed 3× consecutively without resolving the same
   failing check.
6. A fix would require changing behavior pinned by the **class** goldens
   (object rides the class engine; that contradicts G2's closed ledger).
7. A candidate fix has no upstream `file:line` citation — a fitted constant
   is never a fix, *especially* when it shrinks the error.
8. The 80-fixture denominator changes without a stated mechanism.
9. T1's re-capture produces an unexplained mass census swing (would indicate
   the jar itself moved, not just the cache).

## Push-forward conditions

- Iteration sizing and mechanism attack order within batch-2's queue.
- Splitting T5 if T1's real numbers show it is oversized (expected).
- Test naming, ratchet mechanics, golden capture per A3/G3 convention.
- Drafting ledger and `DIVERGENCES.md` entries (maintainer validates at
  close-out; drafting is in-mission).
- Faithful-port details verifiable against the Java.
- Reclassifying a fixture between audit clusters when evidence warrants.

## Standing rules

- **READ THE JAVA FIRST.** Open the method body and the constructor that
  built its inputs — before stating why something differs, acting on a
  measured number, repeating a mechanism from this brief or a subagent, or
  calling something out of scope. Grep `src/main/java/net/`, not just
  `net/sourceforge/plantuml/`.
- Render oracles with `scripts/oracle-render.sh <out-dir> <puml>`, never a
  hand-typed `java -jar` — it sets `-DPLANTUML_DETERMINISTIC_TEXT=true`, and
  without it every text-derived number measures the flag.
- Always `git -C <repo> …`, never bare `git` — a persisted `cd` has twice
  sent a commit into the Java reference repo.
- Agents: NEVER `git checkout/reset/stash/clean` in this repo. No agent
  commits; the orchestrator owns every commit.
- Diagnosis mode (`~/.claude/rules/diagnosis.md`) governs every observed
  discrepancy: state mechanism, origin `file:line`, causal chain, and what
  was ruled out — *before* any fix.

## Index

- [decisions.md](decisions.md) — D1–D6, approved 2026-08-11
- [ledger.md](ledger.md) — authoritative attribution (built by T6)
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) — engine + gate seams
- [diagrams/data-flow.md](diagrams/data-flow.md) — how a census number is produced
- Loop governance: [`plans/dot-oracle-sync/loop-protocol.md`](../dot-oracle-sync/loop-protocol.md),
  amended in [batch-2/overview.md](batch-2/overview.md)
- Precedent: [`plans/g3-object-svg/ledger.md`](../g3-object-svg/ledger.md) (mechanism
  writeups, still valid), [`plans/object-dot-sync/`](../object-dot-sync/) (A3)

Note: `plans/` is COMMITTED in this repo (established convention).
