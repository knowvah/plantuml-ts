# T3 — M3 diagnosis: tail/head swap

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification.

This is a **diagnosis task under `~/.claude/rules/diagnosis.md`**. The success
condition is *find the root cause*, not *make the symptom go away*. You will
write **no source code**. Read that rule file before starting.

### The observed discrepancy

`givoli-70-rade072` (class), first edge of roughly a hundred:

| | oracle | ours |
|---|---|---|
| `taillabel` | `19x13` | `7x13` |
| `headlabel` | `7x13` | `19x13` |

Every other edge in the fixture matches byte-for-byte. The two values are
**exchanged**, not mismeasured — so this is an assignment or direction defect,
not the measurement defect the rest of this mission addresses. It shares a
gate (`labelSizeOk`) with the others by coincidence.

Same family, same shape: `nadepi-13-mufu566`, `tekena-28-fobe713`,
`tiguma-69-tovu135`.

## Task

Establish the mechanism. Produce the diagnosis artifact:

- **Mechanism** — the specific cause, one or two sentences
- **Origin** — the `file:line` where it originates
- **Causal chain** — why the swap follows from that cause
- **Ruled out** — what you eliminated, and the evidence that eliminated it.
  An empty "ruled out" on a defect like this means you guessed.

Instrument before hypothesizing. Confirm against captured values, not
reasoning. If you cannot reach certainty, that is a valid in-progress state:
record what is ruled out and what you would instrument next. **Do not offer a
candidate fix before the mechanism is stated.**

### The specific question to answer first

Does the swap originate in **tail/head assignment** (`quantifier1` vs
`quantifier2` reaching the wrong end — e.g. a link whose direction was
reversed for layout without its quantifiers following), or in **edge emission
order** (which edge is emitted, in which direction, before DOT ever sees it)?

**This determines whether the mission may fix it — see Boundaries.**

## Write-set

- `.agent-notes/m3-tail-head-swap.md` — this file only

**No source edits. No test edits. No journal edits.** Another agent is working
in `src/` in this batch.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:328-340`
  — `startTailText` from `getQuantifier1()`, `endHeadText` from
  `getQuantifier2()`; the constructor that decides which end is which
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:447-467`
  — emission
- `src/diagrams/class/class-edge-geo.ts` — **suspected** origin, unconfirmed
- `src/diagrams/class/class-dot-graph.ts` — edge emission order
- `src/diagrams/class/class-relationship-parser.ts` — where multiplicities are
  attached to an end at parse time
- `plans/leaf-draw-order/decision-journal.md` — the edge-order follow-on
  already traced `CucaDiagramFileMakerSvek#getOrderedLinks` and
  `Link#sameConnections`; read it before concluding anything about ordering

Drill down with:
`npx jiti scripts/dot-sync-report.ts --slug givoli-70-rade072 class`

## Acceptance criteria

- **Given** the four fixtures, **when** diagnosis completes, **then** the note
  states mechanism, origin `file:line`, causal chain, and ruled-out list with
  evidence.
- **Given** the mechanism, **then** the note says explicitly whether all four
  fixtures share it or only some do — verified, not assumed from the shape.
- **Given** the root cause lands in edge **emission order**, **then** the note
  records **STOP** and names the edge-draw-order mission as the owner (D5).
- **Given** no mechanism can be established, **then** the note records what was
  ruled out and the next instrumentation step — not a guess.

## Quality bar

No code changes, so no gates. The bar is the artifact: a reader must be able
to act on it without redoing the investigation.

## Observability

N/A — read-only diagnosis.

## Rollback

**Reversible** — a note file only.

## Boundaries

- **Always:** instrument before hypothesizing; quote the Java you read with
  `file:line`.
- **Never:** write a fix, or edit any file in `src/` or `tests/`.
- **Never:** widen into edge emission order. If that is where the cause lives,
  the finding is the deliverable and **T11 does not run** — D5 is locked.
- **Never:** report "this is hard" or "good enough" as a stopping point. The
  valid stops are: cause found, or cause not yet found with ruled-out and next
  step recorded.

## Commit

`docs(T3): diagnose the givoli-family tail/head swap`
