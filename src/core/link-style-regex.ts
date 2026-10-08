/**
 * The link line-style grammar shared by every engine whose arrows take a
 * `[#red,dashed]` style/colour bracket.
 *
 * @see net/sourceforge/plantuml/descdiagram/command/CommandLinkElement.java:71-83
 *   -- `KEY1`, `KEY2`, `LINE_STYLE`, `LINE_STYLE_MULTIPLES`.
 */
export const STYLE_KEY1: string = 'dotted|dashed|plain|bold|hidden|norank|single|node|thickness=\\d+';
export const STYLE_KEY2: string = ',dotted|,dashed|,plain|,bold|,hidden|,norank|,single|,node|,thickness=\\d+';
export const LINE_STYLE: string = `(?:#\\w+|${STYLE_KEY1})(?:,#\\w+|${STYLE_KEY2})*`;
export const LINE_STYLE_MULTIPLES: string = `${LINE_STYLE}(?:;${LINE_STYLE})*`;
