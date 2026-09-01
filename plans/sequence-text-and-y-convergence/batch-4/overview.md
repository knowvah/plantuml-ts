# Batch 4 — the element deficit

B1 is a discovery task whose output DEFINES B4..Bn. B2 and B3 are the two leads
already in hand and can run alongside it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| B1 | attribute the deficit to features | Explore → typescript-pro | `findings/element-deficit.md` | A6 | [ ] |
| B2 | self loop: one path → three lines | typescript-pro | `renderer-message.ts`, tests | A6 | [ ] |
| B3 | participant hyperlink wrapper | typescript-pro | `renderer-participant-shapes.ts`, `core/svg-shapes.ts`, tests | A6 | [ ] |
| B4..Bn | **defined by B1** | — | — | B1 | [ ] |

B1, B2 and B3 are write-set-disjoint and may run in parallel.

## The corrected numbers

The analysis this mission implements originally reported the deficit from
corpus-wide totals, and one fixture wrote almost all of them:
`zudize-61-vomi445` is **45 512 lines** long, short-circuits, and alone
supplied 24 464 of a reported 25 933 missing text elements.

Excluding it, and this is the real target:

| element | ours | jar | delta |
|---|---:|---:|---:|
| `line` | 7 083 | 9 406 | **−2 323** |
| `text` | 11 424 | 12 893 | −1 469 |
| `g` / `title` | 4 828 / 3 534 | 5 087 / 3 793 | −259 each |
| `rect` | 9 919 | 10 177 | −258 |
| `polygon` | 3 654 | 3 901 | −247 |
| `ellipse` | 722 | 824 | −102 |
| `a` | 0 | 89 | −89 |

**Text is not the element gap** — the descended cohort's total text deficit is
5 elements and 862 fixtures have none.

## Stop condition 9

If B1 finds more than three distinct features behind these counts, **halt and
re-plan**. Improvising four or more unscoped tasks is exactly what this brief
refuses to do up front.
