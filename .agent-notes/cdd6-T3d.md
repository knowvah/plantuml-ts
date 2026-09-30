# cdd6-T3d observations

## Observation: worktree commits skip the prettier pre-commit hook
- **Context**: committing in `.claude/worktrees/cdd6-T3d`.
- **Finding**: `core.hooksPath` is `.husky/_`, which husky generates on
  install and which does not exist in a `mkwt.sh` worktree, so lint-staged
  (prettier --write) never runs; new test files landed unformatted until
  `npx prettier --write` was run by hand.
- **Impact**: agents in worktrees must run `npx prettier --check <files>`
  before committing, or the orchestrator's merge carries format drift.
- **Confidence**: High

## Observation: class edge labels have no wiki-creole path
- **Context**: xuloxo residual probe (`C --> X : **Label**`).
- **Finding**: the jar draws `Label` bold (31.85 wide); the port draws the
  literal `**Label**`. `class-edge-label-anchor.ts:85-92` strips only the
  HTML-like tags in `CREOLE_FORMAT_TAG_SOURCE` (`core/edge-label-box.ts:46`)
  and bolds only `<b>`; `**`, `//`, `<size:N>` are never parsed. Upstream
  builds the link label as a creole TextBlock (`SvekEdge.java:298-299`).
- **Impact**: every class-routed fixture with wiki markup in a link label
  diverges; C4 (xuloxo) is one.
- **Confidence**: High (jar probe, scratch)

## Observation: usymbol leaf ignores defaultTextAlignment, wrapWidth, stereo RoundCorner
- **Context**: xuloxo residual probes (collapsed `rectangle` leaf).
- **Finding**: `renderer-usymbol-entity.ts:165-172` hard-codes title
  alignment (upstream `styleTitle.getHorizontalAlignment()`,
  `EntityImageDescription.java:175`, fed by `defaulttextalignment` ->
  root HorizontalAlignment, `FromSkinparamToStyle.java:155`); `:299` uses
  `ELEMENT_ROUND_CORNER` unconditionally (upstream `styleTitle.value(
  PName.RoundCorner)`, java:168, so `rectangle<<person>> { RoundCorner 0 }`
  is dropped); no `style.wrapWidth()` reaches `BodyFactory.create3`
  (java:188-191; `wrapWidth` -> MaximumWidth, FromSkinparamToStyle.java:250),
  so the jar's word-split atoms never appear.
- **Impact**: all C4 fixtures routed CLASS.
- **Confidence**: High (each isolated by a one-skinparam jar probe)
