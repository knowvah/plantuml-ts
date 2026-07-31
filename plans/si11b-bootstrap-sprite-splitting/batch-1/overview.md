# Batch 1 — Splitter + wiring; the `<$name>` scan; the collision warning

Three tasks, genuinely parallel. Disjoint write-sets, and none consumes
another's output within this batch.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Sprite splitter, MIT allowlist, and its generator wiring | typescript-pro | `scripts/split-sprite-bundle/split.ts`, `scripts/split-sprite-bundle/allowlist.ts`, `scripts/build-stdlib-packages/package-specs.ts`, `scripts/build-stdlib-packages.ts`, `tests/unit/split-sprite-bundle.test.ts` | — | [x] |
| T2 | `<$name>` scan over source | typescript-pro | `src/core/sprite-prefetch.ts`, `src/core/creole-atoms.ts` (export only), `tests/unit/sprite-prefetch.test.ts` | — | [x] |
| T3 | Collision warning + the two new `RenderOptions` fields | typescript-pro | `src/core/sprite-commands.ts`, `src/index.ts`, `tests/unit/sprite-commands.test.ts` | — | [x] |

## Why these three are independent

T1 is `scripts/` (Node built-ins fine). T2 and T3 are both `src/` but touch
**different files**: T2 owns `sprite-prefetch.ts` + a one-line export from
`creole-atoms.ts`; T3 owns `sprite-commands.ts` + `index.ts`. They agree only
on shapes fixed below.

**Do not let the `scripts/` vs `src/` distinction blur: a Node import
reaching `src/` is a STOP.**

## The one lesson baked into T1's shape

**The splitter and its generator wiring are ONE task, deliberately.** SI11a
split the equivalent work (emitter in T5, wiring nowhere) and the emitters
shipped unreferenced — `npm run build:stdlib` produced nothing, the tests
passed anyway because they called the emitter directly, and it cost a
stop-condition-12 escalation to repair. T1's acceptance criterion 4 exists
solely to prevent a repeat: it asserts the BUILD emits, not that the function
works.

## Shapes the batch agrees on

```ts
// T1 emits, T5 packages, T4 consumes:
interface SpriteSplitManifest {
  readonly name: string;        // 'bootstrap1.13.1'
  readonly sprites: readonly string[];  // sorted, lowercase; path = `sprites/${name}.puml`
}

// T2 produces, T4 consumes:
function scanSpriteNames(source: string): ReadonlySet<string>;

// T3 declares, T4 consumes:
interface RenderOptions {
  onWarning?: ((message: string) => void) | undefined;
  sprites?: readonly string[] | undefined;
}
```

Path is derived by CONVENTION (`sprites/<name>.puml`), not carried — that is
[ADR-3](../decisions.md#adr-3) and it inverts SI11a deliberately.

## Batch exit criteria

- All quality gates green, including `vendor-stdlib --verify` **unchanged and
  still reporting 34,587 files verbatim** — ADR-1 means this task set must not
  move it at all
- T2's module is integration-free — nothing routes through it yet (T4 wires it)
- `src/index.ts` ends ≤ 500 lines
- 389 svg goldens byte-identical; the 54-fixture ratchet zero-diff

## Sequencing note for the orchestrator

All three can move `npm test`. Run gates after all three return and attribute
any failure before committing — **commit per task, not per batch.**
