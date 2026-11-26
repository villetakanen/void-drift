// Void Drift fission study: a small copy of the layer stack, Canvas 2D only.
// World (normal) -> FX (accumulating, screen) -> FX glow (1/8 res, blur 12px, 90%, screen) -> LFX (hard-light)
const S = 2;                       // device px per world unit in these images
const FADE = 1 - Math.pow(0.5, 1 / 6); // half-life 0.1 s at 60 Hz
const BG = 'rgb(5,5,16)';          // lch(1.57% 4.76 285.25)
const W = [255, 255, 255];
const FXH = [200, 255, 190], FXG = [96, 224, 72], FXD = [30, 150, 48]; // FX stamp colours, authored for additive clipping
const MINT = [112, 255, 226], MINTC = [234, 255, 249];

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
const HL = c => c.map(v => Math.round((v + 255) / 2)); // LFX source that displays as c over the void
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function soft(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(.35, rgba(col, a * .55)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
function disc(c, x, y, r, col, a) { c.fillStyle = rgba(col, a); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
function ring(c, x, y, r, w, col, a) { c.strokeStyle = rgba(col, a); c.lineWidth = w; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); }
function sector(c, x, y, r0, r1, a0, a1, col, a) { c.fillStyle = rgba(col, a); c.beginPath(); c.arc(x, y, r1, a0, a1); c.arc(x, y, r0, a1, a0, true); c.closePath(); c.fill(); }
function line(c, x, y, ang, len, col, a, w) { c.strokeStyle = rgba(col, a); c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.stroke(); }
function poly(c, pts, fill) { c.fillStyle = fill; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); }

// ---------- ships (World layer) ----------
const HULL = ['#c8f4f0', '#83c7d0', '#6193a9', '#437e99', '#365d79', '#264d6b'];
const CHAR = ['#686c80', '#565a6e', '#474a5c', '#3a3d4e', '#2e3142', '#252838'];
const SIL = [[18, 0], [-14, -14], [-20, -8], [-20, 8], [-14, 14]];
function drawFighter(o, sh, accent) {
  const p = sh.pal || HULL;
  o.save(); o.translate(sh.x, sh.y); o.rotate(sh.ang || 0);
  poly(o, [[18, 0], [-6, -4], [-14, -14]], p[0]);
  poly(o, [[18, 0], [-6, -4], [-10, 0]], p[1]);
  poly(o, [[-6, -4], [-14, -14], [-10, 0]], p[2]);
  poly(o, [[18, 0], [-6, 4], [-10, 0]], p[3]);
  poly(o, [[-6, 4], [-14, 14], [-10, 0]], p[4]);
  poly(o, [[18, 0], [-6, 4], [-14, 14]], p[5]);
  poly(o, [[-6, 4], [-14, 14], [-10, 0]], p[4]);
  poly(o, [[9, 0], [3, -2], [-1, 0], [3, 2]], '#000');
  o.fillStyle = '#12171e'; o.fillRect(-17, -5, 8, 10);
  o.fillStyle = 'rgb(61,66,72)'; o.fillRect(-16, -4, 6, 4); o.fillStyle = 'rgb(27,29,31)'; o.fillRect(-16, 0, 6, 4);
  if (sh.plate) { // pusher plate: the fission engine's one piece of machinery
    o.fillStyle = 'rgb(97,103,112)'; o.fillRect(-19.5, -8, 2, 8); o.fillStyle = 'rgb(52,56,61)'; o.fillRect(-19.5, 0, 2, 8);
    o.fillStyle = accent || '#14702e'; o.fillRect(-20.4, -8, .9, 16);
  }
  o.restore();
}
function drawDrone(o, d) {
  o.save(); o.translate(d.x, d.y);
  poly(o, [[8.5, 0], [-6, -5], [-3, 0]], CHAR[0]); poly(o, [[8.5, 0], [-6, 5], [-3, 0]], CHAR[5]);
  o.fillStyle = 'rgb(27,29,31)'; o.fillRect(-8.5, -1.5, 5.5, 3); o.fillStyle = '#96f02e'; o.fillRect(-1, -.6, 3, 1.2);
  o.restore();
}
function silhouette(sh) { const c = Math.cos(sh.ang || 0), s = Math.sin(sh.ang || 0); return SIL.map(p => [sh.x + p[0] * c - p[1] * s, sh.y + p[0] * s + p[1] * c]); }
const ACC = ['#f4ffe2', '#96f02e', '#3ac428', '#14702e', '#3a4046'];
function accentFor(tc) { return tc < 11 ? ACC[0] : ACC[Math.min(4, 1 + Math.floor((tc - 11) / 4))]; }

// ---------- the stack ----------
class Sim {
  constructor(P, cfg) {
    this.P = P; this.cfg = cfg; this.w = cfg.w; this.h = cfg.h;
    this.fx = mk(this.w * S, this.h * S); this.lfx = mk(this.w * S, this.h * S);
    this.small = mk(Math.ceil(this.w / 8), Math.ceil(this.h / 8));
    this.F = this.fx.getContext('2d'); this.L = this.lfx.getContext('2d'); this.sc = this.small.getContext('2d');
    const r = rng(cfg.seed || 7); this.stars = Array.from({ length: Math.round(this.w * this.h / 700) }, () => [r() * this.w, r() * this.h, .3 + r() * .9, .15 + r() * .5]);
    this.reset();
  }
  reset() {
    const c = this.cfg; this.t = 0; this.ev = [];
    this.F.setTransform(1, 0, 0, 1, 0, 0); this.F.globalCompositeOperation = 'source-over'; this.F.globalAlpha = 1; this.F.fillStyle = '#000'; this.F.fillRect(0, 0, this.fx.width, this.fx.height);
    this.fighter = c.fighter ? { ...c.fighter, ang: 0, plate: true, tc: 0 } : null;
    this.drone = c.drone ? { ...c.drone } : null;
    this.target = c.target ? { ...c.target, pal: CHAR } : null;
    this.ships = [this.fighter, this.target].filter(Boolean);
  }
  burst() { const f = this.fighter; return [f.x - 26, f.y]; }
  step() {
    const F = this.F, L = this.L;
    F.setTransform(1, 0, 0, 1, 0, 0); F.globalCompositeOperation = 'source-over'; F.fillStyle = '#000';
    F.globalAlpha = FADE; F.fillRect(0, 0, this.fx.width, this.fx.height);
    if (this.t % 12 === 0) { F.globalAlpha = .3; F.fillRect(0, 0, this.fx.width, this.fx.height); } // clears 8-bit residue
    F.globalAlpha = 1; F.globalCompositeOperation = 'lighter'; F.setTransform(S, 0, 0, S, 0, 0);
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, this.lfx.width, this.lfx.height); L.setTransform(S, 0, 0, S, 0, 0);
    const f = this.fighter, d = this.drone;
    if (f) {
      if (f.tc === 0) { const b = this.burst(); this.ev.push({ kind: 'pulse', x: b[0], y: b[1], dx: -1, dy: 0, age: 0, rnd: rng(this.t * 31 + 5), tr: [] }); }
      if (f.tc < 11) f.v += f.acc;
      f.x += f.v;
    }
    if (d && !d.dead) {
      d.x += d.v;
      soft(F, d.x - 10, d.y, 4, MINT, .55); disc(F, d.x - 9.5, d.y, 1.1, MINTC, .9);
      if (d.x >= d.detX) { d.dead = true; this.ev.push({ kind: 'det', x: d.x, y: d.y, age: 0, rnd: rng(99), tr: [] }); this.detT = this.t; }
    }
    for (const e of this.ev) { this.P[e.kind](this, e); L.globalCompositeOperation = 'source-over'; e.age++; }
    this.ev = this.ev.filter(e => e.age <= this.P.life[e.kind]);
    if (f) f.tc = (f.tc + 1) % 27;
    this.t++;
  }
  compose(out) {
    const o = out.getContext('2d'), Wp = out.width, Hp = out.height;
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.filter = 'none';
    o.fillStyle = BG; o.fillRect(0, 0, Wp, Hp);
    o.save(); o.scale(S, S);
    for (const s of this.stars) { o.fillStyle = `rgba(200,205,235,${s[3]})`; o.fillRect(s[0], s[1], s[2], s[2]); }
    if (this.target) drawFighter(o, this.target);
    if (this.fighter) drawFighter(o, this.fighter, accentFor((this.fighter.tc + 26) % 27));
    if (this.drone && !this.drone.dead) drawDrone(o, this.drone);
    o.restore();
    o.globalCompositeOperation = 'screen'; o.drawImage(this.fx, 0, 0);
    this.sc.globalCompositeOperation = 'copy'; this.sc.drawImage(this.fx, 0, 0, this.small.width, this.small.height);
    o.globalAlpha = .9; if ('filter' in o) o.filter = `blur(${12 * S}px)`; o.drawImage(this.small, 0, 0, Wp, Hp); o.filter = 'none'; o.globalAlpha = 1;
    o.globalCompositeOperation = 'hard-light'; o.drawImage(this.lfx, 0, 0);
    o.globalCompositeOperation = 'source-over';
  }
}

// ---------- the four proposals ----------
// A. Double flash: white, black, green. Yield is told by the length of the gap.
const PA = {
  life: { pulse: 11, det: 27 },
  pulse(s, e) {
    const a = e.age, F = s.F, L = s.L, x = e.x + e.dx * a * .6, y = e.y;
    if (a < 2) { disc(F, x, y, 6, W, 1); soft(F, x, y, 16, W, .8); disc(L, x, y, 8, W, 1); }
    else if (a < 5) { const r = 8 + (a - 2) * 2; disc(L, x, y, r, [4, 8, 3], .92); ring(L, x, y, r, 1.1, HL([235, 255, 190]), 1); ring(F, x, y, r, .8, FXG, .35); }
    else if (a < 11) { const k = (a - 5) / 5; soft(F, x, y, 12 + k * 13, mix(FXH, FXG, k * 1.6), a === 7 ? .8 : .6); }
  },
  det(s, e) {
    const a = e.age, F = s.F, L = s.L, x = e.x, y = e.y;
    if (a < 3) { disc(F, x, y, 11, W, 1); soft(F, x, y, 30, W, .9); disc(L, x, y, a === 0 ? 22 : 15, W, 1); }
    else if (a < 10) { const r = 16 + (a - 3) * 3; disc(L, x, y, r, [4, 8, 3], .9); ring(L, x, y, r, 1.5, HL([235, 255, 190]), 1); ring(F, x, y, r, 1, FXG, .4); }
    else if (a < 27) {
      const k = (a - 10) / 16, env = a < 14 ? .25 + .25 * (a - 10) / 4 : .5 * (1 - (a - 14) / 13);
      soft(F, x, y, 34 + k * 16, k < .4 ? mix(FXH, FXG, k / .4) : mix(FXG, FXD, (k - .4) / .6), env);
      if (a < 17) soft(F, x, y, 12, FXH, .3);
    }
  },
  marks(c) {
    disc(c, 22, 28, 5, W, 1); soft(c, 22, 28, 13, W, .8);
    disc(c, 68, 28, 11, [4, 8, 3], 1); ring(c, 68, 28, 11, 1.1, HL([235, 255, 190]), 1);
    soft(c, 118, 28, 16, FXH, .5); soft(c, 164, 28, 21, FXG, .5); soft(c, 208, 28, 21, FXD, .5);
  }
};

// B. Plate shadow: the light is a flat wash that contracts; solids cut wedges out of it.
const WASH = [[205, 228, 190], [150, 200, 132], [96, 166, 92], [56, 126, 64], [30, 90, 46], [18, 60, 33], [10, 40, 24]];
function wedge(L, bx, by, R, pts) {
  let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
  if (Math.hypot(cx - bx, cy - by) > R + 14) return false;
  const base = Math.atan2(cy - by, cx - bx); let lo = 0, hi = 0, pl = pts[0], ph = pts[0];
  for (const p of pts) { let d = Math.atan2(p[1] - by, p[0] - bx) - base; d = Math.atan2(Math.sin(d), Math.cos(d)); if (d < lo) { lo = d; pl = p; } if (d > hi) { hi = d; ph = p; } }
  L.globalCompositeOperation = 'destination-out'; L.fillStyle = '#000'; L.beginPath(); L.moveTo(pl[0], pl[1]);
  L.lineTo(bx + Math.cos(base + lo) * (R + 2), by + Math.sin(base + lo) * (R + 2)); L.arc(bx, by, R + 2, base + lo, base + hi); L.lineTo(ph[0], ph[1]); L.closePath(); L.fill();
  L.globalCompositeOperation = 'source-over'; return true;
}
function wash(s, e, R, i, al) {
  const L = s.L; disc(L, e.x, e.y, R, HL(WASH[Math.min(6, i + 1)]), al); disc(L, e.x, e.y, R * .58, HL(WASH[i]), al);
  const hit = []; for (const sh of s.ships) if (wedge(L, e.x, e.y, R, silhouette(sh))) hit.push(sh); return hit;
}
const PB = {
  life: { pulse: 10, det: 20 },
  pulse(s, e) {
    const a = e.age, F = s.F, i = Math.floor(a / 2), R = 32 * [1, .82, .64, .48, .32, .2][i];
    wash(s, e, R, i, .78 - i * .05);
    if (a % 2 === 0) ring(F, e.x, e.y, R, .7, FXG, a ? .3 : .55);
    if (a < 4) { soft(F, e.x, e.y, 7, FXH, .8); disc(F, e.x, e.y, 2.2, W, 1); }
  },
  det(s, e) {
    const a = e.age, F = s.F, L = s.L, i = Math.floor(a / 3), R = 78 * [1, .84, .68, .52, .37, .23, .11][i];
    const hit = wash(s, e, R, i, .78 - i * .04);
    if (a < 2) for (const sh of hit) poly(L, silhouette(sh), 'rgba(255,255,255,.8)');
    if (a % 3 === 0) ring(F, e.x, e.y, R, 1, FXG, a ? .35 : .6);
    if (a < 3) { disc(F, e.x, e.y, 5, W, 1); soft(F, e.x, e.y, 16, W, .9); } else if (a < 9) soft(F, e.x, e.y, 8, FXH, .5);
  },
  marks(c) {
    disc(c, 30, 28, 24, HL(WASH[1]), 1); disc(c, 30, 28, 14, HL(WASH[0]), 1);
    disc(c, 92, 28, 24, WASH[1], 1); disc(c, 92, 28, 14, WASH[0], 1);
    c.fillStyle = '#000'; c.beginPath(); c.moveTo(92, 28); c.arc(92, 28, 26, -.9, .9); c.closePath(); c.fill();
    ring(c, 150, 28, 20, .8, FXG, .8); soft(c, 200, 28, 7, FXH, .8); disc(c, 200, 28, 2.2, W, 1);
  }
};

// C. Chain: straight tracks that are born full length, never move, and end by splitting in two.
function fork(F, t, col, a, w, gen) {
  const ex = t.x + Math.cos(t.ang) * t.len, ey = t.y + Math.sin(t.ang) * t.len, l = t.len * .4;
  for (const sg of [-1, 1]) {
    const an = t.ang + sg * t.f;
    if (gen === 1) { line(F, ex, ey, an, l, col, a, w); disc(F, ex + Math.cos(an) * l, ey + Math.sin(an) * l, 1, FXH, .8); }
    else { const fx = ex + Math.cos(an) * l, fy = ey + Math.sin(an) * l; for (const s2 of [-1, 1]) line(F, fx, fy, an + s2 * .5, l * .45, col, a, w); }
  }
}
const PC = {
  life: { pulse: 16, det: 13 },
  pulse(s, e) {
    const a = e.age, F = s.F, r = e.rnd;
    if (a < 11) {
      const b = s.fighter ? s.burst() : [e.x, e.y], n = a === 0 ? 8 : a === 1 ? 4 : 2;
      for (let i = 0; i < n; i++) e.tr.push({ x: b[0], y: b[1], ang: Math.PI + (r() - .5) * 1.7, len: 8 + 52 * Math.pow(r(), 3), f: .4 + r() * .4, born: a });
      if (a < 2) disc(s.L, b[0], b[1], 5, W, 1);
    }
    for (const t of e.tr) { const g = a - t.born; if (g < 3) line(F, t.x, t.y, t.ang, t.len, g ? FXG : FXH, [.9, .5, .3][g], 1.1); else if (g < 5) fork(F, t, FXG, .7, .8, 1); }
  },
  det(s, e) {
    const a = e.age, F = s.F, r = e.rnd;
    if (a < 4) for (let i = 0, n = [40, 20, 10, 5][a]; i < n; i++) e.tr.push({ x: e.x, y: e.y, ang: r() * 6.2832, len: 14 + 62 * Math.pow(r(), 2.2), f: .4 + r() * .4, born: a });
    if (a < 2) { disc(s.L, e.x, e.y, 7, W, 1); soft(F, e.x, e.y, 18, W, .8); } else if (a < 4) disc(s.L, e.x, e.y, 3.5, W, 1);
    for (const t of e.tr) { const g = a - t.born; if (g < 3) line(F, t.x, t.y, t.ang, t.len, g ? FXG : FXH, [.9, .5, .3][g], 1.2); else if (g < 5) fork(F, t, FXG, .7, .9, 1); else if (g >= 6 && g < 8) fork(F, t, FXD, .9, .7, 2); }
  },
  marks(c) {
    line(c, 8, 28, 0, 40, FXH, .9, 1.1);
    const t = { x: 70, y: 28, ang: 0, len: 34, f: .55 }; line(c, 70, 28, 0, 34, FXG, .9, 1.1); fork(c, t, FXG, .9, .8, 1);
    const u = { x: 150, y: 28, ang: 0, len: 34, f: .55 }; line(c, 150, 28, 0, 34, FXG, .9, 1.1); fork(c, u, FXG, .9, .8, 1); fork(c, u, FXD, 1, .7, 2);
  }
};

// D. Standing shells: the footprint is there from tick 0; a hot band walks out through counted rings.
const BW = 6, R0 = 3;
function shells(s, e, n, a0, a1, per) {
  const a = e.age, F = s.F, L = s.L, h = Math.floor(a / per), fade = h >= n ? Math.max(0, 1 - (a - n * per) / 6) : 1;
  for (let k = 0; k < n; k++) {
    const ra = R0 + k * BW, rb = ra + BW - .9;
    if (k === h) { sector(L, e.x, e.y, ra, rb, a0, a1, HL([240, 255, 215]), 1); sector(F, e.x, e.y, ra, rb, a0, a1, FXG, .55); }
    else if (k < h) sector(L, e.x, e.y, ra, rb, a0, a1, [6, 14, 8], .78 * fade);
    else sector(L, e.x, e.y, ra, rb, a0, a1, HL(mix([70, 190, 60], [20, 105, 45], (k - h) / n)), .9);
  }
  if (a < 2) { disc(L, e.x, e.y, R0 - .5, W, 1); soft(F, e.x, e.y, 10, W, .8); }
}
const PD = {
  life: { pulse: 15, det: 24 },
  pulse(s, e) { shells(s, e, 3, Math.PI - 1.05, Math.PI + 1.05, 3); },
  det(s, e) { shells(s, e, 6, 0, 6.2832, 3); },
  marks(c) {
    const cols = [HL([240, 255, 215]), HL([70, 190, 60]), HL([45, 148, 52]), HL([20, 105, 45])];
    for (let k = 0; k < 4; k++) sector(c, 38, 28, R0 + k * BW, R0 + k * BW + 5.1, 0, 6.2832, cols[k], 1);
    const shown = [[240, 255, 215], [70, 190, 60], [45, 148, 52], [20, 105, 45]];
    for (let k = 0; k < 4; k++) sector(c, 110, 28, R0 + k * BW, R0 + k * BW + 5.1, 0, 6.2832, shown[k], 1);
    for (let k = 0; k < 3; k++) sector(c, 205, 28, R0 + k * BW, R0 + k * BW + 5.1, Math.PI - 1.05, Math.PI + 1.05, k === 1 ? shown[0] : k ? shown[1] : [6, 14, 8], 1);
  }
};

// ---------- page wiring ----------
const ENG = { w: 230, h: 96, seed: 3, fighter: { x: 20, y: 48, v: 1.0, acc: .11 } };
const DET = { w: 230, h: 170, seed: 11, drone: { x: 15, y: 90, v: 2.5, detX: 100 }, target: { x: 152, y: 66, ang: 2.5 } };
const LIVE = { w: 460, h: 200, seed: 5, fighter: { x: -30, y: 52, v: 1.0, acc: .06 }, drone: { x: 20, y: 142, v: 2.2, detX: 250 }, target: { x: 304, y: 118, ang: 2.4 } };
const ENG_FR = [0, 1, 3, 6, 10, 14, 20, 27], DET_FR = [-8, 0, 2, 5, 9, 14, 22, 36];

function strip(host, P, cfg, frames, t0of, label) {
  const sim = new Sim(P, cfg); let t0 = null, i = 0;
  for (let n = 0; n < 400 && i < frames.length; n++) {
    sim.step(); if (t0 === null) t0 = t0of(sim);
    const rel = t0 === null ? null : sim.t - 1 - t0;
    const want = frames[i];
    if ((rel !== null && rel === want) || (t0 === null && want < 0 && cfg.drone && Math.round((cfg.drone.detX - sim.drone.x) / cfg.drone.v) === -want)) {
      const fig = document.createElement('figure'), cv = mk(cfg.w * S, cfg.h * S); sim.compose(cv);
      const cap = document.createElement('figcaption'); cap.textContent = label(want);
      fig.append(cv, cap); host.append(fig); i++;
    }
  }
}
const ms = t => `${t < 0 ? '−' : ''}${Math.abs(Math.round(t * 16.67))} ms`;
const PROPS = { A: PA, B: PB, C: PC, D: PD };
const lives = [];
for (const [k, P] of Object.entries(PROPS)) {
  strip(document.getElementById('eng' + k), P, ENG, ENG_FR, s => s.t > 27 ? 27 : null, t => t === 27 ? 'tick 27 · next push' : `tick ${t} · ${ms(t)}`);
  strip(document.getElementById('det' + k), P, DET, DET_FR, s => s.detT ?? null, t => t < 0 ? `${ms(t)} · travel` : `tick ${t} · ${ms(t)}`);
  const m = document.getElementById('mark' + k), mc = m.getContext('2d'); mc.fillStyle = '#17171f'; mc.fillRect(0, 0, m.width, m.height); mc.scale(S, S); P.marks(mc);
  const cv = document.getElementById('live' + k); const sim = new Sim(P, LIVE);
  for (let n = 0; n < 112; n++) sim.step(); sim.compose(cv);
  lives.push({ cv, sim, on: false });
}
let playing = false, last = 0;
const btn = document.getElementById('play');
function loop(ts) {
  if (!playing) return;
  if (ts - last > 15) { last = ts; for (const l of lives) if (l.on) { l.sim.step(); if (l.sim.t > 175) l.sim.reset(); l.sim.compose(l.cv); } }
  requestAnimationFrame(loop);
}
const io = new IntersectionObserver(es => es.forEach(en => { const l = lives.find(l => l.cv === en.target); if (l) l.on = en.isIntersecting; }));
lives.forEach(l => io.observe(l.cv));
btn.addEventListener('click', () => { playing = !playing; btn.textContent = playing ? 'Pause the loops' : 'Play the loops'; btn.setAttribute('aria-pressed', playing); if (playing) requestAnimationFrame(loop); });
