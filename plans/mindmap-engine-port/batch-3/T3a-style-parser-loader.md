# T3a: style parser, loader, mindmap style assembly

Return only the structured report: commit sha(s), files changed, per-check or per-fixture
before → after, residuals with mechanisms (Java + port `file:line`), write-set extensions,
test counts (collected files). No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(`src/main/java/net/sourceforge/plantuml/`) is the specification. Read `CLAUDE.md` first
("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting", "Preserve
upstream names"). The oracle is the 1.2026.8beta1 jar (`oracle/dist/plantuml-oracle.jar`);
mindmap goldens are cached at `test-results/dot-cache/mindmap/<slug>/in.svg`. Render new
oracles only via `scripts/oracle-render.sh <out-dir> <puml>`. Jar values for tests come
from the T0c probes (`plans/mindmap-engine-port/tools/probe/`), never from guesses.
Brief: `plans/mindmap-engine-port/` (README, decisions.md D1–D12).

## Task (TDD)
1. Port `style/parser/StyleParser.java` (361), `parser/Context.java` (144),
   `parser/CssVariables.java` (74), and the tokenizer helpers they reach (`StyleScheme`,
   char inspection). Nesting depth > 2, `:depth(n)` (→ `addLevel`), `*` (→ `addStar`),
   `.stereotype`, comma selectors, `!important`-style priorities as the Java has them.
2. Port `style/StyleLoader.java:60-187` (`loadSkin` over T0d's embedded skins,
   `DELTA_PRIORITY_FOR_STEREOTYPE`, `addPriorityForStereotype`, missing-root check).
3. `buildMindmapStyleBuilder(preprocessed)`: mirror `skin/SkinParam.java:155-265`.
   Load the base skin lazily (`plantuml.skin`, or `skin <name>`). Then mute, in source
   order, each skinparam (via T3b's `FromSkinparamToStyle`) and each `<style>` block
   (via `StyleParser`). Take the order from the read-only seam
   `src/core/style-skinparam-segments.ts` (`declarationOrder`). `skinparam style
   strictuml` mutes with `strictuml.skin`. `!theme` text reaches here already expanded
   by the preprocessor.
T3b's converter is consumed through the interface below. Until T3b merges, stub it to a
no-op behind that interface in a test double only; do not edit T3b's file.

## Write-set
`src/core/style/parser/{StyleParser,Context,CssVariables,StyleScheme}.ts`,
`src/core/style/StyleLoader.ts`, `src/core/style/mindmap-style-builder.ts`
+ tests `tests/unit/core/style/{style-parser,style-loader,mindmap-style-builder}.test.ts`.

## Read-set
`~/git/plantuml/.../style/parser/*.java`, `StyleLoader.java:60-187`,
`skin/SkinParam.java:155-265`; `src/core/style-skinparam-segments.ts:1-80` (read-only);
`src/core/skin-loader.ts:120-160` (how theme/skin text arrives; read-only).

## Interface contracts
```ts
export function parseStyles(text: string, builder: StyleBuilder): Style[]; // StyleParser#parse
export function loadSkin(name: string): StyleBuilder;                         // StyleLoader#loadSkin
export function buildMindmapStyleBuilder(pre: PreprocessorResult): StyleBuilder; // consumed by T4a/T5a
// from T3b:
export function convertSkinparam(key: string, value: string, builder: StyleBuilder): Style[];
```

## Acceptance
- Given `:depth(n)`, `*`, `.stereotype`, comma selectors and nesting deeper than 2, then
  the parsed storage matches the jar's (StyleProbe).
- Given the default skin plus a user `<style>`, then load order and overrides match the jar's.
- Given skinparam and `<style>` interleaved, then the source order decides as in SkinParam.

## Architecture decisions (locked)
D1, D2 (as corrected: skin first, then skinparam/`<style>` in source order), D12; stop 11.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/core/style/`
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`feat(style): port the style parser and mindmap style assembly`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
