# T24 — member/body creole: tree leading-space, guillemet, dividers, `~` strip

## Before/after render-diff readings (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <slug>`)

| Fixture | Before (455afc26) | After | Verdict |
|---|---|---|---|
| foxiki-17-kosa114 | structural=6, numeric=3 | structural=0, numeric=0 | **conformant** |
| juxora-90-fisu720 | structural=12, numeric=22 | structural=0, numeric=16 | improved; residual is a PRE-EXISTING, unrelated edge-port defect (row 82) |
| padapo-73-beke177 | structural=2, numeric=42 | structural=0, numeric=0 | **conformant** |
| sejuzo-42-fini523 | structural=3, numeric=0 | structural=3, numeric=0 | unchanged; diagnosed, fix site outside write-set (row 83) |
| focaci-80-suzu938 | structural=0, numeric=95 | structural=0, numeric=95 | unchanged; original hypothesis disproven, real cause outside write-set (row 84) |
| gekope-01-ricu859 (T26 addition) | structural=14, numeric=65 | structural=2, numeric=2 | residual is the KNOWN, separate header-`<b>`-name creole gap (bucket 2b/5) |

## Observation: `~` visibility-like strip was already fixed, by a prior task

- **Context**: focaci-80-suzu938's bucket-7 lead ("`~role` label loses its `~` in
  the jar but keeps it here").
- **Finding**: `src/core/edge-label-box.ts#stripLeadingEscapedChar` already
  strips `~*`→`*` for `computeQuantifierBox` (both content AND width — verified
  `textLength=53.463` byte-identical to golden). The mechanism is
  `CharHidder.hide`'s general `~X` creole escape (`CharHidder.java:47-52`), not
  `Display#manageGuillemet`'s visibility-strip arm — that arm only ever reaches
  an edge's own MAIN label (`LinkArg.build`), never a quantifier/role string
  (`SvekEdge.java:329-351` never touches `LinkArg`).
- **Impact**: focaci's remaining 95 numeric diffs are a uniform ~1.7-2.3px
  rightward shift + 2px wider canvas, with BOTH classifier boxes' own widths
  byte-identical to golden (only x shifted) — a DOT/graphviz coordinate-
  assignment gap, unrelated to any text/creole mechanism. See decision-journal
  row 84 for the full ruled-out list.
- **Confidence**: High (direct SVG dump comparison + Java source read).

## Observation: a member row's leading-space fix needs NO x-advance under this port's own measurer

- **Context**: A4 2a's Java lead (`DriverTextSvg.java:118-124`) literally does
  `x += space` per stripped leading-space char.
- **Finding**: this port's `WidthTableMeasurer`/`DeterministicMeasurer` (the
  SAME deterministic table the oracle jar renders under) report a bare space
  glyph as 0-wide (`SANS_SERIF_BLOCKS[0][32] === 0`, pre-existing, confirmed
  again here). So `x += 0` for every stripped leading space — the fix is
  "strip from the DRAWN TEXT, leave `x` alone", not "strip AND advance x".
  Verified empirically against foxiki/juxora's own tree-level indents (level
  1/2/3 all land exactly on golden's x with zero shift).
- **Impact**: future member-row Java citations that mention an `x +=` term
  driven by a space/tab glyph's width should be checked against this
  deterministic-table fact before porting a positional adjustment — it is
  very often a no-op under THIS measurer, even though the Java source reads
  as if it moves something.
- **Confidence**: High (measured directly: `new WidthTableMeasurer().measure(' ', {family:'sans-serif', size:14})` = `{width: 0, height: 14}`).

## Observation: `resolveOneAtom`'s new render-text override must be gated off any raw tab

- **Context**: T24's first version of the 2a mixed-content fix (leading-space
  strip + `trin`) applied unconditionally to every non-whitespace-only `'text'`
  atom.
- **Finding**: `class-object-member-creole.ts#buildObjectMemberRow` (the ONE
  other caller of the shared `resolveMemberAtoms`/`resolveOneAtom`) re-
  tokenizes a tab-bearing atom's OWN `atom.text` into several PER-TOKEN runs
  downstream, spreading `{ ...atom, text: token, width }` for each. A
  `renderText`/`renderWidth` computed on the WHOLE untokenized blob (my
  `trin` strips `\t` the same as a space, both ASCII <= 32) leaked unchanged
  onto EVERY one of those per-token results — `object/nufoju-44-dabi767`'s
  golden ratchet caught this immediately (two duplicated
  `"field5\tfield6"` `<text>` runs instead of separate `"field1"`.."field6"`
  runs).
  Fix: `textRenderOverride` (`class-member-creole-render-text.ts`) returns
  `undefined` for any text containing `\t`, unconditionally — a tab-bearing
  atom is handled ENTIRELY by {@link resolveTabbedTextRuns} (opt-in, class
  engine only) or is left alone for a caller (object) that re-tokenizes it
  itself.
- **Impact**: any FUTURE per-atom render-text transform added to
  `resolveOneAtom`'s text branch must be re-checked against this same
  spread-based leak in `class-object-member-creole.ts` before landing — that
  file is NOT in this mission's write-set and its own tab re-tokenization
  logic has no way to "reset" a stale renderText/renderWidth pair.
- **Confidence**: High (full test suite caught the regression; root-caused via
  `git stash` A/B + direct trace of the spread).

## Observation: `\t` → real tab was already ported; the actual T26 blocker was a missing `expandTabs=true` call site

- **Context**: T26's finding named `Display.java:305-307`'s literal
  `\t`-to-real-tab conversion as possibly missing.
- **Finding**: it was already correctly ported, in
  `class-member-display.ts#splitMemberDisplayLines` (line 42:
  `else if (c2 === 't') current += '\t';`). The reason gekope's tab-stop
  expansion had zero effect on the first attempt was that
  `buildWrappedMemberRows` (the ONLY entry point `class-member-rows.ts`
  actually calls for classic classifier rows — NOT `buildMemberRow`, contrary
  to what a naive read of the module doc comment suggests) has TWO internal
  `resolveMemberAtoms(...)` call sites, and neither originally passed the new
  `expandTabs` flag.
- **Impact**: future tab/creole work on the class engine's row pipeline should
  check `class-member-rows.ts`'s own imports first (`buildWrappedMemberRows`
  only, never `buildMemberRow` directly) before assuming a single entry
  point.
- **Confidence**: High (fixed, then verified: gekope moved from 14+65 to 2+2).

## Hand-offs (not fixed, outside T24's write-set)

- **juxora-90-fisu720** (decision-journal row 82): `FlatWorks::prop3 -r->
  FlatBar::prop`'s edge attaches to the wrong row inside `FlatBar` — a
  member-port-resolution defect (`class-port-rows.ts`/`class-dot-edges.ts`),
  pre-existing (confirmed via `git stash`), unrelated to any of this task's
  four named mechanisms.
- **sejuzo-42-fini523** (row 83): `isMethodMember`
  (`class-member-rows.ts:127`) misclassifies a field whose display text is a
  `[[url{tooltip with a paren} label]] : TYPE` shape as a METHOD, because it
  checks the raw (unparsed) display text for `(`/`)` without first stripping
  the URL — upstream's `BodierLikeClassOrObject#isMethod`
  (`java:107-114`) strips the URL FIRST. Fix site: `class-member-rows.ts`,
  outside T24's write-set.
- **focaci-80-suzu938** (row 84): the original bucket-7 hypothesis is
  disproven; the real residual (uniform x-shift + wider canvas, both
  classifier box widths unchanged) is a DOT/graphviz coordinate-assignment
  gap reachable only from `class-edge-geo.ts`/`class-dot-edges.ts`/
  `class-dot-graph.ts` (T25's/edge-geometry's domain) or `@knowvah/dot-engine`
  itself — neither in T24's write-set.

## Files touched (write-set, all as authorised)

- `src/diagrams/class/class-body-enhanced.ts` — dropped the spurious
  `.trim()` in `buildTreeRun`.
- `src/diagrams/class/class-member-creole.ts` — `manageGuillemet` wired into
  `buildMemberAtoms`; `resolveOneAtom`'s text branch now uses
  `textRenderOverride`; `resolveMemberAtoms` gained `expandTabs`; new
  `resolveAtomEntries`/`accumulateResolvedAtoms`/`ResolveContext` helpers
  (complexity-cap splits); `buildMemberRow`/`buildWrappedMemberRows` opt in.
- `src/diagrams/class/class-member-creole-render-text.ts` (new, pre-
  authorised 500-line split) — `trin`, `stripLeadingSpacesAndTrin`,
  `textRenderOverride`, `resolveTabbedTextRuns`.
- `src/diagrams/class/class-member-render-atom.ts` (new, pre-authorised
  500-line split) — `MemberRenderAtom`/`MemberRowBuild`, pure move.
- `tests/unit/class/class-body-enhanced.test.ts` — existing tree-cell
  assertions updated to the new (correct) untrimmed `text` contract.
- `tests/unit/class/class-member-creole.test.ts` — guillemet tests, mixed-
  leading-space/trailing-trim tests, tab-stop-expansion tests (T26).
