# The 8 `dotEqual=false` rows — all comparator staleness, none a regression

Diagnosis artifact per `~/.claude/rules/diagnosis.md`. Written 2026-09-05,
closing the open item in `.agent-notes/parity-repin-2026-09-05.md`.
**No `src/` changed** — this is the mechanism statement.

## Observed discrepancy

Eight fixtures pinned `dotEqual: true` on 2026-08-12 measure `false` today,
and were re-pinned `false` (`41b002f5`) without a cause:

**class** — `xamule-03-jeda376`, `nagega-30-poso418`, `vonago-16-zime449`
**component** — `sunuju-01-pote718`, `ruciga-77-ruja233`,
`gevozu-46-sasu860`, `berelu-46-namo819`
**usecase** — `kafexo-72-xupa679`

## Mechanism

**All eight fail exactly one check, `labelSizeOk`, and nothing else.**

`labelSizeOk` was added to `compareStructural` at **`d3ff29be`
(2026-08-15)** — *three days after* the pins were generated. It compares
`sortedLabelBoxes`, the multiset of every reserved edge-label FIXEDSIZE
`<TABLE WIDTH=.. HEIGHT=..>`. Before it, `labelOk`/`labelCounts` checked
label **presence** only, so a wrong-sized box scored EQUAL.

- **Origin:** `tests/oracle/svek-dot.ts:332` (`sortedLabelBoxes`), `:496`
  (`labelSizeOk`), and the `structurallyEqual` conjunction below it.
- **Causal chain:** each fixture's emitted label box has differed from the
  jar's since before the pin was taken. The presence-only comparator could
  not see it, so the pin recorded `true`. The size-comparing comparator sees
  it, so it reads `false`.

Measured examples (`sortedLabelBoxes`, jar vs ours):

| fixture | jar | ours |
|---|---|---|
| `ruciga-77-ruja233` | `label:179x22` | `label:159x17` |
| `gevozu-46-sasu860` | `label:95x30` | `label:185x15` |

`gevozu`'s shape — jar narrower and taller — is the signature of a label the
jar wraps to two lines and we lay out on one.

## The 2×2 — decisive, and the reason this is not a bisect

| `src/` | comparator | verdict |
|---|---|---|
| today (`38613b26`) | today | **false** ×8 |
| today | pre-`labelSizeOk` (`225107c0`) | **true** ×8 |
| pin-era (`03467532`) | today | **false** ×8 |
| pin-era | pin-era | `true` ×8 — what the pin recorded |

**Under either FIXED comparator the verdict is identical at both ends of the
window.** The flip tracks the comparator, not the code. There is no `src/`
commit at which any of the eight flips, so there is nothing to bisect —
exactly as `doteq-regression-bisect` found for the previous three, at the
cost of three worktrees. Establishing this took two predicate sweeps.

## Ruled out

1. **A `src/` regression.** Row 2 of the 2×2: today's `src/` reads `true`
   under the old comparator. Nothing in the port broke these.
2. **`splinesOk`** (added 2026-09-03, the other post-pin check). It can only
   affect fixtures carrying `splines=` in their jar DOT; none of these eight
   is among that set of 8, which is disjoint from this one.
3. **Any other comparator check.** Each of the eight fails `labelSizeOk` and
   *only* `labelSizeOk` — measured per fixture, not inferred.
4. **A stale or flaky read.** Every verdict reproduced across two independent
   sweeps, and three were separately spot-checked live via `--render-one`.

## Status: 7 of 8 were already tracked; 1 is a tracking gap

Seven are already named in the label-size backlogs
(`oracle/goldens/class/label-size-backlog.json`,
`oracle/goldens/description/label-size-backlog.json`) — known residuals of
the `edge-label-box-and-class-ports` work, already owned.

**`ruciga-77-ruja233` is in no backlog.** It meets that file's own criterion
verbatim — "differs ONLY in the SIZE of one or more edge-label FIXEDSIZE
boxes" — with a single `label:` box on each side, `179x22` vs `159x17`. Its
absence looks like an omission when the backlog was populated: its pin still
said `true` then, so it did not surface.

**Recommendation, not taken here:** add `ruciga-77-ruja233` to
`oracle/goldens/description/label-size-backlog.json`. Deliberately left to a
decision-maker because a backlog entry is consulted by
`measure-description-size-deltas.ts` to EXCUSE a miss — it changes what a
gate forgives, which is not a call to make as a side effect of a diagnosis.

## A correction made while writing this

An earlier pass reported `ruciga` as having **two** jar label boxes against
our one — i.e. a missing box, a different and more serious defect class. That
was wrong. It came from grepping `WIDTH="..." HEIGHT="..."` out of the raw
DOT text, which also matches **node** HTML-label tables. The check's own
`sortedLabelBoxes` sees one `label:` box per side; the divergence is purely
size.

The general form, now the fourth instance in three days of the same trap:
**measure the check, not a proxy for it.** A regex over the artifact the
check reads is not the check.


---

## `ruciga-77-ruja233` is NOT one of them — the survey was starving it

Established 2026-09-05 while attempting to fix its label box, on the
shrink-only path (adding it to the backlog would have required raising a
guard whose own comment reads "never raise it").

**Our port measures `ruciga` exactly right.** The parity survey did not.

`scripts/svg-parity-survey.ts` rendered every fixture with
`{ measurer: new WidthTableMeasurer() }` and nothing else — **no
`assetStore`**. A `jar:` sprite (`sprite Netw jar:archimate/network`,
`CommandSpriteFile.java:108-112`) resolves ONLY through
`RenderOptions.assetStore`. Starved of it, `<$Netw>` contributed **zero
width**, so the reserved label box came out `159x17` against the jar's
`179x22`, and `labelSizeOk` failed.

Isolation that settled it — each sprite removed from the label in turn:

| variant | our reserved box |
|---|---|
| full fixture | `159x17` |
| minus `<$printer>` (inline, data-URI sprite) | `144x15` — so it WAS measured |
| minus `<$Netw>` (`jar:` sprite) | `159x17` — **unchanged: contributes nothing** |
| survey wiring **+ `assetStore`** | **`179x22`** — exact against the jar |

Fix landed in the survey, not in `src/`: `assetStore:
buildSpriteAssetsStore()`, unconditional. Cost measured at 5.5 ms per
subprocess (608 KB, 140 files, process-cached), ~7 s across the corpus.

**Blast radius, measured not assumed.** Only **5** fixtures corpus-wide use a
`jar:` sprite (`bidusa-22-jutu505`, `ruliki-78-biji661`, `ruciga-77-ruja233`,
`tuliba-37-liza126`, `nipapu-74-roro938`); 89 use `<$…>` of any kind, and
inline/data-URI sprites resolve fine without the store. Re-surveying with the
fix changed **0 of 271** state rows and **0 of 722** class rows. `ruciga` is
the only row that moved, because it is the only fixture whose `jar:` sprite
sits INSIDE an edge label — the one place `labelSizeOk` looks.

**The other seven of the eight are unaffected**: none of them uses a sprite
at all, so the comparator-staleness diagnosis above stands for them
unchanged. `ruciga` was the impostor in that set, and only isolating each
sprite separately caught it — the aggregate "all 8 fail labelSizeOk" was
true and still concealed two different causes.

### Method note

Three times in this investigation the first reading was an artifact of how
it was taken: the raw-regex box count (fixed by reading the check's own
`sortedLabelBoxes`), the sprite-starved survey (fixed by wiring
`assetStore`), and a component re-survey that returned 48 timeouts under
load average 4.94 (discarded, not adopted). **A measurement harness is a
subject of study, not a neutral instrument.**
