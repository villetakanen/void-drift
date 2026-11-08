import { FIGHTER } from "./fighter";
import { WASP } from "./wasp";

type Point = readonly [number, number];
interface Face {
  points: readonly Point[];
  color: string;
}
const [light, top, left, dark, right, mid] = FIGHTER.facets;
const face = (color: string, points: readonly Point[]): Face => ({
  color,
  points,
});

// Study trace of the supplied 16:23 sketch. Coordinates are in its 398 × 783
// image frame, with black glass following the current-cycle decision.
export const FIDDLER_DRAFT_FACES: readonly Face[] = [
  face(left, [
    [106, 336],
    [116, 353],
    [155, 366],
    [145, 395],
    [120, 403],
    [85, 436],
    [140, 445],
    [136, 480],
    [73, 448],
    [19, 500],
  ]),
  face(dark, [
    [284, 342],
    [274, 353],
    [235, 366],
    [245, 395],
    [268, 400],
    [303, 436],
    [250, 445],
    [254, 480],
    [313, 449],
    [371, 504],
  ]),
  face(dark, [
    [120, 403],
    [145, 395],
    [140, 445],
    [85, 436],
  ]),
  face(left, [
    [245, 395],
    [268, 400],
    [303, 436],
    [250, 445],
  ]),
  face(mid, [
    [80, 245],
    [106, 350],
    [19, 500],
    [39, 429],
  ]),
  face(top, [
    [80, 245],
    [106, 350],
    [39, 429],
  ]),
  face(right, [
    [310, 245],
    [284, 350],
    [371, 504],
    [350, 429],
  ]),
  face(top, [
    [310, 245],
    [350, 429],
    [284, 350],
  ]),
  face(light, [
    [80, 56],
    [104, 56],
    [104, 127],
    [80, 175],
    [56, 175],
  ]),
  face(mid, [
    [286, 56],
    [310, 56],
    [334, 175],
    [310, 175],
    [286, 127],
  ]),
  face(light, [
    [56, 175],
    [80, 175],
    [80, 245],
    [60, 326],
    [45, 333],
  ]),
  face(top, [
    [104, 127],
    [104, 337],
    [80, 245],
    [80, 175],
  ]),
  face(mid, [
    [334, 175],
    [345, 332],
    [330, 326],
    [310, 245],
    [310, 175],
  ]),
  face(light, [
    [286, 127],
    [310, 175],
    [310, 245],
    [286, 342],
  ]),
  face(top, [
    [45, 333],
    [60, 326],
    [59, 337],
  ]),
  face(light, [
    [330, 326],
    [345, 332],
    [331, 337],
  ]),
  face(light, [
    [164, 287],
    [187, 287],
    [187, 357],
    [171, 390],
    [162, 405],
    [140, 405],
  ]),
  face(top, [
    [187, 287],
    [203, 287],
    [203, 357],
    [195, 340],
    [187, 357],
  ]),
  face(mid, [
    [203, 287],
    [227, 287],
    [249, 405],
    [228, 405],
    [219, 390],
    [203, 357],
  ]),
  face(light, [
    [140, 405],
    [162, 405],
    [156, 537],
    [130, 549],
  ]),
  face(mid, [
    [228, 405],
    [249, 405],
    [260, 549],
    [234, 537],
  ]),
  face(top, [
    [162, 405],
    [171, 390],
    [171, 457],
    [156, 537],
  ]),
  face(right, [
    [219, 390],
    [228, 405],
    [234, 537],
    [219, 457],
  ]),
  face(light, [
    [156, 537],
    [171, 457],
    [184, 761],
    [172, 772],
  ]),
  face(mid, [
    [219, 457],
    [234, 537],
    [217, 772],
    [206, 761],
  ]),
  face(top, [
    [171, 457],
    [195, 493],
    [195, 754],
    [184, 761],
  ]),
  face(right, [
    [195, 493],
    [219, 457],
    [206, 761],
    [195, 754],
  ]),
  face(left, [
    [100, 561],
    [130, 549],
    [142, 652],
    [127, 658],
  ]),
  face(mid, [
    [130, 549],
    [156, 537],
    [163, 642],
    [142, 652],
  ]),
  face(dark, [
    [234, 537],
    [260, 549],
    [248, 652],
    [227, 642],
  ]),
  face(left, [
    [260, 549],
    [290, 561],
    [263, 658],
    [248, 652],
  ]),
  face(WASP.facets[WASP.facets.length - 1].color, [
    [195, 340],
    [219, 390],
    [219, 457],
    [195, 493],
    [171, 457],
    [171, 390],
  ]),
];

// The sketch's canopy length matches Wasp's 19.5-unit canopy at this baseline.
export const FIDDLER_DRAFT_PIXELS_PER_UNIT = (493 - 340) / 19.5;
export const fiddlerDraftPoint = ([x, y]: Point, hullScale = 1): Point => [
  ((x - 195) / FIDDLER_DRAFT_PIXELS_PER_UNIT) * hullScale,
  ((y - 414) / FIDDLER_DRAFT_PIXELS_PER_UNIT) * hullScale,
];
