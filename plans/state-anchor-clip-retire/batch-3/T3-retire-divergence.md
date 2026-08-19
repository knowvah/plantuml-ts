# T3 — Delete the divergence, and file what the pass exposed

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire`. Docs only — you change no `src/`, no tests, no
baselines. T2 has landed and the state engine now clips once.

## Task

### Step 1 — delete the divergence entry
Remove the `DIVERGENCES.md` section "State diagrams — Composite-anchor
transitions: `simulateCompound` clip applied to ink, not to the drawn path"
**in full**, including its heading. Do not soften it, do not rewrite it as
"partially resolved". If the section's parent `## State diagrams` heading is
left with no entries, remove that too rather than leaving an empty heading.

**Before deleting, verify the claim is actually false now** — that T2's report
shows the renderer and the ink walk reading the same clipped path. Deleting a
divergence that still exists is worse than never having recorded it.

### Step 2 — fix the stale pin
`docs/architecture/overview.md` states the dot-engine dependency as
`@knowvah/dot-engine@^1.5.0`. It has been `^1.6.0` since SI31's T1
(`c5cb7771`). Correct it, and check the surrounding paragraph for anything else
that went stale with it.

### Step 3 — file the two gaps the pass exposed
Porting `DotStringFactory.solve`'s edge loop brackets two sibling passes this
port does not have. **File both in `planning/next-missions.md`, do not fix
them** — each with `file:line` and an honest statement of what is and is not
known:

1. **`alignEdgesAtLabelNodes` is unported anywhere.**
   `svek/DotStringFactory.java:461-463` runs it between the clip loop and
   `manageCollision`, gated on `DotSplines.ORTHO`. It collects nodes whose
   entity name starts with `transition_` and aligns edges through them.
   Relevant because state's `linetype ortho`/`polyline` path is where SI31 left
   `pavuzo-79-zodu430` open — **but SI31 attributed that residual to a
   dot-engine canvas-reservation gap (`docs/graphviz-issues/17`), so do NOT
   assert these are the same mechanism.** Record it as an unported upstream
   pass on that path, and say plainly that the relationship is unexamined.
2. **`manageCollision` is ported for the class engine only.**
   `class-edge-label-anchor.ts:199`, from `SvekEdge.java:1205-1216`. State has
   no equivalent. Record it; do not assess whether state needs it.

## Write-set
- `DIVERGENCES.md`, `docs/architecture/overview.md`,
  `planning/next-missions.md`, `.agent-notes/si32-T3.md`

## Read-set
- `DIVERGENCES.md` — the "State diagrams" section, whole
- `.agent-notes/si32-T2.md` — T2's evidence that the divergence is gone
- `docs/architecture/overview.md` — the repo-relationship paragraph
- `~/git/plantuml/.../svek/DotStringFactory.java:441-467` — both sibling passes

## Acceptance
- Given `DIVERGENCES.md`, then the composite-anchor entry is absent entirely
  and no empty heading is left behind.
- Given `docs/architecture/overview.md`, then the pin reads `^1.6.0`.
- Given `planning/next-missions.md`, then both gaps appear with `file:line`,
  and the `alignEdgesAtLabelNodes` entry explicitly does NOT claim a link to
  `pavuzo-79`'s open row.
- Given T2's report contradicting Step 1's premise, then the entry is NOT
  deleted and the task stops.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: docs only, one commit.

## Quality bar
Four gates green (docs-only, so they should be). Every filed claim carries
`file:line`. Do not overstate: "unported" is a fact, "would fix X" is not.

## Report (<=350 tokens)
Confirmation the entry is gone and why that is now true; the overview.md fix;
the two filings as written.
