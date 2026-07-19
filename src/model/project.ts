export const PROJECT_FORMAT = 'atlas-editor-project';
export const PROJECT_VERSION = 1;

export type Id = string;
export type AxisMode = 'none' | 'timeline' | 'numeric' | 'categories';
export type Tool = 'select' | 'pan' | 'node' | 'edge' | 'event' | 'text' | 'reference';
export type Shape = 'circle' | 'rounded' | 'rectangle' | 'diamond' | 'pill';
export type EdgeRoute = 'straight' | 'orthogonal' | 'curve';

export interface Point { x: number; y: number }
export interface Camera { x: number; y: number; zoom: number }

export interface AxisDefinition {
  mode: AxisMode;
  label: string;
  min: number;
  max: number;
  step: number;
  categories: string[];
  visible: boolean;
}

export interface Board {
  width: number;
  height: number;
  background: string;
  backgroundOpacity: number;
  gridVisible: boolean;
  gridSize: number;
  gridColor: string;
  gridOpacity: number;
  snap: boolean;
  autoExpand: boolean;
  axis: AxisDefinition;
}

export interface Layer {
  id: Id;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface Area {
  id: Id;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  radius: number;
  layerId: Id;
}

export interface NodeEntity {
  id: Id;
  title: string;
  subtitle: string;
  visibleValue: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: Shape;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  iconDataUrl?: string;
  iconInvert?: boolean;
  iconBackground?: string;
  layerId: Id;
  type: string;
  status: string;
  summary: string;
  details: Record<string, string>;
  tags: string[];
}

export interface EdgeEntity {
  id: Id;
  sourceId: Id;
  targetId: Id;
  label: string;
  kind: string;
  route: EdgeRoute;
  directed: boolean;
  color: string;
  colors: string[];
  width: number;
  dash: string;
  opacity: number;
  waypoints: Point[];
  layerId: Id;
}

export interface EventEntity {
  id: Id;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  color: string;
  lineWidth: number;
  dash: string;
  layerId: Id;
  kind: string;
  summary: string;
}

export interface TextEntity {
  id: Id;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: 'start' | 'middle' | 'end';
  layerId: Id;
}

export interface ReferenceImage {
  id: Id;
  name: string;
  role: 'reference' | 'background';
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  lockAspect: boolean;
  layerId: Id;
}

export interface CatalogItem { id: string; label: string; color?: string }
export interface Catalogs {
  nodeTypes: CatalogItem[];
  statuses: CatalogItem[];
  edgeKinds: CatalogItem[];
  eventKinds: CatalogItem[];
}

export interface AtlasProject {
  format: typeof PROJECT_FORMAT;
  version: number;
  id: Id;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  board: Board;
  layers: Layer[];
  activeLayerId: Id;
  areas: Area[];
  nodes: NodeEntity[];
  edges: EdgeEntity[];
  events: EventEntity[];
  texts: TextEntity[];
  references: ReferenceImage[];
  catalogs: Catalogs;
  metadata: Record<string, string>;
}

export type Selection =
  | { type: 'node'; id: Id }
  | { type: 'edge'; id: Id }
  | { type: 'event'; id: Id }
  | { type: 'text'; id: Id }
  | { type: 'reference'; id: Id }
  | { type: 'area'; id: Id };

export const uid = (prefix = 'item'): Id =>
  `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export function createBlankProject(): AtlasProject {
  const now = new Date().toISOString();
  const layerId = uid('layer');
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    id: uid('project'),
    title: 'Proyecto sin título',
    description: '',
    createdAt: now,
    updatedAt: now,
    board: {
      width: 6000,
      height: 4000,
      background: '#f8fafc',
      backgroundOpacity: 1,
      gridVisible: true,
      gridSize: 40,
      gridColor: '#64748b',
      gridOpacity: 0.16,
      snap: false,
      autoExpand: true,
      axis: { mode: 'none', label: '', min: 0, max: 100, step: 10, categories: [], visible: false }
    },
    layers: [{ id: layerId, name: 'Contenido', visible: true, locked: false, order: 0 }],
    activeLayerId: layerId,
    areas: [], nodes: [], edges: [], events: [], texts: [], references: [],
    catalogs: {
      nodeTypes: [{ id: 'entity', label: 'Entidad' }, { id: 'concept', label: 'Concepto' }, { id: 'process', label: 'Proceso' }],
      statuses: [{ id: 'active', label: 'Activo' }, { id: 'historical', label: 'Histórico' }, { id: 'draft', label: 'Borrador' }],
      edgeKinds: [{ id: 'connection', label: 'Conexión' }, { id: 'derivation', label: 'Derivación' }, { id: 'influence', label: 'Influencia' }, { id: 'fusion', label: 'Fusión' }],
      eventKinds: [{ id: 'milestone', label: 'Hito' }, { id: 'change', label: 'Cambio' }, { id: 'annotation', label: 'Anotación' }]
    },
    metadata: {}
  };
}

export function normalizeProject(input: unknown): AtlasProject {
  if (!input || typeof input !== 'object') throw new Error('El archivo no contiene un proyecto válido.');
  const value = input as Partial<AtlasProject>;
  if (value.format !== PROJECT_FORMAT) throw new Error('Formato de proyecto desconocido.');
  const blank = createBlankProject();
  return {
    ...blank,
    ...value,
    board: { ...blank.board, ...value.board, axis: { ...blank.board.axis, ...value.board?.axis } },
    layers: value.layers?.length ? value.layers : blank.layers,
    areas: value.areas ?? [], nodes: value.nodes ?? [], edges: value.edges ?? [],
    events: value.events ?? [], texts: value.texts ?? [], references: value.references ?? [],
    catalogs: { ...blank.catalogs, ...value.catalogs },
    metadata: value.metadata ?? {}
  } as AtlasProject;
}
