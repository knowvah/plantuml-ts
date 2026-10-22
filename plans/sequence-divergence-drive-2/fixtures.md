# sdd2 fixture ledger

Seeded by T0e from `measurements/b0-classify.json`; settled at every close
(close-procedure step 9). One row per non-zero fixture. Every task spec
names its target rows; the row's `family` is that task.

Planning-time cohorts (sdd1 `final-classify.json`, main `b34120ea9`): zero
419 · paint-only 4 · geometry 539 · structural 166 · error 13; Σ 73273.

## Cohort counts per checkpoint

| checkpoint | zero | paint-only | geometry | structural | error | pins | Σ ws |
|---|---:|---:|---:|---:|---:|---:|---:|
| plan | 419 | 4 | 539 | 166 | 13 | 419 | 73273 |
| b0 | 419 | 4 | 539 | 166 | 13 | 419 | 73273 |
| b1 | 421 | 4 | 554 | 156 | 6 | 421 | 69169 |
| b2 | 510 | 4 | 472 | 152 | 3 | 510 | 59885 |
| b3 | 687 | 7 | 294 | 150 | 3 | 688 | 41920 |
| b4 | 800 | 7 | 181 | 150 | 3 | 801 | 40745 |
| b5 | 909 | 14 | 76 | 139 | 3 | 910 | 18033 |
| b6 | 962 | 19 | 76 | 81 | 3 | 963 | 8851 |
| b7 | 1029 | 20 | 51 | 38 | 3 | 1030 | 4313 |
| b8 | 1033 | 20 | 51 | 37 | 0 | 1034 | 4268 |

## Open rows

Columns: `slug` · `b0 cohort` · `b0 ws` · `family` (task ID, or `T5?` when
unexplained at planning) · `mechanism` (Java `file:line`) · `final`
(`pinned (<commit>)` or `open -> <owner>: <reason>`).

| slug | b0 cohort | b0 ws | family | mechanism | final |
|---|---|---:|---|---|---|
| bacupi-77-fuke586 | geometry | 2 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| badoba-13-cuba151 | geometry | 5 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| bagexe-03-bozo133 | geometry | 133 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| bajapi-70-tevi384 | geometry | 113 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| bajocu-67-ciki049 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| baketu-62-cumu838 | geometry | 172 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| bakire-18-peku988 | structural | 40 | T7g | message padder (`SkinParam.java:1216-1229`) | pinned (sdd2-b7 close) |
| bakuba-09-fica741 | structural | 153 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| balixa-47-mudo983 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| bapifu-18-bazi719 | structural | 46 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| baxopu-48-fezi101 | geometry | 13 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| baxuxa-14-puvo950 | structural | 42 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | pinned (sdd2-b7 close) |
| bejate-92-fubo102 | structural | 56 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| benugo-73-kezi734 | geometry | 125 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| bepipo-37-fego336 | geometry | 30 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| bexoce-95-vibe195 | geometry | 76 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| bifuzu-54-gefo004 | geometry | 136 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| binupo-93-begi656 | structural | 60 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| birefi-44-bata482 | structural | 14 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| birocu-87-xubi808 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| biruge-35-vaxu680 | geometry | 80 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| bocudo-94-jode371 | geometry | 37 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| bocusa-16-ciju126 | geometry | 75 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| bofovo-45-figi573 | geometry | 100 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| bomino-39-tipo216 | error | undefined | T8c | `<style src=>` / `</?style>` close (`CommandStyleImport.java:67-79`, `CommandStyleMultilinesCSS.java:58`) | pinned (sdd2-b8 close) |
| boparo-11-pema294 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| botoku-28-cupe920 | geometry | 23 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| bovugo-63-lazo401 | geometry | 5 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| bozuru-10-rajo382 | geometry | 2 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| bucebo-91-xavo442 | structural | 109 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| budevu-23-popi845 | structural | 56 | T6e | data:image/svg+xml (`AtomImg.java:153-161`) | pinned (sdd2-b6 close) |
| bugabo-85-veki716 | structural | 52 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| bugafa-93-duzi514 | structural | 140 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| bugalu-47-ludi530 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| bujuma-55-rupu730 | geometry | 4 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| busexe-78-ruzu110 | geometry | 325 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| butofu-60-kene642 | geometry | 2 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| butosi-00-mali446 | geometry | 32 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| buximi-21-xima965 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| cabedu-56-lasa287 | geometry | 20 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| cabeve-16-raci213 | geometry | 5 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| caciga-47-jigu709 | geometry | 217 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| cakelu-69-muza643 | geometry | 79 | T2b+T2a | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| calaja-69-tusu214 | geometry | 81 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| calido-79-kovi606 | geometry | 23 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| caluni-22-noci624 | structural | 456 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| camebe-75-mujo573 | geometry | 373 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| camuxi-33-nopo108 | geometry | 25 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| carose-61-seko055 | geometry | 217 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| caxali-40-cotu420 | geometry | 63 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| caxuke-64-femu351 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| cazipo-94-zubu963 | geometry | 21 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| cazusa-73-masi168 | structural | 701 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | pinned (sdd2-b3 close) |
| cebeje-70-bada975 | geometry | 20 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| cedeti-10-bufu072 | geometry | 48 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| ceduvo-98-page798 | structural | 97 | T2c | note tiles: vmerge, top/bottom line (`NotesTile.java:124-137`, `CommunicationTileNoteBottomTopAbstract.java:121-130`) | pinned (sdd2-b2 close) |
| cejoxe-28-zeba572 | geometry | 70 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| celego-19-laji937 | geometry | 18 | T2d | inclination in tile height (`ComponentRoseArrow.java:342-343`); response-below | pinned (sdd2-b2 close) |
| cesipe-96-luze402 | geometry | 9 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| cetale-74-regu633 | geometry | 140 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| cexeco-21-piga007 | geometry | 6 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| cexeju-49-dumu881 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| cexelu-68-lile614 | geometry | 2 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| cijaru-11-fele146 | geometry | 23 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| cijozi-08-mavu547 | geometry | 171 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| cikoca-19-feji527 | geometry | 81 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| cilore-76-sedu666 | geometry | 36 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| cimofu-59-xotu865 | geometry | 49 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| cinula-56-dipu972 | geometry | 58 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| cizeja-06-zedi526 | geometry | 18 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| cocosu-02-vusu863 | geometry | 29 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| codeti-52-lafa397 | geometry | 217 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| cofuse-78-keri294 | geometry | 52 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| cokaci-31-gera999 | structural | 60 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| cokoxe-37-lelo243 | geometry | 75 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| comelo-49-lefi793 | geometry | 7 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| covuco-47-sotu151 | structural | 34 | T7b | activation group edges (`ComponentRoseActiveLine.java:75-79`) | pinned (sdd2-b7 close) |
| coxefo-18-gopo887 | geometry | 46 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| cujoci-19-taxe939 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| cusete-01-vusi466 | structural | 79 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b6 close) |
| cusiro-03-mebe823 | geometry | 93 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| cusiru-97-buco277 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| dabozi-63-zuco354 | structural | 10 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | pinned (sdd2-b7 close) |
| dadase-07-jalu534 | geometry | 9 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| daduxi-21-duse542 | geometry | 387 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| dakeve-06-cici445 | geometry | 32 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| dalata-11-sifu583 | geometry | 168 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| darupa-17-dujo243 | geometry | 111 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| dasutu-58-saje713 | structural | 69 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b6 close) |
| databu-25-mivu307 | geometry | 51 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| datetu-47-vunu236 | geometry | 80 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| davipu-63-veta505 | paint-only | 1 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| dazuzi-04-zexu620 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| debufa-67-poma789 | structural | 669 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | pinned (sdd2-b3 close) |
| dedigi-45-zusi003 | geometry | 25 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| dedude-72-xuta800 | structural | 46 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| defega-58-zepa649 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| degire-21-dujo330 | geometry | 7 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| dekapo-15-vama907 | structural | 329 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| deluve-26-kaxa424 | structural | 61 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| demeli-77-cozo712 | geometry | 70 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| deteku-57-peba055 | geometry | 17 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| dicega-90-zubu260 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| dicuva-14-lini551 | geometry | 51 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| digula-66-dipe776 | geometry | 109 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| dimili-48-vaka933 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| dipazo-97-namu310 | geometry | 44 | T3b | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| dipede-53-nina209 | geometry | 36 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| diruxe-35-xujo142 | structural | 439 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | pinned (sdd2-b4 close) |
| dofefe-55-kejo043 | geometry | 59 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| dojapu-42-sali914 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| dokuse-50-dobi947 | geometry | 2 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| dolefo-13-kovu702 | geometry | 307 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| doleso-00-deme832 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| dolice-60-copi767 | error | undefined | T1a | note `[[url]]` group missing (`FactorySequenceNoteCommand.java:89,106`); exo note dropped (`TileBuilder.java:122-134`) | pinned (sdd2-b2 close) |
| domaji-70-zini725 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| domutu-66-zobe043 | geometry | 67 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| donuli-07-peje262 | geometry | 2 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| dopove-28-kaza697 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| dopuko-30-lugi781 | geometry | 3 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| dototo-68-bexa421 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| dozugi-77-tuce071 | geometry | 59 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| duboco-13-gaja984 | geometry | 20 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| ducodo-45-duge821 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| dudeku-78-naju581 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| dugeki-47-celo546 | geometry | 2199 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| dugipi-79-kuge638 | geometry | 111 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| duniti-51-pole084 | geometry | 33 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| durapi-97-jupo864 | geometry | 75 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| dutopa-62-jalu659 | geometry | 45 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| duzico-51-misi485 | structural | 131 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| fadibu-99-pufu496 | geometry | 89 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| fakova-98-suze610 | structural | 17 | T7d | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | pinned (sdd2-b7 close) |
| fanoxo-47-somi679 | structural | 80 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| fasafe-10-fepe885 | geometry | 4 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| favale-68-luzo896 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| felasa-37-jovu259 | structural | 68 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b6 close) |
| fenino-82-nusu462 | geometry | 20 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| fenoli-16-peru181 | geometry | 37 | T2d | inclination in tile height (`ComponentRoseArrow.java:342-343`); response-below | pinned (sdd2-b2 close) |
| fetazo-39-xocu662 | structural | 68 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| fexoko-32-feso446 | structural | 10 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | pinned (sdd2-b7 close) |
| ficiru-65-geda551 | geometry | 66 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| fifasu-62-pipo979 | structural | 57 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| figezi-68-zefe216 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| fixecu-74-kote876 | paint-only | 1 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| fobube-11-nifo424 | geometry | 42 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| fobuke-12-dopi544 | geometry | 59 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| fojomu-60-cuda302 | error | undefined | T2e | LinkAnchor (`CommandLinkAnchor.java:55-63`, `LinkAnchor.java:82`) | pinned (sdd2-b3 close) |
| fonope-49-jodi834 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| fonudu-70-coma124 | error | undefined | T8a | YAML front matter (`ReadLineWithYamlHeader.java:98-109`) | pinned (sdd2-b8 close) |
| fotiku-67-lilu728 | geometry | 3 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| fozeva-08-tife475 | geometry | 110 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| fugilu-74-jivu585 | geometry | 42 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| fujodi-29-safe898 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| fukaro-40-riru664 | structural | 61 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| fuliko-66-mulo559 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| fululo-61-zuro165 | structural | 60 | T7b | activation group edges (`ComponentRoseActiveLine.java:75-79`) | pinned (sdd2-b7 close) |
| funoti-95-bisa592 | geometry | 146 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| furara-28-sode432 | geometry | 60 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| fuvumu-26-fovo330 | structural | 46 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| gabisi-10-male675 | structural | 43 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | pinned (sdd2-b7 close) |
| gacemo-20-lafa203 | structural | 36 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| gacujo-48-leto751 | geometry | 189 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| gadiva-05-pogi376 | structural | 10 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| gamefa-47-gelu047 | geometry | 24 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| gapozi-46-zula498 | geometry | 32 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| gaxera-69-muma363 | geometry | 2 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| gebeki-18-muci858 | geometry | 14 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| gecopo-99-pude139 | geometry | 59 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| gejeji-12-zofa866 | geometry | 13 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| gejoko-46-pogi886 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| gekapu-59-pala336 | geometry | 54 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| gekifa-76-fisi424 | geometry | 31 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| gepiju-13-negu183 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| gepuce-64-pivu656 | structural | 267 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | |
| gesiba-07-rise357 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| gibaro-25-sibu619 | structural | 20 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| gibuxa-28-kale997 | geometry | 36 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| gidibo-31-cugi403 | geometry | 17 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| gifope-23-jufe872 | structural | 42 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | pinned (sdd2-b7 close) |
| gijamu-35-vale058 | structural | 882 | T7g | message padder (`SkinParam.java:1216-1229`) | pinned (sdd2-b7 close) |
| gijubi-81-rube024 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| giloko-85-gapa789 | geometry | 5 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| giroko-51-gobi443 | structural | 79 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| gixaxu-80-salo926 | structural | 45 | T8c | `<style src=>` / `</?style>` close (`CommandStyleImport.java:67-79`, `CommandStyleMultilinesCSS.java:58`) | pinned (sdd2-b8 close) |
| gizinu-51-rexo332 | structural | 60 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| goceku-21-rizu768 | geometry | 80 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| gocote-26-bolo737 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| gofixe-24-jani946 | structural | 65 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| gogise-40-juro428 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| gogivi-77-safe144 | geometry | 68 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| gojuro-44-nono843 | geometry | 2 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| gozaru-36-gejo982 | geometry | 5 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| gozobo-83-zuci344 | geometry | 114 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| gucare-93-petu502 | geometry | 459 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| gudidu-67-pene708 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| guduje-81-mucu193 | geometry | 55 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| gukaki-49-boko579 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| gunecu-53-jebu067 | geometry | 2 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| gupuze-37-xelo563 | geometry | 45 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| gutate-63-kane985 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| guvisi-28-voju934 | geometry | 9 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| guzoco-99-ginu686 | geometry | 54 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| jabise-46-luge773 | geometry | 45 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| jacide-26-pumi543 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| jafufe-08-begu830 | structural | 197 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| jagoni-38-koti364 | structural | 56 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| jajobi-60-ralo350 | geometry | 17 | T2d | inclination in tile height (`ComponentRoseArrow.java:342-343`); response-below | pinned (sdd2-b2 close) |
| jalodi-19-mibi961 | geometry | 123 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| jasixo-44-jide821 | structural | 43 | T7b | activation group edges (`ComponentRoseActiveLine.java:75-79`) | pinned (sdd2-b7 close) |
| jatali-99-bajo946 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| jatase-07-moda044 | geometry | 2 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| javedu-98-pibi325 | geometry | 94 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| javiki-44-cija459 | geometry | 58 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| jaxige-32-naja526 | geometry | 4 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| jebole-52-cuvo164 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| jedado-35-lobi482 | structural | 108 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | pinned (sdd2-b3 close) |
| jefoke-95-jara779 | structural | 305 | T7d+T7f | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | |
| jerevu-86-gojo026 | geometry | 26 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| jesari-34-mudu065 | geometry | 37 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| jeviru-31-gasi159 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| jexavi-40-degi377 | geometry | 216 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| jigigi-69-bege021 | geometry | 5 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| jiliba-03-lapi286 | error | undefined | T1b | unported command (`CommandActivate2.java:58-66`, `CommandUrl.java:60-70`, `CommandHideShowByGender.java:72-83`) | pinned (sdd2-b3 close) |
| jinaxe-58-zuva028 | geometry | 66 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| jivati-56-pome307 | structural | 43 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| jiveji-28-butu482 | geometry | 114 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| jobadi-87-jegi648 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| jomemi-46-zazi815 | geometry | 83 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| jonoja-01-zani191 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| jotase-88-kiki473 | geometry | 2 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| jozomu-87-tajo507 | structural | 52 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| jufila-56-kegu669 | geometry | 5 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| jugami-52-timi786 | geometry | 100 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| jujigi-41-zodo151 | geometry | 68 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| jujimu-79-mugu916 | geometry | 37 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| junaxa-14-biko373 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| junide-55-soka558 | error | undefined | T1b | unported command (`CommandActivate2.java:58-66`, `CommandUrl.java:60-70`, `CommandHideShowByGender.java:72-83`) | pinned (sdd2-b7 close) |
| juputo-08-febo295 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| juzagu-24-voxe728 | geometry | 144 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| kajube-48-vejo214 | geometry | 97 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kaluna-08-rubu301 | structural | 60 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| kapuva-33-nomi771 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| karaki-85-ketu935 | geometry | 26 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| kedipo-05-zici527 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kejoke-76-curu931 | geometry | 55 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| keloje-58-ladu877 | structural | 260 | T3b+T7a | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| keluvo-88-kosi498 | geometry | 47 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| kemaba-15-xiso434 | geometry | 1 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| kenilu-88-javu563 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kepuxa-88-juxu405 | geometry | 94 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| kevaru-04-faka914 | geometry | 26 | T3b | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| kevavu-57-kifi084 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| kibave-01-tafo463 | geometry | 20 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kibope-73-jezu646 | geometry | 50 | T2c+T2a | note tiles: vmerge, top/bottom line (`NotesTile.java:124-137`, `CommunicationTileNoteBottomTopAbstract.java:121-130`) | pinned (sdd2-b2 close) |
| kijeka-69-dugi195 | structural | 43 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| kikaso-48-karu319 | geometry | 32 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| kikuba-19-varo358 | geometry | 23 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| kiledu-77-reto787 | geometry | 16 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kilili-04-jode451 | geometry | 7 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| kipabe-50-guti652 | geometry | 12 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| kitevo-12-guvo789 | structural | 24 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | pinned (sdd2-b7 close) |
| kituzo-58-vari147 | geometry | 89 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| kivavu-72-goju233 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| kixani-97-giji283 | geometry | 27 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| kixebi-20-debo481 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kizuga-51-vugi916 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| kobibu-84-bode360 | structural | 15 | T7d | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | pinned (sdd2-b7 close) |
| kocuso-22-ciri203 | geometry | 44 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| kodifo-43-teci570 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kofixo-02-xoso627 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| kofuti-29-goti188 | structural | 103 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b7 close) |
| kogoce-55-goge576 | geometry | 35 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kogozi-22-davu372 | geometry | 86 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| kojigi-18-jexu940 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kojoma-79-luna992 | structural | 349 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| koleji-09-doni016 | geometry | 155 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| komafa-88-zutu920 | structural | 52 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| komibe-79-cola079 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| koneju-77-vode355 | geometry | 217 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kotozo-70-suso472 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kovito-91-jonu992 | geometry | 53 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| kovoso-39-teve092 | geometry | 45 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kozova-44-lore387 | geometry | 28 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kugati-67-nuzu852 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| kugete-25-poba470 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kukeja-88-zida141 | geometry | 195 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| kumogu-10-rigi101 | structural | 170 | T3b+T7a | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| kumovo-90-zira054 | structural | 132 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | pinned (sdd2-b7 close) |
| kumoxa-10-puca304 | geometry | 62 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kuniko-53-rilu801 | structural | 74 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| kurugu-61-cexi774 | geometry | 107 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| kuzoba-85-fabe034 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| kuzuco-40-xara309 | geometry | 62 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| labite-99-lufe939 | structural | 58 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| lacoje-26-lubu678 | geometry | 58 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| ladiro-50-gume805 | error | undefined | T1a | note `[[url]]` group missing (`FactorySequenceNoteCommand.java:89,106`); exo note dropped (`TileBuilder.java:122-134`) | pinned (sdd2-b1 close) |
| lafuzo-13-xura634 | structural | 126 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| lagexo-50-sibo018 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| ledura-21-bavo866 | geometry | 134 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| legole-00-givu934 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| lekari-63-rigu513 | geometry | 30 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| lekopo-04-sefo189 | geometry | 80 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| lenamo-57-fano574 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| lenoki-81-nofo984 | geometry | 83 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| letagi-90-kome968 | geometry | 17 | T2d | inclination in tile height (`ComponentRoseArrow.java:342-343`); response-below | pinned (sdd2-b2 close) |
| lezonu-15-cege608 | structural | 77 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b6 close) |
| libele-29-gagu210 | geometry | 20 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| libipu-23-femo315 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| liculu-86-goge853 | geometry | 66 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| lidupe-72-cexa425 | geometry | 197 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| lifene-24-xaca574 | structural | 34 | T7b | activation group edges (`ComponentRoseActiveLine.java:75-79`) | pinned (sdd2-b7 close) |
| liguma-77-mume567 | structural | 39 | T7d | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | pinned (sdd2-b7 close) |
| lilivo-81-jaja352 | geometry | 29 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| limajo-73-kife020 | geometry | 154 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| lipuci-81-vovi162 | geometry | 122 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| lirasa-26-tazo607 | structural | 352 | T7c | group-end note (`GroupingTile.java:995-1013`) | pinned (sdd2-b7 close) |
| lojore-28-mano308 | geometry | 22 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| lokavu-60-peku948 | structural | 720 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | pinned (sdd2-b7 close) |
| lokole-97-moji784 | structural | 74 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| lokonu-29-zafi019 | structural | 67 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| loloke-56-cape461 | structural | 48 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| losefo-71-dovi176 | geometry | 82 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| losilu-30-ridu614 | paint-only | 1 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| loteba-26-konu854 | geometry | 136 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| lozuru-10-poba814 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| ludeku-31-juki903 | geometry | 23 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| lugika-07-rozo911 | structural | 304 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | pinned (sdd2-b7 close) |
| lukivo-17-cose300 | structural | 68 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| lunasu-43-reno078 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| lupomi-26-vigu795 | structural | 61 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| lusigu-71-nipe759 | geometry | 83 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| luvudi-06-cire238 | geometry | 3 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| luzapi-49-rati107 | geometry | 107 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| macuca-31-lare733 | structural | 97 | T2c | note tiles: vmerge, top/bottom line (`NotesTile.java:124-137`, `CommunicationTileNoteBottomTopAbstract.java:121-130`) | pinned (sdd2-b2 close) |
| makatu-16-guvi187 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| makigi-01-zeni607 | structural | 36 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| makuzo-19-tine034 | geometry | 97 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| mapeji-83-sebu002 | geometry | 76 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| masibi-28-tidi862 | structural | 237 | T2c | note tiles: vmerge, top/bottom line (`NotesTile.java:124-137`, `CommunicationTileNoteBottomTopAbstract.java:121-130`) | pinned (sdd2-b5 close) |
| mataga-73-xape348 | structural | 61 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| matoke-25-kidu719 | geometry | 130 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| maxuzu-48-vopa106 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| mebidu-16-ruve297 | geometry | 263 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| mefeke-43-xotu192 | geometry | 36 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| meguzu-44-luri459 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| mejupo-12-vano433 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| meleno-54-zume276 | geometry | 94 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| menoke-22-luxo044 | structural | 221 | T6d+T7f | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | |
| mepaxe-79-lima141 | geometry | 21 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| metano-36-gevu843 | geometry | 21 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| metaro-33-tivu315 | structural | 29 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| metuso-48-siti946 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| mezaxa-44-siju322 | geometry | 44 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| micaki-01-rexa741 | geometry | 46 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| midipu-78-meva271 | geometry | 68 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| mifafi-02-dofi536 | structural | 47 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| mifeve-32-bone848 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| migodo-28-fodi331 | structural | 16 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| mipope-41-daxa497 | geometry | 36 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| mituru-91-pato523 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| mizeli-59-delu630 | geometry | 73 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| mizugi-66-desi413 | geometry | 42 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| mobeji-49-faki497 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| mobobu-53-vita034 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| modamu-43-juci519 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| mokige-56-disi349 | geometry | 72 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| momivo-11-pulo230 | structural | 97 | T2c | note tiles: vmerge, top/bottom line (`NotesTile.java:124-137`, `CommunicationTileNoteBottomTopAbstract.java:121-130`) | pinned (sdd2-b2 close) |
| momuxe-95-bugu296 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| mopidi-45-pudu787 | geometry | 76 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| moxazi-74-bosi297 | geometry | 32 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| mozege-45-jatu623 | structural | 366 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| mozofa-80-puru273 | geometry | 21 | T2c | note tiles: vmerge, top/bottom line (`NotesTile.java:124-137`, `CommunicationTileNoteBottomTopAbstract.java:121-130`) | pinned (sdd2-b2 close) |
| mozoza-90-biru865 | geometry | 33 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| mucoji-36-bape235 | geometry | 32 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| mudiga-14-sage351 | geometry | 45 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| mugidu-43-jizu986 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| mukebo-35-xoju095 | structural | 634 | T7c | group-end note (`GroupingTile.java:995-1013`) | pinned (sdd2-b7 close) |
| mupugi-53-xuna043 | geometry | 116 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| murori-42-pabo946 | geometry | 92 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| musive-74-reva838 | structural | 44 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| mutuve-86-sevi489 | geometry | 20 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| muvaxa-46-teze620 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| nabesa-52-nufu501 | geometry | 94 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| naliba-15-rari769 | paint-only | 1 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| nanedo-96-foso005 | geometry | 1 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| nanoza-23-fija616 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| nazolo-84-jako346 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| nedaka-75-tiju705 | geometry | 42 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| nekave-81-tove144 | geometry | 83 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| nekeso-74-tebe680 | structural | 119 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| nemeji-70-xupi983 | structural | 60 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| nerujo-69-xovi052 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| nesuva-86-fuki568 | geometry | 197 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| netanu-37-vovi884 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| nexuni-53-xevi406 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| nexuxi-32-gici059 | structural | 387 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b7 close) |
| nibiju-55-kavu710 | structural | 113 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| nidozi-08-daxa280 | error | undefined | T1a | note `[[url]]` group missing (`FactorySequenceNoteCommand.java:89,106`); exo note dropped (`TileBuilder.java:122-134`) | open -> T2a: NOTEMSG; + T4a header label y |
| nijilu-37-zofe547 | structural | 64 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| nimoxu-60-xale291 | structural | 11 | T7d | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | pinned (sdd2-b7 close) |
| nirolu-80-lobo780 | geometry | 36 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| nitadu-00-laca973 | geometry | 57 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| nitubo-28-pugo834 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| nivaje-50-tido759 | structural | 63 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| nivelo-54-caze822 | geometry | 90 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| nizoxo-38-core298 | geometry | 2 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| nizuzi-32-babe798 | error | undefined | T2e | LinkAnchor (`CommandLinkAnchor.java:55-63`, `LinkAnchor.java:82`) | pinned (sdd2-b3 close) |
| nobase-02-zuvu172 | geometry | 24 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| nocilo-91-xeza348 | geometry | 1 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| nofegi-58-kilo738 | geometry | 155 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| nofola-68-nobe068 | geometry | 7 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| nojata-23-ropa545 | structural | 55 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| noneda-45-tutu738 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| nosebu-15-fasu691 | structural | 2902 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | pinned (sdd2-b4 close) |
| nosuti-71-mida920 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| notube-22-jera587 | structural | 970 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | pinned (sdd2-b3 close) |
| nubute-95-pese616 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| nufuse-45-monu242 | geometry | 16 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| numezi-28-fuzu813 | structural | 44 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| nunozo-09-zoce623 | structural | 99 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b6 close) |
| nunuji-27-mosa042 | structural | 51 | T1a | note `[[url]]` group missing (`FactorySequenceNoteCommand.java:89,106`); exo note dropped (`TileBuilder.java:122-134`) | pinned (sdd2-b3 close) |
| nutuxo-22-fiza911 | geometry | 17 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| nuvoja-46-dezu541 | error | undefined | T8b | missing `!includedef` is a no-op (`TContext.java:687-705`) | pinned (sdd2-b8 close) |
| nuxalo-31-mabe377 | geometry | 60 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| nuxure-61-nida877 | geometry | 17 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| padomu-10-nati972 | geometry | 5 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| pafene-01-tedi758 | structural | 180 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | |
| pagare-38-rebo342 | geometry | 68 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| pakado-65-cijo067 | geometry | 50 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| panopa-36-muti317 | geometry | 131 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| paruvi-41-jano091 | geometry | 22 | T2b+T2a | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| patute-88-dena554 | structural | 47 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| peciku-06-zuvo123 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| peduzi-80-giki495 | geometry | 1 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| pexona-78-kede899 | geometry | 44 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| pidici-36-jicu872 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| pigifu-13-kele137 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| pijixu-96-bago359 | structural | 58 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| pimoci-15-jite516 | structural | 29 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| pixifi-75-gulu822 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| pixima-27-nita000 | geometry | 8 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| pixopo-04-zitu732 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| pizupi-41-logi068 | structural | 29 | T7c | group-end note (`GroupingTile.java:995-1013`) | pinned (sdd2-b7 close) |
| pobasa-34-neza994 | geometry | 153 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| poceko-81-dofe354 | geometry | 55 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| podije-21-guxe276 | geometry | 100 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| pojofa-31-mimo042 | geometry | 2 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| pokici-03-lafi659 | geometry | 117 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| pomoxu-05-luco302 | geometry | 963 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| ponugi-73-xuzo000 | geometry | 32 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| popoda-09-xavi089 | structural | 44 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| porepe-36-nebi243 | geometry | 30 | T2b+T2a | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| posura-78-koji601 | structural | 44 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| povuju-50-pido564 | geometry | 2 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| poxugi-46-feba577 | geometry | 120 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| pucini-86-goti091 | structural | 109 | T1a | note `[[url]]` group missing (`FactorySequenceNoteCommand.java:89,106`); exo note dropped (`TileBuilder.java:122-134`) | pinned (sdd2-b1 close) |
| pufube-73-kase811 | geometry | 134 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| pugera-36-jeza279 | geometry | 41 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| pukebe-27-xadi418 | geometry | 8 | T2d | inclination in tile height (`ComponentRoseArrow.java:342-343`); response-below | pinned (sdd2-b3 close) |
| pumula-71-gigi389 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| puneli-74-recu314 | structural | 27 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| punove-48-zugu202 | structural | 72 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| pupini-69-doko713 | geometry | 120 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| putici-74-zenu027 | geometry | 304 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| putuku-29-ziga148 | structural | 374 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| puxoko-57-pifa349 | geometry | 16 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| rajogu-04-suru681 | geometry | 71 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| ralegi-94-fure352 | structural | 42 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| ralucu-86-voxa492 | structural | 57 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| ramica-82-loku620 | geometry | 20 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| rapoto-38-neca900 | structural | 365 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| rasedo-44-liti558 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| ravire-24-jaju542 | structural | 73 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| raxeca-83-rotu897 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| recani-60-licu962 | structural | 143 | T1a | note `[[url]]` group missing (`FactorySequenceNoteCommand.java:89,106`); exo note dropped (`TileBuilder.java:122-134`) | pinned (sdd2-b2 close) |
| refiju-27-nupe082 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| refire-51-cuka840 | geometry | 87 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| regate-07-rore899 | geometry | 37 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| renilo-96-zugo789 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| repeka-62-lizi792 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| repudi-21-rovo448 | geometry | 44 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| rexine-04-regi170 | geometry | 3 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| rezoma-09-vixi307 | geometry | 133 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| rezuve-35-javi726 | geometry | 38 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| ridiro-95-moro174 | structural | 15 | T7d | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | pinned (sdd2-b7 close) |
| rifazu-14-fede536 | geometry | 49 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| ripura-92-vacu541 | structural | 62 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| ritesi-65-gujo913 | geometry | 26 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| rizove-01-move566 | structural | 144 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b6 close) |
| rodori-30-fipi183 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| rofate-27-nuvu751 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| rolota-48-cedi081 | structural | 59 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| romane-05-nika037 | geometry | 49 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| ropame-50-funo509 | geometry | 44 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| rotila-89-juri637 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| rozavo-21-cavi374 | geometry | 62 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| rozove-84-tagu456 | geometry | 5 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| ruboxu-79-joxa034 | structural | 61 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| rudola-01-bibi608 | structural | 103 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b7 close) |
| rugeco-70-muro754 | geometry | 42 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| rugoro-74-mepi153 | geometry | 18 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| rujapu-71-bidi404 | geometry | 565 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| rujetu-45-laxe003 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| rujimo-45-dato973 | structural | 60 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| rupasa-72-neco694 | geometry | 23 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| rusada-38-sopi026 | geometry | 39 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| rutipe-17-jonu882 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| ruxasu-79-puxa956 | geometry | 51 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| ruxazu-24-nagu486 | geometry | 15 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| ruxiga-63-nide445 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| ruxocu-12-tepa317 | geometry | 86 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| ruxuju-55-jitu721 | geometry | 103 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| ruxuxu-75-jilu612 | geometry | 163 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| ruzapi-75-pone297 | structural | 46 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| saroli-53-vafu511 | structural | 73 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| savebe-17-xovo724 | structural | 69 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| sazaxe-79-beka218 | geometry | 15 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| sebafe-48-pepu053 | structural | 106 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| sefako-72-jono850 | geometry | 13 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| selasi-04-leto875 | geometry | 116 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| selave-46-vidi646 | geometry | 4 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| sepeti-78-zido700 | geometry | 39 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| Sequence-delay-destroy-newpage-style | geometry | 15 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| SequenceArrows_0001_Test | structural | 731 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| SequenceArrows_0002_Test | structural | 1492 | T3b+T7a | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b7 close) |
| sesezo-58-joce104 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| sigefa-91-meme719 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| sijuso-90-zaje372 | geometry | 90 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| sirabe-54-sibe468 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| sireta-85-reja792 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| sisege-95-labu547 | structural | 36 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| sisele-83-gebe678 | geometry | 78 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| sixifa-33-bibu140 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| sizumo-60-ziba310 | geometry | 2 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| socode-71-sige450 | geometry | 15 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| sodovo-72-kudu756 | structural | 57 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| sofavo-23-xuxi628 | geometry | 19 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| sojufi-84-bexi933 | geometry | 16 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| soxafo-18-vuzo068 | structural | 46 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| sozifu-13-zufu979 | geometry | 227 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| subaku-04-xuvi971 | geometry | 134 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| sudugu-16-gapi622 | geometry | 6 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| sufevi-44-xipa294 | geometry | 186 | T3b | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| sukuno-50-kiru529 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| suleta-28-lejo742 | geometry | 31 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| sulipe-44-jeta861 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| suneke-72-kexi504 | structural | 83 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b6 close) |
| suredo-76-kaxo606 | structural | 65 | T7a | self dressing1 + circles, multicast, part-anchor (`ComponentRoseSelfArrow.java:91-149`, `CommunicationTile.java:328-395`) | pinned (sdd2-b7 close) |
| susati-64-lako047 | structural | 130 | T7c | group-end note (`GroupingTile.java:995-1013`) | pinned (sdd2-b7 close) |
| suvepo-62-kedo015 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| suvodo-70-rogi494 | structural | 92 | T7g | message padder (`SkinParam.java:1216-1229`) | pinned (sdd2-b7 close) |
| suzumi-85-nuzo693 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| taboza-78-vali232 | structural | 110 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b6 close) |
| taduka-03-kosu047 | geometry | 2 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| tapije-66-runu046 | geometry | 26 | T3b | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| taraxa-93-reno112 | geometry | 437 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| tatesu-03-zozo948 | structural | 3367 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b7 close) |
| taxale-13-fire914 | geometry | 82 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| tefixi-07-xacu656 | geometry | 32 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| tefunu-89-zece967 | structural | 83 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| tegasu-93-fima016 | error | undefined | T1b | unported command (`CommandActivate2.java:58-66`, `CommandUrl.java:60-70`, `CommandHideShowByGender.java:72-83`) | pinned (sdd2-b4 close) |
| tejuzi-96-fano922 | geometry | 67 | T2b+T2a | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| tekice-03-cupa947 | geometry | 119 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| telavi-12-pifu671 | geometry | 3 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| telizo-11-pilo439 | geometry | 21 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| tenifo-99-roxi031 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| teoz-ng-001 | structural | 205 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b5 close) |
| TeozTimelineIssues_0002_Test | geometry | 76 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| TeozTimelineIssues_0003_Test | geometry | 2 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| TeozTimelineIssues_0004_Test | geometry | 83 | T2b+T2a | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| TeozTimelineIssues_0006_Test | geometry | 54 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| TeozTimelineIssues_0007_Test | geometry | 130 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| TeozTimelineIssues_0008_Test | geometry | 66 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| tetemo-66-paku531 | geometry | 14 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| tetoxu-24-mupo410 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| texopo-01-dibi658 | geometry | 44 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| texoze-85-meli189 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| tifexe-26-caza420 | geometry | 26 | T3b | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b3 close) |
| tifube-59-tezo313 | geometry | 21 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| tijeba-12-zeta132 | geometry | 45 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| tijeta-70-ziru418 | structural | 65 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| tijide-41-togo659 | geometry | 12 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| tipido-16-xide828 | geometry | 63 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| titufa-76-tisa795 | geometry | 21 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| todetu-82-rupo943 | geometry | 113 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| togopo-38-tuza899 | structural | 118 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| tolozi-77-gere619 | geometry | 65 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| totebu-75-jata404 | structural | 153 | T6d | empty-stripe atom / embedded diagram (`StripeSimple.java:124-126`, `CreoleParser.java:152-154`) | pinned (sdd2-b7 close) |
| tovese-18-xira071 | structural | 225 | T3b+T7a | reverse self (`CommunicationTileSelf.java:263-277`) | pinned (sdd2-b7 close) |
| tugaju-41-dovi584 | structural | 83 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b6 close) |
| tugonu-44-file000 | structural | 186 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| tukivo-05-vuvi835 | geometry | 1 | T2b | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
| tukobo-89-zebi935 | geometry | 217 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| tulece-76-vexo816 | geometry | 14 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| tumega-91-dadu356 | structural | 13 | T7f | document chrome: gradient bg, border, handwritten (`SvgGraphics.java:178-180`, `TextBlockExporter.java:175,214-231`) | pinned (sdd2-b7 close) |
| tumuke-16-xomo243 | geometry | 172 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| tupogo-51-zeso391 | geometry | 14 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| tupolo-75-ziku881 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| turixi-21-mufe557 | geometry | 173 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| tusoga-11-gabe405 | geometry | 95 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| tuzeli-17-cuko941 | geometry | 248 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| tuzufi-65-xafe699 | geometry | 46 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| vacigu-68-jize640 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| vajoke-72-gizu927 | geometry | 217 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| valiva-41-fabo221 | geometry | 31 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vanaci-52-gimi082 | geometry | 3 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vasibu-26-lece790 | geometry | 40 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| vasuvo-82-boxu402 | geometry | 16 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vataru-17-guso065 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| vativa-83-bisa518 | geometry | 10 | T2d | inclination in tile height (`ComponentRoseArrow.java:342-343`); response-below | pinned (sdd2-b2 close) |
| vaxipu-62-dodo661 | geometry | 90 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vegizu-18-zubu834 | geometry | 61 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| vekami-41-sane093 | structural | 42 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | pinned (sdd2-b7 close) |
| vekivu-99-pijo983 | structural | 100 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vekuno-87-ponu028 | structural | 47 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | pinned (sdd2-b6 close) |
| vekuxo-98-rugu851 | geometry | 2 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vemako-00-lecu427 | geometry | 66 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| vesaze-51-ceji187 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vibaru-39-gebo741 | structural | 58 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| vibazo-85-safi630 | geometry | 110 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vidabo-48-nugi476 | geometry | 28 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vidibe-48-pole993 | geometry | 58 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vifobo-88-gona211 | geometry | 146 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vijito-33-mora824 | geometry | 75 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vikelu-53-faga789 | geometry | 94 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vinefa-69-lufo631 | structural | 74 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vitevu-99-rali549 | geometry | 1521 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vitusu-66-boxa381 | geometry | 75 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vivava-25-vuba802 | structural | 67 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| vixapo-60-tuzu421 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vofupo-09-gafe466 | structural | 70 | T6e | data:image/svg+xml (`AtomImg.java:153-161`) | pinned (sdd2-b7 close) |
| vogegu-91-mave762 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| vopixi-04-lako436 | structural | 51 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vosaco-34-luku168 | geometry | 99 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vosoni-09-tedo226 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vubato-50-gebu534 | error | undefined | T1b | unported command (`CommandActivate2.java:58-66`, `CommandUrl.java:60-70`, `CommandHideShowByGender.java:72-83`) | pinned (sdd2-b3 close) |
| vubibu-30-rufa077 | geometry | 46 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| vucomo-53-gicu658 | geometry | 63 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vudenu-74-xeri322 | geometry | 9 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vujezi-18-pute031 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| vujiba-78-foga414 | geometry | 7 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vuniba-19-repo187 | geometry | 16 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| vuniko-49-fige634 | geometry | 74 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| vutazu-28-xogu304 | geometry | 18 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| vuvoxe-24-bapa117 | geometry | 95 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| vuvuge-45-tina859 | geometry | 1 | T4c | `SequenceMessageAlign` (`Rose.java:299-336`, `ComponentRoseArrow.java:166-172`) | pinned (sdd2-b4 close) |
| vuxaci-12-minu312 | geometry | 56 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| xacete-63-neke615 | geometry | 33 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xakuro-97-tado489 | structural | 42 | T7d | spot glyph, stereotype title, base64 sprite (`DriverCenteredCharacterSvg.java:56-81`, `Stereotype.java:140-145`, `CommandSpriteBase64.java:84-91`) | pinned (sdd2-b7 close) |
| xalafa-49-xere690 | geometry | 75 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| xalaxi-16-laru928 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| xatotu-85-tusi683 | geometry | 64 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| xaxile-75-soro580 | geometry | 113 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xebixi-82-duji787 | geometry | 111 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| xecopi-26-mego518 | geometry | 42 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| xediki-78-dexu094 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| xedomi-77-libu804 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| xegufe-25-paji965 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xejeda-63-dobe217 | geometry | 10 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| xeneru-44-kuma826 | geometry | 155 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| xepoda-56-xema668 | geometry | 8 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| xerugu-77-tapu134 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| xezipe-17-tima059 | structural | 579 | T1c | unclosed group dropped at EOF (`GroupingTile.java:160-163`) | open -> T6b: 3 px per `<sub>` message label height; + T3c x/width |
| xiceso-64-pelu456 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| xidako-83-lidu532 | geometry | 65 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| xinope-25-kupa775 | geometry | 17 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b6 close) |
| xisopa-79-zano248 | geometry | 21 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xivoxi-68-meva932 | geometry | 47 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| xizeto-03-nuke395 | geometry | 37 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| xogota-37-pele078 | geometry | 108 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| xojavo-26-jezu088 | geometry | 111 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| xokike-22-sige844 | geometry | 107 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xolebu-95-cage107 | geometry | 168 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| xonedu-05-mubu593 | geometry | 66 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| xonimo-63-fure722 | geometry | 4 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| xorifu-24-tuba802 | geometry | 6 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| xovuse-55-xape574 | geometry | 5 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| xucibo-16-zisi974 | geometry | 38 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| xujavu-00-xodi798 | structural | 1105 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b6 close) |
| xujesa-13-dane303 | geometry | 98 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xujoga-62-lacu610 | geometry | 36 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| xunoci-60-dezu033 | geometry | 7 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b7 close) |
| xunolu-07-kuxo189 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| xupozu-13-numi050 | geometry | 4 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| xutiri-59-jace312 | geometry | 8 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| xuzedu-97-femo595 | geometry | 142 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| xuzoxu-26-kafe830 | geometry | 29 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| xuzusu-30-tixu002 | geometry | 49 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| zajova-30-sagu653 | structural | 413 | T6c+T7e | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b7 close) |
| zakuti-75-kute096 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| zaretu-49-jomo630 | geometry | 34 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| zarexe-65-xoki430 | geometry | 81 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| zateki-65-foxi765 | geometry | 5 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| zavacu-31-dola792 | geometry | 33 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| zedama-25-riru948 | geometry | 21 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b4 close) |
| zedepi-36-come743 | geometry | 23 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| zejabi-24-xoja824 | geometry | 135 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| zetenu-41-rece091 | geometry | 85 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| zexaja-95-zofi201 | structural | 49 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| zexili-92-fifa666 | geometry | 6 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| zicadi-21-koje636 | structural | 885 | T6c | Fission wrap (`SheetBlock1.java:123`, `Fission.java:63-101`) | pinned (sdd2-b6 close) |
| zimoci-54-sedi066 | structural | 58 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| zizeca-16-cavi659 | geometry | 30 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| zoculi-89-nodo007 | geometry | 105 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| zofeda-77-xiba744 | geometry | 1 | T4b | exo label textDeltaX (`CommunicationExoTile.java:122-124`, `ComponentRoseArrow.java:174-177`) | pinned (sdd2-b4 close) |
| zofibo-80-kisi168 | geometry | 6 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| zofini-90-tuta329 | geometry | 23 | T2a | note beside message / `&` parallel (`TileBuilder.java:102-119`, `YGauge.java:124-145`) | pinned (sdd2-b2 close) |
| zogane-85-raja214 | structural | 327 | T7e | skinparam warning banner (`CommandSkinParam.java:92-99`) | |
| zolude-08-leka122 | structural | 60 | T6b | creole through core `DisplayCreole` (`Display.java:644-669`) | |
| zoluna-26-papu450 | geometry | 2 | T3a | document width terms (`PlayingSpace.java:75-104`, `CommunicationTileSelf.java:166-184,272-277`) | pinned (sdd2-b3 close) |
| zoturo-25-jima978 | error | undefined | T2e | LinkAnchor (`CommandLinkAnchor.java:55-63`, `LinkAnchor.java:82`) | pinned (sdd2-b2 close) |
| zovido-40-xeju664 | geometry | 109 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b3 close) |
| zuboto-07-gimo515 | geometry | 38 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b2 close) |
| zudize-61-vomi445 | geometry | 10498 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| zujani-47-femu345 | geometry | 2 | T3c | group frame extents (`GroupingTile.java:207-225,988-990`) | pinned (sdd2-b3 close) |
| zujuge-00-sida366 | structural | 37 | T7b | activation group edges (`ComponentRoseActiveLine.java:75-79`) | pinned (sdd2-b7 close) |
| zukume-07-xasu503 | geometry | 86 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | pinned (sdd2-b5 close) |
| zunile-23-zezi158 | geometry | 33 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| zupiba-94-gevi986 | geometry | 4 | T4a | stick/queue/badge participant label (`ComponentRoseActor.java:60-91`, `USymbolQueue.java:130-147`, `TextBlockSprited.java:62-76`) | pinned (sdd2-b4 close) |
| zuravu-52-mike252 | geometry | 90 | T5? | unexplained at planning (D7: lifeline x / count, note x, delay) | |
| zutesu-04-xevu025 | geometry | 27 | T2b+T2a | LiveBoxes stairs (`LiveBoxes.java:79-86,284-336`) | pinned (sdd2-b2 close) |
