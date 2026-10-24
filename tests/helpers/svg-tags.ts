/**
 * Style-insensitive reads of emitted SVG tags. The klimt drivers write the
 * jar's `style="stroke:..;stroke-width:..;"` form where the string emitters
 * wrote presentation attributes; a test that asserts a VALUE (not a spelling)
 * reads the tag through {@link attrsOf}, which expands `style` into the same
 * name/value pairs (the canonical form of `svg-hashes.mts --canon`).
 */

/** One tag's attributes, `style` declarations expanded. */
export type TagAttrs = Readonly<Record<string, string>>;

/** The attributes of one opening tag (`<line x1=".." style=".."/>`). */
export function attrsOf(tag: string): TagAttrs {
  const out: Record<string, string> = {};
  for (const [, name, value] of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    if (name === 'style') {
      for (const decl of value!.split(';')) {
        const at = decl.indexOf(':');
        if (at > 0) out[decl.slice(0, at).trim()] = decl.slice(at + 1).trim();
      }
    } else out[name!] = value!;
  }
  return out;
}

/** Every `<name ...>` opening tag of `svg`, in document order. */
export function tagsOf(svg: string, name: string): TagAttrs[] {
  return [...svg.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => attrsOf(m[0]));
}
