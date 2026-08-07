# T2 — Diagnose the `sprite` bucket (5 fixtures)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance is measured by `scripts/measure-description-size-deltas.ts`
against a 0.01in bar and sits at **321/351 (91.5%)**.

**The bucket label is a hypothesis, not a diagnosis** (ADR-3) — it comes from a
first-match classifier whose own header says so. Confirm or refute "sprite" for
each fixture rather than assuming it.

Sprite sizing has real, already-established prior art you must not re-derive:
- **`inkSprites` is a DEAD FIELD, not a sizing bug.** Ink IS consumed —
  `inlineFootprintBox` (`src/diagrams/description/leaf-sizing-text.ts:355-370`)
  reads `inkX`/`inkY`/`inkWidth`/`inkHeight` off the `sprites` lookup.
- Missions SI14/SI15 closed the raster-dimension family: `UImage` raster dims
  are `Math.round(declared)`, and `Footprint.drawImage` uses raster−1 gated on
  real-raster-backing with positive dims. A sprite-row fingerprint of ~0.015in
  survives in the CLASS engine (`rotisi-30`); the raster−1 hypothesis for it
  was **falsified** — it broke `lozego`'s jar-pinned raw-raster height.

So the cheap explanations here are already spent. Expect something else.

## Task

Diagnose each fixture to a `file:line` mechanism and record it on the schema.
**No source changes, no fixes** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `bivira-53-boja685` | 0.0644 |
| `kofuca-08-pafi749` | 0.3059 |
| `nobiza-91-fimo741` | 0.2769 |
| `turasu-73-zoni468` | 1.2248 |
| `vivido-49-nisu863` | 0.1574 |

`nobiza-91` carries known prior context to **re-verify, not inherit** (ADR-4):
it is linked to GH issue #23 (an `<img>` cannot-decode text rendered at NOTE
font 13 where the jar uses 14) and shrank 1.4603 → 0.6693 during creole-lexer
unification. `vivido-49` shrank 2.5199 → 0.1574 in the same change. Confirm
both against current code and current numbers.

Note the historical triage claims 4 of T1's nine `container-cluster` fixtures
are *actually* sprite-caused. If you find a mechanism that would explain one of
T1's fixtures, record it in `sharedCauseWith` — that cross-bucket link is
exactly what T8 needs.

## Write-set

- `plans/s1l-tail-diagnosis/findings/sprite.md` — **this file only**

Probes go in `scripts_scratch/` and MUST be deleted before you finish.

## Read-set

Required first (mandatory for any sizing bug, any engine, per `CLAUDE.md`):
`planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md`.

Mission: `../decisions.md`, `../findings/SCHEMA.md`,
`~/.claude/rules/diagnosis.md` (**read it** — its stop conditions bind you).

Candidate code (starting points, not conclusions):
- `src/core/creole-atoms.ts` — `inlineFootprintBox`, atom resolution
- `src/diagrams/description/leaf-sizing-text.ts:355-370` — the ink read
- `src/core/svek/image/Footprint.ts` — `drawImage`, raster gating
- `src/core/klimt/shape/UImage.ts` — declared vs raster dims

Oracle: `test-results/dot-cache/{component,usecase}/<slug>/`.

## Architecture decisions

ADR-2, ADR-3, ADR-4, ADR-5, ADR-6 — full text in [decisions.md](../decisions.md).
Locked; conflicting constraint ⇒ STOP and log.

## Interface contract

One record per fixture on [findings/SCHEMA.md](../findings/SCHEMA.md), field
names and order unchanged. T8 parses all seven findings files mechanically.

## Acceptance criteria

- **Given** each of the five, **when** diagnosed, **then** the record's
  `originFileLine` is a real file and line, not a restated label.
- **Given** a non-trivial fixture, **when** recorded, **then** `ruledOut` is
  non-empty with the evidence that eliminated each entry.
- **Given** `nobiza-91` and `vivido-49`, **when** recorded, **then** the
  prior recorded context is explicitly confirmed or corrected (ADR-4), not
  restated.
- **Given** an unresolvable fixture, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and `nextStep` — never a fabricated
  mechanism.
- **Given** completion, **when** `git diff --name-only` runs, **then** no
  `src/` path appears and `scripts_scratch/` is empty.

## Quality bar

```sh
npm test
npx tsx scripts/measure-description-size-deltas.ts   # 321/351, widened 0
git diff --name-only                                 # no src/ path
```

Capture `$?` directly; never pipe a gate.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Revert = delete the findings file.

## Boundaries

**Always:** reach `file:line`; read the two required tables first; Serena MCP
tools for navigation. **Ask first:** anything implying oracle regeneration or a
jar patch. **Never:** modify `src/`; run state-mutating git (shared worktree);
touch a backlog pin; ship a fitted constant; declare a divergence.

## Commit

`docs(T2): sprite mechanism table` — or defer to the orchestrator's batching.
