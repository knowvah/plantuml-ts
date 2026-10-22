# T8c — `<style src=>` import; `</?style>` close

Agent: `typescript-pro` (sonnet), worktree `sdd2-T8c`. Commit:
`fix(core): style import and style-block close as upstream`.
Read [../task-contract.md](../task-contract.md) first. Core, all engines.

## Mechanisms (research D §2 bomino; cluster Y gixaxu)
- **Import**: `style/CommandStyleImport.java:67-79` (regex), `:99-125`
  (URL / file / internal `/skin/` resolution); registered
  `CommonCommands.java:93`. Built-in skins: `core/skins-builtin.ts:255`
  has `strictuml`. File and URL forms go through the include resolver
  seam (no blocking I/O in `src/` — CLAUDE.md); mirror the jar's
  behaviour when unresolvable.
- **Close**: a second `<style>` closes the first:
  `style/CommandStyleMultilinesCSS.java:58` (END = `</?style>`). The port's
  `RE_STYLE_CLOSE` (`core/preprocessor-collector.ts:13`) matches
  `</style>` only, so the next message is swallowed into the style block.

## Targets
bomino-39 (render; 21 diffs expected), gixaxu.

## Write-set
`src/core/preprocessor-collector.ts`, its tests (plus a new core helper
file if the import needs one — journal it).

## Read-set
`research/research-d-structure.md` §2, Y; `preprocessor-collector.ts`;
`core/skins-builtin.ts`; the Java above.

## Acceptance
- Given `<style src=strictuml.skin>`, then the built-in skin's styles apply
  (test).
- Given `<style>` … `<style>` … `</style>`, then the second opener closes
  the first block (test citing `CommandStyleMultilinesCSS.java:58`).
- Given bomino and gixaxu, then they render with no structural sites;
  every engine's pins unchanged.
