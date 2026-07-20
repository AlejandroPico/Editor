import { create } from 'zustand';
import { createBlankProject, normalizeProject, uid, type AtlasProject, type Camera, type Point, type Selection, type Tool } from '../model/project';
import { axisContext, nodeCenter, positionAxisValue, resolvedNodeRect, snap } from '../lib/geometry';

interface EditorState {
  project: AtlasProject;
  camera: Camera;
  tool: Tool;
  selection: Selection[];
  relationSourceId: string | null;
  past: AtlasProject[];
  future: AtlasProject[];
  dirty: boolean;
  setTool: (tool: Tool) => void;
  setCamera: (camera: Camera) => void;
  select: (selection: Selection, additive?: boolean) => void;
  setSelection: (selection: Selection[]) => boolean;
  clearSelection: () => void;
  updateProject: (label: string, recipe: (draft: AtlasProject) => void) => void;
  replaceProject: (project: AtlasProject) => void;
  newProject: () => void;
  undo: () => void;
  redo: () => void;
  addNode: (point: Point) => void;
  addEvent: (point: Point) => void;
  addText: (point: Point) => void;
  relationClick: (nodeId: string) => void;
  moveSelection: (dx: number, dy: number, absolute?: Point) => void;
  deleteSelection: () => void;
  markSaved: () => void;
}

const clone = (project: AtlasProject): AtlasProject => structuredClone(project);

function selectionExists(project: AtlasProject, selection: Selection): boolean {
  const map = { node: project.nodes, edge: project.edges, event: project.events, text: project.texts, reference: project.references, area: project.areas };
  return map[selection.type].some(item => item.id === selection.id);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createBlankProject(),
  camera: { x: 0, y: 0, zoom: 0.22 },
  tool: 'select', selection: [], relationSourceId: null,
  past: [], future: [], dirty: false,

  setTool: tool => set({ tool, relationSourceId: tool === 'edge' ? get().relationSourceId : null }),
  setCamera: camera => set({ camera }),
  select: (item, additive = false) => set(state => {
    if (!additive) return { selection: [item] };
    const exists = state.selection.some(current => current.type === item.type && current.id === item.id);
    return { selection: exists ? state.selection.filter(current => current.type !== item.type || current.id !== item.id) : [...state.selection, item] };
  }),
  setSelection: selection => { set({ selection }); return true; },
  clearSelection: () => set({ selection: [] }),

  updateProject: (_label, recipe) => set(state => {
    const next = clone(state.project);
    recipe(next);
    next.updatedAt = new Date().toISOString();
    return { project: next, past: [...state.past.slice(-79), state.project], future: [], dirty: true };
  }),
  replaceProject: project => set({ project: normalizeProject(project), selection: [], past: [], future: [], relationSourceId: null, dirty: false }),
  newProject: () => set({ project: createBlankProject(), selection: [], past: [], future: [], relationSourceId: null, dirty: false, camera: { x: 0, y: 0, zoom: .22 } }),
  undo: () => set(state => {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return { project: previous, past: state.past.slice(0, -1), future: [state.project, ...state.future], selection: state.selection.filter(item => selectionExists(previous, item)), dirty: true };
  }),
  redo: () => set(state => {
    const next = state.future[0];
    if (!next) return state;
    return { project: next, past: [...state.past, state.project], future: state.future.slice(1), selection: state.selection.filter(item => selectionExists(next, item)), dirty: true };
  }),

  addNode: point => {
    const { project } = get();
    const id = uid('node');
    const x = project.board.snap ? snap(point.x, project.board.gridSize) : point.x;
    const y = project.board.snap ? snap(point.y, project.board.gridSize) : point.y;
    get().updateProject('Añadir entidad', draft => draft.nodes.push({
      id, title: 'Nueva entidad', subtitle: 'Subtítulo', visibleValue: '', x: x - 70, y: y - 40,
      width: 140, height: 80, rotation: 0, shape: 'rounded', fill: '#ffffff', stroke: '#334155', strokeWidth: 2,
      opacity: 1, iconScale: 1, containerVisible: true, layerId: draft.activeLayerId, type: draft.catalogs.nodeTypes[0]?.id ?? 'entity',
      status: draft.catalogs.statuses[0]?.id ?? 'active', summary: '', details: { overview: '', history: '', beliefs: '', evidence: '', bibliography: '', notes: '' }, customFields: {}, tags: [], areaIds: [],
      placement: { mode: 'free', areaId: null, xValue: null, yValue: null, offsetX: 0, offsetY: 0, avoidOverlap: true, durationStart: null, durationEnd: null, durationWidth: 4 }
    }));
    set({ selection: [{ type: 'node', id }], tool: 'select' });
  },
  addEvent: point => {
    const id = uid('event');
    get().updateProject('Añadir acontecimiento', draft => draft.events.push({
      id, title: 'Nuevo acontecimiento', subtitle: '', x: point.x - 80, y: point.y, width: 160,
      color: '#d97706', lineWidth: 3, dash: '8 6', opacity:1,lineCap:'round',startMarker:'none',endMarker:'none',layerId: draft.activeLayerId,
      kind: draft.catalogs.eventKinds[0]?.id ?? 'milestone', summary: '', scope: 'free', areaIds: [], entityIds: [],axisIds:[],bandIds:[], axisValue: null, endValue: null
    }));
    set({ selection: [{ type: 'event', id }], tool: 'select' });
  },
  addText: point => {
    const id = uid('text');
    get().updateProject('Añadir texto', draft => draft.texts.push({ id, text: 'Texto', x: point.x, y: point.y, fontSize: 28, fontWeight: 600, color: '#0f172a',opacity:1,rotation:0, align: 'start',links:[],anchorTarget:null,anchorValue:null,offsetX:0,offsetY:0,layerId: draft.activeLayerId }));
    set({ selection: [{ type: 'text', id }], tool: 'select' });
  },
  relationClick: nodeId => {
    const sourceId = get().relationSourceId;
    if (!sourceId) return set({ relationSourceId: nodeId });
    if (sourceId === nodeId) return set({ relationSourceId: null });
    const id = uid('edge');
    get().updateProject('Crear conexión', draft => draft.edges.push({
      id, sourceId, targetId: nodeId, label: '', kind: draft.catalogs.edgeKinds[0]?.id ?? 'connection', role: draft.catalogs.edgeRoles[0]?.id ?? 'primary', strength: 80, confidence: draft.catalogs.confidences[1]?.id ?? 'medium', note: '',
      route: 'curve', directed: true, startMarker:'none',endMarker:'arrow',lineCap:'round',avoidOverlap:true,parallelOffset:0,color: '#475569', colors: [], width: 3, dash: '', opacity: 1,
      waypoints: [], layerId: draft.activeLayerId
    }));
    set({ relationSourceId: null, selection: [{ type: 'edge', id }], tool: 'select' });
  },
  moveSelection: (dx, dy, absolute) => get().updateProject('Mover selección', draft => {
    for (const selected of get().selection) {
      if (selected.type === 'node') {
        const item = draft.nodes.find(node => node.id === selected.id); if (!item) continue;
        if (item.placement.mode === 'semantic') {
          const center = nodeCenter(item, draft), next = absolute ?? { x: center.x + dx, y: center.y + dy };
          const area = draft.areas.find(candidate => candidate.id === item.placement.areaId), xContext=axisContext(draft,area,'x'),yContext=axisContext(draft,area,'y');
          if (xContext) item.placement.xValue = positionAxisValue(xContext.axis, next.x, xContext.start, xContext.length);
          else item.x = next.x - item.width / 2;
          if (yContext) item.placement.yValue = positionAxisValue(yContext.axis, next.y, yContext.start, yContext.length);
          else item.y = next.y - item.height / 2;
          item.placement.offsetX = 0; item.placement.offsetY = 0;
        } else { item.x = absolute ? absolute.x - item.width / 2 : item.x + dx; item.y = absolute ? absolute.y - item.height / 2 : item.y + dy; }
      } else if (selected.type === 'event') {
        const item = draft.events.find(event => event.id === selected.id); if (!item) continue;
        item.x = absolute ? absolute.x - item.width / 2 : item.x + dx; item.y = absolute ? absolute.y : item.y + dy;
      } else if (selected.type === 'text') {
        const item = draft.texts.find(text => text.id === selected.id); if (!item) continue;
        if(item.anchorTarget){item.offsetX+=dx;item.offsetY+=dy}else{item.x = absolute ? absolute.x : item.x + dx; item.y = absolute ? absolute.y : item.y + dy;}
      } else if (selected.type === 'reference') {
        const item = draft.references.find(reference => reference.id === selected.id); if (!item) continue;
        item.x = absolute ? absolute.x - item.width / 2 : item.x + dx; item.y = absolute ? absolute.y - item.height / 2 : item.y + dy;
      } else if (selected.type === 'area') {
        const item = draft.areas.find(area => area.id === selected.id); if (!item) continue;
        const oldX=item.x,oldY=item.y;item.x = absolute ? absolute.x - item.width / 2 : item.x + dx; item.y = absolute ? absolute.y - item.height / 2 : item.y + dy;
        const deltaX=item.x-oldX,deltaY=item.y-oldY,selectedAreas=new Set(get().selection.filter(entry=>entry.type==='area').map(entry=>entry.id));let frontier=[item.id],guard=0;
        while(frontier.length&&guard++<draft.areas.length){const children=draft.areas.filter(area=>area.parentAreaId&&frontier.includes(area.parentAreaId)&&!selectedAreas.has(area.id));frontier=children.map(area=>area.id);for(const child of children){child.x+=deltaX;child.y+=deltaY}}
      }
    }
  }),
  deleteSelection: () => {
    const selected = get().selection;
    if (!selected.length) return;
    const nodeIds = new Set(selected.filter(item => item.type === 'node').map(item => item.id));
    const areaIds = new Set(selected.filter(item => item.type === 'area').map(item => item.id));
    const released = new Map(get().project.nodes.filter(node => node.placement.areaId && areaIds.has(node.placement.areaId)).map(node => [node.id, resolvedNodeRect(node, get().project)]));
    get().updateProject('Eliminar selección', draft => {
      const ids = (type: Selection['type']) => new Set(selected.filter(item => item.type === type).map(item => item.id));
      draft.nodes = draft.nodes.filter(item => !ids('node').has(item.id));
      draft.edges = draft.edges.filter(item => !ids('edge').has(item.id) && !nodeIds.has(item.sourceId) && !nodeIds.has(item.targetId));
      draft.events = draft.events.filter(item => !ids('event').has(item.id));
      draft.texts = draft.texts.filter(item => !ids('text').has(item.id));
      draft.references = draft.references.filter(item => !ids('reference').has(item.id));
      for(const area of draft.areas)if(area.parentAreaId&&areaIds.has(area.parentAreaId)){let parent=draft.areas.find(item=>item.id===area.parentAreaId)?.parentAreaId??null,guard=0;while(parent&&areaIds.has(parent)&&guard++<draft.areas.length)parent=draft.areas.find(item=>item.id===parent)?.parentAreaId??null;area.parentAreaId=parent}
      draft.areas = draft.areas.filter(item => !ids('area').has(item.id));
      for (const node of draft.nodes) if (node.placement.areaId && areaIds.has(node.placement.areaId)) { const rect=released.get(node.id); if(rect){node.x=rect.x;node.y=rect.y} node.placement.mode='free';node.placement.areaId=null;node.areaIds=node.areaIds.filter(id=>!areaIds.has(id)); }
      for (const event of draft.events) event.areaIds=event.areaIds.filter(id=>!areaIds.has(id));
    });
    set({ selection: [] });
  },
  markSaved: () => set({ dirty: false })
}));
