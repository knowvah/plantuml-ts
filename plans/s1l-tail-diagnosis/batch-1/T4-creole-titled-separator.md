# T4 — Verify the S1L-i mechanism (creole titled separators, 2 fixtures)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance sits at **321/351 (91.5%)**, measured by
`scripts/measure-description-size-deltas.ts` against a 0.01in bar.

Unlike the other diagnosis tasks, this bucket **already has a recorded
mechanism** in `planning/mission-index.md` (sub-mission S1L-i):

> `--title--` / `==title==` draw a rule CARRYING their title text, so the line
> contributes the TITLE's width and the rule height — not the raw markup
> measured as glyphs (`--title1--` measures 62.5px here vs the jar's `title1`
> 37.6px). Sizer and renderer must move together (`isCreoleHrLine` /
> `classifyStripeLine` already share one classifier — extend it rather than
> special-casing the sizer).

**Your job is to VERIFY that, not to inherit it** (ADR-4). This is not
bureaucracy. On 2026-08-06 two prior missions' recorded mechanisms for one
symptom were each half-right — one had jar-verified only the cases that
supported it, the other had derived algebra from a single counter-example —
and the resulting "obvious one-character fix" would have regressed an
already-ratcheted golden. A recorded mechanism is a hypothesis with good
provenance, nothing more.

## Task

For each fixture: reproduce the current delta, confirm or correct the recorded
mechanism against current code and current numbers, and record the result on
the schema. **No source changes, no fixes** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `nixura-77-bina738` | 1.2731 |
| `xufexu-38-fola855` | 0.1528 |

Note the two deltas differ by ~8x. If one mechanism explains both, the record
must show the arithmetic that produces *both* numbers — otherwise you likely
have two mechanisms wearing one label, which is exactly what ADR-3 exists for.

Specific things to establish:
1. Does the recorded 62.5px-vs-37.6px measurement still reproduce today?
   (The creole-lexer unification of 2026-07-27 moved the sizer onto the shared
   `StripeSimple.buildLineAtoms` helper and dropped `parseCreole` from the
   sizer — the recorded numbers predate part of that work.)
2. Is `classifyStripeLine` genuinely shared by sizer and renderer today, or has
   that diverged? The recorded fix shape ("extend the shared classifier") is
   only valid if it is still shared.
3. Does the height half (rule height) contribute, or only the width half?

## Write-set

- `plans/s1l-tail-diagnosis/findings/creole-titled-separator.md` — **this only**

Probes go in `scripts_scratch/` and MUST be deleted before you finish.

## Read-set

Required first (mandatory for any sizing bug, any engine, per `CLAUDE.md`):
`planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md`.

Mission: `../decisions.md` (ADR-4 especially), `../findings/SCHEMA.md`,
`~/.claude/rules/diagnosis.md` (**read it**).

Prior record to verify: `planning/mission-index.md` (the S1L-i row),
`plans/s1l-leaf-sizing/ledger.md`.

Candidate code:
- `src/diagrams/description/leaf-sizing-text.ts` — `isCreoleHrLine`
- `src/core/klimt/creole/StripeStyle.ts`, `StripeStyleType.ts`,
  `CreoleHorizontalLine.ts` — `classifyStripeLine`
- `src/core/klimt/creole/legacy/StripeSimple.ts` — `buildLineAtoms`
- Upstream: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/`

Oracle: `test-results/dot-cache/{component,usecase}/<slug>/`.

## Architecture decisions

ADR-2, ADR-3, **ADR-4 (the governing one here)**, ADR-5, ADR-6 —
[decisions.md](../decisions.md). Locked.

## Interface contract

One record per fixture on [findings/SCHEMA.md](../findings/SCHEMA.md). Where
the recorded mechanism proves wrong or incomplete, `mechanism` states the
corrected version and `ruledOut` records what the old one failed to explain.

## Acceptance criteria

- **Given** each fixture, **when** diagnosed, **then** `originFileLine` is a
  real file and line, and the record explicitly marks the S1L-i mechanism
  **confirmed**, **corrected**, or **refuted** — never silently restated.
- **Given** the recorded 62.5px-vs-37.6px figure, **when** checked, **then**
  the record states whether it still reproduces today, with current numbers.
- **Given** both fixtures, **when** one mechanism is claimed for both,
  **then** the record shows arithmetic producing both 1.2731 and 0.1528.
- **Given** an unresolvable fixture, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and `nextStep`.
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
tools. **Ask first:** oracle regeneration or jar patch. **Never:** modify
`src/`; state-mutating git; touch a backlog pin; ship a fitted constant;
declare a divergence.

## Commit

`docs(T4): creole titled separator mechanism table` — or defer to the
orchestrator.
