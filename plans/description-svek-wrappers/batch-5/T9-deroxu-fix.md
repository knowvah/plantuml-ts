# T9 — deroxu fix (conditional on T8)

Prepend [../task-preamble.md](../task-preamble.md). Include T8's diagnosis artifact verbatim in the prompt.

## Task
Fix the mechanism T8 named, at its origin. Nothing broader: a fix that adjusts several symptom sites
means the root has not been found (`~/.claude/rules/diagnosis.md`, "Scope of change").

## Write-set
- the `src/diagrams/description/` file(s) T8's Origin names
- one test file mirroring that source path under `tests/unit/description/`

Anything else is stop 1.

## Acceptance
- Given deroxu, then `layoutParity` is `equal`, or `firstDiff` has moved past `nodeSizes` with the
  next residual named.
- Given a unit test pinning the corrected node size against the jar's TABLE WIDTH/HEIGHT (cited
  `file:line` + the jar DOT line), then it passes.
- Given the layout-parity and description ratchets, then both stay green.
- Given the targeted re-survey of description-family trees, then conformant losses = 0.

**Observability:** N/A. **Rollback:** Reversible.
