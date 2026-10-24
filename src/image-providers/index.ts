/**
 * Public entry for `@knowvah/plantuml-ts/image-providers` (decisions.md D3).
 * A separate bundle so core consumers never load network code.
 */
export type { ImageFetchResult, ImageProvider } from '../core/image-provider.js';
export { createNetworkImageProvider } from './network.js';
export type { NetworkProviderOptions } from './network.js';
export { createBrowserImageProvider } from './browser.js';
export type {
  BrowserDocumentLike,
  BrowserMetaLike,
  BrowserProviderOptions,
  BrowserViolationEventLike,
} from './browser.js';
