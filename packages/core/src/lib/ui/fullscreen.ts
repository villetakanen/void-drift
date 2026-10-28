type FullscreenElement = HTMLElement & {
	webkitRequestFullscreen?: () => Promise<void>;
};
type FullscreenDocument = Document & {
	webkitFullscreenElement?: Element;
	webkitExitFullscreen?: () => Promise<void>;
};
export async function requestFullscreen(element: HTMLElement): Promise<void> {
	try {
		const target = element as FullscreenElement;
		if (target.requestFullscreen) await target.requestFullscreen();
		else await target.webkitRequestFullscreen?.();
	} catch (error) {
		console.warn("Fullscreen unavailable:", error);
	}
}
export function isFullscreen(): boolean {
	const target = document as FullscreenDocument;
	return Boolean(target.fullscreenElement || target.webkitFullscreenElement);
}
export async function exitFullscreen(): Promise<void> {
	try {
		const target = document as FullscreenDocument;
		if (target.exitFullscreen) await target.exitFullscreen();
		else await target.webkitExitFullscreen?.();
	} catch (error) {
		console.warn("Fullscreen exit unavailable:", error);
	}
}
