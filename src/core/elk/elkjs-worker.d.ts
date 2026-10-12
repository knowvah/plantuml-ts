/**
 * elkjs ships no declaration for its worker module (only
 * `lib/elk-worker.d.ts`, for the non-minified file). Its exports are
 * narrowed at runtime by `elkjs-backend.ts#createElkjsBackend`, so they are
 * declared `unknown` here.
 */
declare module 'elkjs/lib/elk-worker.min.js' {
  export const Worker: unknown;
  const elkWorker: unknown;
  export default elkWorker;
}
