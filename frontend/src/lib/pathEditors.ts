/**
 * Utility functions for editing paths (translate, scale, rotate, recolor, etc.)
 */

import { exportPathsFromCanvas, getPathPoints } from "./canvasUtils";

/**
 * Transform points in a path using a mapping function
 */
function mapPathPoints(
  path: any,
  mapFn: (x: number, y: number) => [number, number]
): any {
  const pts = path?.paths || path?.points || path?.stroke?.points || path?.path;
  if (!Array.isArray(pts)) return path;

  const mapPoint = (pt: any) => {
    const px = pt.x ?? pt[0];
    const py = pt.y ?? pt[1];
    const [nx, ny] = mapFn(px, py);
    if (pt.x != null && pt.y != null) return { ...pt, x: nx, y: ny };
    return [nx, ny];
  };

  if (path.paths) return { ...path, paths: pts.map(mapPoint) };
  if (path.points) return { ...path, points: pts.map(mapPoint) };
  if (path.stroke?.points)
    return { ...path, stroke: { ...path.stroke, points: pts.map(mapPoint) } };
  if (path.path) return { ...path, path: pts.map(mapPoint) };
  return path;
}

/**
 * Apply a transform function to selected paths and reload canvas
 */
export async function applyTransformToPaths(
  instance: any,
  paths: any[],
  indices: number[],
  mapFn: (x: number, y: number) => [number, number]
): Promise<void> {
  const updated = paths.map((p: any, i: number) => {
    if (!indices.includes(i)) return p;
    return mapPathPoints(p, mapFn);
  });
  await instance.clearCanvas?.();
  await instance.loadPaths?.(updated);
}

/**
 * Translate selected paths by dx, dy
 */
export async function translateSelectedPaths(
  instance: any,
  paths: any[],
  indices: number[],
  dx: number,
  dy: number
): Promise<void> {
  await applyTransformToPaths(instance, paths, indices, (px, py) => [
    px + dx,
    py + dy,
  ]);
}

/**
 * Scale selected paths around a center point
 */
export async function scaleSelectedPaths(
  instance: any,
  paths: any[],
  indices: number[],
  cx: number,
  cy: number,
  factor: number
): Promise<void> {
  await applyTransformToPaths(instance, paths, indices, (px, py) => {
    return [cx + (px - cx) * factor, cy + (py - cy) * factor];
  });
}

/**
 * Rotate selected paths around a center point
 */
export async function rotateSelectedPaths(
  instance: any,
  paths: any[],
  indices: number[],
  cx: number,
  cy: number,
  degrees: number
): Promise<void> {
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  await applyTransformToPaths(instance, paths, indices, (px, py) => {
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  });
}

/**
 * Recolor selected paths
 */
export async function recolorSelectedPaths(
  instance: any,
  paths: any[],
  indices: number[],
  color: string
): Promise<void> {
  const updated = paths.map((p: any, i: number) => {
    if (!indices.includes(i)) return p;
    if (p.strokeColor) return { ...p, strokeColor: color };
    if (p.stroke?.color) return { ...p, stroke: { ...p.stroke, color } };
    if (p.color) return { ...p, color };
    return { ...p, strokeColor: color };
  });
  await instance.clearCanvas?.();
  await instance.loadPaths?.(updated);
}

/**
 * Change stroke width of selected paths
 */
export async function restyleWidthSelectedPaths(
  instance: any,
  paths: any[],
  indices: number[],
  width: number
): Promise<void> {
  const updated = paths.map((p: any, i: number) => {
    if (!indices.includes(i)) return p;
    if (p.strokeWidth != null) return { ...p, strokeWidth: width };
    if (p.stroke?.width != null)
      return { ...p, stroke: { ...p.stroke, width } };
    if (p.width != null) return { ...p, width };
    return { ...p, strokeWidth: width };
  });
  await instance.clearCanvas?.();
  await instance.loadPaths?.(updated);
}

/**
 * Delete selected paths by indices
 */
export async function deleteSelectedPaths(
  instance: any,
  paths: any[],
  indices: number[]
): Promise<void> {
  const keepSet = new Set(indices);
  const remaining = paths.filter((_: any, i: number) => !keepSet.has(i));
  await instance.clearCanvas?.();
  await instance.loadPaths?.(remaining);
}

/**
 * Compute bounding box for selected paths
 */
export function computeSelectionBBox(
  paths: any[],
  indices: number[]
): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < paths.length; i++) {
    if (!indices.includes(i)) continue;
    const pts = getPathPoints(paths[i]);
    if (pts.length === 0) continue;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Recompute and return bbox for selected paths from canvas
 */
export async function recomputeSelectionBBox(
  instance: any,
  indices: number[]
): Promise<{ x: number; y: number; w: number; h: number } | null> {
  if (!instance || indices.length === 0) return null;
  const paths = await exportPathsFromCanvas(instance);
  return computeSelectionBBox(paths, indices);
}

export { exportPathsFromCanvas };
