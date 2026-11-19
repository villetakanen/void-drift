import { SKY_BANK, SKY_TILE_PERIOD } from "@void-drift/core";

/** CSS coordinates for the same bank-centred tile in the Lab and flight. */
export function skyTile(scale: number) {
  const period = (SKY_TILE_PERIOD * scale) / 10.8;
  return {
    size: `${period}cqh ${period}cqh`,
    position: `calc(50% + ${(0.5 - SKY_BANK.x) * period}cqh) calc(50% + ${(0.5 - SKY_BANK.y) * period}cqh)`,
  };
}
