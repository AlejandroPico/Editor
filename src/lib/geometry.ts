import type { EdgeEntity, NodeEntity, Point } from '../model/project';

export function snap(value: number, step: number): number {
  return Math.round(value / Math.max(1, step)) * Math.max(1, step);
}

export function nodeCenter(node: NodeEntity): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

export function edgePoints(edge: EdgeEntity, source: NodeEntity, target: NodeEntity): Point[] {
  return [nodeCenter(source), ...edge.waypoints, nodeCenter(target)];
}

export function edgePath(edge: EdgeEntity, source: NodeEntity, target: NodeEntity): string {
  const points = edgePoints(edge, source, target);
  const first = points[0];
  if (edge.route === 'straight') return `M ${first.x} ${first.y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`;
  if (edge.route === 'orthogonal') {
    let path = `M ${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const point = points[i];
      const middleX = (previous.x + point.x) / 2;
      path += ` L ${middleX} ${previous.y} L ${middleX} ${point.y} L ${point.x} ${point.y}`;
    }
    return path;
  }
  if (points.length === 2) {
    const last = points[1];
    const middleX = (first.x + last.x) / 2;
    return `M ${first.x} ${first.y} C ${middleX} ${first.y}, ${middleX} ${last.y}, ${last.x} ${last.y}`;
  }
  let path = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const point = points[i];
    const middle = { x: (previous.x + point.x) / 2, y: (previous.y + point.y) / 2 };
    path += ` Q ${previous.x} ${previous.y} ${middle.x} ${middle.y}`;
  }
  const last = points.at(-1)!;
  path += ` T ${last.x} ${last.y}`;
  return path;
}

export function pointInRect(point: Point, start: Point, end: Point): boolean {
  return point.x >= Math.min(start.x, end.x) && point.x <= Math.max(start.x, end.x)
    && point.y >= Math.min(start.y, end.y) && point.y <= Math.max(start.y, end.y);
}
