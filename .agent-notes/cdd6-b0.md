## Observation: dot-engine's `-Tdot` writer drops `label=""` on sub-cluster wrappers
- **Context**: cdd6 T0d, feeding our captured layout input through dot-engine's DOT writer and then real `dot -Tdot` (zasuxe).
- **Finding**: the written DOT omits `label=""` on the `cluster0p0`/`cluster0p1` wrapper subgraphs that our input graph does carry. Real dot then lets the wrappers inherit the parent's title table: bb height 210 instead of 177. Restoring `label=""` gives 177, matching dot-engine's own layout of the same input.
- **Impact**: a round trip "our input → dot-engine writer → real dot" is not a faithful re-layout of our graph unless the wrapper labels are restored first. Without that step a real-dot comparison can blame dot-engine for a difference the writer introduced.
- **Confidence**: High (measured both ways in one run).

## Observation: the committed non-class `parity-<engine>.json` pins lag the last mission close
- **Context**: cdd6 T0e, diffing the b0 all-engine survey against `tests/oracle/svg-conformance/parity-*.json`.
- **Finding**: 12 rows (c4 2, object 4, sequence 6) differ from the committed pins but are identical to cdd5's `measurements/final-eng/`. cdd5 refreshed the 28 committed pins at its T0e (from b0-8beta1) and never again; its b3 movers (journal row 69) reached only the per-engine measurement files.
- **Impact**: a D7-style "movers vs committed pins" diff shows the previous mission's gains as movers. Diff against the previous close's `bN-eng/` files (as cdd6 close-procedure step 9 says), not the committed pins, or refresh the pins at the mission's exit.
- **Confidence**: High.

## Observation: three subagents stalled together when load hit 24
- **Context**: cdd6 batch 0, three parallel agents (two vitest-running, one render-diff/real-dot probing) plus WebStorm indexing.
- **Finding**: all three hit the harness's 600 s no-progress watchdog at the same time (`uptime` load 24.26); none had crashed, and resuming each with `SendMessage` continued them with context intact. The resumed hand-backs DID arrive (three of three), contra the single-shot memory note from SI41.
- **Impact**: at load above ~20 expect watchdog stalls, not failures; resume rather than re-spawn, and tell the resumed agent to run vitest with `--maxWorkers=2` and to wait for load < 8 before any survey.
- **Confidence**: High (symptom); Medium (that load alone was the cause).

## Observation: `npm run svg:survey` times out fixtures when load spikes mid-run even if it started below 8
- **Context**: cdd6 T0e, sequential 28-engine survey loop while T0d probes ran.
- **Finding**: json (12 rows) and network (2) surveyed as `timeout` although their runs started at load 4.8 and 36; the spike (44 by the next engine) came from concurrent work. Re-surveyed alone at load 4: 0 timeouts, 0 movers.
- **Impact**: check load at the END of an engine's survey too, and re-survey any engine with timeouts before treating a timeout as stop 7.
- **Confidence**: High.
