# Stop and push-forward conditions

## STOP and wait for human input

1. **The standard three** (`rules/autonomous-execution.md`): a task needs to
   modify files outside its write-set that are in no other task's write-set;
   two consecutive quality-gate failures on the same check; the implementation
   contradicts a `decisions.md` entry.

2. **Registration order needs to change.** D2 freezes it. If a fixture only
   routes correctly after reordering the registry, STOP — do not reorder.
   `sequence-engine-overclaims-nested-diagrams` halted at T2 for exactly this:
   mirroring `PSystemBuilder.java`'s factory order moved the routing gate
   **79 → 469**, fixing 25 and newly misrouting 415. The order is load-bearing,
   compensating for historical over-claim.

3. **A non-sequence fixture changes `data-diagram-type`.** Closing a sequence
   gap must not move a `class`/`state`/`description` fixture between engines.
   One such fixture is a stop, not a re-pin.

4. **A rise classified `regression` whose mechanism cannot be stated.** Per D5
   and `rules/diagnosis.md`, the artifact is: mechanism, `file:line`, causal
   chain, ruled-out. The 2-fix-attempt cap bounds **edits, not inquiry** —
   halting on a spent budget is valid only if the journal entry carries the
   full artifact. "Two attempts failed" is not a diagnosis.

5. **A parse change requires touching another engine's parser** (`class/`,
   `state/`, `description/`) or a shared `core/` seam beyond the declared
   write-set. Shared-emission changes moved three engines at once in
   `dispatch-by-parse-attempt`.

6. **T6 cannot preserve behavior.** If some arrow token has no faithful
   `ArrowConfiguration`, D1's premise is wrong and the model is wrong. Stop —
   do not add a compensating flag.

7. **T11's `EmbeddedDiagram` needs nested-diagram infrastructure.** Stop and
   file it as its own mission rather than building it inline. The deferral must
   carry a **fixture-level cost** per CLAUDE.md — "genuinely large AND
   separable, proven by measurement." A difficulty claim is not sufficient, and
   "hard" is a trigger to verify, not to skip.

8. **The measured tally diverges from 195 by more than 10%.** The scope claim
   this brief rests on would be wrong, and the remaining batches were sized
   against a fiction.

## PUSH FORWARD with judgment — log, do not ask

- **Where to cut a file** for the 500-line hook in T1/T2/T5. Pure structure, no
  behavior effect, gated by zero ratchet movement.
- **A fixture's pinned `reason` is wrong.** The pins came from a prior
  mission's classification. Re-classify, log the correction, continue. Expect
  this: `sequence-participant-badge-glyph`'s stated blocker turned out to be
  false, and the wrong reason nearly bought a deferral the work did not need.
- **Authoring a `.puml` fixture and generating its oracle** when a ported
  branch has no corpus fixture. CLAUDE.md is explicit: the corpus is the work
  queue **and not a ceiling**. Render oracles with
  `scripts/oracle-render.sh <out-dir> <puml>`, never a hand-typed `java -jar`.
  Never satisfy coverage with a synthetic test that asserts nothing.
- **Re-pinning a rise the adjudicator classifies `artefact`.** That is D5's
  entire purpose. Log the count, not each fixture.
- **A bucket coming in smaller or larger** than its estimate, within ±10%.
- **Adding a per-family command module beyond the ~9 planned**, if
  `initCommandsList`'s grouping suggests a different seam.

## Non-negotiables for every task

- **Read the Java first** — the method body and the constructor that built its
  inputs, not a filename or a remembered summary. Every constant carries its
  upstream `file:line`; no citation means unfinished.
- **Never fit a value.** Keeping whatever shrank the error is forbidden
  *especially* when it shrinks.
- Grep `src/main/java/net/`, never just `net/sourceforge/plantuml/`.
- **Preserve upstream names**, ugly included.
- **Do not refactor while porting.** Redundant-looking branches handle cases
  the corpus surfaces months later.
