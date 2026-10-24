# T3c — decode `\n` and `<U+XXXX>` in `xlink:title`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T3c`. Commit:
`fix(svg): decode escapes in link xlink:title as the jar does`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`SvgGraphics.java:1147-1160` `LinkData#getXlinkTitle` (verified): a null
title returns the url; else every `<U+XXXX>` (`p` at `:1144`) becomes the
char with that hex code and every literal two-char `\n` becomes a newline.
`:1170-1172` writes that value to both `title` (XLINK_TITLE1) and
`xlink:title` (XLINK_TITLE2). Port: `src/core/svg.ts:378` `linkWrap` writes
`url.tooltip` verbatim at `:394-395`. Decode once, apply to both attributes.
Other callers of `linkWrap` (state, class, sequence participant shapes) get
the same decode: that is the jar's behaviour for every engine.

## Targets
kofixo-02-xoso627, nidozi-08-daxa280, povuju-50-pido564, raxeca-83-rotu897,
sulipe-44-jeta861: ws to 0. Any non-sequence row that moves needs a row-by-row
explanation by this mechanism (stop 13).

## Write-set
`src/core/svg.ts`, `tests/unit/core/svg-link-title.test.ts` (new). File-
disjoint from T3b unless T3a's proposed write-set includes `svg.ts` (see
overview): then run T3c after T3b.

## Read-set
`SvgGraphics.java:1135-1180`; `svg.ts:360-400`; `svg.ts` `attrs`/escape
(`~:140-160`) so decoded newlines still escape correctly.

## Acceptance
- Given a tooltip `a\nb<U+0041>`, when wrapped, then `title` and
  `xlink:title` hold `a`, newline, `b`, `A` (escaped by `attrs`), citing
  `:1147-1160`.
- Given the 5 targets, then each is zero-diff in classify.
- Given the all-engine survey, then no conformant row is lost and hashes move
  only for tooltips carrying those escapes.
- Given the 1042 pins, then all stay byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
