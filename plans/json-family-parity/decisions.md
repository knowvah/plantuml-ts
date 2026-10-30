# Decisions — json-family-parity (jfp)

User-approved 2026-10-29 (plan-mission Phases 2-6). Amendments are appended
dated, below the originals; never edit an original in place.

## Scope (user, 2026-10-29)
- **Bar = port-controlled parity.** Diagnose every positional residue to its
  mechanism; fix everything the port controls (node origin, rounding, margins,
  spline input); pin rows that become byte-identical. A delta that is genuinely
  Smetana's arithmetic is named and measured under ADR-2b, never chased
  (CLAUDE.md "One layout engine", ruling 2026-08-09).
- **Family = json + yaml + hcl**, measured and pinned together (all go through
  `JsonDiagram` / `SmetanaForJson`; ours through `layoutJson`).

## The two known structural divergences (read before D1)
Jar (`SmetanaForJson.java`):
- size = engine post-layout `data.width*72`, `data.height*72` (`:203-206`, `getPosition`);
- diagram x = `xMirror.inv(coord.y + h/2)` and y = `coord.x - w/2`, then
  `.sym()` (`:207-209`); `xMirror = new Mirror(max)` with
  `max = max over nodes of InternalNode#getMaxX() = coord.y + h/2`
  (`:97-102`, `:160-164`) — **edges excluded, no min-shift**;
- edges go through the same `xMirror` (`JsonCurve`, `:212-215`).
Ours:
- **M1 size echo** — `src/core/graph-layout.ts:109-128` (`ROUND_TRIP_EPSILON`,
  `mapNodes`) returns our DECLARED size whenever the engine's is within 1e-3;
- **M2 origin** — the `read: 'exact'` path reads `getLayout({ yAxis: 'down' })`
  (y flipped against the graph bounds, not against the max node extent), then
  `shiftToOrigin` (`graph-layout.ts:273-304`) subtracts the min over nodes AND
  edge points; `json/layout.ts:168-206` only transposes and documents why no
  `Mirror` is applied on that frame. Trap recorded there: applying `inv` on the
  already-flipped frame reverses the diagram (bavize-88-jumu158, root at 76.83
  instead of 10).
json is the ONLY caller of `read: 'exact'` (grep `src/`, 2026-10-29).

## D1 — json reads the engine's raw node data through an additive core field
Under `read: 'exact'` only, `layoutGraph` also returns
`engineNodes: ReadonlyArray<{ id; cx; cy; width; height }>` — graphviz's native
frame (`ND_coord`, y-up, before any shift), size = engine size in points
(`ND_width*72`). Every existing field is unchanged, so every other engine is
byte-identical (all-engine chain + d.ts guard). json then ports `getPosition`
and `Mirror` literally.
*(Extended at brief generation 2026-10-29, within D1's approved scope:)* the
same field also carries `engineEdges: ReadonlyArray<{ id; points; epX?; epY? }>`
in the same native frame. The jar passes edges through the SAME `xMirror`
(`SmetanaForJson.java:212-215`, `JsonCurve`); with nodes alone, json's edges
would stay on the min-shifted frame (`json/layout.ts:413-421` reads
`points`/`epX`/`epY`) and detach from their nodes. Rejected: json calling dot-engine directly (duplicates
the builder: record labels, ports, attrs); reconstructing from the current
result (the echo discards the engine size).

## D2 — diagnosis first, then the two known ports, then the ledger's rest
B1 = diagnosis-only ledger over every non-conformant row (json 36, yaml 32,
hcl 2), each row assigned a mechanism with `file:line` + measurement; an
UNCOMMITTED M1+M2 probe predicts which rows those two close. B2 = D1. B3 = the
M1+M2 port. B4 = one task per remaining port-controlled mechanism, written by
the orchestrator at the B1 close as a dated amendment here (may be empty).

## D3 — the proof standard for "Smetana arithmetic"
A row is labelled Smetana only with BOTH, shown in its ledger row:
1. **our engine input is effectively the jar's**: the node sizes and record
   field sizes the engine solves with equal those Smetana solves with,
   recovered from the oracle's rects and pushed through `createNode` /
   `getDotLabelMap` / `getDotLabelArray` (`SmetanaForJson.java:233-260,265-295`;
   width/height swap at `:243-244`). The label TEXT legitimately differs:
   upstream compensates only graphviz's `YPAD` (`colAwidth - 8`) because
   Smetana applies no `XPAD`; we compensate both because dot-engine applies
   both (`graphviz/lib/common/macros.h:27-29`; DIVERGENCES "Smetana-backed
   diagram types", worked example A5/T7). Compare the resulting record geometry,
   not the label strings;
2. dot-engine's layout equals real `dot -Tdot` on our exact input.
*(Clarified at brief generation 2026-10-29, before execution: literal
"DOT == jar's DOT" cannot hold given the deliberate XPAD compensation.)*
Then the residue is Smetana's transpile vs graphviz C: one DIVERGENCES ADR-2b
row-level entry with the measured delta. dot-engine ≠ `dot` ⇒ a
`docs/graphviz-issues/` filing + TRACKER line, row class "dot-engine", never
"Smetana". Magnitude alone ("> 5px is layout") is never evidence.

## D4 — pinning and the positional guard
- Byte-identical rows join the golden ratchets (`oracle/goldens/svg-{json,yaml,hcl}/`).
- `json-family-structural.json` stays shrink-only; no new ceiling without the
  user's signature.
- NEW: a shrink-only per-row **positional ceiling**
  (`oracle/goldens/json-family-positional.json`, gate
  `tests/oracle/svg-conformance/json-family-positional.test.ts`): for every
  structurally-aligned non-conformant row, the max |Δ| of node coordinates, path
  coordinates and canvas dims. Seeded at the measured value, never above.

## D5 — both render modes move together
Fixes live in the shared layout; jar-compatible and extended mode move
together. Extension example pins move as a consequence, each mover journaled
with its mechanism (D6 extended-baseline tool, copied from jse). The public
`dist/plantuml-ts.d.ts` stays byte-identical to b0.

## Operational (Phase 4)
Reversible throughout (worktree `--no-ff` merges; `jfp/pre-squash` tag). No API
or schema change; SVG coordinates move; plantuml-ts has no consumers.

## Amendment 2026-10-29 (B1 close, orchestrator) — findings that contradict D2/D3; HALT (stop 3)

Evidence: `diagnosis/ledger.md` (70 rows) over the three agent ledgers.

**F1 — M1+M2 close no row (contradicts D2's premise).** Three independent
probes (T1a, T1b, T1c) of exactly D2's M1+M2 port left `residue.mts --all`
byte-identical on all 92 cached rows. On every json-family graph the root is
alone in rank 0, so graphviz's bb height equals the jar's `max` and the
min-shift is 0; the engine's rank-axis extent comes back as declared + 1 (the
`record_init` Kluge) so M1's echo never fires on it, and the drawn size is the
measured block anyway. B2 (D1's `engineNodes`/`engineEdges` in `src/core/`) +
B3 would therefore be a pure structural re-mirror with zero output change.
Stop 11 is vacuous (0 predicted rows).

**F2 — D3(1) is ambiguous on the dominant mechanism U-REC (all 70 rows).**
Smetana 2.38's `record_init` rounds the declared size (`shapes__c.java:1807-1808`,
`POINTS`) and applies no field PAD (`:1636-1644`); graphviz ≥ 8.0.4 does not
round (`shapes.c:3688-3689`, commit `aee7eda7d`). Our engine INPUT (width,
height, field sizes as written) is the jar's; the geometry SOLVED inside
`record_init` differs. D3(1) says "compare the resulting record geometry" —
read literally, U-REC is port-controlled (T1c's reading: the port can
pre-round declared sizes and shrink fields to reproduce it); read by intent
and CLAUDE.md "never chase a Smetana-specific number", it is Smetana (T1a/T1b).
Measured stakes of emulating it (T1c): yaml/hcl rank axis exact on 34 rows,
5 json canvas `dw` close; but 35 json rows move and several get worse
(civofu → unaligned, jidata 7.55→8.0, kidoki/nopoku dw 6→8).

**F3 — M4 (inch precision) has its origin in `src/core/`** (`inches()`,
`svek-dot-emit-clusters.ts:33`, shared with every svek caller) — stop 7 forbids
patching it; its effect on non-conformant rows is chaotic (kidoki 33→78).

**Port-controlled and json-local, no ruling needed:** M5 scale-after-layout
(nuzaje, timafu; `scale-geo.ts`, `JsonCurve.ts`, `renderer.ts`); the declared-size
half of M3 empty-container-size (12 json rows; `TextBlockJson.ts:467`,
`json/layout.ts:304`, `record-label.ts:58`) — its label half ((0,16) from Smetana's
`\N` "WE CHEAT" sizing, `labels__c.java:119-122`) is Smetana arithmetic.

**Questions for the user (the mission halts here):**
- Q1. U-REC: Smetana (one ADR-2b row-level entry naming the three graphviz
  version changes `aee7eda7d`/8.0.4, `b03040389`/7.0.0, `cfb1cc1a3`/7.0.0) or
  port-controlled (B4 emulates `record_init`'s POINTS rounding + no-PAD)?
- Q2. B2/B3: still land D1's core field + the literal `getPosition`/`Mirror`
  port as a zero-output structural re-mirror, or drop them?
- Q3. M4: leave it (core, stop 7), or authorise a core change (e.g. full-precision
  inches for `shape: 'record'`, whose only caller is json)?
- Q4. B4 as proposed: T4a M5 scale-after-layout; T4b M3 declared-size half
  (engine gets `calculateDimension`, MIN_WIDTH draw-only, no label when empty).
  Disjoint write-sets except `json/layout.ts` (T4a reads, T4b writes) ⇒ serial.
