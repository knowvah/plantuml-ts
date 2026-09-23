# T5 — relationship AST/grammar fields

**Agent:** typescript-pro (sonnet) · **Depends on:** —

## Context

Six A2a mechanisms are unbuilt at the AST/grammar layer, before geometry or
rendering ever sees them: `[[url]]` on a link (M3), a dashed BODY silently
dropped when a decor wins `resolveType` (M4), REDEFINES/DEFINEDBY/`^`/middle
circle glyphs the grammar cannot name (M6), `constraint on links` text
collapsed to a boolean (M9), and `-[hidden]-` mis-recognised as a plain
NON_COLOR_KEYWORD instead of dropped (M12, bucket LNK12). The drawables for
M6 already exist (`src/core/svek/extremity/*`, `link-decor.ts:47-68`); this
task is purely the class-side glyph→field wiring. Mechanisms: `diagnosis/
A2a-link-groups.md` M3, M4, M6, M9, M12. Re-read the cited Java bodies
before editing — the report is a lead, not the finished description.

## Task

1. Tests first, per mechanism, using minimal `.puml` probes (mirror M4's
   `probe.ts` pattern): `A ..> B` (plain dashed, unaffected), `A *..> B`
   (composition + dashed body → `dashedBody: true`), `A -[hidden]- B`
   (`hidden: true`), `foo <||--^ bar` (REDEFINES/EXTENDS at opposite
   ends — confirm which end from `LinkDecor.java` before asserting),
   `foo1 -0)- foo2` (`middleDecor: 'circleConnect'`), `a1 --> a2
   [[http://x]] : foo` (`url` populated).
2. `class-arrow-grammar.ts#resolveArrow` (`:294-300`): also return the
   dashed-ness of the body glyph (`canonical.includes('.')`, already
   computed at `:300`) instead of discarding it.
3. `class-relationship-parser.ts`: set `Relationship.dashedBody` from
   step 2, INDEPENDENT of `resolveType`'s decor precedence
   (`CommandLinkClass.java:491-509`, `LinkType.java:71-81,115-121` — decor
   and line style are separate Java fields; don't let one derive the
   other here either).
4. Capture `[[url]]` on the relationship grammar (`CommandLinkClass.java:
   356-361`); reuse `class-url.ts`'s `UrlInfo` type, don't invent a new one.
5. Widen `class-relationship-ast.ts`'s `LinkDecor` union (`:49-63`) and
   `class-arrow-decor-map.ts`'s `HEAD_TO_DECOR` (`:38-60`) with `redefines`,
   `definedBy`, `arrowTriangle`, `circle`, `circleFill`, `circleConnect`,
   `halfArrowUp`, `halfArrowDown` (`LinkDecor.java:70-104,174-222`); add a
   `middleDecor` field fed by the `INSIDE` regex group
   (`CommandLinkClass.java:498-507`), currently unread by this port.
6. Widen `Relationship.linkConstraint` from `boolean` (`class-relationship-
   ast.ts:181`) to `{ text: string } | undefined`, capturing the display
   text alongside the existing `CONSTRAINT_SPOT` boolean trigger.
7. Recognise `-[hidden]-` as its own `hidden: boolean` field instead of
   falling through the NON_COLOR_KEYWORD path (`class-arrow-grammar.ts:354`)
   — name the keyword, don't just discard it silently.
8. `.agent-notes/cdd-T5.md`: which end (`source`/`target`) REDEFINES and
   EXTENDS bind to for `<||--^` — confirm or correct step 1's assumption
   from `LinkDecor.java` and record the answer.

## Read-set

`net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:
356-361,491-509,498-507`; `net/sourceforge/plantuml/decoration/LinkType.java:
71-81,115-121`; `net/sourceforge/plantuml/decoration/LinkDecor.java:
70-104,174-222`; `net/sourceforge/plantuml/svek/SvekEdge.java:835-836`;
`net/sourceforge/plantuml/abel/Link.java:177-182`; `src/diagrams/class/
class-relationship-parser.ts` (whole); `class-relationship-ast.ts:49-63,181`;
`class-arrow-grammar.ts:190-215,248-254,294-300,354`; `class-arrow-decor-
map.ts:38-60`; `class-dot-edges.ts:34-40`; `src/core/svek/extremity/
link-decor.ts:47-68`; `src/diagrams/class/class-url.ts` (whole, `UrlInfo`).

## Write-set

`src/diagrams/class/class-relationship-parser.ts`,
`class-relationship-ast.ts`, `class-arrow-grammar.ts`,
`class-arrow-decor-map.ts`, their `.test.ts` files, `.agent-notes/cdd-T5.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T6)

```ts
interface Relationship {
  url?: UrlInfo
  dashedBody: boolean
  hidden: boolean
  linkConstraint?: { text: string }
  middleDecor?: 'circleConnect' | string // other INSIDE forms if found
  sourceDecor: LinkDecor // widened
  targetDecor: LinkDecor // widened
}
// LinkDecor += 'redefines' | 'definedBy' | 'arrowTriangle' | 'circle'
//            | 'circleFill' | 'circleConnect' | 'halfArrowUp' | 'halfArrowDown'
```

## Acceptance criteria

- Given `A *..> B`, when parsed, then `dashedBody === true` and the decor
  is `composition` — independent fields, per `LinkType.java`
- Given `A -[hidden]- B`, when parsed, then `hidden === true`
- Given `foo <||--^ bar`, when parsed, then one end's decor is `redefines`
  and the other `arrowTriangle`, orientation confirmed against
  `LinkDecor.java` (not assumed)
- Given `foo1 -0)- foo2`, when parsed, then `middleDecor === 'circleConnect'`
- Given `a1 --> a2 [[http://x]] : foo`, when parsed, then `url.href ===
  'http://x'`
- Given `constraint on links: enten/eller`, then `linkConstraint.text ===
  'enten/eller'`

## Observability

N/A — no new observable operation; parser/AST change only.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`npx tsx tools/render-diff.mts` on `guxode-39-dobi371`, `fitini-85-kupo803`,
`nixema-71-tuke505`, `cenubi-27-xova754` before/after — AST-only changes
should not move rendered geometry yet (T6/T7 consume the new fields); note
any unexpected movement in the journal. `class-relationship-parser.ts`
(498 lines) and `class-relationship-ast.ts` are already near the 500-line
hook cap — a split re-export is pre-authorised (stop 1) if a new field
pushes either over.

## Boundaries

Always: read `LinkDecor.java` before asserting which end REDEFINES/EXTENDS
bind to. Ask first: any stop condition in `../README.md`. Never: touch
`class-edge-geo.ts`/`class-geo-types.ts`/`renderer-edge.ts` (T6/T7's
write-set); fit the `middleDecor` string union without checking whether
`INSIDE` has forms beyond `0)`/`(0` in the corpus.

## Commit

`feat(cdd-T5): widen Relationship AST for url, dashed body, hidden, decors`

Body: why AST-only (T6 wires geometry, T7 renders); cites A2a M3/M4/M6/M9/
M12.
