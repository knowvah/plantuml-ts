# sdd3 fixture ledger

Seeded at planning from `measurements/planning-classify.json` (main `5f954eeff`)
with sdd2's filed family per row (`../sequence-divergence-drive-2/fixtures.md`,
column `final`). `task` is the owning sdd3 task; `final` is filled at closes
(`pinned (<commit>)`, or the remaining mechanism and owner).

## Cohort counts per checkpoint

| checkpoint | zero | paint-only | geometry | structural | error | Σ ws | pins |
|---|---:|---:|---:|---:|---:|---:|---:|
| planning | 1042 | 17 | 52 | 32 | 0 | 3800 | 1042 |
| b0 | 1042 | 17 | 52 | 32 | 0 | 3800 | 1042 |
| b1 | 1058 | 15 | 38 | 32 | 0 | 3281 | 1058 |
| b2 | 1083 | 3 | 27 | 30 | 0 | 2774 | 1083 |
| b3 | 1103 | 3 | 7 | 30 | 0 | 1600 | 1103 |
| b4 | 1133 | 0 | 5 | 5 | 0 | 1082 | 1133 |

## Open rows (101)

| slug | cohort | ws | family | task | final |
|---|---|---:|---|---|---|
| jefoke-95-jara779 | structural | 280 | handwritten-unported | T8f | |
| gepuce-64-pivu656 | structural | 241 | handwritten-unported | T8f | |
| jexavi-40-degi377 | geometry | 213 | par2-not-parallel | T1a | open -> T5b: 121 left after T1a/T1a2 (`0a3779247`); x residual 113.769 px — `pairConstraint` drops the pair but a symbolic span is not the fix; candidate: `RealMax` first-read cache freezes `ensureBiggerThan` forces (`PlayingSpace.java:188-199,240-266`, `RealMin.java:81-85`, `RealLine.java:68-100`), unverified (journal 22) |
| pafene-01-tedi758 | structural | 173 | handwritten-unported | T8f | |
| daduxi-21-duse542 | geometry | 172 | par2-not-parallel | T1a | pinned (0a3779247) at b1 |
| baketu-62-cumu838 | geometry | 168 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| tumuke-16-xomo243 | geometry | 168 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| dolefo-13-kovu702 | geometry | 164 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| menoke-22-luxo044 | structural | 150 | handwritten-unported | T8f | |
| javedu-98-pibi325 | geometry | 94 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| kepuxa-88-juxu405 | geometry | 94 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| nabesa-52-nufu501 | geometry | 94 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| vikelu-53-faga789 | geometry | 94 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| nuzise-60-temi305 | geometry | 87 | self-note-left-anchor | T1b | pinned (22f543eb3) at b1 |
| vijito-33-mora824 | geometry | 68 | document-margin-style-ignored | T2d | pinned (071de4129) at b2 |
| vitusu-66-boxa381 | geometry | 68 | document-margin-style-ignored | T2d | pinned (071de4129) at b2 |
| xalafa-49-xere690 | geometry | 68 | document-margin-style-ignored | T2d | pinned (071de4129) at b2 |
| vucomo-53-gicu658 | geometry | 63 | skinparam-lengthadjust-unported | T2c | pinned (8b3aa2a8a) at b2 |
| ripura-92-vacu541 | structural | 62 | url-label-newline-split | T2e | pinned (7ca69af29) at b2 |
| bucebo-91-xavo442 | structural | 59 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| jujigi-41-zodo151 | geometry | 58 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| tukobo-89-zebi935 | geometry | 58 | par2-not-parallel | T1a | pinned (0a3779247) at b1 |
| fifasu-62-pipo979 | structural | 57 | remote-image-io | T6g | |
| suzumi-85-nuzo693 | geometry | 54 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| vopixi-04-lako436 | structural | 51 | url-label-newline-split | T2e | pinned (7ca69af29) at b2 |
| bugafa-93-duzi514 | structural | 36 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| mefeke-43-xotu192 | geometry | 35 | latex-array-unmodelled | T7a | |
| vivava-25-vuba802 | structural | 33 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| bocudo-94-jode371 | geometry | 31 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| jesari-34-mudu065 | geometry | 31 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| refiju-27-nupe082 | geometry | 31 | par2-not-parallel | T1a | pinned (0a3779247) at b1 |
| regate-07-rore899 | geometry | 31 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| lokonu-29-zafi019 | structural | 30 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| sebafe-48-pepu053 | structural | 30 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| mozoza-90-biru865 | geometry | 27 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| saroli-53-vafu511 | structural | 27 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| zavacu-31-dola792 | geometry | 27 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| zunile-23-zezi158 | geometry | 27 | scale-excludes-chrome | T3b | pinned (b07b820b9) at b3 |
| labite-99-lufe939 | structural | 25 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| ralucu-86-voxa492 | structural | 24 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4; was: 20 left after T1h (`2486b1af0`): paint diffs were monochrome; remainder `svg/defs childCount` 0 vs 1 + `svg/g childCount` 13 vs 14 (its own family, owner unchanged) |
| tifube-59-tezo313 | geometry | 21 | filename-env-unwired | T6f | |
| vibaru-39-gebo741 | structural | 21 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| zimoci-54-sedi066 | structural | 21 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| deluve-26-kaxa424 | structural | 20 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| lupomi-26-vigu795 | structural | 20 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| mataga-73-xape348 | structural | 20 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| ruboxu-79-joxa034 | structural | 20 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| sodovo-72-kudu756 | structural | 20 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| kixani-97-giji283 | geometry | 19 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| zedepi-36-come743 | geometry | 19 | group-header-comment-supp-height | T1d | pinned (b1d7e7c68) at b1 |
| cizeja-06-zedi526 | geometry | 18 | creole-svg-attribute-unported | T2f | pinned (7b78a0ad9) at b2 |
| rolota-48-cedi081 | structural | 18 | svgparser-sax-unported | T4f | pinned (b59647cc2) at b4 |
| lukivo-17-cose300 | structural | 16 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| vuniba-19-repo187 | geometry | 16 | skinparam-lengthadjust-unported | T2c | pinned (8b3aa2a8a) at b2 |
| vasuvo-82-boxu402 | geometry | 14 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| zexaja-95-zofi201 | structural | 14 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| dedude-72-xuta800 | structural | 13 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| xezipe-17-tima059 | paint-only | 12 | monochrome-mapper-unported | T1h | pinned (2486b1af0) at b1 |
| zolude-08-leka122 | structural | 12 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| posura-78-koji601 | structural | 11 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| gebeki-18-muci858 | geometry | 8 | blotter-scaled-offset-and-path-stroke | T8g | 2 left after T2b (`f5b3e770c`) -> T5a: ARCTO `ensureVisible` adds the arc radius to the canvas (`SvgGraphics.java:854,129-131`), journal row 34 -> T8g after the UGraphic move (journal row 69; artifact `diagnosis/drawn-extent.md`) |
| modamu-43-juci519 | geometry | 8 | participant-topurl-ignored | T1c | pinned (df9bbfd3e) at b1 |
| mugidu-43-jizu986 | geometry | 8 | participant-topurl-ignored | T1c | pinned (df9bbfd3e) at b1 |
| xepoda-56-xema668 | geometry | 8 | participant-topurl-ignored | T1c | pinned (df9bbfd3e) at b1 |
| cabedu-56-lasa287 | geometry | 7 | blotter-scaled-offset-and-path-stroke | T2b | pinned (f5b3e770c) at b2 |
| cokaci-31-gera999 | structural | 7 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| jeviru-31-gasi159 | geometry | 6 | participant-underline-unported | T1e | pinned (0b9a6faf0) at b1 |
| koleji-09-doni016 | paint-only | 6 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| nofegi-58-kilo738 | paint-only | 6 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| patute-88-dena554 | structural | 6 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| xeneru-44-kuma826 | paint-only | 6 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| metaro-33-tivu315 | structural | 5 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| ruzapi-75-pone297 | structural | 5 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| darupa-17-dujo243 | paint-only | 4 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| kofixo-02-xoso627 | geometry | 4 | xlink-title-decode | T3c | pinned (3aa8e915c) at b3 |
| libipu-23-femo315 | geometry | 4 | participant-topurl-ignored | T1c | pinned (df9bbfd3e) at b1 |
| meleno-54-zume276 | paint-only | 4 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| xebixi-82-duji787 | paint-only | 4 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| zofibo-80-kisi168 | paint-only | 4 | monochrome-mapper-unported | T1h | pinned (2486b1af0) at b1 |
| zuravu-52-mike252 | paint-only | 4 | upath-fore-equals-back-strokeless | T2a | pinned (5898bfecb) at b2 |
| jigigi-69-bege021 | geometry | 3 | natural-align-dropped | T1f | pinned (5e359d3bc) at b1 |
| gadiva-05-pogi376 | paint-only | 2 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| gaxera-69-muma363 | geometry | 2 | hsl-float32 | T2g | pinned (001a8bf7b) at b2 |
| gizinu-51-rexo332 | paint-only | 2 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| kaluna-08-rubu301 | geometry | 2 | svg-ensurevisible-drawn-extent | T8g | diagnosed at b5 (`1899a1379`, `diagnosis/drawn-extent.md`): canvas = running `ensureVisible` max over drawn primitives (`SvgGraphics.java:129-135,142-143`); re-slotted to T8g after the UGraphic move (journal row 69) |
| komafa-88-zutu920 | paint-only | 2 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| nemeji-70-xupi983 | paint-only | 2 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| nidozi-08-daxa280 | geometry | 2 | xlink-title-decode | T3c | pinned (3aa8e915c) at b3 |
| nijilu-37-zofe547 | geometry | 2 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| nivelo-54-caze822 | paint-only | 2 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| povuju-50-pido564 | geometry | 2 | xlink-title-decode | T3c | pinned (3aa8e915c) at b3 |
| rapoto-38-neca900 | paint-only | 2 | harness-no-emoji-store | T2h | pinned (9a393e266) at b2 |
| raxeca-83-rotu897 | geometry | 2 | xlink-title-decode | T3c | pinned (3aa8e915c) at b3 |
| sulipe-44-jeta861 | geometry | 2 | xlink-title-decode | T3c | pinned (3aa8e915c) at b3 |
| xonimo-63-fure722 | paint-only | 2 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| zogane-85-raja214 | paint-only | 2 | alpha-hex-fill-unsplit | T2a | pinned (5898bfecb) at b2 |
| TeozTimelineIssues_0002_Test | geometry | 1 | note-wrapper-life-step | T1g | pinned (523e63daa) at b1 |
| bexoce-95-vibe195 | geometry | 1 | note-wrapper-life-step | T1g | pinned (523e63daa) at b1 |
| mapeji-83-sebu002 | geometry | 1 | note-wrapper-life-step | T1g | pinned (523e63daa) at b1 |
| musive-74-reva838 | geometry | 1 | svgparser-sax-unported | T4f | pinned (e336a9a67) at b4 |
| peduzi-80-giki495 | geometry | 1 | skinparam-lengthadjust-unported | T2c | pinned (8b3aa2a8a) at b2 |

## Follow-ons filed during the drive (no open sequence row)

| filed | by | mechanism | owner |
|---|---|---|---|
| 2026-10-22 | T1c | `CommandUrl.java:96-98` passes `skinparam topurl` to its `UrlBuilder`; `command-misc.ts:328` calls `participantUrlOf(match[2])` without it — latent for `url of X is [[/rel]]` under a topurl (libipu's `url of` lines are comments). One line; no fixture exercises it. | next drive / author a fixture |
| 2026-10-22 | T1f | `Display.create0` applies the `\r`/`\l` natural alignment to EVERY display (`Display.java:644-649`); T1f threads it for message labels only (`messageLabelLayout`). Notes, refs, delays, participant labels and frame titles still drop it. No corpus row known to need it. | next drive / author fixtures |
