# T9 — diagnose `nuvoja-46-dezu541`

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.

One fixture in the mission arrives with **no mechanism**. Every other bucket
was traced to a named file and a named line before this brief was written;
this one was not, and the brief does not pretend otherwise.

`test-results/dot-cache/sequence/nuvoja-46-dezu541` — the jar renders it
`SEQUENCE`. We produce a document with no `data-diagram-type` at all, and
`buildBlockUmls` returns a block whose `ok` is `false`: the failure is in the
**preprocessor**, before any routing decision is reached. It is grouped with
the routing buckets only because the gate cannot tell the difference from the
outside.

This task is scoped as **diagnosis**, per `~/.claude/rules/diagnosis.md`. It
is the one task in the mission whose deliverable may be a stop.

## Task

Produce the diagnosis artifact. Fix only if the mechanism turns out to sit
inside this mission's reach.

## Read-set

- `test-results/dot-cache/sequence/nuvoja-46-dezu541/in.puml` and its
  `in.svg` — read the source first; the golden shows what upstream made of it
- `src/core/BlockUmlBuilder.ts` — where `ok: false` originates and what
  `failure` carries
- `src/core/preprocessor.ts` — the stage that produced it
- `~/git/plantuml/.../preproc/` — the corresponding upstream stage, once the
  failing construct is identified. **Read the method that handles that
  construct**, not the package listing

## Write-set

- `.agent-notes/<a new note>` — the diagnosis, always
- `plans/routing-heuristic-repair/decision-journal.md` — the outcome row
- a `src/` file **only** if the diagnosis names one and the fix is inside
  this mission's reach. Declare it in the journal before writing it

Nothing else. If the fix lands outside `src/core/preprocessor.ts` or
`src/core/BlockUmlBuilder.ts`, **STOP and report it** — a preprocessor defect
reaching into an engine is a different mission.

## Acceptance criteria

1. Given the fixture, then the diagnosis artifact exists and carries all four
   parts required by `~/.claude/rules/diagnosis.md`: **mechanism** in a
   sentence or two, **origin** as `file:line`, the **causal chain** from that
   cause to the observed empty document, and what was **ruled out** with the
   evidence that ruled it out
2. Given that artifact, then it names the upstream method that handles the
   same construct, and says what upstream does differently
3. **Either** the fix lands and the gate reports
   `jarType === ourType === 'SEQUENCE'` for this fixture, **or** the journal
   records a stop with the artifact and the fixture stays pinned. Both are
   acceptable outcomes; a fix without the artifact is not
4. Given the fixture is fixed, then no other fixture newly misroutes — the
   preprocessor runs for every block in the corpus

## Quality bar

All four gates green.

"Two attempts failed" is not a diagnosis. The 2-try cap in
`~/.claude/rules/autonomous-execution.md` bounds **edits**, not
investigation: keep instrumenting until the mechanism can be stated, then
stop and record it.

## Observability

N/A.

## Rollback

Independently revertible if it produces a `src/` change; otherwise
documentation only.

## Boundaries

- **Always:** instrument before hypothesising; capture actual values
- **Never:** propose a fix before the mechanism is stated; special-case the
  slug; touch `src/index.ts` (D1)
- **Ask first:** if the mechanism is real but the fix belongs to another
  module — record it and let a separate mission have it

## Commit

One commit, whichever way it lands:
`fix(T9): <mechanism>` or `docs(T9): diagnose the nuvoja preprocessor failure`
