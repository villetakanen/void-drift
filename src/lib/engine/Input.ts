export interface InputState {
	leftThruster: boolean;
	rightThruster: boolean;
	fire: boolean;
}

export class Input {
	public state: InputState = {
		leftThruster: false,
		rightThruster: false,
		fire: false,
	};

	constructor() {
		window.addEventListener("keydown", this.handleKey.bind(this));
		window.addEventListener("keyup", this.handleKey.bind(this));
	}

	private handleKey(e: KeyboardEvent) {
		const isDown = e.type === "keydown";
		switch (e.code) {
			case "KeyA":
			case "ArrowLeft":
				this.state.leftThruster = isDown;
				break;
			case "KeyD":
			case "ArrowRight":
				this.state.rightThruster = isDown;
				break;
			case "Space":
				this.state.fire = isDown;
				break;
		}
	}

	destroy() {
		window.removeEventListener("keydown", this.handleKey.bind(this));
		window.removeEventListener("keyup", this.handleKey.bind(this));
	}
}
