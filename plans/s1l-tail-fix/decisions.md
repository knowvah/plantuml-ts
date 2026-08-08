# Architecture Decisions — S1L Tail Fix

All nine approved by the maintainer 2026-08-07 before execution. Treat every
one as locked. If you discover a conflicting constraint, STOP and log it to
[decision-journal.md](decision-journal.md) — do not silently override.

## ADR-1 — The orchestrator owns `size-backlog.json`

**Context.** Every one of the 13 groups deletes its own pins from that single
file, so any two tasks in a batch collide on it — violating the
one-writer-per-file rule the entire batch plan rests on.
**Decision.** **No task writes `oracle/goldens/description/size-backlog.json`.**
Each task reports the pins it closed in its completion summary; the
orchestrator deletes them after the batch's gates pass, in the batch commit.
**Consequences.** Parallel batches stay legal. The cost is that a task's own
`measure-description-size-deltas` run still shows its fixtures as `improved`
against a stale pin rather than absent — that is expected, and is NOT a
failure.

## ADR-2 — Assets reach the synchronous path through a pre-fillable store

**Context.** `stdlibRegistry` (`src/index.ts`) is async-only — `renderSync`
cannot await a dynamic `import()`. But the whole size-conformance harness
renders **synchronously** with a pre-built `includeStore`, so a lazy-only
channel would leave G3b's and G12's own fixtures unmeasurable.
**Decision.** Add a dedicated asset store option that can be filled
synchronously, mirroring the existing `includeStore` (sync) / `stdlibRegistry`
(async) pair. Precedent: `plans/si5b-stdlib/decisions.md` D2 and
`tests/helpers/stdlib-assets-store.ts`.
**Consequences.** The harness measures the same code path users get. Built once
in F3-seam so F4-a and F4-b do not both write it.

## ADR-3 — G2 is a full `BodyEnhanced2` route, not four patches

**Context.** SYNTHESIS expects routing `measureNote` through
`BodyFactory.create3`→`BodyEnhanced2` to subsume causes C3 and C4, but flags
that as an expectation, not a measurement.
**Decision.** Take the full route — the text-block model is already ported and
already wired for entity `desc`. **Verify C1, C2, C3 and C4 each
independently**; subsumption is never assumed.
**Consequences.** Avoids reimplementing a module that exists (a CLAUDE.md
trap). If a cause is not subsumed, it is fixed explicitly in the same task.

## ADR-4 — `measureNote` reads `opts?.fontSize ?? NOTE_FONT_SIZE`

**Context.** `leaf-sizing.ts:109` collapses "no override" into `baseFont` (14),
so by the time `measureNote` runs, `fontSpec.size` cannot distinguish "no
override" (measure at 13) from "override 14". Reading it directly regresses
**every plain note by 1px**.
**Decision.** Resolve the note font from the **un-collapsed** override —
`opts?.fontSize ?? NOTE_FONT_SIZE` — and do **not** change `:109` this mission.
**Consequences.** F1-a's blast radius stays contained. The `:109` collapse is a
real design wart and is filed as a follow-up, not fixed under fix-mission
pressure.

> **Amended 2026-08-07, before execution.** As first written this ADR was not
> implementable. Verified against source: `measureNote` is
> `(display, fontSpec, measurer, sprites?)` (`leaf-sizing.ts:215-220`) and takes
> no `opts` at all — the collapse happens one level up in `measureLeafNode`
> (`:109`, `opts?.fontSize === undefined ? baseFont : …`), so `opts?.fontSize`
> is simply not in scope where the ADR told the agent to read it. `measureNote`
> then overwrites the size unconditionally at `:221`
> (`{ ...fontSpec, size: NOTE_FONT_SIZE }`) — that IS cause C3.
>
> **The fix therefore requires threading the override into `measureNote`** (pass
> `opts`, or just the resolved `fontSize | undefined`) and reading it there.
> That is a signature change to one private function inside F1-a's own
> write-set — still contained, and still not `:109`. An agent that tried to
> follow the un-amended wording would have hit a conflicting constraint and
> stopped, or improvised.

## ADR-5 — F3 stays one oversized task

**Context.** The 5–15-minute granularity rule says split an 11-file task. But
tier 1 of the `BoxSizingOpts` thread alone moves `nodebar` from +4px to +10px
error.
**Decision.** Keep tiers 1 and 2 as a **single task**, explicitly overriding
the granularity rule. Shipping tier 1 alone widens the ratchet.
**Consequences.** F3-fix is the mission's riskiest single task and carries the
most detailed acceptance criteria.

## ADR-6 — F2-b owns `extractNodeStereotype` for both G3-M1 and G7

**Context.** G3-M1 routes `extractNodeStereotype` through the already-ported
`StereotypeDecoration#buildComplex`, which very likely adopts upstream's
`<`/`>`-excluding pattern and closes G7 as a side effect.
**Decision.** One function, one owner, one task. **G7's closure is verified
against `junoxu-15`, never assumed** — if it does not close, the same task
finishes it explicitly.
**Consequences.** No write conflict on `parse-helpers-strings.ts`; one fewer
task; the "likely" is converted into a measurement.

## ADR-7 — Uncovered defects get authored fixtures, in the same task as the fix

**Context.** Two reproduced defects have no golden today (emoji-only line
height; a first line that is entirely `[[url label]]`). `CLAUDE.md`: the corpus
is a starting point, not a ceiling.
**Decision.** Each gets an authored `.puml` **plus a generated jar oracle** in
the same task as its fix — never a synthetic-only check. The url-label task
sequences after F2-b because both write `parse-helpers-strings.ts`.
**Consequences.** Generating an oracle for a NEW fixture is approved work and
is explicitly NOT the forbidden regeneration of an existing golden.

### The oracle invocation — one form, no variations

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
  -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <fixture>.puml
```

> **`-DPLANTUML_DETERMINISTIC_TEXT=true` is MANDATORY.** Without it the jar
> measures with real AWT font metrics, poisoning every width in the dumped DOT
> — the ratchets compare against `WidthTableMeasurer` output.
> `scripts/oracle-corpus.ts#runOracle` sets it unconditionally and its own doc
> comment calls it mandatory. Omitting it is exactly the defect behind
> `kokebo-27-vafi688` (G13, the fixture F5-a exists to fix), and the class
> goldens once captured without it carried **489 phantom size deltas**
> (A2s ADR-5).
>
> An oracle generated without the flag **looks completely plausible and is
> silently wrong** — it will not fail a gate, it will bake a phantom delta into
> a brand-new golden. Prefer calling `runOracle` over hand-rolling the command.
>
> One fixture per `-DPLANTUML_DUMP_DOT` directory. Do **not** batch several
> `.puml` files into one dump dir: `svek-N.dot` names are not slug-qualified,
> so they collide silently across fixtures.

## ADR-8 — The bottleneck metric stays audit-only

**Context.** `scripts/audit-size-metric-identity.ts` (2026-08-07) proved there
is **no false conformance** — all 321 passing fixtures hold under an exact
bottleneck assignment. The stronger metric is available but not adopted.
**Decision.** Do **not** change `tests/oracle/svek-dot.ts`'s gate and do **not**
re-base `size-backlog.json` pins this mission. Adopting the metric re-bases
every pin in the one file all 13 groups already contend for.
**Consequences.** Revisit once the tail is closed and the backlog is quiet.
Meanwhile the audit's **corrected targets are still authoritative** for the 8
understated fixtures.

## ADR-9 — Vendored assets: licence review blocks landing; Twemoji stays lazy

**Context.** The repo is MIT and requires MIT-compatible dependencies. The
`/sprites/**` sets have mixed provenance; the Twemoji payload (~1.75 MB) would
roughly double a ~1.8 MB bundle.
**Decision.** (a) A licence-review task reports per-icon-set provenance
**before any sprite asset lands**; a non-MIT-compatible set becomes a
documented gap, never a silent vendored asset. (b) Twemoji artwork ships behind
the optional/lazy channel from ADR-2 — the **default bundle must not grow**.
**Consequences.** A licence violation in git history is not undone by a revert,
which is exactly why the review gate is blocking rather than advisory.
