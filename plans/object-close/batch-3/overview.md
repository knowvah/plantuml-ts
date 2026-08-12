# Batch 3 — close-out

Sequential. Nothing here changes rendering behavior; this batch makes the
record true and routes future readers correctly.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T7](T7-narrow-divergences.md) | Narrow the `DIVERGENCES.md` geometry entry (D2); add object-specific entries | technical-writer | `DIVERGENCES.md` | batch-2 | [ ] |
| [T8](T8-supersede-and-index.md) | Superseded banner on G3 (D5); update `planning/mission-index.md` | technical-writer | `plans/g3-object-svg/README.md`, `planning/mission-index.md` | T7 | [ ] |
| [T9](T9-final-census-and-filings.md) | File engine divergences (D6); final census; refreshed 80/80 table; mission summary | general-purpose | `docs/graphviz-issues/**` (incl. `TRACKER.md`), `plans/object-close/{ledger,README}.md` | T8 | [ ] |

## Note on the writer agent

`technical-writer` has no `Edit` or `Bash` tool — it rewrites whole files.
After T7 and T8, run `git diff --numstat` on the touched files and run the
gates yourself; do not assume a surgical edit.

## Batch exit

- `DIVERGENCES.md` no longer claims sub-pixel coverage for object geometry.
- A reader landing on G3's residue table is routed to this mission's ledger.
- `planning/mission-index.md` carries the corrected G3 row and the
  object-close row.
- Every filed engine divergence has both a `docs/graphviz-issues/*.md` and a
  `TRACKER.md` line.
- The mission summary states baseline (23/80), final census, and every
  remaining fixture's named disposition.
