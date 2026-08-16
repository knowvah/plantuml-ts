# Root cause: the DOT edge is reversed without reversing the SIDED fields with it

Diagnosed 2026-08-16 (mission `edge-label-box-backlog`, T3) on
`class/givoli-70-rade072` and its three siblings. **Verdict: tail/head
ASSIGNMENT, not edge emission order.** D5's STOP does not fire — see
"Why this is not emission order" below for the evidence.

## Mechanism

Upstream's invariant is that `quantifier1` always belongs to `entity1`. It is
enforced structurally: `SvekEdge.java:248-250` takes `startUid =
link.getEntityPort1(...)`, `endUid = link.getEntityPort2(...)`, `:328-340`
takes `startTailText` from `getQuantifier1()` and `endHeadText` from
`getQuantifier2()`, and `:394-400` emits `startUid -> endUid` **verbatim**.
Nothing between parse and emission can decouple the pair, because the one place
a link is inverted — `CommandLinkClass.java:364`, `link = link.getInv()` —
inverts both together: `Link.java:145-146` builds `new Link(..., cl2, cl1, ...,
linkArg.getInv())` and `LinkArg.java:115-117` is
`new LinkArg(label, length, quantifier2, quantifier1, ..., kal2, kal1, role2, role1)`.

This port breaks that pair. The parser normalizes `from`/`to` by the
**arrowhead** rather than by source order (`class-relationship-parser.ts:390`),
carrying the quantifiers along consistently (`:308-317`), and records the
divergence as `dotEdgeReversed` (`:499`). `buildDotEdges` then re-reverses the
**endpoints only**:

```ts
// src/diagrams/class/class-dot-edges.ts:162-171
const swap = dotEdgeRunsReversed(rel);
const from = swap ? rel.to : rel.from;      // endpoints exchanged
const to   = swap ? rel.from : rel.to;
const attrs = buildDotEdgeAttrs(rel, i, ctx);              // <-- no `swap`
Object.assign(attrs, edgePortAttrs(rel, swap, dotFrom, dotTo, ctx.portRowIds));
```

`buildDotEdgeAttrs` is the only one of the three calls that is not told about
`swap`. It reaches `computeMultiplicityAttrs`
(`class-layout-edge-labels.ts:271-285`), which pairs `rel.fromMultiplicity` with
`tailLabel*` and `rel.toMultiplicity` with `headLabel*`. After lines 164-165,
`rel.from` is the DOT **head**, so both pairings are inverted.

**Origin:** `src/diagrams/class/class-dot-edges.ts:168` (the `swap`-blind
`buildDotEdgeAttrs` call), against the exchange performed two lines above at
`:164-165`. The upstream contract it violates is `LinkArg.java:115-117`.

## Causal chain

`Potential "0..*" <--o "1" CompositePotential` (givoli line 59):

1. `<--o` is left-headed, so `resolveArrow` sets `swapDirection = true`. Parsed
   result (measured, `parseRelationshipLine`):
   `from=CompositePotential fromMultiplicity="1"`,
   `to=Potential toMultiplicity="0..*"`, `dotEdgeReversed=true`.
   The entity↔quantifier binding is still intact here.
2. `dotEdgeRunsReversed` returns `true`, so `buildDotEdges` emits
   `Potential -> CompositePotential` — the correct direction, matching the jar.
3. `buildDotEdgeAttrs` still reads `rel.fromMultiplicity` for `taillabel`. The
   tail is now Potential, but `fromMultiplicity` is CompositePotential's `"1"`.
4. Emitted `taillabel` 7x13 / `headlabel` 19x13, against the jar's 19x13 / 7x13.

Upstream never enters step 1: `getDirection` (`CommandLinkClass.java:517-527`)
strips the arrowheads before classifying — `replaceAll("[^-.=\\w]", "")` drops
the `<`, then the trailing `o` is stripped — so `<--o` reduces to `--` →
`Direction.DOWN` → **not inverted**. `entity1 = Potential`,
`quantifier1 = "0..*"`, emitted directly.

## Measured evidence

Minimal repro, `renderSync` + `setLayoutInputObserver`, `WidthTableMeasurer`;
oracle column from `scripts/oracle-render.sh` (deterministic text ON):

| markup | oracle DOT | ours |
|---|---|---|
| `A "0..*" <--o "1" B` | `A->B` tail 19 head 7 | `A->B` tail **7** head **19** |
| `A "0..*" <\|-- "1" B` | `A->B` tail 19 head 7 | `A->B` tail **7** head **19** |
| `A "0..*" <.. "1" B` | `A->B` tail 19 head 7 | `A->B` tail **7** head **19** |
| `A "0..*" <\|.. "1" B` | `A->B` tail 19 head 7 | `A->B` tail **7** head **19** |
| `A "0..*" <--* "1" B` | `A->B` tail 19 head 7 | `A->B` tail **7** head **19** |
| `A "0..*" <-left- "1" B` | `B->A` tail 7 head 19 | `B->A` tail **19** head **7** |
| `A "0..*" *-- "1" B` | — | `A->B` tail 19 head 7 — correct |
| `CompositePotential "1" o--> "0..*" Potential` | — | tail 7 head 19 — correct |

The `<-left-` row is the same root failing in the opposite direction: upstream
inverts on the direction word (quantifiers follow via `getInv`), we do not
re-pair them. `*--` and the forward form are correct because no reversal runs.

Two source spellings that upstream distinguishes collapse to the identical DOT
line on our side — `A "0..*" <--o "1" B` and `B "1" o--> "0..*" A` both emit
`tail=7, head=19`. That is the defect stated as a lost distinction.

**The SVG is wrong too, not just the DOT reservation.** For
`A "0..*" <|-- "1" B`, jar-verified text positions:

| | `"0..*"` | `"1"` |
|---|---|---|
| oracle | x=6.299 **y=73.253** | x=19.812 **y=104.032** |
| ours | x=6.301 **y=104.034** | x=19.814 **y=73.256** |

The x/y slots are right to 3 decimals; the two strings are in each other's
slots. The second consumer of the same broken pairing is
`class-edge-label-anchor.ts:198-206`, which pairs `rel.fromMultiplicity` with
`edgeResult.tailLabelX/Y`. One root, two call sites.

## Why this is not emission order (D5 does not fire)

- Our edge sequence and every endpoint pair are **identical** to the oracle's
  for all four fixtures. `labelSizeOk` is the *only* failing check;
  `minlenOk`, `labelOk` (label/tail/head/xlabel counts), `portOk`, `shapeOk`,
  `clusterOk` and the edge multiset all pass, and `maxSizeDeltaIn` is 0.0000.
- The differing line is at the same index, in the same direction, with the same
  colour-sequence ids: oracle `sh0014->sh0015 ... taillabel W=19, headlabel W=7`
  vs ours `sh0014->sh0015 ... taillabel W=7, headlabel W=19`. Only the two
  integers are exchanged.
- Therefore `getOrderedLinks` / `Link#sameConnections` (the reordering the
  `leaf-draw-order` follow-on traced) is not implicated: nothing moved.

## Ruled out

- **Measurement defect (the rest of M3's mission).** `maxSizeDeltaIn 0.0000`;
  our measurer returns 19.42 for `"0..*"` and 7.23 for `"1"` — the same values
  the jar truncates to 19 and 7. Both correct numbers are present, on the wrong
  ends. All ~50 other boxes in `givoli` match byte-for-byte.
- **Parser attaching a quantifier to the wrong source end.**
  `parseRelationshipLine` returns `from=CompositePotential fromMultiplicity="1"`
  — and `"1"` is the quantifier written beside `CompositePotential` in the
  source. `pickDirectional(info.swapDirection, …)` is applied to the ids
  (`:390`) and the sided fields (`:308-317`) with the same flag, so the binding
  survives normalization intact.
- **`dotEdgeReversed` being wrong for `<--o`.** It is right: the jar emits
  `sh0014(Potential) -> sh0015(CompositePotential)` and so do we. The flag is
  doing its job; the sided fields simply do not follow it.
- **Edge emission order / link reordering.** See the section above.
- **Roles (`fromRole`/`toRole`).** Cannot be affected: nothing outside the
  parser reads them — no `src/` consumer emits a role into `taillabel`, which
  upstream does at `SvekEdge.java:451-466` as the fallback arm. That is a
  separate unported gap, not this defect.
- **Node/entity identity confusion in the reading of the DOT.** `sh0014` is
  `Potential` and `sh0015` is `CompositePotential`, confirmed two ways: box
  widths (270.0px vs 153.5px, matching their longest member rows) and out-edge
  degree (`sh0014` has the six unlabelled children `Potential` declares).

## Blast radius

- **Corpus: exactly 4 class fixtures** — `givoli-70-rade072`,
  `nadepi-13-mufu566`, `tekena-28-fobe713`, `tiguma-69-tovu135`. All four are
  near-duplicates of the same upstream issue diagram and all four carry the
  identical line `Potential "0..*" <--o "1" CompositePotential`. **Verified, not
  assumed:** each was run through `dot-sync-report --slug`, each fails
  `labelSizeOk` and nothing else, and each diff is the same single
  `tail:19x13 → head:19x13` migration.
- A grep of all 722 cached class fixtures for a quantifier adjacent to a
  left-headed arrow returns five files; the fifth, `nagega-30-poso418`, is a
  `!define` macro whose text never becomes a link quantifier — it fails
  `labelSizeOk` for an unrelated reason (label 157 vs 43) and has no
  `taillabel`/`headlabel` at all.
- **Latent, unexercised by the corpus:** every other reversed form is wrong the
  same way. `<|--`, `<..`, `<|..` and `<--*` with quantifiers on both ends are
  each jar-verified in the table above, as is `<-left-` failing in the opposite
  direction. `<-up-` follows `<-left-` by the same `getDirection` branch
  (`CommandLinkClass.java:363`) and was not separately rendered.
- Fixing this moves rendered geometry: `tailLabel`/`headLabel` text is fed into
  the real layout call (`graph-layout.ts#extractPortLabelPositions`), so D4's
  `shape-match-report` must run alongside the DOT gate.

## The invariant to restore

Upstream's contract is one line: **`quantifier1`/`role1`/`kal1`/`port1` belong
to `entity1`, and inverting a link inverts all of them together**
(`LinkArg.java:115-117`). This port's `rel.from`/`rel.to` stop naming the DOT
tail/head the moment `dotEdgeRunsReversed(rel)` is true, and only
`edgePortAttrs` was ever told. Whether the correction belongs at the emission
site or at the parser normalization that created the divergence
(`class-dot-edge-order.ts:43-46` documents it as deliberate) is a design call
for the implementing task, not part of this diagnosis.

**Confidence**: High. Every number above is a direct measurement — ours from
`setLayoutInputObserver` on the real render path, the jar's from
`scripts/oracle-render.sh` with `-DPLANTUML_DETERMINISTIC_TEXT=true`. The
upstream side is quoted from `SvekEdge.java:248-250, 328-340, 394-400`,
`CommandLinkClass.java:364, 517-527`, `Link.java:145-146` and
`LinkArg.java:115-117`, not inferred from names.
