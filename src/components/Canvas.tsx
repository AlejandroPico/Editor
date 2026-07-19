import { useMemo, useRef, useState } from 'react';
import { edgePath, nodeCenter, pointInRect } from '../lib/geometry';
import { useEditorStore } from '../store/editorStore';
import type { Point, Selection } from '../model/project';

type PointerState =
  | { mode: 'pan'; client: Point }
  | { mode: 'move'; start: Point; current: Point }
  | { mode: 'marquee'; start: Point; current: Point; additive: boolean }
  | { mode: 'resize-reference'; id: string; handle: string; start: Point; current: Point };

const selectedKey = (item: Selection) => `${item.type}:${item.id}`;

export function Canvas(): React.JSX.Element {
  const svg = useRef<SVGSVGElement>(null);
  const [pointer, setPointer] = useState<PointerState | null>(null);
  const project = useEditorStore(state => state.project);
  const camera = useEditorStore(state => state.camera);
  const tool = useEditorStore(state => state.tool);
  const selection = useEditorStore(state => state.selection);
  const relationSourceId = useEditorStore(state => state.relationSourceId);
  const setCamera = useEditorStore(state => state.setCamera);
  const select = useEditorStore(state => state.select);
  const setSelection = useEditorStore(state => state.setSelection);
  const clearSelection = useEditorStore(state => state.clearSelection);
  const addNode = useEditorStore(state => state.addNode);
  const addEvent = useEditorStore(state => state.addEvent);
  const addText = useEditorStore(state => state.addText);
  const relationClick = useEditorStore(state => state.relationClick);
  const moveSelection = useEditorStore(state => state.moveSelection);
  const updateProject = useEditorStore(state => state.updateProject);
  const selected = useMemo(() => new Set(selection.map(selectedKey)), [selection]);
  const visibleLayers = useMemo(() => new Set(project.layers.filter(layer => layer.visible).map(layer => layer.id)), [project.layers]);
  const nodeMap = useMemo(() => new Map(project.nodes.map(node => [node.id, node])), [project.nodes]);

  const worldPoint = (event: { clientX: number; clientY: number }): Point => {
    const rect = svg.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left - camera.x) / camera.zoom, y: (event.clientY - rect.top - camera.y) / camera.zoom };
  };
  const beginPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    const target = (event.target as Element).closest<SVGElement>('[data-kind]');
    const point = worldPoint(event);
    if (tool === 'node') return addNode(point);
    if (tool === 'event') return addEvent(point);
    if (tool === 'text') return addText(point);
    if (tool === 'edge' && target?.dataset.kind === 'node') return relationClick(target.dataset.id!);
    if (target && tool !== 'pan') {
      const rawKind = target.dataset.kind!;
      const id = target.dataset.id!;
      if (rawKind === 'reference-handle') {
        setPointer({ mode: 'resize-reference', id, handle: target.dataset.handle!, start: point, current: point });
      } else {
        const kind = rawKind as Selection['type'];
        const item = { type: kind, id } as Selection;
        select(item, event.shiftKey);
        setPointer({ mode: 'move', start: point, current: point });
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (tool === 'pan') setPointer({ mode: 'pan', client: { x: event.clientX, y: event.clientY } });
    else { if (!event.shiftKey) clearSelection(); setPointer({ mode: 'marquee', start: point, current: point, additive: event.shiftKey }); }
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pointer) return;
    if (pointer.mode === 'pan') {
      setCamera({ ...camera, x: camera.x + event.clientX - pointer.client.x, y: camera.y + event.clientY - pointer.client.y });
      setPointer({ mode: 'pan', client: { x: event.clientX, y: event.clientY } });
    } else setPointer({ ...pointer, current: worldPoint(event) });
  };
  const endPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pointer) return;
    if (pointer.mode === 'move') {
      const dx = pointer.current.x - pointer.start.x, dy = pointer.current.y - pointer.start.y;
      if (Math.abs(dx) + Math.abs(dy) > .5) moveSelection(dx, dy);
    } else if (pointer.mode === 'marquee') {
      const found: Selection[] = [];
      for (const node of project.nodes) if (pointInRect(nodeCenter(node), pointer.start, pointer.current)) found.push({ type: 'node', id: node.id });
      for (const item of project.events) if (pointInRect({ x: item.x + item.width / 2, y: item.y }, pointer.start, pointer.current)) found.push({ type: 'event', id: item.id });
      for (const item of project.texts) if (pointInRect({ x: item.x, y: item.y }, pointer.start, pointer.current)) found.push({ type: 'text', id: item.id });
      for (const item of project.references) if (pointInRect({ x: item.x + item.width / 2, y: item.y + item.height / 2 }, pointer.start, pointer.current)) found.push({ type: 'reference', id: item.id });
      setSelection(pointer.additive ? [...selection, ...found.filter(item => !selected.has(selectedKey(item)))] : found);
    } else if (pointer.mode === 'resize-reference') {
      const ref = project.references.find(item => item.id === pointer.id);
      if (ref) {
        const dx = pointer.current.x - pointer.start.x, dy = pointer.current.y - pointer.start.y;
        updateProject('Redimensionar referencia', draft => {
          const item = draft.references.find(reference => reference.id === pointer.id)!;
          const west = pointer.handle.includes('w'), north = pointer.handle.includes('n');
          let width = Math.max(20, ref.width + (west ? -dx : dx));
          let height = Math.max(20, ref.height + (north ? -dy : dy));
          if (ref.lockAspect || event.shiftKey) {
            const ratio = ref.width / ref.height;
            if (Math.abs(dx) >= Math.abs(dy)) height = width / ratio; else width = height * ratio;
          }
          if (west) item.x = ref.x + ref.width - width;
          if (north) item.y = ref.y + ref.height - height;
          item.width = width; item.height = height;
        });
      }
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPointer(null);
  };
  const wheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = svg.current!.getBoundingClientRect(), px = event.clientX - rect.left, py = event.clientY - rect.top;
    const wx = (px - camera.x) / camera.zoom, wy = (py - camera.y) / camera.zoom;
    const zoom = Math.max(.03, Math.min(8, camera.zoom * Math.exp(-event.deltaY * .0012)));
    setCamera({ zoom, x: px - wx * zoom, y: py - wy * zoom });
  };
  const axisRows = useMemo(() => {
    const axis = project.board.axis;
    if (!axis.visible || axis.mode === 'none') return [];
    if (axis.mode === 'categories') return axis.categories.map((label, index) => ({ label, y: 120 + index * Math.max(80, (project.board.height - 240) / Math.max(1, axis.categories.length - 1)) }));
    const rows: Array<{ label: string; y: number }> = [];
    for (let value = axis.min; value <= axis.max + axis.step / 2 && rows.length < 500; value += Math.max(.0001, axis.step)) rows.push({ label: String(value), y: 120 + (axis.max - value) / Math.max(1, axis.max - axis.min) * (project.board.height - 240) });
    return rows;
  }, [project.board]);
  const preview = pointer?.mode === 'move' ? { x: pointer.current.x - pointer.start.x, y: pointer.current.y - pointer.start.y } : { x: 0, y: 0 };
  const offset = (type: Selection['type'], id: string) => selected.has(`${type}:${id}`) ? preview : { x: 0, y: 0 };

  return <main className="canvas-shell" data-tool={tool}>
    <svg ref={svg} className="canvas" onPointerDown={beginPointer} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer} onWheel={wheel}>
      <defs>
        <pattern id="grid" width={project.board.gridSize} height={project.board.gridSize} patternUnits="userSpaceOnUse"><path d={`M ${project.board.gridSize} 0 L 0 0 0 ${project.board.gridSize}`} fill="none" stroke={project.board.gridColor} strokeOpacity={project.board.gridOpacity} strokeWidth="1" vectorEffect="non-scaling-stroke"/></pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker>
        {project.edges.filter(edge => edge.colors.length > 1).map(edge => <linearGradient key={edge.id} id={`gradient-${edge.id}`}><stop offset="0" stopColor={edge.colors[0]}/><stop offset="1" stopColor={edge.colors.at(-1)}/></linearGradient>)}
      </defs>
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
        <rect width={project.board.width} height={project.board.height} fill={project.board.background} fillOpacity={project.board.backgroundOpacity}/>
        {project.board.gridVisible && <rect width={project.board.width} height={project.board.height} fill="url(#grid)"/>}
        {project.references.filter(item => item.visible && visibleLayers.has(item.layerId)).map(item => { const d = offset('reference', item.id); return <g key={item.id} data-kind="reference" data-id={item.id} transform={`translate(${d.x} ${d.y}) rotate(${item.rotation} ${item.x + item.width / 2} ${item.y + item.height / 2})`}><image href={item.dataUrl} x={item.x} y={item.y} width={item.width} height={item.height} opacity={item.opacity} preserveAspectRatio="none"/>{selected.has(`reference:${item.id}`) && <><rect className="selection-box" x={item.x} y={item.y} width={item.width} height={item.height}/>{[['nw',item.x,item.y],['ne',item.x+item.width,item.y],['sw',item.x,item.y+item.height],['se',item.x+item.width,item.y+item.height]].map(([handle,x,y]) => <circle key={String(handle)} data-kind="reference-handle" data-id={item.id} data-handle={handle} className="resize-handle" cx={Number(x)} cy={Number(y)} r={8 / camera.zoom}/>)}</>}</g>; })}
        {project.areas.filter(item => visibleLayers.has(item.layerId)).map(item => <rect key={item.id} data-kind="area" data-id={item.id} x={item.x} y={item.y} width={item.width} height={item.height} rx={item.radius} fill={item.fill} fillOpacity={item.fillOpacity} stroke={item.stroke} strokeWidth={item.strokeWidth} className={selected.has(`area:${item.id}`) ? 'selected-object' : ''}/>)}
        {axisRows.map(row => <g key={`${row.label}-${row.y}`}><line x1="0" x2={project.board.width} y1={row.y} y2={row.y} className="axis-line"/><text x="18" y={row.y - 7} className="axis-label">{row.label}</text></g>)}
        {project.edges.filter(item => visibleLayers.has(item.layerId)).map(edge => { const source = nodeMap.get(edge.sourceId), target = nodeMap.get(edge.targetId); if (!source || !target) return null; const path = edgePath(edge, source, target); return <g key={edge.id} data-kind="edge" data-id={edge.id} className={selected.has(`edge:${edge.id}`) ? 'selected-object' : ''}><path d={path} fill="none" stroke={edge.colors.length > 1 ? `url(#gradient-${edge.id})` : edge.color} strokeWidth={edge.width} strokeDasharray={edge.dash} opacity={edge.opacity} markerEnd={edge.directed ? 'url(#arrow)' : undefined} className="edge-path"/><path d={path} fill="none" stroke="transparent" strokeWidth={Math.max(16, edge.width + 10)} className="edge-hit"/></g>; })}
        {project.events.filter(item => visibleLayers.has(item.layerId)).map(item => { const d = offset('event', item.id); return <g key={item.id} data-kind="event" data-id={item.id} transform={`translate(${d.x} ${d.y})`} className={selected.has(`event:${item.id}`) ? 'selected-object' : ''}><line x1={item.x} x2={item.x + item.width} y1={item.y} y2={item.y} stroke={item.color} strokeWidth={item.lineWidth} strokeDasharray={item.dash}/><path d={`M ${item.x} ${item.y} L ${item.x + item.width} ${item.y}`} stroke="transparent" strokeWidth="20"/><text x={item.x} y={item.y - 11} fill={item.color} className="event-title">{item.title}</text></g>; })}
        {project.nodes.filter(item => visibleLayers.has(item.layerId)).map(node => { const d = offset('node', node.id), x=node.x+d.x,y=node.y+d.y, centerX=x+node.width/2,centerY=y+node.height/2; return <g key={node.id} data-kind="node" data-id={node.id} className={`node-object ${selected.has(`node:${node.id}`) ? 'selected-object' : ''}`} opacity={node.opacity} transform={`rotate(${node.rotation} ${centerX} ${centerY})`}>
          {node.shape === 'circle' ? <ellipse cx={centerX} cy={centerY} rx={node.width/2} ry={node.height/2} fill={node.fill} stroke={node.stroke} strokeWidth={node.strokeWidth}/>: node.shape === 'diamond' ? <path d={`M ${centerX} ${y} L ${x+node.width} ${centerY} L ${centerX} ${y+node.height} L ${x} ${centerY} Z`} fill={node.fill} stroke={node.stroke} strokeWidth={node.strokeWidth}/>:<rect x={x} y={y} width={node.width} height={node.height} rx={node.shape === 'pill' ? node.height/2 : node.shape === 'rounded' ? 14 : 0} fill={node.fill} stroke={node.stroke} strokeWidth={node.strokeWidth}/>} 
          {node.iconDataUrl && <><rect x={centerX-24} y={y+7} width="48" height="48" rx="24" fill={node.iconBackground || 'transparent'}/><image href={node.iconDataUrl} x={centerX-20} y={y+11} width="40" height="40" style={{ filter: node.iconInvert ? 'invert(1)' : undefined }}/></>}
          <text x={centerX} y={y+node.height+21} textAnchor="middle" className="node-title">{node.title}</text><text x={centerX} y={y+node.height+39} textAnchor="middle" className="node-subtitle">{node.subtitle}</text><text x={centerX} y={y+node.height+55} textAnchor="middle" className="node-value">{node.visibleValue}</text>
          {relationSourceId === node.id && <circle cx={centerX} cy={centerY} r={Math.max(node.width,node.height)/2+12} className="relation-source"/>}
        </g>; })}
        {project.texts.filter(item => visibleLayers.has(item.layerId)).map(item => { const d=offset('text',item.id);return <text key={item.id} data-kind="text" data-id={item.id} x={item.x+d.x} y={item.y+d.y} textAnchor={item.align} fill={item.color} fontSize={item.fontSize} fontWeight={item.fontWeight} className={selected.has(`text:${item.id}`)?'selected-text':''}>{item.text}</text>})}
        {pointer?.mode === 'marquee' && <rect className="marquee" x={Math.min(pointer.start.x,pointer.current.x)} y={Math.min(pointer.start.y,pointer.current.y)} width={Math.abs(pointer.current.x-pointer.start.x)} height={Math.abs(pointer.current.y-pointer.start.y)}/>} 
      </g>
    </svg>
    <div className="canvas-status"><span>{Math.round(camera.zoom * 100)}%</span><span>{project.nodes.length} entidades · {project.edges.length} conexiones · {project.events.length} acontecimientos</span></div>
  </main>;
}
