# Batch 4 — sprite bundle, Twemoji artwork, tab stops, url-label first line

Four parallel tasks. Write-sets are mutually disjoint — no ownership
collapse needed. Running total after this batch: **340 → 346** (F4-c's +1 is
conditional; see below).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| F4-a | G3b internal sprite bundle (`getSprite` internal fallback + `jar:` sprite form) | typescript-pro | `src/core/sprite-commands.ts`, NEW `assets/sprites/**` package + manifest + loader seam | F3-lic (BLOCKING), F2-b (semantic) | [ ] |
| F4-b | G12 Twemoji artwork for `<:name:>` emoji atoms | typescript-pro | `src/core/klimt/creole/atom/AtomEmoji.ts`, `src/core/klimt/creole/Emoji.ts`, `src/core/svek/image/EntityImageDescriptionTextBlock.ts`, `src/core/svek/image/EntityImageDescriptionDelegates.ts`, `src/diagrams/class/class-member-atom-resolve.ts`, NEW lazy emoji-artwork asset channel | F3-seam, F2-b | [ ] |
| F4-c | G9-E2 tab-stop advance (`AtomText`) | typescript-pro | `src/core/klimt/creole/legacy/StripeSimple.ts`, NEW `src/core/klimt/creole/legacy/AtomText.ts` | F2-c, F3-diag | [ ] |
| F4-d | Uncovered url-label first-line defect | typescript-pro | `src/diagrams/description/parse-helpers-strings.ts` | F2-b | [ ] |

## Fixture ledger for this batch

| Task | Group | Fixtures closed | Gain | Running |
|---|---|---|---|---|
| F4-a | G3b | `turasu-73-zoni468`, `lesori-32-zeve057`, `ravodu-50-siso430`, `tuliba-37-liza126` | +4 | 344 |
| F4-b | G12 | `murava-69-tago286` | +1 | 345 |
| F4-c | G9-E2 | `fariba-82-xolu802` — **conditional** on F3-diag's residual verdict | +1 or +0 | 346 or 345 |
| F4-d | none (uncovered, ADR-7) | authored fixture only — no pinned fixture closes | +0 | unchanged |

If F3-diag reports `unresolved`, F4-c still lands its own E2 mechanism
correctly but `fariba-82` does not close, and the mission's batch total is
**345, not 346** — per README this is a correct outcome, not a failure. Do
not chase the +1 by improvising a fix for the undiagnosed residual (SI2:
`sh0006`, `$User [64x64/16z]`, +2px height, independent of E1/E2).

## Why these four run in parallel

Write-sets touch six distinct files/packages with zero overlap:
`sprite-commands.ts` (F4-a) ≠ the five `AtomEmoji`/`Emoji`/
`EntityImageDescription*`/`class-member-atom-resolve.ts` files (F4-b) ≠
`StripeSimple.ts` + new `AtomText.ts` (F4-c) ≠ `parse-helpers-strings.ts`
(F4-d). F4-a and F4-b each own a *different* new asset channel — F4-a a
synchronous, licence-gated `/sprites/**` bundle; F4-b a lazy, size-gated
Twemoji bundle — so they do not share the seam F3-seam built, only its
pattern (ADR-2).

## Why each dependency is real

| Task | Depends on | Why |
|---|---|---|
| F4-a | F3-lic (blocking) | Per-icon-set licence verdict decides what may land at all (ADR-9(a)). A set ruled non-MIT-compatible or provenance-unknown is a **documented gap** — its assets do not land, its fixtures stay open. That is correct, not a shortfall. |
| F4-a | F2-b (semantic) | F2-b lands `buildStereo`'s `getSprite()` branch. F4-a's resolved sprites have no consumer without it — write-sets are disjoint, but running F4-a first is unverifiable. |
| F4-b | F3-seam | Consumes the synchronous asset-store option F3-seam builds (ADR-2) so the size-conformance harness, which renders synchronously, can measure emoji artwork at all. |
| F4-b | F2-b | Writes `EntityImageDescriptionDelegates.ts`, which F2-b also writes (`buildStereo`'s sprite branch). Sequenced to avoid an unmerged conflict, not a semantic dependency. |
| F4-c | F2-c | Both write `StripeSimple.ts` (F2-c: G10 url-label sprite scale). Sequenced to avoid conflict. |
| F4-c | F3-diag | The `fariba-82` residual (SI2, undiagnosed +2px) must be resolved or ruled `unresolved` before F4-c can state truthfully whether its own fix closes the fixture. |
| F4-d | F2-b | Both write `src/diagrams/description/parse-helpers-strings.ts` (F2-b: `extractNodeStereotype`). Sequenced to avoid conflict — ADR-7's own text names this pairing explicitly. |

## Cross-cutting rules (all four tasks)

- **ADR-1**: no task writes `oracle/goldens/description/size-backlog.json`.
  Report closed pins in the completion summary; the orchestrator deletes
  them after this batch's gates pass.
- **ADR-7**: F4-d (and F4-b's folded-in emoji-only-line defect) author a NEW
  `.puml` fixture **plus a generated jar oracle** — never a synthetic-only
  check. This is approved work, not stop-condition 7 (regenerating an
  *existing* golden).
- Oracle command for a NEW fixture (the pinned jar, matches
  `scripts/oracle-corpus.ts#runOracle`):
  ```sh
  java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
    -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <puml>
  ```
  Omitting `-DPLANTUML_DETERMINISTIC_TEXT=true` reproduces G13's own defect
  (a non-deterministic AWT-metrics golden) — never omit it.
- Read `planning/usymbol-composition.md` and `planning/sizer-renderer-parity.md`
  before touching any sizing code (`CLAUDE.md` mandate, all sizing bugs, all
  engines).
- Serena MCP tools for symbol navigation, not the LSP tool (subagent scope).
- Required rule files (agents do not auto-load `~/.claude/rules/` — read
  before relying on): `~/.claude/rules/diagnosis.md`,
  `~/.claude/rules/testing.md`, `~/.claude/rules/testability.md`,
  `~/.claude/rules/code-principles.md`, `~/.claude/rules/commits.md`.

## Quality gates (run after all four land, before batch commit)

```sh
npm test              # vitest — must stay green
npm run typecheck     # tsc --noEmit, both tsconfigs
npm run lint           # eslint src tests demo
npm run build          # vite library build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count RISES
npx tsx scripts/audit-size-metric-identity.ts        # reporting check
```

F4-b additionally requires a bundle-size check (ADR-9(b), stop condition 8):
the DEFAULT build bundle must not grow. Verify with
`npm run build && du -sh dist/` (or the project's existing bundle-size
script if one exists) before and after, and record both numbers.

`widened > 0` on any ratchet is a stop condition. Never pipe a gate —
`tail`'s exit code masks the real one; capture `$?` directly.
