# Decision journal — si20-object-row-ports

Appended during execution. Every non-trivial judgment call gets an entry:
if a reasonable developer might have chosen differently, log it.

A diagnosis entry must carry all four parts, per `~/.claude/rules/diagnosis.md`:
**mechanism**, **origin** (`file:line`), **causal chain**, and **what was
ruled out** with the evidence that ruled it out. An empty "ruled out" on a
non-trivial defect means the cause was guessed.

And one rule this mission inherits from SI17's B2, which nearly shipped a
wrong fix without it:

> **An observation that holds only because of the thing you are about to
> remove is not a ruling-out.** Measure the removal in isolation before
> believing the diagnosis.

## Quality-gate log

| Date | Task | test | typecheck | lint | build | frozen counts |
|---|---|---|---|---|---|---|
| 2026-08-12 | Batch 0 (T0+S1) | 12795 pass, 1 todo | rc=0 | rc=0 | rc=0 | object DOT 77/80 (1 portOk `rozuxo`, 2 no-candidate) · class DOT 710, portOk 0, 1 `directionOk` (`besepi-37-rori892`) · object census 35/80 — all byte-identical to frozen |

## Entries

### T0 — ADR-1 and ADR-2 resolved by measurement (2026-08-12)

**Verdict: `H = 18` (plain object), `margin = 4`. Option A. ADR-2: the object
election input DOES reproduce `Member.getDisplay(false)` on the visibility
character.**

#### The Java, read first (the chain object actually walks)

Object's body is **not** `MethodsOrFieldsArea#asBlockMemberImpl()`.
`BodierLikeClassOrObject#getBody`'s OBJECT branch
(`cucadiagram/BodierLikeClassOrObject.java:225-233`) returns
`BodyFactory.create1(...)`, which is `new BodyEnhanced1(align, rawBody, …)`
(`cucadiagram/BodyFactory.java:71`) — the `lineFirst = true` constructor
(`cucadiagram/BodyEnhanced1.java:86`). The class branch never runs for an
object leaf (`:237-249` is guarded by `type.isLikeClass()` at `:234-235`).

`BodyEnhanced1#getArea` builds one block per body segment; an object whose
field lines contain no separator/tree/table yields `blocks.size() == 1`
(`BodyEnhanced1.java:177`), so `area = decorate(new MethodsOrFieldsArea(...),
separator='_', title=null, …)` (`:193`). With `separator != 0` and
`title == null`, `BodyEnhancedAbstract#decorate` returns

```java
new TextBlockLineBefore(getDefaultThickness(),
        TextBlockUtils.withMargin(block, marginX, 4), separator);
```

(`cucadiagram/BodyEnhancedAbstract.java:111-113`, `marginX = 6` from
`BodyEnhanced1.java:113-114`). `TextBlockUtils.withMargin(b, 6, 4)` is
`new TextBlockMarged(b, 4, 6, 4, 6)` — top **and** bottom margin 4
(`klimt/shape/TextBlockUtils.java:64-69`).

That is character-for-character the same wrapper the class path builds in
`MethodsOrFieldsArea#asBlockMemberImpl` (`cucadiagram/MethodsOrFieldsArea.java
:83-86`), reached by a different route. **The class margin of 4 does transfer
— but as a coincidence of two independent constructions, not because object
shares the class code path.** Anyone porting this must copy the
`BodyEnhanced1`/`decorate` chain, not the `asBlockMemberImpl` one.

Port propagation down the chain, all untranslated except the marge:
`EntityImageObject#getPorts` `translateY(getNameAndSteretypeDimension())`
(`svek/image/EntityImageObject.java:264-270`, header at `:240-247`) →
`BodyEnhanced1#getPorts` (no translate, `:228-232`) →
`TextBlockLineBefore#getPorts` (no translate,
`klimt/shape/TextBlockLineBefore.java:103-107`) → `TextBlockMarged#getPorts`
`.translateY(top)` with `top = 4` (`klimt/shape/TextBlockMarged.java:100-102`)
→ `MethodsOrFieldsArea#getPorts` accumulating each member's own measured
height from `y = 0` (`MethodsOrFieldsArea.java:194-211`).

So `position = H + 4 + Σ(prior member heights)` — SI17's frame, with
`m = 4` and `H = getNameAndSteretypeDimension().getHeight()`.

#### The measurement that separated H from margin

`rozuxo` alone **cannot** separate them, and this entry does not claim it
does: its two filler equations `H+m+14 = 36` and `H+m+28 = 50` subtract to
`14 = 14`, pinning only `H + m = 22`.

The separator is the **trailer** row, on a control whose port sits on the
LAST member so that `trailer = bottom margin` exactly. Authored control
(scratchpad `ctl/ctl-plain.puml`, one member per object, port on it):

```
@startuml
object AA {
 alpha
}

object BB {
 beta
}

AA::alpha --> BB::beta
@enduml
```

Rendered with `scripts/oracle-render.sh <ABS-out-dir> ctl-plain.puml`. Jar
DOT, both nodes identical:

| node | filler | row | trailer | total |
|---|---|---|---|---|
| `sh0006` (AA) | 22 | 14 | 4 | 40 |
| `sh0007` (BB) | 22 | 14 | 4 | 40 |

`filler = H + m = 22`; `trailer = m = 4` ⇒ **`H = 18`, `m = 4`**.

Option B (`m = 0`, `H = 22`) predicts `trailer = 0`, and
`SvekNode#appendTr` drops any row of height `<= 0`
(`svek/SvekNode.java:298-311`) — so under B the third `<TR>` would not be
emitted at all. It is emitted, with `HEIGHT="4"`. **Option B is refuted
directly, not out-scored.** It also mispredicts the node total (`22 + 14 =
36`, oracle `40`) and mispredicts rozuxo's own trailer (`14`, oracle `18`).

#### The stereotyped control — H moves, margin does not

`ctl-stereo.puml` = the same file with `object AA <<thing>>`:

| node | filler | row | trailer | total |
|---|---|---|---|---|
| `sh0006` (AA, stereotyped) | **34** | 14 | **4** | 52 |
| `sh0007` (BB, plain) | 22 | 14 | 4 | 40 |

`H_stereo = 34 − 4 = 30` (stereotype adds 12); the trailer is **unchanged at
4**. Exactly one `(H, margin)` pair survives both controls.

`ctl-stereo3.puml` = rozuxo with `<<thing>>` on `CC`, the three-member
cross-check:

| node | members | port on | filler | row | trailer | total | reproduced by `H + 4 + Σprior` |
|---|---|---|---|---|---|---|---|
| `sh0006` (CC, stereo) | 3 | member 2 | 48 | 14 | 18 | 80 | `30+4+14 = 48` ✓, trailer `14+4 = 18` ✓ |
| `sh0007` (users) | 3 | member 3 | 50 | 14 | 4 | 68 | `18+4+28 = 50` ✓, trailer `4` ✓ |
| rozuxo `sh0006` (CC) | 3 | member 2 | 36 | 14 | 18 | 68 | `18+4+14 = 36` ✓ |
| rozuxo `sh0007` (users) | 3 | member 3 | 50 | 14 | 4 | 68 | `18+4+28 = 50` ✓ |

All four rows reproduce under `(H = title.height, m = 4)`; none reproduces
under `m = 0`.

#### Our `title.height` equals `H`

`buildFieldBasedObjectGeo` publishes `dividerYs: [title.height]`
(`src/diagrams/class/class-object-map-sizing.ts:426`), which is drawn as the
body separator line. Measured through `renderSync` + `DeterministicMeasurer`,
node-top-relative:

| control | our `title.height` | jar-derived `H` | our node height | jar total |
|---|---|---|---|---|
| `ctl-plain` AA/BB | **18** | 18 | 40 | 40 |
| `ctl-stereo` AA | **30** | 30 | 52 | 52 |
| `ctl-stereo3` CC / users | **30 / 18** | 30 / 18 | 80 / 68 | 80 / 68 |
| `ctl-vis` AA | **18** | 18 | 68 | 68 |

Widths match to the printed digits too (`46.3`, `49.375`, `69.488`,
`72.6375`). `OBJECT_FIELD_MARGIN_Y = 4`
(`class-object-map-sizing.ts:138`) is already the `margin`. **No production
constant needs to change; T1 wires `title.height` in as the translate and
`OBJECT_FIELD_MARGIN_Y` as the marge.**

#### ADR-2 — the election input

`formatObjectMemberText` (`class-object-map-sizing.ts:207`) reads
`rawDisplay ?? (type ? \`name = type\` : name)`. `parseObjectField`
(`class-object-commands.ts:346-369`) strips a leading visibility char
(`line.slice(1).trim()`) before either branch sees the text — mirroring
`Member`'s constructor, which sets `display =
trin(manageGuillemet(displayClean.substring(1)))` when
`VisibilityModifier.isVisibilityCharacter(displayClean)`
(`cucadiagram/Member.java:129-136`), and `getDisplay(false)` returns exactly
that `display` (`:146-155`).

Measured on a control that HAS visibility characters (`ctl-vis.puml`,
`-alpha` / `beta` / `+gamma`, edge `AA::gamma --> BB::beta`):

| source line | our `formatObjectMemberText` | jar `<text>` (= `getDisplay(false)`) |
|---|---|---|
| `-alpha` | `"alpha"` | `"alpha"` |
| `+gamma` | `"gamma"` | `"gamma"` |
| `#delta` | `"delta"` | — |
| `~eps` | `"eps"` | — |
| `- spaced` | `"spaced"` | — |

Jar elects `gamma` (member 3): filler `50 = 18 + 4 + 14 + 14`, trailer `4`,
`H` unchanged at 18 — the visibility icon does not perturb the band frame.
**ADR-2: yes, on the visibility character the two forms are identical.**

**One divergence found, on a different axis — the `=` separator, NOT the
visibility char.** `tryStructuredObjectMember`'s `^(\w+)\s*=\s*(.+)$` branch
(`class-object-commands.ts`) discards the separator's original spacing and
stores no `typeSeparator`, so `formatObjectMemberText` re-emits a canonical
`" = "`:

| source line | ours | jar `getDisplay(false)` |
|---|---|---|
| `a=1` | `"a = 1"` | `"a=1"` |
| `aaaaaaaaaaaaaaaaaaaa=1` | `"aaaaaaaaaaaaaaaaaaaa = 1"` | `"aaaaaaaaaaaaaaaaaaaa=1"` |

Verified against jar SVG text on `ctl-sep.puml` / `ctl-sep2.puml`. The class
path does NOT have this bug — `formatMemberText` uses
`member.typeSeparator ?? ': '` (`class-layout-helpers.ts:210`). It is
invisible to every existing gate because `DeterministicMeasurer` measures a
space as width 0, so node widths and the DOT still match exactly
(`183.76250000000005` both sides); only the `<text>` content differs.

**Not a T0 stop and not fixed here** (T0 changes no production code, and this
is a pre-existing text-formatting divergence orthogonal to the port band). It
did not change the election on any control measured: `getScore`'s
`.*\bshortName\b.*` (`MethodsOrFieldsArea.java:228-235`) matches `"a = 1"`
and `"a=1"` identically for shortname `a`, and the jar elected member 1 on
`ctl-sep.puml` exactly as we would. **Filed as a batch-2 B-item candidate**
per README's "push forward with judgment"; see
`.agent-notes/si20-object-body-is-bodyenhanced1.md`.

#### Ruled out, with the evidence

- **Object reaches `MethodsOrFieldsArea#asBlockMemberImpl` (the class
  wrapper).** Ruled out by `BodierLikeClassOrObject.java:225-233` returning
  before `:237`, and by `:234-235`'s `assert type.isLikeClass()`. The margin
  of 4 is right; the route is not.
- **`m = 0` / option B.** Ruled out by the *emitted* trailer row of height 4
  on `ctl-plain` — a row `appendTr` would have suppressed under B
  (`SvekNode.java:298-311`) — plus mispredicted totals on `ctl-plain`,
  `ctl-stereo` and rozuxo. This is not "A fit better"; B produces markup that
  is absent from the oracle.
- **`H` is something other than `getNameAndSteretypeDimension`.** Ruled out
  by the stereotyped control moving `H` by exactly the stereotype block's
  height (18 → 30) while every other reading held.
- **The margin is asymmetric (top ≠ bottom).** Ruled out by
  `TextBlockUtils.java:64-69` constructing `TextBlockMarged(b, marginY,
  marginX, marginY, marginX)`, and confirmed by `ctl-plain`'s
  `filler − H = trailer = 4`.
- **The rozuxo fixture could have decided ADR-1 on its own.** Not ruled out —
  **confirmed false**, per the subtraction above. Recorded explicitly because
  ADR-1 warns that an agent assuming `m = 4` would "pass while being wrong".

#### Discovered hazard for T1 — `MinimumWidth > 0` suppresses ALL object ports

`BodyEnhanced1#getArea` wraps its result in
`TextBlockUtils.withMinWidth(area, minClassWidth, align)` when
`style.value(PName.MinimumWidth) > 0` (`BodyEnhanced1.java:182-184`), and
`TextBlockMinWidth` does **not** implement `WithPorts`
(`klimt/shape/TextBlockMinWidth.java:45`). `BodyEnhanced1#getPorts`'s
`area instanceof WithPorts` test (`:230`) therefore fails and it returns an
empty `Ports`.

Jar-confirmed (`ctl-minwidth.puml`, `skinparam minClassWidth 300`): the node
is still `RECTANGLE_HTML_FOR_PORTS` (`getShapeType()` keys only on
`getPortShortNames().size()`, `EntityImageObject.java:249-254`), but its
table has **one row, no `PORT=` attribute**, while the edge still references
`sh0006:p2c1743a…->sh0007:p987bcab…`:

```
sh0006 [shape=plaintext,label=<<TABLE …><TR><TD FIXEDSIZE="TRUE"
  WIDTH="300.0" HEIGHT="40"></TD></TR></TABLE>>];
```

A faithful port must reproduce the empty-`Ports` case, not just skip the
min-width wrapper. This has no class-path analogue (class's body is a
`TextBlockLineBefore`, never a `TextBlockMinWidth`).

#### Reproduction

Controls live in the session scratchpad (`ctl/ctl-{plain,stereo,stereo3,vis,
sep,sep1,sep2,minwidth}.puml`), rendered with
`scripts/oracle-render.sh "$ABS_OUT/<name>" "$SP/ctl/<name>.puml"` —
**absolute** out-dir. Our side: `renderSync(src, { measurer: new
DeterministicMeasurer() })`, reading the node `<rect>`, the divider `<line>`
and the `<text>` contents. No production code was modified; no git command
was run.

---

### Orchestrator — execution plan and Batch 0 close (2026-08-12)

**Execution plan** (logged per `rules/parallelism.md`, autonomous-mode
exception — no user review step). Batch 0 `T0 ∥ S1` on disjoint write-sets
(T0: journal only; S1: source only), then S2, then `T1 → T2 → T3`, then T4.
The only parallelism is Batch 0, exactly as the brief specifies; everything
after is one mechanism through one path, where the intermediate states are
the hazard. Agents were forbidden all state-mutating git — they share this
worktree — and the orchestrator commits after verifying each batch.

**Model routing.** T0 to Opus: it is a multi-path measurement whose failure
mode is a plausible-but-wrong constant, which is exactly the case
`rules/parallelism.md` reserves Opus for. S1/S2 to Sonnet: mechanical
relocations with an unambiguous acceptance test.

**Batch 0 outcome.** Both tasks green. Gates re-run by the orchestrator, each
unpiped with its exit code read directly — `npm test | tail` reports `tail`'s
status and would mask a vitest failure. Both DOT gates and the object census
re-measured independently of S1's own run; all three byte-identical to
frozen. Commits `c28a9cca` (T0), `c5be12be` (S1).

**One correction carried forward into T1.** T0's ADR-1 context named
`MethodsOrFieldsArea#asBlockMemberImpl` as the composition an object walks.
It is not: an object body is `BodyEnhanced1`, built through
`BodierLikeClassOrObject.java:225-233` → `BodyFactory.java:71`, and its
margin of 4 comes from `BodyEnhancedAbstract#decorate:111-113`'s
`withMargin(block, 6, 4)` — not from `TextBlockUtils.java:64-69` via the
class path. The frame and both values are unchanged; the route is not. This
is the brief's own thesis holding up: closing object from SI17's change
would have been a result without a mechanism, and the mechanism turned out
to run through a different constructor than the brief assumed.

**T0's hazard is a real behavior, not a caveat.** `MinimumWidth > 0` wraps
the body in `TextBlockMinWidth`, which does not implement `WithPorts`
(`TextBlockMinWidth.java:45`), so `BodyEnhanced1#getPorts:230` returns an
empty `Ports`. Jar-confirmed: the shape stays `RECTANGLE_HTML_FOR_PORTS`,
the table emits one row with no `PORT=`, and the edge still names the port
ids. T1 must reproduce the suppression, not guard against it.

---

### T2 — SCOPE DECISION: the MinimumWidth suppression lands outside the declared write-set (2026-08-12)

T2's write-set is `class-port-rows.ts` + `class-shield-helpers.ts`. It also
wrote `class-object-map-sizing.ts` (new `objectBodyReportsPorts`, 52 → 82
lines) and `class-object-sizing.ts:421` (the call site). Accepted, on the same
grounds and with the same precedent as SI17's T2, which expanded into
`class-layout-generic-classifier.ts` and journalled it under this same
heading (`5e074b8f`).

**Why the declared seam could not hold it.** The suppression needs the
resolved `MinimumWidth`, which means it needs `Theme`. `class-port-rows.ts`
has no `Theme` at that seam, and `applyShapeAndPorts` is already at the
hook-enforced 5-parameter cap — so threading one would have forced an edit to
`class-dot-graph.ts`, which has 2 lines of headroom and whose modification is
an explicit **stop condition** in this brief. The chosen site is also the
architecturally correct one: upstream applies the wrapper at body
construction (`BodyEnhanced1#getArea`), not at port emission.

**The behavior, cited.** `BodyEnhanced1#getArea` wraps the area in
`TextBlockUtils.withMinWidth(...)` when `PName.MinimumWidth > 0`
(`cucadiagram/BodyEnhanced1.java:182-184`). `TextBlockMinWidth implements
TextBlock`, **not** `WithPorts` (`klimt/shape/TextBlockMinWidth.java:45`), so
`BodyEnhanced1#getPorts:228-232` returns an empty `Ports`. The shape still
flips, because `getShapeType` keys only on the declared port-name **count**
(`EntityImageObject.java:249-253`, SI17 ADR-4). Net effect, jar-confirmed:
`RECTANGLE_HTML_FOR_PORTS` with a single row carrying no `PORT=`, while the
edge still names the port ids.

### T2 — diagnosis: the election reconstructor was the class one (2026-08-12)

Found and fixed by T2 inside its own wiring, before the gates ran.

- **Mechanism.** `toPortCompartments` rebuilt the election text with
  `formatMemberText`, the **class** reconstructor, for object leaves too.
  ADR-2 resolved the object election input as `formatObjectMemberText`.
- **Origin.** `src/diagrams/class/class-port-rows.ts`, `toPortCompartments`.
- **Causal chain.** The two disagree on reachable input (`\t` unescaping,
  `=` vs `:`). `getScore`'s `\bshortName\b` tier is sensitive to exactly
  that: a literal `\t` puts a word character where a real tab puts a word
  boundary, dropping the score 100 → 50. `Ports#add` replaces only on a
  strictly greater score, so the band is then handed to the wrong row.
- **Ruled out.** Not caught by any gate: `rozuxo`'s members are bare words
  that render identically under both reconstructors, so every count stayed
  green while the code was wrong. The control that exposed it asserted
  position 22 where the correct value is 36; it failed before the fix and
  passes after.

This is ADR-2's stated trap firing in the code rather than in the
measurement — the brief predicted drift here would be *silent*, and it was.

### T2 — gate state at this commit: RED by construction (2026-08-12)

`npm test` exits 1 with exactly one failure:
`rozuxo-44-fudi093 … expected [] to deeply equal [ 'portOk' ]`. The fixture
now passes **every** check while `port-backlog.json` still pins it as a
`portOk` failure. The ratchet asserts a backlog fixture fails `portOk` and
nothing else, so passing completely is a failure of the pin, not of the port.
T3 retires it in the next commit. Identical to SI17's T2, whose commit body
records the same red state for the same reason.

`portOk` is an **edge-endpoint** comparison and does not inspect the node
table (`.agent-notes/si17-sametail-gate-blindness.md`), so T2 additionally
checked the emitted `svek-1.dot` for `rozuxo` against the jar oracle
directly: byte-identical whitespace-normalized, rows `36/14/18` and `50/14/4`.

---

### T3 — re-measure, retire the object port backlog (2026-08-12)

**Verdict: `rozuxo-44-fudi093` closed. `port-backlog.json` is deleted, not
shrunk — it held exactly one slug.**

#### Re-measurement, independent of T2's own numbers

`npx jiti scripts/dot-sync-report.ts object`, re-run from this commit before
any edit:

```
object: 80 CLASS fixtures
  structurally EQUAL (DOT in sync): 78 (98%)
  no-candidate (we feed nothing):   2
  oracle-blind (pragma layout):     1  [already inside the 78]
  graph-count mismatch:             0
```

Matches T2's stated numbers exactly: `77 EQUAL + 1 portOk (rozuxo) + 2
no-candidate` at T2's commit → `78 EQUAL + 2 no-candidate` here. No
correction needed.

#### `rozuxo` closed — verified beyond `portOk`, per the SI17-derived rule

`portOk` alone would not be enough: it is an edge-endpoint comparison
(`.agent-notes/si17-sametail-gate-blindness.md`) and could pass on a wrong
node table. Ran `npx jiti scripts/dot-sync-report.ts --slug rozuxo-44-fudi093
object` directly (not the aggregate report) and read the raw DOT text, not
just the per-check booleans:

- `[per-check diff]` reports "all structural checks pass
  (structurallyEqual=true)" — every check in `StructuralDiff`
  (`tests/oracle/svek-dot.ts:293-320`), not `portOk` in isolation.
- The printed oracle and candidate DOT blocks are identical character-for-
  character on both nodes' full `<TABLE>` markup — widths, all three row
  `HEIGHT`s (`36/14/18` and `50/14/4`), both `PORT="p…"` md5 ids, and the
  edge's `sh0006:p…->sh0007:p…` endpoints.
- Diffed the tool's raw oracle/candidate text blocks with `diff`; the only
  lines that differed were blank-line padding the reporter itself inserts
  between sections, confirmed by inspection, not assumed.
- Compared the live-rendered DOT against the **pinned golden**
  `oracle/goldens/object/rozuxo-44-fudi093/svek-1.dot` (the file this task's
  gate reads back on every future run) — byte-identical.

This satisfies "measure the removal in isolation before believing the
diagnosis": the check is against the node table itself, the thing `portOk`
cannot see, not against T2's own prior claim of closure.

#### What was deleted

- `oracle/goldens/object/port-backlog.json` — the file, not an entry. It
  held one slug (`rozuxo-44-fudi093`); removing it emptied the file per the
  task's own step 2, so step 3 (delete-if-empty) applies in the same commit,
  identical to SI17's B1/T3 precedent for the class equivalent.
- `tests/oracle/object-dot-parity.test.ts`: the `portBacklog` const (its
  `existsSync`/`JSON.parse` read of the now-deleted file) and its
  `else if (portBacklog.has(name))` branch. The `directionBacklog` branch's
  comment previously said "same shape as `portBacklog`" — updated to name
  this task instead of a construct that no longer exists in the file, since
  a dangling forward reference in a comment is not itself a code defect but
  is misleading on read.

No production code touched. `class-dot-parity.test.ts` was read (not
written) to confirm the reference-removal shape SI17's T3 used for the class
file, so this task's deletion matches an established pattern rather than
inventing one.

#### The honest ceiling, stated per ADR-6 — do not read past 78/80

Object DOT is **78/80**, not clean. The remaining two are `no-candidate`
fixtures — we feed nothing into the comparison for them, a separate,
unrelated mechanism not touched by this task. `besepi-37-rori892` fails
`directionOk` (part of the **class** corpus's 711, not object's 80) and is
tracked under object-close B33, not this mission. Nothing in this entry
should be read as "the object corpus is clean" — 2/80 remain open by a
mechanism this task did not touch, and 1/80 of the 78 EQUAL is oracle-blind
(passes because the jar dumps no DOT to disagree with, not because it was
verified against one).

#### No slug added to any backlog

Confirmed by inspection of every diff in this commit: the only backlog
mutation is the deletion of `oracle/goldens/object/port-backlog.json` in
full. `direction-backlog.json` and `size-backlog.json` (object) were not
opened for writing. No collateral damage from T2 was found — the closure
matched T2's own claim exactly, gate-side and byte-side.

#### Gates, unpiped, exit codes read directly

| Gate | Command | Result |
|---|---|---|
| test | `npm test` | `Test Files 577 passed (577)`, `Tests 12811 passed \| 1 todo (12812)`, exit 0 |
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| build | `npm run build` | exit 0 (vite build succeeded; the printed `TS2591`/`TS2503` diagnostics are vite-plugin-dts's isolated-declaration pass over `src/core/include-resolver-node.ts`, a file outside this task's write-set and unmodified by it — pre-existing, not introduced here) |

Deleting the pin is what turned `npm test` from T2's documented RED
(`rozuxo … expected [] to deeply equal [ 'portOk' ]`) to green — no other
change was needed, confirming T2 already landed the full mechanism.
