/**
 * Utility functions for canvas path manipulation
 */

export type PathPoint = { x: number; y: number };

/**
 * Extract points array from a path object in various formats
 */
export function getPathPoints(path: any): PathPoint[] {
  const ptsRaw =
    path?.paths || path?.points || path?.stroke?.points || path?.path || [];
  if (!Array.isArray(ptsRaw)) return [];
  return ptsRaw
    .map((pt: any) => ({ x: pt.x ?? pt[0], y: pt.y ?? pt[1] }))
    .filter((pt) => pt.x != null && pt.y != null);
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(
  x: number,
  y: number,
  cx: number,
  cy: number,
  r: number
): boolean {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Calculate distance from a point to a line segment (squared for performance)
 */
export function distPointToSegSq(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const denom = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((cx - ax) * abx + (cy - ay) * aby) / denom));
  const dx = ax + t * abx - cx;
  const dy = ay + t * aby - cy;
  return dx * dx + dy * dy;
}

/**
 * Calculate distance from a point to a line segment
 */
export function distPointToSeg(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): number {
  return Math.sqrt(distPointToSegSq(ax, ay, bx, by, cx, cy));
}

/**
 * Find line-circle intersections for a line segment from (ax,ay) to (bx,by)
 * Returns array of t values (0-1) where intersections occur, sorted
 */
export function lineCircleIntersections(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  r: number
): number[] {
  const dx = bx - ax;
  const dy = by - ay;
  const fx = ax - cx;
  const fy = ay - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0 || a === 0) return [];
  const s = Math.sqrt(disc);
  const t1 = (-b - s) / (2 * a);
  const t2 = (-b + s) / (2 * a);
  const ts: number[] = [];
  if (t1 >= 0 && t1 <= 1) ts.push(t1);
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-6) ts.push(t2);
  return ts.sort();
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function pointInPolygon(
  x: number,
  y: number,
  poly: PathPoint[]
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Export paths from canvas instance
 */
export async function exportPathsFromCanvas(instance: any): Promise<any[]> {
  const exported: any = (await instance?.exportPaths?.()) || [];
  return Array.isArray(exported) ? exported : exported.paths || [];
}

