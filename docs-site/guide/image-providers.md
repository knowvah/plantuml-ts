# Remote images

Diagrams can reference remote images (`<img:https://…>`, `<img src="https://…">`).
`renderSync()` cannot fetch, so `render()` and friends take an
`imageProvider`: an object with `fetch(url): Promise<ImageFetchResult>` that
never rejects. Two ready-made providers ship in a separate entry point,
`@knowvah/plantuml-ts/image-providers`, so code that only uses the core never
loads network code.

```ts
interface ImageProvider {
  fetch(url: string): Promise<ImageFetchResult>;
}
type ImageFetchResult =
  | { bytes: Uint8Array; mimeType: string }
  | { blocked: string }   // policy refused the fetch
  | { failed: string };   // transport, size or timeout failure
```

## Node (and any host with `fetch`)

```ts
import { render } from '@knowvah/plantuml-ts';
import { createNetworkImageProvider } from '@knowvah/plantuml-ts/image-providers';

const imageProvider = createNetworkImageProvider({
  timeoutMs: 5000,          // default 5000
  maxBytes: 10 * 1024 * 1024, // default 10 MiB
  onWarning: (m) => console.warn(m),
});
const svg = await render(source, { imageProvider, securityProfile: 'INTERNET' });
```

Options: `timeoutMs`, `maxBytes`, `fetch` (transport, default `globalThis.fetch`)
and `onWarning` (called once per failed URL).

## Browser

```ts
import { createBrowserImageProvider } from '@knowvah/plantuml-ts/image-providers';

const imageProvider = createBrowserImageProvider({ onWarning: console.warn });
```

The browser provider checks the page's Content Security Policy before each
fetch and refuses URLs the policy would block, instead of provoking a console
violation. Options: `cspPolicy`, `timeoutMs` (default 5000), `maxBytes`
(default 10 MiB), `document`, `fetch`, `onWarning` (once per origin).

### Content Security Policy

The provider can only read policies delivered by `<meta http-equiv=
"Content-Security-Policy">`. **A policy delivered as an HTTP response header
is not readable from JavaScript.** If your page's CSP comes from a header,
pass it yourself, or the pre-check will see no policy and allow everything
(the browser still enforces the header and the fetch then fails):

```ts
createBrowserImageProvider({
  cspPolicy: "default-src 'self'; img-src 'self' https://cdn.example.com",
});
```

Several policies are comma-separated. A `securitypolicyviolation` event is
also observed so a block the pre-check missed is reported as a warning.

## Security profiles

The provider is only consulted for URLs the security profile admits. The
pre-fetch is gated by the profile's URL rule (`isUrlOk`), exactly as for
`!include`: `LEGACY` (default) allows public hosts on any port, `INTERNET`
ports 80/443, `ALLOWLIST` only `urlAllowlist` prefixes, and `SANDBOX` never
fetches. A refused URL renders as the jar's missing-image placeholder. Set a
restrictive profile when rendering untrusted source on a server. See
[Security](/guide/api#renderoptions) and the README's Security section.
