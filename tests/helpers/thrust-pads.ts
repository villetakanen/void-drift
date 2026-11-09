import type { Locator, Page } from "@playwright/test";
import {
  type PadSide,
  padAssembly,
} from "../../apps/web/src/components/inputs/thrust-pads";
import {
  type InputAction,
  litPads,
  THRUST_PADS,
  type ThrustPad,
} from "../../packages/core/src/lib/entities/Input";
import { expect } from "./local-browser";

const PAD_SIDE: Record<ThrustPad, PadSide> = {
  leftUpper: "left",
  leftLower: "left",
  rightUpper: "right",
  rightLower: "right",
};

/** A page point inside `pad`, from the same geometry the component draws. */
export async function padPoint(page: Page, pad: ThrustPad) {
  const side = PAD_SIDE[pad];
  const box = await page
    .locator(`.thrust-pads[data-side="${side}"]`)
    .boundingBox();
  if (!box) throw new Error(`${side} assembly missing`);
  const pane = padAssembly(side, box.width, box.height).panes.find(
    (candidate) => candidate.pad === pad,
  );
  if (!pane) throw new Error(`${pad} pane missing`);
  return { x: box.x + pane.mark[0], y: box.y + pane.mark[1] };
}

/** `host` carries `data-action`; every pad inside it lights for that action only. */
export async function expectLit(host: Locator, action: InputAction | null) {
  await expect(host).toHaveAttribute("data-action", action ?? "none");
  const lit = litPads(action);
  for (const pad of THRUST_PADS)
    await expect(host.locator(`[data-pad="${pad}"]`)).toHaveAttribute(
      "data-lit",
      String(lit.includes(pad)),
    );
}
