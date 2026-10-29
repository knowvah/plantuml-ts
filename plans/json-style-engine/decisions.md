# Architecture decisions (pre-made, user-approved 2026-10-29)

Each decision quotes the Java it rests on. A finding that contradicts one is
stop 3: amend here (dated), then halt.

## D1 — The family's StyleBuilder: a `json-skin-param.ts` slice, built in the parse
`TextBlockJson(ISkinParam skinParam, …)` reads `skinParam.getCurrentStyleBuilder()`
(`TextBlockJson.java:112`) and `getIHtmlColorSet()`; `JsonDiagram` gets that
SkinParam from `TitledDiagram` after `styleExtractor.applyStyles(skinParam)`
(`JsonDiagramFactory.java:…`, read it). Mirror files: build the slice in each
parser from `source.styleSource` with `createMindmapSkinParam` + the declaration
loop (`src/diagrams/files/parser.ts:113-130`), applying the jar cut INSIDE the
parse because `registry.resolve` parses before `styleInput` runs
(`files/parser.ts#jarStyleSource`): `<style>`, `skin`, `!theme` kept; skinparams
dropped except `handwritten` (`StyleExtractor.java:88-96`); hcl also drops
`<style>`/`skin`/theme (`HclDiagramFactory.java:86-92`). Interface:
`JsonDiagramAST.skinParam: JsonSkinParam` (`getCurrentStyleBuilder()`,
`getIHtmlColorSet()`, `styleName: 'jsonDiagram' | 'yamlDiagram'`, `styleError?`).
`styleName` is `jsonDiagram` only for JSON — yaml AND hcl resolve as
`yamlDiagram` (`TextBlockJson.java:113`, `SmetanaForJson.java:112-115`).
Rejected: building it in core `buildTheme` and hanging it on `Theme` (moves the public d.ts, stop 6).

## D2 — Keep the string emitter and dot-engine layout; replace the style INPUTS
The six signatures: `root,element,<T>,node` (fill, stroke, LineThickness,
RoundCorner, HorizontalAlignment, value font) and `+header` (key font)
(`TextBlockJson.java:148-150`); `+highlight` / `+header+highlight` with
`withTOBECHANGED(highlighted.getStereotype())` (`:141-146`, `:296-299` row
fill); `node`+`separator` (`:286-288`); `root,element,<T>,arrow`
(`SmetanaForJson.java:119-120`). Rows are measured with the per-row style's
font (`getTextBlock`, `:340-349`; `TextBlockUtils.withMargin(result, 5, 2)`).
`resolveNodeStyle` builds `NodeStyleJson` from these `Style`s; `TextBlockJson.ts`
measures with them. `withTOBECHANGED` (`StyleSignatureBasic.java:119-132`) is
ported into `src/core/style/StyleSignatureBasic.ts` as an engine-wide method
(not a json branch). Rejected: re-porting `drawU` onto klimt `UGraphic`
(regression surface: 22 pins + 150 clean rows; a later mission if a drawing-level divergence appears).

## D3 — Delete the json-family StyleMap projection
`style-map-json-diagram.ts`'s `compute*` and the json part of
`style-map-theme.ts#computeJsonGraphOverride` stop populating
`Theme.colors.graph.json` for the family; no json/yaml/hcl source reads
`colors.graph.json` afterwards. The `Theme` TYPE stays (public d.ts, stop 6).
Tests asserting projection values are re-pointed at the engine or removed with
the reason. Project rule: superseded code is deleted, not kept.

## D4 — Extended mode: the full skinparam map through `FromSkinparamToStyle`, plus one wrapper
Extended mode (no jar cut) feeds every skinparam into the same builder through
`convertSkinparam` (`style/FromSkinparamToStyle.java`), as files T3b does
(`files-extensions.ts`, `files-style-input.ts#markJarCompatible`/`isExtended`).
ONE convert-wrapper keeps the ddc T3a semantics of `defaultFontColor`: "as if
the skin had no explicit `jsonDiagram { FontColor }`" (`FromSkinparamToStyle.java:157`
→ `root { FontColor }`, overridden by `plantuml.skin` `yamlDiagram,jsonDiagram { FontColor black }`).
hcl in extended mode keeps `<style>`/`skin`/theme (the `hcl-style-*` and
`hcl-theme-*` extension examples). Documented in DIVERGENCES "Extensions".

## D5 — Gradient node fill through the core gradient plumbing
A `BackGroundColor a-b` resolves to an `HColorGradient`; the emitter paints it
through the core path that lifts inline `<linearGradient>` into `<defs>`
(`src/core/svg-defs.ts`, `svg.ts#extractGradientDefs`, as wbs/files/mindmap
backgrounds do). No local gradient emitter.

## D6 — No diagnosis task; an extended-mode byte baseline instead
The mechanism is measured (ddc journal row 33: a 10-line evidence patch closed 3
of 4 rows). Batch 0 records a sha256 of every json/yaml/hcl corpus row, authored
row and extension example rendered in EXTENDED mode; every close runs `--check`
and journals each mover with its mechanism (stop 7).

## D7 — The bar
The 4 target rows and every new authored row structurally clean; pins 14/7/1
byte-equal; manifest shrink-only (appends at closes); 0 conformant losses in the
28 other engines; d.ts byte-identical. Authored fixtures (T0c) cover the gaps
the audit named.

## D8 — Branch and merge mechanics (ddc pattern)
`feat/json-style-engine` off `d0d37ec18`; per-task unsigned commits in worktrees
`jse/<Tn>`, `--no-ff` merges; never push; squash per batch at the end with
`git commit-tree`, tag `jse/pre-squash`; the user signs with `rebase --force-rebase -S`.

## D9 — `plans/` is committed (project convention); `.claude/` is ignored
No `.gitignore` edit.

## Operational readiness (Phase 4, confirmed)
Observability N/A (library, no I/O): signals are the family surveys and chain,
the manifest clean count, the pins, the extensions ratchet, the D6 baseline and
`docs/parity-report.md`. Rollback: Reversible. Scalability: one StyleBuilder per
json block (one skin parse), as files/wbs/mindmap. Backwards compatibility: no
public contract change; `Theme.colors.graph.json` type stays; no consumers.

## Pre-flight (Phase 8, 2026-10-29, on main `d0d37ec18`)
`npm test -- --maxWorkers=4`: 1876 files passed, 1 skipped; 36135 tests passed,
6 expected-fail, 8 skipped, 6 todo; exit 0 (run at load 45-70 from other work
on the box, no timeouts). `npm run lint` exit 0. `npm run typecheck` exit 0.
main's tree (`022327d6`) is byte-identical to the tree data-diagram-conformance's
final gates passed on. Branch `feat/json-style-engine` absent locally and on
origin. Every Modify write-set file and every Create parent directory exists.
Every task spec carries Observability and Rollback. No Irreversible change.
Working tree: the brief (untracked) and the uncommitted `docs/architecture/`
refresh, which T0a moves to its own `docs/architecture-refresh` branch first.

## Amendment 1 (2026-10-29) — D4's premise is false; HALTED for a user decision (stop 3)
D4 says extended mode feeds "every skinparam into the same builder through
`convertSkinparam` … as files T3b does". files does NOT: it restricts extended
mode to four directives (`STYLE_DIRECTIVES` = defaultfontname, defaultfontsize,
defaultfontcolor, shadowing; `src/diagrams/files/files-extensions.ts:26-31,73-75`).
T3a (`jse/T3a` 0091f5181) implemented D4 literally (full map). Measured effect:
a theme's component skinparams collide with the family's SNames —
`nodeBackgroundColor/BorderColor/FontColor` → `node`, `sequenceDivider*` →
`separator` (`json-style-resolve.ts:78`), `roundCorner` → `root { RoundCorner }`
— so extended `!theme aws-orange` draws transparent nodes, `#ABB6C2` text,
`rx=4`, 2px separators, and extended cerulean/materia lose their jar-honoured
`<style>` node gradient to the theme's later skinparams. That contradicts the
DIVERGENCES "Extensions" measured contract (lines ~1072-1160): `roundCorner`,
`shadowing`, `lineColor` are documented as having NO effect on json/yaml/hcl.
Options put to the user: (A) whitelist mirroring files — `defaultFontName`,
`defaultFontSize`, `defaultFontColor` (+ the one wrapper), keeping the
documented table; (B) keep the full map and rewrite the DIVERGENCES table and
"Ignored" list. Also asked: T3a reads extended-mode hcl as `jsonDiagram` (jar-compatible
stays `yamlDiagram`, `TextBlockJson.java:113`) to keep the documented "hcl
`<style>` works through the `jsonDiagram` selector" behaviour.
**Resolution (user, 2026-10-29):** (B) FULL MAP — every skinparam reaches the
extended-mode builder through `FromSkinparamToStyle`, as D4 is worded; theme
component skinparams restyle nodes/separators/corners where their SNames
collide; DIVERGENCES "Extensions" table and "Ignored" list are rewritten to the
measured behaviour. hcl resolves as **`yamlDiagram` in BOTH modes**
(`TextBlockJson.java:113`); the hcl `<style>` extension example and its
documentation move to the `yamlDiagram` selector.
