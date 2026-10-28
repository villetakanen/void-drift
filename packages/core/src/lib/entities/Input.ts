export interface InputState {
	leftThruster: boolean;
	rightThruster: boolean;
	fire: boolean;
}
export class Input {
	readonly state: InputState = {
		leftThruster: false,
		rightThruster: false,
		fire: false,
	};
	private effective: InputState = {
		leftThruster: false,
		rightThruster: false,
		fire: false,
	};
	private keys = new Set<string>();
	private pointers = new Map<number, "left" | "right">();
	constructor(private targetElement?: HTMLElement) {
		window.addEventListener("keydown", this.handleKey);
		window.addEventListener("keyup", this.handleKey);
		window.addEventListener("blur", this.reset);
		document.addEventListener("visibilitychange", this.visibility);
		targetElement?.addEventListener("pointerdown", this.pointerDown);
		targetElement?.addEventListener("pointerup", this.pointerUp);
		targetElement?.addEventListener("pointercancel", this.pointerUp);
		targetElement?.addEventListener("lostpointercapture", this.pointerUp);
	}
	private handleKey = (event: KeyboardEvent) => {
		if (
			event.target instanceof HTMLElement &&
			event.target.closest("input,select,textarea")
		)
			return;
		if (
			!["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "KeyW"].includes(
				event.code,
			)
		)
			return;
		event.preventDefault();
		if (event.type === "keydown") this.keys.add(event.code);
		else this.keys.delete(event.code);
		this.sync();
	};
	private pointerDown = (event: PointerEvent) => {
		if (!this.targetElement) return;
		const rect = this.targetElement.getBoundingClientRect();
		this.targetElement.setPointerCapture(event.pointerId);
		this.setPointer(
			event.pointerId,
			event.clientX < rect.left + rect.width / 2 ? "left" : "right",
		);
	};
	private pointerUp = (event: PointerEvent) =>
		this.setPointer(event.pointerId, null);
	private visibility = () => {
		if (document.hidden) this.reset();
	};
	setPointer(id: number, side: "left" | "right" | null) {
		if (side) this.pointers.set(id, side);
		else this.pointers.delete(id);
		this.sync();
	}
	private sync() {
		const both = this.keys.has("ArrowUp") || this.keys.has("KeyW");
		this.state.leftThruster =
			both || this.keys.has("KeyA") || this.keys.has("ArrowLeft");
		this.state.rightThruster =
			both || this.keys.has("KeyD") || this.keys.has("ArrowRight");
		for (const side of this.pointers.values()) {
			if (side === "left") this.state.leftThruster = true;
			else this.state.rightThruster = true;
		}
	}
	reset = () => {
		this.keys.clear();
		this.pointers.clear();
		this.sync();
	};
	getEffectiveState(invert = false) {
		this.effective.leftThruster = invert
			? this.state.rightThruster
			: this.state.leftThruster;
		this.effective.rightThruster = invert
			? this.state.leftThruster
			: this.state.rightThruster;
		return this.effective;
	}
	destroy() {
		this.reset();
		window.removeEventListener("keydown", this.handleKey);
		window.removeEventListener("keyup", this.handleKey);
		window.removeEventListener("blur", this.reset);
		document.removeEventListener("visibilitychange", this.visibility);
		this.targetElement?.removeEventListener("pointerdown", this.pointerDown);
		this.targetElement?.removeEventListener("pointerup", this.pointerUp);
		this.targetElement?.removeEventListener("pointercancel", this.pointerUp);
		this.targetElement?.removeEventListener(
			"lostpointercapture",
			this.pointerUp,
		);
	}
}
