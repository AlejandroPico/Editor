import type { Area, AtlasProject, AxisDefinition, EdgeEntity, EventEntity, NodeEntity, Point } from '../model/project';

export function snap(value: number, step: number): number {
  return Math.round(value / Math.max(1, step)) * Math.max(1, step);
}

export interface Rect { x: number; y: number; width: number; height: number }

export function areaContentRect(area: Area | undefined, project: AtlasProject): Rect {
  if (!area) return { x: 60, y: 60, width: project.board.width - 120, height: project.board.height - 120 };
  return { x: area.x + area.padding.left, y: area.y + area.padding.top, width: Math.max(1, area.width - area.padding.left - area.padding.right), height: Math.max(1, area.height - area.padding.top - area.padding.bottom) };
}

export function axisValueRatio(axis: AxisDefinition, value: number | string | null): number | null {
  if (value == null || axis.mode === 'none') return null;
  let ratio: number;
  if (axis.mode === 'categories') {
    const index = typeof value === 'number' ? value : axis.categories.indexOf(String(value));
    if (index < 0) return null;
    ratio = axis.categories.length <= 1 ? .5 : index / (axis.categories.length - 1);
  } else {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    ratio = (numeric - axis.min) / Math.max(.000001, axis.max - axis.min);
  }
  const clamped = Math.max(0, Math.min(1, ratio));
  return axis.reverse ? 1 - clamped : clamped;
}

export function axisValuePosition(axis: AxisDefinition, value: number | string | null, start: number, length: number): number | null {
  const ratio = axisValueRatio(axis, value);
  return ratio == null ? null : start + ratio * length;
}

export function positionAxisValue(axis: AxisDefinition, position: number, start: number, length: number): number | string | null {
  if (axis.mode === 'none') return null;
  let ratio = Math.max(0, Math.min(1, (position - start) / Math.max(1, length)));
  if (axis.reverse) ratio = 1 - ratio;
  if (axis.mode === 'categories') return axis.categories[Math.round(ratio * Math.max(0, axis.categories.length - 1))] ?? null;
  return axis.min + ratio * (axis.max - axis.min);
}

function rawNodeRect(node: NodeEntity, project?: AtlasProject): Rect {
  if (!project || node.placement?.mode !== 'semantic') return { x: node.x, y: node.y, width: node.width, height: node.height };
  const area = project.areas.find(item => item.id === node.placement.areaId);
  const rect = areaContentRect(area, project);
  const useX = !area || area.axisX;
  const useY = !area || area.axisY;
  const cx = useX ? axisValuePosition(project.board.axes.x, node.placement.xValue, rect.x, rect.width) : null;
  const cy = useY ? axisValuePosition(project.board.axes.y, node.placement.yValue, rect.y, rect.height) : null;
  return { x: (cx ?? node.x + node.width / 2) + node.placement.offsetX - node.width / 2, y: (cy ?? node.y + node.height / 2) + node.placement.offsetY - node.height / 2, width: node.width, height: node.height };
}

export function resolvedNodeRect(node: NodeEntity, project?: AtlasProject): Rect {
  const raw=rawNodeRect(node,project);
  if(!project||node.placement?.mode!=='semantic'||!node.placement.avoidOverlap)return raw;
  const index=project.nodes.findIndex(item=>item.id===node.id);if(index<=0)return raw;
  const previous=project.nodes.slice(0,index).filter(item=>item.placement?.mode==='semantic'&&item.placement.areaId===node.placement.areaId).map(item=>resolvedNodeRect(item,project));
  const overlaps=(x:number)=>previous.some(rect=>Math.abs((rect.x+rect.width/2)-(x+raw.width/2))<(rect.width+raw.width)/2+18&&Math.abs((rect.y+rect.height/2)-(raw.y+raw.height/2))<(rect.height+raw.height)/2+42);
  if(!overlaps(raw.x))return raw;
  const gap=raw.width+34;
  for(let ring=1;ring<=12;ring+=1)for(const direction of [1,-1]){const x=raw.x+gap*ring*direction;if(!overlaps(x))return{...raw,x};}
  return raw;
}

export function nodeCenter(node: NodeEntity, project?: AtlasProject): Point {
  const rect = resolvedNodeRect(node, project);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function edgePoints(edge: EdgeEntity, source: NodeEntity, target: NodeEntity, project?: AtlasProject): Point[] {
  return [nodeCenter(source, project), ...edge.waypoints, nodeCenter(target, project)];
}

export function edgePath(edge: EdgeEntity, source: NodeEntity, target: NodeEntity, project?: AtlasProject): string {
  const points = edgePoints(edge, source, target, project);
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

export function durationSegment(node: NodeEntity, project: AtlasProject): { x: number; y1: number; y2: number; width: number } | null {
  const placement = node.placement;
  const start=placement.durationStart??(typeof placement.yValue==='number'?placement.yValue:null),end=placement.durationEnd??project.board.axes.y.max;
  if (placement.mode !== 'semantic' || start == null || project.board.axes.y.mode === 'none') return null;
  const area = project.areas.find(item => item.id === placement.areaId);
  if (area && !area.axisY) return null;
  const rect = areaContentRect(area, project), center = nodeCenter(node, project);
  const y1 = axisValuePosition(project.board.axes.y, start, rect.y, rect.height);
  const y2 = axisValuePosition(project.board.axes.y, end, rect.y, rect.height);
  return y1 == null || y2 == null ? null : { x: center.x, y1, y2, width: placement.durationWidth };
}

export function eventSegments(event:EventEntity,project:AtlasProject):Array<{x1:number;x2:number;y:number}>{
  if(event.scope==='free')return[{x1:event.x,x2:event.x+event.width,y:event.y}];
  const segments:Array<{x1:number;x2:number;y:number}>=[];
  if(event.scope==='areas'||event.scope==='mixed')for(const id of event.areaIds){const area=project.areas.find(item=>item.id===id);if(!area)continue;const rect=areaContentRect(area,project),y=area.axisY?axisValuePosition(project.board.axes.y,event.axisValue,rect.y,rect.height):null;segments.push({x1:rect.x,x2:rect.x+rect.width,y:y??event.y});}
  if(event.scope==='entities'||event.scope==='mixed')for(const id of event.entityIds){const node=project.nodes.find(item=>item.id===id);if(!node)continue;const center=nodeCenter(node,project),area=project.areas.find(item=>item.id===node.placement.areaId),rect=areaContentRect(area,project),y=event.axisValue!=null?axisValuePosition(project.board.axes.y,event.axisValue,rect.y,rect.height):center.y;segments.push({x1:center.x-event.width/2,x2:center.x+event.width/2,y:y??center.y});}
  return segments.length?segments:[{x1:event.x,x2:event.x+event.width,y:event.y}];
}

export function pointInRect(point: Point, start: Point, end: Point): boolean {
  return point.x >= Math.min(start.x, end.x) && point.x <= Math.max(start.x, end.x)
    && point.y >= Math.min(start.y, end.y) && point.y <= Math.max(start.y, end.y);
}
