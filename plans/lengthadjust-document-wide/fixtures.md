# lad authored-fixture ledger

Seeded at the batch-0 close from `oracle/goldens/svg-lengthadjust/
authored-baseline.json` (T0c). One row per `tests/fixtures/lengthadjust/
<engine>-<variant>.puml`; `task` is the owning task; `final` is filled at
closes (`exact (<commit>)`, or the remaining mechanism and owner). The 13
`baseline` rows (board/packet/chart under default/glyphs/onechar, files ×4 —
Amendment 1) stay `baseline` by design (D5): their emitters write no
`textLength`.

## Counts per checkpoint

| checkpoint | rows | rootExact | textLength exact | textLength baseline (never worse) | Σ score |
|---|---:|---:|---:|---:|---:|
| b0 (`accb08bb5`) | 64 | 40 | 42 | 13 | 4121 |
| b1 (`724235b2c`) | 64 | 46 | 45 | 13 | 4109 |

## Rows

| slug | engine | variant | task | rootExact | textLengthMatch | final |
|---|---|---|---|---|---|---|
| activity-default | activity | default | T2a | true | true | exact (b0) |
| activity-glyphs | activity | glyphs | T2a | false | true | pending T2a |
| activity-none | activity | none | T2a | false | false | pending T2a |
| activity-onechar | activity | onechar | T2a | true | true | exact (b0) |
| board-default | board | default | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| board-glyphs | board | glyphs | T2f | false | false | emitter writes no textLength (pre-existing; owner: the engine's own drive); pending T2f |
| board-none | board | none | T2f | false | true | pending T2f |
| board-onechar | board | onechar | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| chart-default | chart | default | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| chart-glyphs | chart | glyphs | T2f | false | false | emitter writes no textLength (pre-existing; owner: the engine's own drive); pending T2f |
| chart-none | chart | none | T2f | false | true | pending T2f |
| chart-onechar | chart | onechar | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| class-default | class | default | T1b | true | true | exact (b0) |
| class-glyphs | class | glyphs | T1b | true | true | exact (724235b2c) |
| class-none | class | none | T1b | true | true | exact (724235b2c) |
| class-onechar | class | onechar | T1b | true | true | exact (b0) |
| component-default | component | default | T2b | true | true | exact (b0) |
| component-glyphs | component | glyphs | T2b | false | true | pending T2b |
| component-none | component | none | T2b | false | false | pending T2b |
| component-onechar | component | onechar | T2b | true | true | exact (b0) |
| files-default | files | default | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| files-glyphs | files | glyphs | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| files-none | files | none | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| files-onechar | files | onechar | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| hcl-default | hcl | default | T1d | true | true | exact (b0) |
| hcl-glyphs | hcl | glyphs | T1d | true | true | exact (b0) |
| hcl-none | hcl | none | T1d | true | true | exact (b0) |
| hcl-onechar | hcl | onechar | T1d | true | true | exact (b0) |
| json-default | json | default | T1d | true | true | exact (b0) |
| json-glyphs | json | glyphs | T1d | true | true | exact (b0) |
| json-none | json | none | T1d | true | true | exact (b0) |
| json-onechar | json | onechar | T1d | true | true | exact (b0) |
| mindmap-default | mindmap | default | T2c | true | true | exact (b0) |
| mindmap-glyphs | mindmap | glyphs | T2c | false | true | pending T2c |
| mindmap-none | mindmap | none | T2c | false | false | pending T2c |
| mindmap-onechar | mindmap | onechar | T2c | true | true | exact (b0) |
| object-default | object | default | T1b | true | true | exact (b0) |
| object-glyphs | object | glyphs | T1b | true | true | exact (724235b2c) |
| object-none | object | none | T1b | true | true | exact (724235b2c) |
| object-onechar | object | onechar | T1b | true | true | exact (b0) |
| packet-default | packet | default | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| packet-glyphs | packet | glyphs | T2f | false | false | emitter writes no textLength (pre-existing; owner: the engine's own drive); pending T2f |
| packet-none | packet | none | T2f | false | true | pending T2f |
| packet-onechar | packet | onechar | T2f | true | false | emitter writes no textLength (pre-existing; owner: the engine's own drive) |
| salt-default | salt | default | T2e | true | true | exact (b0) |
| salt-glyphs | salt | glyphs | T2e | false | true | pending T2e |
| salt-none | salt | none | T2e | false | false | pending T2e |
| salt-onechar | salt | onechar | T2e | true | true | exact (b0) |
| state-default | state | default | T1c | true | true | exact (b0) |
| state-glyphs | state | glyphs | T1c | true | true | exact (724235b2c) |
| state-none | state | none | T1c | true | true | exact (724235b2c) |
| state-onechar | state | onechar | T1c | true | true | exact (b0) |
| usecase-default | usecase | default | T2b | true | true | exact (b0) |
| usecase-glyphs | usecase | glyphs | T2b | false | true | pending T2b |
| usecase-none | usecase | none | T2b | false | false | pending T2b |
| usecase-onechar | usecase | onechar | T2b | true | true | exact (b0) |
| wbs-default | wbs | default | T2d | true | true | exact (b0) |
| wbs-glyphs | wbs | glyphs | T2d | false | true | pending T2d |
| wbs-none | wbs | none | T2d | false | false | pending T2d |
| wbs-onechar | wbs | onechar | T2d | true | true | exact (b0) |
| yaml-default | yaml | default | T1d | true | true | exact (b0) |
| yaml-glyphs | yaml | glyphs | T1d | true | true | exact (b0) |
| yaml-none | yaml | none | T1d | true | true | exact (b0) |
| yaml-onechar | yaml | onechar | T1d | true | true | exact (b0) |
