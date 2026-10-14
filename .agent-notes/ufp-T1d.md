## Observation: PNG internal sprites resolve but do not draw
- **Context**: porting listsprite (PSystemListArchimateSprites)
- **Finding**: internal-sprite-store.ts#pngDimensions returns dims-only; SpriteImage.java:60-100 drawing unported. First mismatching row is the first PNG row (`access`); height 656 vs jar 667.
- **Impact**: xucoma-93 cannot reach zero diffs until SpriteImage is ported.
- **Confidence**: High
