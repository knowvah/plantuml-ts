# Decision journal — edge-label-box-and-class-ports

Append one row per non-trivial judgement call: anything a reasonable developer
might have decided differently. Log it either way — pushed forward or stopped.

| date | decision | why | needs review? |
|---|---|---|---|
| 2026-08-13 | Mission drafted from the DOT-attribute audit's three feature-sized remainders, as ONE brief with batches ordered by dependency. | Batches 1 and 2 are the same seam with a measured dependency (wiring 2 alone regressed `jecici` 143 -> 159 because the measurement feeding it is wrong). Batch 3 is independent and is last so it can be split out cleanly. | no |
| 2026-08-13 | Batch 1 scoped as "reuse `computeReservedLabelBox` + strip markup + port `arrowFontSize`", NOT "wire link labels into the creole stack". | The state engine's existing helper already reproduces the oracle byte-for-byte once fed clean input at the right size (72x22 and 67x12, both exact). The large framing was wrong before the helper was found. | no |
| 2026-08-13 | The kermor `constraint` path was ported during the preceding audit after the plan declared it unverifiable. | Recorded here because it is the precedent for D3's stop condition: "no fixture isolates it" was an assumption, and the gate falsified it. Check before declaring something unverifiable. | no |
