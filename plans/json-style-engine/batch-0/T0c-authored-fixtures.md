# T0c — authored fixtures for the style gaps (D7)

Agent: `typescript-pro` (sonnet), worktree `jse-T0c`. Commit:
`test(json): authored fixtures for json-family style resolution (T0c)`.
Read [../task-contract.md](../task-contract.md).

## Context
The four target rows exist (`tests/fixtures/json/{highlight-stereotype,
style-highlight-block,style-header-separator-arrow,theme-cerulean}`). The
gaps around them have no fixture. Read the existing json/yaml/hcl authored
rows and `test-results/dot-cache/{json,yaml,hcl}/*/in.puml` first; do not
duplicate a construct.

## Task
Author flat `<slug>.puml` + `<slug>.svg` (oracle via `bash scripts/oracle-render.sh <ABSOLUTE dir> <puml>`,
never a hand-typed jar), one construct each:
- json: `diagram-fontcolor-no-node` (`<style> jsonDiagram { FontColor red }`, no `node` block);
  `root-fontcolor` (`<style> root { FontColor red }`); `header-highlight`
  (`jsonDiagram { node { header { FontColor blue } highlight { BackGroundColor yellow } } }` + a
  highlighted key — exercises `+header+highlight`, `TextBlockJson.java:141-143`);
  `header-fontsize` (`header { FontSize 20 }` — measurement path);
  `separator-style` (`separator { LineColor red; LineThickness 2 }`);
  `arrow-style` (`arrow { LineColor red; LineThickness 2 }`);
  `node-roundcorner` (`node { RoundCorner 25 }`); one more named theme whose
  node `BackgroundColor` is a gradient (find one in
  `~/git/plantuml/src/main/resources/themes/` other than cerulean; name the slug `theme-<name>`).
- yaml: `highlight-stereotype`, `style-highlight-block`, `style-header-fontcolor`
  (yaml resolves as `yamlDiagram`, `TextBlockJson.java:113` — write the selector as `yamlDiagram`).
- hcl: `style-with-theme` (`!theme cerulean` + `<style>`: both IGNORED by the jar, `HclDiagramFactory.java:86-92`).

Every svg root carries the jar's `data-diagram-type`; a jar error page is fixed
once, a second error on the same construct is stop 13 (drop it, Java reason).

## Write-set
`tests/fixtures/json/<new slugs>.{puml,svg}`, `tests/fixtures/yaml/<new slugs>.{puml,svg}`,
`tests/fixtures/hcl/<new slugs>.{puml,svg}` — new files only.

## Acceptance
- Given the directories, then each new `.puml` has a `.svg` with the jar's `data-diagram-type`.
- Given `npx vitest run tests/oracle/svg-conformance/json-family-structural.test.ts`, then green (new rows report as unpinned, never fail).
- Hand-back: one line per slug — construct, Java line, structural diff count today.

Observability: N/A. Rollback: Reversible.
