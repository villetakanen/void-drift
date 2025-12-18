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

  /**
   * Returns the effective input state with optional control inversion.
   * When inverted, left/right thruster inputs are swapped.
   */
  getEffectiveState(invertControls: boolean = false): InputState {
    if (!invertControls) {
      return this.state;
    }
    return {
      leftThruster: this.state.rightThruster,
      rightThruster: this.state.leftThruster,
      fire: this.state.fire,
    };
  }

  private activeTouches = new Map<number, "left" | "right">();

  constructor() {
    // Keyboard
    window.addEventListener("keydown", this.handleKey.bind(this));
    window.addEventListener("keyup", this.handleKey.bind(this));

    // Touch
    window.addEventListener("touchstart", this.handleTouch.bind(this), {
      passive: false,
    });
    window.addEventListener("touchmove", this.handleTouch.bind(this), {
      passive: false,
    });
    window.addEventListener("touchend", this.handleTouch.bind(this), {
      passive: false,
    });
    window.addEventListener("touchcancel", this.handleTouch.bind(this), {
      passive: false,
    });
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
      case "Enter":
        this.state.fire = isDown;
        break;
    }
  }

  private handleTouch(e: TouchEvent) {
    // Prevent default browser zooming/scrolling
    if (e.cancelable) e.preventDefault();

    const halfWidth = window.innerWidth / 2;

    // Reset loop
    // Note: Touch events like 'touchmove' list ALL active touches.
    // 'touchstart' lists all + changed.
    // We can just rebuild state from e.touches every frame for simplicity.

    let leftActive = false;
    let rightActive = false;

    // Iterate all active touches currently on screen
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.clientX < halfWidth) {
        leftActive = true;
      } else {
        rightActive = true;
      }
    }

    this.state.leftThruster = leftActive;
    this.state.rightThruster = rightActive;

    // Double tap logic for Fire could be added here,
    // but for now relying on Spacebar/Enter for Desktop
    // and maybe 'Both Fingers' for Thrust covers the main movement.
    // Spec said Double Tap = Fire.

    // Implementing simple double tap detection?
    // Let's stick to movement first as per PBI requirements prioritization.
    // Actually PBI 2.1 says: Tape Left -> Rotate Left, Right -> Rotate Right, Both -> Thrust.
    // This is covered by:
    // leftThruster = true -> Physics handles rotation/thrust
    // rightThruster = true -> Physics handles rotation/thrust
    // Both true -> Physics handles forward thrust.
    // So the Input mapping above is correct.
    // Fire (Antimatter) is an extra.
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKey.bind(this));
    window.removeEventListener("keyup", this.handleKey.bind(this));
    window.removeEventListener("touchstart", this.handleTouch.bind(this));
    window.removeEventListener("touchmove", this.handleTouch.bind(this));
    window.removeEventListener("touchend", this.handleTouch.bind(this));
    window.removeEventListener("touchcancel", this.handleTouch.bind(this));
  }
}
