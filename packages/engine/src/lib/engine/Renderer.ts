import { type GameObject, type Star } from "./Physics";
import { drawShip } from "../renderers/ship";
import { drawStar } from "../assets/star";


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
        this.ctx.fillStyle = "#050510"; // --color-void
        this.ctx.fillRect(0, 0, this.width, this.height);
    }


    drawShip(ship: GameObject) {
        drawShip(this.ctx, {
            x: ship.pos.x,
            y: ship.pos.y,
            rotation: ship.rotation,
            color: "#00ffcc" // Default game color
        });
    }

    drawStar(star: Star, time: number) {
        drawStar(this.ctx, {
            x: star.pos.x,
            y: star.pos.y,
            radius: star.radius,
            color: star.color,
            time: time,
            pulseSpeed: 1.0
        });
    }
}

