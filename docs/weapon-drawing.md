# Weapon drawing

The current Light Ion Cannon and Ion Point Defence establish a weapon construction
language. This guide describes their adopted artwork, alongside the general
[ship drawing](ship-drawing.md) method. It does not define a Plasma Projector form.

## An assembly of distinct parts

The cannon has a long, narrow dark barrel carried by a shorter, wider coloured
housing. The barrel continues through the housing and projects behind it. Two
side blocks give the housing volume; a crossbar joins the assembly across the
barrel. Their overlaps explain how the parts fit together. The whole weapon is
not one faceted shell, and the housing is not a band painted around that shell.

The barrel has its own construction: a broad dark face, a narrow lighter side
face, a dark receding face and a small bevel at the front. The bright ion channel
is a narrow strip running along the barrel to its tip. It is embedded in the
object, so the emission has a visible origin even when the weapon is inactive.

The housing has a different material from the barrel. Its left block is pale
cyan, its right block blue-grey, and its crossbar a middle cyan. The light and
dark surfaces describe left/upper illumination and physical volume. They are
solid coloured machinery; the saturated blue channel is the active-material cue.
The colours and proportions of these two ion weapons are references, not a
requirement that every weapon use cyan or a long barrel.

## A turret is the same assembly on a base

Point defence retains the barrel, channel, side housing and crossbar construction
with a shorter forward projection, carried by two concentric base discs. The
base centre defines the pivot. Rim slots and an index mark make rotation legible;
they turn with the barrel and housing while the base's lighting stays with the
ship. The discs use the existing approved gradients. That specific round-base
treatment does not change the flat-plane method for barrels, housings or hulls.

This makes the difference in role physical: the cannon extends along its firing
axis, while the turret is organized around a turning centre. A new weapon needs
an equally clear relationship between its working part, supporting body and
attachment. Internal functions such as a pressure chamber or capacitor are not
established by these drawings and should not be invented as facts about them.

## Attachment, opening and scale

The cannon's mount sits within its housing, rather than at the midpoint of the
full silhouette. The point-defence mount is its base centre. Each muzzle is the
end of the channel in that same geometry. Preview, Plan, catalogue and flight
consume the shared artwork and anchors; an effects painter does not invent a
second muzzle position.

Current sizes are a 16-world-unit cannon length and an 8-world-unit turret base
diameter. The build renderer converts through the shared 0.65 flight scale.
Mount layering belongs to the chassis: exposed artwork must read as a complete
assembly, while a partly buried fitting must retain its identity in the visible
forward portion. Clearance alone does not establish a successful weapon form.

## Applying the construction method

Start with the weapon's role and arrange its working part, housing and attachment
as distinct solids. Establish their proportions, overlaps and emission opening
before dividing the surfaces into lit and shaded planes. Keep the active-material
accent attached to a physical feature. Inspect the complete assembly and its
visible portion on the ship, enlarged and at flight scale.

A material-family reference can guide colour and light. It does not supply the
construction of another category of equipment. In particular, recomposing plasma
engine shells, bands and nozzles did not establish a plasma weapon form in the
[fitting study, round 02.1](../apps/web/src/pages/lab/studies/plasma-projector-fitting-2026-11-17.mdx).
That round is retained as evidence of the missing distinction. Its dimensions,
outlets and proposed preference are not adopted weapon guidance.

## Sources and ownership

- [Light Ion Cannon contract](specs/game/light-ion-cannon/spec.md) and
  [artwork](../packages/mode-a/src/lib/ion-cannon-art.ts): paths, housing-centred
  attachment, channel-tip muzzle and scale.
- [Ion Point Defence contract](specs/game/ion-point-defence/spec.md) and
  [artwork](../packages/mode-a/src/lib/point-defence-art.ts): component construction,
  concentric base, pivot, lighting and turning marks.
- [Shared build renderer](../packages/mode-a/src/lib/build-renderer.ts): Preview,
  Plan, mount transforms, hull occlusion and flight conversion.

Changes to those adopted weapons belong in their feature contracts. New weapons
must settle their own form; this description supplies the missing construction
reference, not a universal parts recipe.
