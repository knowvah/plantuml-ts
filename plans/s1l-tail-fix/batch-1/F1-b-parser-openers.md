# F1-b — G1 + G8 + G9-E1 parser: block openers + body text

## Context

`plantuml-ts` is a TypeScript port of upstream PlantUML (`~/git/plantuml`,
Java). This task is part of the `s1l-tail-fix` mission, batch 1 — see
`../README.md` for mission-wide gates/stop-conditions and `../decisions.md`
for the nine binding ADRs. Description-diagram size conformance sits at
321/351; this task closes **+4** (325/351 before F1-a's own +5 stack on top
— running total after all of batch 1 is 330/351).

Three mechanisms, one file cluster (`parser.ts`, `parse-helpers.ts`,
`parse-state.ts`), because upstream's `CommandCreateElementMultilines` and
`processLine` are the shared bottleneck all three route through:

- **G1** — `CommandCreateElementMultilines` **TYPE0** (the open-quote form,
  `keyword code as "text` with the closing quote on a later line) has no
  port at all — only **TYPE1** (`[ … ]`) exists. A TYPE0 opener falls
  through to the single-line keyword rule, which swallows the unterminated
  remainder as both id and display, and the continuation lines are silently
  dropped.
- **G8** — `processLine` (`parser.ts:243`) trims every source line before
  dispatch, so a `[ … ]` element body loses its relative indentation before
  it ever reaches the creole tree builder — every `|_` nesting level
  collapses to 1.
- **G9-E1** — `keyword code <<stereo>> [` (a multi-line element open form
  carrying a stereotype) parses the stereotype into a non-capturing regex
  group and drops it — `node.stereotype` is never set.

## Task

### G1 — TYPE0 opener (3 fixtures)

Port `CommandCreateElementMultilines`'s TYPE0 phase: an opener ending in an
unterminated quote (`keyword code [stereo] [url] [color] as "text`),
continuation lines accumulated with **no line cap**, closed by a line
**ending** in a quote character (`"`, `“`, `”`, or the invisible-quote
variant — `regex/Pattern2.java:59`).

**Upstream contract** (`~/git/plantuml/.../descdiagram/command/
CommandCreateElementMultilines.java`), verbatim, this is the grammar to
port:

- **Opener** (`:96-108`): `^(ALL_TYPES)\s+CODE([%pLN_.]+) STEREO? URL? \s*
  COLOR? \s* "as" \s* [%g] DESC([^%g]*) $` — note `COLOR` sits **before**
  `as`, which the single-line `CommandCreateElementFull` grammar does
  **not** allow (jar-verified: `usecase UC5 #red as "…"` on one line is a
  syntax error). A TYPE0 fix must read color from this pre-`as` position,
  not reuse the single-line grammar's post-`as` color slot.
- **Continuation** (`CommandMultilines2.java:102-107`,
  `PSystemCommandFactory.java:268-286`): while the block has one line, or
  its last line fails the end pattern, keep appending lines. **There is no
  line cap** for this command (the `nb` cap that exists elsewhere applies
  only to `CommandDecoratorMultine`, a different command). If EOF is
  reached first, the whole command is abandoned (no node created).
- **Terminator** (`:80-81, :90`): `END0 = ^(.*)[%g]$`, applied to the
  `Trim.BOTH`-trimmed last line — the block closes on the first line that
  **ends with a quote character**.
- **Display assembly** (`:169, :191-199`): `lines.trimSmart(1)
  .expandsNewline(false)`, then the first line's `DESC` tail and the last
  line's pre-quote prefix are prepended/appended, each only when non-empty.
  **`expandsNewline(false)` is load-bearing** (jar-verified): a literal
  `\n` inside a TYPE0 body is **not** a line break. Your fix must join raw
  body lines directly — **do not** reuse `pushElementBody`'s
  `finalizeDisplay` (`parser.ts:73`), which resolves `\n` escapes and would
  silently merge lines that upstream keeps separate.

**Fixtures and their exact failure today** (verified against current
parsed output):

| Fixture | Delta | Parsed today (broken) | Jar-correct 5-node dims |
|---|---|---|---|
| `pecupa-75-zote612` | 0.619648 | `{id: 'UC5 #red as "My usecase5', display: same}` | UC5 = 1.8187 × 0.814014in (3-line display) |
| `tajadu-40-juro990` | 0.358507 | `{id: 'foo2 as "This artifact', display: same}` | foo2 = 1.661111 × 1.013889in (3 text + 1 creole HR) |
| `nixura-77-bina738` | 1.273091 (reported; **true 1.5403**, see METRIC-AUDIT.md) | all 3 TYPE0 declarations (UC1/UC3/DB2) truncate to the same first-line box | 5 nodes, all exact once the display is correct — see the finding for the full per-node table |

`nixura-77-bina738` was originally mis-bucketed under `creole-titled-
separator` — its separators (`..`, `--foo--`, `__foo2__`, `==`, `..with
text..`) already measure correctly; 100% of its delta is this same TYPE0
gap. It closes with the same fix as the other two — **one fix, three
fixtures.**

### G8 — body-line trim (1 fixture: `vixeni-34-nici683`)

`processLine` trims every line (`const line = lines[i]!.trim();`,
`parser.ts:243`) before any dispatch runs, so a `[ … ]` element body's
relative indentation is gone by the time it reaches the creole tree
builder (`AtomTree`/`Skeleton2`, `SIZE_X=8`, `margin=2`, level-L cell starts
at `8L + 8 + 2`). Upstream preserves relative indentation and strips only
the block's common base indent. Jar-verified: a body at nesting levels
1/2/3/4 costs the jar exactly `+8px` per level; this port returns the
level-1 width for **all four** levels — the level computation never runs
past 1, though `AtomTree`/`Skeleton2` themselves are faithfully ported and
correct once they receive a real level number.

Fix: stop trimming before body-line accumulation into
`state.elementBlockBody` (`parse-state.ts`'s pending-block record,
currently populated via `pushElementBody`, `parser.ts:70-75`); trim only
for command *dispatch* (matching against `COMMANDS`), never for body
content. Add a common-base-indent strip (compute the minimum leading
whitespace across the accumulated body lines, strip that much from each) to
match upstream's actual behavior — a body is relative to its own least-
indented line, not absolute.

### G9-E1 — multiline-open stereotype capture (1 fixture, PARTIAL: `fariba-82-xolu802`)

`ELEMENT_MULTILINE_OPEN_RE` (`parse-helpers.ts:326-337`) already captures a
stereotype run at `:334` (`(?:\s*(?:<<[^>]+>>|\[\[[^\]]*\]\]|#[\w:;.#\\/|-]+))*`)
but as a **non-capturing** group — the text matches and is consumed (so the
regex doesn't fail), but nothing extracts it. `tryElementBlock`
(`parser.ts:99-123`) then builds the node from keyword + code only
(`makeNode(code, code, symbol)`, `:111`) — `node.stereotype` is never set,
so the `«policy»` stereotype row is never measured.

Fix: change the stereotype alternative in `ELEMENT_MULTILINE_OPEN_RE` to a
**capturing** group, and have `tryElementBlock` read it and set
`node.stereotype` on the created node (mirror how the single-line path sets
stereotype via `parseNameSection`/`extractNodeStereotype`).

**This fixture does NOT close in this task.** `fariba-82`'s reported delta
(0.388889in) is E1 (14px) **+** E2 (14px, tab-stop advance — `\t` measured
as zero-width instead of advancing to a tab stop; no `AtomText.ts` exists
in `src/` at all). E2 is scheduled for **F4-c**, itself gated on an
unresolved diagnosis sub-task for a third, independent residual on node
`sh0006` (SYNTHESIS §4 — the awslib `User` sprite/label stack, +2px height,
undiagnosed). Land E1 here, verify it in isolation (the fixture's delta
should shrink from 0.388889in toward the E2+residual remainder — do not
expect `conformant: true`), and report it explicitly as **partial** in your
completion summary. Do not report `fariba-82` in your closed-pins list.

## Write-set

- `src/diagrams/description/parser.ts` — `tryElementBlock` (`:99-123`,
  needs a TYPE0 variant alongside the existing TYPE1-only logic; also gains
  `node.stereotype` assignment for G9-E1), `processLine` (`:242-256`, the
  `.trim()` at `:243` must not destroy body-line indentation).
- `src/diagrams/description/parse-helpers.ts` — a new TYPE0 opener regex
  beside `ELEMENT_MULTILINE_OPEN_RE` (`:326-337`); `ELEMENT_MULTILINE_OPEN_RE`
  itself gains a capturing stereotype group for G9-E1.
- `src/diagrams/description/parse-state.ts` — the pending-block record
  (`ParseState.inElementBlock`/`elementBlockNode`/`elementBlockBody`,
  `:40-45`) needs a terminator discriminant so the parser loop can tell a
  TYPE0 (quote-terminated) block from a TYPE1 (`]`-terminated) block while
  accumulating. **Mirror `PendingNoteState`'s existing shape**
  (`:107-116`, a discriminated union keyed by `kind`, carrying its own
  `terminator: NoteTerminator` field) rather than inventing a new pattern —
  same file, same author intent, already-established precedent for exactly
  this kind of state.

## Read-set

- `src/diagrams/description/parser.ts:63-123, 224-256` — `pushElementBody`,
  `finishElementBlock`, `tryElementBlock` (current TYPE1-only logic),
  `processLine` (the dispatch order and the `.trim()` site).
- `src/diagrams/description/parse-helpers.ts:300-337` — `KEYWORD_RE`,
  `ELEMENT_MULTILINE_OPEN_RE` and its stereotype/url/color alternation.
- `src/diagrams/description/parse-state.ts:31-104, 106-116` — the full
  `ParseState` interface (note especially `inElementBlock`/
  `elementBlockNode`/`elementBlockBody` at `:40-45`) and `PendingNoteState`
  (`:106-116`) as your structural precedent.
- `../s1l-tail-diagnosis/findings/multiline-display.md` — full TYPE0
  upstream contract, the `expandsNewline(false)` jar verification, and the
  method note on why the `\n`-escaped probe used for measurement is NOT a
  substitute for the real TYPE0 join semantics.
- `../s1l-tail-diagnosis/findings/creole-titled-separator.md` — the
  `nixura-77-bina738` cross-bucket link and its full per-node table.
- `../s1l-tail-diagnosis/findings/container-cluster.md` (`vixeni-34-nici683`
  and `fariba-82-xolu802` records) — the level-8px-per-nest arithmetic and
  the E1/E2 split with its jar isolation probes.
- `../s1l-tail-diagnosis/METRIC-AUDIT.md` — `nixura-77-bina738`'s corrected
  target (true 1.5403, not the pinned 1.2731) and `vixeni-34-nici683`'s
  (true 0.2222, not 0.2033). **Use these as your fix targets.**
- `planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md` —
  mandatory per CLAUDE.md for any sizing bug (this task's delta is
  parse-side, but the mandate is unconditional).

## Architecture decisions that bind this task

- **ADR-1** — do not write `size-backlog.json`. Report closed pins to the
  orchestrator.
- No ADR directly names this task's mechanisms, but **ADR-6** (F2-a owns
  `extractNodeStereotype` for G3-M1 and G7) is adjacent — that is a
  **different** stereotype extraction function
  (`parse-helpers-strings.ts:268`, single-line path) from the one you are
  touching here (`ELEMENT_MULTILINE_OPEN_RE`'s inline capture, multi-line
  open form). Do not merge them or touch `parse-helpers-strings.ts` — it is
  F2-a/F2-b's write-set, not yours.

## Interface contracts

**F2-a (batch 2, G6) depends on this task's changes to `parse-state.ts`.**
Per SYNTHESIS §8 ("Why these serialize"): *"F1-b before F2-a — both write
`parse-state.ts`. F2-a's `stillUnknown` requirement must be handed to F1-b
as an interface contract, or F2-a waits."*

Concretely: `parse-state.ts` already exports `resolveStillUnknown`
(`:200-222`) and `DescriptiveNode.stillUnknown` /
`EndpointShape.stillUnknown` (consumed at `ensureEndpoint`, `:155-167`).
F2-a's G6 fix needs to add a **new** call site that emits `stillUnknown:
true` (in a bare-CODE, no-SYMBOL creation path currently hardcoding the
`'actor'` symbol) rather than modifying the existing mechanism. Your
obligation:

- Do not remove, rename, or change the signature of `resolveStillUnknown`,
  `ParseState.nodesById`/`qualifiedNodesById`, or any other existing
  exported symbol F2-a's fix will need to call.
- Your new TYPE0 pending-block discriminant must be **additive** — a new
  field or a new variant, never a repurposing of `inElementBlock`/
  `elementBlockNode`/`elementBlockBody` that would force F2-a's code to
  understand your TYPE0 state machine to do its own unrelated work.
- In your completion summary, list every new or changed export from
  `parse-state.ts` so F2-a's task does not have to re-read the whole file
  to find them.

## Acceptance criteria

1. **Given** `pecupa-75-zote612`'s `usecase UC5 #red as "My usecase5\nis on
   several lines\nand finished"`, **when** parsed, **then** UC5's display is
   the three joined lines (not one truncated line) and the node measures
   1.8187 × 0.814014in, matching the jar exactly.
2. **Given** `tajadu-40-juro990`'s `artifact foo2 as "This artifact\nis
   defined\n----\non several lines"`, **when** parsed, **then** the `----`
   line survives as a real creole HR (not swallowed into a single text
   line) and foo2 measures 1.661111 × 1.013889in.
3. **Given** `nixura-77-bina738`'s three TYPE0 declarations (`UC1`, `UC3`,
   `DB2`), **when** parsed, **then** all five nodes measure exact against
   the jar oracle — cross-check against METRIC-AUDIT.md's corrected 1.5403
   target, not the stale 1.2731 pin.
4. **Given** `vixeni-34-nici683`'s `component B [AAAA\n|_ A\n  |_ A\n    |_
   A]`, **when** parsed, **then** the body's relative indentation survives
   into the creole tree (level 3 for the deepest `|_`, not level 1) and
   node B measures 1.709549 × 2.222222in — cross-check against
   METRIC-AUDIT.md's corrected 0.2222 target.
5. **Given** `fariba-82-xolu802`'s `file policy <<policy>> [ … ]`, **when**
   parsed after this task's E1 fix, **then** `node.stereotype` is set to
   `['policy']` and the `«policy»` row is measured (14px), but the fixture
   as a whole is **not** reported conformant (E2 + the `sh0006` residual
   remain) — state this explicitly rather than letting a shrinking delta
   imply closure.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts
npx tsx scripts/audit-size-metric-identity.ts
```

Never pipe a gate — capture `$?` directly. Expect 4 fixtures to move to
conformant (`pecupa-75-zote612`, `tajadu-40-juro990`, `nixura-77-bina738`,
`vixeni-34-nici683`); `fariba-82-xolu802`'s delta should shrink but stay
non-conformant. **`widened > 0` on any ratchet is a STOP condition.** G8's
finding flags its blast radius as disproportionate to its line count — the
trim change is upstream of *every* command in the description parser, so
run the full 351-fixture description sweep, not a targeted subset, and
watch note-body fixtures specifically (notes accumulate through the same
trimmed `line` variable).

## Observability

N/A — parser/dispatch changes with no logging, metrics, or externally
observable operations. No new observability surface is introduced.

## Rollback

Reversible. Parser/grammar changes only; no persisted state, no schema, no
data migration. A revert of this task's commit fully restores prior
behavior.

## Boundaries

**Always do:**
- Verify G1, G8, and G9-E1 as three independently-confirmed mechanisms —
  they share a file cluster, not a cause.
- Read `planning/usymbol-composition.md` and
  `planning/sizer-renderer-parity.md` before starting.
- Use Serena MCP tools for navigation, not the LSP tool.
- Document every new/changed `parse-state.ts` export in your completion
  summary (the F2-a interface contract above).
- Report closed pins to the ORCHESTRATOR. Never edit `size-backlog.json`
  yourself (ADR-1).
- If a discrepancy appears between the arithmetic in the findings files and
  what you measure, enter diagnosis mode per `~/.claude/rules/diagnosis.md`
  (read it first — not auto-loaded).
- Follow TDD per `~/.claude/rules/testing.md` (not auto-loaded) — pin each
  of the three mechanisms with a parser-level unit test before touching
  `measureLeafNode`-adjacent code.

**Ask first:**
- If the TYPE0 opener regex risks over-matching an already-closed
  single-line `as "…"` form (the multiline-display finding's regression set
  names 11 such goldens to check).
- If G8's indent-preservation change appears to require touching any note
  accumulation path beyond `parse-state.ts`'s existing note fields.

**Never do:**
- Write `oracle/goldens/description/size-backlog.json`.
- Run any state-mutating git command.
- Declare a divergence.
- Regenerate any existing golden.
- Report `fariba-82-xolu802` as closed.
- Reuse `pushElementBody`'s `finalizeDisplay` for a TYPE0 body (it expands
  `\n`, which upstream's `expandsNewline(false)` forbids for this command).
- Touch `parse-helpers-strings.ts` (F2-a/F2-b's write-set).

## Commit

`fix(F1-b): port TYPE0 opener, body indent, stereotype capture`

Body (required — touches 3 files, non-obvious design decision on the TYPE0
join semantics): explain why `finalizeDisplay` cannot be reused for TYPE0
bodies, name the four fixtures affected (3 closed + 1 partial), and note
the `parse-state.ts` interface contract handed to F2-a.
