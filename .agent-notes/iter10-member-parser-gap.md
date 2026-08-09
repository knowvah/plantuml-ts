## Observation: class member parser drops Java-style `Type name` fields —
  and dibinu-95-kavo178's residual root-order-edge gap is unrelated to notes

- **Context**: iteration 10 (class-dot-sync, Group 4 — note-on-entity
  target/anchor family). Verifying kugasi-68-josu446, cejili-77-gepe377
  against the oracle svek DOT while diagnosing note-merge/anchor
  mechanisms.
- **Finding 1 (member parser)**: `src/diagrams/class/class-member-parser.ts`'s
  attribute-form regex (`/^(\w+)(?:\s*:\s*(\S+))?$/`) only recognizes
  `name` or `name: Type` — it does NOT recognize Java-style `Type name`
  (space-separated, no colon), e.g. `int counter` or `int i`. Confirmed
  empirically (parseClass on `class A { int counter }` yields
  `members: []`) and against the real oracle jar (same input renders a
  0-member class body). kugasi-68-josu446's `{static} int counter` and
  cejili-77-gepe377's `int i` both hit this — the class body ends up
  empty. This does NOT block class-dot-sync structural EQUAL (member
  count only affects node HEIGHT, not the node/edge/degree/minlen/shape
  counts the oracle comparator gates on), so it was left unfixed —
  member-line grammar is out of Group 4's declared scope (note-anchor
  family only).
- **Finding 2 (root-order edges)**: dibinu-95-kavo178 stays
  structurally non-EQUAL after the Group 4 note fixes (node/edge
  mismatch: oracle 9/7, candidate 10/8). Root cause is UNRELATED to
  notes — the note-anchor edges (`sh0010->sh0008`, `sh0008->sh0011` in
  our candidate) already match the oracle's plain-classifier-note
  pattern (`sh0013->sh0012`, `sh0012->sh0014`) exactly, non-invis, both
  sides. The extra node/edge comes from our own invis-order-edge chain
  for otherwise-unconnected root classifiers (`sh0002->sh0003->sh0004`,
  `sh0002->sh0005->sh0006`, 4 edges) vs the oracle's sparser 2-edge
  ordering (`sh0006->sh0007`, `sh0008->sh0010` — apparently one edge
  per GAP between connected components in declaration order, not a full
  chain over every isolated root). Needs its own investigation into
  the existing "isolated root ordering edges" mechanism
  (class-dot-graph.ts / class-magma.ts) — not attempted here, out of
  Group 4 scope.
- **Impact**: Both are legitimate, separate follow-up items. Neither
  blocks the note-anchor-family fixes verified in iteration 10.
- **Confidence**: High (both verified against the real oracle jar with
  isolated test cases, not just inference from source).

## Resolution (G2 N12, 2026-07-16)

Finding 1 (member parser drops `Type name`/trailing-punctuation lines) is
FIXED: `class-member-parser.ts#parseMemberLine` gained a raw-display
fallback (mirrors `class-object-commands.ts#parseObjectField`'s
pre-existing identical fallback for object leaves) — a line that matches
neither the structured method nor attribute shape now becomes a
`Member.rawDisplay` row instead of `null`/dropped, matching upstream's real
`BodierLikeClassOrObject#addFieldOrMethod`/`Member` constructor (never
rejects a line). `class-layout-helpers.ts#formatMemberText`/`isMethodMember`
widened to consult `rawDisplay` (text verbatim; method-vs-field bucketing by
substring `(`/`)` presence, matching `BodierLikeClassOrObject#isMethod`
exactly). Also required stripping a trailing `[[url]]`/`[[[url]]]` suffix
BEFORE structured matching (upstream's `Member` constructor does this
unconditionally too) — without it, a URL-suffixed method line
(`gizini-87-vuve916`) fell to the new raw fallback with the bracket syntax
embedded literally, causing a real DOT node-size regression caught by
`tests/oracle/object-dot-parity.test.ts`.

Finding 2 (dibinu-95-kavo178 root-order-edge gap) is UNCHANGED — still open,
unrelated to this fix.
