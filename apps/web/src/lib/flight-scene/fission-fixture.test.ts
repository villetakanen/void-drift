import { describe, expect, it } from "vitest";
import { TOTAL_TICKS } from "../instrument/burns";
import { FlightSceneDocumentSchema } from "./config";
import {
  FISSION_CONTACT_TICK,
  FISSION_REST_TICKS,
  FISSION_SCENES,
} from "./fission-fixture";
import { FlightRun } from "./flight";

describe("Fission comparison staging", () => {
  it.each(FISSION_SCENES)(
    "$label crosses the same wreck with both fronts per paid nozzle",
    ({ document, label }) => {
      const doc = FlightSceneDocumentSchema.parse(document);
      const run = new FlightRun(doc, doc.opening.burn);
      const nozzleCount = label === "Single aft" ? 1 : 2;
      run.seek(FISSION_REST_TICKS);
      expect(run.fission).toEqual({ ignitions: [], contacts: [] });
      const hull = run.targetHull(0)?.maximum ?? 0;
      run.advance();
      const ignitions = run.fission.ignitions;
      expect(ignitions.map((event) => event.mountKey)).toEqual(
        nozzleCount === 1 ? ["aft-0"] : ["aft-0", "aft-1"],
      );
      expect(
        ignitions.every((event) => event.tick === FISSION_REST_TICKS),
      ).toBe(true);
      const contacts: (typeof run.sim.fissionContacts)[number][] = [];
      run.seek(FISSION_CONTACT_TICK, () =>
        contacts.push(...run.sim.fissionContacts),
      );
      expect(contacts).toHaveLength(2 * nozzleCount);
      expect(run.sim.fissionContacts.map((hit) => hit.front)).toEqual(
        Array.from({ length: nozzleCount }, () => 1),
      );
      for (const ignition of ignitions) {
        expect(
          contacts
            .filter((hit) => hit.ignition === ignition)
            .map((hit) => hit.front),
        ).toEqual([0, 1]);
      }
      const snapshot = () => ({ hull: run.targetHull(0), events: run.fission });
      const aftermath = snapshot();
      expect(aftermath.hull).toEqual({
        current: hull - 6 * nozzleCount,
        maximum: hull,
      });
      run.seek(TOTAL_TICKS);
      run.seek(0);
      expect(run.fission).toEqual({ ignitions: [], contacts: [] });
      run.seek(FISSION_CONTACT_TICK);
      expect(snapshot()).toEqual(aftermath);
    },
  );
});
