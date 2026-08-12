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
