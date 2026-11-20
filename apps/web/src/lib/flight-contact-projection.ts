export interface FlightContactProjectionInput {
  projectedX: number;
  projectedY: number;
  worldDistance: number;
  active: { x: number; y: number; width: number; height: number };
}

/** Read-only screen-space placement for the flight contact arrow circle. */
export function projectFlightContact({
  projectedX,
  projectedY,
  worldDistance,
  active,
}: FlightContactProjectionInput) {
  const cx = active.x + active.width / 2;
  const cy = active.y + active.height / 2;
  const radius = Math.min(active.width, active.height) / 2 - 22;
  const dx = projectedX - cx;
  const dy = projectedY - cy;
  const squared = dx * dx + dy * dy;
  // The triangle, inward arc and category mark must all fit in the active box.
  if (radius < 32 || squared < radius * radius) return null;
  const angle = Math.atan2(dy, dx);
  const arcLength = Math.max(
    2,
    Math.min(96, 2 + ((worldDistance - 600) / 2800) * 94),
  );
  return {
    centerX: cx,
    centerY: cy,
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    angle: (angle * 180) / Math.PI,
    radius,
    arcLength,
  };
}
