# cdd-B7FU-R1 — FontConfiguration extended colour + base-face weight

Residual round R1 of batch 7 (`class-divergence-drive`), branch `cdd/b7fu1`
off `7c5b695b`. Ported `FontConfiguration.extendedColor` / `.fontFace`,
`CommandCreoleStyle`'s `$XC` capture, and every extended-colour branch of
`DriverTextSvg#draw` (java:93-180).

## Render-diff, before → after (structural + numeric)

| fixture | before | after | residual |
|---|---|---|---|
| `galili-87-zivo129` | 3 + 0 | **3 + 0** | 3 filter-`@id` diffs only (row 62) |
| `manube-50-xora983` | 4 + 0 | **6 + 0** | 6 filter-`@id` diffs only (row 62) |
| `ziripa-77-zizo842` | 5 + 0 | **2 + 0** | 2 filter-`@id` diffs only |
| `beruje-75-jimu270` | 2 + 0 | **2 + 0** | 2 filter-`@id` diffs only |
| `diseka-11-gozu390` | 1 + 0 | **0 + 0** | CONFORMANT |

After this round every NON-id attribute on all five matches the jar: the
`<filter>` element markup, its `flood-color`, the `filter="url(#…)"` on the
right runs, the coloured `<line>` rules with the jar's own stroke/width/y,
the CSS decorations, and the `font-weight`. The 13 remaining diffs are all
one mechanism, below.

## Observation: the whole residual is the seed-derived def id (journal row 62)

- **Context**: measuring the five fixtures after the port landed. galili
  3→3 and manube 4→6 look flat/worse while the ink became exactly right.
- **Finding**: the jar's filter id is `"b" + Long.toString(|seed|,36) +
  filterBackColor.size()` — per DOCUMENT seed, in first-use order
  (`SvgGraphics.java:160,763-767`). Before this round those fixtures were
  missing the `<filter>` entirely, so they paid ONE `defs[childCount]` diff;
  now they emit it and pay one `@id` diff per def plus one per reference.
  The exchange is a strictly more correct document for a flat-or-slightly-
  higher count — the same anti-monotonicity the `weightedScore can rise on a
  correct fix` memory describes.
- **Impact**: `seedOf(rawSource)` (`svg-seed.ts`) ALREADY reproduces the
  jar's uid EXACTLY — verified: galili `b1aoebuletv6c2`, manube
  `bz23kcsdiojxy`, ziripa `b12uh59b48gukq`, beruje `b144o7cb4selba`, each
  matching its oracle's id character for character. The only missing link is
  that no assembler receives the diagram's raw source: the class plugin does
  not thread a seed (description's `index.ts:69` does), and chrome fragments
  are seeded per ELEMENT KIND (`blocks.ts:229`, `uid: kind`). Threading it
  would close all 13 diffs at once AND retire the gradient-id diffs row 62
  already counts — one cross-engine follow-on, `src/index.ts` +
  `assemble-svg.ts` + `document-shell.ts`/`svg.ts`, with
  `collapseDuplicateFilterDefs` (added here) already doing the reference
  rewriting half. Deliberately NOT done here: it is row 62's own task (T37)
  and it collides with R2's `src/index.ts` write-set.
- **Confidence**: High (ids computed and compared against four oracles).

## Observation: one `SvgGraphics` per diagram is an invariant our fragments break

- **Context**: galili's footer and legend are both `<back:red>`; the jar has
  ONE `<filter>` in `<defs>` referenced twice.
- **Finding**: this port draws each chrome element as its own klimt fragment
  with its own seeded id namespace, so the same colour produced two
  identical-but-differently-named filters and `defs[childCount]` read 2 vs 1.
  `mergeFragmentDefs` cannot see it (it dedups by id).
- **Impact**: added `svg-defs.ts#collapseDuplicateFilterDefs` — collapse
  `<filter>` defs that are byte-identical apart from their id and rewrite
  `url(#dropped)` in the body. Runs in BOTH assemblers via
  `collectDocumentDefs` (`svg.ts#svgRoot`, `document-shell.ts
  #assembleDocumentShell`), which is now the single place that decides what
  reaches `<defs>`.
- **Confidence**: High (galili verified, unit-tested).

## Observation: `shiftFragmentBody` was corrupting `<defs>` attributes

Diagnosis artifact for a defect this round surfaced and fixed.

- **Mechanism**: `annotations/coord-shift.ts#shiftFragmentBody` rewrites
  every `x|y|x1|y1|x2|y2|cx|cy|points|d|transform` attribute in the fragment
  body. An inline `<linearGradient>`/`<filter>` def sits in that body until
  assembly lifts it, and its attributes are in DEF units (objectBoundingBox
  percentages, filter units), not document coordinates.
- **Origin**: `src/core/annotations/coord-shift.ts:153-168` (`SHIFTABLE_ATTR_RE`
  + `shiftFragmentBody`), pre-existing.
- **Causal chain**: (a) the new `<filter x="0" y="0">` came out as
  `y="<chrome offset>"` on `ziripa`; (b) PRE-EXISTING — a gradient vector's
  `x1="0%"` goes through `Number('0%')` → `NaN`, so ANY class diagram with a
  gradient fill AND chrome emitted `x1="NaN" y1="NaN" x2="NaN" y2="NaN"`.
  Reproduced directly (`skinparam classBackgroundColor red|blue` + `title`).
- **Ruled out**: the filter markup itself (byte-identical to the jar when
  rendered without chrome); the lift order (the def is lifted after the
  shift, by design); a rounding difference (the delta was exactly the chrome
  dy).
- **Fix**: `svg-defs.ts#mapOutsideInlineDefs` — the shift steps over inline
  def spans. Two regression tests in `tests/unit/annotations-coord-shift.test.ts`.
- **Confidence**: High (both symptoms reproduced before and after).

## Observation: three non-class engines moved, all toward the jar

Chrome, description/component/usecase and sequence all reach text through
the klimt `DriverTextSvg`, so the port moved them too. No pinned test moved
(full suite green), i.e. nothing was adopted silently; measured before/after
by stashing the change:

| fixture | element | before | after | jar |
|---|---|---|---|---|
| `component/gafico-37-cuma657` | `<line>` / `text-decoration` | 9 / 4 | **13 / 0** | 13 / 0 |
| `component/nujito-06-neca370` | `<line>` / `text-decoration` | 9 / 3 | **12 / 0** | 12 / 0 |
| `usecase/camevo-41-suki094` | `<line>` / `text-decoration` | 0 / 1 | **1 / 0** | 1 / 0 |
| `sequence/funado-58-dene546` | `<filter>` | 0 | **1** | 1 |
| `sequence/gupaki-93-vupa807` | `<filter>` | 0 | **1** | 1 |
| `sequence/kuputa-52-caxa434` | `<filter>` | 0 | **2** | 2 |

`sequence/migodo-28-fodi331` and `sequence/ravire-24-jaju542` did NOT move:
their runs reach text through `diagrams/sequence/sequence-creole.ts`'s own
emitter, which has not been routed through the shared decisions. Named, not
chased — a separate seam, outside this task's write-set.

## Observation: `<w:color>` has no extended-colour arm upstream

- **Finding**: `DriverTextSvg.java:150-155` draws WAVE as plain
  `text-decoration="wavy underline"` and never consults `getExtendedColor()`,
  even though `FontStyle#canHaveExtendedColor` returns true for WAVE (so the
  colour IS captured and IS carried on the configuration — it simply never
  reaches the SVG). `ziripa`'s oracle confirms: `<w:green>green</w>` is a
  plain wavy underline, no green anywhere.
- **Impact**: do not "fix" a missing green wave; it is upstream's behaviour.
- **Confidence**: High (Java branch + oracle).

## Named remainders

1. **Filter/gradient ids** — the whole residual above; row 62 / T37.
2. **`<back:a|b>` gradient background** — `DriverTextSvg.java:161-169` paints
   a patch rectangle instead of a filter. Ported in the klimt driver
   (`drawBackGradient`), which needs the run's measured HEIGHT; the driver's
   narrow `StringBounder` seam supplies width only today, so the rectangle is
   skipped rather than invented, and class's string renderers take only the
   solid arm. No corpus fixture reaches it: grepping all 27 cached corpora
   found zero `<back:` tokens with a gradient separator.
3. **`sequence-creole.ts`** — see the mover table above.
