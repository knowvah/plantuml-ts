# Batch 1 — three independent bisects

Parallel, one worktree each (D4). They may share a cause or may not —
assuming they do up front is the failure mode this structure avoids.
`tunelu-64-xica833` is a **class** fixture, a different engine from the two
state ones, so a shared cause is not the default expectation.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Bisect `state/lurage-50-kobo763` | debugger | `.agent-notes/bisect-doteq-lurage-50-kobo763.md` | T0 | [ ] |
| T2 | Bisect `state/xetase-70-zaza808` | debugger | `.agent-notes/bisect-doteq-xetase-70-zaza808.md` | T0 | [ ] |
| T3 | Bisect `class/tunelu-64-xica833` | debugger | `.agent-notes/bisect-doteq-tunelu-64-xica833.md` | T0 | [ ] |

No write-set overlap: three distinct notes, three distinct worktrees.

Each runs ~10 steps × (checkout + ~8s predicate) — 10–20 min, over the usual
5–15 min target. Kept whole deliberately: a half-finished bisect is not a
resumable unit.
