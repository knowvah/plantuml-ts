
## Addendum 2026-09-03 — `git add -A` ignores write-set discipline entirely

Concrete recurrence, mission `linetype-ortho-routing` T5. The orchestrator
wrote only `plans/` and `.agent-notes/`; the task agent wrote only
`src/diagrams/class/`. Disjoint write-sets, exactly as the brief required —
and it still went wrong, because the orchestrator staged with `git add -A`
while the agent was live. That is checkout-wide: it swept the agent's
half-finished `class-dot-graph.ts` and a throwaway scratch file into a
`docs(...)` commit.

**Nothing was lost and the tree was never wrong** — only the attribution,
which matters here because mission branches merge rather than squash
specifically to preserve per-task commit IDs the journal cites. Recovered
with `git reset --soft <parent>` and two clean re-commits; `git diff
<old-head> HEAD` came back empty, proving the tree survived.

Two lessons, the second the more general:

1. Disjoint write-sets do not make concurrent `git` safe in one checkout.
   The index is shared state that no write-set declaration governs.
2. **Never `git add -A` in a checkout an agent is working in**, and prefer
   not to commit at all while one is live. Stage explicit paths, and do
   bookkeeping commits between tasks. If concurrent commits are genuinely
   needed, that is what worktrees are for.

Worth noting the failure was caught by the *subagent*, from `git reflog` —
it saw HEAD advance to a commit it had not made, declined to amend another
process's commit, and committed only its own remaining work. The
orchestrator had no signal at all. Detection ran upward here, not down.
