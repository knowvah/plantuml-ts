# cdd-close-b7 — batch 7 close (class-divergence-drive)

Written 2026-09-23. Survey 491/104/128 → 521/104/98; census 493 → 523;
ratchet 493 → 523 (30 pins); DOT 711/712. Five tasks (T24–T28) plus a
four-agent residual round (R1–R4, with R1 re-used for the seed-id follow-on)
that alone turned 20 more fixtures conformant than the task branches did.

## Observation: the census harness must mirror every production wiring step
- **Context**: pinning at the close; 11 survey-conformant fixtures were
  census-diverged.
- **Finding**: `render-fixture-class.ts` (census + class golden ratchet)
  assembled with no seed and no nested-diagram renderer; production had
  gained both this batch. Every new production seam that changes bytes
  (seeded ids, a registered renderer, a resolver bundle) must be threaded
  into the harness in the SAME commit, or the census silently under-counts
  and the ratchet cannot pin what the survey already accepts.
- **Confidence**: High (census 512 → 523 from the harness change alone).

## Observation: a bucket label is where the diagnosis filed a fixture, not who fixes it
- **Finding**: repeat of close-b6. 44 movers this close; 12 sat in B1/B4/
  B5/B6/B9/B10 buckets and moved on B7 mechanisms (seeded ids closed six B6
  gradient fixtures; enhanced-body port election closed four B10 fixtures).
- **Confidence**: High.

## Observation: agents stop without a report after their first hand-back
- **Finding**: `SubagentHandback` delivers exactly one report per agent;
  a resumed agent's second report only reaches the orchestrator if the
  agent has `SendMessage`, which typescript-pro does not. T27 and R3 both
  "finished" silently on their second round; the report text is in the
  transcript's last assistant message (extract bounded, never tail the
  whole JSONL). Resume prompts should ask for the report as plain text in
  the final turn, and the orchestrator should read the worktree's journal
  rows + commits as the primary record.
- **Confidence**: High (two occurrences).

## Observation: Serena edit tools leaked to the main checkout three times
- **Finding**: T24, T25 and R3 each wrote one `replace_symbol_body` into the
  main checkout despite "Serena for READING only". Naming the five tools as
  forbidden and requiring `git -C <main> status --short` clean before every
  commit (R3's own gate caught the third) is what works.
- **Confidence**: High.

## Observation: one residual round per batch, on the merged tree, pays for itself
- **Finding**: T24–T28 closed 12 fixtures; R1–R4 closed 20 more from the
  same batch's mechanisms, because each task's stop-1 hand-offs became
  in-scope once the sibling tasks had merged. Budget the round explicitly;
  the seed-id item (row 62, parked on T37 for six batches) fell in one
  agent-turn once its owner had the design in context.
- **Confidence**: High.
