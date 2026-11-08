// Lab starting document: compare two Fighters under one shared property set.
const fighter = (aft: [string | null, string | null]) => ({
  version: 2,
  chassis: "fighter",
  side: "ion",
  stabilizers: true,
  hull: [null, null],
  aft,
});

export const STARTER_DOCUMENT = {
  version: 1,
  burn: "course",
  properties: { plasma: { thrust: 46000 } },
  vehicles: [
    { label: "Ion aft", loadout: fighter(["ion", "ion"]) },
    {
      label: "Plasma aft, 46k shared thrust",
      loadout: fighter(["plasma", "plasma"]),
    },
  ],
};
