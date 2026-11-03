/** Work is bounded across a whole scene; activation has its own reserved allowance. */
export class FxBudget {
	static readonly DECORATION = 1024;
	static readonly ESSENTIAL = 128;
	decoration = 0;
	essential = 0;
	dropped = 0;
	reset() {
		this.decoration = this.essential = this.dropped = 0;
	}
	take(essential = false) {
		if (
			essential
				? this.essential < FxBudget.ESSENTIAL
				: this.decoration < FxBudget.DECORATION
		) {
			if (essential) this.essential++;
			else this.decoration++;
			return true;
		}
		this.dropped++;
		return false;
	}
}

/** Shared emission budget and view culling inside the persistent light surface. */
export class FxPass {
	readonly budget = new FxBudget();
	opacity = 1;
	private a = 1;
	private b = 0;
	private c = 0;
	private d = 1;
	private e = 0;
	private f = 0;
	private width = 0;
	private height = 0;
	begin(ctx: CanvasRenderingContext2D, additive = true, opacity = 1) {
		this.budget.reset();
		this.opacity = opacity;
		const transform = ctx.getTransform();
		this.a = transform.a;
		this.b = transform.b;
		this.c = transform.c;
		this.d = transform.d;
		this.e = transform.e;
		this.f = transform.f;
		this.width = ctx.canvas.width;
		this.height = ctx.canvas.height;
		ctx.save();
		ctx.globalCompositeOperation = additive ? "lighter" : "source-over";
		ctx.globalAlpha = 1;
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
		ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
		ctx.filter = "none";
	}
	visible(x: number, y: number, radius: number) {
		const px = this.a * x + this.c * y + this.e;
		const py = this.b * x + this.d * y + this.f;
		const rx = radius * (Math.abs(this.a) + Math.abs(this.c));
		const ry = radius * (Math.abs(this.b) + Math.abs(this.d));
		return (
			px + rx >= 0 &&
			py + ry >= 0 &&
			px - rx <= this.width &&
			py - ry <= this.height
		);
	}
	end(ctx: CanvasRenderingContext2D) {
		ctx.restore();
	}
}

/** Cheap palette tricks; these colours belong to transient light, not UI roles. */
export const FX_INK = {
	core: "#eafff9",
	ion: "#70ffe2",
	heavy: "#70e2ff",
	fire: "#ffb340",
	gravity: "#b982ff",
} as const;

export function paintArc(
	ctx: CanvasRenderingContext2D,
	radius: number,
	phase: number,
) {
	ctx.beginPath();
	ctx.arc(0, 0, radius, -1.1 + phase, 1.1 + phase);
	ctx.stroke();
}

interface Spark {
	x: number;
	y: number;
	vx: number;
	vy: number;
	age: number;
	life: number;
}
/** Bounded detached sparks for impacts/fire. A burst never queues future work. */
export class FxSparks {
	static readonly CAPACITY = 256;
	private readonly pool: Spark[] = Array.from(
		{ length: FxSparks.CAPACITY },
		() => ({ x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1 }),
	);
	private used = 0;
	get count() {
		return this.used;
	}
	clear() {
		this.used = 0;
	}
	burst(x: number, y: number, count: number, seed: number) {
		const available = Math.min(
			Math.max(0, Math.floor(count)),
			FxSparks.CAPACITY - this.used,
		);
		for (let i = 0; i < available; i++) {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			const angle = (seed / 4294967296) * Math.PI * 2;
			const speed = 18 + (seed % 80);
			const spark = this.pool[this.used++];
			spark.x = x;
			spark.y = y;
			spark.vx = Math.cos(angle) * speed;
			spark.vy = Math.sin(angle) * speed;
			spark.age = 0;
			spark.life = 0.25 + (seed % 40) / 100;
		}
	}
	step(dt: number) {
		if (!(dt > 0) || !Number.isFinite(dt)) return;
		for (let i = this.used - 1; i >= 0; i--) {
			const p = this.pool[i];
			p.age += dt;
			if (p.age >= p.life) {
				this.pool[i] = this.pool[--this.used];
				this.pool[this.used] = p;
			} else {
				p.x += p.vx * dt;
				p.y += p.vy * dt;
			}
		}
	}
	draw(ctx: CanvasRenderingContext2D, pass: FxPass) {
		ctx.save();
		ctx.fillStyle = FX_INK.fire;
		for (let i = 0; i < this.used; i++) {
			const p = this.pool[i];
			if (!pass.visible(p.x, p.y, 3) || !pass.budget.take()) continue;
			ctx.globalAlpha = pass.opacity;
			ctx.fillRect(p.x, p.y, 1.5, 1.5);
		}
		ctx.restore();
	}
}
