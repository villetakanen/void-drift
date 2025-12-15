import type { GameObject } from "./Physics";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;
        this.resize(canvas.width, canvas.height);
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
    }

    clear() {
        this.ctx.fillStyle = "var(--color-void, #000)";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawShip(ship: GameObject) {
        const { ctx } = this;
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.rotate(ship.rotation);

        // Ship Shape (Paper Airplane)
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 0); // Nose
        ctx.lineTo(-8, 8); // Back Right
        ctx.lineTo(-4, 0); // Engine Indent
        ctx.lineTo(-8, -8); // Back Left
        ctx.closePath();
        ctx.stroke();

        // Thrust Flames (if needed, logic can pass thrust state later)
        // For now just draw the ship

        ctx.restore();
    }
}
