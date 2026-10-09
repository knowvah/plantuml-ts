/**
 * isw-T2-act F5: a diamond's label nodes carry whether their block was
 * built with the style `wrapWidth()` (`DiamondText`, `gtile-diamond-inside.ts`),
 * so the draw rebuilds the block the layout measured.
 */
export function wrappedSpread(diamond: { readonly wrapped: boolean }): { wrapped?: true } {
  return diamond.wrapped ? { wrapped: true } : {};
}
