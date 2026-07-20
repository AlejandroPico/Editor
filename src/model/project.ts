export const PROJECT_FORMAT = 'atlas-editor-project';
export const PROJECT_VERSION = 6;

export type Id = string;
export type AxisMode = 'none' | 'timeline' | 'numeric' | 'categories';
export type Tool = 'select' | 'pan' | 'node' | 'edge' | 'event' | 'text' | 'reference';
export type Shape = 'sphere' | 'circle' | 'rounded' | 'rectangle' | 'diamond' | 'pill';
export type EdgeRoute = 'straight' | 'orthogonal' | 'curve';
export type EdgeMarker = 'none' | 'arrow' | 'circle' | 'diamond' | 'bar';
export type PlacementMode = 'free' | 'semantic';
export type AreaAxisMode = 'project' | 'local-project' | 'local-custom' | 'none';

export interface Point { x: number; y: number }
export interface Camera { x: number; y: number; zoom: number }

export interface AxisCategory { id: Id; label: string; weight: number; color?: string; opacity?: number }
export interface AxisSegment { id: Id; from: number; to: number; step: number; weight: number; color?: string; opacity?: number }
export interface AxisChapter {
  id: Id;
  label: string;
  from: number | string;
  to: number | string;
  parentId: Id | null;
  color: string;
  opacity: number;
  labelColor: string;
}
export interface AxisDefinition {
  mode: AxisMode;
  label: string;
  min: number;
  max: number;
  step: number;
  categories: AxisCategory[];
  segments: AxisSegment[];
  chapters: AxisChapter[];
  visible: boolean;
  reverse: boolean;
  sticky: boolean;
  labelSize: number;
  minLabelSpacing: number;
}

export interface AreaAxisBinding { mode: AreaAxisMode; visible: boolean; axis: AxisDefinition }

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
  axes: { x: AxisDefinition; y: AxisDefinition };
}

export interface Layer { id: Id; name: string; visible: boolean; locked: boolean; order: number }

export interface Area {
  id: Id;
  name: string;
  parentAreaId?: Id | null;
  showTitle?: boolean;
  titleColor?: string;
  titleSize?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  radius: number;
  padding: { top: number; right: number; bottom: number; left: number };
  axisBindings: { x: AreaAxisBinding; y: AreaAxisBinding };
  layerId: Id;
}

export interface NodePlacement {
  mode: PlacementMode;
  areaId: Id | null;
  xValue: number | string | null;
  yValue: number | string | null;
  offsetX: number;
  offsetY: number;
  avoidOverlap: boolean;
  durationStart: number | null;
  durationEnd: number | null;
  durationWidth: number;
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
  iconScale: number;
  containerVisible: boolean;
  layerId: Id;
  type: string;
  status: string;
  summary: string;
  details: Record<string, string>;
  customFields: Record<string, string | number | boolean>;
  tags: string[];
  areaIds: Id[];
  placement: NodePlacement;
}

export interface EdgeEntity {
  id: Id;
  sourceId: Id;
  targetId: Id;
  label: string;
  kind: string;
  role: string;
  strength: number;
  confidence: string;
  note: string;
  route: EdgeRoute;
  directed: boolean;
  startMarker: EdgeMarker;
  endMarker: EdgeMarker;
  lineCap: 'butt' | 'round' | 'square';
  avoidOverlap: boolean;
  parallelOffset: number;
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
  scope: 'free' | 'areas' | 'entities' | 'mixed';
  areaIds: Id[];
  entityIds: Id[];
  axisValue: number | string | null;
  endValue: number | string | null;
}

export interface TextEntity { id: Id; text: string; x: number; y: number; fontSize: number; fontWeight: number; color: string; align: 'start' | 'middle' | 'end'; layerId: Id }

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
  edgeRoles: CatalogItem[];
  confidences: CatalogItem[];
  eventKinds: CatalogItem[];
}

export type EntityFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'url' | 'date';
export interface EntityFieldSection { id: Id; label: string; description: string }
export interface EntityFieldDefinition {
  id: Id;
  label: string;
  sectionId: Id;
  type: EntityFieldType;
  required: boolean;
  options: string[];
  help: string;
}
export interface EntitySchema { sections: EntityFieldSection[]; fields: EntityFieldDefinition[] }
export interface DatabaseConfig { customSql: string[] }

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
  entitySchema: EntitySchema;
  database: DatabaseConfig;
  metadata: Record<string, string>;
}

export type Selection =
  | { type: 'node'; id: Id }
  | { type: 'edge'; id: Id }
  | { type: 'event'; id: Id }
  | { type: 'text'; id: Id }
  | { type: 'reference'; id: Id }
  | { type: 'area'; id: Id };

export const uid = (prefix = 'item'): Id => `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export const defaultAxis = (reverse = false): AxisDefinition => ({ mode: 'none', label: '', min: 0, max: 100, step: 10, categories: [], segments: [], chapters: [], visible: false, reverse, sticky: true, labelSize: 10, minLabelSpacing: 44 });
const defaultBinding = (mode:AreaAxisMode,reverse=false):AreaAxisBinding=>({mode,visible:false,axis:defaultAxis(reverse)});
const defaultPlacement = (): NodePlacement => ({ mode: 'free', areaId: null, xValue: null, yValue: null, offsetX: 0, offsetY: 0, avoidOverlap: true, durationStart: null, durationEnd: null, durationWidth: 4 });
const defaultDetails = (): Record<string, string> => ({ overview: '', history: '', beliefs: '', evidence: '', bibliography: '', notes: '' });

export function createBlankProject(): AtlasProject {
  const now = new Date().toISOString();
  const layerId = uid('layer');
  return {
    format: PROJECT_FORMAT, version: PROJECT_VERSION, id: uid('project'), title: 'Proyecto sin título', description: '', createdAt: now, updatedAt: now,
    board: { width: 6000, height: 4000, background: '#f8fafc', backgroundOpacity: 1, gridVisible: true, gridSize: 40, gridColor: '#64748b', gridOpacity: .16, snap: false, autoExpand: true, axes: { x: defaultAxis(false), y: defaultAxis(true) } },
    layers: [{ id: layerId, name: 'Contenido', visible: true, locked: false, order: 0 }], activeLayerId: layerId,
    areas: [], nodes: [], edges: [], events: [], texts: [], references: [],
    catalogs: {
      nodeTypes: [{ id: 'entity', label: 'Entidad' }, { id: 'concept', label: 'Concepto' }, { id: 'process', label: 'Proceso' }],
      statuses: [{ id: 'active', label: 'Activo' }, { id: 'historical', label: 'Histórico' }, { id: 'draft', label: 'Borrador' }],
      edgeKinds: [{ id: 'connection', label: 'Conexión' }, { id: 'derivation', label: 'Derivación' }, { id: 'influence', label: 'Influencia' }, { id: 'fusion', label: 'Fusión' }, { id: 'migration', label: 'Migración' }],
      edgeRoles: [{ id: 'primary', label: 'Principal' }, { id: 'secondary', label: 'Secundaria' }, { id: 'hypothetical', label: 'Hipotética' }],
      confidences: [{ id: 'high', label: 'Alta' }, { id: 'medium', label: 'Media' }, { id: 'low', label: 'Baja' }, { id: 'disputed', label: 'Discutida' }],
      eventKinds: [{ id: 'milestone', label: 'Hito' }, { id: 'change', label: 'Cambio' }, { id: 'council', label: 'Concilio' }, { id: 'schism', label: 'Cisma' }, { id: 'annotation', label: 'Anotación' }]
    },
    entitySchema: {
      sections: [
        { id: 'summary', label: 'Resumen', description: 'Identidad, cronología y síntesis principal.' },
        { id: 'classification', label: 'Clasificación', description: 'Ámbitos, taxonomías y categorías propias.' },
        { id: 'evidence', label: 'Evidencia', description: 'Fuentes, certeza y justificación documental.' }
      ],
      fields: []
    },
    database: { customSql: [] }, metadata: {}
  };
}

type LegacyObject = Record<string, any>;
const finite = (value: unknown, fallback: number): number => Number.isFinite(Number(value)) ? Number(value) : fallback;

function migrateReliTree(value: LegacyObject): AtlasProject {
  const blank = createBlankProject(), atlas = value.atlas as LegacyObject, meta = atlas.metadata ?? {};
  const regions = [...(atlas.regions ?? [])].sort((a: LegacyObject, b: LegacyObject) => finite(a.order, 0) - finite(b.order, 0));
  const traditions = atlas.traditions ?? [], present = finite(meta.presentYear, new Date().getFullYear());
  const starts = traditions.map((item: LegacyObject) => Number(item.startYear)).filter(Number.isFinite);
  const min = starts.length ? Math.min(...starts) : 0;
  const margin = 140, gap = 20, height = 7200;
  let cursor = margin;
  const areas: Area[] = regions.map((region: LegacyObject) => {
    const width = Math.max(180, finite(region.width, 760)), appearance = region.appearance ?? {}, color = region.color ?? '#64748b';
    const area: Area = { id: String(region.id), name: String(region.name ?? region.id), parentAreaId:null, showTitle:true, titleColor:color, titleSize:16, x: cursor, y: margin, width, height: height - margin * 2, fill: appearance.fillColor ?? color, fillOpacity: finite(appearance.fillOpacity, .055), stroke: appearance.borderColor ?? color, strokeWidth: finite(appearance.borderWidth, 1), radius: 0, padding: { top: 70, right: 34, bottom: 34, left: 34 }, axisBindings:{x:{...defaultBinding('local-project'),visible:false},y:{...defaultBinding('project',true),visible:false}}, layerId: blank.activeLayerId };
    cursor += width + gap; return area;
  });
  const width = Math.max(6000, cursor + margin);
  const areaMap = new Map(areas.map(area => [area.id, area]));
  const yFor = (year: number) => margin + 70 + (present - year) / Math.max(1, present - min) * (height - margin * 2 - 104);
  const nodes: NodeEntity[] = traditions.map((item: LegacyObject) => {
    const placement = item.placement ?? {}, areaId = placement.regionId ?? item.regionId ?? null, area = areaMap.get(areaId), pct = finite(placement.xPercent, finite(item.lane, .5) * 100);
    const radius = Math.max(14, finite(item.visual?.nodeRadius, 18));
    const x = area ? area.x + area.padding.left + pct / 100 * (area.width - area.padding.left - area.padding.right) - radius : finite(placement.absoluteX, 300) - radius;
    const y = item.startYear != null ? yFor(finite(item.startYear, present)) - radius : finite(placement.absoluteY, 300) - radius;
    return { id: String(item.id), title: String(item.name ?? item.title ?? item.id), subtitle: String(item.subtitle ?? item.family ?? ''), visibleValue: item.startYear == null ? String(item.visibleValue ?? '') : String(item.startYear), x, y, width: radius * 2, height: radius * 2, rotation: 0, shape: 'sphere', fill: item.visual?.color ?? area?.fill ?? '#ffffff', stroke: '#0f172a', strokeWidth: 2, opacity: finite(item.visual?.opacity, 1), iconDataUrl: item.icon?.embeddedDataUrl ?? undefined, iconInvert: Boolean(item.icon?.invert), iconBackground: item.icon?.backgroundColor ?? 'transparent', iconScale: finite(item.icon?.scale, 1), containerVisible: item.visual?.containerVisible !== false, layerId: blank.activeLayerId, type: String(item.kind ?? 'entity'), status: String(item.status ?? 'active'), summary: String(item.summary ?? ''), details: { ...defaultDetails(), ...(item.details ?? {}) }, customFields: {}, tags: [...(item.alternativeNames ?? []), ...(item.sources ?? [])].map(String), areaIds: [...new Set([...(item.regionIds ?? []), areaId].filter(Boolean).map(String))], placement: { mode: areaId && item.startYear != null ? 'semantic' : 'free', areaId: areaId ? String(areaId) : null, xValue: pct, yValue: item.startYear ?? null, offsetX: finite(placement.offsetX, 0), offsetY: finite(placement.offsetY, 0), avoidOverlap: placement.autoAvoidOverlap !== false, durationStart: item.startYear ?? null, durationEnd: item.endYear ?? present, durationWidth: finite(item.visual?.timelineWidth ?? item.visual?.lineWidth, 3.5) } };
  });
  const relationKeys = new Set<string>();
  const edges: EdgeEntity[] = [];
  const addRelation = (relation: LegacyObject, fallbackId: string) => {
    if (!relation.sourceId || !relation.targetId) return;
    const key = `${relation.sourceId}>${relation.targetId}>${relation.kind ?? ''}`; if (relationKeys.has(key)) return; relationKeys.add(key);
    const visual = relation.visual ?? {};
    edges.push({ id: String(relation.id ?? fallbackId), sourceId: String(relation.sourceId), targetId: String(relation.targetId), label: String(relation.label ?? ''), kind: String(relation.kind ?? 'connection'), role: String(relation.role ?? 'secondary'), strength: finite(relation.strength, 60), confidence: String(relation.confidence ?? 'medium'), note: String(relation.note ?? ''), route: ['straight','orthogonal','curve'].includes(visual.route) ? visual.route : 'curve', directed: relation.directed !== false, startMarker:'none',endMarker:relation.directed===false?'none':'arrow',lineCap:'round',avoidOverlap:true,parallelOffset:0,color: visual.color ?? '#475569', colors: [...(visual.gradientColors ?? [])], width: finite(visual.lineWidth, 3), dash: String(visual.lineDash ?? ''), opacity: finite(visual.opacity, .8), waypoints: (visual.waypoints ?? []).map((point: LegacyObject) => ({ x: finite(point.absoluteX, 0), y: finite(point.absoluteY, 0) })), layerId: blank.activeLayerId });
  };
  for (const relation of atlas.relations ?? []) addRelation(relation, uid('edge'));
  for (const item of traditions) if (item.parentId) addRelation({ sourceId: item.parentId, targetId: item.id, kind: item.relationToParent ?? 'derivation', role: 'primary', confidence: item.confidence }, `parent-${item.parentId}-${item.id}`);
  const events: EventEntity[] = (atlas.events ?? []).map((item: LegacyObject) => { const visual=item.visual??{}, scope=item.scope==='regions'?'areas':item.scope; return { id:String(item.id), title:String(item.title??item.id), subtitle:String(item.subtitle??''), x:finite(item.placement?.absoluteX,margin), y:item.year!=null?yFor(finite(item.year,present)):finite(item.placement?.absoluteY,300), width:finite(visual.width,320), color:visual.color??'#d97706', lineWidth:finite(visual.lineWidth,2), dash:String(visual.lineDash??'8 6'), layerId:blank.activeLayerId, kind:String(item.kind??'milestone'), summary:String(item.summary??''), scope:['free','areas','entities','mixed'].includes(scope)?scope:'free', areaIds:[...(item.regionIds??[])].map(String), entityIds:[...(item.entityIds??[])].map(String), axisValue:item.year??null, endValue:item.endYear??null }; });
  const references: ReferenceImage[] = (value.editor?.references ?? []).filter((item: LegacyObject) => item.embeddedDataUrl).map((item: LegacyObject, index: number) => ({ id:String(item.id??`reference-${index+1}`), name:String(item.name??`Referencia ${index+1}`), role:item.role==='background'?'background':'reference', dataUrl:String(item.embeddedDataUrl), x:finite(item.x,120), y:finite(item.y,120), width:finite(item.width,1200), height:finite(item.height,800), rotation:finite(item.rotation,0), opacity:finite(item.opacity,.3), visible:item.visible!==false, locked:false, lockAspect:item.lockAspect!==false, layerId:blank.activeLayerId }));
  return { ...blank, id: String(meta.id ?? blank.id), title: String(meta.board?.title ?? 'Proyecto RELITree importado'), description: String(meta.referenceNotice ?? ''), createdAt: String(meta.generatedAt ?? blank.createdAt), updatedAt: new Date().toISOString(), board: { ...blank.board, width, height, background: meta.board?.backgroundColor ?? blank.board.background, backgroundOpacity: finite(meta.board?.backgroundOpacity, 1), gridVisible: meta.board?.gridVisible !== false, gridColor: meta.board?.gridColor ?? blank.board.gridColor, gridOpacity: finite(meta.board?.gridOpacity, .08), axes: { x: { ...defaultAxis(false), mode: 'numeric', min: 0, max: 100, step: 10, visible: false, label: 'Posición dentro del área (%)' }, y: { ...defaultAxis(true), mode: meta.board?.axisMode === 'none' ? 'none' : 'timeline', min, max: present, step: Math.max(1, finite(value.editor?.canvas?.gridSize, 100)), visible: meta.board?.axisMode !== 'none', label: 'Año' } } }, areas, nodes, edges, events, references, catalogs: { ...blank.catalogs, nodeTypes: mergeCatalog(blank.catalogs.nodeTypes, value.catalogs?.entityKinds), statuses: mergeCatalog(blank.catalogs.statuses, value.catalogs?.statuses), edgeKinds: mergeCatalog(blank.catalogs.edgeKinds, value.catalogs?.relationKinds), edgeRoles: mergeCatalog(blank.catalogs.edgeRoles, value.catalogs?.relationRoles), confidences: mergeCatalog(blank.catalogs.confidences, value.catalogs?.confidences), eventKinds: mergeCatalog(blank.catalogs.eventKinds, value.catalogs?.eventKinds) }, metadata: { importedFrom: `Atlas Studio ${value.schemaVersion ?? 'legacy'}`, importedAt: new Date().toISOString(), legacySavedAt: String(value.savedAt ?? '') } };
}

function mergeCatalog(base: CatalogItem[], incoming: unknown): CatalogItem[] {
  if (!Array.isArray(incoming)) return base;
  const normalized = incoming.map(item => typeof item === 'string' ? { id:item,label:item } : { id:String(item.id),label:String(item.label??item.id),color:item.color }).filter(item=>item.id);
  const ids = new Set(normalized.map(item=>item.id)); return [...normalized, ...base.filter(item=>!ids.has(item.id))];
}

export function normalizeProject(input: unknown): AtlasProject {
  if (!input || typeof input !== 'object') throw new Error('El archivo no contiene un proyecto válido.');
  const raw = input as LegacyObject;
  if (raw.atlas?.traditions && raw.atlas?.regions) return migrateReliTree(raw);
  if (raw.format !== PROJECT_FORMAT) throw new Error('Formato de proyecto desconocido. Se admiten Atlas Editor y RELITree/Atlas Studio.');
  const blank = createBlankProject(), legacyAxis = raw.board?.axis;
  const normalizeAxis=(incoming:LegacyObject|undefined,fallback:AxisDefinition):AxisDefinition=>{const merged={...fallback,...(incoming??{})};return{...merged,categories:(merged.categories??[]).map((item:unknown,index:number)=>typeof item==='string'?{id:`category-${index+1}`,label:item,weight:1,color:'transparent',opacity:0}:{id:String((item as LegacyObject).id??`category-${index+1}`),label:String((item as LegacyObject).label??''),weight:Math.max(.01,finite((item as LegacyObject).weight,1)),color:String((item as LegacyObject).color??'transparent'),opacity:Math.max(0,Math.min(1,finite((item as LegacyObject).opacity,0)))}),segments:(merged.segments??[]).map((item:LegacyObject,index:number)=>({id:String(item.id??`segment-${index+1}`),from:finite(item.from,merged.min),to:finite(item.to,merged.max),step:Math.max(.000001,finite(item.step,merged.step)),weight:Math.max(.01,finite(item.weight,1)),color:String(item.color??'transparent'),opacity:Math.max(0,Math.min(1,finite(item.opacity,0)))})),chapters:(merged.chapters??[]).map((item:LegacyObject,index:number)=>({id:String(item.id??`chapter-${index+1}`),label:String(item.label??`Capítulo ${index+1}`),from:typeof item.from==='string'?item.from:finite(item.from,merged.min),to:typeof item.to==='string'?item.to:finite(item.to,merged.max),parentId:item.parentId?String(item.parentId):null,color:String(item.color??'#334155'),opacity:Math.max(0,Math.min(1,finite(item.opacity,.82))),labelColor:String(item.labelColor??'#f8fafc')}))};};
  const board: Board = { ...blank.board, ...(raw.board ?? {}), axes: { x: normalizeAxis(raw.board?.axes?.x,blank.board.axes.x), y: normalizeAxis(raw.board?.axes?.y ?? legacyAxis,blank.board.axes.y) } };
  delete (board as unknown as LegacyObject).axis;
  const areas = (raw.areas ?? []).map((area: LegacyObject) => ({ ...area, parentAreaId:area.parentAreaId??null, showTitle:area.showTitle!==false, titleColor:String(area.titleColor??area.stroke??'#334155'), titleSize:Math.max(6,finite(area.titleSize,16)), padding: { top: 28, right: 28, bottom: 28, left: 28, ...(area.padding ?? {}) }, axisBindings:{x:{...defaultBinding(area.axisX===false?'none':'local-project'),...(area.axisBindings?.x??{}),axis:normalizeAxis(area.axisBindings?.x?.axis,blank.board.axes.x)},y:{...defaultBinding(area.axisY===false?'none':'project',true),...(area.axisBindings?.y??{}),axis:normalizeAxis(area.axisBindings?.y?.axis,blank.board.axes.y)}} }));
  const nodes = (raw.nodes ?? []).map((node: LegacyObject) => ({ ...node, shape: node.shape ?? 'rounded', iconScale: finite(node.iconScale, 1), containerVisible: node.containerVisible !== false, details: { ...defaultDetails(), ...(node.details ?? {}) }, customFields: node.customFields ?? {}, tags: node.tags ?? [], areaIds: node.areaIds ?? [], placement: { ...defaultPlacement(), ...(node.placement ?? {}) } }));
  const edges = (raw.edges ?? []).map((edge: LegacyObject) => ({ role:'secondary',strength:60,confidence:'medium',note:'',startMarker:'none',endMarker:edge.directed===false?'none':'arrow',lineCap:'round',avoidOverlap:true,parallelOffset:0,...edge,colors:edge.colors??[],waypoints:edge.waypoints??[] }));
  const events = (raw.events ?? []).map((event: LegacyObject) => ({ scope:'free',areaIds:[],entityIds:[],axisValue:null,endValue:null,...event }));
  const incomingSchema=raw.entitySchema??{};
  const entitySchema:EntitySchema={sections:Array.isArray(incomingSchema.sections)&&incomingSchema.sections.length?incomingSchema.sections.map((item:LegacyObject,index:number)=>({id:String(item.id??`section-${index+1}`),label:String(item.label??'Sección'),description:String(item.description??'')})):blank.entitySchema.sections,fields:Array.isArray(incomingSchema.fields)?incomingSchema.fields.map((item:LegacyObject,index:number)=>({id:String(item.id??`field-${index+1}`),label:String(item.label??'Campo'),sectionId:String(item.sectionId??blank.entitySchema.sections[0].id),type:['text','textarea','number','boolean','select','url','date'].includes(item.type)?item.type:'text',required:Boolean(item.required),options:Array.isArray(item.options)?item.options.map(String):[],help:String(item.help??'')})):[]};
  return { ...blank, ...raw, version: PROJECT_VERSION, board, layers: raw.layers?.length ? raw.layers : blank.layers, areas, nodes, edges, events, texts: raw.texts ?? [], references: raw.references ?? [], catalogs: { ...blank.catalogs, ...(raw.catalogs ?? {}) }, entitySchema, database:{customSql:Array.isArray(raw.database?.customSql)?raw.database.customSql.map(String):[]}, metadata: raw.metadata ?? {} } as AtlasProject;
}
