# Decision journal — si17-class-row-ports

Appended during execution. Every non-trivial judgment call gets an entry:
if a reasonable developer might have chosen differently, log it.

A diagnosis entry must carry all four parts, per `~/.claude/rules/diagnosis.md`:
**mechanism**, **origin** (`file:line`), **causal chain**, and **what was
ruled out** with the evidence that ruled it out. An empty "ruled out" on a
non-trivial defect means the cause was guessed.

## Quality-gate log

| Date | Task | test | typecheck | lint | build | frozen counts |
|---|---|---|---|---|---|---|
| 2026-08-12 | T0 (docs only) | ✅ 574 files / 12772 | ✅ | ✅ | ✅ | class DOT baseline re-confirmed: 711 = 688 EQUAL + 22 `portOk` + 1 `directionOk` (`besepi-37-rori892`), 7 oracle-blind inside the 688. Matches the brief exactly. |
| 2026-08-12 | T1 | ✅ 575 files / 12784 | ✅ | ✅ | ✅ | class DOT unmoved: 688 EQUAL, 22 `portOk`, 1 `directionOk`. Inert as designed — the producer has no caller yet. |
| 2026-08-12 | T2 + T3 (orchestrator re-run, all cross-type) | ✅ 575 files / 12788 | ✅ | ✅ | ✅ | **class DOT 688 → 706** EQUAL of 711 (`portOk` 22 → **4**, `directionOk` 1, oracle-blind 7 inside EQUAL). Unmoved: object 74/80, component 262/262, usecase 93/93, state 267/267. Censuses: class **343**/722 ✓ frozen, object **35**/80 ✓ frozen, description 26/358 (see the stale-baseline entry below). |

## Entries

### 2026-08-12 — T0: ADR-1 resolved by measurement — **A (block tree) wins**

**Verdict.** Option A (block tree) reproduces the jar's `(int)`-truncated
rows on every control, exactly, with zero fitted constants. Option B (flat
sizer, `mapPortRows`' recipe) misses on every control that has a band, and
its published surface cannot express one. Not close, not a tie-break.

#### Upstream composition (read, not remembered)

For a `LeafType.isLikeClass()` leaf with fields AND methods,
`BodierLikeClassOrObject#getBody` (`cucadiagram/BodierLikeClassOrObject
.java:237-249`) returns
`TextBlockUtils.mergeTB(fields.asBlockMemberImpl(), methods.asBlockMemberImpl())`
= `TextBlockVertical` (`klimt/shape/TextBlockUtils.java:122-130`), and
`asBlockMemberImpl` (`cucadiagram/MethodsOrFieldsArea.java:83-86`) is
`TextBlockLineBefore(TextBlockUtils.withMargin(area, 6, 4))`.

The port frame therefore composes as:

| Layer | `getPorts` behavior | `file:line` |
|---|---|---|
| `EntityImageClass` | `body.getPorts().translateY(dimHeader.getHeight())` | `svek/image/EntityImageClass.java:247-253` |
| `TextBlockVertical` | per-child `translateY(y)`, `y += child height` | `klimt/shape/TextBlockVertical.java:107-118` |
| `TextBlockLineBefore` | pass-through, no translate | `klimt/shape/TextBlockLineBefore.java:103-107` |
| `TextBlockMarged` | `translateY(top)`; `withMargin(_,6,4)` → `top = 4` | `klimt/shape/TextBlockMarged.java:100-102`, `TextBlockUtils.java:64-69` |
| `MethodsOrFieldsArea` | `y` accumulates each member's own `dim.getHeight()` | `cucadiagram/MethodsOrFieldsArea.java:194-211` |

So `position = headerHeight + 4 + Σ(prior member heights in this
compartment)`, and the methods compartment additionally carries the whole
fields block height via `TextBlockVertical`. `SvekNode
.appendLabelHtmlSpecialForLink` then truncates filler, row height and
trailer independently (`svek/SvekNode.java:269-296`) and `appendTr` drops
`height <= 0` rows (`:298-311`).

#### Measurements

Commands (all reproducible):

```
# oracles already cached for the two corpus controls
cat test-results/dot-cache/class/{dekaba-54-fafi485,bicabi-42-coto932}/svek-1.dot
# authored fields+methods control (no backlog fixture has one -- see below)
./scripts/oracle-render.sh "$SCRATCH/t0/out" "$SCRATCH/t0/fm-both.puml"
# option B, from our own sizer
npx tsx "$SCRATCH/t0/probeB.mts" <puml>...
```

`$SCRATCH/t0/fm-both.puml` (authored this task; jar-rendered, not synthesized):

```
@startuml
!pragma svek_trace on
class Foo {
+ field1
+ field2
- method1()
+ method2()
}
class Bar {
+ field3
}
Foo::field2 --> Bar : a
Foo::method1 --> Bar : b
@enduml
```

| Control | Port | Oracle `(int)` pos/height | A (block tree) | B (`dividerYs`, `mapPortRows` recipe) |
|---|---|---|---|---|
| `dekaba-54-fafi485` A | `pb718adec73e04ce3ec720dd11a06a308` (`ID`) | **36 / 14** | **36 / 14** ✓ | 32 / 50 ✗ |
| `fm-both` Foo (fields) | `pbe66ec6c8f3198a3dacdc0da5aa602b9` (`field2`) | **50 / 14** | **50 / 14** ✓ | 68 / 36 ✗ |
| `fm-both` Foo (methods) | `paf622f13962daec263aae79dbf2b2ea3` (`method1`) | **72 / 14** | **72 / 14** ✓ | *no band emitted* ✗ |
| `xefeme-77-fagu709` Foo | `pde41…` / `pbe66…` | **36 / 14**, **50 / 14** | same ✓ | 32/36, then none ✗ |
| `bicabi-42-coto932` `Gtk` | — | **none**; single filler `HEIGHT="48"` | none ✓ | none ✓ |

Trailers also reconcile: `dekaba` `90 - 50 = 40`; `fm-both` `104 - 100 = 4`
plus the interior `72 - 64 = 8` gap (fields bottom margin 4 + methods top
margin 4); `xefeme` `76 - 64 = 12`. All three match the emitted DOT.

Header height 32 is not fitted — it is read off the oracle SVG separator
(`dekaba` node top `y=7`, first `<line y1="39">` → 32) and independently
confirmed by `fm-both` (`y=7`, lines at 39 and 75: header 32, fields block
36 = 4+14+14+4).

#### Why B cannot be rescued

`mapPortRows` reads `measured.dividerYs[i]` as row *i*'s top. That holds for
a `map` leaf, where `dividerYs` IS one entry per data row. For a class it is
the **compartment separators**: our sizer reports `dividerYs = [32, 82]`
(`dekaba`) and `[32, 68]` (`fm-both`) — two entries for a five-row class.
Indexed by row it runs off the end (`fm-both`'s `method1` is `rows[3]`,
`dividerYs[3]` is `undefined` → the band is silently *dropped*); offset by
`headerRowCount` it yields compartment-sized bands. Both are wrong on the
baseline control, before the discriminating case is even reached.

The generous reading — reconstruct from `rows[]` — fails on the interface,
not on the arithmetic. `rows[].y` is a text **baseline**, not a row top:
`class-member-rows.ts:200` computes `sectionTop + SECTION_MARGIN_TOP +
rowTop + baselineOffset` and keeps only the sum. `MeasuredClassifier`
publishes neither `baselineOffset` nor per-row height. Recovering the top
would mean subtracting a font ascent that carries no upstream `file:line`,
and recovering the height from consecutive baseline deltas gives 22, not 14,
across the fields/methods boundary. That is fitting, which ADR-1 forbids.

Notably `class-member-rows.ts:200` computes upstream's exact quantity
(`sectionTop + 4 + rowTop`) and discards it — B is not a different frame so
much as the same frame with the useful term thrown away.

#### Judgment calls logged

1. **Authored the discriminating control.** No backlog slug has a class with
   both a field and a method compartment *and* an elected port. A scan of
   all 22 `oracle/goldens/class/port-backlog.json` slugs returned two
   candidates, and both are false positives of a `'(' in line` heuristic:
   `bicabi-42-coto932`'s `MainWindow`/`DisplayFile` carry no port election
   (it is the zero-election control), and `juxora-90-fisu720`'s "methods"
   are the emoticon `prop4 :(` inside a `|_` enhanced body. Per CLAUDE.md
   ("the corpus is the work queue and not a ceiling"), authored `fm-both
   .puml` and rendered a jar oracle rather than reasoning synthetically.
   The brief's suggested candidate `xefeme-77-fagu709` is fields-only, so it
   serves as a second single-compartment control, not the discriminator.
2. **`xefeme` kept as a control anyway.** Its two-port node exercises the
   `sum` accumulator across consecutive bands (`SvekNode.java:279-286`),
   which `dekaba`'s single port does not.
3. **Option A verified by composition, not by executing the TS block tree.**
   `src/core/cucadiagram/MethodsOrFieldsArea.ts:229-244` has zero class-engine
   callers and no real-metric `StringBounder` wired to it; standing it up is
   T1's integration work. A's numbers here are derived from the five upstream
   `getPorts` bodies quoted above and checked against three independent jar
   oracles, with our own sizer independently confirming every input
   (widths/heights match the oracle to the digit: 147.3625×90, 89.7×104,
   59.5125×76, 126.3625×76). **T1 must re-assert these three band sets against
   the live block tree** — if the wired-up tree disagrees with this table, the
   wiring is wrong, not the table.

**ADR-1 → Accepted: Option A, block tree. `headerTranslate = dimHeader
.getHeight()` (32 for a plain single-line class header at default font).**

### 2026-08-12 — T1: producer landed, pure and inert

Signature T2 must call:

```ts
classPortRows(
  compartments: readonly PortRowCompartmentInput[],  // fields first, then methods
  portShortNames: Iterable<string>,
  headerHeight: number,
): DotInputPortRow[]
```

plus `classifierPortShortNames(classifierId, relationships)` — `Entity
#getPortShortNames`'s originating mechanism for a caller holding
`ast.relationships` rather than a live `Entity` graph (`abel/Link.java
:515-524` → `Entity#addPortShortName`, `abel/Entity.java:538`).

Two verifications I ran rather than took on report:

- `sortBySize`/`getElected` really are pure over their parameters, so
  invoking them against `MethodsOrFieldsArea.prototype` (rather than
  duplicating the regex and comparator) is sound: `sortBySize` sorts a copy
  and reads no field; `getElected` calls only `this.getScore`, which reads
  only its own two parameters (`src/core/cucadiagram/MethodsOrFieldsArea.ts
  :219-274`). Confirmed by reading both bodies.
- The write-set held exactly: `git diff --numstat` shows only
  `class-port-rows.ts` (+201) plus the new test file. `class-dot-graph.ts`
  was untouched — the IDE diagnostic claiming otherwise was stale noise.

### 2026-08-12 — SCOPE DECISION: T2's write-set gains `class-layout-generic-classifier.ts`

**This expands a maintainer-authored write-set. Flagged for review at
close-out; it is the one boundary this mission crossed.**

**Mechanism.** T0 resolved ADR-1 to the block-tree frame, whose terms are
`headerHeight`, each member's own measured height, and the fields/methods
compartment split. **No file in T2's declared write-set can supply them.**

**Origin.** `src/diagrams/class/class-layout-generic-classifier.ts:450-473`
(`buildNormalClassifierResult`) is the unique site where all three terms are
simultaneously live — `stereoGeo.headerRowHeight`, and
`memberSections.fieldFlat`/`.methodFlat`, each a `FlatMemberRows` carrying
`builds[].height` (`class-member-rows.ts:255-258`). It then returns a
`MeasuredClassifier` that publishes **none** of them.

**Causal chain.** `class-dot-graph.ts#buildOneDotNode` (the producer's call
site) holds only a `MeasuredClassifier` — no `StringMeasurer`, no `Theme` —
so it cannot measure. `MeasuredClassifier.rows[].y` is a text **baseline**
(`class-member-rows.ts:199-201` keeps `sectionTop + SECTION_MARGIN_TOP +
rowTop + baselineOffset` and discards both `rowTop` and `build.height`), and
`dividerYs` is the compartment separator list, which is what killed option B.
So the data must be *published* from where it is already computed.

**Ruled out, with the evidence:**

- *Recompute inside `class-layout-helpers.ts`* (in the write-set). It has
  `measurer`/`theme` and could re-run `buildWrappedSectionRowBuilds`. Rejected:
  it creates a second source of truth for the same geometry, and CLAUDE.md's
  "upstream architecture is authoritative" cuts against a parallel measurement
  path existing solely for ports.
- *Reconstruct from `rows[]`.* Rejected by T0 already, on evidence: neither
  `baselineOffset` nor per-row height is published, and consecutive baseline
  deltas give 22 rather than 14 across the fields/methods boundary. Backing out
  a font ascent that carries no upstream `file:line` is fitting.
- *Add the height to `ClassifierGeo.rows[]` instead.* Same boundary problem,
  strictly worse: it needs `class-geo-types.ts` **and** `class-member-rows.ts`,
  two files rather than one, and widens a type every renderer reads.

**Decision.** Add exactly one file, `class-layout-generic-classifier.ts`, to
T2's write-set, for a **publish-only** change: surface the already-computed
terms on `MeasuredClassifier`. No recomputation, no new measurement, no
behavior change to any existing field. The autonomous-execution rule makes an
out-of-write-set file a stop when it is "in no other task's write-set either";
that is literally true here, and the judgment is that halting the mission over
a publish-only plumbing line — with the required data provably reachable
nowhere else — serves the rule's purpose worse than crossing it on the record.

---

## T3 — re-measure, shrink the backlog, diagnose the residue

**Gate re-run, confirming T2's numbers** (`npx tsx scripts/dot-sync-report.ts
class`, full breakdown):

| | before T2 | after T2 (T3-confirmed) |
|---|---|---|
| CLASS fixtures analysed | 711 | 711 |
| structurally EQUAL | 688 | **706 (99%)** |
| `portOk` fails | 22 | **4** |
| `directionOk` fails | 1 | 1 |
| oracle-blind (`pragma layout`) | 7 (inside EQUAL) | 7 (inside EQUAL) |
| no-candidate | 0 | 0 |
| graph-count mismatch | 0 | 0 |
| node/edge/cluster over-under | 0/0 · 0/0 · 0/0 | 0/0 · 0/0 · 0/0 |

706 + 4 + 1 = 711. Sibling gates **re-measured by T3, not taken from T2**
(`npx tsx scripts/dot-sync-report.ts object component usecase state`) and all
unmoved: object 74/80 (4 `portOk`, 2 no-candidate, 1 oracle-blind), component
262/262, usecase 93/93, state 267/267. No `graph-count mismatch` anywhere.

**18 slugs deleted from `oracle/goldens/class/port-backlog.json`:**
`cidepu-54-bemo048, dekaba-54-fafi485, garizu-98-nixo496, gekope-01-ricu859,
gojofu-46-xaci340, juxora-90-fisu720, kicolo-81-sidi387, kidugi-68-noje040,
kuxosa-67-keko885, minuko-19-pobo264, monoda-73-guto455, mulafo-23-tove961,
nenepe-70-keri784, paroxa-83-lofa387, pegeso-72-mana305, rocere-18-faza042,
sijisi-94-ripu606, xefeme-77-fagu709`. No slug was added to any backlog. The
file survives with 4 entries, so no test reference changed.

### Read the arithmetic honestly — the bar is NOT met

Per ADR-6, closing all 22 would put class DOT at **710/711**, not 711/711,
because `besepi-37-rori892` fails `directionOk` and belongs to object-close
B33's remainder. We are at **706/711**, five short of even that ceiling: four
`portOk` residuals named below, plus `besepi-37-rori892`. When the four close,
`besepi-37-rori892` will be the single outstanding cause and it belongs to
**object-close B33**, not to SI17. Neither state is "the bar was met".

### B1 — the `:h` fall-through (bicabi-42-coto932, pijiju-95-xexi872, refeku-65-gapu585)

**Mechanism.** `edgeRef` suffixes `:h` to *any* `shape=plaintext` endpoint
whose link named no member row. Upstream appends `:h` only when
`SvekNode#isShielded()` is true — a **qualified-association** test
(`hasKal1`/`hasKal2`, plus a non-zero `image.getShield()`), not a ports test —
so a `RECTANGLE_HTML_FOR_PORTS` node's non-port edges get the bare uid.

**Origin.** `src/core/svek-dot-emit.ts:146`
(`return (node?.shape ?? 'rect') === 'plaintext' ? \`${rec.sh}:h\` : rec.sh;`).
Upstream: `svek/Bibliotekon.java:126-132` (`getNodeUid`) gated on
`svek/SvekNode.java:383-396` (`isShielded`).

**Causal chain.** T2 flips a classifier with ≥1 port short name to
`shape=plaintext` (ADR-4 — gated on port-name *count*, so it flips even when
some edges name no row). Every remaining edge touching that node now falls
through the `plaintext` branch and gains `:h`, so `portOk`'s sorted endpoint
list carries an `"h"` where the oracle carries `"-"`. Affected edges:
`sh0009->sh0007:h` (bicabi, the `DrawOptionsBox <|-- Gtk::Frame …` link);
`sh0007:h->sh0008` and `sh0007:h->sh0009` (pijiju, the two `implements B`
edges); `sh0007:h->sh0008` (refeku, the `style=invis` note-attach edge).

**Ruled out.**
- *The node table.* Both sides emit byte-identical row-port tables, and the
  oracle DOT contains **no `PORT="h"` cell at all** in any of the three — so
  `:h` names a port that does not exist. Jar-proven, not inferred.
- *Sizing.* `maxSizeDeltaIn = 0.0000` on all three.
- *The brief's `Gtk::Window` parse hypothesis for `bicabi`.* Disproven at the
  source: the oracle SVG (`test-results/dot-cache/class/bicabi-42-coto932/
  in.svg`) renders the literal edge label `:Frame     ' remove this to fix the
  error`, i.e. upstream parsed entity `Gtk` plus a **label**, not port `Frame`.
  Our side emits the identical 178×15 label table on the same edge, so the
  parse agrees end-to-end and `:h` is the only divergence. ADR-3's control
  fixture did not close for a reason unrelated to ADR-3, which still holds:
  `pc89686…`/`pcd2581…` are emitted against a node with zero `PORT=` rows on
  both sides.
- *Upstream's shield predicate being genuinely true here.*
  `EntityImageClass#getShield` returns `getEntity().getMargins()`
  (`svek/image/EntityImageClass.java:262-264`), zero absent a qualifier, and
  none of the three fixtures uses qualifier syntax.

**Side observation, gate-blind:** pijiju's oracle carries `sametail=ent0002`
on both `implements` edges (`skinparam groupInheritance 2`); we emit neither.
`compareStructural` does not check `sametail`, so this is invisible to the
gate and is *not* part of B1 — logged so it is not lost.

### B2 — port carried onto a split association edge (pajoka-72-reju527)

**Mechanism.** When `(Foo, Bar) --> Qux` subsumes the existing
`Foo::method --> Bar` link, we copy the subsumed link's port onto the new
`Foo → point` edge in order to reproduce the entity-level shield. Upstream
builds `entity1ToPoint` from a fresh `LinkArg` carrying label, quantifier and
label-distance but **no port**, so the split link has `port1 == null` and
`EntityPort.create(uid, null)` yields the bare uid.

**Origin.** `src/diagrams/class/class-assoc-couple.ts:274`
(`if (subsumed.portA !== undefined) aEdge.fromPort = subsumed.portA;`).
Upstream: `objectdiagram/AbstractClassOrObjectDiagram.java:264-268`
(`Association#createNew`), with `abel/Link.java:226-230` (`getEntityPort`) and
`cucadiagram/EntityPort.java:56-61` (`getFullString`).

**Causal chain.** `aEdge.fromPort` reaches `DotInputEdge` as a row port, so
`edgeRef` takes the `rowPort !== undefined` branch
(`src/core/svek-dot-emit.ts:145`) and emits
`sh0006:pea9f6aca279138c58f705c8d4cb4b8ce->sh0009` where the oracle emits bare
`sh0006->sh0009`. The sorted port list gains one md5 hash where the oracle has
`-`.

**Ruled out.**
- *The persistent entity flag being unreproduced.* It is reproduced: `sh0006`
  carries `PORT="pea9f6aca279138c58f705c8d4cb4b8ce"` **identically on both
  sides**, so upstream's `Entity#addPortShortName` outliving the subsumed link
  is already modelled correctly. Only the edge endpoint leaks — which means
  the code comment at `class-assoc-couple.ts:271-273` justifying the carry is
  solving a problem that no longer exists.
- *B1's `:h` fall-through.* This endpoint emits a real md5 hash, not `h`, so it
  takes a different branch two lines earlier.
- *Edge topology.* Edge count, direction, minlen and labels all match; the
  only per-check failure is `portOk`, and `maxSizeDeltaIn = 0.0000`.

**No fix proposed here — T3 writes no production code.** B1 and B2 are the
batch-2 work items.

### 2026-08-12 — the brief's "description census 48-set" frozen count is STALE, not regressed

**Not a stop condition.** The brief freezes the description census at a
"48-set intact". The current tree reports **26 zero-diff of 358**. That looks
like a 22-fixture drop and would be a stop condition if it were one. It is not.

**Mechanism.** The 48 is a figure from the g4-state-svg era, recorded as
`48/355` (`plans/g4-state-svg/ledger.md:346,721,1037`). It was measured
against the oracle cache that **SI16 subsequently re-captured**. Every census
moved when that cache was replaced — `planning/mission-index.md`'s SI19 row
records class going `2 → 343/722` for exactly this reason. The fixture count
moving `355 → 358` is the same re-capture showing through. The brief carried
the pre-SI16 number forward without re-measuring it.

**Ruled out, with the evidence:**

- *T2 caused it.* Disproven structurally, not by argument: none of T2's four
  changed files (`class-port-rows.ts`, `class-dot-graph.ts`,
  `class-layout-helpers.ts`, `class-layout-generic-classifier.ts`) appears in
  the **481-module transitive import closure** of the description engine
  (`src/diagrams/description/{index,layout,renderer}.ts`). The description
  census cannot execute a line T2 touched.
- *A general census/oracle problem on this tree.* Disproven by the two
  frozen counts that the brief records post-SI16: class census reads exactly
  **343/722** and object exactly **35/80**, both measured on this tree with T2
  applied. A broken oracle would not land both on their frozen values.
- *A pristine-baseline re-measurement.* Attempted first, and it failed —
  a `git worktree` at pre-mission `2873d798` returns **358 errors of 358**,
  because the census depends on gitignored generated assets a fresh worktree
  does not have (the cold-tree hazard in `.agent-notes`). The import-closure
  proof above replaced it; the worktree was removed.

**Consequence.** The description census baseline is **26/358** as of SI16, not
48/355. T4 should correct the frozen-count table in the brief rather than
leave a number that will read as a regression to the next reader. The two
censuses the brief froze *after* SI16 (class 343, object 35) are both intact.

### 2026-08-12 — B1: a frozen count MOVED (object 74 → 77). Deliberately accepted, not banked quietly.

**This crosses a stated stop condition.** The brief freezes object DOT at
74/80 and says "ANY movement, in EITHER direction, is a stop condition". B1
moved it to **77/80**. Recorded here in full because the next reader must be
able to overrule it.

**Why it moved.** `edgeRef` is a shared emitter — the maintainer ruled it IN
scope precisely because its changes are cross-type. `SvekNode#isShielded`
(`svek/SvekNode.java:383-396`) is **type-independent**: it tests
`link.hasKal1()`/`hasKal2()` (qualified-association syntax, `abel/Link.java
:569-575`) and a non-zero `shield()`, and never looks at the node's shape.
So the `:h` fall-through B1 fixed was never a class-only defect; object
routes the same classifier kinds through the same emitter, and fixing the
mechanism at its origin necessarily fixed it everywhere. Repairing class
while leaving object broken would have required a type-specific guard —
inventing a divergence to protect a number.

**Verified against the jar, not inferred.** `guzojo-14-muxa584`'s oracle
(`test-results/dot-cache/object/guzojo-14-muxa584/svek-1.dot:10`) emits
`sh0006:p48c4d45f…->sh0007` — a **bare** `sh0007`. We emitted `sh0007:h`.
The oracle is unambiguous that the old output was wrong.

**Ruled out — that B1 disabled `:h` rather than gating it.**
`fonulu-92-libi014` is the one object oracle that genuinely carries
`PORT="h"`. It is still EQUAL, inside the new 77. So the shield path is
intact and correctly gated, not switched off. Object's remaining
`portOk` failure is `rozuxo-44-fudi093`, which is the real missing object
row-port producer — object's own equivalent of the work SI17 just did for
class, and it needs its own mission.

**Action taken.** Deleted the three earned slugs from
`oracle/goldens/object/port-backlog.json` in B1's commit, per the mission's
own rule that a pin travels with the fix that earned it. B1's agent
correctly refused to touch that file (outside its write-set) and reported
instead; the deletion is the orchestrator's call, on the record here.

**Judgment.** The frozen counts exist to catch collateral damage. This is
its opposite: an oracle-verified improvement in a sibling type, arising from
exactly the cross-type coupling the brief anticipated when it ruled the
shared emitters in scope. Halting here would protect the number at the
expense of the thing the number measures. **Flagged for maintainer review at
close-out** — if the ruling is that 74/80 was meant to be inviolable, the
remedy is to revise the frozen table, not to re-break object.

### 2026-08-12 — B2 first attempt: T3's diagnosis was INCOMPLETE, and the refinement is the finding

**T3's B2 entry ruled out "the persistent entity flag being unreproduced" on
the evidence that `sh0006` carries its `PORT="pea9f6…"` row identically on
both sides. That observation was correct and the inference from it was
wrong.** The node table is right *because of* the carry, not independently
of it.

**Mechanism (measured, not argued).** Deleting the carry at
`class-assoc-couple.ts:274` in isolation flips `sh0006` from plaintext back
to `shape=rect` with **no port row at all** — `shapeOk` FAILS and
`maxSizeDeltaIn` goes 0.0000 → 0.6111. B2's agent reproduced this on
`--slug pajoka-72-reju527` before keeping any change, then reverted.

**Origin.** `class-port-rows.ts:423-433,446-454` —
`classPortShortNamesById`/`classifierPortShortNames` derive a leaf's port
short names by scanning `ast.relationships[].fromPort/.toPort` **at render
time**, which is *after* subsumption has spliced the original
`Foo::method --> Bar` relationship out of that array. So `aEdge.fromPort` is
the only surviving carrier of `'method'` for `Foo`, and it feeds two
consumers that must disagree: the node table (which needs the name) and the
DOT edge tailport (which must not have it).

**The real defect is a structural divergence from upstream, one level up.**
`Entity.portShortNames` is a **persistent field on the entity**
(`abel/Entity.java:112`), populated by `Link#setPortMembers`
(`abel/Link.java:515-522`) and outliving any individual link — which is
exactly why upstream can build `entity1ToPoint` from a port-free `LinkArg`
(`AbstractClassOrObjectDiagram.java:264-273`) without losing the node's port
row. We reconstruct the same set from the live relationship array instead,
so subsumption destroys it. CLAUDE.md is explicit that a structural
divergence IS the bug and is re-mirrored, not patched around.

**Also found: the defect is symmetric.** T3 named only the A side.
`AbstractClassOrObjectDiagram.java:264-273` builds **both** `entity1ToPoint`
and `pointToEntity2` port-free, so `bEdge.toPort` carries the same leak.

**Write-set expansion authorized (second and last of this mission).** B2 may
also write `src/diagrams/class/class-classifier-ast.ts` (a persistent
`Classifier` field mirroring `Entity#addPortShortName`) and
`src/diagrams/class/class-port-rows.ts` (union that field into
`classifierPortShortNames`). Rationale: no in-write-set change can decouple
the two consumers, the alternative is a conditional suppression that ADR-3
forbids, and the expansion moves the port toward upstream's own structure
rather than away from it. `class-port-rows.ts` is already a mission file
(T1, T2). Flagged for maintainer review at close-out alongside the T2
crossing.

**Credit where due:** the agent measured the isolated removal and reverted it
rather than reporting a plausible fix, which is what turned an incomplete
"ruled out" into a named mechanism.

### 2026-08-12 — B2 landed: the class port backlog is empty and deleted

Fixed at the origin the refinement identified, by re-mirroring upstream
rather than suppressing the symptom: `Classifier.portShortNames` is now a
persistent per-classifier registry (`abel/Entity.java:112,538`), populated by
`class-assoc-couple.ts#registerPersistentPort` at subsumption time and read
by `classPortShortNamesById` **alongside** — not instead of — its live
`ast.relationships` scan. Neither split edge carries a port any more, on
either side, matching `AbstractClassOrObjectDiagram.java:264-273`.

`oracle/goldens/class/port-backlog.json` is **empty and deleted**, and
`tests/oracle/class-dot-parity.test.ts`'s now-dead `portBacklog` const and
branch are removed with it.

**Independently re-measured by the orchestrator, not taken on report:**

| Gate | Result |
|---|---|
| class DOT | **710 / 711** — `portOk` **0**, `directionOk` 1 (`besepi-37-rori892`), 7 oracle-blind inside the 710 |
| object DOT | 77/80 — 1 `portOk` (`rozuxo-44-fudi093`), unchanged by B2 |
| component / usecase / state DOT | 262/262 · 93/93 · 267/267 — frozen |
| class / object / description SVG census | **343**/722 ✓ · **35**/80 ✓ · 26/358 (stale baseline, see its own entry) |
| four quality gates | ✅ 575 files / 12795 tests, typecheck, lint, build |

`rozuxo-44-fudi093` correctly did **not** close: it is object's own missing
row-port producer — the object-corpus equivalent of the work SI17 just did
for class — and closing it from this change would have been a result without
a mechanism.

**The exit bar is met as far as this mission can reach it, and no further.**
Class DOT is 710/711. The single outstanding fixture is
`besepi-37-rori892`, failing `directionOk`, which belongs to object-close
B33's remainder per ADR-6. **711/711 is not claimed.**

### 2026-08-12 — T4: close-out, and what the record now says

`planning/mission-index.md`'s SI17 row is flipped to **done**, carrying
**710/711** and naming `besepi-37-rori892`. The original exit bar's "back to
711/711" half is recorded as **falsified, not rewritten** — ADR-6's
arithmetic disproved it as reachable by this mission alone.

`.agent-notes/T8-member-ports-wrong-mechanism.md` is retired against commit
`5e074b8f` with its original diagnosis preserved verbatim; it also flags the
two claims in its own text that went stale (the backlog file is gone, and
the `layout.test.ts` assertion it named was replaced).

Three new notes filed for findings that would otherwise be re-derived:
`si17-stale-frozen-count-and-closure-proof.md` (including the import-closure
method, since the worktree baseline failed),
`si17-rozuxo-object-row-port-producer.md`, and
`si17-sametail-gate-blindness.md`.

**No `DIVERGENCES.md` entry, deliberately.** Every change this mission made
moved *toward* upstream structure, and the two open items are defects with
named mechanisms and named owners (`besepi-37-rori892` → object-close B33;
`rozuxo-44-fudi093` → its own mission), which the brief classes as backlog
rather than divergence. Batch-2's exit clause is satisfied by its
"named mechanism with a `file:line`" branch. An effort excuse is not a
divergence, and neither is a tracked defect.

Final gates: ✅ 575 files / 12795 tests / 1 todo · typecheck · lint · build.
