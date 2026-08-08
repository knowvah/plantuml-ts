# Batch 3 — Close-out

Normal gate. Both tasks assume batch-2d is green.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T14 | Diagnose the no-SVG fixture | debugger | `.agent-notes/`, fixture/ratchet only if warranted | T9 | [ ] |
| T15 | Docs + version (ADR-6) | technical-writer | `DIVERGENCES.md`, `CHANGELOG.md`, `package.json`, `oracle/pin.json` | T14 | [ ] |

T15 follows T14 so the pin note can state the fixture's real disposition
rather than "one unexplained failure".

## Writer-agent caveat

`technical-writer` has no Edit or Bash tool — it rewrites whole files. After
T15, run `git diff --numstat` on its write-set to confirm it did not drop
existing content, and **run the gates yourself**; the agent cannot.
