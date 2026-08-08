# F3-fix — G4 + G5 `BoxSizingOpts` thread (per-element stereotype font size + line thickness)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance sits at 336/351 entering this batch (321 baseline + Batch 1's
+9 + Batch 2's +6).

Four fixtures share ONE structural shape: the sizer resolves exactly ONE font
size and ONE stroke thickness per leaf, so a per-element override the
RENDERER already resolves and draws never reaches the measure path.
`sizingPaint` (`src/diagrams/description/leaf-sizing-entity.ts:137-153`)
builds `EntityImageDescriptionParams['paint']` from a single `font:
FontConfiguration` argument, assigning it to BOTH `fontTitle` and
`fontStereo` (line 146), and hardcodes `stroke: UStroke.withThickness(
DEFAULT_SIZING_STROKE_THICKNESS)` (line 144) regardless of what
`resolveElementLineThickness` resolved for the element. Both slots' own doc
comments (`:128-130`, `:161-167`) name the gap explicitly — this is documented
technical debt, not a surprise.

**Read `planning/usymbol-composition.md` and `planning/sizer-renderer-parity.md`
before writing any sizing code** (CLAUDE.md mandate, restated in the mission
README). `sizer-renderer-parity.md`'s `actorStyle` GAP row is **stale**: the
port already returns `ActorAwesome`'s `54/32/28` geometry (55×76, not the
stickman 27×60) for `skinparam actorStyle awesome`; only the `LineThickness`
term is wrong (`revusu-28`'s mechanism, below). Do not re-derive or re-fix
`actorStyle` — it is correct.

## Task

Close four fixtures across two mechanism groups, closing G4 tier 1+2 and G5 in
the SAME task (ADR-5 — do not split):

| Fixture | Group | Delta (in) | Mechanism |
|---|---|---|---|
| `loroto-06-fano471` | G4 | 0.083333 | `<style> node { stereotype { FontSize 20 } }` — stereotype font size never reaches the sizer |
| `toxine-81-xofo986` | G4 | 0.083333 | Identical mechanism, `skinparam` spelling — byte-identical oracle DOT and byte-identical port output to `loroto-06` |
| `kofuca-08-pafi749` | G4 | — | Exercises **tier 1 only**; must close WITHOUT tier 2 landing (see acceptance criteria) |
| `revusu-28-pexi248` | G5 | 0.097222 | `<style> actor { LineThickness 4 }` — line thickness never reaches the sizer; `ActorAwesome` computes `+2×0.5` where the renderer draws `stroke-width:4` |

### Tier 1 (sizer-only, size ratchet verifies alone)

Add a second font slot and a thickness slot to the `BoxSizingOpts` /
`ClassifyCtx` thread, mirroring the existing `fontSizeFor` pattern
(`layout.ts:112,436`):

- `ClassifyCtx.stereotypeFontSizeFor(sname)` → `resolveElementFontSize(theme,
  sname, 'stereotype')` (the role branch already exists at
  `theme-element-resolve.ts:61` — this is a NEW CALL SITE, not new resolver
  logic).
- `ClassifyCtx.lineThicknessFor(sname)` → `resolveElementLineThickness(theme,
  sname)` (confirm this resolver's exact name/signature by reading
  `theme-element-resolve.ts` — it is referenced by name in the diagnosis but
  not independently verified here).
- `BoxSizingOpts.stereotypeFontSize?: number` and `BoxSizingOpts.
  lineThickness?: number`, threaded through `layout-dot-tree.ts` the same way
  `fontSize` already is.
- `sizingPaint` (`leaf-sizing-entity.ts:137-153`): build `fontStereo` from a
  SECOND `sizingFontConfig` call seeded by `opts?.stereotypeFontSize ??
  fontSpec.size` — NOT by repointing the existing `font` argument's role.
  Build `stroke` from `UStroke.withThickness(opts?.lineThickness ??
  DEFAULT_SIZING_STROKE_THICKNESS)`.

### Tier 2 (per-stereotype-NAME override, ships in the SAME task per ADR-5)

`loroto-06`/`toxine-81` additionally carry `.bar { FontSize 10 }` /
`<<bar>>`-scoped overrides that are dropped on BOTH the `<style>` and
`skinparam` front-ends:

- `<style>`: `parseStyleBlock` (`style-map-element.ts`) already preserves the
  `node.stereotype..bar` selector — `theme.colors.elements.node` must gain a
  name-keyed field (e.g. `stereotypeFontSizeByStereo: Record<string,
  number>`) populated from it.
- `skinparam`: `applyStereoOverride`'s `STEREO_KEY_MATCHERS`
  (`skinparam-stereo-keys.ts:118-158`) has no `<sname>StereotypeFontSize
  <<label>>` pattern — add one, following the existing matchers' shape
  (`CLASS_ATTRIBUTE_FONT_SIZE_STEREO_RE` at `:127-136` is the closest
  precedent: same "regex → numeric accumulator field" shape).
- `resolveElementFontSize(theme, sname, 'stereotype')` must consult the
  name-keyed map FIRST, falling back to the flat `stereotypeFontSize` —
  mirrors the existing hierarchical-cascade doc comment on `ElementColors.
  stereotypeFontSize` (`theme-graph-colors.ts:30-42`).
- `renderer-symbol.ts#textFont` (role `'stereotype'`) must resolve the SAME
  name-keyed override, or ink and size diverge again — this fixture is the one
  case in the whole `element-font` bucket where the RENDERER is also wrong,
  not just the sizer.
- `preprocessor.ts`: locate wherever the block-form `skinparam node { ... }`
  intake normalizes keys before they reach `resolveSkinparam`/
  `applyStereoOverride` — a direct grep for `StereotypeFontSize` in this file
  found no existing hit, so confirm the real hook by reading the block-form
  skinparam ingestion path before assuming a line number.

## Write-set

Tier 1: `src/diagrams/description/layout.ts`,
`src/diagrams/description/layout-dot-tree.ts`,
`src/diagrams/description/leaf-sizing-consts.ts`,
`src/diagrams/description/leaf-sizing-entity.ts`,
`src/diagrams/description/leaf-sizing.ts`

Tier 2: `src/core/preprocessor.ts`, `src/core/skinparam-stereo-keys.ts`,
`src/core/style-map-element.ts`, `src/core/theme-graph-colors.ts`,
`src/core/theme-element-resolve.ts`,
`src/diagrams/description/renderer-symbol.ts`

Nothing else. Do not touch `oracle/goldens/description/size-backlog.json`
(ADR-1).

## Read-set

Required first: `planning/usymbol-composition.md`,
`planning/sizer-renderer-parity.md`.

Mission: `../decisions.md` (ADR-4, ADR-5, ADR-8 govern here),
`../../s1l-tail-diagnosis/findings/element-font.md` (`loroto-06`, `toxine-81`,
`revusu-28` records — full arithmetic and all `ruledOut` entries),
`../../s1l-tail-diagnosis/findings/SYNTHESIS.md` §1 rows G4/G5, §3 (co-requisite
table — `kofuca-08`'s tier-1-only closure), §7 (element-font provenance),
`../../s1l-tail-diagnosis/findings/METRIC-AUDIT.md`.

Source, verified line ranges:
- `src/diagrams/description/leaf-sizing-entity.ts:120-170` —
  `EntityLeafCtx`, `sizingFontConfig`, `sizingPaint` (the two hardcoded slots
  and their doc comments)
- `src/diagrams/description/leaf-sizing-entity.ts:223` —
  `measureEntityLeaf` (do not need to change this function; read for context)
- `src/diagrams/description/leaf-sizing-consts.ts:18-50` — `BoxSizingOpts`
  (existing `fontSize` field is the pattern to mirror)
- `src/diagrams/description/layout.ts:90-140` — `ClassifyCtx` interface
- `src/diagrams/description/layout.ts:420-440` — `ctx` construction,
  including the existing `fontSizeFor` call site (`:436`)
- `src/diagrams/description/renderer-symbol.ts:141-160` — `textFont`'s
  `role` parameter (the resolver this task's ink-side change must match)
- `src/core/theme-element-resolve.ts:50-90` — `resolveElementFontSize`
  (role `'stereotype'` branch already at `:61`)
- `src/core/theme-graph-colors.ts:16-60` — `ElementColors`, including the
  `stereotypeFontSize` doc comment describing the cascade this task
  implements the name-keyed tier of
- `src/core/skinparam-stereo-keys.ts:1-158` — `STEREO_KEY_MATCHERS`,
  `applyStereoOverride`
- `src/core/style-map-element.ts:91` — `collectElementStyleBuckets` (read the
  whole function; it is where the `<style>` front-end's `node.stereotype..bar`
  selector is captured today)
- `src/core/skin/ActorAwesome.ts:113-119` — `getPreferredWidth`/
  `getPreferredHeight`, already thickness-aware; confirms `revusu-28`'s fix is
  purely about delivering the thickness value, not about the actor geometry

## Architecture decisions

**ADR-5 is the headline constraint: tiers 1 and 2 ship in ONE task, ONE
commit.** Tier 1 alone moves `nodebar` from +4px to +10px error — see the
first trap below. Do not propose splitting this task even though it exceeds
the mission's usual per-task granularity; the mission brief explicitly
overrides that rule here.

ADR-4 governs by precedent, not by direct write-set overlap: the new
`BoxSizingOpts` fields must follow the same "absent → fall through to the
existing default, never collapse into a value that erases the distinction
between 'no override' and 'override equals the default'" discipline that
`measureNote`'s `fontSize` field already established. ADR-8: do not touch
`tests/oracle/svek-dot.ts`'s gate or re-base `size-backlog.json` pins.

## Interface contracts

```ts
// leaf-sizing-consts.ts — BoxSizingOpts, two new optional fields
export interface BoxSizingOpts {
  // ...existing fields unchanged...
  /** Per-element STEREOTYPE font size, resolved the SAME way `fontSize`
   *  resolves the title size — `resolveElementFontSize(theme, sname,
   *  'stereotype')`, including the name-keyed `<<bar>>` cascade tier.
   *  Absent = fall back to the diagram's base font size (current behavior). */
  stereotypeFontSize?: number | undefined;
  /** Per-element `LineThickness`, resolved via `resolveElementLineThickness`.
   *  Absent = `DEFAULT_SIZING_STROKE_THICKNESS` (current behavior). */
  lineThickness?: number | undefined;
}

// theme-graph-colors.ts — ElementColors, one new optional field
export interface ElementColors {
  // ...existing fields including stereotypeFontSize unchanged...
  /** `<sname>StereotypeFontSize<<label>>` / `<style> <sname> { stereotype {
   *  ..bar { FontSize N } } } }` — per-stereotype-NAME override, consulted
   *  before the flat `stereotypeFontSize` falls through. */
  stereotypeFontSizeByStereo?: Record<string, number>;
}
```

`layout.ts`'s `ClassifyCtx` gains `stereotypeFontSizeFor` and
`lineThicknessFor`, both `(sname: string) => number | undefined`, mirroring
the existing `fontSizeFor` field exactly (same signature shape, same
"resolver call, nothing else" body).

## Acceptance criteria

- **Given** tier 1 and tier 2 both land in this commit, **when**
  `measure-description-size-deltas.ts` runs, **then** `loroto-06` and
  `toxine-81` both report delta ≤0.01in — not the tier-1-only intermediate
  state (`nodebar` at +10px / 0.138889in) that ADR-5 exists to forbid.
- **Given** the naive one-slot fix (repointing the existing `font` argument's
  role to `'stereotype'` without adding a second slot), **when** measured,
  **then** it must NOT be what ships — that change was measured at 112.250×70
  / 113.375×70 for `nodefoo`/`nodebar`, WORSE than the pre-fix state on both
  dimensions, because it also inflates the label. Confirm your own
  implementation does not reproduce those numbers before calling this done.
- **Given** `kofuca-08-pafi749`, **when** tier 1 alone is measured (a
  controlled intermediate check, not a shipped state), **then** it closes on
  tier 1 alone — this fixture is the one member of G4 whose gain is NOT
  contingent on tier 2, and its independent closure is evidence tier 1 is
  correctly wired before tier 2 is trusted to layer on top.
- **Given** `revusu-28-pexi248`, **when** measured, **then** the actor's base
  geometry stays exactly `54/32/28` (do not touch `ActorAwesome`) and only the
  thickness term changes — both dimensions close to delta ≤0.01in.
- **Given** tier 2 touches the shared theme/skinparam layer, **when** the
  class and state size-delta harnesses run against their own goldens
  directories, **then** both report `widened 0` (see the object-ratchet
  caveat in Quality bar below — it is a real tooling gap, not something to
  paper over).

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; +4 toward 340
npx tsx scripts/audit-size-metric-identity.ts
# cross-engine — this task and F2-c are the only two in the mission required to run these:
npx tsx scripts/measure-class-size-deltas.ts    # widened 0 (oracle/goldens/class)
npx tsx scripts/measure-state-size-deltas.ts    # widened 0 (oracle/goldens/state)
```

**Object-ratchet caveat, verified against the tree, not assumed:**
`oracle/goldens/object/size-backlog.json` exists, but no
`scripts/measure-object-size-deltas.ts` does — `measure-class-size-deltas.ts`
hardcodes `GOLDENS = join(REPO, 'oracle', 'goldens', 'class')` (`:40`), and
there is no generic/parameterized variant. Since object diagrams share the
theme/skinparam resolution this task changes (`CucaDiagram`/
`AbstractEntityDiagram`, per `CLAUDE.md`), object conformance still needs
checking. Do this by pointing a LOCAL, uncommitted copy of
`measure-class-size-deltas.ts` at `oracle/goldens/object` instead (change only
the `GOLDENS` constant; delete the copy before finishing — it is not part of
this task's write-set). If that reveals object fixtures widening, treat it as
a stop condition (README stop condition 4/5) and escalate rather than
silently building new committed tooling to work around it. If it reveals no
regression, state that explicitly in the completion summary — do not skip the
check because the committed script doesn't exist.

Capture `$?` directly for every command; never pipe a gate — `tail`'s exit
code masks the real one.

## Observability

N/A — pure synchronous sizing/theme-resolution code in an SVG-rendering
library; no request path, no logs, no metrics. The size ratchets above are
the correctness signal in place of an SLI.

## Rollback classification

Reversible via a single commit revert, but not cheaply verified: tier 2
touches the theme/skinparam layer shared with class/state/object, so a
revert must re-check all three engines (not just description's) to confirm
the shared layer actually returned to its prior state, not merely that this
task's own fixtures went back to failing.

## Boundaries

**Always:** ship tier 1 and tier 2 together in one commit (ADR-5); verify
`loroto-06`, `toxine-81`, `kofuca-08`, `revusu-28` independently against their
measured numbers before reporting closure; re-run the class and state size
ratchets plus the ad hoc object check above; read
`planning/usymbol-composition.md` and `planning/sizer-renderer-parity.md`
first; use Serena MCP tools for symbol navigation.

**Ask first:** if `resolveElementLineThickness` does not exist under that
name (confirm by reading `theme-element-resolve.ts` — this task file names it
from the diagnosis record, not from direct verification) — do not invent a
substitute resolver silently. Also ask first if the ad hoc object check finds
a widened fixture.

**Never:** repoint the existing single font slot's role to `'stereotype'`
without adding a second slot (the measured-worse trap above); modify
`ActorAwesome`'s base geometry (`54/32/28` is already correct); touch
`size-backlog.json`; split this task into two commits or two tasks; touch
`tests/oracle/svek-dot.ts`'s gate; commit the throwaway object-goldens script
copy.

## Commit format

`fix(F3-fix): thread stereotype font size + line thickness through BoxSizingOpts`

Body (required — touches >3 files): explain why tiers 1 and 2 ship together
(ADR-5, the `nodebar` +4px→+10px regression) and list the four fixtures
closed.
