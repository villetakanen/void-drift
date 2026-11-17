# Design

Void Drift is a modern indie space game about the pleasure of flying distinctive
ships, fitting them for different approaches, and discovering what momentum and
gravity let them do. Its [vision](vision.md) gives those choices stakes through
rivalry: the ship you bring and the way you fly it matter.

This document describes the experience, design principles and visual language
that guide the project. Use it when deciding what belongs in the game and how
it should feel, look and speak. Feature specs describe particular behaviour;
the design system supplies the shared interface definitions.

## Intent

Void Drift is a tribute to the games that made choosing a ship, fitting weapons
and flying into trouble feel exciting: Master of Orion 2's ship building, Star
Control 2's Super Melee, and the inventive PC and indie flying games of that era.
The old demoscene is another reference for its sense of craft: simple means,
carefully composed, can produce something striking.

The ambition is a game that feels crisp and modern, with the personality of an
indie creation. It is not a retro game. Pixel graphics and a simulated period
look are not its visual direction. The inheritance is the inventiveness, the
pleasure of flight and the care put into the result.

We value curiosity, the satisfaction of learning a ship, and the surprise of
seeing a familiar situation change with a different fitting or approach. Space
should invite the player to explore and experiment with motion. Combat and
rivalry give that learning consequences. The game should delight its maker,
welcome a stranger through a link, and let other builders see how it was made.

## Principles

**Flying is a pleasure in itself.** Turning, burning and releasing into drift
should reward the player with satisfying movement and expressive light. An
ordinary manoeuvre can be a small graphic performance. Give motion weight,
rhythm and a visible trace while keeping the ship and the situation readable.

**Ships are characters and choices.** A player should recognise a ship and feel
something about it before flying it. Silhouette, stance and machinery carry
that character; handling and capabilities make the choice consequential. A
different ship or fitting should invite a different way to fly and think.
Players explore through ships and parts; underlying flight tuning belongs in
the Lab.

**Physics creates opportunities.** Inertia, gravity and orbital motion give the
player things to discover and use. Preserve the pleasure of learning how a ship
behaves and finding a useful manoeuvre. Shape the physics for an engaging,
understandable game; physical realism is not the measure of success.

**Every control answers.** An action has an understandable response. The player
can tell what they are holding, what is selected and what is unavailable.
Feedback and instructions agree with the controls. Responsiveness means the
ship answers the pilot's input while retaining its own inertia and character.

## Art direction

### Hi-fi low-fi

Use a simple visual vocabulary with high fidelity in its execution. Crisp
silhouettes, deliberate proportions, convincing materials, composed light and
careful transitions give economical forms richness. A small number of shapes
can carry a strong character; their movement and overlap can make a spectacle.
Simplicity should not drain the picture of energy.

Procedural craft is part of the identity. Visible rendering character can be
expressive when deliberately composed, as in the demoscene reference. Judge
the result by its presence, clarity and motion. Low-fi describes the means and
the vocabulary; it is not an excuse for an unfinished result.

The renderer carries the demoscene reference out as a method. It treats the
browser as the machine a demo is written for and builds effects from the
browser's own blending, scaling and filters. The stepping, banding and hard
blends that come from doing this cheaply are kept as part of the picture's
character. This is rendering character from today's machine; the game still does
not imitate the look of old hardware. The
[render contract](specs/game/render/spec.md) states the method and its rules.

### Suggest a world

Deliberately compose the image to suggest a world rather than trying to
reproduce one. A shared art direction can give hulls, natural bodies and light
distinct drawing languages; they need not share the same construction technique.

Ships have constructed volume and purposeful machinery. Natural bodies need
their own sense of mass and material. Light can swell, overlap and dissolve.
Their relationship in the composed scene makes them belong to the same world;
the ship's planar construction is not a recipe for drawing a planet.

The void gives objects and light room to read. High contrast and luminous
colour carry energy and emphasis. The world has its own material and effect
colours; interface colour roles do not prescribe the palette of every ship,
star or plume.

### Ship drawing fundamentals

Start with character, build a convincing object, and keep the features that
carry its identity at flight scale. Hulls use flat planes; cockpit glass has
its own approved material language. The [ship drawing guide](ship-drawing.md)
preserves the construction method, lighting and material rules.

The cannon and point defence are assemblies with distinct working parts, housings and attachments.
The [weapon drawing guide](weapon-drawing.md) describes that construction in the
current cannon and point defence, including their material separation and
emission origins.

## Interface

The interface should feel like a starship UI. Typography, lit panes, frames and
clear states give menus, the Hangar and shared controls a coherent identity.
Buttons, choices and navigation remain easy to recognise and operate; the
science-fiction treatment supports their purpose.

Flight controls have a distinct job. They are equipment the pilot uses while
flying: their placement, touch behaviour and immediate feedback serve continuous
control of the ship. General interface controls serve commands, selection and
navigation. Both share the visual language, with forms and interactions suited
to those different tasks. A thrust pad and a menu button are different kinds
of control.

Keyboard play on laptop and desktop is primary; landscape iPad touch plays the
same game. Clear focus, readable information and reduced-motion support belong
to the experience. The Lab is a separate design workspace for screens 1280px
wide and up, sharing the visual language and the systems it examines.

## Brand

The identity combines the precision of a starship interface with the expressive
craft of an indie game. It should feel contemporary, deliberate and recognisable.

**The mark.** ∅·Δ reads “void · drift” and is the only brand mark. The title screen
also displays “VOID DRIFT” as a normal heading beneath it.

**Colour has a job.** In the interface, lime identifies the brand and marks what
can be acted on or is selected. Information such as captions, descriptions and
values uses text roles. Name the job, not the colour. Component states and
their exceptions belong in the design system.

**Voice.** The voice leans toward serious science fiction, with room for mystery.
The [title-screen hints](specs/game/landing-page/hints.md) are the reference: short
glimpses of ships, manufacturers and past events suggest a world with history.
“Remnants of the Oberon Monolith still drift from the Battle of Terra” leaves
something for the player to imagine. “Luna Heavy Industries’ WASP was the
workhorse of the Sol Allied Fleet” gives a machine a place in that world.

Practical copy stays direct. Name the action, the control or the consequence
clearly, as in “Turn on Playground to fly more ships and parts.” Lore invites
curiosity; instructions help the player act. Both use concise, concrete language.

## Where details live

- Tokens, type, colour roles, elevation, inputs, buttons, identity:
  [design system core](specs/factory/design-system/spec.md).
- Ship construction and materials: [ship drawing](ship-drawing.md) and
  [cockpit materials](specs/factory/cockpit-materials/spec.md).
- Game behaviour, modes, controls and camera: [game](specs/game/spec.md).
- Choosing, fitting and trying ships: [Hangar](specs/game/hangar/spec.md).
- Light and motion: [effects](specs/factory/effects/spec.md).
- Production constraints: [architecture](architecture.md).
- Lab practice, verification and performance: [development](development.md).

Changes to these principles require explicit agreement in the design
conversation. The [design-study process](specs/lab/design-studies/spec.md)
explains how a study proposes a change. Study outcomes and implementation
details belong in their own documents.
