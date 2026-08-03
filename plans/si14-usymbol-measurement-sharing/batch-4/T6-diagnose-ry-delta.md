# T6 — diagnose the ellipse `ry` delta (diagnosis only, no fix)

## Context

**Project.** `plantuml-ts`, a TypeScript port of PlantUML. `~/git/plantuml` is
the canonical spec; `oracle/dist/plantuml-oracle.jar` is the pinned oracle.

**The observed discrepancy.** On the authored fixture
`class-usecase-inline-sprite`, the rendered ellipse's `ry` measures **13.4846**
against the jar's **13.0625** — a 0.4221 divergence. It is **not** the label
centring that T4 fixed; it is a second, adjacent mechanism inside the ellipse
fit itself, and it is expected to survive T4 unchanged.

**This task produces a diagnosis, not a fix.**

## Task

Enter diagnosis mode per `~/.claude/rules/diagnosis.md`. Produce the mechanism:

- **Mechanism** — the specific cause, one or two sentences.
- **Origin** — the `file:line` where it originates.
- **Causal chain** — why `ry` = 13.4846 follows from that cause.
- **Ruled out** — what you eliminated, and the evidence that eliminated it.

Write it to `.agent-notes/si14-ry-delta.md` using the observation structure in
`~/.claude/rules/memory.md` (Context / Finding / Impact / Confidence).

**Instrument before hypothesising.** Read the source, capture actual
intermediate values (the collected footprint points, `alpha` before and after
the [0.2, 0.8] clamp, the enclosing circle's radius, the `+6` from `bigger`),
and confirm the mechanism against evidence. Do not propose a cause you have not
observed.

An empty "ruled out" on a defect this specific means the cause was guessed
rather than isolated.

## Candidate directions (hypotheses to test, not conclusions)

Each of these is a guess until measured. Listing them is not endorsement.

- `alpha` clamping: `TextBlockInEllipse`'s `alpha = textDim.height / textDim.width`
  clamped to [0.2, 0.8]. A value at a clamp boundary would change `height = 2r·alpha`.
- Sprite ink box vs declared box: `Footprint#drawPath` records
  `(x + path.getMinX(), y + path.getMinY())` — the **ink** box, not the declared
  line box. A sprite whose ink is inset would move the fit.
- The text box's asymmetric shift: `-(h - 1.5)` with descent `size / 4.5`, which
  makes the fit order-dependent.
- D9's emission rounding for rasterised sprites (`plans/si5b-stdlib/decisions.md`
  Amendment 1) — measurement keeps raw dims, so a rounding leak into the
  measurement side would show up here.

## Write-set

- `.agent-notes/si14-ry-delta.md` (create)

**No source file may be modified.** This includes "obvious" one-line fixes. If
the fix looks trivial, that belongs in the note as a proposal, not in the code.

## Read-set

- `src/core/svek/image/Footprint.ts` — whole file
- `src/core/svek/image/{ContainingEllipse,SmallestEnclosingCircle,RotatedEllipse,YTransformer}.ts`
- `src/core/klimt/shape/TextBlockInEllipse.ts`
- `tests/oracle/svg-conformance/class-usecase-actor.test.ts` — the pinned diffs
- `~/git/plantuml/.../svek/image/Footprint.java`
- `~/git/plantuml/.../svek/image/ContainingEllipse.java`
- `plans/si5b-stdlib/decisions.md` § D9 Amendment 1

## Verifying against the jar

Run the oracle **one file at a time**:

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar -tsvg <one.puml>
```

A multi-file invocation returns PlantUML's welcome/error page and is easy to
misread in both directions. If a synthetic probe fixture helps isolate a
variable, author one — per CLAUDE.md the corpus is a starting point, not a
ceiling — and generate its jar oracle rather than reasoning from the existing
fixture alone.

## Acceptance criteria

1. **Given** the note, **when** read, **then** it states a mechanism with a
   concrete `file:line` origin — not a list of suspects.
2. **Given** the note's causal chain, **when** followed, **then** it arrives at
   13.4846 from stated inputs, and at 13.0625 for the jar.
3. **Given** the note's "ruled out" section, **when** read, **then** each
   eliminated hypothesis names the evidence that eliminated it.
4. **Given** `git diff --name-only`, **when** run, **then** it lists only
   `.agent-notes/si14-ry-delta.md`.

## Valid stop conditions

Only two, per `~/.claude/rules/diagnosis.md`:

1. Root cause identified (fix deferred by design — that is this task's shape).
2. Root cause identified and proven irreducible, documented with a controlled
   experiment isolating the variable, not an assertion.

"This is hard" and "this looks like enough" are **not** stop conditions. If the
cause is not yet certain, that is a valid in-progress state: report what has
been ruled out and what will be instrumented next.

## Observability

N/A.

## Rollback

**Reversible** — the task adds one note file and changes no code.

## Boundaries

**Always:** instrument before hypothesising; state the mechanism before any
proposed fix.
**Ask first:** authoring a new fixture that would land in the tracked corpus.
**Never:** modify rendering code (stop condition 7); propose a fix before the
mechanism is stated; run git mutations.

## Commit

One commit: `docs(T6): diagnose the use-case ellipse ry divergence`

## Follow-up

If the mechanism is a genuine `@knowvah/dot-engine` library finding, it must
also be filed under `docs/graphviz-issues/` with a tracker line, per CLAUDE.md —
a finding that exists only in a mission ledger is not filed. If it is a
plantuml-ts defect, file a GitHub issue and add the row to
`planning/mission-index.md` as its own tracked mission. Either way it is
**tracked**, not closed.
