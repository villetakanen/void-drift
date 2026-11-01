/**
 * Canvas mirror of the CSS type roles in styles/tokens.css.
 * Canvas cannot read custom properties, so the family strings are duplicated
 * here and kept equal by scripts/check-contracts.mjs.
 */
export const FONT_FAMILY_UI =
	'"B612 Mono", ui-monospace, SFMono-Regular, Consolas, monospace';
export const FONT_FAMILY_PROSE = '"Noto Sans", system-ui, sans-serif';

/** A `ctx.font` value in the ui role. B612 Mono ships 400 and 700 only. */
export function canvasFont(sizePx: number, weight: 400 | 700 = 400): string {
	return `${weight} ${sizePx}px ${FONT_FAMILY_UI}`;
}

/**
 * Resolves once the ui faces canvas text uses are loaded. Canvas text does not
 * trigger webfont loading, so one-shot drawings redraw after this settles.
 */
export async function loadCanvasFonts(): Promise<void> {
	if (typeof document === "undefined" || !document.fonts) return;
	await Promise.allSettled([
		document.fonts.load(canvasFont(16, 400)),
		document.fonts.load(canvasFont(16, 700)),
	]);
}
