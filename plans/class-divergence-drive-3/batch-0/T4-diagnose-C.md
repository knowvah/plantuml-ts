# T4 — diagnose C named + stretch pairs

**Agent:** debugger (opus — diagnose-first) · **Depends on:** T0 ·
parallel with the other T1–T5. Prompt = [`diagnosis-task.md`](../diagnosis-task.md)
+ this file. Writes ONLY `diagnosis/C.md` (+ gitignored scratch).

## Fixtures (23, from `fixtures.md`, S/N at b-plan)

| slug | verdict | S | N | prior (lead) |
|---|---|---|---|---|
| bidusa-22-jutu505 | diverged | 1 | 50 | member-row sprite sizing (archimate/stdlib sprite), childCount 14 vs 12 |
| cagace-55-libu760 | diverged | 3 | 37 | `scale` k = target / unscaled, unscaled canvas ~1 px off |
| filoxo-23-fafi328 | diverged | 10 | 0 | `<style> visibilityIcon {}` cascade + shadow filter shape |
| givofi-11-xumu978 | diverged | 10 | 2 | linearGradient order swapped (undiagnosed) |
| givoli-70-rade072 | structural-match | 0 | 24 | one edge path Δ10 + text x Δ0.011 (undiagnosed) |
| kujiji-68-cujo036 | diverged | 49 | 824 | `scale` (as cagace) |
| lejoga-79-poji465 | diverged | 90 | 410 | entity order / uid (ent0002 vs ent0001) (undiagnosed) |
| luzive-62-zote562 | diverged | 11 | 21 | error-page textLength / version identity |
| medosa-71-ligu412 | structural-match | 0 | 4 | crow's-foot `side` always null (SvekEdge.ts adapter lacks node geometry) |
| nadaba-37-zaku242 | diverged | 12 | 178 | `scale` (as cagace) |
| nadepi-13-mufu566 | structural-match | 0 | 24 | one edge path Δ10 + text x Δ0.011 (undiagnosed) |
| pejone-71-tige404 | diverged | 220 | 1028 | g[1] title vs entity, 220 structural (undiagnosed) |
| ponono-25-fevo574 | diverged | 62 | 75 | text wrap: `here` vs `is` from text[36] (undiagnosed) |
| popesa-39-sobe866 | diverged | 7 | 2 | gradient def-id seed |
| puvono-84-doro361 | diverged | 2 | 918 | two edge paths + width +161 (undiagnosed) |
| rakopi-21-sufa571 | diverged | 10 | 0 | visibilityIcon cascade + shadow filter |
| ruliki-78-biji661 | diverged | 1 | 50 | member-row sprite sizing (archimate/stdlib sprite), childCount 14 vs 12 |
| sadamo-18-siva346 | diverged | 11 | 19 | error-page textLength / version identity |
| sekame-22-meze147 | diverged | 2 | 918 | two edge paths + width +161 (undiagnosed) |
| sumocu-27-vubo674 | diverged | 62 | 75 | text wrap: `here` vs `is` from text[36] (undiagnosed) |
| tekena-28-fobe713 | structural-match | 0 | 24 | one edge path Δ10 + text x Δ0.011 (undiagnosed) |
| vudepo-27-cuvo793 | diverged | 84 | 402 | entity order / uid (ent0002 vs ent0001) (undiagnosed) |
| xonamo-50-podo529 | diverged | 220 | 1066 | g[1] title vs entity, 220 structural (undiagnosed) |

## Leads, not findings

Pairs share first diffs (confirmed in cdd2 row 40): ponono/sumocu text wrap; pejone/xonamo g[1] `title` vs `entity` (220 S); puvono/sekame two edge paths + width +161; vudepo/lejoga entity order; givoli/tekena/nadepi one edge Δ10 + text x Δ0.011; bidusa/ruliki member-row sprite sizing (archimate/stdlib sprite, childCount 14 vs 12); givofi/popesa gradient order + def-id seed. Singles: filoxo/rakopi visibilityIcon cascade + shadow filter; cagace/nadaba/kujiji `scale` (k = target / unscaled — find which unscaled term is ~1 px off); luzive/sadamo error-page identity — decide fix vs proposed-accept (D6) with evidence; medosa crow's-foot side.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible.
