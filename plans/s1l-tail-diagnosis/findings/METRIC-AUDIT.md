# Size-metric identity audit — result

**Question (raised by T8, ruled a blocker before fix-mission planning):** the
description size gate pairs nodes by *sorted dimension*, discarding identity.
Is it reporting **false conformance** among the 321 passing fixtures?

**Answer: no. Zero false conformance.** The 321 are genuinely conformant, and
the bar means what the mission has been treating it as meaning. Eight
*already-failing* fixtures are understated, all of them inside the known 26.

Reproduce: `npx tsx scripts/audit-size-metric-identity.ts`. The script changes
no gate, no golden and no pin — it measures and reports.

## What the gate actually does

`sizeConformantOk` (`tests/oracle/svek-dot.ts`) is `maxSizeDeltaIn <= 0.01`, and
`maxSizeDeltaIn` comes from

```ts
[...nodes.map(n => n.width), ...nodes.map(n => n.height)].sort()
```

— every node's width **and** height flattened into one multiset, paired by
index. Two defects follow: a node's width can be scored against a *different
node's height*, and node identity is gone entirely.

## The audit metric

An exact **bottleneck assignment**: cost between two nodes is the worse of
their width and height deltas; binary-search the achievable cost levels,
testing for a perfect matching (Kuhn) at each. That yields the best possible
node-preserving pairing, needs no id correspondence, and can never pair a
width against a height.

A zero is a *constructive proof* — an explicit bijection under which every node
is correct. A non-zero is equally strong the other way: no bijection rescues
it, so a real size error exists whichever node maps to which.

> **A lex-sort shortcut does not work.** Sorting `(w,h)` pairs and zipping
> mispairs — it puts a narrow-tall node ahead of a wide-short one and scores
> width against height, the very defect under audit. It reported `vixeni-34` at
> 1.6111 where the true figure is 0.2222. The first version of this audit made
> exactly that mistake; the numbers below are from the exact matching.

## Results — 351 description goldens

| | count |
|---|---|
| agree (gate == truth) | 343 |
| **false-conformant** | **0** |
| understated (already failing, by more than reported) | 8 |
| structurally unequal | 0 |
| conformant under current gate | 321 |
| conformant under exact matching | **321** |

### The 8 understated fixtures — use these as fix targets

Every one is already in the diagnosed 26; **no passing fixture is affected.**

| fixture | gate says | true | hidden |
|---|---|---|---|
| `nixura-77-bina738` | 1.2731 | 1.5403 | +0.2673 |
| `tuliba-37-liza126` | 0.5210 | 0.7727 | +0.2517 |
| `gogamo-72-pibo470` | 0.2148 | 0.4604 | +0.2456 |
| `kovaxi-11-reti348` | 0.7720 | 0.9470 | +0.1750 |
| `zidebi-71-nocu387` | 0.7720 | 0.9470 | +0.1750 |
| `tajadu-40-juro990` | 0.3585 | 0.5000 | +0.1415 |
| `dopova-50-digo290` | 0.8827 | 0.9371 | +0.0543 |
| `vixeni-34-nici683` | 0.2033 | 0.2222 | +0.0189 |

Cross-checks against hand analysis done independently in Batch 1: `vixeni-34`
0.2222 and `tuliba-37` 0.7727 match T8's hand-derived figures exactly, and
`kovaxi-11`/`zidebi-71` remain identical to each other under the stronger
metric — further corroboration of their shared cause.

Note `nixura-77` measures 1.5403 here where T4 derived a worst *node* error of
1.652575. Both are right: bottleneck matching minimises the max over all
bijections, so it is a **lower bound** on the true semantic error. Where a
finding names a specific node, prefer the finding.

## Residual blind spot, and its bound

An identity-free metric cannot detect a **permutation** — two entities swapping
sizes. That is not hypothetical: node ids and emission order genuinely differ
from the jar (only **34 of 351** fixtures have aligned ids; `babafi-51-dixi026`
emits its two nodes in the opposite order).

The audit therefore also tests whether each fixture's sub-tolerance pairing is
**unique**:

- **158** conformant fixtures — pairing unique ⇒ value-matching recovered
  identity ⇒ *provably* no permutation masking.
- **163** conformant fixtures — an alternative pairing exists ⇒ masking is
  possible in principle. In practice these are fixtures with duplicate node
  sizes (e.g. `balipa-82-feto843` has two nodes at `1.129167x0.611111`), where
  swapping is harmless by construction.

**The masked error is bounded at 2× tolerance = 0.02in.** If a pairing is
ambiguous at tolerance `t`, every alternative partner of a given oracle node
lies within `t` of it, so any two partners lie within `2t` of each other.
A permutation can therefore never hide a large error — only a sub-0.02in one.

## Conclusions for the fix mission

1. **Unblocked.** `321/351` is trustworthy; the fix mission may plan against it.
2. **Use the corrected targets** for the 8 fixtures above — their pins
   understate the real work, in one case by 0.27in.
3. **Do not adopt this metric as the gate without a separate decision.** It is
   strictly stronger, so switching re-bases every pin in `size-backlog.json`
   and would re-open fixtures currently sitting under their allowance. That is
   a maintainer call with its own migration, not a drive-by change.

## Separate finding — node id / order divergence

Only 34 of 351 fixtures emit DOT node ids matching the jar's, and emission
order differs too (the jar numbers from `sh0006` with gaps and emits
`zaent…` ids; ours run sequentially from `sh0002`). This has **no size
consequence** — it is why an identity-free metric was needed at all — but node
declaration order is an input to graphviz's mincross tie-breaking, so it is a
latent *layout* fidelity question. Not investigated here; filed for triage.
