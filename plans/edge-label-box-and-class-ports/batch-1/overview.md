# Batch 1 — correct the edge-label measurement

Batch 2 depends on this and must not start before it lands. Handing the engine
a box computed from today's measurement is measured to make things worse
(`jecici` 143 → 159), which is exactly why this batch is first.

## Target

`computeReservedLabelBox`, fed clean input at the right font size, already
reproduces the oracle exactly on both corpus shapes:

| label | reserved | oracle |
|---|---|---|
| `Purchase Price` + `Payment of $100`, size 10 | 72 x 22 | **72 x 22** |
| `Sale of Widget 1`, size 10 | 67 x 12 | **67 x 12** |

Every number in this batch is checked against the oracle DOT, not against a
previous run of our own code.

## Tasks

| id | task | write-set |
|---|---|---|
| [x] T1 | Relocate `computeReservedLabelBox` + `splitCreoleLines` to `src/core/` | `src/core/edge-label-box.ts` (new), `src/diagrams/state/state-transition-label.ts`, `state-sizing.ts` |
| [x] T2 | Add `stripCreoleMarkup` and apply it inside the box computation | `src/core/edge-label-box.ts`, its test |
| [x] T3 | Port `skinparam arrowFontSize` | `src/core/skinparam.ts`, `src/core/theme.ts` |
| [x] T4 | Route description link labels through the shared box | `src/diagrams/description/link-edge-attrs.ts` |

T1 is a pure move — state's output must be **byte-identical** after it, proven
by the state DOT-parity suite, before T2 changes any behaviour.

T2 and T3 are independent of each other; T4 depends on all three.

## Watch-outs

- `splitCreoleLines` splits on `\n` **and** the literal two-character escape.
  Keep both.
- The same measurement feeds `computeLinkDzeta` → `computeGraphSpacing`, so
  `ranksep`/`nodesep` move too. That is correct, not a side effect — but it
  means the census will move on more than the 6 label fixtures. Measure it.
- `marginLabel` is 6 for a self-loop and 1 otherwise. Do not flatten it.
- Do not touch the class engine's `edgeLabelAttrs` in this batch — class comes
  in batch 2 once the shared helper is proven on description.
