# Batch 2 — hand the engine a FIXEDSIZE box, not plain text

Depends on batch 1. Do not start until the shared box helper is landed and the
census has been re-measured.

## The gap

`graph-layout-build-edges.ts` sends class/description edges a plain-text
`label`, so `@knowvah/dot-engine` measures the *text* and reserves its own
height — a constant **16.5** for one line — where the jar declares the real
height. Only the state pipeline sends the
`<TABLE FIXEDSIZE="TRUE" WIDTH=".." HEIGHT="..">` form, gated on
`labelBoxWidth`/`labelBoxHeight` being present.

A labelled edge spans the rank gap, so the error lands as rank separation:

| | rank gap |
|---|---|
| jar / real graphviz (`ranksep + labelHeight`) | 75.00 |
| this port (`ranksep + 16.5`) | 76.50 |

Every node below that rank sits **+1.5**, accounting for 148 of
`class-inheritance-interface-assoc`'s 202 diffs. The error is
`16.5 - labelHeight`, so it grows with the label — 1.5 is arithmetic on this
fixture, not a constant.

The engine is not at fault: given the table form it reproduces real graphviz
exactly at every height tested (box heights 15/20/30/60 → gaps 75/80/90/120,
identical to `dot`).

## Tasks

| id | task | write-set |
|---|---|---|
| [x] T5 | Populate `labelBoxWidth`/`labelBoxHeight` for description edges | `src/diagrams/description/link-edge-attrs.ts` |
| [x] T6 | Same for class edges | `src/diagrams/class/class-layout-helpers.ts`, `class-dot-edges.ts` |
| [x] T7 | ~~Pin `class-inheritance-interface-assoc` in the class ratchet~~ — **closed as unmeetable-as-written, 2026-08-15**: the fixture reached its predicted ~13 residual (202 -> 13) and `ratchet.json` pins zero-diff fixtures only; the residue is named (`.agent-notes/class-realization-edge-rank-gap.md`). See the journal. | `oracle/goldens/svg-class/ratchet.json` |

T7 is the exit bar's first clause. It is eligible today — `dotEqual: true` in
`parity-class.json` — and blocked only by the geometry T5/T6 fix.

## Watch-outs

- **Do not** reuse raw `labelWidth`/`labelHeight` as the box. Measured and
  rejected: it takes `class-inheritance-interface-assoc` 202 → 13 and
  regresses `jecici` 143 → 159. The box must come from batch 1's helper (D4).
- The jar TRUNCATES both dimensions toward zero (`(int)` cast,
  `SvekEdge.java:504-507`). Batch 1's helper already floors; do not round.
- `class-inheritance-interface-assoc`'s remaining diffs after this are
  expected to be ~13, not 0. The residue includes a ~58.8 horizontal placement
  difference for one entity, recorded in
  `.agent-notes/class-realization-edge-rank-gap.md`. That is a separate gap —
  name it, do not chase it here.
- Check whether `jecici`'s `diff-baseline.json` entry can now be LOWERED to
  133 or below. Lowering a baseline is always allowed; raising needs a
  mechanism.
