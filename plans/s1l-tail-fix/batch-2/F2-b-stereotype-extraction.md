# F2-b — G3-M1 + G7 stereotype extraction

## Context

`plantuml-ts` is a TypeScript port of PlantUML's descriptive-diagram engine.
Two independent gaps share one function family and are merged into a single
task by ADR-6: (G7) the stereotype-label regex admits characters upstream
excludes, and (G3-M1) a stereotype whose whole content is a `<$sprite>`
token is rendered as literal text instead of replaced by the sprite's own
TextBlock. Both routes through `extractNodeStereotype` /
`StereotypeDecoration#buildComplex` / `buildStereo`.

**Required reading before touching anything:** `planning/usymbol-composition.md`
and `planning/sizer-renderer-parity.md` — `CLAUDE.md` marks both mandatory
for any sizing bug in any engine. `~/.claude/rules/diagnosis.md` (this is a
diagnosed defect — do not re-diagnose), `~/.claude/rules/testing.md`,
`~/.claude/rules/testability.md`.

## Task

**(G7) Stereotype regex.** `parse-helpers-strings.ts:268`'s hand-written
`extractNodeStereotype` uses `/<<\s*(.+?)\s*>>/g`, whose `.` matches `<` and
`>`. Upstream's `Stereotype#getMultipleLabels` uses
`<<\s?((?:<&\w+>|[^<>])+?)\s?>>` — angle brackets are EXCLUDED except for an
OpenIconic `<&name>` escape. After the preprocessor expands a macro to
`<U+00B5>Service`, upstream's pattern matches nothing (no stereotype at all,
`stereo = TextBlockUtils.empty(0,0)`); ours captures the whole
`<U+00B5>Service` run and measures an extra row.

Fix by adopting the already-ported pattern at
`src/core/stereo/Stereotype.ts:67` rather than maintaining a second
hand-written regex — read that file first; if its exported pattern is
directly reusable, import it instead of re-deriving the regex text.

**(G3-M1) `buildStereo` sprite + empty-label branches.**
`EntityImageDescriptionDelegates.ts:337`'s `buildStereo` implements only
upstream's THIRD branch (`«label»` text join) — no
`stereotype.getSprite(skinParam)` branch, and no `StereotypeDecoration
#buildComplex` empty-label rewrite. Two upstream behaviors are missing:

1. When a stereotype resolves to a sprite (`stereotype.getSprite(skinParam)
   !== null`), the sprite's TextBlock REPLACES the whole stereo block —
   every other stereotype label on the entity is dropped, not concatenated.
2. `StereotypeDecoration#buildComplex` rewrites the label to `""` when a
   `circleSprite` pattern matches with an EMPTY `LABEL` group
   (`java:156-160`) — e.g. `<<$Net>>` where `$Net` is unresolvable
   (`Stereotype#getSprite` returns null): `getLabels()` then returns an
   EMPTY list and the caller takes its `TextBlockUtils.empty(0,0)` branch.
   The stereotype contributes NOTHING, not a literal `«$Net»` text row.

Route `extractNodeStereotype` through the already-ported, currently unused
`src/core/stereo/StereotypeDecoration.ts#buildComplex` (read it before
writing anything — it exists; do not reimplement it, per `CLAUDE.md`'s
"reuse targets" trap) instead of pushing the raw inner text. Add a
`getSprite()` branch to `buildStereo` and thread `spriteName` through the
AST so it reaches the sizer (`leaf-sizing-entity.ts`) and the renderer
(`EntityImageDescriptionDelegates.ts`) in lockstep, per
`planning/sizer-renderer-parity.md`.

**ADR-6 verification requirement — do not assume, measure.** ADR-6 records
that routing through `buildComplex` "very likely" adopts upstream's
`<`/`>`-excluding pattern and closes G7 as a side effect. **Verify this
against `junoxu-15-gori632` directly — run the fixture through the fixed
pipeline and confirm its delta is 0, do not infer it from the regex
change alone.** If it does NOT close, this same task finishes G7 explicitly
(the two fixes must not be split into a second task — ADR-6 assigns one
owner).

## Write-set

- `src/diagrams/description/parse-helpers-strings.ts`
- `src/core/svek/image/EntityImageDescriptionDelegates.ts`
- `src/diagrams/description/ast.ts`
- `src/diagrams/description/leaf-sizing-entity.ts`

## Read-set

- `src/diagrams/description/parse-helpers-strings.ts:248-280`
  (`extractNodeStereotype`, current regex, backtracking doc comment on why
  the ALL-tags-in-one-run behavior must be preserved)
- `src/core/stereo/Stereotype.ts:60-75` (the already-ported, correct
  `<`/`>`-excluding pattern — the reuse target for G7)
- `src/core/stereo/StereotypeDecoration.ts` (full file — `buildComplex`,
  currently unused; the reuse target for G3-M1's empty-label rewrite)
- `src/core/svek/image/EntityImageDescriptionDelegates.ts:280-346`
  (`buildTextBlock`, `buildStereo` and the doc comment on :335-336 stating
  which upstream branch is missing)
- `src/diagrams/description/ast.ts:1-70` (`DescriptiveNode` —
  `stereotype`/`stillUnknown` field docs; add `spriteName` alongside
  `stereotype` following the same "never an empty array" convention)
- `src/diagrams/description/leaf-sizing-entity.ts:120-153` (`EntityLeafCtx`,
  `sizingFontConfig`, `sizingPaint` — the params object G3-M1's sprite name
  must reach)
- `src/core/sprite-commands.ts:100-140` (`getSprite` — confirm the
  per-diagram registry lookup shape `buildStereo`'s new branch calls into;
  note :132's doc comment already records the jar-internal-bundle gap as
  OUT of this task's scope — that is F4-a, not F2-b)
- `../s1l-tail-diagnosis/findings/container-cluster.md` — `junoxu-15-gori632`
  record (full mechanism, causal chain, ruled-out list — the G7 verification
  target)
- `../s1l-tail-diagnosis/findings/sprite.md` — `nobiza-91-fimo741` record,
  mechanism (a) (the G3-M1 dominant mechanism, its three-branch jar probe:
  `<<$Net>>` unknown → `0.655729 × 0.472222`; `<<$archimate/interface>>`
  resolvable → `0.655729 × 0.736111`; `<<Net>>` plain text →
  `0.824479 × 0.666667`)
- `../s1l-tail-fix/decisions.md` — ADR-6 (full text)

## Architecture decisions binding this task

- **ADR-6:** one function, one owner for `extractNodeStereotype` — both G3-M1
  and G7 land in this single task. G7's closure via `buildComplex` is
  VERIFIED against `junoxu-15`, never assumed.
- **ADR-4 precedent (read `opts?.fontSize ?? NOTE_FONT_SIZE`, don't touch
  the collapse site)** does not directly apply here, but its general
  principle does: keep this task's blast radius contained to the four listed
  files. Do NOT touch `leaf-sizing.ts` (F1-a's/F3's territory) even though
  `nobiza-91`'s residual note-height cause (b) lives there — that closes via
  F1-a, not this task. This task's `nobiza-91` contribution is mechanism (a)
  only (the sprite-as-stereotype rewrite).

## Interface contracts

- **`leaf-sizing-entity.ts` output** is consumed by F3 (Batch 3, the
  `BoxSizingOpts` channel thread) — do not change `EntityLeafCtx`'s field
  names or remove existing fields; add `spriteName`/sprite-dims plumbing
  additively.
- **`EntityImageDescriptionDelegates.ts` output** is consumed by F4-b
  (Batch 4, Twemoji emoji artwork) — `buildStereo`'s new sprite branch must
  keep its existing signature-compatible shape (same return type `TextBlock`)
  so F4-b's later edits to the same function don't need to re-derive the
  contract.
- **F4-a is semantically downstream of this task, not the reverse.** F4-a's
  jar-internal `/sprites/**` bundle (Batch 4) resolves sprite NAMES that
  this task's `getSprite()` branch is the only consumer of — F4-a's work has
  no consumer until this task lands. Do not attempt to pre-build F4-a's
  asset bundle here; stub/no-op is correct for a still-unresolvable sprite
  name (matches upstream: `Stereotype#getSprite` returns null → the
  empty-label rewrite path, not a crash).

## Acceptance criteria

1. **Given** the fixture that expands a macro to `<<<U+00B5>Service>>`
   (`junoxu-15-gori632`), **when** parsed with the new regex, **then**
   `extractNodeStereotype` returns no stereotype match (empty result,
   matching upstream's `[]`) and the node's box is `0.655729 × 0.611111`
   in — DELTA 0 against the jar. If this is NOT already true after the G7
   regex change alone, add the explicit fix here per ADR-6 before closing
   this criterion.
2. **Given** `rectangle "First" <<$Net>>` where `$Net` is unresolvable
   (`nobiza-91-fimo741`'s node 0), **when** parsed, **then** the stereotype
   block contributes ZERO width/height (empty-label rewrite fires) and the
   node's box is `47.2125 × 34` — matching the jar's `0.655729 × 0.472222`.
3. **Given** `<<$archimate/interface>>` where the sprite IS resolvable via
   the per-diagram registry (a `!include`d stdlib, not the jar-internal
   bundle), **when** parsed, **then** `buildStereo` returns the sprite's
   TextBlock in place of the text label, and any OTHER stereotype label on
   the same entity (e.g. a co-occurring `<<verb>>`) contributes nothing —
   matching the jar's "sprite replaces the whole stereo block" rule.
4. **Given** a plain `<<Net>>` (no `$` sigil, ordinary text stereotype) on
   the same entity shape, **when** parsed, **then** behavior is UNCHANGED
   from current — `«Net»` renders and measures exactly as before (regression
   guard: the third, already-ported branch must not regress).
5. **Given** the full 351-fixture description corpus, **when** measured,
   **then** no previously-conformant fixture becomes non-conformant
   (`widened === 0`) — the regex tightening is the highest-risk part of this
   task (SYNTHESIS: "blast radius is every description element carrying a
   stereotype").

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count RISES
npx tsx scripts/audit-size-metric-identity.ts
```
Never pipe a gate — capture `$?` directly. **`widened > 0` is a STOP
condition.** This task is description-only for the size ratchet — no
cross-engine re-run required (the sprite-registry lookup path is
description-specific; `EntityImageDescriptionDelegates.ts` is not shared
with class/state/object).

## Observability

N/A — no new observable operations. Internal parser/sizer/renderer change,
no new logging, metrics, or external interface.

## Rollback

Reversible. All four write-set files revert independently; no data
migration, no schema/format change. `spriteName` on `DescriptiveNode` is an
additive optional field.

## Boundaries

- **Always do:** verify G7's closure against `junoxu-15` by measurement, not
  inference; keep `nobiza-91`'s residual note-height cause (b) OUT of this
  task's write-set (it belongs to F1-a); confirm the sprite branch's "sprite
  replaces WHOLE stereo block" rule with a co-occurring-stereotype test case.
- **Ask first:** any change to `sprite-commands.ts` beyond a read — the
  jar-internal bundle gap (`:132`) is F4-a's task, not this one; if the
  per-diagram registry lookup this task needs turns out to require a
  `sprite-commands.ts` edit, stop and ask before widening the write-set.
- **Never do:** write `oracle/goldens/description/size-backlog.json`; run
  any state-mutating git command; declare a divergence; regenerate an
  existing golden; attempt to close `turasu-73`/`lesori-32`/`ravodu-50`/
  `tuliba-37` (those need F4-a's asset bundle — out of scope here even
  though they share this task's `buildStereo` mechanism).

## Commit

`fix(F2-b): adopt excluding stereotype regex, add sprite branch`

Body (required — touches 4 files): note the ADR-6 verification result for
`junoxu-15` explicitly (closed as a side effect, or fixed explicitly — say
which), and name both closed fixtures.

## Reporting

Report to the orchestrator, do not edit `size-backlog.json` yourself:
- Pins closed: `junoxu-15-gori632` (direct); confirm whether `nobiza-91
  -fimo741` reaches delta ≤ 0.01 given F1-a's note fix has/has not yet
  landed in this batch's baseline — if F1-a hasn't merged yet when this
  task runs, report `nobiza-91`'s mechanism-(a)-only delta instead
  (0.013889in residual expected, per SYNTHESIS, until F1-a lands)
- ADR-6 verification outcome for G7 (subsumed vs. explicitly fixed)
- Confirmation `turasu-73-zoni468`, `lesori-32-zeve057`, `ravodu-50-siso430`,
  `tuliba-37-liza126` remain open (expected — they need F4-a)

Use Serena MCP tools (`find_symbol`, `find_referencing_symbols`,
`search_for_pattern`) for all symbol navigation, not a raw LSP tool — agents
do not have the LSP tool in their frontmatter.
