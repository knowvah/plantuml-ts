# Batch 4 — the element deficit

B1 is a discovery task whose output DEFINES B4..Bn. B2 and B3 are the two leads
already in hand and can run alongside it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| B1 | attribute the deficit to features | Explore → typescript-pro | `findings/element-deficit.md` | A6 | [x] |
| B2 | self loop: one path → three lines | typescript-pro | `renderer-message.ts`, tests | A6 | [x] |
| B3 | participant hyperlink wrapper | typescript-pro | parser → AST → geo → `renderer-participant-shapes.ts`, tests | A6 | [x] |
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

## B2 and B3 (2026-09-02), run on the maintainer's instruction

The halt above stands for B4..Bn; B2 and B3 were released explicitly.

| task | commit | descended | distance |
|---|---|---:|---:|
| — | `1371e5ac` | 714 | 2 437 184.889 |
| B2 | `92912043` | **785** | 3 848 613.786 |
| B3 | `230cc6db` | **797** | 3 855 017.293 |

**`descended` 714 → 797, +83 fixtures, and 0 lost descent.** That is the
number both tasks existed for: 83 fixtures whose geometry the comparator could
not previously see at all.

Distance rose 1 417 832.4, and for both tasks the rise decomposes exactly:
**every fixture whose descent status did not change moved by +0.0.** Not one
already-measurable fixture moved. The rise is entirely geometry that was
invisible becoming visible, which is what B2's own acceptance criteria
predicted.

**The total is no longer quotable as a corpus statement.** Concentration is
24.9% on `vitevu-99-rali549` — above the 20% alarm — because that fixture is
one of the 71 B2 opened and its whole geometry arrived at once. The cohort
line is still quotable, and is the one that matters here.

Element census: `line` −2323 → −838 (+1485, exactly 3× the 495 loops), `path`
+220 → −275 (−495, exactly the loops removed), `a` −89 → −47.

The 47 remaining `<a>` are the mission's declared non-goal, not a shortfall:
all 18 fixtures still short carry creole `[[url]]` inside label, note or frame
text, `devamo-31-coji129` among them — the very fixture the README names as
that non-goal's example.

