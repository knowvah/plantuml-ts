# Batch 4 — clean up, and diagnose what remains

Two tasks, disjoint write-sets, both depend on T4 being green.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T5 | remove the now-dead atom pre-resolution | typescript-pro | `src/diagrams/class/class-layout-leaf-shapes.ts`, `src/diagrams/class/class-geo-types.ts` | T4 | [ ] |
| T6 | diagnose the ellipse `ry` delta — **diagnosis only** | debugger | `.agent-notes/si14-ry-delta.md` | T4 | [ ] |

## Why T6 runs last

The `ry` delta is measured on `class-usecase-inline-sprite`, whose diffs T4
changes. Running T6 first would diagnose a conflated symptom. After T4, whatever
`ry` delta remains is isolated to the fit itself.

## T6 is not allowed to fix anything

Per `~/.claude/rules/diagnosis.md`, its deliverable is a **mechanism**: cause,
`file:line`, causal chain, and what was ruled out with the evidence that ruled
it out. An empty "ruled out" on a defect this specific means the cause was
guessed. The fix is a later, separately-scoped decision.
