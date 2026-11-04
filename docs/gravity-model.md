# Gravity model: reasoning

Why gravity works the way [gravity-field.md](specs/gravity-field.md) says, and the
alternatives already weighed. The spec is the contract; this is the thinking
behind it, to return to when the model is questioned again. Evidence came from
the [Gravity tuning](specs/gravity-tuning.md) bench (`/lab/gravity-tuning`), with
the four given ships on the instrument's burns.

## The problem the old model had

The 29 October well curve, `strength / 6 × ((reach / distance)² − 1)`, lets the
reach shape the pull everywhere inside it: change a body's size and its whole
pull changes. Strength and reach were set apart from each other and from any
mass. That drifted from the older, mass-based planet rule.

## A point mass with 1/d² cannot work

The first bench law was `G × mass / distance²` with a reach cut-off and no body.
With strength 2000 and reach 1000 the pull is 2 u/s² at the edge, 8 at 500 u,
50 at 200 u, 200 at 100 u and 800 at 50 u, against ship thrust of about
340–680 u/s². Gravity was under 10 % of thrust beyond about 300 u and a half-second
spike near the centre: paths ran straight, were flung, and ran straight again.

The ratio of edge pull to closest-pass pull is `(reach / closest distance)²`. A
point mass lets the closest distance go to zero, so no single strength can be
noticeable at the edge and survivable at the core. Strength scales the whole
curve; reach only moves the cut-off into the region where the pull is already
near zero. The model, not the values, was wrong.

## Two missing variables

- **A body.** Masses have a surface, as the game's planets do. Within contact
  distance (body radius + ship radius) there is no pull; a ship that reaches it
  bounces off with the planet rule. The body bounds the pull at
  `pull(contact distance)`.
- **The falloff.** The game world is flat, and in a plane a mass's pull falls as
  `1 / d`. The bench offers both `G × m / d²` (`G = 1000`) and
  `G₂ × m / d` (`G₂ = 10`, equal at 100 u). With a body, 1/d² behaved sanely
  on the bench, and it is the more physical choice; play uses it.

## The reach is a cut-off pull, not a multiple of mass

Pull below about 50 u/s² (roughly 10 % of thrust) changed nothing visible. A
linear reach, `sizeMultiplier × mass`, cannot keep that consistent: under 1/d²
the edge pull is `G / (size² × mass)`, so heavier bodies get weaker edges and
every body would need its own multiplier.

So the reach is where the pull falls to a cut-off pull, the same for every
body: `√(G × mass / cutoff)` for 1/d², `G₂ × mass / cutoff` for 1/d. Every edge
then means the same thing. A bench run with mass 10000 and a hand-set reach of
500 u matched the rule: `√(1000 × 10000 / 50) ≈ 447 u`.

## Mass comes from size and the pull wanted at the surface

For gravity to matter, the pull at contact distance has to be in the range of
ship thrust. That fixes each body's mass:

`mass = surface pull × (contact distance)² / G`

Today's planet "masses" (220–1200) belonged to another formula and are not
comparable. Play's targets: planets about 1× reference thrust at contact (a
real pull, escapable), the sun about 2× (going deep is lethal).

## Coupling with ship thrust

Surface pull targets and the cut-off are relative to thrust. Lowering ship thrust
later makes the same masses relatively stronger and the cut-off relatively
weaker, so the masses must be recomputed.

Two ways were weighed:

1. Store ratios (surface pull as a multiple of a reference thrust) and derive the
   masses when the game loads, so they follow thrust automatically. Rejected:
   the "reference" is a choice across ships with thrust 340–680, the game would
   need to compute thrust from engine values, and retuning one ship would
   silently change the world for every ship.
2. **Chosen:** store absolute masses in the tuning file and guard the ratio with
   a test. The test computes the reference ship's thrust and checks each body's
   surface pull against it; lowering thrust fails the test and names the bodies,
   and the masses are retuned on the bench on purpose.

The reference ship is the Fighter's starter loadout, the game's default ship:
peak acceleration about 600 u/s² on B1, collision radius about 31 u. It can be
changed in one place, the guard test.

## Numbers in play

From the formula above with the reference ship (contact distance = body radius +
31.2 u), planets at 1×, the sun at 2×, cut-off 50 u/s², 1/d²:

| Body      | Radius | Mass | Reach |
| --------- | ------ | ---- | ----- |
| Moon      | 18     | 1450 | ≈ 170 |
| Rock      | 30     | 2250 | ≈ 212 |
| Gas giant | 45     | 3500 | ≈ 265 |
| G sun     | 35     | 5250 | ≈ 324 |

## Still open

- Whether 1/d replaces 1/d² if play shows passes too sharp.
- The cut-off value once flown in play; 50 u/s² is the bench reading.
- Other sun types (O–M) for random systems, which today keep their configured
  masses under the old multiplier.
