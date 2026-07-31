# T3 — The sprite-collision warning and the two new option fields

## Context

See [ADR-7](../decisions.md#adr-7) and [ADR-5](../decisions.md#adr-5).

The sprite NAME namespace is flat and global per diagram — `addSprite` is
`byName.set`, last-write-wins — so two collections both defining `$star`
collide **silently**. That is upstream `SkinParam.sprites` behavior and
SI11a's ADR-7 said document-don't-fix; the maintainer asked for a warning.

The measured constraint that shapes this task:
`SpriteRegistry.skippedColorSprites` already collects diagnostics **and is
surfaced nowhere** — asserted in exactly one unit test
(`tests/unit/sprite-commands.test.ts:214`). Copying that pattern alone would
build a warning no consumer ever sees, which is the failure mode this task
exists to avoid.

## Task

1. `SpriteRegistry` gains `collisions: string[]`, mirroring
   `skippedColorSprites` — one line in `createSpriteRegistry`, one push in
   `addSprite` when the name is already present.
2. `RenderOptions` gains two OPTIONAL fields:
   - `onWarning?: (message: string) => void` — invoked after parse with each
     collision (ADR-7)
   - `sprites?: readonly string[]` — the escape hatch for sprite names the
     `<$name>` scan cannot see because a macro produced them (ADR-5b)
3. Thread `onWarning` so collisions recorded during parse are surfaced.

The collision message must name **both** origins — "which sprite won" is the
only actionable part. `sprites` is DECLARED here and CONSUMED by T4; this task
does not read it.

## Write-set — write NOTHING outside these

- `src/core/sprite-commands.ts` (modify)
- `src/index.ts` (modify)
- `tests/unit/sprite-commands.test.ts` (modify — EXTEND, do not weaken)

Do NOT touch `include-resolver.ts` (T4) or `creole-atoms.ts` (T2).

## Read-set

- `src/core/sprite-commands.ts:48-80` — `SpriteRegistry`,
  `createSpriteRegistry`, `addSprite`, `getSprite`, and the
  `skippedColorSprites` precedent. **Line numbers drift — follow the code.**
- `src/index.ts` — `RenderOptions` and its existing optional seams
  (`stdlibRegistry`, `measurer`, `fetcher`) — match their idiom and comment
  style
- `tests/unit/sprite-commands.test.ts:214` — the one existing
  `skippedColorSprites` assertion

## Architecture decisions (locked)

- [ADR-7](../decisions.md#adr-7) — collect on the registry, surface via
  callback. **`process.env.NODE_ENV` is forbidden** (stop condition 1) and a
  gated `console.warn` is rejected as an uninterceptable global side effect.
- [ADR-5](../decisions.md#adr-5) — `sprites` is the escape hatch, not a
  whole-file fallback

## Interface contract (consumed by T4)

```ts
interface SpriteRegistry {
  readonly byName: Map<string, Sprite>;
  readonly skippedColorSprites: string[];
  readonly collisions: string[];          // NEW
}
interface RenderOptions {
  onWarning?: ((message: string) => void) | undefined;   // NEW
  sprites?: readonly string[] | undefined;               // NEW
}
```

## Acceptance criteria

1. Given two sprites registered under one name, when parsed, then
   `collisions` records it once and `onWarning` is called **exactly once**
   with a message naming the sprite and both origins.
2. Given no `onWarning`, then registration behaves exactly as today — assert
   the existing registry tests still pass unmodified, and that nothing is
   thrown or logged.
3. Given a single sprite per name, then `collisions` stays empty and
   `onWarning` is never called.
4. Given `src/index.ts` after this task, then it is **≤ 500 lines** — it is at
   the cap now, so budget before writing.
5. Given `RenderOptions`, then both new fields are optional and every existing
   caller compiles untouched.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/sprite-commands.test.ts` clean, plus `wc -l src/index.ts` ≤ 500.
Do NOT run the full `npm test`.

Criterion 2 is the regression guard: the eager path must be bit-for-bit
unaffected when the callback is omitted.

## Observability

**This task IS the mission's consumer-facing diagnostic seam.** There is no
service, no metrics pipeline and no dashboard. `onWarning` is how a consumer
learns about a silent collision, and it is reusable later for
`skippedColorSprites` and for ADR-5(a)'s macro-miss reporting — neither of
which has a channel today. Document that in the exported doc comment.

## Rollback

**Reversible** — revert the commit. Both option fields are optional, so no
caller that predates them can break.

## Boundaries

**Never:** read `process.env` (stop condition 1's named temptation for this
task), call `console.warn`/`console.log` from `src/`, or make either new
field required. Never change `getSprite`/`addSprite` semantics — last-write-
wins is upstream behavior and stays.

## Method rules

1. **Trace dependency cascades TWO levels.** `SpriteRegistry` is constructed
   in `dot/parser.ts`, `board/parser.ts` and the activity path, and consumed
   by `Stereotype.ts` and the description image chain. An added field is inert
   only once every constructor site is checked.
2. **Verify that `onWarning` actually reaches a consumer** by test — the
   `skippedColorSprites` precedent proves a collected-but-unsurfaced
   diagnostic is easy to ship by accident.

## Commit

One commit: `feat(T3): warn on sprite name collisions via an opt-in callback`
