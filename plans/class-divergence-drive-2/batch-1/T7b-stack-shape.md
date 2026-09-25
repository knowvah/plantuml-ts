# T7b — `stack` container shape (USymbolStack)

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T7
(shares the namespace-shape dispatch in `class-namespace-shape.ts`).
Added by T6: the R report found lojiga's defect is structural (an
unported shape), not canvas; D2 puts structure first.

## Fixtures

lojiga-09-meka859

## Mechanisms

- **R-8** — `stack a as a { ... }` is parsed to a container kind
  (`class-container.ts:333`, `['STACK', 'stack']`) but has no shape
  renderer; it falls back to the folder path. Upstream
  `klimt/.../USymbolStack` (`drawQueue`) draws an inner `URectangle`
  (`width - 2*border`, `border = 15`) plus a notched outline `UPath`.
  First structural diff: `exp=rect | act=path`. Port the WHOLE
  `USymbolStack` class (all its draw/dimension methods), plus the
  `LimitFinder` ink rule for the shapes it draws. HIGH on identity,
  MEDIUM that it explains all 158 numerics — re-run render-diff after.

## Write-set

New `src/diagrams/class/class-namespace-stack-shape.ts` (mirror
`class-namespace-usymbol-shape.ts`'s pattern), `class-namespace-shape.ts`
(dispatch), `class-container.ts` (only if the kind needs a field),
`class-ink-shapes.ts` + `class-ink-box.ts` (ink rule), tests beside each.

## Read-set

`diagnosis/R.md` (lojiga section); `class-namespace-usymbol-shape.ts`;
`~/git/plantuml/src/main/java/net/` — grep `class USymbolStack`.

## Acceptance criteria

- Given lojiga, when it renders, then its structural diff count is 0
- Given the new shape, when its unit test runs, then it asserts the jar's
  `rect` + `path` geometry with the Java line in the test name
- Given the 560 conformant fixtures, when render-all runs, then none leaves
  conformant

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
