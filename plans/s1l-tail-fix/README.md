# S1L Tail Fix — close the description size-conformance tail

## Objective

Description size-conformance sits at **321/351 (91.5%)**, widened 0. This
mission fixes the 26 diagnosed misses, taking it to **347/351 (98.9%)** — at
which point the only remaining fixtures are the four deliberately excluded
ones (2 LaTeX permanent divergence, 2 GH #24 `<code>` monospace). **This tail
closes completely.**

Every mechanism is already diagnosed to a `file:line`. **Do not re-diagnose.**
The inputs are on disk and are authoritative:

| Document | What it gives you |
|---|---|
| [`../s1l-tail-diagnosis/findings/SYNTHESIS.md`](../s1l-tail-diagnosis/findings/SYNTHESIS.md) | 13 mechanism groups (G1–G13), origins, write-sets, overlaps |
| [`../s1l-tail-diagnosis/findings/METRIC-AUDIT.md`](../s1l-tail-diagnosis/findings/METRIC-AUDIT.md) | **Corrected fix targets** — 8 pins understate the real error |
| `../s1l-tail-diagnosis/findings/*.md` | Per-fixture mechanism tables: ruledOut, causal chains, traps |
| [`decisions.md`](decisions.md) | The nine ADRs binding this mission |

> **Use METRIC-AUDIT.md's numbers as targets, never the backlog pins.** Eight
> fixtures' pins understate the real error — worst is `nixura-77` at a true
> 1.5403 against a pinned 1.2731.

## Branch

`feature/s1l-tail-fix` off `main`.

## Batches

- [x] [Batch 1](batch-1/overview.md) — F1-a/b/c, 3 parallel · **+9 → 330**
- [x] [Batch 2](batch-2/overview.md) — F2-a/b/c, 3 parallel · **+6 → 336**
- [x] [Batch 3](batch-3/overview.md) — F3-fix + seam + 2 non-code, 4 parallel · **+4 → 340**
- [x] [Batch 4](batch-4/overview.md) — F4-a/b/c/d + F4-e/F4-f (mid-mission),
      6 tasks · **landed 343 → 346/356 (97.2%)**, widened 0
- [ ] [Batch 5](batch-5/overview.md) — F5-a goldens sweep · **+1 → 347**

> **Batch 4 reached 346 by a different route than the ledger predicted.** The
> planned `+6` was 4 archimate pins + `murava-69` + `fariba-82`. What actually
> landed: `fariba-82` closed (+1) and two NEW authored fixtures landed
> conformant (+2, and total 354 → 356). The other five did **not** close —
> they improved but stayed above the 0.01in bar. Do not read "346" as "the
> ledger held"; see the open-work table below.

### Open after Batch 4 — 10 non-conformant, 6 of them closeable

| Fixture | Delta | Pin | Owner |
|---|---|---|---|
| `turasu-73-zoni468` | 0.210069 (was 1.224826) | 1.224826 | F4-f residual |
| `tuliba-37-liza126` | 0.263889 (was 0.521007) | 0.521007 | F4-f residual |
| `lesori-32-zeve057` | 0.069444 (was 0.242882) | 0.242882 | F4-f residual |
| `ravodu-50-siso430` | 0.069444 (was 0.242882) | 0.242882 | F4-f residual |
| `murava-69-tago286` | 0.181655 | 0.181655 | wave 3 (Twemoji artwork) |
| `kokebo-27-vafi688` | 0.034560 | 0.034560 | Batch 5 (F5-a) |
| `gafico-37`, `nujito-06` | 1.200694 / 2.183854 | pinned | **excluded** — GH #24 `<code>` |
| `gevozu-46`, `sunuju-01` | 1.263889 each | pinned | **excluded** — LaTeX divergence |

Ceiling is **352/356 (98.9%)** — the four excluded fixtures are permanent.
Pins for the four improved archimate fixtures were **not** re-based (ADR-8 /
stop condition 6); they remain shrink-only at their old values.

`F1-c` books **zero** gain on its own — its fixture (`vivido-49`) closes in
F2-c. `F4-c`'s +1 is **conditional** on F3-diag resolving the `fariba-82`
residual; if it comes back `unresolved`, the mission lands at **346**, and that
is a correct outcome, not a failure.

### The 347 is conditional — two known risks

| Risk | Cost if it lands | Owner |
|---|---|---|
| **F3-lic rules `archimate` not vendorable** | **−4** (→ 343) | F3-lic, before F4-a |
| F3-diag cannot resolve the `fariba-82` residual | −1 | F3-diag, before F4-c |

The sprite risk is the larger one and was verified at planning time:
upstream ships **exactly one** internal sprite set — `archimate/`, 139 files at
`~/git/plantuml/src/main/resources/sprites/archimate/`. It carries **no
LICENSE, NOTICE or COPYRIGHT file**, and "archimate" appears **nowhere** in
upstream's `LICENSES.md`. All four of F4-a's fixtures (`turasu-73`,
`lesori-32`, `ravodu-50`, `tuliba-37`) depend on it specifically.

ArchiMate is an Open Group standard, so trademark or redistribution terms may
apply independently of PlantUML's own licence. **Do not resolve this by
inspection or by assumption** — it is F3-lic's ruling to make, and ADR-9 makes
that ruling blocking. If it rules against vendoring, those four fixtures become
a documented gap and the mission correctly lands at **343**, not 347. A
mission that reports 347 by vendoring an unlicensed asset has failed, not
succeeded.

## Quality gates

```sh
npm test              # vitest — 545 files / 12262 tests, must stay green
npm run typecheck     # tsc --noEmit, both tsconfigs
npm run lint          # eslint src tests demo
npm run build         # vite library build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count must RISE
npx tsx scripts/audit-size-metric-identity.ts        # reporting check
```

Never pipe a gate — `tail`'s exit code masks the real one. Capture `$?`
directly. `widened > 0` on any ratchet is a **stop condition**, not a warning.

### Cross-engine ratchets

All four engines' size ratchets are enforced **inside `npm test`**, by
`tests/oracle/{description-parity.ratchet,class-dot-parity,state-dot-parity,object-dot-parity}.test.ts`
— each asserts `maxSizeDeltaIn` against its own `size-backlog.json`.

Tasks touching `creole-atoms*` or the theme/skinparam layer (**F2-c**, **F3-fix**)
carry cross-engine blast radius and must additionally run the standalone
per-fixture reports:

```sh
npx tsx scripts/measure-class-size-deltas.ts
npx tsx scripts/measure-state-size-deltas.ts
```

There is **no `measure-object-size-deltas.ts`** and none is needed — object
diagrams render through the class engine, and their ratchet is covered by
`object-dot-parity.test.ts` in `npm test`. Do not go looking for that script,
and do not write one.

## Orchestration rules

- **No task writes `oracle/goldens/description/size-backlog.json`** (ADR-1).
  Each task *reports* the pins it closed; the orchestrator deletes them after
  the batch's gates pass. This is what makes parallel batches legal.
- Parallel agents share one worktree — **no agent runs a state-mutating git
  command.** The orchestrator commits after each batch.
- One commit per task, referencing the task ID: `fix(F1-a): rebuild measureNote`.
- Agents do not auto-load `~/.claude/rules/`. Each task file names the rules it
  requires; the agent must READ them before relying on them.
- Subagents use Serena MCP tools for symbol navigation, not the LSP tool.

## Stop conditions

STOP and wait for a human when:

1. A change is needed outside the task's declared write-set.
2. Two consecutive quality-gate failures on the same check.
3. An approved ADR would be contradicted.
4. **Any ratchet reports `widened > 0`** — the mission's primary failure mode.
5. **A cross-engine ratchet (class/state/object) widens.** Only F2-c and F3-fix
   can legitimately touch those.
6. A fix appears to need a change to `tests/oracle/svek-dot.ts`'s gate, or a
   re-base of `size-backlog.json` pins (violates ADR-8).
7. **Any golden regeneration beyond F5-a's approved sweep** — maintainer
   territory (the A2s ADR-5 precedent).
8. **The default bundle grows** (violates ADR-9's lazy-channel ruling).
9. A finding would require declaring a divergence — never self-approve.
10. The licence review finds *every* sprite set non-MIT-compatible — that is a
    scope collapse, not a documented gap.

## Push forward on judgment

1. Choice of probe or instrumentation technique.
2. **A mechanism recorded in SYNTHESIS turns out wrong** — correct it, journal
   it, continue. This happened five times during diagnosis; it is expected.
3. A fixture already measures conformant — record it, do not touch the pin.
4. **F3-diag cannot resolve the `fariba-82` residual** — record `unresolved`
   with `ruledOut` + `nextStep` and let the fixture stay open. Do **not**
   invent a mechanism to reach 347; F4-c would act on it.
5. One sprite set is non-MIT-compatible — documented gap, continue with the rest.
6. **Authoring a NEW fixture and generating its jar oracle** (ADR-7) is
   approved and is *not* stop-condition 7. New oracle for a new fixture: fine.
   Regenerating an existing golden: STOP.

## Required reading before ANY sizing task

`planning/usymbol-composition.md` and `planning/sizer-renderer-parity.md` —
`CLAUDE.md` marks both mandatory for any sizing bug in any engine.

## Documents

- [decisions.md](decisions.md) — the nine ADRs
- [diagrams/component-map.md](diagrams/component-map.md) — modules under change
- [diagrams/data-flow.md](diagrams/data-flow.md) — the note-measurement flow
- [decision-journal.md](decision-journal.md) — appended during execution
