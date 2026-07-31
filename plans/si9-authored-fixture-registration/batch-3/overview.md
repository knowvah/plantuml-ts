# Batch 3 — Ratchet in; correct the now-false docs

One task. This is the mission's acceptance gate.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Ratchet the three fixtures in; rewrite the documentation they falsify | typescript-pro | `oracle/goldens/svg-description/ratchet.json`, `oracle/goldens/svg-description/README.md`, `plans/svg-sprite-nanoparser/decisions.md` | T2 | [ ] |

## Batch exit criteria — this is the mission's acceptance gate

- All four quality gates green
- The three sprite fixtures are in `ratchet.json` and the ratchet suite
  passes with them included
- `oracle/goldens/svg-description/README.md` no longer claims they are
  deliberately un-ratcheted
- `plans/svg-sprite-nanoparser/decisions.md` § ADR-5 carries a dated
  amendment — **not** a silent rewrite
- 389 svg-class/object/state goldens byte-identical
- `npx tsx scripts/measure-description-size-deltas.ts` still 320/351,
  widened 0

## Measure, then pin — never the reverse

A ratcheted fixture is **held forever by design**. `ratchet.json` may only be
edited *after* a measured pass, never in anticipation of one (stop
condition 3). Measure with `compareSvg(ours, jar, 'deterministic')` —
**not** raw string equality; the ratchet normalizes `data-*` attributes and
rounds numerics, and measuring with `===` invents blockers that do not exist.

If a fixture does not pass, it stays out and its diff is recorded. That is a
documented outcome, not a failure to engineer around.

## Closing the mission

After T3 lands and gates pass:

1. Update `planning/mission-index.md` — close SI9, and move usecase
   90/90 → 93/93 **in the SI9 row only** ([ADR-4](../decisions.md#adr-4)).
   Do not retro-edit the A1 / S1L rows; those are dated historical
   measurements.
2. Note in the summary that SI8 (stdlib package registration) and SI10
   (class-engine `measureUsecase` coupling) remain open.
3. If any @knowvah/dot-engine finding surfaced during execution, file it under
   `docs/graphviz-issues/` with a tracker line before the mission closes — a
   finding that exists only in a mission ledger is not filed (CLAUDE.md).
