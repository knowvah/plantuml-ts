# Decisions — graphviz-tracker-consume (pre-made 2026-10-16; do not re-argue)

## D1 — dot-engine stays at 2.4.0
2.6.1 is published, but 2.4.1–2.6.1 only change pack/polyRects and dot-engine's own SVG arrowheads.
svek discards both. A bump inside this mission would confound every measurement, so it is a
separate chore. Wanting to bump is stop 5.

## D2 — what "re-measures clean" means (tick criterion)
A box ticks only when **every** fixture named in its TRACKER entry has survey verdict `conformant`. That
includes the error-page rule (`docs/svg-conformance.md` "Error pages": a jar error plus our error page is
conformant). Where the jar draws, render-diff must also be 0/0. Each tick appends a dated note:
`TICKED <date> (gtc Tn): <rows> conformant on dot-engine 2.4.0; render-diff <n/m>`.
- 34 ticks in T0: rubebe is conformant, `errorPage: true`, `provenance: 'oracle-widths'`.
- 30 names sokevu (already conformant) and repoge. 32 names zosuje, bamami, bobixe, pugodi and
  rufopi; bamami, bobixe and pugodi are already conformant.
- 14 has no fixture; D3 defines its criterion.

## D3 — item 14: mirror upstream's state title position
`Cluster#setTitlePosition` (`Cluster.java:274`) stores the min XY of the title table's polygon
(`DotStringFactory.java:436-439`), and `drawUState` draws the title at `xyTitle.getY()`
(`Cluster.java:497`). The port re-derives that Y as
`node.y + CLUSTER_TITLE_BASELINE_MARGIN(4) + ascent` (`state-composite-cluster.ts`).
`svekClusterTitle` (`src/core/graph-layout-svek-read.ts:194`) already maps `clusters[].label` the way
`solve` reads it. T8 makes the ClusterHeader-family state title read it, and removes the
re-derivation.
- **Unchanged:** the border-point family (`Cluster.java:435`, `rectangleArea.getMinY() + MARGIN`), and
  class/description packages (`USymbolFolder.java:228` fixed `(4, 2)`; class-geo-builders.ts:185
  explains why).
- **Tick:** zero conformant losses in all engines, and zero state census attributes moving away from
  the jar. Any state row moving away is a diagnosis, not a tick.

## D4 — deroxu: census first, defer only by ruling
T6a classifies every deroxu diff into mechanism families. Fix tasks follow in descending count. A
family may leave the mission only through stop 8: proven genuinely large AND separable, then the
user's ruling.

## D5 — two lanes
- **Description lane** (mission checkout, sequential): T1 → T2 → T3 → T4 → T5a → T5b → T6a → T6b…
  It writes `src/diagrams/description/**`, plus `src/core/**` for deroxu families that trace there.
- **State lane** (worktree `gtc/S`, sequential, parallel to the description lane): T7a → T7b → T8.
  It writes `src/diagrams/state/**` only.

Disjoint write-sets make the lanes independent. No Serena edit tools in the worktree. Merges are gated
on clean status, the full conformance set and typecheck.

## D6 — pins and census are orchestrator-only
After each task (or lane) lands, the orchestrator re-pins newly conformant rows with the existing tools:
`measurements/pin-description.mts` for description rows, and
`plans/class-divergence-drive/tools/pin-goldens.mts` for state rows (read its header first). Then it
diffs every baseline JSON against its previous version: a pin that **rose** is an adopted regression
(stop 4). It also lists census attributes that moved away from the jar, plus element-count growth;
each needs a mechanism. Agents never edit `oracle/goldens/**`, `*.ratchet.test.ts`, census or
`parity-*.json` files.

## D7 — branch, signing, landing
One branch, `fix/graphviz-tracker-consume`, one commit per task, no attribution lines. Commits are
unsigned (main requires signed commits; the YubiKey needs a PIN). At exit you run
`git rebase -S 9094705aa`. After that, push the branch and open a **merge-commit** PR (mission
branches keep per-task shas for the journal).

### D5 amendment (user ruling 2026-10-18, after T2's stop 1)
The description lane may also write `src/core/**` for the **style-cascade mechanisms**: T2's two (component
`<style> FontStyle` reaching the theme, `style-map-element.ts`; a description-diagram `arrow` style cascade,
`style-cascade-class*.ts` + a Theme field), and T3's `;line.Bold()` skinparam parsing if it lives in core.
Core edits follow the T6b core rules: the task also runs the class/object/state golden ratchets, and its close
runs the all-engine survey (`chain.sh`), not just the description trees. Flagged for review.

### D5 amendment 2 (user ruling 2026-10-18, after T3's stop 1)
The description lane may also write `src/core/svek/SvekEdge.ts` (imported only by
`src/diagrams/description/renderer-edge.ts`) for the edge label's `TextBlockMarged` UEmpty
(`SvekEdge.java:372-373`, `TextBlockMarged.java:81-87`), as T3b under the core rules. Flagged for review.
