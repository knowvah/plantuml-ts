# T3 — F4: port `ReadFilterMergeLines` (G3, trailing-`\` continuation)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
A source line ending in a bare `\` merges with the NEXT physical line before
command dispatch (`preproc2/ReadFilterMergeLines.java:57-81`,
`StringUtils.java:454-456`). No pass in this port does it: SI28
`findings/composite-a.md` (duzazu-41), `composite-b.md` (vixobo-14),
`attribute-line.md` (fibudu-53#a). `decisions.md#D3` (locked) fixes WHERE:
mirror `preproc2/Preprocessor.java:50-54` (after `ReadFilterAddConfig`; the
quote-comment filter at `:51` is commented out upstream — do not add one) and
`tim/TContext.java:661` (`!include`d readers). Read those Java bodies first,
then `src/core/tim/ReadLineReader.ts:1-80`, `src/core/BlockUmlBuilder.ts:80-140`,
`src/core/tim/TContext.ts` include path, `.agent-notes/si27-t1-display-newlines-one-port.md`.

## Task
1. Port the filter faithfully (name preserved: `ReadFilterMergeLines`), at
   both chain positions. Line numbering of merged lines follows upstream
   (the merged line keeps the FIRST line's location — check
   `ReadFilterMergeLines.java` and `StringLocated`), because error diagrams
   cite lines.
2. Before changing anything, list every corpus fixture with a trailing-`\`
   line: `grep -lE '\\$' test-results/dot-cache/*/*/in.puml` — expected:
   class `fokudo-49`, `mocoda-55`, `vubofi-17`; state `duzazu-41`, `vixobo-14`,
   `fibudu-53`. Only these may move in `render-manifest --diff` (README stop 4).
   Check the three class fixtures against their jar SVG (`in.svg`) — they
   should move jar-ward; report before/after for each.
3. Tighten ratchets for duzazu-41 / vixobo-14 / fibudu-53 (its `#b` width row
   belongs to T6 — leave that residual, journal it).
TDD: `tests/unit/core/read-filter-merge-lines.test.ts` first (bare `\`,
`\\` escaped, trailing spaces after `\`, last line, inside `!include`).

## Write-set
`src/core/tim/ReadLineReader.ts` and/or the chain-owner file (name it in your
report), `src/core/BlockUmlBuilder.ts`, `src/core/tim/TContext.ts` (include
path only), `tests/unit/core/read-filter-merge-lines.test.ts`, ratchet
entries for the three state fixtures.

## Acceptance
- Given `State1 : a \` newline `b`, when read, then one line `State1 : a b` per `ReadFilterMergeLines.java:57-81`.
- Given the corpus, when `render-manifest --diff` runs, then exactly the six listed fixtures move.
- Given duzazu-41, vixobo-14, fibudu-53 (#a rows), then harness rows exact; `harness-diff.py` clean.
- Given an `!include`d file with a trailing `\`, then it merges too (`TContext.java:661`).

## Observability / Rollback
Full-corpus manifest is the SLI. Reversible.

## Report (≤500 tokens)
Chain position chosen (file:line, ours and Java); the six manifest moves with
jar-ward evidence for the class three; ratchets removed; residual on fibudu#b.
