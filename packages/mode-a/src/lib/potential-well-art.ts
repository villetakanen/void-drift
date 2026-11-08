import { z } from "zod";

const FaceSchema = z.object({
  path: z.string(),
  fill: z.string(),
  stroke: z.string(),
  width: z.number().nonnegative(),
});
export const POTENTIAL_WELL_SCALE = 0.55;
// Accepted 02.8 normal and 02.9 A heavy; artwork is nose-up, transformed to local +x here.
export const POTENTIAL_WELL_ART = z
  .object({ normal: z.array(FaceSchema), heavy: z.array(FaceSchema) })
  .parse({
    normal: [
      {
        path: "M-2,-3L2,3M2,-3L-2,3M-2,0H2",
        fill: "none",
        stroke: "#7894a4",
        width: 0.55,
      },
      { path: "M-4,-5H-2V5H-4Z", fill: "#cedb17", stroke: "none", width: 0.0 },
      {
        path: "M-2.5,-5H-2V5H-2.5Z",
        fill: "#87920f",
        stroke: "none",
        width: 0.0,
      },
      { path: "M2,-5H4V5H2Z", fill: "#cedb17", stroke: "none", width: 0.0 },
      { path: "M3.5,-5H4V5H3.5Z", fill: "#87920f", stroke: "none", width: 0.0 },
      {
        path: "M-3.9200000000000004,-8.0a3.9200000000000004,3.9200000000000004 0 1,0 7.840000000000001,0a3.9200000000000004,3.9200000000000004 0 1,0 -7.840000000000001,0",
        fill: "#12171e",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M7.00,-8.00L4.95,-3.05L2.72,-5.28L3.85,-8.00Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M4.95,-3.05L0.00,-1.00L0.00,-4.15L2.72,-5.28Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M0.00,-1.00L-4.95,-3.05L-2.72,-5.28L0.00,-4.15Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-4.95,-3.05L-7.00,-8.00L-3.85,-8.00L-2.72,-5.28Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-7.00,-8.00L-4.95,-12.95L-2.72,-10.72L-3.85,-8.00Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-4.95,-12.95L-0.00,-15.00L-0.00,-11.85L-2.72,-10.72Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-0.00,-15.00L4.95,-12.95L2.72,-10.72L-0.00,-11.85Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M4.95,-12.95L7.00,-8.00L3.85,-8.00L2.72,-10.72Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-3.9200000000000004,8.0a3.9200000000000004,3.9200000000000004 0 1,0 7.840000000000001,0a3.9200000000000004,3.9200000000000004 0 1,0 -7.840000000000001,0",
        fill: "#12171e",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M7.00,8.00L4.95,12.95L2.72,10.72L3.85,8.00Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M4.95,12.95L0.00,15.00L0.00,11.85L2.72,10.72Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M0.00,15.00L-4.95,12.95L-2.72,10.72L0.00,11.85Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-4.95,12.95L-7.00,8.00L-3.85,8.00L-2.72,10.72Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-7.00,8.00L-4.95,3.05L-2.72,5.28L-3.85,8.00Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-4.95,3.05L-0.00,1.00L-0.00,4.15L-2.72,5.28Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-0.00,1.00L4.95,3.05L2.72,5.28L-0.00,4.15Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M4.95,3.05L7.00,8.00L3.85,8.00L2.72,5.28Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
    ],
    heavy: [
      {
        path: "M-2,-5.95L2,5.95M2,-5.95L-2,5.95M-2,0.0H2",
        fill: "none",
        stroke: "#7894a4",
        width: 0.7,
      },
      {
        path: "M-4,-5.95H-2V5.95H-4Z",
        fill: "#cedb17",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-2.5,-5.95H-2V5.95H-2.5Z",
        fill: "#87920f",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M2,-5.95H4V5.95H2Z",
        fill: "#cedb17",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M3.5,-5.95H4V5.95H3.5Z",
        fill: "#87920f",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-5.040000000000001,-10.0a5.040000000000001,5.040000000000001 0 1,0 10.080000000000002,0a5.040000000000001,5.040000000000001 0 1,0 -10.080000000000002,0",
        fill: "#12171e",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M9.000,-10.000L6.364,-3.636L3.500,-6.500L4.950,-10.000Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M6.364,-3.636L0.000,-1.000L0.000,-5.050L3.500,-6.500Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M0.000,-1.000L-6.364,-3.636L-3.500,-6.500L0.000,-5.050Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-6.364,-3.636L-9.000,-10.000L-4.950,-10.000L-3.500,-6.500Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-9.000,-10.000L-6.364,-16.364L-3.500,-13.500L-4.950,-10.000Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-6.364,-16.364L-0.000,-19.000L-0.000,-14.950L-3.500,-13.500Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-0.000,-19.000L6.364,-16.364L3.500,-13.500L-0.000,-14.950Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M6.364,-16.364L9.000,-10.000L4.950,-10.000L3.500,-13.500Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-5.040000000000001,10.0a5.040000000000001,5.040000000000001 0 1,0 10.080000000000002,0a5.040000000000001,5.040000000000001 0 1,0 -10.080000000000002,0",
        fill: "#12171e",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M9.000,10.000L6.364,16.364L3.500,13.500L4.950,10.000Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M6.364,16.364L0.000,19.000L0.000,14.950L3.500,13.500Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M0.000,19.000L-6.364,16.364L-3.500,13.500L0.000,14.950Z",
        fill: "#304759",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-6.364,16.364L-9.000,10.000L-4.950,10.000L-3.500,13.500Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-9.000,10.000L-6.364,3.636L-3.500,6.500L-4.950,10.000Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-6.364,3.636L-0.000,1.000L-0.000,5.050L-3.500,6.500Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M-0.000,1.000L6.364,3.636L3.500,6.500L-0.000,5.050Z",
        fill: "#d1e5ec",
        stroke: "none",
        width: 0.0,
      },
      {
        path: "M6.364,3.636L9.000,10.000L4.950,10.000L3.500,6.500Z",
        fill: "#7894a4",
        stroke: "none",
        width: 0.0,
      },
    ],
  });
const cachedPaths = new Map<string, Path2D>();
export function drawPotentialWell(
  ctx: CanvasRenderingContext2D,
  heavy = false,
) {
  ctx.save();
  ctx.rotate(Math.PI / 2);
  ctx.scale(POTENTIAL_WELL_SCALE, POTENTIAL_WELL_SCALE);
  for (const face of POTENTIAL_WELL_ART[heavy ? "heavy" : "normal"]) {
    let path = cachedPaths.get(face.path);
    if (!path) {
      path = new Path2D(face.path);
      cachedPaths.set(face.path, path);
    }
    if (face.fill !== "none") {
      ctx.fillStyle = face.fill;
      ctx.fill(path);
    }
    if (face.stroke !== "none") {
      ctx.strokeStyle = face.stroke;
      ctx.lineWidth = face.width;
      ctx.stroke(path);
    }
  }
  ctx.restore();
}
