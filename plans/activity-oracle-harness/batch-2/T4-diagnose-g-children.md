# T4 — Diagnose the two extra `g` children

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. Every activity fixture reports
`svg/g[1][childCount]` as a diff: **ours has 2 MORE children than the jar's**
(measured: 7 vs 5 on `numalo-91-pole243`, 64 vs 62 on `darote-51-kuta407` —
the delta is exactly 2 in both).

You are in **diagnosis mode** (`~/.claude/rules/diagnosis.md`). The task is
to find the root cause, not to make the symptom go away. **You write no
`src/`.** Your output is a mechanism, and it licenses what T5 may delete.

## Task
Produce the diagnosis artifact for **both** extra children:

- **Mechanism** — the specific cause, one or two sentences
- **Origin** — the `file:line` where it originates
- **Causal chain** — why the observed diff follows from that cause
- **Ruled out** — what you eliminated, and the evidence that eliminated it.
  An empty "ruled out" on a non-trivial defect means you guessed.

### Candidate 1 — the background rect (strong prior, still must be proven)
`renderActivity` pushes a full-canvas `rect` as `children[0]`
(`src/diagrams/activity/renderer.ts:199-205`). The state renderer's own
comment (`src/diagrams/state/renderer.ts:301-307`) records that the jar draws
**no** explicit background rect and communicates background through the
shell's root `style="...background:...;"` attribute instead — and that
state's pre-S1 manual rect was removed for exactly this reason.

Do not treat that as settled for activity. **Prove it against the jar's own
output**: examine cached `in.svg` files under
`test-results/dot-cache/activity/` and establish whether the jar's `defs`
element is immediately followed by the content, with no background rect. Then
confirm the shell actually carries the background for activity's code path.

### Candidate 2 — UNIDENTIFIED
The second extra child is not known. Find it. Instrument — dump both child
lists for several fixtures of different shapes (a bare `start/stop`, one with
a swimlane, one with a `repeat`) and compare element-by-element. Do not
hypothesize before you have the actual lists.

**Read the Java.** Whatever you find, check what upstream does at the
corresponding point — `net/sourceforge/plantuml/activitydiagram3/` and the
klimt SVG driver (`klimt/drawing/svg/SvgGraphicsCore.java`, `getRootNode` /
`getG`). Grep `src/main/java/net/`, never just `net/sourceforge/plantuml/`.
A mechanism you cannot quote is not a mechanism.

## STOP CONDITION — read before concluding
If **either** extra child proves **layout-bearing rather than chrome** — that
is, removing it would change geometry, ink extent, or anything a reader would
see beyond the root wrapper — **HALT and report**. Do not license its
deletion, and do not propose a workaround. Log the finding in the decision
journal and stop.

"It looks unused" is not "it is unused." "Removing it makes the diff go away"
is not a mechanism.

## Write-set
- `.agent-notes/aoh-T4-g-children.md`
- `plans/activity-oracle-harness/decision-journal.md` (append)

**Nothing under `src/`.** Nothing under `tests/`. If you believe a source
change is required to complete the diagnosis, that is stop condition 1.

## Read-set
- `plans/activity-oracle-harness/decisions.md` — D6, D7
- `~/.claude/rules/diagnosis.md` — the artifact you must produce
- `src/diagrams/activity/renderer.ts:196-227`
- `src/diagrams/state/renderer.ts:295-320` — the background-rect precedent
- `src/core/klimt/document-shell.ts` — what the shell supplies
- `src/core/svg.ts` — `svgRoot`, `ROOT_GROUP_OPEN`
- `test-results/dot-cache/activity/*/in.svg` — the jar's actual output
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphicsCore.java`

## Architecture decisions
[D7] diagnose, never guess · [D6] the shell move is T5's; you decide only
what it is allowed to remove.

## Interface contracts
Consumed by T5:
```json
[{ "child": "", "originFileLine": "", "isChrome": true,
   "mechanism": "", "ruledOut": [""] }]
```
`isChrome: false` on either entry means **T5 does not run as specified** —
the mission halts for review.

## Acceptance criteria
- Given ours=7 vs jar=5, then **both** extras are named with a `file:line`.
- Given the background rect candidate, then whether the shell's root `style`
  carries the background for activity is **proven against cached jar output**,
  not assumed from the state precedent.
- Given the second extra, then it is identified by instrumenting actual child
  lists across at least three structurally different fixtures.
- Given each conclusion, then the "ruled out" list is non-empty and cites
  evidence.
- Given either extra proving layout-bearing, then the task HALTS and reports
  — no deletion is licensed.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** This task changes no behavior; it produces an artifact.

## Quality bar
All four gates green (they should be untouched). The diagnosis artifact is
the deliverable — it is complete only when a reader could apply the fix from
your description without re-deriving it.

## Commit
`docs(aoh-T4): diagnose the two extra activity root-group children`
