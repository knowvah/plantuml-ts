# F4-a — G3b internal sprite bundle

Agent: **typescript-pro**. Closes (subject to the licence gate below):
`turasu-73-zoni468`, `lesori-32-zeve057`, `ravodu-50-siso430`,
`tuliba-37-liza126` — **+4 → 344**.

## Context

`SYNTHESIS.md` G3b: `getSprite` (`src/core/sprite-commands.ts:132`) has no
`SpriteImage.fromInternal` fallback, and the `sprite $NAME
jar:archimate/business-function` command form (`SkinParam.java:795-800`,
`CommandSpriteFile.java:108-112`) is completely unported — no `sprite
$NAME <file>` grammar exists anywhere in `src/`. Together these mean the
jar-resident `/sprites/**` set (141 entries in the pinned oracle jar,
`unzip -l` verified — `sprites/archimate/interface.svg` present,
`sprites/Net.svg`/`.png` absent) can **never** resolve in this port, no
matter what the diagram `!include`s.

This task is a **prerequisite, not a standalone fix**: it carries no
fixture of its own (SYNTHESIS §1, G3b row: "0" fixtures). It exists so
F2-b's already-landed `buildStereo` sprite branch (M1, the `getSprite() !=
null → stereo = that sprite` replacement) has something jar-internal to
resolve. Four fixtures wait on it:

| fixture | needs | evidence |
|---|---|---|
| `turasu-73-zoni468` | `<<$archimate/interface>>` etc., no `!include` | `sprite.md` `turasu-73` record — TDevice alone is the reported 1.224826in (88.187px width) |
| `lesori-32-zeve057` | same archimate trio | `container-cluster.md` — B1 (this task) closes 0.242882 → 0.069444 residual (B2, already in F2-b) |
| `ravodu-50-siso430` | identical to lesori-32 | shares its exact delta and mechanism — one fix closes both |
| `tuliba-37-liza126` | `sprite $bFunction jar:archimate/business-function` — the `jar:` COMMAND form, not just an inline `<<$…>>` reference | `sprite.md` `turasu-73` record + `container-cluster.md` `tuliba-37` — the `jar:` form is the SECOND gap this task must close |

## Task

1. **`getSprite` internal-bundle fallback.** `src/core/sprite-commands.ts:132`
   currently returns only `registry.byName.get(name)` — a per-diagram hit.
   Add a fallback consulting a NEW internal sprite store when the per-diagram
   registry misses, mirroring `SkinParam.java:805`'s
   `SpriteImage.fromInternal`. The store must be reachable through the
   **synchronous** asset-store option F3-seam built (ADR-2) — the
   size-conformance harness renders synchronously with a pre-filled store,
   so a lazy-only `import()` channel leaves these four fixtures
   unmeasurable.
2. **`jar:` sprite-definition command form.** `matchSpriteCommand`
   (`src/core/sprite-commands.ts:428`) dispatches only the SVG single-line
   and multiline forms today (`SVG_SINGLE_LINE_RE` / `SVG_MULTILINE_START_RE`
   at the top of that function). Add the `sprite $NAME jar:<path>` grammar
   (`CommandSpriteFile.java:108-112`) — on match, register a reference into
   the same internal bundle rather than parsing inline pixel/SVG data.
3. **The vendored asset package.** Extract the pinned oracle jar's
   `/sprites/**` resource tree (141 files) into a NEW package under
   `assets/sprites/**`, following the `assets/stdlib/` precedent (see
   `scripts/stdlib-assets-store.ts` for the read pattern — Node `fs`,
   lives under `scripts/`, never `src/`). Build a manifest + loader that a
   caller can either await (lazy, browser default) or pre-fill
   synchronously (test/CI harness), same sync/async pair `includeStore`
   (sync) / `stdlibRegistry` (async) already establishes in `src/index.ts`.

## Write-set

| File | Change |
|---|---|
| `src/core/sprite-commands.ts` | `getSprite` internal fallback (`:132`); `jar:` grammar in `matchSpriteCommand` (`:428`) |
| NEW `assets/sprites/**` | vendored `/sprites/**` tree — **gated by F3-lic's verdict, see below** |
| NEW asset-store module (e.g. `src/core/internal-sprite-store.ts` or sibling to `tests/helpers/stdlib-assets-store.ts`'s pattern) | sync-fillable store + manifest reader, mirroring ADR-2's precedent |

Do NOT touch `EntityImageDescriptionDelegates.ts` — `buildStereo`'s sprite
branch is F2-b's write-set, already landed by the time this task runs.

## Read-set

| File:lines | Why |
|---|---|
| `src/core/sprite-commands.ts:1-145` | `getSprite`, `SpriteRegistry`, `Sprite`/`SpriteSvg` types |
| `src/core/sprite-commands.ts:400-460` | `matchSpriteCommand`, `registerSvg`, the SVG regex dispatch to extend |
| `src/index.ts:40-120, 300-380` | `includeStore`/`stdlibRegistry` sync/async pair — the pattern to mirror (ADR-2) |
| `scripts/stdlib-assets-store.ts` (whole file, ~120 lines) | the `assets/stdlib/` read pattern — bundle manifest, alias resolution, `derivePumlKey` |
| `tests/helpers/stdlib-assets-store.ts` | why the test-side re-export lives under `tests/helpers/`, not `scripts/` |
| `plans/s1l-tail-diagnosis/findings/sprite.md` `turasu-73` record | full M1+M2 arithmetic, jar-probed three-branch dims table |
| `plans/s1l-tail-diagnosis/findings/container-cluster.md` `lesori-32`/`ravodu-50`/`tuliba-37` records | B1/B2 split, the `jar:` form's second gap |
| `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:795-810` | `fromInternal` fallback semantics |
| `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java` | the `jar:` grammar and its `SpriteImage.fromInternal` call |
| F3-lic's completion summary (batch 3) | the per-set licence verdict — READ FIRST, before extracting anything |

## Architecture decisions binding this task

- **ADR-2**: build the internal sprite store as a dedicated, sync-fillable
  option mirroring `includeStore`/`stdlibRegistry`. F3-seam built the
  general seam; this task is one of its two consumers (F4-b is the other) —
  do not duplicate the seam, extend it.
- **ADR-9(a)** — BLOCKING GATE: "A licence-review task reports per-icon-set
  provenance **before any sprite asset lands**; a non-MIT-compatible set
  becomes a documented gap, never a silent vendored asset." F3-lic's
  per-set verdict is not optional input — it is a precondition. A set
  ruled `not-MIT-compatible` or `provenance-unknown` does NOT get
  extracted into `assets/sprites/**`. Its dependent fixtures (from the
  table above) stay open, and the fixture ledger reports fewer than +4 —
  that is a **correct, documented outcome**, not a task failure. Do not
  substitute a re-drawn or alternate icon set to force the +4 — that is
  not what was diagnosed and is out of this task's scope.
- **ADR-1**: never write `oracle/goldens/description/size-backlog.json`.

## Interface contracts

```typescript
// Extends the existing SpriteRegistry lookup with an internal-bundle
// fallback, consulted only after the per-diagram registry misses.
export interface InternalSpriteStore {
  get(path: string): Sprite | undefined; // path e.g. "archimate/interface"
}

// Synchronous variant — the size-conformance harness fills this before
// rendering (mirrors `IncludeStore`, ADR-2).
export function getSprite(
  registry: SpriteRegistry,
  name: string,
  internalStore?: InternalSpriteStore,
): Sprite | undefined;

// jar: grammar addition to matchSpriteCommand's dispatch — registers a
// reference sprite (no inline pixel/SVG payload), resolved later through
// InternalSpriteStore.
// sprite $NAME jar:<bundlePath>
```

`RenderOptions` (or wherever `includeStore`/`stdlibRegistry` are declared)
gains an `internalSpriteStore?: InternalSpriteStore` option, synchronous —
no `Promise`.

## Acceptance criteria

1. **Given** `<<$archimate/interface>>` with no `!include`, **when** the
   store is pre-filled synchronously, **then** `getSprite` returns the
   19×19 sprite and `turasu-73`/`lesori-32`/`ravodu-50` measure conformant
   (`<= 0.01in`).
2. **Given** `sprite $bFunction jar:archimate/business-function`, **when**
   parsed, **then** `matchSpriteCommand` registers a reference resolvable
   through the internal store, and `tuliba-37` measures conformant.
3. **Given** F3-lic rules one icon set non-MIT-compatible, **when** F4-a
   runs, **then** that set is NOT extracted into `assets/sprites/**`, its
   dependent fixture(s) stay pinned in `size-backlog.json` (unchanged by
   this task per ADR-1), and the completion summary states which fixtures
   did not close and why.
4. **Given** no `internalSpriteStore` option is passed (default browser
   path), **when** a diagram references a jar-internal sprite, **then**
   the behavior degrades exactly as it does today (unresolved sprite,
   literal `«name»` text) — the lazy-default path must not change without
   the caller opting in.
5. **Given** the full 351-fixture description ratchet, **when** re-run
   after this task, **then** `widened == 0` and the closed-fixture count
   matches the licence-gated subset of the four listed above.

## Quality bar

Per README + `batch-4/overview.md`. Additionally:
- `npx tsx scripts/measure-description-size-deltas.ts` — the four fixtures
  (or the licence-gated subset) move to conformant; no other fixture widens.
- Full `npm test` — this task adds a new module; cover `getSprite`'s
  fallback branch and the `jar:` grammar with unit tests per
  `~/.claude/rules/testing.md`'s TDD discipline (write the test first).
- 90/90/90 coverage floor (`~/.claude/rules/testing.md`) on all new code.

## Observability

- The completion summary must state, per icon set: extracted / gap
  (with F3-lic's verdict cited) — this is the only record of the
  licence-gate decision surfacing into this batch.
- If a sprite reference in a diagram cannot resolve through either channel
  (per-diagram registry or internal store), the existing `onWarning`
  channel (`surfaceSpriteWarnings`, `sprite-commands.ts:117`) is the
  precedent — extend it to cover an unresolved `jar:`-form reference if a
  reasonable one-line addition; do not build a new warning channel for
  this alone.

## Rollback classification

**Not fully reversible by a git revert once any wrongly-licensed asset has
been committed and pushed** — this is exactly why F3-lic's review is a
BLOCKING gate rather than advisory (ADR-9, decisions.md's own consequence
statement). A revert removes the file from `HEAD`; it does not remove it
from git history, which may already have propagated to forks/clones. Treat
`assets/sprites/**` as write-once-after-licence-clearance: do not commit
any file in that tree without F3-lic's per-set verdict recorded in the
same commit's body.

## Boundaries

**Always do**
- Wait for F3-lic's verdict before extracting any file into `assets/sprites/**`.
- Cite F3-lic's verdict per set in the commit body.
- Keep the internal store optional/sync-fillable — never make it a hard
  runtime dependency of the default browser bundle.

**Ask first**
- If F3-lic's report is ambiguous for a set (neither clearly cleared nor
  clearly rejected) — do not interpret it yourself.
- If closing all four fixtures requires touching
  `EntityImageDescriptionDelegates.ts` (F2-b's file) — that signals F2-b's
  sprite branch is incomplete, which is a cross-task boundary violation,
  not a call this task makes alone.

**Never do**
- Never commit a sprite asset whose licence F3-lic did not clear.
- Never write `oracle/goldens/description/size-backlog.json` (ADR-1).
- Never substitute a re-drawn/alternate icon to force fixture closure.

## Commit format

`fix(F4-a): add internal sprite bundle + jar: sprite command form`

Body (required, >3 files change): cite F3-lic's per-set verdict, list
which of the four fixtures closed vs. stayed a documented gap.
