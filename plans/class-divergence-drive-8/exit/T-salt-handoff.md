# T-salt: launch `/plan-mission salt-engine-port` (D10)

Agent: orchestrator. Run it **immediately** after T-exit's merge, in the same session.

## Task
Invoke the `plan-mission` skill with these arguments:

> salt-engine-port: port PlantUML's `@startsalt` engine (`net/sourceforge/plantuml/salt/`,
> `salt/element/`, `salt/factory/`; 62 files / 5,669 lines measured 2026-09-30) with a
> mindmap-engine-port-style harness (render-fixture-salt.ts, golden + diff-baseline
> ratchets pinned from the routed salt bucket before any drawing lands). Seed rows:
> unknown/lubicu-73-fule059, class/bixogo-47-xulu385, class/roxosu-00-pini153 (nested
> `{{salt}}` embeds; our nested render is the 300×60 "unknown diagram type" box). Wire the
> description note seam `note-layout-measure-rows.ts:220-226` `UNWIRED_NESTED_RENDERER`.
> Context: `planning/next-missions.md` "salt-engine-port — proposed" and the cdd8 section.

The planning phases need the maintainer's confirmations, so this is the point where the
autonomous run hands back to the interactive session.

## Acceptance
- Given T-exit merged, then `/plan-mission salt-engine-port` has started, with the seed
  rows above in its first message.
