## Observation: rendering a fixture can write to stdout

- **Context**: T4 (`sequence-command-coverage`) built
  `scripts/sequence-ratchet-adjudicate.ts`, which renders all 1141 sequence
  fixtures and emits a machine-readable JSON report on stdout.
- **Finding**: `!log` in a fixture reaches `console.info`
  (`src/core/tim/EaterLog.ts:35`), and sequence corpus fixtures use it — five
  `[Log]` lines appeared interleaved in the first run's output. Rendering is
  therefore NOT stdout-clean.
- **Impact**: any script that renders fixtures while emitting a report on
  stdout cannot have its output `JSON.parse`d whole. The adjudicator works
  around this with sentinel delimiters
  (`--- BEGIN ADJUDICATION JSON ---` / `--- END ADJUDICATION JSON ---`);
  future report-emitting scripts need the same guard, or must write the
  report to a file descriptor other than stdout.
- **Confidence**: High — observed directly in a whole-corpus run.
