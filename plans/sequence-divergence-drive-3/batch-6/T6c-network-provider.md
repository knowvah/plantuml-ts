# T6c — network image provider

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6c`. Commit:
`feat(image-providers): add fetch-based network provider`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
Upstream fetches in `SURL#getBytes` (`SURL.java:325-345`, proxy/auth variant
`:395-428`) bounded by the security profile's timeout
(`SecurityProfile.java:158-176`, ported `security/SecurityProfile.ts:60`
`getTimeout`). Browser-safe port: a provider in a separate entry point
(D3), the only place network code may live (`src/image-providers/` is the
contract's exception). Global `fetch` GET; `AbortController` timeout; size
cap; no retries, no redirects policy beyond `fetch` defaults.

## Targets
None in the corpus (production provider). Verified by mocked-`fetch` tests.

## Write-set
`src/image-providers/network.ts`, `tests/unit/image-providers/network.test.ts`.

## Read-set
`SURL.java:325-345`; `SecurityProfile.java:158-176`; T6a's `image-provider.ts`.

## Interface contracts
```ts
export interface NetworkProviderOptions {
  timeoutMs?: number;            // default 5000 (D3)
  maxBytes?: number;             // default 10 * 1024 * 1024
  fetch?: typeof fetch;          // default globalThis.fetch; injected in tests
  onWarning?: (message: string) => void;
}
export function createNetworkImageProvider(options?: NetworkProviderOptions): ImageProvider;
```
Never rejects: HTTP non-2xx -> `{ failed: 'HTTP <status> for <url>' }`; abort ->
`{ failed: 'timed out after <ms> ms: <url>' }`; over the cap (Content-Length
or streamed total) -> `{ failed: 'exceeds <maxBytes> bytes: <url>' }`; thrown
network error -> `{ failed: '<message>: <url>' }`. Success carries
`mimeType` from `Content-Type` (parameters stripped, default
`application/octet-stream`).

## Acceptance
- Given a mocked `fetch` returning 200 `image/svg+xml` and 12 bytes, then
  `{ bytes (12), mimeType: 'image/svg+xml' }`.
- Given a `fetch` that never settles and `timeoutMs: 20`, then it resolves
  `{ failed }` containing `timed out after 20 ms` and the signal was aborted.
- Given a 404, or a body past `maxBytes`, then `{ failed }` with the messages
  above and `onWarning` called once with the same text.
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine (entry point not imported by the core).

## Observability
The `onWarning` text IS the output: exactly the `failed` reason, prefixed
`plantuml-ts network image provider: `; one call per failed url, none on
success; no `console.*` calls.

## Rollback
Reversible.
