# G1H T0 — sequence oracle corpus capture

## Status: stop 9 RESOLVED by orchestrator 2026-08-20 — see decisions.md D3
amendment's corrected footnote. Resumed: manifest re-pinned, gates run.

## Pipeline run
1. `python3 scripts/populate-corpus.py` → `tests/corpus/sequence/` = **1427**
   files (not ~473 — classifier `TYPE_PATTERNS[0]` is `sequence` with a broad
   `^\s*\w[\w ]*->[\w ]` first-match pattern; see D3 amendment,
   `plans/sequence-oracle-harness/decisions.md:59-89`, approved 2026-08-20).
2. Rendered all 1427 candidates via `scripts/oracle-render.sh <abs-outdir>
   <abs-outdir>/in.puml`, one fixture per out-dir, parallelism 6
   (`scripts_scratch/T0/capture-sequence.sh`, deleted at close-out).
   - 1426 produced a non-empty `in.svg` + `.done`.
   - 1 failed: `xobebi-29-jilu859` — its source is `@startuml file4` (a
     *named* diagram) plus `newpage`, i.e. it is a **multi-page** diagram.
     PlantUML names paged output after the diagram name, so the jar wrote
     TWO files, `file4.svg` (page 1) and `file4_001.svg` (page 2), never a
     single `in.svg`. The `{in.puml, in.svg, .done}` cache layout has room
     for exactly one SVG per fixture, so this fixture is **structurally
     unrepresentable** in it, not a capture-script gap — no filename
     convention fixes a one-slot cache holding a two-page diagram. Verified
     manually: `oracle-render.sh` on this fixture exits 0 and produces both
     pages; the jar rendered it correctly. This is a real gap the corpus (and
     any future rebuild scored against it) inherits: multi-page sequence
     diagrams have no oracle entry. 39 corpus fixtures use `newpage`
     (`grep -lE '^\s*newpage\b' tests/corpus/sequence/*.puml | wc -l`); most
     of the other 38 succeeded because their declared name matched `in`
     implicitly (unnamed `@startuml`, so the jar's default basename IS
     `in`) — only a *named* `@startuml` combined with `newpage` collides
     with the single-slot layout.
3. **Pruned per D3 amendment**: admitted a slug only if its `in.svg` carries
   `data-diagram-type="SEQUENCE"` (`scripts_scratch/T0/prune.sh`). Histogram
   over all 1426 rendered:
   ```
   1141 SEQUENCE   (admitted)
     95 DESCRIPTION
     71 CLASS
     47 STATE
     46 UNKNOWN (parse-error diagrams — verified one, bisava-80-gefo968:
                  `digraph unix {...}` wrapped in @startuml, jar exits 200
                  "Some diagram description contains errors", output SVG
                  carries no data-diagram-type attribute at all)
     22 TIMING
      4 ACTIVITY
   ```
   285 rejected total; slugs + stamped type recorded in
   `scripts_scratch/T0/rejected.tsv` before deletion (not committed — command
   output only, per write-set).

## Stop-9 finding, RESOLVED — `dasutu-58-saje713` stays, with its DOT

**Mechanism.** `~/git/plantuml/src/main/java/net/sourceforge/plantuml/
EmbeddedDiagram.java:75-119,280-282`. A bare `{{ ... }}` block (used freely
inside note text, Creole-parsed) is dispatched as an embedded `uml` diagram:
`createAndSkip` wraps the enclosed lines as a full `@startuml/@enduml` block
and `EmbeddedDiagram`'s constructor builds a nested `BlockUml`/`Diagram` via
`blockUml.getDiagram()` (line 93). `drawU`/`calculateDimensionSlow` then call
`diagram.exportDiagram(...)` (lines 171, 208) to render that NESTED diagram
to SVG and composite it as an inline image into the OUTER diagram.

**Fixture**: `dasutu-58-saje713` — `Bob -> Alice : hello` (outer: SEQUENCE)
with a note containing `{{ object o1 { foo } \n o1 --> o2 }}` (inner: OBJECT,
a graph-layout/DOT-backed type). The outer diagram's `data-diagram-type`
correctly reads `SEQUENCE` (that attribute reflects the top-level diagram;
the embedded diagram is inlined as an opaque SVG image string, not as a type
change). But `-DPLANTUML_DUMP_DOT=$OUT` is a JVM-wide system property, not
diagram-scoped — the inner OBJECT diagram's own layout pass still dumps
`svek-1.dot`/`svek-2.dot` into the SAME out-dir as the outer SEQUENCE
`in.svg`.

**Causal chain**: classifier admits `dasutu-58-saje713` as a sequence
candidate (has `Bob -> Alice`) → jar renders it, outer type stamp is
SEQUENCE → jar ALSO renders the embedded `{{ }}` object sub-diagram as a side
effect of composing the outer image → that sub-render goes through the same
DOT-emitting layout engine as `class`/`object`/`state`/`component`/`usecase`
→ `PLANTUML_DUMP_DOT` fires for it → two `svek-*.dot` land next to a
SEQUENCE-stamped `in.svg`.

**Ruled out**: not a misclassification (outer diagram genuinely is SEQUENCE,
confirmed by `data-diagram-type` and by reading the source — one arrow, one
note); not a script bug (re-verified the two files are real jar output, not
leftovers from a prior run — `scripts_scratch/T0/capture-sequence.sh` uses
one out-dir per fixture, never shared); not present in the 164-fixture sample
the orchestrator measured before the amendment landed — this is a genuine
tail case the full-1427 run surfaces that a partial sample did not.

**Verification commands run** (per the orchestrator's ask):
```
$ find test-results/dot-cache/sequence -name 'svek-*.dot' | wc -l
2
$ find test-results/dot-cache/sequence -name 'svek-*.dot'
test-results/dot-cache/sequence/dasutu-58-saje713/svek-2.dot
test-results/dot-cache/sequence/dasutu-58-saje713/svek-1.dot
$ grep -L 'data-diagram-type="SEQUENCE"' test-results/dot-cache/sequence/*/in.svg | wc -l
0   # every survivor IS stamped SEQUENCE — the counterexample is admitted correctly
    # by the D3-amendment rule, it just also carries DOT
$ (non-3-file-dir scan) → exactly one: dasutu-58-saje713 (5 entries:
  .done in.puml in.svg svek-1.dot svek-2.dot)
```

**Resolution (orchestrator, 2026-08-20, cross-verified `EmbeddedDiagram.java`
independently — `EMBEDDED_START = "{{"`, bare-`{{` → `"uml"` dispatch — holds
as described above).** `dasutu-58-saje713` stays in the corpus: it is
correctly `SEQUENCE`-stamped, so the D3-amendment admission rule (stamp ==
SEQUENCE) was never actually contradicted — only the *sample-based footnote*
"zero SEQUENCE emit DOT" was over-strong, generalizing from 164 of 1427.
`decisions.md` now states the corrected, full-set-verified claim: the only
`.dot` under `dot-cache/sequence/` is this one slug's, produced by an
embedded non-sequence sub-diagram.

**The two `svek-*.dot` files are KEPT, deliberately, not deleted.** They are
faithful jar output — a re-capture of this exact fixture reproduces them
byte-for-byte (same mechanism fires every run: the note's `{{ object ... }}`
always dispatches through `EmbeddedDiagram` → nested OBJECT diagram → DOT
layout → JVM-wide `PLANTUML_DUMP_DOT`). Deleting them would make the "zero
DOT" invariant read cleanly while making it false again on the very next
re-capture — fitting a measurement to the assertion it's supposed to check,
forbidden by this repo's porting discipline. The two files are the correct,
permanent, single documented exception to "sequence emits no DOT".

## Corpus rejection record (from `scripts_scratch/T0/rejected.tsv`, deleted
after this note captured its counts — see step 5 below)
Per-type counts, 285 total, matching §3's histogram above:
`DESCRIPTION 95, CLASS 71, STATE 47, UNKNOWN 46, TIMING 22, ACTIVITY 4`.
Slug-level detail is NOT preserved (not in T0's write-set to commit); the
type stamp each rejected slug carried, and the mechanical rule that rejected
it (`data-diagram-type != "SEQUENCE"`), are reproducible by re-running
`populate-corpus.py` + `oracle-render.sh` + the stamp check — no information
here cannot be regenerated.

## Manifest re-pin and gates
- `test-results/render-manifest-baseline.json` re-pinned against the
  1141-entry pruned `dot-cache/sequence/` set. `manifestBefore` 2017,
  `manifestAfter` — see final report (computed after this note was written;
  values are in the task's closing message, not duplicated here to avoid a
  second source of truth that can drift from the committed file).
- `manifest-diff.py` against `expected-moves.txt`: reported in closing
  message; must be "0 unexpected" per T0's acceptance criterion.
- Four quality gates run on an otherwise-idle tree (T1's 61.5–62.6s reading
  was confounded by T0's 1427 concurrent JVM starts); wall-clock reported
  plainly in the closing message, not adjusted to clear the ceiling.
- `scripts_scratch/T0/` deleted after this note and the rejection record
  above were captured.

## Interface contract
```json
{ "classified": 1427, "candidatesRendered": 1427, "captured": 1141,
  "rejected": {"DESCRIPTION": 95, "CLASS": 71, "STATE": 47, "UNKNOWN": 46,
               "TIMING": 22, "ACTIVITY": 4},
  "failed": [{"slug": "xobebi-29-jilu859",
    "reason": "@startuml file4 + newpage is a 2-page diagram (file4.svg, file4_001.svg); the single-in.svg cache layout cannot represent a multi-page fixture"}],
  "manifestBefore": 2017, "manifestAfter": "see closing report",
  "stop9": {"status": "RESOLVED", "slug": "dasutu-58-saje713",
    "stampedType": "SEQUENCE", "svekFiles": ["svek-1.dot", "svek-2.dot"],
    "disposition": "kept — faithful, reproducible jar output; documented single exception",
    "mechanism": "EmbeddedDiagram.java:75-119,280-282 — bare {{ }} note dispatches to a nested OBJECT diagram through the DOT-emitting layout engine; -DPLANTUML_DUMP_DOT is JVM-wide, not diagram-scoped"} }
```
