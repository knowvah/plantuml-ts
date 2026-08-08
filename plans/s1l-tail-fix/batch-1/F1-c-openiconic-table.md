# F1-c — G11 OpenIconic glyph table

## Context

`plantuml-ts` is a TypeScript port of upstream PlantUML (`~/git/plantuml`,
Java). This task is part of the `s1l-tail-fix` mission, batch 1 — see
`../README.md` for mission-wide gates/stop-conditions and `../decisions.md`
for the nine binding ADRs.

**This task books zero conformance gain on its own.** Its one fixture,
`vivido-49-nisu863`, has three non-conformant nodes: node 2 is this task's
mechanism (an OpenIconic `<&cloud>` glyph); nodes 0 and 1 are a *different*
mechanism (G10, the url-label sprite scale factor, M3 in
`../s1l-tail-diagnosis/findings/sprite.md`) that closes in **F2-c** (batch
2). The fixture only becomes conformant once **both** land. **Do not read
"+0" as this task having failed or being incomplete** — it is the mission's
one fully-disjoint group (SYNTHESIS §8: "F1-c is fully disjoint — the only
group overlapping nothing. It can run in any batch"), scheduled here purely
because it has no ordering constraint with anything else.

## Task

`src/core/openiconic-glyphs.ts`'s `RAW_GLYPHS` table holds 6 of upstream's
~223 OpenIconic glyph names (`x`, `key`, `ban`, `caret-right`,
`link-intact`, `thumb-up` — `openiconic-glyphs.ts:60-88`). When
`buildOpenIconSpan` (`creole-atoms-openicon.ts:39-50`) encounters a name not
in that table, it returns `{ start, end }` with **no atom** — the markup is
consumed (so parsing doesn't break) but the glyph's advance width is lost
entirely, per its own doc comment (`:30-38`): *"an UNRECOGNIZED glyph name
… is dropped entirely (no atom, no fallback text), matching
`OpenIconic.retrieve`'s null-on-missing-resource … the SAME 'unknown name
contributes nothing' rule … `creole-atoms.ts#buildSpriteSpan`'s own doc
comment documents for `<$sprite>`."*

That "unknown ⇒ no atom" policy is **upstream's own real behavior** and is
already correctly implemented — it must be preserved exactly, unchanged,
for whatever names remain absent after this task. The defect is only that
the table is too small: `<&cloud>` (and ~217 other names) are legitimate,
resolvable OpenIconic glyphs in the jar, not truly-unknown names.

Extend `RAW_GLYPHS` toward upstream's full set, sourced from each glyph's
own literal SVG resource at
`~/git/plantuml/src/main/resources/openiconic/<name>.svg` — **not**
scraped from jar SVG output. This mission's "the long tail is the
deliverable" principle (`CLAUDE.md`) applies directly: adding only `cloud`
(the one name this batch's pinned fixture needs) would pass today's
corpus but leave every other OpenIconic name silently broken for the next
fixture that hits it. Add the full upstream set.

Each glyph is `{ d: string; translateX?: number }` — a raw SVG path `d`
string transcribed verbatim from the source SVG, plus an optional
`translateX` for the rare glyph whose source SVG carries its own
`transform="translate(N)"` (only `caret-right` does, among the existing 6 —
verify this per-glyph, it is not assumed for the new entries). The existing
6 are individually jar-verified against 5 independent samples spanning 4
distinct `factor` values (`openiconic-glyphs.ts:25-41`'s module doc
comment) — hold every new entry to the same bar: this is data transcription,
not new logic, so the geometry pipeline (`decipher` → `parseMovements` →
`toAbsolute` → `formatOp`) needs no changes at all.

## Write-set

- `src/core/openiconic-glyphs.ts` — extend `RAW_GLYPHS` (`:60-88`) with the
  full upstream OpenIconic name set.
- `src/core/creole-atoms-openicon.ts` — only if the "unknown name" policy
  needs a documentation update reflecting the larger table; the branching
  logic at `:44` (`if (!isKnownOpenIconicGlyph(name)) return { start, end
  };`) is already correct and should not change behaviorally.

## Read-set

- `src/core/openiconic-glyphs.ts` (whole file, 460 lines) — the module doc
  comment (`:1-42`, upstream sources and the geometry formula derivation),
  `RAW_GLYPHS` (`:60-88`), `isKnownOpenIconicGlyph` (`:95-97`),
  `openIconicFactor`/`openIconicDims`/`openIconicOriginY` (`:372-412`, the
  jar-verified sizing formulas your new glyphs' dimensions will be computed
  through unchanged), `buildOpenIconicPathD`/`formatOp` (`:427-459`, the
  emission you are supplying new `d`/`translateX` data for).
- `src/core/creole-atoms-openicon.ts` (whole file, 70 lines) — the
  `OPENICON_PATTERN_SOURCE` regex (`:26-28`) and `buildOpenIconSpan`
  (`:39-50`), the exact "unknown name" branch (`:44`).
- `~/git/plantuml/src/main/resources/openiconic/*.svg` — the literal
  8×8-viewBox source SVGs, one `<path>` per icon
  (credit github.com/iconic/open-iconic, MIT — cited in
  `openiconic-glyphs.ts:1-9`'s own doc comment).
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/
  OpenIconic.java` — the resource loader, for the authoritative name list
  (its resource directory listing is the ground truth for "upstream's full
  set", not a guess at ~223).
- `../s1l-tail-diagnosis/findings/sprite.md` (`vivido-49-nisu863` record) —
  the full per-node arithmetic, including the isolation proving node 2's
  −11.333px width error is entirely this mechanism and independent of
  nodes 0/1's M3 (url-label sprite scale) error.

## Architecture decisions that bind this task

- **ADR-1** — do not write `size-backlog.json`. This task closes no pin
  directly, so there is nothing to report as closed — but confirm in your
  completion summary that you verified this (do not silently assume it).
- None of the other eight ADRs directly govern this task; it is the
  mission's only fully-disjoint group. If you discover a dependency on
  another task's write-set while working, STOP and log it to
  `../decision-journal.md` — that would contradict SYNTHESIS's own
  "fully disjoint" classification and needs maintainer visibility.

## Interface contracts

No downstream task consumes new exports from this task specifically — G10
(F2-c) and G11 (this task) are independently diagnosed and independently
fixed; they only share one fixture's node set, not any code. Keep
`isKnownOpenIconicGlyph`'s signature (`(name: string) => boolean`) and
`buildOpenIconicPathD`'s signature unchanged — both are called from
`creole-atoms-measure.ts`/render paths outside this task's write-set, and
changing either signature would be an out-of-write-set edit.

## Acceptance criteria

1. **Given** `<&cloud>` in a creole line (`rectangle "aa<&cloud>"`), **when**
   scanned, **then** `scanLineForAtoms` returns an `openiconic` atom (not an
   empty span) and the measured width matches the jar's 46.908px
   (`20 + 15.575 + 11.333`), reproducing
   `openIconicDims(openIconicFactor(1, 14)) = 11.3333` exactly — this is
   the existing formula, unchanged; only the glyph now resolves.
2. **Given** `vivido-49-nisu863`'s node 2 (`<&cloud>` in a link), **when**
   measured through `measureLeafNode`, **then** node 2's width error drops
   from −11.333px to 0px — verify this **in isolation** from nodes 0/1
   (which remain open pending F2-c); do not report the fixture as
   conformant.
3. **Given** the extended `RAW_GLYPHS` table, **when** every new entry is
   run through `buildOpenIconicPathD` at `factor = 1` (fontSize 12, scale
   1), **then** the emitted path data is byte-identical to the source SVG's
   own `d` attribute (accounting for the documented `Z`-dropping and
   `A`-command `rx`/`ry`-only scaling already implemented) — spot-check at
   least 5 new glyphs against their source SVGs the same way the existing 6
   were verified (`openiconic-glyphs.ts:25-41`'s doc comment).
4. **Given** a still-unrecognized glyph name (if any remain after
   extension, or a deliberately malformed test name), **when** scanned,
   **then** `buildOpenIconSpan` still returns a no-atom span — the
   "unknown ⇒ no atom" policy must be provably unchanged, not merely
   assumed unchanged.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts
npx tsx scripts/audit-size-metric-identity.ts
```

Never pipe a gate — capture `$?` directly. Expect the description size
harness to report **no change in conformant count** from this task alone —
`vivido-49-nisu863`'s reported delta should shrink (its node-2 component
resolves) but the fixture stays non-conformant until F2-c lands. **`widened
> 0` on any ratchet is a STOP condition.** Because `creole-atoms*` is
cross-engine (shared by class/state/object), also re-run those three size
ratchets per `../README.md`'s note that tasks touching `creole-atoms*`
require it.

## Observability

N/A — pure data table extension plus existing, unchanged sizing/rendering
functions. No logging, metrics, or externally observable operations are
introduced.

## Rollback

Reversible. Adding entries to a static lookup table; no schema, no
migration, no persisted state.

## Boundaries

**Always do:**
- Verify each new glyph's transcription against its own source SVG, not
  against a batch script's assumed correctness.
- Use Serena MCP tools for navigation, not the LSP tool.
- Confirm and state in your completion summary that this task closes zero
  pins alone (per ADR-1's reporting requirement — "nothing to report" is
  itself a fact to report, not a silent no-op).
- Re-run the class/state/object size ratchets (this file is cross-engine).

**Ask first:**
- If upstream's OpenIconic resource directory is significantly larger than
  ~223 names and full transcription would make this task disproportionately
  large relative to its single-fixture yield — flag the scope, do not
  silently truncate the table.

**Never do:**
- Write `oracle/goldens/description/size-backlog.json`.
- Run any state-mutating git command.
- Declare a divergence.
- Regenerate any existing golden.
- Report `vivido-49-nisu863` as closed.
- Change `isKnownOpenIconicGlyph` or `buildOpenIconicPathD`'s signatures.

## Commit

`fix(F1-c): extend OpenIconic glyph table toward upstream's full set`

Body (required — touches 2 files, and the "+0 alone" result is
counterintuitive enough to need the explicit why): name `vivido-49-nisu863`
as the fixture this unblocks jointly with F2-c, state the glyph count
added, and confirm the "unknown ⇒ no atom" policy was verified unchanged.
