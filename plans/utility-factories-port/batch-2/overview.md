# Batch 2: registration in upstream order + the main pin close

One task, then the standard close with pins **and** the batch-2 extras (residual families →
batch-3 specs; dashboard family).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-registration.md) | register every utility plugin at its `PSystemBuilder` position; measure the 17 rows; whole-corpus hash diff; residual families | typescript-pro (opus) | `src/index.ts` (registration lines + imports), `tests/unit/utility-registration.test.ts`, `measurements/T2a/**` | batches 1a, 1b | [x] |

Close: `../close-procedure.md` steps 1–11 with step 8's pins, `repin-utility-routing --write
--fix-records`, `repin-utility-baseline --write`, the count bumps, then the batch-2 extras.
