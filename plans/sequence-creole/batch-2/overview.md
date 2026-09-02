# Batch 2 — split every display on `\n`

One task, alone, and deliberately before any styling work (D4).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| C2 | split message labels and participant names on `\n` | typescript-pro | `text-block-geo.ts`, `sequence-layout-participants.ts`, `sequence-layout-events.ts`, tests | C1 | [ ] |

## Why it is alone, and why it is first

`\n` is an ELEMENT-count effect and markup is a CONTENT effect. They are
measured by different instruments — the cohort line versus the content census —
and landing them together makes both unreadable. That is exactly how the parent
mission's A4 shipped an unscaled run array without anyone noticing for a batch.

It is first because it is the largest single payoff in the mission: 75 fixtures
whose only root-child difference is `text`.

## Expect the cohort to RISE

This is the one task whose success is visible in `descended`. A rise is the
result; no change means the split did not reach the producers.
