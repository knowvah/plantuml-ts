# Diagnosis — `#highlight` paths through duplicated keys (T1d, D6)

**Verdict: PORT-CONTROLLED** — `buildHighlightMap` resolves an exact path
segment through a `Map` keyed by `parentId/key`, so of N sibling members that
share a key only the LAST one in source order is reachable; the jar follows the
path into every one of them. Fix lives in `src/diagrams/json/json-layout-prep.ts`
only.

## Symptom (reproduced 2026-10-28, oracle jar via `scripts/oracle-render.sh`)

Each row: the highlight rects drawn (`rx="2"` rects), as `y:key=value`.

| construct | `#highlight` | jar | ours | `--structural` diffs |
|---|---|---|---|---|
| `{"a":{"b":1},"a":{"b":2}}` (spec case, dup at root) | `"a" / "b"` | b=1 AND b=2 | b=2 only | 11 (childCount 27→26 + the cascade) |
| `{"a":{"b":1},"a":{"c":2}}` (target only under 1st dup) | `"a" / "b"` | b=1 | none | 11 (26→25) |
| `{"a":{"b":1},"a":{"c":2}}` (target only under 2nd dup) | `"a" / "c"` | c=2 | c=2 | 0 |
| `{"x":{"a":{"b":1},"a":{"b":2}},"y":3}` (dup nested) | `"x" / "a" / "b"` | b=1, b=2 | b=2 | 11 (39→38) |
| `{"a":[1,2],"a":[3,4]}` (array under dup) | `"a" / "0"` | 1, 3 | 3 | 11 (27→26) |
| `{"a":{"b":{"c":1}},"a":{"b":{"c":2}}}` (dup above 2 levels) | `"a" / "b" / "c"` | c=1, c=2 | c=2 | 10 (43→42) |
| `{"a":1,"a":2}` (dup is the highlighted leaf) | `"a"` | a=1, a=2 | a=1, a=2 | 0 |
| `{"a":{"b":1},"a":{"b":2}}` | `"*" / "b"` | b=1, b=2 | b=1, b=2 | 0 |
| `{"a":{"b":1},"a":{"b":2}}` | `"**" / "b"` | b=1, b=2 | b=1, b=2 | 0 |
| yaml `a:\n  b: 1\na:\n  b: 2` | `"a" / "b"` | b=2 (one `a`) | b=2 (one `a`) | 0 |
| yaml `a:\n  b: 1\na:\n  c: 2` | `"a" / "b"` | none (one `a`, holds c) | none | 0 |
| hcl `x { a = { b = "1" } a = { b = "2" } }` | `"a" / "b"` | none | none | 0 |

Every non-zero row is ONE missing highlight `<rect>` per unreached duplicate;
the remaining diffs are the element-index cascade behind it (`rect[k]` now
compares against the jar's `rect[k+1]`). Not geometry: an element count, so
D1's Smetana carve-out does not apply.

## Reproduction

```
S=<scratch>; mkdir -p $S/out
printf '%s\n' '@startjson' '#highlight "a" / "b"' \
  '{"a": {"b": 1}, "a": {"b": 2}}' '@endjson' > $S/hdk-root.puml
bash scripts/oracle-render.sh $S/out $S/hdk-root.puml
mkdir -p tests/fixtures/json && cp $S/hdk-root.puml $S/out/hdk-root.svg tests/fixtures/json/
npx tsx plans/data-diagram-conformance/tools/diff-one.mts json hdk-root --structural
#  -> svg/g[1][childCount] ours=26 jar=27 ... diffs: 11 (structural)
```

(The fixture copies are NOT committed — T1e owns `tests/fixtures/json/`.)

## Mechanism and origin

- **Mechanism:** `buildHighlightMap` indexes children by
  `childLookup.set(\`${fn.parentId}/${fn.parentKey}\`, fn.id)` — a one-to-one
  `Map`, so sibling members with the same key overwrite each other and the
  exact-segment branch `childLookup.get(\`${nodeId}/${seg}\`)` follows the path
  into exactly one of them (the last in source order).
- **Origin:** `src/diagrams/json/json-layout-prep.ts:126-131` (the collapsing
  index), consumed at `:187-191` (single-child exact navigation).

Instrumented (scratch script calling the real `walkTree`/`buildHighlightMap`
on `{"a":{"b":1},"a":{"b":2}}`, path `["a","b"]`):

```
flat n0 parent null key null members [["a",{b:1}],["a",{b:2}]]
flat n2 parent n0 key a members [["b",1]]     <- 1st "a" (DFS order)
flat n1 parent n0 key a members [["b",2]]     <- 2nd "a"
childLookup key n0/a writers in order [n2, n1] -> Map keeps n1
highlightMap [["n1",[["b",""]]]]               <- n2 never gets "b"
```

`walkTree` (`json-layout-prep.ts:73-100`) emits siblings in source order
(reverse push at `:86`, LIFO pop at `:80`), and the index loop at `:127-131`
walks `flatNodes` in that order, so the later duplicate wins.

## Causal chain from the jar

1. `json/Json.java:377-378` — `DefaultHandler#endObjectValue` calls
   `object.add(name, value)` for every parsed member
   (`json/JsonParser.java:243`).
2. `json/JsonObject.java:337-348` — `add` appends to `names`/`values` without
   a lookup ("does not prevent duplicate names", javadoc `:320-336`);
   `iterator()` (`:764-`) yields every member, duplicates included.
3. `jsondiagram/TextBlockJson.java:197-216` (`children()`) and `:218-234`
   (`keys()`) iterate those members, so both `a` members are children with key
   `"a"`.
4. `jsondiagram/SmetanaForJson.java:136-142` — `manageOneNode` recurses into
   EACH child `i` with `upOneLevel(keys.get(i), highlighted)` (`:139`).
5. `SmetanaForJson.java:148-156` → `yaml/Highlighted.java:86-96`: for path
   `["a","b"]` and key `"a"`, `first.equals(key)` (`:92`) returns `["b"]`.
   The test is per member, by key equality — both `a` children receive `["b"]`.
6. `jsondiagram/TextBlockJson.java:122` + `:155-161` (`isHighlighted`) +
   `yaml/Highlighted.java:98-102` (`isKeyHighlight`: size 1, equals key) mark
   row `b` in each child; `TextBlockJson.java:294-302` draws the rect for each.

Ours: steps 1-3 are faithful (`parser.ts:101-104` `result.add` per property;
`JsonObject.ts:27-31` appends; `json-layout-prep.ts:62-67`
`containerEntries` → `members()` `JsonObject.ts:39-41`; `walkTree` emits both
children). Step 4-5 is where we depart: instead of propagating the remaining
path to every child whose key matches, `buildHighlightMap`
(`json-layout-prep.ts:121-200`) resolves the segment to ONE node id
(`:189`). Step 6 is faithful (`TextBlockJson.ts:415`
`highlightKeys.get(cell.key)` per row; `json-renderer-highlight.ts:56-87`
draws per highlighted row).

## Ruled out (with evidence)

- **`JsonObject` storage collapsing duplicates** — `JsonObject.ts:27-31`
  pushes unconditionally; the trace shows n0 holding both `["a",…]` members.
- **Parser dropping duplicates** — `parser.ts:101-104` adds per property;
  both `a` rows are drawn in every reproduction (texts `a|   |a|   |b|1|b|2`).
- **`walkTree` dropping a child** — trace shows n2 and n1 both with
  `parentKey a`; both child boxes are drawn in ours.
- **Row-level highlight test** (`TextBlockJson.ts:415`) — duplicate key as
  the highlighted leaf (`{"a":1,"a":2}` + `"a"`): both rows lit, 0 diffs,
  matching `TextBlockJson.java:122`/`:155-161`.
- **Renderer** (`json-renderer-highlight.ts`) — the one rect we do draw is
  jar-identical; the only diffs are the missing element and its index
  cascade. Highlight of the 2nd duplicate's own child: 0 diffs.
- **Wildcard navigation** — `"*" / "b"` and `"**" / "b"` reach both
  duplicates via `childrenOf` (a list, `:134-144`): 0 diffs each. Only the
  exact-segment branch (`:187-191`) collapses.
- **yaml** — not affected: duplicates never reach `JsonObject`. See below.
- **hcl** — not affected: `HclDiagramFactory.java:64` creates `highlighted`
  and never adds to it (passes the empty list at `:84`), so hcl never
  highlights; ours draws none either. 0 diffs with nested duplicate keys
  (which `HclParser.java:123-148` does keep via `result.add`).
- **Smetana geometry** — the divergence is an element count (childCount −1
  per unreached duplicate), not a positional attribute.

## Yaml: does `MonomorphToJson` preserve duplicates?

No — and neither did it ever reach the bug. A repeated yaml key is collapsed
BEFORE conversion: `yaml/parser/YamlBuilder.java:125-126,133-135`
call `putInMap`, and `yaml/parser/Monomorph.java:103-111` stores into a
`LinkedHashMap` (`:110` `map.put` — last value, first position).
`MonomorphToJson.java:69-85` then `add`s one member per distinct key.
Ours mirrors it: `src/diagrams/yaml/monomorph.ts:58-66` (`Map.set`).
Jar and ours agree on both yaml twins (0 structural diffs).

## Proposed T2b write-set

`src/diagrams/json/json-layout-prep.ts` only:

- `:125-131` — index children as `parentId/key → childId[]` (all siblings
  sharing the key, in `flatNodes` order) instead of a one-to-one `Map`.
- `:187-191` — the exact-segment branch navigates EVERY id in that list, the
  per-member `first.equals(key)` of `Highlighted.java:92` as reached from
  `SmetanaForJson.java:136-142`.

`JsonObject.ts` and `json-renderer-highlight.ts` need no change (ruled out
above). Tests: `tests/unit/json/highlight-dup-keys.test.ts` with the table's
jar rows as expected values.

## Adjacent divergences found (separate mechanisms, NOT this item)

Same function, different branches; reproduced against the jar, reported for
the orchestrator to route — not part of the proposed T2b write-set:

1. **`"**"` followed by 2+ segments** — `{"a":{"b":1},"c":{"a":{"b":2}}}` +
   `#highlight "**" / "a" / "b"`: jar highlights NOTHING, ours highlights
   b=1 and b=2. Jar: `Highlighted.java:90-91` returns the path UNCHANGED for
   `**` (never strips it), and `isKeyHighlight` (`:98-102`) only matches
   `** / key` (size 2) or a size-1 path — so `** / a / b` can never match.
   Ours: `json-layout-prep.ts:177-181` strips `**` and navigates the rest
   from every descendant.
2. **Two directives on the same key** — `#highlight "a" <<h1>>` then
   `#highlight "a" <<h2>>`: jar uses the FIRST (`TextBlockJson.java:155-161`
   returns the first `isKeyHighlight` match; rect `#F00`), ours the LAST
   (`json-layout-prep.ts:172` `map.set` overwrites; rect `#00F`).

All three findings share one structural cause: `buildHighlightMap` is a
node-id navigation re-implementation, not a port of the per-member list
propagation `SmetanaForJson.upOneLevel` → `Highlighted.upOneLevel` /
`isKeyHighlight` → `TextBlockJson.isHighlighted`. Mirroring that propagation
in `json-layout-prep.ts` (a `Highlighted` list handed to each child by key)
would close all three in the same file; whether T2b takes the minimal edit or
the re-mirror is the orchestrator's call.
