# T9b — Re-baseline the 4 `svg-conformance` goldens

**Agent:** typescript-pro · **Depends on:** T3, T4, T9 · **Commit:** `test(T9b): re-baseline svg-conformance goldens to reduced form`

> **Added 2026-08-08 during T2, not present in the original decomposition.**
> The mission plan assumed T9's script covers every golden. It does not:
> the script walks `in.puml`, and `oracle/goldens/svg-conformance/` has 4
> `golden.svg` with **zero** `in.puml`. Those 4 drive the klimt emitter
> directly, so T3/T4 turn them red with no regeneration path. The mission
> objective ("every ratchet returns green") and batch-2d's full `npm test`
> gate both require this task.

## Context

`tests/oracle/svg-conformance/emitter.golden.test.ts` byte-compares 4
hand-authored cases against committed jar goldens. Each case's `case.ts`
exports `render()` which drives `UGraphicSvg` through a hand-authored
sequence reproducing real jar output; `golden.svg` is the real jar bytes.
The runner's doc comment is explicit that these are **never** regenerated
from this port's own emitter — that discipline must survive this task. The
new goldens come from the **jar**, exactly as the old ones did.

## Read-set

- `tests/oracle/svg-conformance/emitter.golden.test.ts` — the runner
- each `oracle/goldens/svg-conformance/<case>/case.ts` — **read the
  provenance doc comment first**; it names the source for that golden
- `.agent-notes/svg-output-size-reduction-measured.md` — the six rules
- `plans/svg-output-size-reduction/decision-journal.md` — the T9b rows

## Write-set

- `oracle/goldens/svg-conformance/delta-shadow/golden.svg`
- `oracle/goldens/svg-conformance/gradient-fill/golden.svg`
- `oracle/goldens/svg-conformance/class-boxes-and-link/golden.svg`
- `oracle/goldens/svg-conformance/database-cylinder-dashed/golden.svg`
- the sibling `case.ts` files **only** where a doc comment records a
  now-stale byte value

## Task — three different paths, one per provenance kind

**A. Whole documents from a documented `.puml`** — `delta-shadow`,
`gradient-fill`. Each case's doc comment contains the exact `@startuml`
source. Write it to a temp file, capture with the pinned jar
(`java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar -tsvg -o <out> <puml>`),
and replace `golden.svg` with the capture.

*Already verified for `delta-shadow`:* the documented `.puml` reproduces
the committed golden — same `f4f7611cfp3` filter id, same
`viewBox="0 0 247 75"` — at 3119 B (new) vs 3332 B (committed). Re-verify
the id/viewBox invariants after capture; if either moves, the `.puml` is
not the true provenance and that is a stop condition.

**B. Verbatim copy of a corpus fixture** — `class-boxes-and-link`, copied
from `test-results/dot-cache/class/baneru-00-kuro607/in.svg`. Re-capture
that fixture with the pinned jar and copy it verbatim again. If the
dot-cache entry is stale or absent, capture from the corpus `.puml`
instead; do not hand-edit.

**C. Hand-wrapped fragment — the hard one** —
`database-cylinder-dashed`. Its golden is **not** a jar document: two
`<path>` elements were copied from
`test-results/dot-cache/component/bisedo-29-kone620/in.svg`, then wrapped
in a minimal shell whose root attrs (`viewBox`/`width`/`height`/`style`)
were **hand-derived** from `SvgGraphicsCore`'s `ensureVisible`/`format`/
`finalizeRootAttributes` (documented convergence: `maxX=454`,
`maxY=105`, no `deltaShadow`, `minDim` default, `backcolor` undefined).

Re-capture the source fixture, extract the same two `<path>` elements in
their new reduced form, and re-derive the wrapper. **Rule 1 changes
coordinate formatting inside the `d` attribute and rule 4 may drop
`stroke-width` beside the dash array**, so do not assume the wrapper's
root attrs are unchanged — re-run the documented derivation rather than
copying the old numbers. Update the doc comment's recorded values if they
move.

## Acceptance criteria

1. Given the 4 cases, when `tests/oracle/svg-conformance/emitter.golden.test.ts`
   runs, then all 4 pass with zero diffs.
2. Given each new `golden.svg`, then its bytes came from the **jar**, not
   from this port's emitter — statable per file, with the command used.
3. Given `database-cylinder-dashed`, then its wrapper root attrs are
   re-derived (not copied), and the derivation is recorded in the case's
   doc comment.
4. Given each case's doc comment, then any byte value it records that
   changed has been updated.

## Rollback

**Reversible** — with the rest of batch-2a–2d (ADR-5).

## Quality bar

- The four gates at the end of batch-2d, not per-task (ADR-5).
- Every new golden traceable to a jar invocation you can name.

## Boundaries

- **Always:** capture from the pinned jar; keep the "never regenerated
  from our own emitter" discipline the runner's doc comment states.
- **Ask first:** if a case's documented provenance does **not** reproduce
  its committed golden's invariants — that means the provenance record is
  wrong, which is a finding, not something to paper over.
- **Never:** regenerate any of these from `render()`'s output; delete or
  un-pin a case; run any `git` command.
