/**
 * assemble-svg-splice.ts -- the two content-`<g>` splices the per-engine
 * finalize functions of `assemble-svg.ts` share. Moved out of that file
 * unchanged (500-line hook cap, sdd2-T7f) so `assemble-svg-sequence.ts` can
 * import them without a module cycle.
 */

/** The outer `<g>`'s open tag, bare (`<g>`) or attributed
 *  (`core/svg.ts#ROOT_GROUP_OPEN`, which `document-shell.ts
 *  #withRootGroupAttributes` upgrades it to further down the pipeline).
 *  Matched structurally rather than against a literal so a splice cannot
 *  start silently no-op'ing the day the root attribute list changes again.
 *  Built from a string, not a regex literal (the complexity hook miscounts
 *  `<`/`>`). Shared by class's `spliceAsFirstChild` and json's
 *  `spliceIntoContentGroup` below -- both need "find the content `<g>`'s
 *  own open tag", just with a different fallback when it is absent. */
export const CONTENT_G_OPEN_RE = new RegExp('^<g(?:\\s[^>]*)?>');

/** Splices `child` in as the FIRST child of `body`'s outer `<g>` --
 *  equivalent to, but avoiding re-parsing/re-serializing, a full XML
 *  insert. THROWS rather than returning `body` unchanged when there is no
 *  outer `<g>`: every caller here has already guaranteed one (class's own
 *  wrap-if-needed below, or `chrome.ts#applyChrome`'s), so a miss means the
 *  guarantee broke, and a silently-dropped background/border rect is far
 *  harder to notice than a thrown error. */
export function spliceAsFirstChild(body: string, child: string): string {
  const openTag = CONTENT_G_OPEN_RE.exec(body)?.[0];
  if (openTag === undefined) {
    throw new Error('finalizeClassBody: fragment body is not wrapped in an outer <g> element');
  }
  return openTag + child + body.slice(openTag.length);
}

/**
 * Put `markup` immediately after the already-wrapped body's opening `<g>`.
 * An ANNOTATED diagram arrives here pre-wrapped by `applyChrome`; unlike
 * state (above), json still draws the background rect for this case
 * (`yaml/tadari-70-nare798`, `!theme amiga` + `title foo`, jar draws the
 * rect as the FIRST child of the content group, ahead of the title's own
 * `<g class="title">`). Falls back to prefixing if the body is not a `<g>`
 * at all, which keeps the rect in the document rather than silently
 * dropping it.
 */
export function spliceIntoContentGroup(body: string, markup: string): string {
  if (markup === '') return body;
  const openTag = CONTENT_G_OPEN_RE.exec(body)?.[0];
  if (openTag === undefined) return markup + body;
  return openTag + markup + body.slice(openTag.length);
}
