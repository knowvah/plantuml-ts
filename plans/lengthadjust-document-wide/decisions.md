# lad — architecture decisions (locked 2026-10-24)

Approved by the user in planning. A finding that contradicts one is stop 3:
amend here (dated "Amendment N"), then halt.

| ID | Decision (one line) |
|---|---|
| D1 | Theme engines read `theme.lengthAdjust`; mindmap, wbs, salt read `getSkinParam().getlengthAdjust()` added to their SkinParam ports |
| D2 | board, files, packetdiag, chart get a `diagramType` and route through `assembleDocumentShell`; `svgRoot` is untouched |
| D3 | klimt-shaped engines set `option.lengthAdjust` AND `fragment.lengthAdjust`; sub-render probes are untouched |
| D4 | `undefined` means spacing: the field is spread only when defined, never written as `'spacing'` |
| D5 | Authored gate = projection (root `<g>` attrs; per-`<text>` `textLength` presence) + never-rises weighted baseline |
| D6 | A harness mirror that drops the field is fixed in the same task as its engine |
| D7 | sdd3 mechanics: worktrees, `--no-ff`, 28-engine chain vs b0, one commit per batch at the end, tag `lad/pre-squash`, never push |
| D8 | Target: 64 authored rows root-exact, `textLength` exact outside the 12 baselined D2 rows, 0 losses, 0 unexplained movers, every pin stable |

## D1 — where each engine reads the value

`TextBlockExporter.java:306-307` reads the diagram's own `SkinParam`. Engines
that receive the resolved `Theme` (class, state, json/yaml/hcl, activity,
description, board, files, packetdiag, chart) read `theme.lengthAdjust`, the
port's `SkinParam#getlengthAdjust` (`skinparam-key-handlers-table-c.ts:14-18,
48-58` — a three-entry lookup over `SkinParam.java:1260-1267`'s names; any
other value is `undefined`). Mindmap, wbs and salt render from their own
diagram objects (`render(geo)` ignores `theme`), so each port SkinParam class
gains `getlengthAdjust(): RootLengthAdjust | undefined` mirroring
`SkinParam.java:1258-1269` over its existing `getValue('lengthAdjust')`
(`mindmap-skin-param.ts:139`, `wbs-skin-param.ts:126`, `PSystemSalt.ts:127`).
Rejected: threading `theme` into those three renders (structure the jar does
not have).

## D2 — the four generic-root engines

Their jar oracles carry `data-diagram-type="BOARD" | "FILES" | "PACKET" |
"CHART"` (`TextBlockExporter.java:292-293`), so the bare `svgRoot` path they
use today is a structural divergence of its own. Each fragment gains the
matching `diagramType` literal (per-file constant, the json precedent
`json/index.ts:25`) and `finalizeShellFragment` (`assemble-svg.ts:309-331`)
gains arms that wrap an unwrapped body in a bare `<g>` (json's shape,
`assemble-svg.ts:241-253`) so `withRootGroupAttributes`
(`document-shell.ts:139-142`) decorates it. The shell then writes the root
attributes, `data-diagram-type`, the `lengthAdjust` form and the `none`
strip from one place. All four are 0/N conformant today, so no pin or verdict
can be lost; every mover at the batch-2 close is explained by the route.
Rejected: a `lengthAdjust` parameter on `svgRoot` (keeps a second root path
alive without the jar's root attribute). Chronology is out of scope: the jar
has no such diagram and no oracle exists.

## D3 — both carriers on klimt-shaped engines

Where an engine builds a `basicSvgOption({...})` and draws through
`UGraphicSvg` (activity sheets `activity-text-sheet.ts:210`,
`activity-creole-sheet.ts:274`; description `renderer.ts:286`; mindmap
`index.ts:137`; wbs `index.ts:160`; salt `index.ts:129`) it sets
`option.lengthAdjust` — the jar's carrier, honoured by `svg-graphics-core.ts:
126-131` and `svg-graphics-elements.ts:242-252` — AND `fragment.lengthAdjust`
so the shell writes the root. The shell strip (`document-shell.ts:159-162`)
becomes a no-op for them. `LengthAdjust` (klimt enum) ↔ `RootLengthAdjust`
(`svg.ts:288`) map by name: SPACING ↔ `spacing`, SPACING_AND_GLYPHS ↔
`spacingAndGlyphs`, NONE ↔ `none`. Sub-render probes that build
`basicSvgOption()` for arrowheads and class groups produce body fragments the
shell already handles; they are not edited.

## D4 — the default stays implicit

`undefined` is SPACING. An engine spreads the field only when defined
(`sequence/renderer.ts:208` precedent) and never writes `'spacing'`
explicitly. Unset output is byte-identical by construction; that is what
keeps every existing pin green (stop 5).

## D5 — authored gate shape

`tests/fixtures/lengthadjust/<engine>-<variant>.puml` + the jar's `.svg`
beside it (`scripts/oracle-render.sh`), variants `default`, `none`, `glyphs`,
`onechar`, for the 16 engines {class, object, state, activity, component,
usecase, json, yaml, hcl, mindmap, salt, wbs, board, files, packet, chart}.
Per row the gate compares (a) the root `<g>` attribute set and (b) the
per-`<text>` vector of `textLength` presence, and records the weighted score.
`authored-baseline.json` rows carry `{ slug, score, rootExact, textLength:
'exact' | 'baseline', textLengthMatch, reason? }`. Gate: score never rises;
no `true` flips to `false`; rows marked `exact` must match. The 12 rows of
board/files/packetdiag/chart under `default`/`glyphs`/`onechar` are
`baseline` (their emitters write no `textLength` at all — pre-existing, owner:
each engine's own drive); their `none` rows are exact (both sides empty).
`onechar` proves the `text.length() > 1` guard already in `svg-shapes-text.ts
#textLengthOf` (rule 5) and `applyTextLengthAdjust`; nothing is changed for
it. Java `String.length()` and JS `.length` both count UTF-16 units.

## D6 — harness mirrors travel with their engine

`render-fixture-{class,activity,sequence}.ts` compose fragments through
`assembleSvg`; T0d names, with `file:line`, whether each preserves
`fragment.lengthAdjust`. A mirror that drops it is fixed inside the engine's
task (write-set extended by that one file), never in a separate task
(`conformance-harness-mirrors-index-ts`).

## D7 — mission mechanics (sdd3's)

Worktrees via `$M/mkwt.sh`; agents commit unsigned, never push, no Serena
edit tools, no `git stash`. Orchestrator: `git diff HEAD` empty before every
`--no-ff` merge; `merge-one.sh` after it; four gates at `--maxWorkers=4` before
every close commit; `chain.sh` into `$M/bN-eng/` at every close, diffed against
the previous close and against b0 at exit. Squash: one commit per batch built
with `git commit-tree` from the close trees, working history on the local tag
`lad/pre-squash`, user signs with `git rebase --force-rebase -S bf18ede54`.
The canonical-hash tools are not copied (no pure moves in this drive).

## D8 — target and non-targets

64 authored rows `rootExact`; `textLengthMatch` on the 52 `exact` rows; the 12
`baseline` rows never worse; 0 conformant losses in 28 engines vs b0; every
non-sequence verdict mover explained (only board/files/packetdiag/chart may
move, by the route); every golden ratchet and pin unchanged. Non-targets, with
the Java reason: sequence (done), `@startdot` passthrough, the utility and
easter-egg `completeSvg` diagrams through `UgDiagram.exportTo` and error pages
(`TextBlockExporter.java:306` `if (skinParam != null)` never fires:
`PlainDiagram` has no SkinParam), unported engines (timing, gantt, network,
ebnf, regex, wire, ditaa), the never-emitted `TextStyle.lengthAdjust` field and
the per-element `lengthAdjust: 'spacing'` literals in class/state renderers
(rule 3 hoisted them; do not refactor while porting). No accepted divergence
is expected; proposing one is stop 13.

## Amendment 1 (2026-10-23, batch 0) — four engines never see the skinparam

**Finding (T0b oracles + T0d audit, Java read by the orchestrator).** json,
yaml, hcl and files parse through `jsondiagram/StyleExtractor.java`
(`JsonDiagramFactory.java:75`, `YamlDiagramFactory.java:75`,
`HclDiagramFactory.java:69`, `FilesDiagramFactory.java:56`). Its
`s.startsWith("skinparam ")` branch (`StyleExtractor.java:88-96`) keeps only
`handwritten` and drops the line; `applyStyles` (`:114`) carries `skin` and
`<style>`, never skinparams. The diagram's SkinParam therefore never holds
`lengthAdjust`, `SkinParam.java:1258-1269` returns SPACING, and the jar
oracles show `lengthAdjust="spacing"` + `textLength` on every `<text>` (>1
char) under all four variants (json 2/2, yaml 2/2, hcl 4/4, files 2/2 under
`none`; root `spacing` under `glyphs`).

**User ruling (2026-10-23, signed in chat; supersedes the unwind-U1 /
unwind2-S2 skinparam and hcl-style cuts for the LIBRARY default):** where the
jar ignores styling input that the port can honour, the port honours it as a
documented extension. Output for a source without that input stays
byte-identical to the jar's; conformance measures the jar-compatible
normalisation of the input; examples and docs show the extension. Scope: every
skinparam and styling directive (`skinparam`, `<style>`, `skin`, `!theme`)
the jar's `StyleExtractor` path drops for json, yaml, hcl and files.

**Amended decisions:**
- **D9 (new) — two style-input modes behind one internal seam.** The plugins'
  existing `styleInput` cuts (`jsonFamilyStyleInput`, `hclStyleInput`, and a
  new files cut mirroring `FilesDiagram`'s use of `StyleExtractor`) become
  the *jar-compatible normalisation*. `prepareBlock` (`src/index.ts:313`)
  applies them only when an internal option `jarCompatibleStyleInput: true`
  is set. That option lives on `InternalRenderOptions extends RenderOptions`
  in a new module that is NOT re-exported from `src/index.ts` and adds no
  field to the public `RenderOptions` (stop 10 stays untouched; the built
  `.d.ts` must be unchanged). The library default is the extended mode. Every
  conformance renderer that compares against a jar oracle via `renderSync`
  (svg-parity-survey, census, the lad authored harness, and any test found by
  grep) passes the internal option; `render-fixture-json.ts` already applies
  the cut explicitly and stays. Nested `{{ }}` renders inherit the options.
  Rejected: a public `RenderOptions` field (API change); module-level mutable
  state (global, leaks across nested renders); text-stripping `skinparam`
  lines in the harness (cannot reach a `!theme`'s injected skinparams).
- D1: json, yaml, hcl and files read `theme.lengthAdjust` like the other theme
  engines (extension); under the jar-compatible mode the cut leaves it
  `undefined`, which is the jar's SPACING.
- D2: unchanged (files re-routes for `data-diagram-type="FILES"`).
- D5: the authored gate renders in the jar-compatible mode. The `baseline` set
  becomes 13 rows: board/packet/chart × {default, glyphs, onechar} (9) and
  files × all four (4; the jar writes `textLength` under files `none`, our
  files emitter writes none). Extension behaviour is gated separately (D10).
- **D10 (new) — the extension is proven, pinned and documented.** A fitness
  test proves extended == jar-compatible output for every json/yaml/hcl/files
  fixture and corpus source with no styling directive. An extension audit
  lists, per engine, which skinparams/styles visibly take effect; only those
  that work are documented (`DIVERGENCES.md` "Extensions" section with the
  ruling date, plus a docs-site page with rendered examples). Example
  fixtures `tests/fixtures/extensions/<engine>-*.puml` with port-rendered
  `.svg` goldens are pinned by a ratchet that also asserts each example
  differs from its directive-free twin. A directive that does not work is
  listed as "ignored (jar-compatible)", never half-documented.
- D8: target = 64 authored rows `rootExact` (jar mode); `textLengthMatch` on
  the 51 `exact` rows; 13 `baseline` rows never worse; 0 conformant losses in
  28 engines (survey in jar mode); every pin stable; D10 examples green.
