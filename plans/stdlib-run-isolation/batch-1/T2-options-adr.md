# T2 — Options ADR, then stop

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-run-isolation`. **You write no `src/`** and **no implementation
of any kind** — stop 2. This task produces a decision document and then ends
the autonomous run.

Read `.agent-notes/sri-T0.md` (does the residual actually reproduce, and at
what rate?) and `.agent-notes/sri-T1.md` (how many consumers, how many
immovable?) before writing anything. Those two results are the evidence base;
if they contradict this brief's framing, follow them and say so.

## The decision you are framing — not making
A per-run isolated output directory was **explicitly declined by the user on
2026-08-21** for packaging blast radius (`plans/stdlib-build-race/decisions.md`
D3). You are re-opening that with measurements, because SI34's close-out
justified it against an under-count of the affected sites.

**You do not get to re-adopt it** (D4). You lay out the options honestly,
recommend one, and stop.

## Task
1. Write an ADR at `planning/adr/` (follow the existing numbering and the
   format in `~/.claude/rules/architecture.md`: Status · Context · Decision ·
   Consequences). Status is **Proposed**, never Accepted — the user accepts.
2. Cover at minimum these options, each with **measured** cost, not adjectives:
   - **A. Read seam.** Consumers resolve the tree through one helper,
     defaulting to the canonical path and overridable per run. The canonical
     tree, and everything the packages publish, stays byte-identical (D2).
     State exactly how many consumers convert, and which cannot (D3 — `npm
     pack` at minimum).
   - **B. Per-run isolated output directory.** The declined option. State
     precisely what would change in `main`/`types`/`exports`/`files`, or
     demonstrate that nothing need change. If it can be done without touching
     the published surface, that materially weakens the original objection and
     you must say so plainly.
   - **C. Accept permanently.** Document the residual and stop. If T0 could
     not reproduce, this is almost certainly correct — argue it properly
     rather than treating it as the null option.
   - **D. Anything better you find.** You are not limited to the above.
3. For each option state: exposure closed, consumers touched, published
   surface touched (yes/no), estimated `npm test` cost against the ~3 s of
   estimated `npm test` cost (reported, not treated as a budget), and how it
   could be reverted.
4. Recommend one, with the reasoning that decides it. A recommendation of
   **C** is entirely acceptable if the evidence supports it — do not
   manufacture work.
5. **STOP.** End your report with the explicit statement that the mission is
   halted pending the user's decision (stop 3). Do not create task files, do
   not write code, do not modify batch 2.

Read-only git only; no commits.

## Write-set
- `planning/adr/<NNN>-stdlib-run-isolation.md` (next free number)
- `.agent-notes/sri-T2.md`

## Read-set
- `.agent-notes/sri-T0.md`, `.agent-notes/sri-T1.md`
- `plans/stdlib-build-race/` — close-out, `decisions.md` D3, decision journal
- `plans/stdlib-run-isolation/decisions.md` — D2, D3, D4
- `~/.claude/rules/architecture.md` — ADR format, reversibility premium
- `planning/adr/` — existing ADRs, for numbering and house style

## Acceptance
- Given the ADR, then every option carries measured cost, not adjectives.
- Given option B, then its effect on the published surface is stated
  precisely — this is the crux of the original refusal.
- Given the recommendation, then the reasoning is explicit and a reader could
  disagree with it on the evidence.
- Given T0 returned `reproduced: false`, then the ADR leads with that and
  recommends C unless there is a strong stated reason not to.
- Given the end of the report, then the mission is explicitly halted for the
  user.

## Quality bar
Four gates green (docs-only). Report `npm test` duration with the load
reading; no hard ceiling. ADR ≤ 1 page of substance.

## Boundaries
- **Always:** measure; state option B's packaging impact precisely; stop at
  the end.
- **Never:** touch `src/`; implement anything; mark the ADR Accepted;
  re-adopt the declined option on your own authority; run git write commands.

## Report (<=350 tokens)
The options table, your recommendation and why, and the explicit halt.
