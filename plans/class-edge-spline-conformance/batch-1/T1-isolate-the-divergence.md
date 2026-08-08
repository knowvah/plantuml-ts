# T1 — Locate where our spline first departs from the jar's

**Agent:** debugger · **Depends on:** — · **Commit:** `docs(T1): <mechanism>`

## Context

`oracle/goldens/svg-class/bipudo-23-xavu432` renders four classes joined by
four inheritance edges. One edge's spline differs from the jar's by 0.0097
in its first control point — enough, after 3-decimal emission rounding, to
exceed the harness's 0.01 tolerance. The fixture is currently un-pinned
from the class ratchet; re-pinning it is the mission's exit condition.

Read `plans/class-edge-spline-conformance/README.md` first — it carries the
full measurement and everything already ruled out. **Do not re-derive
those.**

## The task

Find the **first stage** at which our spline is no longer the jar's value.
That single fact decides the rest of the mission, and nothing should be
proposed before it is known.

Instrument these three stages for this fixture's failing edge and record
the control points at each:

1. **Raw from the layout engine.** Our DOT input is byte-identical to the
   jar's (`parity-class.json` → `dotEqual: true`), so feed that same DOT
   through `@knowvah/dot-engine` and read the spline back before any of
   this port's code touches it.
2. **After spline clipping** — `src/core/klimt/geom/spline-clip.ts`,
   `simulateCompound`.
3. **As assembled for emission** — `src/diagrams/class/class-edge-geo.ts`,
   then `splinePathD` in `src/core/svg-path-builder.ts`. (The latter only
   formats; it cannot move a value by 0.0097, so treat it as a read-only
   confirmation, not a suspect.)

The jar's own value for comparison is in the committed golden:
`C75.1843,87.0515`. The jar's DOT for this fixture can be dumped with
`-DPLANTUML_DUMP_DOT=<dir>`.

## Specific hypothesis worth testing early

`simulateCompound` finds the boundary crossing with **8 fixed midpoint
subdivisions** — 1/256 granularity. CLAUDE.md records that this oddity is
*load-bearing*: the jar computes that same 1/256-granular point, so a more
precise crossing **fails** the ±0.01 bar rather than passing it. A
divergence of ~0.0097 is close enough to that granularity to be worth
ruling in or out first.

Compare, against upstream `DotPath#simulateCompound`: the subdivision
count, the starting interval, the midpoint rule, and which side of the
straddling interval is discarded.

## Deliverable

A `rules/diagnosis.md` artifact, written to `.agent-notes/`:

- **Mechanism** — the specific cause, one or two sentences.
- **Origin** — `file:line`.
- **Causal chain** — why 0.0097 follows from that cause.
- **Ruled out** — what you eliminated and the evidence that did it. An
  empty "ruled out" on this defect means it was guessed, not isolated.

Plus the stage-by-stage control-point table, which is the evidence.

**If the origin is `@knowvah/dot-engine`**, the deliverable additionally
includes a `docs/graphviz-issues/` entry and its `TRACKER.md` line, per
CLAUDE.md — a library finding that exists only in a mission ledger is not
filed.

## Acceptance criteria

1. The stage where our value first differs from the jar's is named, with
   the numbers at each stage.
2. The mechanism is stated, not a symptom.
3. `simulateCompound`'s subdivision granularity is explicitly ruled in or
   out, with evidence.
4. No source change is proposed in this task.

## Quality bar

This task changes no `src/` file, so all four gates stay green as they are
and `npx tsx scripts/rebaseline-svg-goldens.ts` stays `CHANGED=0` (~10s).
Never pipe a gate.

"This is hard" and "good enough" are not stop conditions
(`~/.claude/rules/diagnosis.md`). If the cause is not yet certain, that is
a valid in-progress state: report what is ruled out and what you will
instrument next.

## Boundaries

- **Never:** loosen `tests/oracle/svg-conformance/compare.ts`'s tolerance;
  edit the golden; add an `oracle/accepted-divergences.json` entry; re-pin
  the fixture before the gap is actually closed.
- **Never:** run any `git` command — the orchestrator handles git.
