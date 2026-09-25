# T3 — diagnose E diverged

**Agent:** debugger (opus — diagnose-first) · **Depends on:** T0 ·
parallel with the other T1–T5. Prompt = [`diagnosis-task.md`](../diagnosis-task.md)
+ this file. Writes ONLY `diagnosis/E3.md` (+ gitignored scratch).

## Fixtures (18, from `fixtures.md`, S/N at b-plan)

| slug | verdict | S | N | prior (lead) |
|---|---|---|---|---|
| besepi-37-rori892 | diverged | 30 | 634 |  |
| bijevi-38-duza931 | diverged | 7 | 7 |  |
| cobumi-83-bapu892 | diverged | 1 | 1038 |  |
| delasa-80-jusu462 | diverged | 15 | 10731 |  |
| dojanu-92-vizo468 | diverged | 12 | 2 | cdd2 T19b closed its stereotype; `skinparam package<<Layout>>` colours + collapsed-empty `p3 <<Dummy>>` leaf |
| giraca-14-xome136 | diverged | 2 | 0 | cdd2 T19b; `packageBorderThickness<<stereo>>` skinparam gap |
| gujigi-63-roki030 | diverged | 30 | 576 |  |
| mizupo-59-zala765 | diverged | 173 | 724 | no `<linearGradient>` emitted |
| nijeli-04-ponu844 | diverged | 19 | 3 |  |
| sokevu-87-toce485 | diverged | 3 | 98 |  |
| temise-16-neco018 | diverged | 40 | 337 |  |
| tunelu-64-xica833 | diverged | 5 | 95 |  |
| vegubu-29-bomu147 | diverged | 2 | 144 |  |
| vonago-16-zime449 | diverged | 5 | 227 |  |
| xamule-03-jeda376 | diverged | 2 | 975 |  |
| xoteci-81-jena668 | diverged | 7 | 69 |  |
| zepeki-75-pifo352 | diverged | 3 | 93 |  |
| zuduxu-90-kosi876 | diverged | 4 | 6 |  |

## Leads, not findings

Structural first diffs span ids (besepi), edge paths (cobumi, delasa, xamule, temise, gujigi, vonago, tunelu, zepeki, vegubu), gradients (mizupo), rect rx (nijeli), stroke (xoteci), text metrics (bijevi, sokevu, zuduxu), skinparam-on-stereotype colour/thickness (dojanu, giraca — cdd2 T19b closed their stereotype line). An edge-path diff is NOT evidence of dot-engine: run the real-`dot` probe (D5). delasa's 10731 numerics are a known reveal of a ~73.5 px frame offset — find the offset.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible.
