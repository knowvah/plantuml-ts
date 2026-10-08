# unwind-U1 — json-family divergences (title in hcl, skinparam, scalar root)

## Observation: the json family's directive handling is StyleExtractor, and it is narrow
- **Context**: unwinding DIVERGENCES "title inside @starthcl" / "skinparam applies in the json family".
- **Finding**: `StyleExtractor.java:63-103` recognises only `<style>`, `!assume `, `!pragma `, `hide `, `scale `, `title `, `skin `, `skinparam ` — and every one except `<style>` only while `list.size() <= 1` (before the first payload line). `caption`/`legend`/`header`/`footer`/`mainframe`/`sprite` are payload: json and yaml then render the "Your data does not sound like X data" page; hcl folds the line into the module name (`HclParser.java:77-89`) and, with one top-level module, drops the name (`:67-68`). The port had routed all six annotations and sprite definitions through shared matchers.
- **Impact**: any json-family "feature" that is a command elsewhere must be jar-checked here first; the family has no command table.
- **Confidence**: High (jar renders in tests/fixtures/unwind-U1/)

## Observation: UmlSource.seedSourceLines IS upstream's iterator2()
- **Context**: needed the skinparam/<style> lines the preprocessor collector strips from `UmlSource.lines`.
- **Finding**: `seedSourceLines` = TIM result -> breakline split -> loadInternal -> patchBase64, i.e. exactly the `UmlSource#source` list factories iterate (`PSystemBuilder.java:239-243`). Hand-built UmlSources lack it; `upstreamSourceLines` restores the @start/@end wrappers.
- **Impact**: any engine that must see collector-stripped lines can read it without a core type change. The json conformance harness (render-fixture-json.ts) did not pass it -- now does.
- **Confidence**: High

## Observation: other json-family divergences found, NOT fixed here (not in U1 scope)
- **Context**: reading HclParser/HclSource while porting.
- **Finding**: (1) `HclSource.add` (`HclSource.java:48-53`) concatenates lines with NO separator; `hcl/parser.ts` joins with ' '. (2) `hcl/parser.ts#isFlatAssignment` accepts top-level `a = 1`, documented as "an extension beyond the Java parser" — the jar throws (`HclParser.java:88`) -> error page; no DIVERGENCES entry. (3) HCL `<style>` is the separate "Style selector support" entry.
- **Impact**: candidates for a follow-on unwind.
- **Confidence**: High. (2) jar-rendered: `a = "1"` / `b = "2"` at top level -> "Your data does not sound like HCL data". (1) only bites an UNQUOTED value followed by an unindented line (`a = 1` + `b = 2` -> token `1b`); quoted values and `}` delimit.

## Observation: !theme in the json family works only because the baked theme is <style> residue
- **Context**: cutting skinparam for the json family (`json-family-style-input.ts`).
- **Finding**: `!theme X` both executes (TIM inlines the theme: its skinparams land in `preprocessed.skinparam`, its `<style>` in `preprocessed.styles`) AND applies a baked Stage-1 layer (`themes-builtin-*.ts`), which `scripts/compile-themes.py` documents as the residue of `<style> root` fields the executed path does not reach. Dropping Stage 1 for json lost amiga's node colours (root BackgroundColor/FontColor/LineColor never cascade into `jsondiagram.node`); keeping it and cutting only skinparam matches the jar for amiga and aws-orange. amiga's Verdana had reached json only via `skinparam DefaultFontName` (puml-theme-amiga.puml:83); the jar's comes from `<style> root { FontName }` (:36), so a root/element FontName cascade was added (`style-map-global.ts#resolveGlobalFontName`).
- **Impact**: the json family's root/element cascade is still partial (FontName only; colours via the residue). A user `<style> root { FontColor ... }` in @startjson is not mirrored. MANUAL `fn` residue entries (reddress-*, etc.) may be skinparam-derived and still reach json.
- **Confidence**: High for amiga/aws-orange (jar fixtures); Medium for the MANUAL residue claim (not rendered).

## Observation: json/yaml title chrome sits 10px short of the jar (pre-existing)
- **Context**: jar fixtures json-title / yaml-title / *-title-only.
- **Finding**: jar title text at x=20,y=30.889 (doc margin 10 + skin `title { Padding 5; Margin 5 }`, plantuml.skin:30-38); ours x=10,y=20.889 and the document 21px narrower. Identical diffs on the pre-U1 parsers, so not caused by U1. Lives in core/annotations chrome composition with the json fragment.
- **Impact**: follow-on for whoever owns src/core/annotations; pinned by count in tests/unit/json/unwind-u1-jar.test.ts.
- **Confidence**: High (measured before and after)
