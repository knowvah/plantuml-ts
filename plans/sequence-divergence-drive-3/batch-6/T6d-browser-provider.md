# T6d — browser image provider with CSP pre-check

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6d`. Commit:
`feat(image-providers): add browser provider with CSP pre-check`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
Browser facts (MDN, verified 2026-10-22): a hidden `<img>` cannot supply bytes
— a cross-origin image drawn to a canvas taints it (`toDataURL`/`getImageData`
throw) and SVG source text is never exposed — so the provider uses `fetch()`
with `mode: 'cors'`, which needs the server's CORS header and the page's CSP
`connect-src`. JS cannot read a header-delivered CSP; it can read a
`<meta http-equiv="Content-Security-Policy">` policy, and the
`securitypolicyviolation` event reports blocks after the fact. Policy check
(W3C CSP Level 3, verified 2026-10-22): effective directive `connect-src`
falling back to `default-src` (§6.8.3 fetch directive fallback list; `connect-src`
§6.1.2); matching per §6.7.2.7 (url vs source list), §6.7.2.8 (url vs
expression), §6.7.2.9 scheme-part, §6.7.2.10 host-part (`*.` wildcard, any
depth), §6.7.2.11 port-part, §6.7.2.12 path-part; `'none'` matches nothing,
`'self'` the page origin, `*` any non-`data:`/`blob:`/`filesystem:` network
scheme, `http:` upgrade to `https:`. Meta restrictions §3.3 (policies from
meta apply from insertion on; `report-uri`, `frame-ancestors`, `sandbox` ignored).
Multiple policies: every one must allow (§6.7.2.x loop over the policy list).
Read the spec text for each section before coding; cite it in the `@see`.

## Targets
None in the corpus. Verified with stubbed `document`/`fetch`.

## Write-set
`src/image-providers/csp.ts` (pure matcher: `parseSourceList`,
`isUrlAllowedByPolicies(url, pageOrigin, policies, directive)`),
`src/image-providers/browser.ts`, tests
`tests/unit/image-providers/{csp,browser}.test.ts`.

## Read-set
CSP3 sections above (https://www.w3.org/TR/CSP3/); T6a's `image-provider.ts`;
`tests/unit/image-providers/network.test.ts` if T6c has landed (style only).

## Interface contracts
```ts
export interface BrowserProviderOptions {
  cspPolicy?: string;            // a header policy the page knows (not readable from JS)
  timeoutMs?: number;            // default 5000
  maxBytes?: number;             // default 10 * 1024 * 1024
  document?: Document;           // default globalThis.document; stubbed in tests
  fetch?: typeof fetch;
  onWarning?: (message: string) => void; // default console.warn
}
export function createBrowserImageProvider(options?: BrowserProviderOptions): ImageProvider;
```
Policies = every `<meta http-equiv="Content-Security-Policy" content>` in
`document.head` (read per call) plus `cspPolicy`. Blocked -> `{ blocked: reason }`
without fetching. The `securitypolicyviolation` listener (registered once on
`document`, `blockedURI`/`effectiveDirective`) warns for header-only blocks the
check could not see.

## Acceptance
- Given `connect-src 'self'` in a meta tag and `https://img.example/a.svg` from
  page origin `https://app.test`, then `{ blocked }`, `fetch` not called, and
  exactly one warning for that origin even across 3 calls.
- Given `default-src https://img.example` and no `connect-src`, then allowed
  (fallback); given `connect-src *.example.com`, `https://a.b.example.com/x`
  allowed, `https://example.com/x` blocked.
- Given a stubbed fetch that never settles and `timeoutMs: 20`, then
  `{ failed }` containing `timed out`; given a `securitypolicyviolation` event
  for `https://img.example/a.svg`, then one warning naming the origin.
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine (separate entry point).

## Observability
`onWarning` (default `console.warn`) is the output; one message per origin
per page, text: `plantuml-ts: image from <origin> blocked by Content-Security-
Policy directive <connect-src|default-src>; add <origin> to connect-src (or pass
a different imageProvider)`. Violation-event form: same text, prefixed
`(reported by the browser) `. No other console output.

## Rollback
Reversible.
