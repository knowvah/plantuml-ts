# T2 — Scan a source for the sprite names it references

## Context

See [ADR-4](../decisions.md#adr-4).

Verified against the current call graph: sprites are registered at PARSE time
by `matchSpriteCommand`, called from each diagram plugin's parser over
already-preprocessed lines. `addSprite` is `byName.set`
(`sprite-commands.ts:71`), `getSprite` is `Map.get` (`:78`) — both
synchronous, and `renderSync` must stay synchronous. There is no `await` at
lookup, so loading cannot be demand-driven. It must be **prefetch-driven off
a `<$name>` scan**, and this task is that scan.

Built **in isolation**: nothing routes through it yet (T4 wires it).

## Task

Create `src/core/sprite-prefetch.ts` exporting `scanSpriteNames(source)`,
returning the distinct sprite names the source references.

**Reuse the existing pattern.** `creole-atoms.ts:250` already defines
`SPRITE_PATTERN_SOURCE`, mirroring `Splitter.spritePattern`
(Splitter.java:74) with `SpriteUtils.SPRITE_NAME` = `[-\p{L}0-9_/]+`:

```
'<(#[A-Za-z0-9_]+)?\\$([-\\p{L}0-9_/]+)((?:[{,]?…)?)>'
```

Group 1 is the forced-colour prefix, **group 2 is the name**, group 3 the
optional `{scale=N,color=X}` block. Export it from `creole-atoms.ts` and
import it — **do not write a second regex.** SI11a lost a task to a stop
because the `Stdlib.java` key transform was private and duplicating it was
forbidden; two answers to "what is a sprite reference?" is how this port
drifts from the jar.

Names are matched case-insensitively against the manifest, which is all
lowercase (ADR-3).

## Write-set — write NOTHING outside these

- `src/core/sprite-prefetch.ts` (create)
- `src/core/creole-atoms.ts` (**modify — add an export, change nothing else**)
- `tests/unit/sprite-prefetch.test.ts` (create)

Do NOT export from `src/index.ts` — T3 owns that file in this batch.
Do NOT touch `include-resolver.ts` — T4 owns it.

## Read-set

- `src/core/creole-atoms.ts:245-255` — `SPRITE_PATTERN_SOURCE` and its
  Splitter.java citation. **Line numbers drift — follow the code.**
- `src/core/creole-atoms.ts:403-450` — how the pattern is applied per line
  today, including the `<img>` / `<&openiconic>` siblings you must NOT match
- `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/in.puml` — a
  REAL fixture using `<$bi-globe>` and `<$bi-globe,scale=2.5>`

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4) — prefetch-driven scan; reuse the pattern
- [ADR-3](../decisions.md#adr-3) — names are lowercase; path by convention

## Interface contract (consumed by T4)

```ts
export function scanSpriteNames(source: string): ReadonlySet<string>;
```

Returns names WITHOUT the `$`, lowercased, deduplicated. Never throws — a
source with no sprite references yields an empty set.

## Acceptance criteria

1. Given `<$bi-globe>` and `<$bi-globe,scale=2.5>` in one source, when
   scanned, then the result is exactly one name, `bi-globe` — scale and
   colour variants collapse to the same sprite.
2. Given `<#FF0000$bi-globe>`, then the forced-colour prefix is stripped and
   the name is `bi-globe`.
3. Given `<img src=…>` and `<&openiconic>` atoms, then neither is matched —
   only `<$…>` is a sprite reference.
4. Given the repo after this task, then **exactly one** sprite-reference regex
   exists — assert by grepping, or by importing the same exported constant in
   the test.
5. Given a source with no sprite references, then the result is an empty set
   and nothing throws.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/unit/sprite-prefetch.test.ts` clean. Do NOT run the full `npm test`.

Tests assert specific values and set contents, never truthiness.

## Observability

N/A — a pure function, no observable operations. Its output feeds the fetch
count a consumer measures at the `IncludeFetcher` seam (ADR-5 of SI11a).

## Rollback

**Reversible** — revert the commit. The module is unreferenced until T4.

## Boundaries

**Never:** import a Node built-in, touch `process.env`, or use `require()`.
Never write a second sprite-reference regex. Never change `creole-atoms.ts`
beyond adding the export — its matching behavior is pinned by existing tests.

## Method rules

1. **Trace dependency cascades TWO levels.** `creole-atoms.ts` is consumed by
   `creole-atoms-measure.ts`, `DisplayCreole.ts` and the description image
   path; adding an export is inert only once you have checked nothing
   re-exports a colliding name.
2. **Verify the pattern's real behavior against the fixture**, not against its
   doc comment — `sprite-svg-bootstrap-0/in.puml` exercises the scale variant.

## Commit

One commit: `feat(T2): scan a source for referenced sprite names`
