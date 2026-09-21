# Architecture decisions — `class-divergence-drive`

Confirmed 2026-09-21. **Locked**; amend and halt on contradiction (stop 3).
Java paths are under `~/git/plantuml/src/main/java/net/`; the mechanism for
each bucket is quoted with `file:line` in [`diagnosis/`](diagnosis/).

## D1 — One programme brief, eleven batches, one exit bar

**Context.** ~60 mechanisms across 11 buckets exceed one mission, but they
share one baseline (`parity-class.json` 2026-09-21) and one score.
**Decision.** One brief, one batch per bucket, each batch closing with its own
re-pin, journal rows and a fresh survey count, so the tree is consistent at
every close and execution can pause between batches.
**Consequences.** One journal, one `fixtures.md`; the maintainer may stop
after any close task.

## D2 — Structure before paint

**Context.** `compare.ts` pairs elements positionally; a correct paint fix
inside a misordered document is invisible or reads as a rise (memory:
weightedScore can rise on a correct fix).
**Decision.** Batch order B11 → B1 (ordering/uid) → B2 (links, incl. the
edge-direction serialization fix) → B5 (notes) → B4 (clusters) → B3 (Kal,
groupInheritance, roles) → B6 → B7 → B8 → B9 → B10.
**Consequences.** Batches 1–3 unmask more than they pin; batches 6–8 pin
fixtures directly. Paint-first was rejected because it double-pins.

## D3 — The survey verdict is the score; the ratchet is the lock

**Context.** Survey (`renderSync`) and census (`renderFixtureClass`) differ
by two fixtures today (412 vs 414) — a render-path difference, never a
measurer difference (`docs/parity-report.md` preamble).
**Decision.** Exit bar = `parity-class.json` `diverged` = 0 minus declared;
`structural-match` remainders named per mechanism. Pin into `ratchet.json`
only a fixture that is survey-conformant AND census 0-diff.
**Consequences.** A fixture credited by one path only is journaled, not
pinned.

## D4 — `scale` and `dpi` pre-scale class geometry; the shared `svgRoot` is untouched

**Context.** Upstream scales at serialization: `core/TextBlockExporter.java:
205-209` (`fromScale * dpi/96.0`), `klimt/drawing/svg/SvgGraphics.java:
466-472` (`format(double)` on every emitted number). `src/core/scale-
command.ts` already resolves the factor; `src/core/svg.ts#svgRoot` serves ten
engines; sequence pre-scales via `src/diagrams/sequence/scale-geo.ts`.
**Decision.** Class captures `scale` into its AST (`class-command-
directives.ts:41-47` currently discards it) and multiplies its resolved
geometry, font sizes and stroke widths before `renderClass` (T29). A single
new core reader for `skinparam dpi` feeds `resolveScaleFactor` for every
engine (T30).
**Consequences.** Zero cross-engine blast radius from T29; T30 is gated by
every engine's suite.

## D5 — Chrome creole is fixed at the shared seam, for every diagram type

**Context.** `src/core/annotations/blocks.ts#buildAnnotationBlock:394-421`
draws title/legend/header/footer/caption from raw strings; upstream runs the
full creole `Sheet` there (`activitydiagram3/ftile/EntityImageLegend.java:
47-56`, `core/DiagramChromeFactory.java:340-413`).
**Decision.** Route chrome lines through the existing stripe/creole pipeline
in core (T28); the gate is the full suite with zero unjournaled movers in any
engine. A class-only wrapper was rejected as unfaithful.
**Consequences.** Other engines' chrome may move; stop 4 governs.

## D6 — Qualifier boxes are a faithful `Kal` port, margins included

**Context.** `svek/SvekEdge.java:242-246,540-562,1015-1019,1069-1077`:
`Kal` widens node margins (`ensureMargins`) and translates the extremity; a
render-only box would sit at the wrong anchor.
**Decision.** New `src/diagrams/class/class-kal.ts` (measure, margin,
extremity translate, emit), theme signature `class.qualified` (T15). Node
sizes for the 19 fixtures are checked against their `svek-N.dot`.
**Consequences.** DOT node sizes move for qualifier fixtures; stop 6 holds.

## D7 — Keep dense uid re-numbering; mirror the counter where upstream burns ticks

**Context.** `renderer-uid.ts:344-395` densely re-numbers kept items and
already has `phantomSlot`/`noUidSlot`. Upstream mints implicit packages at
the tail of `reallyCreateLeaf` (`net/atmp/CucaDiagram.java:239-240,325-336`),
orders links by `sameConnections` (`svek/CucaDiagramFileMakerSvek.java:
90-113`), and burns `apoint`/`GMN` name ticks (`objectdiagram/
AbstractClassOrObjectDiagram.java:120-121`, `command/note/
CommandFactoryNoteOnEntity.java:327`).
**Decision.** Defer implicit-package ticks as a post-pass at `parser.ts:129`
(T1); port `getOrderedLinks`/`addLinkNew` as one pure function applied before
DOT emission so DOT order and draw order move together (T2); add phantom
slots for the couple and note ticks (T3). A global faithful counter replacing
dense re-numbering is rejected.
**Consequences.** Parser and DOT-order changes; full re-pin at B1 close.

## D8 — Colours become `Paint` at the class seam

**Context.** `src/core/paint.ts:201-230` + `svg.ts:204-260,457-510` already
lift gradients into `<defs>` for element buckets; `renderer-classifier-
colors.ts:108-128` and the dedicated `class*Color`/`icon*Color` handlers
bypass it and emit literal strings.
**Decision.** Widen `ThemeGraphColors.classBackground|classBorder|icon*` to
`Paint`; route dedicated-key parsing through `parseColor`; the divider-line
flat-first-colour case (`capode`) is a named branch (T18, audit first).
**Consequences.** A type widening with several consumers; stop 12 bounds it.

## D9 — Embedded `{{ }}` diagrams render through a real nested renderer; the image bytes are declared

**Context.** `src/core/EmbeddedDiagram.ts` is ported behind an injected
`NestedDiagramRenderer` never supplied in production (`core/cucadiagram/
MethodsOrFieldsArea.ts:134-140` throws). Upstream: `EmbeddedDiagram.java:
97-195`.
**Decision.** Supply a recursive `renderSync` producing a
`data:image/svg+xml;base64` `<image>` (T27). Element presence and
dimensions are the target; the payload bytes are a `DIVERGENCES.md` entry,
like sprite hrefs.
**Consequences.** A recursion guard with an `// on-call:` comment; stop 10.

## D10 — ELK fixtures are declared, not special-cased

**Context.** `!pragma layout elk` is unsupported (DIVERGENCES.md:102-108);
the cache holds no `svek-N.dot` for the 7 slugs; `oracle/accepted-
divergences.json` is empty and `scripts/svg-parity-dashboard.ts:24` already
joins it.
**Decision.** Seven exact-id entries (`svg-class/<slug>`, `acceptedAt`
2026-09-21, `acceptedBy` maintainer, reason citing the ruling and the missing
DOT dump) in T0. No survey/census change.
**Consequences.** The survey still prints them `diverged`; the dashboard's
ledger explains them; exit bar reads "0 minus 7".

## D11 — Every batch re-pins once; every riser needs a mechanism

**Context.** Memories: re-pin script raises a pre-existing red pin; the
parity pins carried three weeks of un-adopted drift; weightedScore can rise
on a correct fix.
**Decision.** Re-pin `parity-class.json` and `ratchet.json` only in the
batch's close task; `tools/pin-diff.mts` against the previous pin; every
rise, `true→false` flip, or conformant→non-conformant transition gets a
journal row with its mechanism before adoption.
**Consequences.** Close-out is a task; unexplained risers are stop 5.

## D12 — The oracle stays pinned and the cache is not rebuilt

**Context.** `oracle/dist/plantuml-oracle.jar` points at
`plantuml-1.2026.8beta1.jar` while `oracle/pin.json` pins `1.2026.7beta11`
(diagnosis A6 §6); `scripts/dot-sync-report.ts:64` and `oracle-render.sh`
resolve through the symlink.
**Decision.** No `--rebuild` of `test-results/dot-cache/class`; T0 records
the symlink target and version stamp; any capture sets `PLANTUML_JAR` to the
pinned build. Repointing the symlink is filed as a follow-on in T38.
**Consequences.** Every number stays comparable to prior missions; stop 9.

## Push-forward

Decide alone, journal, continue:

- Scrape a glyph outline from an oracle SVG (T21) rather than compute it
- Choose the exact split of a hot file between two tasks when the write-sets
  are ambiguous, provided no two agents write one file in the same batch
- Reorder tasks inside a batch when a dependency requires it
- In T37, file a singleton as a `planning/next-missions.md` follow-on once
  its diagnosis artifact names the mechanism and the fix is separable and
  larger than the task
- Add `oracle/accepted-divergences.json` entries only for the 7 ELK slugs
  and the D9 payload; anything else is stop 3
- Pin a fixture when survey and census both agree it is exact (D3)
- Write `.agent-notes/cdd-Tn.md` and `next-missions.md` re-filings
- Split a task in two to stay under the 500-line/complexity hooks, provided
  the write-set does not grow
- Extend a task's test-file list
