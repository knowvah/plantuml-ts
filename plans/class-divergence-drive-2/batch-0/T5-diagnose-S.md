# T5 — diagnose group S (small diverged singletons)

**Agent:** debugger · **Depends on:** T0 · parallel with T1–T4.
Prompt = [`diagnosis-task.md`](diagnosis-task.md) + this file.

## Fixtures (17, all diverged, each ≤ 6 structural + ≤ 3 numeric diffs)

Structural (ids / childCount / dash / nested render) — provisional T7:

| slug | first diff (b-plan) |
|---|---|
| sugifi-33-xefe083 | `g[1]/@id` ent0003 vs ent0002 |
| sumule-00-pefa744 | one `@id` |
| xumofu-43-fode658 | three `@id` |
| fumalu-64-vude116 | `rect/@fill` + a `childCount` |
| rakuci-96-tuti371 | two `childCount` |
| pibifa-14-leno075 | `path/@id`, `stroke-dasharray`, `childCount`, 2 numerics Δ5 |
| begico-70-guva302 | two `path/@stroke`, `path/@id`, dasharray, `childCount` |
| rojoxi-79-vimu822 | `svg/g/path/@fill` #DDD vs #F1F1F1; stderr: `class-nested-diagram-renderer: rendered SVG has no viewBox` |

Paint / text — provisional T8:

| slug | first diff (b-plan) |
|---|---|
| nesivu-99-cexu403 | `text/@font-family` Forte vs monospace |
| nisune-86-faji869 | one `text/@fill` |
| tuguku-78-zega630 | `g/polygon` fill #B8860B vs #FF4, stroke #B8860B vs #B38D22 |
| xoxuni-96-fere626 | path stroke, polygon fill+stroke, text fill |
| gabejo-44-juki791 | two `rect/@stroke`, two `text/@fill`, height Δ1 |
| guxode-39-dobi371 | two `polygon/@stroke`, 2 numerics Δ0.01 |
| vuresa-33-kumu160 | font-weight, textLength, text, Δ0.11/24.18 |
| rezoba-58-xaze387 | two `path/@d` (structural: point count differs) |
| jojime-80-savu279 | three `path/@d` |

## Leads, not findings

- `@id` deltas of 1 are uid-counter ticks: the prior mission's D7 kept
  dense re-numbering with phantom slots (`renderer-uid.ts`, `phantomSlot`,
  `noUidSlot`) for implicit packages, couples, `apoint`/`GMN` notes. Name
  which upstream tick each fixture burns (Java line) that we do not.
- rojoxi's stderr says the nested `{{ }}` render returned no `viewBox`;
  find what it rendered before blaming the fill.
- Group ids by mechanism in your summary table — several singletons may
  share one.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible — see [`diagnosis-task.md`](diagnosis-task.md).
