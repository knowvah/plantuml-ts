# T4 — audit the non-numeric cluster (~19 fixtures)

## Prior observations

- 19 non-conformant fixtures carry at least one **non-numeric** diff:
  colour, `@id`, `childCount`, or text content. G3 filed most of these under
  `gvts-blocked` edge-spline geometry. They are not geometry.
- Several rows whose "max delta" reads `181818`, `8000` or `7121` are
  **colours parsed as numbers** — `#181818`, `#800000`, `#7121xx`. Do not read
  those as pixel deltas.
- `majake-62-pero492` is a **single diff**, `rect/@fill` — G3 named it as the
  legacy tag-scoped `objectBackgroundColor<<X>>` skinparam form and filed it
  `awaiting-maintainer`. G3/O2 also established, via `FromSkinparamToStyle`'s
  constructor, that this is a **generic** universal `<<stereo>>`-to-style
  cascade, not a narrow extension of `classBorderThicknessByStereo`. Verify
  that finding still holds; it may now be cheap given T0's stereotype-qualified
  work.
- `fajafu-44-cuve930` and `pavizi-27-xupe815` are each a **single**
  `text/@font-family` diff. One shared cause is likely.
- `donoki-79-riku189` is 3 diffs, all text content — G3 attributed it to
  unbuilt creole `*`/`**` bullet-list markup.
- `kagope-09-kubu001` leads with `@id` — a uid-assignment-order signature,
  not rendering.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; `~/git/plantuml` is
the canonical spec. Object diagrams route through the class engine
(`src/diagrams/class/**`).

This is a **read-only investigation task**. It changes no production code.

## Task

For each fixture in the cluster, produce an attribution row: the mechanism,
its Java origin with `file:line`, the causal chain to the observed diff, and
what was ruled out. Group fixtures that share a cause — the colour rows in
particular are likely to collapse into a small number of cascade mechanisms,
and that grouping is what makes batch-2's queue efficient.

Take the cluster membership from T1's per-fixture table (`nonNumericPaths`
non-empty), minus the 8 slugs owned by T3.

## Write-set

`plans/object-close/audit-nonnumeric.md` — this file only. **No production
code.**

## Read-set

- T1's per-fixture table in `plans/object-close/decision-journal.md`.
- Each fixture's `in.puml` and re-captured `in.svg`.
- `plans/g3-object-svg/ledger.md` — O1/O2/O3/O4 mechanism writeups. These are
  **still-valid precedent for mechanisms**; it is the residue *attribution*
  that failed, not the ported mechanisms. If a diff matches a G3-ledgered
  mechanism, attribute it rather than re-drilling.
- `src/core/{skinparam.ts,skinparam-stereo-keys.ts,theme-graph-colors.ts,style-cascade-class.ts,style-map-theme.ts}`
  — the colour/style cascade.
- `src/diagrams/class/renderer-classifier-box.ts` — box chrome and dividers.
- Upstream: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/`,
  `.../style/`, `FromSkinparamToStyle.java`, and
  `net/sourceforge/plantuml/svek/image/EntityImageObject.java`. **Grep
  `src/main/java/net/`**, not just `net/sourceforge/plantuml/`.

## Architecture decisions in force

D1 (mechanism + `file:line` per row), D2 (a colour or DOM-shape diff is never
`gvts-blocked` — the engine does not choose colours), D6.

## Interface contracts

Identical row format to [T3](T3-audit-size-cluster.md#interface-contracts).

## Acceptance criteria

- Given the cluster, when the audit completes, then each fixture has exactly
  one row matching the contract.
- Given a row whose planning-time "max delta" read `181818`/`8000`/`7121`,
  when audited, then it is classified as a colour mechanism, not geometry.
- Given the colour rows, when audited, then the report states how many
  distinct cascade mechanisms they reduce to, with evidence.
- Given `majake-62-pero492`, when audited, then the report states whether
  G3/O2's `FromSkinparamToStyle` finding still holds and whether T0's
  stereotype-qualified work changes its cost.
- Given `fajafu-44-cuve930` and `pavizi-27-xupe815`, when audited, then the
  report states whether their single `@font-family` diff shares one cause.
- Given the audit, when complete, then `git status` shows no production file
  modified.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible** — a documentation-only commit.

## Quality bar

Diagnosis mode governs every row. A `gvts-blocked` verdict on a non-numeric
diff requires an explicit argument for how a layout engine could produce it —
absent that, the verdict is wrong.

Return only the audit file. No preamble, no trailing summary.

## Boundaries

- **Always:** open the Java before stating a mechanism; reuse a G3-ledgered
  mechanism by citation rather than re-deriving it.
- **Ask first:** nothing.
- **Never:** edit production code; edit another audit file; `git
  checkout/reset/stash/clean`; commit.
