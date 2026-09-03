# Batch 2 — diagnosis (gates Batch 3)

One task, alone. **This batch exists so that the mechanism is stated before
anything is deleted.**

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Diagnose the two extra `g` children | **opus, high effort** | `.agent-notes/aoh-T4-g-children.md`, `plans/activity-oracle-harness/decision-journal.md` | T2 | [ ] |

**Why this is its own batch.** `~/.claude/rules/diagnosis.md` forbids
proposing a fix before the mechanism is identified. Folding the diagnosis
into T5 would put the analysis and the deletion in one agent's head with no
gate between them — and this is the one place in the mission where a wrong
call damages output while all four gates stay green.

**Why opus at high effort.** Two candidate mechanisms, a halt condition, and
a conclusion that licenses irreversible deletion downstream.

T4 writes **no `src/`**. Its output is an artifact, not a change.
