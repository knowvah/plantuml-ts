# Bucket A1 — element ORDER / uid NUMBERING: mechanism partition

79 fixtures. Every one was re-rendered through production `renderSync`
(`dump-order.ts`), and both SVGs were parsed into the top-level
`svg/g[1]/g[n]` sequence (`seq.py` → `seqs.json`: comment, `@class`, `@id`,
`data-qualified-name`, `data-entity-1/2`). Sub-buckets below are assigned by
MECHANISM; all 79 are assigned, none unclassified.

## Measurement caveat that reshapes the bucket

`normalize.ts:174-183` drops **comment nodes** and `data-*` attributes before
comparison. So at top level only `@class` and `@id` are compared. Two
consequences:

1. Large, real faithfulness gaps in the `<!--...-->` comments (see
   "Invisible-to-the-gate findings") are NOT what put these fixtures in A1
   and must not be counted as A1 reach.
2. `compare.ts` pairs positionally, so **any element-count divergence
   manifests as an `@id`/`@class` "swap"**. 16 of the 79 are that and have no
   ordering defect at all (SB6/SB7).

---

## SB1 — implicit parent package burns its uid AFTER its first child leaf

**Reach: 42** (the largest single mechanism in A1)

`bivevo-25-xara984, cidepu-54-bemo048, cocube-46-tusu692, cuxebo-14-babu885,
dacixi-46-lina038, delasa-80-jusu462, ditapa-46-bete946, dudimi-83-mimo845,
dujinu-38-badu006, duvuti-29-lugi970, famizo-04-joxe063, fokudo-49-xiki231,
foxata-81-miva542, gaxipe-22-maxa852, gufife-94-ropa486, joguva-54-tevo966,
kicolo-81-sidi387, kuxosa-67-keko885, ledepo-11-muto607, lobofa-60-vexe031,
lozijo-52-pesu023, lujaje-96-vafu961, mocoda-55-take697, mupuzo-63-femu686,
pareli-69-cixe116, paziji-13-jede796, pidagu-83-dopu070, pisobo-93-sipa138,
pukuzu-30-zode181, runane-30-vena766, sabaku-38-jeli592, sugifi-33-xefe083,
sumule-00-pefa744, tibatu-28-jiro743, vuneta-67-gija125, vuresa-33-kumu160,
vusute-48-xono099, vuvico-92-keza999, xakatu-11-tapu041, xodopa-41-tazo512,
xumofu-43-fode658, zevupa-35-juto545`

**Mechanism.** Upstream never creates an *implicit* intermediate package
eagerly. A qualified name only creates Quarks; the `Entity` (and therefore the
uid tick) for a parentless-but-childful quark is materialised at the TAIL of
`reallyCreateLeaf`, i.e. *after* the leaf that caused it. This port creates the
whole namespace chain outer→inner *before* stamping the classifier, so every
implicit package's uid lands one-or-more slots too early and the leaf's too
late.

**Origin.**
- Java: `net/atmp/CucaDiagram.java:239-240` — `if (type.isLikeClass())
  eventuallyBuildPhantomGroups(location);` at the end of `reallyCreateLeaf`;
  the method itself at `:325-336` walks `this.quarks()` and calls
  `createGroup(..., GroupType.PACKAGE)` for every data-less quark with
  children. The uid is minted in `net/sourceforge/plantuml/abel/Entity.java:171`
  (`StringUtils.getUid("ent", diagram.getUniqueSequenceValue())`), off the one
  shared counter `net/atmp/CucaDiagram.java:129` (`cpt1`).
- TS: `src/diagrams/class/parser.ts:117` passes `counter:
  state.creationCounter` into `resolveReference`, which reaches
  `src/diagrams/class/class-namespace-resolve.ts:127-128` (`counter.value += 1;
  ns.creationIndex = counter.value;`) for EACH segment — all of that runs
  before `parser.ts:128-129` stamps the classifier's own `creationIndex`.

**Causal chain.** Namespace uids come out too low and leaf uids too high.
Because `GraphvizImageBuilder#printGroups/printEntities` draws every cluster
before the leaves, document order is unchanged — only `@id` moves, so these
fixtures show `IDSEQ` with the id *set* usually intact.

**Evidence (3 fixtures read end-to-end).**
- `xakatu-11-tapu041` (`class javax.sound.sampled.AudioFormat.Encoding`):
  jar `ent0002..ent0005` for the four packages and `ent0001` for the leaf;
  ours is exactly the reverse (`1..4` packages, `5` leaf). Δ = +1,+1,+1,+1,−4.
- `vuresa-33-kumu160`: jar leaf `My.Namespace.Person`=1, then `My`=2,
  `My.Namespace`=3; `Meeting`=4; `Customer...Person`=5, then `Customer`=6,
  `Customer.Implementation`=7, `...Namespace`=8. Reproduces
  `leaf-then-its-implicit-parents` exactly.
- `pidagu-83-dopu070` (`package org.junit.jupiter.engine { class X }`): the
  EXPLICIT innermost package is `ent0001` (from `gotoGroup`), the class
  `ent0002`, and the three implicit ancestors `ent0003..0005` — i.e. only the
  implicit ones are late. Ours numbers all four packages 1-4.
- Cross-check over all 79: a detector (`sb1b.py`) for "cluster uid > the
  minimum uid of its own descendant leaves" fires on 41 fixtures in the JAR
  and on **0** in ours; there is no fixture where the relation is reversed.
  `gufife-94-ropa486` was added by hand (its `A::B::C` vs `A.B.C` names defeat
  the prefix matcher; read directly, it is the same pattern).

**Fix shape.** Parser-only, no layout/render change. Defer the namespace-chain
counter ticks so the triggering classifier takes its slot first, then assign
the implicit segments — i.e. mirror `eventuallyBuildPhantomGroups` as a
post-pass at `parser.ts:129` rather than bumping inside
`ensureNamespaceChain`. Note an EXPLICIT `package a.b.c {` block still numbers
its own innermost segment at `gotoGroup` time (pidagu) — only segments created
as a side effect of resolving a qualified reference move. Risk: `creationIndex`
is also the rank source for `class-leaf-order.ts` (draw order) and
`renderer-uid.ts`'s exact/fallback gate; changing it changes cluster/leaf draw
rank, so the 412 conformant fixtures and the 314 ratchet pins need a full
re-run. Since the port's `buildClassUidPlan` densely re-numbers KEPT items
(`renderer-uid.ts:344-367`), and every SB1 item IS drawn, this mechanism is
reachable WITHOUT abandoning dense re-numbering.

**Confidence: HIGH** — both method bodies read; the rule reproduces jar's uids
by hand on three fixtures; the population-level detector is 41-0.

---

## SB2 — links are not grouped by `sameConnections` before emission

**Reach: 7** — `bicabi-42-coto932, cobumi-83-bapu892, delasa-80-jusu462,
gujigi-63-roki030, kevoda-64-mije856, momoba-92-bole393, tedeba-19-lisi250`
(delasa also in SB1).

**Mechanism.** Before building `DotData`, upstream re-orders the link list so
that links sharing an endpoint pair sit adjacently, by stable insertion. This
port emits `ast.relationships` in declaration order.

**Origin.**
- Java: `svek/CucaDiagramFileMakerSvek.java:90-96` `getOrderedLinks()` and
  `:98-113` `addLinkNew(...)`; the predicate is
  `abel/Link.java:462 sameConnections`. The result is what
  `svek/GraphvizImageBuilder.java:229` iterates, so it sets both DOT emission
  and SVG `<g class="link">` order.
- TS: `src/diagrams/class/class-dot-graph.ts:236` and `:245` iterate
  `ast.relationships` directly. `sameConnections` exists in the port
  (`src/core/abel/Link.ts:249`, `src/core/cucadiagram/linkDedup.ts:45`) but is
  used only for dedup — `getOrderedLinks`/`addLinkNew` is **not ported at all**
  (grep over `src/`).

**Causal chain.** A link declared later but sharing a pair with an earlier link
jumps ahead of everything declared between them; every downstream link then
pairs positionally against the wrong jar element, so one grouping produces a
long cascade of `@id`/geometry diffs.

**Evidence.** `sb2.py` replays `addLinkNew` over the jar's own declaration
order (recovered from `lnk%d`) and compares with the jar's document order:
**7/7 exact matches, 0 unexplained**, while plain declaration order matches 0/7.
Worked case, `bicabi-42-coto932`: `lnk10` = (DrawOptionsBox, AddObjectWindow);
`lnk12` = (AddObjectWindow, DrawOptionsBox) `sameConnections` with it, so it is
inserted right after `lnk10` and lands BEFORE `lnk11` — exactly what the jar
SVG shows and what ours does not.

**Fix shape.** One pure function over the relationship list, applied where
`class-dot-graph.ts` builds edges, so DOT emission and draw order move
together. Risk: DOT emission order changes ⇒ the dot-sync/shape-match gates
must be re-run; edge geometry may shift for fixtures currently pinned.

**Confidence: HIGH** — Java method body read; a faithful replay reproduces the
oracle on every fixture in the sub-bucket.

---

## SB3 — association couple: the two `apoint` NAME ticks are not burned

**Reach: 3** — `begico-70-guva302, besepi-37-rori892, pibifa-14-leno075`

**Mechanism.** `(A,B) . (C,D)` consumes FOUR counter slots upstream: two
`getUniqueSequence("apoint")` calls for the point NAMES, then two
`reallyCreateLeaf` calls for the point Entities. This port models the two
entities (`Classifier.noUidSlot`) but not the two name ticks, so every uid
after the couple is short by exactly 2.

**Origin.**
- Java: `objectdiagram/AbstractClassOrObjectDiagram.java:120-121`
  (`final String tmp1 = this.getUniqueSequence("apoint"); final String tmp2 =
  ...`) followed by `:123-129` the two `reallyCreateLeaf` calls.
- TS: `src/diagrams/class/renderer-uid.ts:344-395` — the rank-consuming
  `phantom`/`noUidSlot` machinery exists, but `class-assoc-couple.ts` stamps no
  extra phantom slots for the name ticks.

**Causal chain / evidence.** `pibifa-14-leno075` (`(A0,B1) . (A0,C2)`): jar
names its points `apoint6`/`apoint7` — the literal sequence values 6 and 7 —
then the point entities take 8 and 9, so the first couple link is `lnk10`. Ours
emits `lnk6`: exactly the two name ticks short. `begico-70-guva302` is the same
arithmetic at `apoint12`/`apoint13` → entities 14/15 → `lnk16..lnk20`, ours
`lnk12..lnk16`. `besepi-37-rori892` has the couple at `in.puml:97`.
The single-point association-class form
(`AbstractClassOrObjectDiagram.java:226`) is already correct — `pajoka/tunelu/
vonago` match jar's `lnk7/8/9` exactly.

**Fix shape.** Two extra `phantomSlot` ranks at the couple's parse site
(`class-assoc-couple.ts`), consumed by `renderer-uid.ts`'s existing
phantom path. Small, self-contained; risk limited to couple fixtures.

**Confidence: HIGH** — Java read; the `apointN` names in the oracle carry the
counter value, so the arithmetic is directly observable.

---

## SB4 — a relationship endpoint that resolves to a package burns a uid here, none upstream

**Reach: 2** — `mujopi-30-zadi566, nijeli-04-ponu844`

**Mechanism.** `p1 -> p2` where `p1`/`p2` are packages: upstream's
`quarkInContextSafe` returns the EXISTING group quark
(`atmp/CucaDiagram.java:249-286`), whose `Entity` already exists, so no
`Entity` ctor runs and no uid is minted. This port's `ensureClassifier`
(`parser.ts:95-148`) auto-creates a phantom `Classifier` row and bumps
`state.creationCounter` at `parser.ts:128`.

**Causal chain / evidence.** `nijeli-04-ponu844` is uid-identical with the jar
through `lnk32` and then constantly `+1` from `lnk33`, which is the first link
whose endpoint is the cluster `Data Network` rather than a leaf.
`mujopi-30-zadi566` (`p1 -> p2`, `p1 -|> p2`, `p1 -|> p3`, all package→package)
drifts `+1` then `+2` across its three links.

**Fix shape.** Suppress the counter tick when `ensureClassifier` resolves to an
existing namespace (the phantom row is already discarded downstream). Parser
only.

**Confidence: MEDIUM** — the upstream side is read and unambiguous; on the TS
side I traced the burn to `parser.ts:128` from the offset pattern but did not
instrument `buildClassUidPlan` to confirm the phantom row is the one consuming
the rank. Next instrument: dump `state.creationCounter` transitions for
`mujopi` and assert the tick occurs inside the `p1 -> p2` dispatch.

---

## SB5 — note machinery burns fewer uids than upstream

**Reach: 3** — `cejili-77-gepe377, labele-71-gudo044, zuxoxu-54-pejo512`

**Mechanism.** A free note consumes at least two extra slots upstream — the
generated name (`getUniqueSequence("GMN")`,
`command/note/CommandFactoryNoteOnEntity.java:327`) and the note→host `Link`
(`abel/Link.java:135`) — on top of the note `Entity` itself; a member-tip note
also creates a TIPS entity. This port numbers notes as a best-effort tail pass
(`renderer-uid.ts:362-367`).

**Causal chain / evidence.** `cejili-77-gepe377` (one purged member-tip note +
one surviving `note right of a`): jar's surviving note is `GMN5` at `ent0006`
and the classifier `b` at `ent0008`; ours is `__note_1` at `ent0003` and `b` at
`ent0005` — a constant `+3` from the first note onward.
`labele-71-gudo044` is the identical `+3`.

**Fix shape.** Thread `creationIndex` through `class-notes.ts` and add
`phantomSlot` ranks for the `GMN` tick and the note connector link. Interacts
with SB6's missing note-connector ELEMENT (below) — the two should move
together.

**Confidence: MEDIUM** — the counter arithmetic is consistent and the Java call
sites are read, but I did not fully account for every slot (the TIPS entity vs
the purged note) on `cejili`. Next instrument: render a minimal
`class a / note right of a` fixture and diff the uid sequence slot by slot.

---

## SB6 — element-COUNT divergence masquerading as order (no ordering defect)

**Reach: 12** — `bufogi-69-naba929, cicovi-23-zipe215, fogexa-30-zupo141,
gevuci-69-fafe469, guxode-39-dobi371, lejoga-79-poji465, pecabi-95-demu756,
pejone-71-tige404, sanixi-31-nofa193, temise-16-neco018, vudepo-27-cuvo793,
xonamo-50-podo529` (plus `cocube/pisobo/runane/vusute`, already counted in SB1).

These land in A1 only because `compare.ts` pairs positionally: once the counts
differ every subsequent `@id`/`@class` reads as swapped. Distinct causes seen:

- **`newpage`** (`bufogi`, `gevuci`): the oracle is page 1 only; we emit both
  pages' entities into one document.
- **`hide <class>`** (`cicovi`): jar still draws `pack1.Foo1`; we drop it.
- **note connector link missing** (`fogexa`, `pecabi`, `sanixi`, `pejone`,
  `temise`, `xonamo`): jar emits a `<g class="link">` for `link GMN2 to dummy`;
  we emit none. Same root as SB5.
- unclassified count causes: `guxode`, `lejoga`, `vudepo`.

**Fix shape.** Belongs to the hide/remove, newpage and note-connector buckets,
not to an ordering mission. **Confidence: HIGH** that these are not ordering
defects (count mismatch is directly observed); LOW on the individual causes of
`guxode/lejoga/vudepo`, which I did not open.

---

## SB7 — `!pragma layout elk` (KNOWN DELIBERATE DIVERGENCE)

**Reach: 3** — `cirojo-62-dubo306, gokoru-18-daba136, tegefa-14-koxo759`

`DIVERGENCES.md:102-108` records `!pragma layout elk` as explicitly
**unsupported**. These three should be excluded from A1's denominator, not
fixed. **Confidence: HIGH** (pragma present in each `in.puml`; divergence
documented).

---

## SB8 — top-level sequence is byte-identical; the A1 tag comes from `path/@id` / `@codeLine`

**Reach: 8** — `cenubi-27-xova754, filoxo-23-fafi328, givofi-11-xumu978,
popesa-39-sobe866, rakopi-21-sufa571, pajoka-72-reju527, tunelu-64-xica833,
vonago-16-zime449`

Class, id and order of every top-level `<g>` match the jar. The diffs are on
the edge `<path>`'s own attributes inside the wrapper — the gap the G2/N2
ledger already named. Upstream builds that id in
`abel/Link.java:105-113 idCommentForSvg()`, which has THREE forms —
`-backto-` when `type.looksLikeRevertedForSvg()`, a bare `-` when
`type.looksLikeNoDecorAtAllSvg()`, else `-to-` — de-duplicated by
`svek/SvekEdge.java:1093-1105 uniq(...)` and attached with `:944
todraw.setCommentAndCodeLine(uniq(ids, link.idCommentForSvg()),
link.getCodeLine())`. `pajoka-72-reju527` shows the two forms **inverted** per
link (`exp Foo-apoint5 / act Foo-to-apoint5` and `exp apoint5-to-Bar / act
apoint5-Bar`), i.e. our decor classification for the two halves of an
association couple is swapped.

**Fix shape.** `class/renderer.ts#renderEdge`'s path emission plus the
`looksLikeNoDecorAtAllSvg` classification — a separate mission from ordering.
**Confidence: HIGH** that no ordering mechanism is involved; MEDIUM on the
`pajoka` decor-inversion root (symptom read, our decor path not traced).

---

## Unclassified

None. All 79 fixtures are assigned above.

---

## Invisible-to-the-gate findings (real faithfulness gaps, zero A1 reach)

`normalize.ts` drops comments, so none of these can move the score — recorded
so a future mission does not re-derive them:

1. **Link comment endpoints use the QUALIFIED name and the wrong order.** Jar
   `<!--reverse link BaseClass to Person-->` vs ours `<!--link
   net.dummy.Person to BaseClass-->` (`lujaje-96-vafu961`). Upstream's
   `abel/Link.java:115-120 commentForSvg()` prints
   `getEntity1().getName()` — the SHORT display name — in `entity1 → entity2`
   order, with the `reverse ` prefix from `looksLikeRevertedForSvg()`.
   Affects ~44 of the 79.
2. **Classifier comment always says `class`.** Jar writes `<!--entity
   dummy2-->` for a `entity` kind (`givofi`, `popesa`); we always write
   `class`. Affects 28.
3. **Association-point naming.** Jar `apoint5`, ours `__assoc0`.
4. **`data-source-line` is never emitted** (already ledgered).

---

## Summary

| Sub-bucket | Reach | Confidence |
|---|---|---|
| SB1 implicit parent package uid after its leaf | 42 | HIGH |
| SB2 links not grouped by `sameConnections` | 7 | HIGH |
| SB3 assoc-couple `apoint` name ticks not burned | 3 | HIGH |
| SB4 package endpoint burns a phantom uid | 2 | MEDIUM |
| SB5 note machinery burns fewer uids | 3 | MEDIUM |
| SB6 count divergence, no ordering defect | 12 | HIGH (not order) |
| SB7 `!pragma layout elk` — deliberate divergence | 3 | HIGH |
| SB8 top-level clean; `path/@id`+`@codeLine` only | 8 | HIGH (not order) |

Genuine ordering/uid work in A1: **SB1–SB5 = 56 fixtures** (one overlap,
`delasa`, in SB1∩SB2). The other 23 are misfiled by the comparator's
positional pairing or are an accepted divergence.
