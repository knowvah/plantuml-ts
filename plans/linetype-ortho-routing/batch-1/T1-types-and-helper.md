# T1 — `DotInputGraph.linetype` + the shared `dotSplinesAttrs` helper

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. The Java at `~/git/plantuml` is the
**canonical specification** — read the method, not a filename.

This task lands the shared contract both emitters will consume. **It is
inert**: nothing sets `linetype` until Batch 2.

## Task
1. Add `linetype?: 'ortho' | 'polyline'` to `DotInputGraph`
   (`src/core/graph-layout.types.ts`), with a doc comment citing
   `DotStringFactory.java:161-169` and pointing at [D1].
2. Create `src/core/dot-splines.ts` exporting one pure function:

```ts
export function dotSplinesAttrs(
  linetype: 'ortho' | 'polyline' | undefined,
): ReadonlyArray<readonly [string, string]>
```

Returning, exactly:
- `undefined` → `[]`
- `'polyline'` → `[['splines', 'polyline']]`
- `'ortho'` → `[['splines', 'ortho'], ['forcelabels', 'true']]`

**Read the Java before writing the comment.** `DotStringFactory.java:161-169`
is the whole spec:

```java
final DotSplines dotSplines = skinParam.getDotSplines();
if (dotSplines == DotSplines.POLYLINE) {
    sb.append("splines=polyline;");
    SvekUtils.println(sb);
} else if (dotSplines == DotSplines.ORTHO) {
    sb.append("splines=ortho;");
    sb.append("forcelabels=true;");
    SvekUtils.println(sb);
}
```

Note the ORTHO arm appends BOTH before ONE `println` — that is why the jar's
cached DOT carries them on one line, and why the return type is an ordered
list of pairs rather than a record.

## Write-set
- `src/core/graph-layout.types.ts`
- `src/core/dot-splines.ts` (new)
- `tests/unit/core/dot-splines.test.ts` (new)

**Not** `graph-layout-build.ts` (T2). **Not** `svek-dot-emit.ts` (T3).

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D1, D2, D4
- `src/core/graph-layout.types.ts:334-400` — `DotInputGraph`'s existing fields
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:150-175`

## Architecture decisions
[D1] semantic enum, not a raw `splines` string · [D2] the coupling lives here,
once · [D4] polyline gets NO forcelabels.

## Interface contracts
Produced, consumed by T2 and T3:
```ts
dotSplinesAttrs(linetype?: 'ortho' | 'polyline'):
  ReadonlyArray<readonly [string, string]>
```
Order is part of the contract: `splines` first, `forcelabels` second.

## Acceptance criteria
- Given `undefined`, when `dotSplinesAttrs`, then `[]`.
- Given `'polyline'`, then exactly `[['splines','polyline']]` — asserting
  length 1, so a stray `forcelabels` fails ([D4]).
- Given `'ortho'`, then exactly `[['splines','ortho'],['forcelabels','true']]`
  in that order.
- Given the full suite, then **NO fixture moves** — this task is inert.
- Given `git diff --name-only`, then only the write-set changed.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One new module plus one optional type field.

## Quality bar
All four gates green, `Test Files` == **685** (684 + the new
`dot-splines.test.ts`). Complexity hook enforced: 500-line file / 30-NLOC
function / 10 CCN / 5 params.

## Commit
`feat(lor-T1): add DotInputGraph.linetype and the dotSplinesAttrs helper`
