# Batch 0 — Reproduce the race (SERIAL · **PIVOT GATE**)

One task, and the whole mission turns on it. Every later task assumes the
concurrent-run mechanism is real; T0 is what makes that an established fact
rather than a plausible story.

**If T0 cannot reproduce the race, the mission STOPS here** (stop 1). That is a
legitimate and useful outcome: it kills the leading hypothesis and hands the
next attempt a narrowed field. What it must NOT do is soften the hypothesis
until something passes for confirmation.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Reproduce deterministically; produce the diagnosis artifact | debugger (sonnet) | `scripts_scratch/T0/**`, `.agent-notes/sre-T0.md` | — | [x] |
