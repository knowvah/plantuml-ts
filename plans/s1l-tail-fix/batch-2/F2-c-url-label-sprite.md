# F2-c — G10 url-label sprite scale

## Context

`plantuml-ts` is a TypeScript port of PlantUML's creole text engine. A
`<$sprite>` atom placed inside a `[[url label]]` construct is scaled by our
port using the SAME factor as an ordinary inline sprite — but upstream
builds the url-label sprite through a SECOND, separate constructor that
deliberately skips that factor. This is a **cross-engine** fix: the shared
`creole-atoms*` files it touches are used by class, state, and object
diagrams as well as description, not just description.

**Required reading before touching anything:** `planning/usymbol-composition.md`
and `planning/sizer-renderer-parity.md` — `CLAUDE.md` marks both mandatory
for any sizing bug in any engine. `~/.claude/rules/diagnosis.md` (this is a
diagnosed defect — do not re-diagnose), `~/.claude/rules/testing.md`,
`~/.claude/rules/testability.md`.

## Task

**Mechanism.** `StripeSimple.ts:221`'s `modifyStripe` pushes an inline atom
token with no url provenance:
```ts
this.built.push({ kind: 'inline', atom: atomMatch.atom, ambientFont: this.font });
```
Compare `flushPending` (`:238-246`), which DOES attach `url` to a text
segment when `this.activeUrl !== undefined`. The inline-atom push has no
equivalent — so downstream, `spriteScale` (`creole-atoms-measure.ts:76-78`)
applies `requestedScale * (ambientFontSize / 13)` UNCONDITIONALLY, with no
way to know the atom sat inside a `[[url ...]]` span.

Upstream builds a url-label sprite through a second constructor
(`AtomTextUtils#createAtomTextForUrl`, `java:120`) that passes the RAW
parsed scale, deliberately skipping `CommandCreoleSprite`'s
`* fc.getSize2D()/13.0` factor (`java:83`). Concretely: a `$maxime`
sprite declared `[48x48/16z]` measures `48 × 14/13 = 51.6923` OUTSIDE a
link (factor applied) but flat `48` INSIDE a `[[url ... <$sprite>]]` link
(factor skipped).

**Fix.** Attach url provenance to the inline atom token at the point it is
built, and have the measure/render paths skip the `/13` factor when that
provenance is set:

1. `src/core/creole-atoms.ts` — add a url-provenance flag to
   `InlineAtomToken` (or a `LineAtom`-level flag alongside it — read the
   existing `RenderSegment`/`InlineAtomToken` shapes first and pick
   whichever requires the smaller diff).
2. `src/core/klimt/creole/legacy/StripeSimple.ts:221` — set the new flag on
   the inline-atom push when `this.activeUrl !== undefined`, mirroring
   `flushPending`'s existing `url` attachment.
3. `src/core/creole-atoms-measure.ts` — `measureInlineAtom`/`spriteScale`
   call site skips the `/13` factor when the flag is set (pass
   `ambientFontSize` as if it were already 13, or add an explicit bypass —
   do not change `spriteScale`'s own signature/doc, which is correct and
   jar-verified for the non-url case).
4. `src/diagrams/description/render-atoms.ts` — the RENDER-side
   `resolveSpriteAtom`/`resolveSvgSpriteAtom` calls to `spriteScale`
   (`:255`, `:279`) must apply the SAME bypass. Sizer and renderer must
   agree per `planning/sizer-renderer-parity.md` — a sprite that measures
   at 48 but draws at 51.6923 (or vice versa) is a new, worse bug than the
   one being fixed.

**Author the incidental defect's fixture (ADR-7).** Found while isolating
this bucket, not attached to any pinned fixture: a display whose FIRST line
is entirely a `[[url label]]` measures the url text as well as the label —
`rectangle "[[http://www.google.com abc]]"` is jar `0.591319` (`abc` + 20)
vs ours `2.663368`. This is a SEPARATE mechanism from the scale factor
(traced to `parse-helpers-strings.ts`'s `RE_URL_TOKEN_G`/`parseNameSection`,
NOT `buildLineAtoms` — confirmed in `sprite.md`'s incidental-observation
section) and is **out of this task's write-set** (`parse-helpers-strings.ts`
is F2-b's file this batch). Author the `.puml` fixture and generate its jar
oracle now (ADR-7 requires the oracle to land in the SAME task as the fix —
but the fix itself is not this task's; if the fix genuinely cannot land
here without expanding the write-set, generate the fixture + oracle, record
it as reproduced-but-unfixed in your completion report, and let a follow-up
task close it). Do not silently skip authoring it.

## Write-set

- `src/core/klimt/creole/legacy/StripeSimple.ts`
- `src/core/creole-atoms.ts`
- `src/core/creole-atoms-measure.ts`
- `src/diagrams/description/render-atoms.ts`

## Read-set

- `src/core/klimt/creole/legacy/StripeSimple.ts:195-254` (`modifyStripe`,
  `flushPending`, `finish` — the existing url-attachment pattern to mirror)
- `src/core/creole-atoms.ts:80-110` (`InlineAtomToken`, `RenderSegment` type
  shapes — line ranges only, do not read the whole file)
- `src/core/creole-atoms-measure.ts:50-95` (`spriteScale`,
  `measureLineWithAtoms` — the factor application site and its own doc
  comment recording the two jar-verified calibration points, 48×14/13 and
  16×16 SVG sprite cases)
- `src/diagrams/description/render-atoms.ts:240-330` (`resolveSpriteAtom`,
  `resolveSvgSpriteAtom` — the render-side mirror of the measure-side fix;
  note the doc comment at :226-235 already states sizer/renderer must not
  drift)
- `../s1l-tail-diagnosis/findings/sprite.md` — `bivira-53-boja685` record in
  full (mechanism, the four-way isolation: node 1 exact outside a link,
  node 2's `+3.692`/`+4.640 w / +3.712 h` arithmetic through
  `TextBlockInEllipse`'s refit); `vivido-49-nisu863` record's nodes 0/1
  arithmetic (`+1.145`/`+3.692` on both axes, same constant as `bivira-53`)
  and its "Incidental observation" section (the url-label-only-line defect,
  full probe table)
- `planning/sizer-renderer-parity.md` — the sizer/renderer lockstep
  requirement this task must satisfy

## Architecture decisions binding this task

- None of the nine ADRs directly govern G10's mechanism, but **ADR-7**
  governs the incidental-defect fixture: author it + generate its jar
  oracle in this task (not a synthetic-only check), and do not treat
  regenerating an EXISTING golden as equivalent — that stays forbidden.
- **README's cross-engine rule:** "Tasks touching `creole-atoms*` … must
  additionally re-run the class, state and object size ratchets" and "A
  cross-engine ratchet (class/state/object) widens" is a STOP condition
  that only F2-c and F3-fix are permitted to legitimately trigger risk on
  — see Quality Bar below.

## Interface contracts

- The new url-provenance flag on `InlineAtomToken` (or `LineAtom`) is a pure
  addition — do not remove or rename existing fields consumed by
  class/state/object's own `creole-atoms*` call sites. Grep
  `find_referencing_symbols` on `InlineAtomToken` before changing its shape
  to confirm the full caller set across all four engines.
- `spriteScale`'s existing signature (`requestedScale: number,
  ambientFontSize?: number`) stays unchanged — the bypass is a caller-side
  decision (skip the call, or pass `13` explicitly), not a new parameter
  that every OTHER caller must now also reason about.

## Acceptance criteria

1. **Given** `rectangle "You can click\n[[http://www.google.com
   <$maxime>]]"` with `$maxime [48x48/16z]` declared, **when** measured,
   **then** the node is `1.316840 × 1.138889` in — matching the jar exactly
   (was `1.316840 × 1.190171`, a `+3.692` height error).
2. **Given** a bare `rectangle "<$maxime>"` (the SAME sprite, NOT inside a
   `[[url]]`), **when** measured, **then** the node is UNCHANGED at
   `71.692 × 71.692` — the factor must still apply outside a link (this is
   the regression guard proving the bypass is url-scoped, not global).
3. **Given** `bivira-53-boja685` (the pinned fixture, ellipse refit through
   `TextBlockInEllipse`), **when** measured, **then** delta is 0 against the
   jar's `1.485102 × 1.204748`.
4. **Given** the same url-label sprite fixture, **when** RENDERED to SVG,
   **then** the drawn sprite geometry matches the measured geometry exactly
   (sizer/renderer lockstep) — assert on the SVG's sprite `<path>`/`<image>`
   dimensions, not just the DOT node box.
5. **Given** the full class/state/object/description size ratchets, **when**
   run after this change, **then** none widens (`widened === 0` on all
   four) — this is the task's primary risk per the cross-engine blast
   radius note.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count RISES
npx tsx scripts/audit-size-metric-identity.ts
```
Plus, because this task touches `creole-atoms*` (shared across engines):
```sh
npx tsx scripts/measure-class-size-deltas.ts     # widened 0
npx tsx scripts/measure-state-size-deltas.ts     # widened 0
npx tsx scripts/measure-object-size-deltas.ts    # widened 0
```
(Confirm the exact script names/paths for the class/state/object ratchets
before running — they are named by analogy with the description script; if
a different name exists in `scripts/`, use that one instead of guessing.)

Never pipe a gate — capture `$?` directly. **`widened > 0` on ANY of the
four ratchets is a STOP condition** — per README's stop condition 5, a
cross-engine ratchet widening is more severe than a single-engine one and
must not be worked around locally.

## Observability

N/A — no new observable operations. Internal creole-measure/render change,
no new logging, metrics, or external interface.

## Rollback

Reversible. The url-provenance flag and its two consuming bypasses revert
independently; no data migration, no schema/format change. The authored
fixture + oracle for the incidental defect are additive files (do not
depend on the fix landing to exist safely — the oracle is just a golden the
measurement script will report as non-conformant until a later fix lands).

## Boundaries

- **Always do:** mirror the measure-side bypass on the render side in the
  SAME task (do not land one half); run all four size ratchets, not just
  description; author the incidental-defect fixture + oracle even if you
  cannot fix it here.
- **Ask first:** if fixing the incidental defect turns out to require
  touching `parse-helpers-strings.ts` (F2-b's file this batch) — do not
  expand this task's write-set into a file another parallel task owns;
  report it unfixed instead and ask whether it should become its own
  follow-up task.
- **Never do:** write `oracle/goldens/description/size-backlog.json`; run
  any state-mutating git command; declare a divergence; regenerate an
  existing golden (the NEW incidental-defect fixture's oracle is fine per
  ADR-7; an existing golden is not).

## Commit

`fix(F2-c): drop url-label sprite scale factor`

Body (required — touches 4 files, cross-engine blast radius): state the
sizer/renderer lockstep requirement was verified, name the closed
fixtures, and name the four ratchets re-run.

## Reporting

Report to the orchestrator, do not edit `size-backlog.json` yourself:
- Pins closed: `bivira-53-boja685` (direct); `vivido-49-nisu863` (given
  F1-c's OpenIconic glyph table landed in Batch 1 — confirm its dominant
  `<&cloud>` node is already 0 delta before claiming this fixture closed;
  if F1-c has not yet merged when this task runs, report only the
  sprite-factor nodes' delta, not the whole-fixture delta)
- Results of all four size ratchets (description + class + state + object),
  each with `widened`/`count` numbers
- The authored incidental-defect fixture's path + jar oracle path, and
  whether it was fixed in this task or left open for follow-up

Use Serena MCP tools (`find_symbol`, `find_referencing_symbols`,
`search_for_pattern`) for all symbol navigation, not a raw LSP tool — agents
do not have the LSP tool in their frontmatter.
