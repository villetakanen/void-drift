export class GameLoop {
	private running = false;
	private lastTime = 0;
	private callback: (dt: number) => void;

	constructor(callback: (dt: number) => void) {
		this.callback = callback;
	}

	start() {
		if (this.running) return;
		this.running = true;
		this.lastTime = performance.now();
		requestAnimationFrame(this.loop.bind(this));
	}

	stop() {
		this.running = false;
	}

	private loop(time: number) {
		if (!this.running) return;

		// Calculate Delta Time in Seconds
		const dt = (time - this.lastTime) / 1000;
		this.lastTime = time;

		// Cap dt to prevent huge jumps (e.g. if tab was backgrounded)
		const safeDt = Math.min(dt, 0.1);

		this.callback(safeDt);

		requestAnimationFrame(this.loop.bind(this));
	}
}
