# T2 — strip creole markup before measuring an edge label

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the spec. Read the Java method body before stating why
anything differs, and cite `file:line` when you do.

Edge labels reserve a box in the DOT handed to graphviz. Upstream sizes it from
a real creole `TextBlock` (`svek/SvekEdge.java:441`,
`labelText.calculateDimension(stringBounder)`), where `<color:green>` is a
formatting change. This port measures the raw string, so those 13 characters
are counted as glyphs — twice on a two-line label.

Measured on `usecase/jecici-56-bimu826`, whose oracle box is **72 x 22**:

| measured | width |
|---|---|
| raw string | 336.1 |
| creole markup stripped | 175.6 |
| + max-over-lines instead of the concatenation | 70.0 |

T1 has already given you the max-over-lines half by relocating
`computeReservedLabelBox`. This task removes the markup.

## Task

Add `stripCreoleMarkup(text: string): string` to `src/core/edge-label-box.ts`
(created by T1) and apply it inside the box computation, before measuring.

Strip the inline formatting tags that carry no glyphs. At minimum the forms
present in the corpus and named in `planning/mission-guide.md`'s Phase 4h
watch-outs: `<color:…>`, `<back:…>`, `<b>`, `<i>`, `<u>`, `<s>`, `<size:N>`,
and their closing forms.

**Do NOT strip `<img:…>` or `<$sprite>`.** Those DO occupy width, and
`creole-atoms-measure.ts#measureLineWithAtoms` already sizes them. Whatever you
strip must leave the atom scan intact — check
`src/core/creole-atoms.ts#scanLineForAtoms` for the exact atom syntax before
writing the pattern.

## Write-set

- `src/core/edge-label-box.ts`
- `tests/unit/core/edge-label-box.test.ts`

## Read-set

- `src/core/creole-atoms.ts` — atom syntax you must not break
- `src/core/creole-atoms-measure.ts:133` — `measureLineWithAtoms`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/` — the
  command classes that consume each tag, so the list is derived rather than
  guessed

## Architecture decisions (locked)

- **D2**: strip to plain text; do not render creole. A per-run font change
  inside a label (`<size:N>` mid-string) genuinely needs the TextBlock — if a
  corpus fixture needs it, STOP rather than approximating.
- **D1**: one box formula. Put the stripping inside the shared helper, not at
  a call site.

## Interface contract

```ts
export function stripCreoleMarkup(text: string): string;
```

Pure, no measurer, no font. `computeReservedLabelBox` calls it per line after
`splitCreoleLines`.

## Quality bar

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — all exit 0,
run unpiped.

The test must pin the two oracle values directly, at font size 10:

| input | expected reserved box |
|---|---|
| `Purchase Price` + newline + `Payment of $100`, each prefixed with a green colour tag | 72 x 22 |
| `Sale of Widget 1` prefixed with a blue colour tag | 67 x 12 |

Both come from `usecase/jecici-56-bimu826`'s oracle `svek-1.dot`. Write the
literal tags in the test source; this brief describes them in prose only
because a colour tag inside a fenced block reads as markup.

**Prove the test discriminates**: it must fail with the stripping removed.
A test that passes either way is the failure this mission line keeps finding.

## Boundaries

- **Always**: cite `file:line` for every upstream claim.
- **Ask first**: adding a dependency; touching `skinparam.ts` (that is T3).
- **Never**: fit a constant to close a gap. Every number traces to the oracle
  or to a Java line. Never edit `hooks/complexity-ignore`.

## Commit

One commit: `feat(T2): strip creole markup before measuring edge labels`
≤72 chars, lowercase, no period. Body explains why if it touches >3 files.
