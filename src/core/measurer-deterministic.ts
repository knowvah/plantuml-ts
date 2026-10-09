/**
 * Deterministic string measurer (dual-measurer conformance/ratchet seam).
 *
 * The conformance oracle corpus (`test-results/dot-cache/**\/in.svg`) is
 * captured with PlantUML's jar run under `-DPLANTUML_DETERMINISTIC_TEXT=true`
 * (`FileFormat.SVG_DETERMINISTIC`), which routes ALL text measurement
 * through `StringBounderFromWidthTable` — a completely different
 * text-metric system from the AWT font metrics `jarMeasurer` (D12)
 * reproduces for production. Two different metric systems can never agree
 * pixel-for-pixel, so comparing production (AWT) output against the
 * deterministic-mode oracle can never reach zero-diff on text-sized
 * geometry, no matter how faithful the rest of the port is.
 *
 * Maintainer decision (DUAL MEASURER, decision-journal 2026-07-10):
 * production keeps `jarMeasurer` (D12 intact — real-AWT fidelity is the
 * product). A SEPARATE deterministic measurer is injected ONLY for the
 * conformance/ratchet render path, so that path measures text in the SAME
 * system the oracle used to produce its goldens — making node/text geometry
 * assertable instead of perpetually tolerant.
 *
 * This module does not re-port `StringBounderFromWidthTable` +
 * `UnicodeFontWidthSansSerif` a second time — that port already exists as
 * `WidthTableMeasurer` (`measurer.ts`, backed by `measurer-width-table.data.ts`),
 * which stays the VERBATIM port of the table (including its U+0020 = 0).
 * `DeterministicMeasurer` extends it and overrides exactly one thing: the
 * width of U+0020, matching the oracle jar's seam #4
 * (`FileFormat.getDefaultStringBounder`, patch
 * `oracle/patches/0004-oracle-space-width.patch`).
 *
 * ## Why the space differs from the table (D1)
 *
 * The table gives U+0020 width 0 (`UnicodeFontWidthSansSerif.java` block 0,
 * index 0x20). That is an instrument artefact: a lone space measures
 * zero-wide, which crashes `SlotFinder` (`Slot.java:44-45`, `start >= end`).
 * The table's own entries for the identical advance — U+0021 `!` and U+00A0
 * NO-BREAK SPACE — are 44 tenths of a 16 pt em, and so are Helvetica
 * (Adobe Core14 AFM: `C 32 ; WX 278 ; N space`, `C 33 ; WX 278 ; N exclam`)
 * and Arial (569/2048 for all three). Space = 44 -> 4.4 px at 16 pt, 3.3 px
 * at 12 pt. Only U+0020 changes; block 0's other zeros (0x09-0x0D, 0x1D,
 * 0xAD) stay 0.
 *
 * Re-verified against the real jar (2026-07-10, `-DPLANTUML_DETERMINISTIC_TEXT=true`,
 * `plantuml-1.2026.7beta3.jar`, openjdk 21.0.1) as part of this task's own
 * charter to verify the port, not just trust the prior mission's tests:
 *
 *   | text          | size | jar textLength | DeterministicMeasurer width |
 *   |---------------|------|-----------------|------------------------------|
 *   | "Component"   | 14   | 72.3625         | 72.3625 (exact)              |
 *   | "comp1"       | 14   | 42              | 42 (exact)                   |
 *   | "A"           | 14   | 9.3625          | 9.3625 (exact)                |
 *   | "\u{1F600}"   | 14   | 14              | 14 (exact, AFTER this task's |
 *   |               |      |                 | getCharWidth fallback fix)   |
 *   | "Ａ"      | 14   | 11.375          | 11.375 (exact, AFTER fix)    |
 *
 * The last two rows caught a real, pre-existing divergence in
 * `WidthTableMeasurer.charWidth`'s two fallback branches (`cp >= 0xFFFF`,
 * `block >= table.length`): they divided the raw upstream literals (16, 13)
 * by 10, but `StringBounderFromWidthTable.getCharWidth`'s own fallback
 * branches do NOT divide (only `UnicodeBlock.getWidth`'s normal path does)
 * — verified against the jar and fixed in `measurer.ts` as part of this
 * task (see that file's `WidthTableMeasurer.charWidth` doc comment).
 */
import { WidthTableMeasurer } from './measurer.js';
import type { FontSpec } from './measurer.js';

/** Width of U+0020 in tenths of a 16 pt em (D1). */
export const SPACE_WIDTH_TENTHS = 44;

/** `StringBounderFromWidthTable.REFERENCE_SIZE` (`StringBounderFromWidthTable.java:56`). */
const REFERENCE_SIZE = 16;

/**
 * The deterministic-mode measurer: `WidthTableMeasurer` with U+0020 = 44.
 *
 * Mirrors the oracle's seam #4 arithmetic exactly: the table width, then
 * `+ spaces * 4.4 * size / 16` (the anonymous subclass in
 * `FileFormat.getDefaultStringBounder`, `calculateDimension` override).
 *
 * @see oracle/patches/0004-oracle-space-width.patch (seam #4)
 * @see WidthTableMeasurer
 */
export class DeterministicMeasurer extends WidthTableMeasurer {
  override measure(text: string, font: FontSpec): { width: number; height: number } {
    const base = super.measure(text, font);
    let spaces = 0;
    for (const ch of text) if (ch === ' ') spaces++;
    if (spaces === 0) return base;
    return {
      width: base.width + (spaces * (SPACE_WIDTH_TENTHS / 10) * font.size) / REFERENCE_SIZE,
      height: base.height,
    };
  }
}
