# Batch 1 — investigate. No source changes.

Eight hypotheses are already dead (`../evidence.md` §5). This batch answers
the one that is left, and ends at a hard human checkpoint.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Java excavation: where jar's extra 1.000 comes from | debugger | `.agent-notes/transition-label-ink.md` | — | [ ] |
| T2 | Port-side trace: which line changes, what else reads it | debugger | `.agent-notes/transition-label-ink-port.md` | — | [ ] |

Parallel — disjoint write-sets, neither consumes the other.

## Batch exit bar

1. T1 states the (B) mechanism with an upstream `file:line`, **or** argues
   specifically that the `ink = 392.335 − 35` premise is wrong. Either
   closes the batch; a shrug does not.
2. T2 states the exact port line to change, every caller of the
   `labelInk: true` path, and the blast radius with the command that counted
   it.
3. `git status` shows only the two notes. **No `src/` edits.**
4. All four gates green; rendered output byte-identical.

## Then STOP

Do not start Batch 2. Report to the human:

- the mechanism (or the disproof)
- the exact lines Batch 2 will change
- **a proposed write-set, for approval**

The write-set is deliberately unspecified in this brief because the leading
remaining candidate sits in `SvekNode`/`GroupMakerState` — outside
`src/diagrams/state/`. Expanding it is the human's call, not an inference.

**This batch may end the mission.** "Not reproducible in our architecture
because X, with evidence" is a success. A fix that nets to zero is not.
