# Architecture decisions: cdd6 (approved 2026-09-28, "approve all twelve")

Scope answers (planning Phase 2, "go with your recommendations on all five"):
families A–F, G (structure only) and I are in; H (embedded mindmap/salt engines) is
out; the non-class `assetStore` forwarding + state-json duplicate refusal is in as
one task; the 4 accept-candidates stay unsigned.

## D1: verify first, only where cdd5 left doubt
Batch 0's T0d re-verifies, read-only, the rows cdd5 marked MEDIUM, "not isolated"
or dot-engine-without-proof: json 1px (bizasu, meramo, momada), zasuxe node order,
rojida (+3,+1) shift, empty-usymbol containers (beboke, febuli, fezaro), C4 `$bl()`,
mainframe (miveni, rivino, soseka), and the nested renders of josebu and tefeco.
Real `dot` runs before any dot-engine claim. A row it cannot pin becomes
`open -> cdd7` and is not scheduled.

## D2: style values reach the class renderer through the existing buckets
Extend `collectElementStyleBuckets` (`src/core/style-map-element.ts`),
`ElementColors` (`theme-graph-colors.ts`) and the `style-cascade-class-*` resolvers,
keyed by the upstream selector: the `SName` path in `StyleSignatureBasic.of(...)`
(e.g. `svek/Cluster.java:291`), with the Java `file:line` on every new field. No
second style path into the renderer. Escape hatch = stop 13.

## D3: hyperlink colour lives on the creole FontConfiguration
Add optional `hyperlinkColor` to `UText.ts`'s `FontConfiguration` and a
`getStyleHyperlinkColor` accessor to `src/core/style/ISkinSimple` (**amended at
T1b, 2026-09-28, flagged for review**: the brief said `getHyperlinkColor`, but
`src/core/abel/ISkinParam.ts:80` already declares a consumed
`getHyperlinkColor(): HColor` and `MethodsOrFieldsAreaSkinParam extends ISkinParam,
ISkinSimple`, so the same name with an incompatible type is a TS2320 error —
journal row 28), populated by the skin-simple builders (`EntityImageDescriptionDelegates.ts`,
`EntityImageDescriptionName.ts`, `blocks-creole.ts`). Upstream:
`StripeSimple.java:224-225`, `FontConfiguration.java:213-219`. The richer
`abel/FontConfiguration` stays separate.

## D4: the degenerate canvas has its own ensureVisible extent
The jar grows a degenerate diagram's canvas with `SvgGraphics#ensureVisible` on each
text baseline (`SvgGraphics.java:129-133,757-758`); `LimitFinder`
(`LimitFinder.java:217-225`) sizes the normal path. Add the ensureVisible extent
beside `symbolInk`, consumed only by `degenerateClassifierDims`.

## D5: ink walks measure what the renderer draws
`leaf-sizing-entity.ts`'s ink walk reuses the draw-time `EntityImageDescription`
construction and parameters (cdd5 T5e measured (52.04,24) ink vs (17,31) draw).
Folder/package leaves get their own walk mirroring `measureFolderLeaf`'s
`mergeTB`/`getMargin` geometry.

## D6: non-class engines forward assetStore like class/description
`plugin.parse` in state, sequence, activity and json/yaml/hcl reads
`options.assetStore` into `internalSpriteStoreFrom`/`internalEmojiStoreFrom`
(`src/diagrams/class/parser.ts:317-318`); then the fixture renderers and census call
sites forward it. Movers are expected gains; each still needs a mechanism.

## D7: shared-code changes are measured across every engine
Every close surveys all 28 engines against the previous close. More than 30
non-class movers, or any conformant loss, stops (stops 4, 8).

## D8: Smetana is structure only
Port what `!pragma layout smetana` changes structurally (draw path, element order,
emitted elements); numeric residue is the accepted geometry delta (CLAUDE.md
2026-08-09 ruling). Structural-match is done for these rows.

## D9: instruments are fixed before fixes
Batch 0 fixes: the layout-input observer scoped to the outer diagram (EmbeddedDiagram
depth); the pragma detector ignores comment lines; newpage fixtures compare page 1's
DOT; a plain-minute guard in `rebaseline-svg-goldens.ts` and
`capture-oracle-cache.ts` (`PSystemError.java:218-228`).

## D10: exit bar
- Every in-scope row has a mechanism and `final` ∈ `fixed (<commit>)`,
  `open -> cdd7`, `accept-candidate`.
- 0 conformant losses in any engine; 0 unexplained rises.
- Four gates green, collected = on-disk, class DOT parity green.
- Target: b0 CLASS conformant (both trees) + scheduled rows, journaled at T0e. A miss
  is acceptable when every short row has a journaled mechanism.

## D11: execution rules carried from cdd5
Worktree per parallel task; agents run targeted tests only; no Serena edit tools and
no `git stash` in agents; orchestrator checks `git diff HEAD` on main before every
merge; catalog regen after a new module; full gates with `--maxWorkers=6`; never push.

## D12: left as is
dot-engine is off limits (findings filed in `docs/graphviz-issues/` + TRACKER); the
4 accept-candidates and 17 in-force acceptances stay unsigned and in force; embedded
mindmap/salt engines are out of scope.
