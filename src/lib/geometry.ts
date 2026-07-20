import type { Area, AtlasProject, AxisDefinition, EdgeEntity, EventEntity, NodeEntity, Point } from '../model/project';

export interface Rect { x:number; y:number; width:number; height:number }
export interface AxisContext { axis:AxisDefinition; start:number; length:number }
export interface AxisBand { id:string; label:string; start:number; length:number; color:string; opacity:number }
export interface AxisChapterBand { id:string; label:string; start:number; length:number; depth:number; color:string; opacity:number; labelColor:string }
export const snap=(value:number,step:number)=>Math.round(value/Math.max(1,step))*Math.max(1,step);

export function areaContentRect(area:Area|undefined,project:AtlasProject):Rect{
  if(!area)return{x:60,y:60,width:project.board.width-120,height:project.board.height-120};
  return{x:area.x+area.padding.left,y:area.y+area.padding.top,width:Math.max(1,area.width-area.padding.left-area.padding.right),height:Math.max(1,area.height-area.padding.top-area.padding.bottom)};
}

export function axisContext(project:AtlasProject,area:Area|undefined,orientation:'x'|'y'):AxisContext|null{
  const projectAxis=project.board.axes[orientation],boardRect=areaContentRect(undefined,project);
  if(!area)return projectAxis.mode==='none'?null:{axis:projectAxis,start:orientation==='x'?boardRect.x:boardRect.y,length:orientation==='x'?boardRect.width:boardRect.height};
  const binding=area.axisBindings[orientation];if(binding.mode==='none')return null;
  if(binding.mode==='project')return projectAxis.mode==='none'?null:{axis:projectAxis,start:orientation==='x'?boardRect.x:boardRect.y,length:orientation==='x'?boardRect.width:boardRect.height};
  const rect=areaContentRect(area,project),axis=binding.mode==='local-custom'?binding.axis:projectAxis;
  return axis.mode==='none'?null:{axis,start:orientation==='x'?rect.x:rect.y,length:orientation==='x'?rect.width:rect.height};
}

function unflippedRatio(axis:AxisDefinition,value:number|string|null):number|null{
  if(value==null||axis.mode==='none')return null;
  if(axis.mode==='categories'){
    const categories=axis.categories,total=categories.reduce((sum,item)=>sum+Math.max(.01,item.weight),0);if(!categories.length)return null;
    const index=typeof value==='number'?Math.max(0,Math.min(categories.length-1,Math.round(value))):categories.findIndex(item=>item.id===String(value)||item.label===String(value));if(index<0)return null;
    const before=categories.slice(0,index).reduce((sum,item)=>sum+Math.max(.01,item.weight),0),weight=Math.max(.01,categories[index].weight);return(before+weight/2)/total;
  }
  const numeric=Number(value);if(!Number.isFinite(numeric))return null;
  const segments=axis.segments.filter(segment=>Number.isFinite(segment.from)&&Number.isFinite(segment.to)&&segment.from!==segment.to);
  if(segments.length){const total=segments.reduce((sum,item)=>sum+Math.max(.01,item.weight),0);let before=0;for(const segment of segments){const low=Math.min(segment.from,segment.to),high=Math.max(segment.from,segment.to),weight=Math.max(.01,segment.weight);if(numeric>=low&&numeric<=high){const local=(numeric-segment.from)/(segment.to-segment.from);return(before+Math.max(0,Math.min(1,local))*weight)/total}before+=weight}}
  return(numeric-axis.min)/Math.max(.000001,axis.max-axis.min);
}

export function axisValueRatio(axis:AxisDefinition,value:number|string|null):number|null{const ratio=unflippedRatio(axis,value);if(ratio==null)return null;const clamped=Math.max(0,Math.min(1,ratio));return axis.reverse?1-clamped:clamped}
export function axisValuePosition(axis:AxisDefinition,value:number|string|null,start:number,length:number):number|null{const ratio=axisValueRatio(axis,value);return ratio==null?null:start+ratio*length}

export function positionAxisValue(axis:AxisDefinition,position:number,start:number,length:number):number|string|null{
  if(axis.mode==='none')return null;let ratio=Math.max(0,Math.min(1,(position-start)/Math.max(1,length)));if(axis.reverse)ratio=1-ratio;
  if(axis.mode==='categories'){const total=axis.categories.reduce((sum,item)=>sum+Math.max(.01,item.weight),0);let cursor=0;for(const item of axis.categories){cursor+=Math.max(.01,item.weight)/Math.max(.01,total);if(ratio<=cursor)return item.label}return axis.categories.at(-1)?.label??null}
  const segments=axis.segments.filter(segment=>segment.from!==segment.to);if(segments.length){const total=segments.reduce((sum,item)=>sum+Math.max(.01,item.weight),0);let cursor=0;for(const segment of segments){const share=Math.max(.01,segment.weight)/total;if(ratio<=cursor+share){const local=(ratio-cursor)/share;return segment.from+local*(segment.to-segment.from)}cursor+=share}return segments.at(-1)!.to}
  return axis.min+ratio*(axis.max-axis.min);
}

export function axisBands(axis:AxisDefinition,start:number,length:number):AxisBand[]{
  if(axis.mode==='none')return[];
  const items=axis.mode==='categories'
    ?axis.categories.map(item=>({id:item.id,label:item.label,weight:item.weight,color:item.color??'transparent',opacity:item.opacity??0}))
    :axis.segments.map(item=>({id:item.id,label:`${item.from} – ${item.to}`,weight:item.weight,color:item.color??'transparent',opacity:item.opacity??0}));
  const total=items.reduce((sum,item)=>sum+Math.max(.01,item.weight),0);let cursor=0;
  return items.map(item=>{const a=cursor/Math.max(.01,total),b=(cursor+=Math.max(.01,item.weight))/Math.max(.01,total),from=axis.reverse?1-b:a,to=axis.reverse?1-a:b;return{id:item.id,label:item.label,start:start+from*length,length:(to-from)*length,color:item.color,opacity:item.opacity}});
}

export function axisChapterBands(axis:AxisDefinition,start:number,length:number):AxisChapterBand[]{
  const chapters=axis.chapters??[],byId=new Map(chapters.map(item=>[item.id,item]));
  const depthOf=(id:string)=>{let depth=0,current=byId.get(id),guard=0;const seen=new Set<string>();while(current?.parentId&&guard++<chapters.length&&!seen.has(current.parentId)){seen.add(current.parentId);const parent=byId.get(current.parentId);if(!parent)break;depth+=1;current=parent}return depth};
  const categorySpan=(from:number|string,to:number|string):[number,number]|null=>{const indexFor=(value:number|string)=>axis.categories.findIndex(item=>item.id===String(value)||item.label===String(value)),a=indexFor(from),b=indexFor(to);if(a<0||b<0)return null;const low=Math.min(a,b),high=Math.max(a,b),total=axis.categories.reduce((sum,item)=>sum+Math.max(.01,item.weight),0),before=axis.categories.slice(0,low).reduce((sum,item)=>sum+Math.max(.01,item.weight),0),through=axis.categories.slice(0,high+1).reduce((sum,item)=>sum+Math.max(.01,item.weight),0),r1=before/Math.max(.01,total),r2=through/Math.max(.01,total),p1=start+(axis.reverse?1-r2:r1)*length,p2=start+(axis.reverse?1-r1:r2)*length;return[Math.min(p1,p2),Math.max(p1,p2)]};
  return chapters.flatMap(chapter=>{const categorical=axis.mode==='categories'?categorySpan(chapter.from,chapter.to):null,a=categorical?.[0]??axisValuePosition(axis,chapter.from,start,length),b=categorical?.[1]??axisValuePosition(axis,chapter.to,start,length);if(a==null||b==null)return[];return[{id:chapter.id,label:chapter.label,start:Math.min(a,b),length:Math.max(1,Math.abs(b-a)),depth:depthOf(chapter.id),color:chapter.color,opacity:chapter.opacity,labelColor:chapter.labelColor}]});
}

function rawNodeRect(node:NodeEntity,project?:AtlasProject):Rect{
  if(!project||node.placement?.mode!=='semantic')return{x:node.x,y:node.y,width:node.width,height:node.height};
  const area=project.areas.find(item=>item.id===node.placement.areaId),xContext=axisContext(project,area,'x'),yContext=axisContext(project,area,'y');
  const cx=xContext?axisValuePosition(xContext.axis,node.placement.xValue,xContext.start,xContext.length):null,cy=yContext?axisValuePosition(yContext.axis,node.placement.yValue,yContext.start,yContext.length):null;
  return{x:(cx??node.x+node.width/2)+node.placement.offsetX-node.width/2,y:(cy??node.y+node.height/2)+node.placement.offsetY-node.height/2,width:node.width,height:node.height};
}

function temporalSpan(node:NodeEntity,project:AtlasProject,rect:Rect):[number,number]{
  const area=project.areas.find(item=>item.id===node.placement.areaId),context=axisContext(project,area,'y'),start=node.placement.durationStart??(typeof node.placement.yValue==='number'?node.placement.yValue:null),end=node.placement.durationEnd??context?.axis.max??null;
  if(!context||start==null)return[rect.y,rect.y+rect.height+55];const y1=axisValuePosition(context.axis,start,context.start,context.length),y2=axisValuePosition(context.axis,end,context.start,context.length);return y1==null||y2==null?[rect.y,rect.y+rect.height+55]:[Math.min(y1,y2,rect.y),Math.max(y1,y2,rect.y+rect.height+55)];
}

const layoutCache=new WeakMap<AtlasProject,Map<string,Rect>>();
function resolvedLayout(project:AtlasProject):Map<string,Rect>{
  const cached=layoutCache.get(project);if(cached)return cached;const result=new Map<string,Rect>(),placed:Array<{node:NodeEntity;rect:Rect;span:[number,number]}>=[];
  for(const node of project.nodes){const raw=rawNodeRect(node,project),span=temporalSpan(node,project,raw);if(node.placement?.mode!=='semantic'||!node.placement.avoidOverlap){result.set(node.id,raw);placed.push({node,rect:raw,span});continue}
    const area=project.areas.find(item=>item.id===node.placement.areaId),xContext=axisContext(project,area,'x'),previous=placed.filter(item=>item.node.placement?.mode==='semantic'&&item.node.placement.areaId===node.placement.areaId&&item.node.placement.avoidOverlap);
    const overlaps=(x:number)=>previous.some(item=>Math.abs((item.rect.x+item.rect.width/2)-(x+raw.width/2))<(item.rect.width+raw.width)/2+18&&item.span[0]<=span[1]&&span[0]<=item.span[1]);let rect=raw;
    if(overlaps(raw.x)){const gap=raw.width+34,min=xContext?.start??0,max=(xContext?.start??0)+(xContext?.length??project.board.width);outer:for(let ring=1;ring<=24;ring+=1)for(const direction of [1,-1]){const x=raw.x+gap*ring*direction;if(x>=min-raw.width/2&&x+raw.width<=max+raw.width/2&&!overlaps(x)){rect={...raw,x};break outer}}}
    result.set(node.id,rect);placed.push({node,rect,span:temporalSpan(node,project,rect)});
  }
  layoutCache.set(project,result);return result;
}
export function resolvedNodeRect(node:NodeEntity,project?:AtlasProject):Rect{return project?resolvedLayout(project).get(node.id)??rawNodeRect(node,project):rawNodeRect(node)}

export function nodeCenter(node:NodeEntity,project?:AtlasProject):Point{const rect=resolvedNodeRect(node,project);return{x:rect.x+rect.width/2,y:rect.y+rect.height/2}}
export function edgePoints(edge:EdgeEntity,source:NodeEntity,target:NodeEntity,project?:AtlasProject):Point[]{return[nodeCenter(source,project),...edge.waypoints,nodeCenter(target,project)]}

export function parallelEdgeOffset(edge:EdgeEntity,project?:AtlasProject):number{
  if(!project)return edge.parallelOffset??0;const matches=project.edges.filter(item=>item.route===edge.route&&item.avoidOverlap&&((item.sourceId===edge.sourceId&&item.targetId===edge.targetId)||(item.sourceId===edge.targetId&&item.targetId===edge.sourceId)));
  if(!edge.avoidOverlap||matches.length<2)return edge.parallelOffset??0;const index=matches.findIndex(item=>item.id===edge.id),gap=Math.max(10,...matches.map(item=>item.width+7));return(index-(matches.length-1)/2)*gap+(edge.parallelOffset??0);
}

export function edgePath(edge:EdgeEntity,source:NodeEntity,target:NodeEntity,project?:AtlasProject):string{
  const points=edgePoints(edge,source,target,project),first=points[0],last=points.at(-1)!,offset=parallelEdgeOffset(edge,project);
  if(edge.route==='straight'){
    if(points.length>2)return`M ${first.x} ${first.y} ${points.slice(1).map(p=>`L ${p.x} ${p.y}`).join(' ')}`;
    if(!offset)return`M ${first.x} ${first.y} L ${last.x} ${last.y}`;const dx=last.x-first.x,dy=last.y-first.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length*offset,ny=dx/length*offset;return`M ${first.x} ${first.y} L ${first.x+nx} ${first.y+ny} L ${last.x+nx} ${last.y+ny} L ${last.x} ${last.y}`;
  }
  if(edge.route==='orthogonal'){let path=`M ${first.x} ${first.y}`;for(let i=1;i<points.length;i+=1){const previous=points[i-1],point=points[i],middleX=(previous.x+point.x)/2+offset;path+=` L ${middleX} ${previous.y} L ${middleX} ${point.y} L ${point.x} ${point.y}`}return path}
  if(points.length===2){const dx=last.x-first.x,dy=last.y-first.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length*offset,ny=dx/length*offset,mx=(first.x+last.x)/2+nx,my=(first.y+last.y)/2+ny;return`M ${first.x} ${first.y} Q ${mx} ${my} ${last.x} ${last.y}`}
  let path=`M ${first.x} ${first.y}`;for(let i=1;i<points.length;i+=1){const previous=points[i-1],point=points[i],middle={x:(previous.x+point.x)/2,y:(previous.y+point.y)/2};path+=` Q ${previous.x} ${previous.y} ${middle.x} ${middle.y}`}return path+` T ${last.x} ${last.y}`;
}

export function durationSegment(node:NodeEntity,project:AtlasProject):{x:number;y1:number;y2:number;width:number}|null{
  const placement=node.placement,start=placement.durationStart??(typeof placement.yValue==='number'?placement.yValue:null);if(placement.mode!=='semantic'||start==null)return null;const area=project.areas.find(item=>item.id===placement.areaId),context=axisContext(project,area,'y');if(!context)return null;const end=placement.durationEnd??context.axis.max,center=nodeCenter(node,project),y1=axisValuePosition(context.axis,start,context.start,context.length),y2=axisValuePosition(context.axis,end,context.start,context.length);return y1==null||y2==null?null:{x:center.x,y1,y2,width:placement.durationWidth};
}

export function eventSegments(event:EventEntity,project:AtlasProject):Array<{x1:number;x2:number;y:number}>{
  if(event.scope==='free')return[{x1:event.x,x2:event.x+event.width,y:event.y}];const segments:Array<{x1:number;x2:number;y:number}>=[];
  if(event.scope==='areas'||event.scope==='mixed')for(const id of event.areaIds){const area=project.areas.find(item=>item.id===id);if(!area)continue;const rect=areaContentRect(area,project),context=axisContext(project,area,'y'),y=context?axisValuePosition(context.axis,event.axisValue,context.start,context.length):null;segments.push({x1:rect.x,x2:rect.x+rect.width,y:y??event.y})}
  if(event.scope==='entities'||event.scope==='mixed')for(const id of event.entityIds){const node=project.nodes.find(item=>item.id===id);if(!node)continue;const center=nodeCenter(node,project),area=project.areas.find(item=>item.id===node.placement.areaId),context=axisContext(project,area,'y'),y=event.axisValue!=null&&context?axisValuePosition(context.axis,event.axisValue,context.start,context.length):center.y;segments.push({x1:center.x-event.width/2,x2:center.x+event.width/2,y:y??center.y})}
  return segments.length?segments:[{x1:event.x,x2:event.x+event.width,y:event.y}];
}

export function pointInRect(point:Point,start:Point,end:Point):boolean{return point.x>=Math.min(start.x,end.x)&&point.x<=Math.max(start.x,end.x)&&point.y>=Math.min(start.y,end.y)&&point.y<=Math.max(start.y,end.y)}
