# T4f — factory, pragma, parser selection

Agent: `typescript-pro` (sonnet), worktree `sdd3-T4f`. Commit:
`feat(sprite): select the SAX svg parser from !pragma svgparser`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`SvgSpriteParserFactory.create` (`SvgSpriteParserFactory.java:79-103`)
concatenates the sprite's SVG fragments (md5 base64 placeholder replace
`:82-89`), then returns `SvgSaxParser` only when the pragma value, trimmed and
lower-cased, is `sax` (`getParserSelector` `:109-121`; missing/blank -> `nano`).
The pragma is read **at sprite definition** — `CommandSpriteSvgMultiline.java:
103` and `CommandSpriteSvg.java:81-82` call it with `system.getPragma()` — so
a sprite defined before `!pragma svgparser sax` stays nano. The port drops the
pragma (`sequence/command-common.ts:46-53` no-ops everything but
`sequenceMessageSpan`) and `core/sprite-commands.ts#registerSvg` (`:270-279`,
callers `:302-312`) builds `SpriteSvg.from(svg)`; the draw site
`creole-atoms-image-resolver.ts:399` -> `resolveSvgSpriteAtom` (`:296-318`)
always does `new SvgNanoParser(svg).drawU(...)` (`:311`).
Other callers pass no pragma and stay nano (`Stdlib.java:397`, `Emoji.java:172`, `SpriteImage.java:110`).
Seam: `sprite-commands.ts` scans lines in order, so it tracks the last
`!pragma svgparser <v>` line it passes and stamps `SpriteSvg.parser`
(`'nano' | 'sax'`, default nano); the resolver picks by `sprite.parser`.
Read the sequence path too (`sequence/command-sprite.ts`) to confirm which
module owns the definition order for sequence. Also port `drawU` selection for
description/state callers `EntityImageDescriptionDelegates.ts:498` (they
read the same `SpriteSvg`).

## Targets
The 30 sequence rows `svgparser-sax-unported` in the TSV, plus
`cenucu-07-mepi600` (unknown engine; `grep -lis 'pragma *svgparser'
test-results/dot-cache/unknown/*/in.puml` finds only it).

## Write-set
`src/core/klimt/sprite/sax/svg-sprite-parser-factory.ts` (new),
`src/core/klimt/sprite/SpriteSvg.ts`, `src/core/sprite-commands.ts`,
`src/core/creole-atoms-image-resolver.ts`,
`src/core/svek/image/EntityImageDescriptionDelegates.ts` (the one `:498` call),
`src/diagrams/sequence/command-common.ts` (comment/no-op text only if the
pragma stays consumed in `sprite-commands`), tests under
`tests/unit/core/klimt/sprite/sax/` and `tests/unit/core/sprite-commands*.test.ts`.

## Read-set
`SvgSpriteParserFactory.java:60-123`; `SvgSaxParser.java:101-145`; the files
above at the cited lines; `tests/oracle/svg-conformance/render-fixture-sequence.ts`.

## Interface contracts
`createSvgSpriteParser(svg: string, selector: 'nano' | 'sax'):
{ drawU(ug, scale, fontColor, forcedColor): void }` (both classes satisfy it).
`SpriteSvg.parser: 'nano' | 'sax'`. No public API change (stop 10).

## Acceptance
- Given `!pragma svgparser SAX ` before a sprite, then that sprite draws via
  SAX; a sprite defined before the pragma, or with a blank/other value, draws
  via nano.
- Given the 31 targets, then `diff-one` ws falls on each; report the ones that
  reach zero (orchestrator pins) and the owner of every remainder.
- Given every non-sax fixture in every engine, then the nano path is
  byte-identical (`verdict-diff.mjs`; non-sequence movers only `sax` rows).
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine; `grep -rn 'node:' src/core/klimt/sprite/sax` is empty.

## Observability
N/A.

## Rollback
Reversible.
