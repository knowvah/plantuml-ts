# Batch 2 — Opale resolution moves to draw time

**The load-bearing batch.** It removes the reason the two arrays exist.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Resolve the Opale connector at DRAW time, as `EntityImageNote#drawU` does | typescript-pro | `class/note-layout*.ts`, `class/renderer-note.ts` | B1 | [x] |

## Why this is the risky one

`mapNoteGeos` currently consumes classifier POSITIONS and ROW TEXT to
resolve a member-tip's `::member` target and the Opale notch direction.
Moving that to draw time means the renderer needs the same inputs at the
same fidelity. Upstream does exactly this (`EntityImageNote#drawU`'s
`opaleLine` branch, and `EntityImageTips` takes `bibliotekon` for the same
reason) — so the inputs are reachable in principle; the question is whether
this port's draw stage has them without re-plumbing.

If it does not, that is the mission's answer: record which input is missing
and why, and STOP. Batch 3 is unreachable without this.

## Batch exit bar

1. No note geometry consumes classifier positions during LAYOUT.
2. Byte-identical output — `shape-match-report` at 776 / 25695 exactly, all
   pins hold, no test expectation moved.
3. The member-tip (`::member`) family specifically re-verified: it is the
   case that most depends on row text, so a green suite alone is not
   evidence here. Name the fixtures checked.
