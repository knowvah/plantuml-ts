# cdd3-T28 — description diagrams in the class corpus (E3-10/14/22/23; E3-9 split out)

Status: first pass implemented all five mechanisms and halted (stop 9: 246
non-class verdict movers, all from E3-9). Maintainer decision: split E3-9
out. The committed change carries E3-10, E3-14, E3-22 (+ `:h` ports) and
E3-23; E3-9 is saved as a patch — see "E3-9 — split out for a separate
description mission" below. Sections below describe the first pass; where
they cite survey numbers, those include E3-9 (the final numbers are in the
report at the end).

## Mechanisms ported (Java cited)

- **E3-9** — split out, NOT in the commit (see its own section).
- **E3-10** — `graph-layout-build.ts#addNodes` no longer regroups a port
  already ranked by its cluster's `portRanks` into a ROOT rankset
  (`ClusterDotString.java:136-137,254-260`; same exclusion
  `svek-dot-emit.ts#rankLines` already made). Real dot deletes the port from
  the cluster when both exist; sokevu was upside-down.
- **E3-22** — shielded description interface/circle nodes carry
  `getShield` margins (`EntityImageDescription.java:239-262`, via new
  `leaf-sizing.ts#measureLeafShield` →
  `leaf-sizing-entity.ts#measureEntityLeafShield`), and every edge touching a
  non-zero shield gets `tailport/headport = h` (`Bibliotekon.java:124-138`,
  `layout-helpers-shape-endpoint.ts#applyShieldEdgePorts`). sokevu `i`:
  `{x1:0.5,x2:0.5,y1:14,y2:14}` = jar svek-1.dot.
- **E3-23** — `width2 = (int) getMaxWidthFromLabelForEntryExit(...)`
  (`SvekNode.java:181-186`) truncated before BOTH the `> 40` test and the
  `- 40` pad (`portLabelWidth2`). sokevu pads 41/59 = jar.
- **E3-14** — (a) `usesClassUSymbolEntity` routes `descriptive`+`package`
  (`GeneralImageBuilder.java:160-167`); (b) `EntityImageDescription.name`
  is the real `BodyFactory.create2` block for `package_`, the only symbol
  whose `asSmall` reads `name` (`EntityImageDescription.java:198-199`,
  `USymbolFolder.java:177-183`) — new `EntityImageDescriptionName.ts`,
  construction moved out of `leaf-sizing-folder-title.ts` so sizer and
  drawer share it; (c) package title bold (`plantuml.skin:72-76,94-99`,
  `usymbol-resolve.ts#entityTitleStyles`) with a plain `fontBody` for a
  differing label (java:172-173); (d) class route roundCorner unconditional
  (`plantuml.skin:204-210` `element { RoundCorner 5 }`); (e) `codeName` is
  the entity id (`entity.getName()`, java:180) in both the class and the
  description param builders — the sizer already measured `node.id`.

## Observation: the description render path never saw the renderSync measurer
- **Context**: E3-9.
- **Finding**: `renderDescription`'s `measurer` param defaulted to
  `jarMeasurer` "so the public plugin path is byte-for-byte unchanged"; the
  survey moved to `renderSync` later, so every description survey row carried
  jar-font `textLength` against WidthTable layout. 173/266 component rows had
  `@textLength` as their first diff before the fix.
- **Impact**: component 1→52 conformant, usecase 2→27, unknown 118→161.
- **Confidence**: High (pre/post surveys, same session).

## Observation: description passed the display as `codeName`
- **Context**: E3-14(e), `cepedu-19-namu934` (`package foo1 [ ... ]`).
- **Finding**: `renderer-entity.ts` passed `codeName: node.display`, so
  `buildDesc`'s package branch (`display equalsLike codeDisplay`) dropped
  the label and the title drew the display text. The jar draws title `foo1`
  (bold) plus the label.
- **Impact**: any code/display split on a package leaf; now faithful.
- **Confidence**: High (jar in.svg).

## Observation: sokevu residual after all five mechanisms = builder omits ClusterDotString#hasPort()
- **Context**: measured after each step: 3S/98N → E3-9 → E3-23 1S/96N →
  E3-10 2S/84N → E3-22 1S/67N → :h ports 1S/64N.
- **Finding**: `E3-builder-vs-text3.mts` on sokevu: builder vs our own text
  DOT differ on the port-cluster anchor and all 4 edges. The text DOT has
  `subgraph cluster0ee` holding the anchor with its 67x14 title table, the
  `p->firstportname->nwd [arrowhead=none]` + `nwd->anchor` rank chain, and
  `:P` edge ports (`ClusterDotString.java:136-141,177-184,254-280`). The
  builder declares the anchor as a fixedsize 0.72px box with no `ee`
  subgraph, puts `label=n` on the cluster, has no chain edges and no `:P`
  headport. Text bb 247x256 (jar canvas 261x260) vs builder 247x227.
- **Impact**: a new mechanism (call it E3-10b), not one of T28's five;
  owns the remaining cluster Δ18 height / Δ7.83 width and the arrow tips.
- **Confidence**: High for the structural diff; the per-part attribution
  of the residual is not isolated.

## Observation: class USymbol route draws no stereotype
- **Context**: maxDelta rises 14→24 on unknown cevoti/gigoru/guxico/juzica.
- **Finding**: `renderer-usymbol-entity.ts#buildUSymbolEntityParams` passes
  `stereotypeLabels: []`; a `package X <<s>>` leaf, now routed, loses its
  «s» line (jar draws it; the class box used to). Same gap already applied
  to component/database/rectangle routed leaves. Per-element style colours
  (`<style> package { LineColor red }`) are also not threaded.
- **Impact**: reveal, not a new defect; follow-on for the class route.
- **Confidence**: High (guxico diff).

## Observation: state engine has the same untruncated port pad
- **Finding**: `state/state-leaf-node.ts:64-74` computes `labelWidth -
  40` without `(int)` — same `SvekNode.java:181-186`. Not changed (out of
  T28's description scope).
- **Confidence**: High (read).

## Gates and extra edits (uncommitted tree)

- Four gates green on the final tree: `npm test` 851 files / 22958 tests,
  `npm run typecheck`, `npm run lint`, `npm run build`;
  `tests/oracle/class-dot-parity.test.ts` green.
- `docs/catalog.md` regenerated (new `EntityImageDescriptionName.ts`, new
  exports).
- `tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts`
  forced-rise case: its premise "no baseline fixture reaches zero diffs"
  went false. Re-checked WITHOUT E3-9: still false — the ratchet renders via
  `renderDescription(geo, theme, measurer)` directly, so E3-9 never reached
  it; the first baseline fixture `bozana-38-xufi750` reaches 0 through E3-14
  (its `package "good-enough?" as goodenough` leaves: code name as bold
  title, display as label). Kept in the commit; it now samples the first
  fixture with a non-zero live count. No baseline file touched.
- D4 extensions beyond the primaries: `core/svek/image/{EntityImageDescription,
  EntityImageDescriptionDelegates, EntityImageDescriptionName (new),
  leaf-sizing, leaf-sizing-entity, leaf-sizing-folder-title}.ts`,
  `core/decoration/symbol/usymbol-resolve.ts`,
  `diagrams/description/{layout, layout-helpers, renderer-entity}.ts`, the ratchet test, `docs/catalog.md`.

## E3-9 — split out for a separate description mission

- **Patch**: `plans/class-divergence-drive-3/measurements/e3-9-description-measurer.patch`
  (applies cleanly on the T28 commit: `git apply <patch>`). Contents:
  `src/diagrams/description/index.ts` (`layoutSync` returns `{ ...geo,
  measurer }`; `render` passes `geo.measurer` to `renderDescription`),
  `layout-helpers-types.ts` (`DescriptionGeometry.measurer?`), `renderer.ts`
  (doc of the `measurer` param), and a new unit test
  `tests/unit/description/description-render-measurer.test.ts` (sokevu
  `textLength` 81.55 / 99.575, the jar's values).
- **Mechanism**: `descriptionPlugin.render(geo, theme)` calls
  `renderDescription(geo, theme)`, whose `measurer` defaults to `jarMeasurer`
  (`src/diagrams/description/renderer.ts:170-173`), while `layoutSync` sizes
  with the `renderSync` measurer (`src/index.ts` `ctx.measurer`). Draw-time
  `<text textLength>` and the ink-extent canvas therefore use real-AWT widths
  over a WidthTable layout. Upstream lays out and draws through one
  `StringBounder` (`svek/GeneralImageBuilder.java` builds the images with it;
  `SvekResult#drawU` draws with the same). sokevu `firstportname`: ours
  92.962, jar 81.55 (`jarMeasurer.measure('firstportname')` = 92.96191409).
- **Why it is wide**: the survey (`scripts/svg-parity-survey.ts:272-273`)
  renders through `renderSync` with `WidthTableMeasurer`, so every
  description-engine row carried the wrong `textLength`: before the fix 173
  of 266 component rows had `@textLength` as their first diff.
- **Measured (first pass, E3-9 + the other four, vs
  `/tmp/cdd3-T28-pre-<e>.json`)**: 246 non-class verdict movers, all upward —
  component 119 (68 diverged→structural-match, 42 diverged→conformant, 9
  structural-match→conformant; conformant 1→52), usecase 44 (conformant
  2→27), unknown 83 (conformant 118→161), object 0, state 0. Of these, only
  cepedu-19-namu934 (unknown) is attributable to E3-14; the rest are E3-9
  (confirmed: without E3-9 the non-class verdict movers drop to 1).
- **52 maxDelta reveals (verdict unchanged, maxDelta rose)**: component 20,
  usecase 7, unknown 25 in the first pass. Their `maxDeltaPath` moved to
  `svg/@width`/`@height`/`viewBox` or `text/@x`: with draw text measured by
  the layout measurer, the ink-extent canvas and centred text x expose
  pre-existing layout-width gaps that the (wrong, wider) jarMeasurer ink had
  masked. Structural fall + numeric rise = reveal. Four of them
  (cevoti/gigoru/guxico/juzica, 14→24) are E3-14's, not E3-9's (below).
- **Ratchet test**: the description ratchet adjustment does NOT belong to
  E3-9 (see above); it stays with the T28 commit.
- **For the mission**: expect every pinned description diff-count baseline to
  fall; re-pin deliberately after landing.

## Final report (after the E3-9 split)

**Fixtures (class render-all `/tmp/cdd3-T28-pre.json` → `/tmp/cdd3-T28b.json`)**
- sokevu-87-toce485: S3/N98 → S3/N71 (improved). Two of the three
  structural diffs left are E3-9's `textLength` (split out). The third is
  the `i→p` path, i.e. E3-10b (below).
- gujigi-63-roki030: S30/N576 → S23/N589 (improved; reveal). The E3-14
  package-leaf structural diffs are 0; the leaf now differs only by E3-13's
  Δ27 y offset (T32's).
- No other class row moved; no conformant fixture was lost.

**Non-class verdict movers (vs `/tmp/cdd3-T28-pre-<e>.json`): 1**
- unknown cepedu-19-namu934 diverged → structural-match: E3-14. Code name
  `foo1` is the bold title; the display is the label (java:180-199).
- component, usecase, object, state: 0 verdict movers.

**maxDelta movers, verdict unchanged: 58**
- 39 falls (component 29, usecase 1, unknown 9); none needs explaining.
- Rises (all reveals or layout moves from the kept mechanisms):
  - E3-22 shield margins + `:h` ports. These fixtures have a shielded
    interface/circle (jar svek-1.dot carries `PORT="h"`): component
    cudazo, pemifo, vaseda, dujodu, josoxo; unknown xagonu, bixixe.
  - E3-10/E3-23 port-cluster ranks and pad. These fixtures have ports:
    component bujige, cuxelu, dugovi, fopako; unknown nararo, neduvo.
  - E3-14, package leaf now drawn by EntityImageDescription:
    - component bozoju (+2.1 on a path): bold title plus create2 margins
      change the ink extent.
    - unknown cevoti/gigoru/guxico/juzica (14→24): the class USymbol route
      passes `stereotypeLabels: []` and no `<style>` colours, so the «s»
      line is dropped. This is an existing gap of that route, now reached
      by package leaves.
- The per-fixture attribution comes from feature presence plus the pre/post
  maxDeltaPath. Not bisected per mechanism.

**Gates**: `npm test` (851 files / 22957 tests), `npm run typecheck`, `npm
run lint`, `npm run build` all green; `tests/oracle/class-dot-parity.test.ts`
green; `docs/catalog.md` regenerated.

**Open artifacts**
- E3-9 patch (above).
- E3-10b: the layout builder does not port `ClusterDotString#hasPort()`
  (ee subgraph with titled anchor, port chain edges, `:P` headport). This is
  sokevu's residual.
- Class USymbol route: stereotype and style colours not threaded.
- State port pad untruncated.

**Commit**: see `git log` — the single `fix(cdd3-T28): ...` commit that
carries this note.
