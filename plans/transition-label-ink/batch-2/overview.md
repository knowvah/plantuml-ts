# Batch 2 — land the fix

**APPROVED at the checkpoint, 2026-08-15.** Write-set: the three state
files below. Quantization: IN SCOPE, label position only.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Land the marged-box ink fold + the label-position quantization in ONE commit, with tests | orchestrator | `src/diagrams/state/state-geo-types.ts`, `state-transition-label.ts`, `layout-ink-extent.ts` + their tests | B1 + approval | [ ] |
| T4 | Sweep, ledger, close | orchestrator | brief + `.agent-notes/` | T3 | [ ] |

Serial. T4 writes no `src/`.

## One commit, deliberately

Both corrections act on the same number and the intermediate state is
worse than either endpoint, so a bisect landing between them would
mislead. This is the case "one commit per task" exists to permit.

Batch 1 restated the mechanism: there is no −1.525/+0.998 pair. Upstream
folds `TextBlockMarged`'s `UEmpty` — the marged BLOCK
(`measuredWidth + 2·marginLabel`, UNfloored) anchored at the reserved
box's own corner — so the fold to port is `LimitFinder#drawEmpty`
(`LimitFinder.java:159-162`), not `#drawText`. The second term is the
2-decimal read-seam quantization: jar reads the box corner out of
graphviz's SVG text (`SvekEdge.java:808-813`), which graphviz prints with
`snprintf(buf, 50, "%.02f", num)` (`~/git/graphviz/lib/gvc/gvdevice.c
:513-528`). Verified directly — real graphviz 15.1.1 on jar's own
`svek-1.dot` puts the `EvNewValueSaved` box corner at **235.61** where our
engine carries **235.61168**.

**D5 constrains where the quantization goes.** Quantizing `label.x`/
`label.y` themselves would perturb the document-level `labelInk: false`
point fold and the drawn SVG position, which D5 forbids. It is therefore
applied to the ink box only, leaving the draw anchor and the point fold
byte-identical. Consequence, documented rather than hidden: we draw the
label at the unquantized x where jar draws the quantized one — ≤0.005 px,
inside the 0.01 px conformance band.

## Batch exit bar

1. The three named fixtures report composite width delta **0.000** in
   `measure-composite-declared-size.ts`.
2. That harness's `exact` count RISES from **2454**; nothing regresses.
3. `shape-match-report.ts` does not fall from **776 / 25695**.
4. state DOT-parity **268/268**; all **59** svg-state pins hold.
5. The document-level `labelInk: false` fold is untouched and its fixtures
   are byte-identical (decision D5).
6. Every constant introduced carries an upstream `file:line` (D4).
