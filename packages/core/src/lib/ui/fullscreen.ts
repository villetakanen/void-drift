/**
 * Request fullscreen mode for a specific element.
 * Handles cross-browser prefixes for Safari/iOS support.
 */
export async function requestFullscreen(element: HTMLElement): Promise<void> {
    try {
        if (element.requestFullscreen) {
            await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
            /* Safari/iOS support */
            await (element as any).webkitRequestFullscreen();
        } else if ((element as any).msRequestFullscreen) {
            /* IE11 support */
            await (element as any).msRequestFullscreen();
        }
    } catch (err) {
        console.warn("Fullscreen request failed:", err);
    }
}

/**
 * Check if the document is currently in fullscreen mode.
 */
export function isFullscreen(): boolean {
    return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    );
}

/**
 * Exit fullscreen mode.
 */
export async function exitFullscreen(): Promise<void> {
    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
        }
    } catch (err) {
        console.warn("Exit fullscreen failed:", err);
    }
}
