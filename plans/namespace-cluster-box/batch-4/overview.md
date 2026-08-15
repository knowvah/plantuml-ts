# Batch 4 — the title position

## Gate: SATISFIED

Needs `ClusterGeometry.label` from `@knowvah/dot-engine`. **Shipped in
1.5.0** (published 2026-08-15), verified against the published
`dist/api/geometry.d.ts`:

```ts
export interface ClusterGeometry {
  name: string;
  x: number; y: number; width: number; height: number;
  /** x/y are the CENTRE of the label space, not the box corner. */
  label?: { x: number; y: number; width: number; height: number };
}
```

The repo is on `^1.4.0`; T7 bumps it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T7](T7-title-position.md) | Read the cluster title position from the snapshot instead of re-measuring | typescript-pro | `package.json`, `src/core/graph-layout.ts`, `graph-layout.types.ts`, `class-geo-builders.ts`, tests | T5 | [x] |

## The trap in this batch

`ClusterGeometry` will carry **three coordinate conventions in one object**,
per the resolution note on the issue:

- the cluster box's `x`/`y` is a **corner**;
- `label.x`/`label.y` is the label's **centre**;
- `render()`'s `<text>` carries a **baseline**.

Convert deliberately and assert the conversion in a test. Getting this wrong
produces a title off by half its own height, which reads as a font-metric
bug and will send the next reader after the wrong thing.

Also note: the issue as filed asked for presence to be gated on the label's
`set` flag. That was deliberately NOT implemented, because C draws cluster
labels on existence alone (`emit.c:3920` has no `->set` test, unlike
`emit_edge_label:2891`). Do not write code expecting `set` semantics.

## Batch exit criteria

- All four gates green.
- T1's harness shows both headline numbers at or above the end of Batch 3.
- The title-position conversion is asserted by a test, not just observed.
