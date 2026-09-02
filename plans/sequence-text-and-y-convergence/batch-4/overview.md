# Batch 4 — the element deficit

B1 is a discovery task whose output DEFINES B4..Bn. B2 and B3 are the two leads
already in hand and can run alongside it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| B1 | attribute the deficit to features | Explore → typescript-pro | `findings/element-deficit.md` | A6 | [x] |
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

## Result (2026-09-01) — HALTED on stop condition 9

B1 found **six distinct features plus a tail of ~30 root-diff signatures**.
The brief allows three, so B2 and B3 were **not** executed and batch 4 stops
here. [`findings/element-deficit.md`](../findings/element-deficit.md) has the
evidence.

| # | feature | status |
|---|---|---|
| 1 | self loop: one path → three lines | **B2, confirmed and 2.2× larger than scoped** — 495 loops across 125 fixtures, not ~220 across 79 |
| 2 | escaped `\n` not split in message labels or participant names | **NEW** — biggest payoff of any single fix |
| 3 | participant `<a>` hyperlink | **B3, confirmed** |
| 4 | `...` delay draws a `DELAY_LINE` and segments every lifeline | **NEW** — explains 96% of the `g`/`title` deficit |
| 5 | `create` draws a second participant head | **NEW** |
| 6 | sprite `<image>` | **NEW, unexplained** — counted, mechanism not established |

B2 and B3 are not invalidated; both were corroborated by the measurement and
are ready to run unchanged. They are held only because they belong to the batch
this condition halts.

