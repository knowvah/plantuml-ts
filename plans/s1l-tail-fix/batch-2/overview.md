# Batch 2 — command table, stereotype extraction, url-label sprite scale

Three parallel tasks, disjoint write-sets. Closes G6 + G3-M1 + G7 + G10.
**+6 → 336.**

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [F2-a](F2-a-command-table.md) | Command-table gaps (G6): unquoted-CODE + `<<st>>`, and `CODE as "quoted DISPLAY"` role flip | typescript-pro | `element-grammar.ts`, `command-table-containers.ts`, `command-table-shorthand.ts`, `parse-state.ts` | F1-b (`parse-state.ts` + `stillUnknown` contract) | [ ] |
| [F2-b](F2-b-stereotype-extraction.md) | Stereotype extraction owns G3-M1 + G7: `<`/`>`-excluding regex, `buildStereo`'s sprite + empty-label branches | typescript-pro | `parse-helpers-strings.ts`, `EntityImageDescriptionDelegates.ts`, `ast.ts`, `leaf-sizing-entity.ts` | Batch 1 (no specific task) | [ ] |
| [F2-c](F2-c-url-label-sprite.md) | Url-label sprite scale (G10): drop `fontSize/13` inside `[[url label]]` | typescript-pro | `StripeSimple.ts`, `creole-atoms.ts`, `creole-atoms-measure.ts`, `render-atoms.ts` | Batch 1 (no specific task) | [ ] |

## Fixtures closed

| Task | Fixtures | Corrected target (METRIC-AUDIT) |
|---|---|---|
| F2-a | `gogamo-72-pibo470`, `dopova-50-digo290` | `gogamo-72` true **0.4604** (pin 0.2148); `dopova-50` true **0.9371** (pin 0.8827) |
| F2-b | `junoxu-15-gori632` direct; `nobiza-91-fimo741` via F1-a's note work | — (not in the 8 understated) |
| F2-c | `bivira-53-boja685` direct; `vivido-49-nisu863` via F1-c's glyph table | — (not in the 8 understated) |

**Use METRIC-AUDIT.md's corrected numbers as the fix target for `gogamo-72`
and `dopova-50` — the pins in `size-backlog.json` understate the true error
by more than 2x on `gogamo-72`. Do not treat the pin as "done."**

## Why these three are parallel-safe

- Write-sets are pairwise disjoint (`element-grammar.ts`/`command-table-*.ts`
  vs `parse-helpers-strings.ts`/`EntityImageDescriptionDelegates.ts`/`ast.ts`
  vs `StripeSimple.ts`/`creole-atoms*.ts`/`render-atoms.ts`).
- `leaf-sizing-entity.ts` is written only by F2-b in this batch (F3, F4-b own
  it in later batches — SYNTHESIS §8's "second hub" is not contended here).
- `parse-state.ts` is written only by F2-a in this batch (G1/G8 already
  landed it in F1-b).

## Why F2-a depends on F1-b specifically

F2-a's new command-table rule creates a `STILL_UNKNOWN` leaf carrying a
stereotype (the no-SYMBOL/unquoted-CODE branch — upstream mutes it to
actor-or-interface at diagram end via `resolveStillUnknown`, matching
upstream `isForbidden`/`STILL_UNKNOWN` semantics, not a hardcoded `'actor'`).
`parse-state.ts` already exposes this path today
(`ensureEndpoint`/`emitNode`/`resolveStillUnknown`,
`src/diagrams/description/parse-state.ts:155-222`) for the LINK-endpoint
auto-create case. F1-b's own edits to `parse-state.ts` (G1/G8: block openers,
`pushElementBody`, common-base-indent) land in the same file first — F2-a
must read `parse-state.ts` post-F1-b, not pre-F1-b, or it edits a stale copy
and the orchestrator hits a merge conflict at batch-commit time. **F2-b and
F2-c depend only on Batch 1 completing as a whole** (no specific task): F2-b
needs G3's sprite/stereotype context settled (F1-a's note-height fix, since
`nobiza-91`'s residual is billed there) and F2-c needs F1-c's OpenIconic
table landed so `vivido-49`'s dominant node is already closed before F2-c's
own fix closes the fixture's secondary M3 factor.

## Quality gates (run by every task before finishing)

```sh
npm test              # vitest — must stay green
npm run typecheck     # tsc --noEmit, both tsconfigs
npm run lint           # eslint src tests demo
npm run build          # vite library build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count RISES
npx tsx scripts/audit-size-metric-identity.ts        # reporting check
```

Never pipe a gate. `widened > 0` on any ratchet is a stop condition.
**F2-c additionally re-runs the class, state and object size ratchets**
(it touches `creole-atoms*`, shared across all four engines).

## Orchestration reminders (see README + decisions.md)

- No task writes `oracle/goldens/description/size-backlog.json` (ADR-1).
  Each task reports closed pins in its completion summary; the orchestrator
  deletes them after this batch's gates pass.
- No agent runs a state-mutating git command. The orchestrator commits once
  per task after the batch's gates pass.
- One commit per task: `fix(F2-a): <desc>`, `fix(F2-b): <desc>`,
  `fix(F2-c): <desc>`.
