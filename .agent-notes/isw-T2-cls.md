# isw-T2-cls report

## Commits (branch isw/T2-cls)
- 3e9aa84e1 fix: member/note/note-table atoms draw shifted by leading spaces (F2a/c/d)
- d241df508 fix: plain row + namespace-title runs follow DriverTextSvg (F2b/F2f)
- ccf7ff57c fix: edge label, cardinality, constraint, Kal runs (F2e)
- (F3) note/legend bodies: BlocLines.removeEmptyColumns; merged raw line untrimmed
- (F3d) description note bodies same
- 46617c38c fix: description [ x ] labels keep their spaces (F4)
- f6492a9fb fix: TYPE0 multi-line element dedent (F7)
- 62f80ced1 fix: empty package label = one " " atom (S*)
- bd984a5fb, d8ca429d4 test: S/P re-pins
- 51662f17a fix: quoted class display keeps inner spaces (found by probe)

## Families: Java -> ours
- F2: DriverTextSvg.java:113-126 -> class-member-creole-render-text.ts#textRenderFields (renderDx/renderWidth on text atom), consumed at renderer-classifier-rows.ts, renderer-note.ts, renderer-note-lines.ts; class-driver-text-placement.ts (placeDriverRun/plainRowRender) for rows (ClassifierRowGeo.renderDx/renderWidth via class-layout-header-creole.ts), class-namespace-title-runs.ts, renderer-edge-label.ts, renderer-edge-extras.ts, class-kal.ts; object `name : type` keeps group 2 ' : type' (Display.java:471-479).
- F3: BlocLines.java:234-263 -> class-note-columns.ts, class-notes.ts, class-line-merge.ts (rawLines untrimmed; also fixes tonake legend), description/note-columns.ts + note-dispatch.ts + parse-state.ts.
- F4: CommandCreateElementFull.java:126 -> parse-helpers-strings.ts stripUrl/extractTags, command-table-containers.ts (no trim of bracket content).
- F7: CommandCreateElementMultilines.java:169 -> class-multiline-element.ts pushBodyLine always dedents.
- lisepi: NOT fixed (see below).
- S*: jar probe: "" and " " packages both get title table WIDTH=3 HEIGHT=9, tab wtitle 9.85, htitle 20. -> class-dot-clusters.ts isLabel=true; class-package-style.ts getHTitle uses namespaceTitleWidth.

## Open / observations
- lisepi: object `<style> object/map/json {FontSize,FontStyle,FontName,RoundCorner,...}` is not applied to member rows/rect (rows stay 14pt; jar 12pt): node 0 jar 1.541319x0.75in vs ours 1.682118x0.805556in. maxSizeDeltaIn now 0.140799 (pin 0.055556). Pre-existing unbuilt feature; orchestrator decides pin.
- core (T2-core): src/core/stereotype-decoration.ts#splitStereotypeTokens trims label; Stereotype.java:122-133 regex `<<\s?(..)\s?>>` keeps one inner space each side: jar `class A <<  spaced  >>` draws "«  spaced  »"-ish (+6.6 @12pt), `package p <<  st  >>` draws "« st »".
- Pre-existing, unrelated: folder package multi-line title second line is centred by jar (x 22.25) but left-aligned by ours (class-namespace-shape.ts xForLine); description link labels/notes positions diverge (node a --> b : q). description opale-note probe has g-order/childCount diffs.
- Not changed: renderer-edge-extras kal etc. covered; badge-tag/empty-package/list-number text() sites probed (no diff).
