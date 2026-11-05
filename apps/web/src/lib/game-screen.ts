export const GAME_HEIGHT = 1080;
export const GAME_GUTTER = GAME_HEIGHT / 6;

/** Screen geometry only; camera framing and control layout consume these bounds. */
export function fitGameScreen(width: number, height: number) {
	const ratio = Math.max(4 / 3, Math.min(16 / 9, width / Math.max(1, height)));
	const logicalWidth = GAME_HEIGHT * ratio;
	const scale = Math.max(
		0,
		Math.min(width / logicalWidth, height / GAME_HEIGHT),
	);
	return {
		width: logicalWidth * scale,
		height: GAME_HEIGHT * scale,
		logicalWidth,
		gutter: GAME_GUTTER * scale,
		activeWidth: logicalWidth - GAME_GUTTER * 2,
	};
}
