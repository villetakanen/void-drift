import {
  COLOR,
  canvasFont,
  type GameObject,
  type PlumeEmitter,
} from "@void-drift/core";
import { drawCockpitMaterial } from "./cockpit-material";
import { CRUISER } from "./cruiser";
import { ENGINE_ART } from "./engine-art";
import { FIDDLER } from "./fiddler";
import { FIGHTER } from "./fighter";
import {
  drawIonCannon,
  ION_CANNON_MUZZLE,
  ION_CANNON_MUZZLE_SIDE,
} from "./ion-cannon-art";
import {
  drawPointDefence,
  POINT_DEFENCE_MUZZLE,
  POINT_DEFENCE_MUZZLE_SIDE,
} from "./point-defence-art";
import { drawPotentialWell } from "./potential-well-art";
import {
  CHASSIS,
  type Loadout,
  PARTS,
  type PartId,
  SLOT_TYPES,
  type SlotType,
} from "./schemas/loadout";
import { SCOUT } from "./scout";
import {
  drawStabilizerSlits,
  lhiStabilizers,
  stabilizerMount,
} from "./stabilizers";
import { drawUtilityArtwork } from "./utility-art";
import { WASP } from "./wasp";
export const BUILD_FLIGHT_SCALE = 0.65;
export interface BuildMount {
  key: string;
  type: SlotType;
  linkedTo?: string;
  required?: boolean;
  underHull?: boolean;
  language?: { symbol: string; label: string };
  label: string;
  x: number;
  y: number;
  angle: number;
  part: PartId | null;
  group: "side" | "hull" | "aft";
  index: number;
  width: number;
  height: number;
}
export function buildMounts(build: Loadout): BuildMount[] {
  const c = CHASSIS[build.chassis];
  if (build.chassis === "fiddler") {
    return [
      ...FIDDLER.rootEngines.map(
        ([x, y], index): BuildMount => ({
          key: index === 0 ? "left" : "right",
          type: "engine",
          required: true,
          linkedTo: index === 1 ? "left" : undefined,
          label: `${index === 0 ? "Left" : "Right"} blade root · Engine pair`,
          x,
          y,
          angle: 0,
          part: build.side,
          group: "side",
          index,
          width: 14,
          height: 9,
          underHull: true,
        }),
      ),
      ...FIDDLER.rearEngines.map(
        ([x, y], index): BuildMount => ({
          key: `aft-${index}`,
          type: "engine",
          required: true,
          linkedTo: index === 1 ? "aft-0" : undefined,
          label: `${index === 0 ? "Left" : "Right"} rear · Engine pair`,
          x,
          y,
          angle: 0,
          part: build.aft[index],
          group: "aft",
          index,
          width: 14,
          height: 9,
          underHull: false,
        }),
      ),
      ...FIDDLER.hullMounts.map(
        ([x, y], index): BuildMount => ({
          key: `hull-${index}`,
          type: index === 2 || index === 3 ? "support" : "equipment",
          language:
            index === 2 || index === 3
              ? SLOT_TYPES.support
              : { symbol: "+", label: "Weapon / support" },
          label:
            index === 4
              ? "Centre · Weapon / support"
              : `${index % 2 === 0 ? "Left" : "Right"} ${index < 2 ? "forward pincer · Weapon / support" : "aft pincer · Support"}`,
          x,
          y,
          angle: 0,
          part: build.hull[index],
          group: "hull",
          index,
          width: 11,
          height: 9,
          underHull: true,
        }),
      ),
    ];
  }
  if (build.chassis === "wasp") {
    return [
      {
        key: "hull-0",
        type: "equipment",
        label: "Left wing · Equipment",
        x: WASP.hullMounts[0][0],
        y: WASP.hullMounts[0][1],
        angle: 0,
        part: build.hull[0] ?? null,
        group: "hull",
        index: 0,
        width: 11,
        height: 9,
      },
      {
        key: "hull-1",
        type: "equipment",
        label: "Right wing · Equipment",
        x: WASP.hullMounts[1][0],
        y: WASP.hullMounts[1][1],
        angle: 0,
        part: build.hull[1] ?? null,
        group: "hull",
        index: 1,
        width: 11,
        height: 9,
      },
      {
        key: "left",
        type: "engine",
        label: "Rear center · Engine",
        x: WASP.engineMount[0],
        y: WASP.engineMount[1],
        angle: 0,
        part: build.side,
        group: "side",
        index: 0,
        width: 11,
        height: 9,
      },
    ];
  }
  return [
    {
      key: "left",
      type: "engine",
      label: "Left side · mirrored E",
      x: c.sideX,
      y: -c.arm,
      angle: (c.angle * Math.PI) / 180,
      part: build.side,
      group: "side",
      index: 0,
      width: build.chassis !== "scout" ? 14 : 10,
      height: build.chassis !== "scout" ? 9 : 8,
    },
    {
      key: "right",
      type: "engine",
      linkedTo: "left",
      label: "Right side · mirrored E",
      x: c.sideX,
      y: c.arm,
      angle: (-c.angle * Math.PI) / 180,
      part: build.side,
      group: "side",
      index: 1,
      width: build.chassis !== "scout" ? 14 : 10,
      height: build.chassis !== "scout" ? 9 : 8,
    },
    ...build.hull.map(
      (part, index): BuildMount => ({
        key: `hull-${index}`,
        type: "equipment",
        label: `Hull ${index + 1} · Equipment`,
        x:
          build.chassis === "corvette"
            ? CRUISER.hullMounts[index]
            : build.chassis === "fighter"
              ? FIGHTER.hullMounts[index]
              : SCOUT.hullX,
        y: build.chassis !== "scout" ? 0 : (index - (c.hull - 1) / 2) * 10,
        angle: 0,
        part,
        group: "hull",
        index,
        width: build.chassis !== "scout" ? 11 : 10,
        height: build.chassis !== "scout" ? 9 : 8,
      }),
    ),
    ...build.aft.map(
      (part, index): BuildMount => ({
        key: `aft-${index}`,
        type: "universal",
        label: `Aft ${index + 1} · Universal`,
        x:
          build.chassis === "corvette"
            ? CRUISER.aftMounts[index][0]
            : build.chassis === "fighter"
              ? -22
              : SCOUT.aftX,
        y:
          build.chassis === "corvette"
            ? CRUISER.aftMounts[index][1]
            : (index - (c.aft - 1) / 2) *
              (build.chassis === "fighter" ? 10 : 12),
        angle: 0,
        part,
        group: "aft",
        index,
        width: build.chassis !== "scout" ? 11 : 10,
        height: build.chassis !== "scout" ? 9 : 8,
      }),
    ),
  ].map(
    (mount): BuildMount =>
      ({
        ...mount,
        x:
          mount.x +
          (mount.group === "aft"
            ? build.chassis === "fighter"
              ? 5
              : build.chassis === "scout"
                ? -3
                : 3
            : 0),
        y: mount.y,
        angle: mount.angle,
      }) as BuildMount,
  );
}
export function engineArtId(id: PartId) {
  return id;
}
export function engineOffset(build: Loadout, mount: BuildMount) {
  if (build.chassis !== "scout") return 0;
  const front =
    mount.part === "heavy-ion" ? 10.35 : mount.part === "ion" ? 9 : 10;
  return 36 / 7 - front;
}
function drawEngine(
  ctx: CanvasRenderingContext2D,
  build: Loadout,
  mount: BuildMount,
  selected = false,
) {
  if (!mount.part) return;
  const id = engineArtId(mount.part);
  const pose =
    build.chassis === "wasp" || build.chassis === "fiddler"
      ? 3
      : mount.key === "left"
        ? 1
        : mount.key === "right"
          ? 2
          : 3;
  ctx.save();
  ctx.translate(engineOffset(build, mount), 0);
  // One silhouette pass avoids glowing seams between the low-poly faces.
  if (selected) {
    ctx.shadowColor = COLOR.selected;
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#252a31";
    ctx.beginPath();
    for (const face of ENGINE_ART[id][pose]) {
      face.points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const face of ENGINE_ART[id][pose])
    polygon(
      ctx,
      face.points,
      face.color === "currentColor"
        ? id === "fusion"
          ? ENGINE_ACCENT.fusion
          : ENGINE_ACCENT.plasma
        : face.color,
    );
  ctx.restore();
}
export function drawBuild(
  ctx: CanvasRenderingContext2D,
  build: Loadout,
  x: number,
  y: number,
  rotation: number,
  scale = 1,
  selected = "",
  slots?: SlotPalette,
  mountOverride?: BuildMount[],
  weaponAngles?: Readonly<Record<string, number>>,
  cockpitMaterial = true,
  fittingPainter?: (
    ctx: CanvasRenderingContext2D,
    mount: BuildMount,
  ) => boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  const mounts = mountOverride ?? buildMounts(build);
  const isWasp = build.chassis === "wasp";
  const lhi = lhiStabilizers(build.chassis);
  const below = (mount: BuildMount) =>
    mount.underHull ??
    (isWasp
      ? mount.group === "hull"
      : build.chassis === "scout" || mount.group === "side");
  if (!slots)
    for (const mount of mounts) {
      if (!mount.part || !below(mount)) continue;
      ctx.save();
      ctx.translate(mount.x, mount.y);
      ctx.rotate(mount.angle);
      if (PARTS[mount.part].category === "E") {
        drawEngine(ctx, build, mount);
      } else {
        if (!fittingPainter?.(ctx, mount))
          drawNonEngineFitting(ctx, mount, weaponAngles?.[mount.key]);
      }
      ctx.restore();
    }
  ctx.save();
  if (slots) ctx.globalAlpha = 0.7;
  if (isWasp) {
    for (const facet of WASP.facets) polygon(ctx, facet.points, facet.color);
  } else if (build.chassis === "fiddler") {
    for (const facet of FIDDLER.facets) polygon(ctx, facet.points, facet.color);
  } else if (build.chassis === "corvette") {
    // Clip out the stern channel without painting over the scene beneath it.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-100, -100, 200, 200);
    CRUISER.notch.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip("evenodd");
    for (const facet of CRUISER.facets) polygon(ctx, facet.points, facet.color);
    ctx.restore();
  } else if (build.chassis === "fighter") {
    for (const [index, point] of FIGHTER.hull.entries()) {
      const next = FIGHTER.hull[(index + 1) % FIGHTER.hull.length];
      polygon(
        ctx,
        [[-3, 0], point, next],
        FIGHTER.facets[
          (point[1] + next[1]) / 2 < 0 ? index % 3 : 3 + (index % 3)
        ],
      );
    }
    polygon(ctx, FIGHTER.ridge, "#a2d8df");
    polygon(
      ctx,
      [
        [38, 0],
        [-21, 0],
        [-15, 4],
      ],
      "#51869e",
    );
    polygon(ctx, FIGHTER.cockpit, "#000000");
  } else {
    for (const facet of SCOUT.facets) polygon(ctx, facet.points, facet.color);
    const cockpit = SCOUT.cockpit;
    for (const [radius, color] of [
      [cockpit.collarRadius, FIGHTER.facets[2]],
      [cockpit.radius, "#000000"],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cockpit.x, cockpit.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  if (cockpitMaterial) drawCockpitMaterial(ctx, build.chassis);
  ctx.restore();
  if (lhi) {
    drawStabilizerSlits(ctx, lhi.front);
    drawStabilizerSlits(ctx, lhi.rear);
  }
  if (slots) {
    for (const secondary of mounts.filter((m) => m.linkedTo)) {
      const primary = mounts.find((m) => m.key === secondary.linkedTo);
      if (!primary) continue;
      ctx.save();
      ctx.strokeStyle = primary.part ? slots.lime : slots.dark;
      ctx.lineWidth = 1 / 7;
      ctx.setLineDash([4 / 7, 4 / 7]);
      const rear =
        Math.max(CHASSIS[build.chassis].length, ...mounts.map((m) => m.x)) + 8;
      ctx.beginPath();
      ctx.moveTo(primary.x, primary.y);
      ctx.lineTo(rear, primary.y);
      ctx.lineTo(rear, secondary.y);
      ctx.lineTo(secondary.x, secondary.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  const renderOrder = isWasp
    ? mounts
    : ["side", "aft", "hull"].flatMap((group) =>
        mounts.filter((m) => m.group === group),
      );
  for (const mount of renderOrder) {
    const index = mounts.findIndex((m) => m.key === mount.key);
    ctx.save();
    ctx.translate(mount.x, mount.y);
    ctx.rotate(mount.angle);
    if (slots)
      drawSlot(ctx, mount, index + 1, selected === mount.key, slots, true);
    if (mount.part && PARTS[mount.part].category === "E") {
      if (slots || !below(mount))
        drawEngine(
          ctx,
          build,
          mount,
          !!slots && (selected === mount.key || selected === mount.linkedTo),
        );
      if (slots) drawSlot(ctx, mount, index + 1, selected === mount.key, slots);
      ctx.restore();
      continue;
    }
    if (slots) drawSlot(ctx, mount, index + 1, selected === mount.key, slots);
    if (!mount.part || (!slots && below(mount))) {
      ctx.restore();
      continue;
    }
    if (slots) {
      const fit = Math.min(54 / 7 / mount.height, 64 / 7 / mount.width) * 0.65;
      ctx.scale(fit, fit);
    }
    if (!fittingPainter?.(ctx, mount))
      drawNonEngineFitting(ctx, mount, weaponAngles?.[mount.key]);

    ctx.restore();
  }
  if (!lhi && build.stabilizers)
    drawStabilizerSlits(ctx, stabilizerMount(build.chassis));
  ctx.restore();
}

/** Full-size installed weapon/support artwork, shared with placement tools. */
export function drawNonEngineFitting(
  ctx: CanvasRenderingContext2D,
  mount: BuildMount,
  weaponAngle = mount.angle,
) {
  if (!mount.part) return;
  if (mount.part === "light-ion-cannon") {
    drawIonCannon(ctx, BUILD_FLIGHT_SCALE);
    return;
  }
  if (mount.part === "ion-point-defence") {
    // The pivot sits on the mount; the turret turns by its simulated weapon angle.
    drawPointDefence(ctx, BUILD_FLIGHT_SCALE, weaponAngle - mount.angle);
    return;
  }

  if (mount.part === "gravity-coil") {
    drawUtilityArtwork(ctx, "gravity");
    return;
  }
  if (mount.part === "battery" || mount.part === "heavy-well") {
    drawPotentialWell(ctx, mount.part === "heavy-well");
    return;
  }
  // This rectangle is the installed item's casing, not a vacant mount overlay.
  ctx.strokeStyle =
    PARTS[mount.part].category === "E" ? "#9af7ff" : COLOR.selected;
  ctx.fillStyle = "#071015";
  ctx.lineWidth = 0.45;
  ctx.fillRect(-mount.width / 2, -mount.height / 2, mount.width, mount.height);
  ctx.strokeRect(
    -mount.width / 2,
    -mount.height / 2,
    mount.width,
    mount.height,
  );
  if (mount.part === "rail" || mount.part === "laser") {
    // Use the same mount-relative fittings as Fighter/Heavy: the legacy
    // Scout's 18-unit barrel would cross this compact hull's cockpit.
    const barrel = barrelLength(mount);
    ctx.save();
    if (mount.part === "laser") {
      ctx.rotate(weaponAngle - mount.angle);
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillRect(0, -2, barrel, 4);
    ctx.strokeRect(0, -2, barrel, 4);
    ctx.restore();
  } else if (mount.part === "coil") {
    for (let i = -3; i <= 3; i += 3) {
      ctx.beginPath();
      ctx.ellipse(i, 0, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (mount.part) {
    ctx.strokeStyle = mount.part === "ion" ? "#9af7ff" : "#ffc56e";
    ctx.beginPath();
    ctx.moveTo(-mount.width / 2, -3);
    ctx.lineTo(-nozzleOffset(mount), -4);
    ctx.lineTo(-nozzleOffset(mount), 4);
    ctx.lineTo(-mount.width / 2, 3);
    ctx.stroke();
  }
}

/** Engine identity colours: game data, shared by the builder canvas and its cards. */
export const ENGINE_ACCENT = {
  fusion: "#c6ff32",
  plasma: "#ffb52e",
  ion: "#29baff",
} as const;

/**
 * Slot overlay inks. Production passes COLOR roles: `lime` is the selected
 * ink for occupied slots, `dark` the void and `ivory` the text. Preserved
 * studies pass their own values.
 */
export interface SlotPalette {
  dark: string;
  lime: string;
  ivory: string;
}
export const SLOT_STYLE = {
  width: 54,
  height: 64,
  gap: 4,
  border: 1.5,
  referenceScale: 7,
} as const;
/** Shared mount overlay for the Hangar and geometry authoring tools. */
export function drawSlot(
  ctx: CanvasRenderingContext2D,
  mount: BuildMount,
  number: number | string,
  selected: boolean,
  palette: SlotPalette,
  backgroundOnly = false,
  language: { symbol: string; label: string } = mount.language ??
    SLOT_TYPES[mount.type],
) {
  ctx.save();
  // Convert ship-local forward +x into the study's upright slot coordinates.
  ctx.rotate(Math.PI / 2);
  ctx.scale(1 / SLOT_STYLE.referenceScale, 1 / SLOT_STYLE.referenceScale);
  const { width, height, gap, border } = SLOT_STYLE;
  const w = width / 2 + gap,
    h = height / 2 + gap,
    cw = w + 5,
    ch = h + 5;
  const ink = mount.part ? palette.lime : palette.dark;
  if (backgroundOnly) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = mount.part ? palette.dark : palette.lime;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = ink;
  ctx.lineWidth = border;
  if (mount.linkedTo) ctx.setLineDash([4, 3]);
  ctx.strokeRect(-w, -h, w * 2, h * 2);
  ctx.setLineDash([]);
  if (selected && !mount.linkedTo) {
    ctx.strokeStyle = palette.lime;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      ctx.moveTo(x * (cw - 12), y * ch);
      ctx.lineTo(x * cw, y * ch);
      ctx.lineTo(x * cw, y * (ch - 12));
    }
    ctx.stroke();
  }
  if (!mount.part) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = canvasFont(32, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(language.symbol, 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = palette.dark;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-cw - 23, -ch - 12, 22, 16);
  ctx.globalAlpha = 1;
  ctx.font = canvasFont(11);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = palette.ivory;
  ctx.fillText(
    typeof number === "number" ? String(number).padStart(2, "0") : number,
    -cw - 5,
    -ch,
  );
  ctx.translate(-w - 4, h);
  ctx.rotate(-Math.PI / 2);
  ctx.font = canvasFont(8);
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.fillText(language.label, 0, 0);
  ctx.restore();
}

/** Emission uses the same mount/nozzle geometry as the ship drawing. */
export function buildPlumeEmitters(build: Loadout): PlumeEmitter[] {
  const emitters: PlumeEmitter[] = buildMounts(build)
    .filter((mount) => mount.part && PARTS[mount.part].category === "E")
    .map((mount) => ({
      style:
        mount.part === "ion"
          ? "ion-light"
          : mount.part === "heavy-ion"
            ? "ion-heavy"
            : "default",
      x:
        (mount.x +
          (engineOffset(build, mount) - nozzleOffset(mount)) *
            Math.cos(mount.angle)) *
        BUILD_FLIGHT_SCALE,
      y:
        (mount.y +
          (engineOffset(build, mount) - nozzleOffset(mount)) *
            Math.sin(mount.angle)) *
        BUILD_FLIGHT_SCALE,
      angle: mount.angle,
      output: 0,
    }));
  const lhi = lhiStabilizers(build.chassis);
  if (lhi) {
    for (const m of [lhi.front, lhi.rear]) {
      for (const side of [-1, 1])
        emitters.push({
          style: "ion-light",
          x: (m.x - m.fx) * BUILD_FLIGHT_SCALE,
          y: (side * m.y + side * m.fy) * BUILD_FLIGHT_SCALE,
          angle: Math.atan2(-side * m.fy, m.fx),
          output: 0,
        });
    }
  } else if (build.stabilizers) {
    const m = stabilizerMount(build.chassis);
    for (const side of [-1, 1])
      emitters.push({
        style: "ion-light",
        x: (m.x - m.fx) * BUILD_FLIGHT_SCALE,
        y: (side * m.y + side * m.fy) * BUILD_FLIGHT_SCALE,
        angle: Math.atan2(-side * m.fy, m.fx),
        output: 0,
      });
  }
  return emitters;
}

export function nozzleOffset(mount: BuildMount) {
  if (!mount.part || PARTS[mount.part].category !== "E")
    return mount.width / 2 + 3;
  return -Math.min(
    ...ENGINE_ART[engineArtId(mount.part)][0].flatMap((face) =>
      face.points.map((p) => p[0]),
    ),
  );
}
function polygon(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}
export function barrelLength(mount: BuildMount) {
  if (mount.part === "light-ion-cannon")
    return ION_CANNON_MUZZLE / BUILD_FLIGHT_SCALE;
  if (mount.part === "ion-point-defence")
    return POINT_DEFENCE_MUZZLE / BUILD_FLIGHT_SCALE;
  return mount.width / 2 + (mount.part === "rail" ? 1 : 0);
}

/** Same transform and barrel geometry as drawBuild; local angles include the slot. */
export function weaponPose(
  ship: Pick<GameObject, "pos" | "rotation">,
  mount: BuildMount,
  localAngle = mount.angle,
) {
  const cos = Math.cos(ship.rotation),
    sin = Math.sin(ship.rotation);
  const x = ship.pos.x + (mount.x * cos - mount.y * sin) * BUILD_FLIGHT_SCALE;
  const y = ship.pos.y + (mount.x * sin + mount.y * cos) * BUILD_FLIGHT_SCALE;
  const angle = ship.rotation + localAngle;
  const length = barrelLength(mount) * BUILD_FLIGHT_SCALE;
  const lateral =
    mount.part === "light-ion-cannon"
      ? ION_CANNON_MUZZLE_SIDE
      : mount.part === "ion-point-defence"
        ? POINT_DEFENCE_MUZZLE_SIDE
        : 0;
  return {
    x,
    y,
    angle,
    muzzleX: x + Math.cos(angle) * length - Math.sin(angle) * lateral,
    muzzleY: y + Math.sin(angle) * length + Math.cos(angle) * lateral,
  };
}

/** Conservative circular collision envelope, including the accepted forward tip. */
function baseBuildCollisionRadius(build: Loadout) {
  if (build.chassis === "wasp" || build.chassis === "fiddler") {
    const hull = Math.max(
      ...(build.chassis === "wasp" ? WASP : FIDDLER).facets.flatMap((facet) =>
        facet.points.map(([x, y]) => Math.hypot(x, y)),
      ),
    );
    const fittings = buildMounts(build).map((mount) => {
      const forward =
        mount.part === "light-ion-cannon" ||
        mount.part === "ion-point-defence" ||
        mount.part === "rail" ||
        mount.part === "laser"
          ? barrelLength(mount)
          : mount.width / 2;
      const rear =
        mount.part && PARTS[mount.part].category === "E"
          ? nozzleOffset(mount)
          : mount.width / 2;
      return (
        Math.hypot(mount.x, mount.y) +
        Math.hypot(Math.max(forward, rear), Math.max(mount.height / 2, 4))
      );
    });
    return Math.max(hull, ...fittings) * BUILD_FLIGHT_SCALE;
  }
  if (build.chassis === "corvette") {
    const hull = Math.max(
      ...CRUISER.facets.flatMap((f) =>
        f.points.map(([x, y]) => Math.hypot(x, y)),
      ),
    );
    const fittings = buildMounts(build).map(
      (m) => Math.hypot(m.x, m.y) + Math.hypot(m.width / 2 + 3, m.height / 2),
    );
    return Math.max(hull, ...fittings) * BUILD_FLIGHT_SCALE;
  }
  if (build.chassis === "scout") {
    const hull = Math.max(
      ...SCOUT.facets.flatMap((facet) =>
        facet.points.map(([x, y]) => Math.hypot(x, y)),
      ),
      Math.hypot(SCOUT.cockpit.x, SCOUT.cockpit.y) + SCOUT.cockpit.collarRadius,
    );
    const fittings = buildMounts(build).map((mount) => {
      const forward =
        mount.part === "light-ion-cannon" ||
        mount.part === "ion-point-defence" ||
        mount.part === "rail" ||
        mount.part === "laser"
          ? barrelLength(mount)
          : mount.width / 2;
      const rear =
        mount.part && PARTS[mount.part].category === "E"
          ? nozzleOffset(mount)
          : mount.width / 2;
      return (
        Math.hypot(mount.x, mount.y) +
        Math.hypot(Math.max(forward, rear), Math.max(mount.height / 2, 4))
      );
    });
    return Math.max(hull, ...fittings) * BUILD_FLIGHT_SCALE;
  }
  return FIGHTER.length * BUILD_FLIGHT_SCALE;
}

/** Include every actual accepted engine vertex, including the Scout mounting offset. */
export function buildCollisionRadius(build: Loadout) {
  let radius = baseBuildCollisionRadius(build);
  for (const mount of buildMounts(build)) {
    if (mount.part === "ion-point-defence") {
      // The turret turns, so its muzzle may point anywhere about the pivot.
      radius = Math.max(
        radius,
        (Math.hypot(mount.x, mount.y) + barrelLength(mount)) *
          BUILD_FLIGHT_SCALE,
      );
      continue;
    }
    if (mount.part !== "light-ion-cannon") continue;
    const tip = barrelLength(mount);
    radius = Math.max(
      radius,
      Math.hypot(
        mount.x + Math.cos(mount.angle) * tip,
        mount.y + Math.sin(mount.angle) * tip,
      ) * BUILD_FLIGHT_SCALE,
    );
  }
  for (const mount of buildMounts(build)) {
    if (!mount.part || PARTS[mount.part].category !== "E") continue;
    const offset = engineOffset(build, mount);
    for (const face of ENGINE_ART[engineArtId(mount.part)][0])
      for (const [x, y] of face.points) {
        radius = Math.max(
          radius,
          Math.hypot(
            mount.x +
              (x + offset) * Math.cos(mount.angle) -
              y * Math.sin(mount.angle),
            mount.y +
              (x + offset) * Math.sin(mount.angle) +
              y * Math.cos(mount.angle),
          ) * BUILD_FLIGHT_SCALE,
        );
      }
  }
  return radius;
}
