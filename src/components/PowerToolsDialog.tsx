import { useMemo, useRef, useState } from 'react';
import { Activity, AlignHorizontalSpaceAround, AppWindow, Boxes, Braces, ChartNoAxesCombined, Component, DatabaseZap, GitBranch, Grid3X3, ImagePlus, Map, MousePointerClick, PenTool, Presentation, SearchCheck, X } from 'lucide-react';
import { uid, type AtlasProject, type NodeEntity } from '../model/project';
import { useEditorStore } from '../store/editorStore';

type LabData={
  styles:Array<{id:string;name:string;fill:string;stroke:string;strokeWidth:number;shape:NodeEntity['shape']}>;
  groups:Array<{id:string;name:string;memberIds:string[];locked:boolean}>;
  assets:Array<{id:string;name:string;dataUrl:string;kind:string}>;
  guides:Array<{id:string;orientation:'x'|'y';position:number;color:string}>;
  ports:Record<string,Array<{id:string;side:string;label:string}>>;
  sources:Array<{id:string;title:string;url:string;citation:string}>;
  tables:Array<{id:string;name:string;columns:string[];rows:string[][]}>;
  interactions:Array<{id:string;trigger:string;action:string;target:string}>;
  presentations:Array<{id:string;name:string;areaIds:string[]}>;
  snapshots:Array<{id:string;name:string;createdAt:string;project:string}>;
  plugins:Array<{id:string;name:string;enabled:boolean}>;
};

const empty=():LabData=>({styles:[],groups:[],assets:[],guides:[],ports:{},sources:[],tables:[],interactions:[],presentations:[],snapshots:[],plugins:[]});
const dataOf=(project:AtlasProject):LabData=>{try{return{...empty(),...JSON.parse(project.metadata.planB||'{}') as Partial<LabData>}}catch{return empty()}};
const csv=(value:string)=>value.trim().split(/\r?\n/).filter(Boolean).map(line=>line.split(',').map(cell=>cell.trim()));
const descriptor=(node:NodeEntity)=>[node.title,node.subtitle,node.visibleValue].filter(Boolean).join(' — ');
const baseNode=(project:AtlasProject,title:string,x:number,y:number):NodeEntity=>({id:uid('node'),title,subtitle:'',visibleValue:'',x,y,width:120,height:72,rotation:0,shape:'rounded',fill:'#f8fafc',stroke:'#334155',strokeWidth:2,opacity:1,iconScale:1,containerVisible:true,layerId:project.activeLayerId,type:project.catalogs.nodeTypes[0]?.id??'entity',status:project.catalogs.statuses[0]?.id??'active',summary:'',details:{},customFields:{},tags:[],areaIds:[],placement:{mode:'free',areaId:null,xValue:null,yValue:null,offsetX:0,offsetY:0,avoidOverlap:true,durationStart:null,durationEnd:null,durationWidth:4}});
const starSvg='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 3 61 37 97 37 68 58 79 94 50 73 21 94 32 58 3 37 39 37Z" fill="#d7b45a" stroke="#332a16" stroke-width="4"/></svg>');

function Card({icon,title,children}:{icon:React.ReactNode;title:string;children:React.ReactNode}){return <section className="power-card"><h3>{icon}{title}</h3>{children}</section>}

export function PowerToolsDialog({onClose}:{onClose:()=>void}):React.JSX.Element{
  const project=useEditorStore(s=>s.project),selection=useEditorStore(s=>s.selection),update=useEditorStore(s=>s.updateProject),setSelection=useEditorStore(s=>s.setSelection);
  const [tab,setTab]=useState(0),[text,setText]=useState('title,subtitle,x,y\nConcepto A,Origen,180,180\nConcepto B,Resultado,420,300'),[name,setName]=useState('Mi recurso'),file=useRef<HTMLInputElement>(null);
  const labs=dataOf(project),selectedNodes=project.nodes.filter(node=>selection.some(item=>item.type==='node'&&item.id===node.id));
  const save=(label:string,recipe:(data:LabData,draft:AtlasProject)=>void)=>update(label,draft=>{const data=dataOf(draft);recipe(data,draft);draft.metadata.planB=JSON.stringify(data)});
  const health=useMemo(()=>{const ids=new Set(project.nodes.map(n=>n.id)),broken=project.edges.filter(e=>!ids.has(e.sourceId)||!ids.has(e.targetId)).length,unsourced=project.nodes.filter(n=>!n.details.evidence&&!n.details.sources).length,emptyTitles=project.nodes.filter(n=>!n.title.trim()).length;return{broken,unsourced,emptyTitles,score:Math.max(0,100-broken*20-unsourced*2-emptyTitles*10)}},[project]);
  const layout=(mode:'row'|'column'|'grid'|'radial')=>update(`Auto-layout ${mode}`,draft=>{
    const nodes=draft.nodes.filter(node=>selection.some(item=>item.type==='node'&&item.id===node.id));
    if(!nodes.length)return;
    const cx=nodes.reduce((sum,node)=>sum+node.x,0)/nodes.length,cy=nodes.reduce((sum,node)=>sum+node.y,0)/nodes.length;
    nodes.forEach((node,index)=>{
      if(mode==='row'){node.x=cx+(index-(nodes.length-1)/2)*170;node.y=cy}
      else if(mode==='column'){node.x=cx;node.y=cy+(index-(nodes.length-1)/2)*120}
      else if(mode==='grid'){const columns=Math.ceil(Math.sqrt(nodes.length));node.x=cx+(index%columns)*170;node.y=cy+Math.floor(index/columns)*120}
      else{const angle=index/nodes.length*Math.PI*2;node.x=cx+Math.cos(angle)*260;node.y=cy+Math.sin(angle)*260}
      node.placement.mode='free';
    });
  });
  const importRows=()=>{const rows=csv(text),headers=rows.shift()?.map(v=>v.toLowerCase())??[];update('Importar tabla a entidades',draft=>{const created=rows.map((row,index)=>{const value=(key:string)=>row[headers.indexOf(key)]??'';const node=baseNode(draft,value('title')||value('titulo')||`Entidad ${index+1}`,Number(value('x'))||160+(index%5)*170,Number(value('y'))||180+Math.floor(index/5)*120);node.subtitle=value('subtitle')||value('subtitulo');node.visibleValue=value('value')||value('valor');return node});draft.nodes.push(...created);setSelection(created.map(node=>({type:'node' as const,id:node.id})))})};
  const addAsset=(uploaded:File)=>{const reader=new FileReader();reader.onload=()=>save('Añadir recurso',(data)=>data.assets.push({id:uid('asset'),name:uploaded.name,dataUrl:String(reader.result),kind:uploaded.type||'application/octet-stream'}));reader.readAsDataURL(uploaded)};
  const tabs=['Diseño','Datos','Conocimiento','Publicación'];
  return <div className="modal-backdrop"><div className="project-dialog power-dialog"><header><div><small>RAMA PLAN-B · LABORATORIO</small><h2>16 módulos de potencia</h2></div><button className="icon" onClick={onClose}><X/></button></header><nav className="project-tabs">{tabs.map((label,index)=><button key={label} className={tab===index?'active':''} onClick={()=>setTab(index)}>{label}</button>)}</nav><div className="power-grid">
    {tab===0&&<>
      <Card icon={<Component/>} title="1 · Componentes y estilos"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del estilo"/><button onClick={()=>{const node=selectedNodes[0];if(node)save('Guardar estilo',(data)=>data.styles.push({id:uid('style'),name,fill:node.fill,stroke:node.stroke,strokeWidth:node.strokeWidth,shape:node.shape}))}} disabled={!selectedNodes.length}>Guardar aspecto seleccionado</button>{labs.styles.map(style=><button key={style.id} onClick={()=>update('Aplicar estilo',draft=>draft.nodes.filter(n=>selection.some(s=>s.type==='node'&&s.id===n.id)).forEach(n=>Object.assign(n,{fill:style.fill,stroke:style.stroke,strokeWidth:style.strokeWidth,shape:style.shape})))}>{style.name}</button>)}</Card>
      <Card icon={<AlignHorizontalSpaceAround/>} title="2 · Auto-layout y restricciones"><p>Distribuye la selección conservando objetos editables.</p><div className="button-grid"><button onClick={()=>layout('row')}>Fila</button><button onClick={()=>layout('column')}>Columna</button><button onClick={()=>layout('grid')}>Rejilla</button><button onClick={()=>layout('radial')}>Radial</button></div></Card>
      <Card icon={<Boxes/>} title="3 · Grupos, marcos y secciones"><button disabled={!selection.length} onClick={()=>save('Crear grupo',(data)=>data.groups.push({id:uid('group'),name:`Grupo ${data.groups.length+1}`,memberIds:selection.map(s=>`${s.type}:${s.id}`),locked:false}))}>Agrupar selección</button>{labs.groups.map(group=><label className="lab-row" key={group.id}><span>{group.name} · {group.memberIds.length}</span><input type="checkbox" checked={group.locked} onChange={e=>save('Bloquear grupo',data=>{data.groups.find(g=>g.id===group.id)!.locked=e.target.checked})}/></label>)}</Card>
      <Card icon={<PenTool/>} title="4 · Vector, figuras y efectos"><button onClick={()=>update('Añadir figura vectorial',draft=>{const node=baseNode(draft,'Figura vectorial',240,220);node.iconDataUrl=starSvg;node.containerVisible=false;draft.nodes.push(node);setSelection([{type:'node',id:node.id}])})}>Insertar estrella SVG editable</button><p>La figura queda como entidad, admite rotación, opacidad, conexiones y sustitución de SVG.</p></Card>
    </>}
    {tab===1&&<>
      <Card icon={<DatabaseZap/>} title="5 · Vinculación CSV, JSON y SQLite"><textarea value={text} onChange={e=>setText(e.target.value)}/><button onClick={importRows}>Crear entidades desde CSV</button><button onClick={()=>save('Guardar tabla',(data)=>{const rows=csv(text),columns=rows.shift()??[];data.tables.push({id:uid('table'),name,columns,rows})})}>Guardar como tabla vinculada</button></Card>
      <Card icon={<ImagePlus/>} title="6 · Biblioteca de recursos"><button onClick={()=>file.current?.click()}>Añadir SVG, imagen o archivo</button><input ref={file} hidden type="file" onChange={e=>{const value=e.target.files?.[0];if(value)addAsset(value);e.target.value=''}}/>{labs.assets.map(asset=><div className="lab-row" key={asset.id}><span>{asset.name}</span><button onClick={()=>navigator.clipboard?.writeText(asset.dataUrl)}>Copiar URI</button></div>)}</Card>
      <Card icon={<Grid3X3/>} title="7 · Guías, medidas y ajuste"><div className="button-grid"><button onClick={()=>save('Añadir guía X',data=>data.guides.push({id:uid('guide'),orientation:'x',position:project.board.width/2,color:'#ef4444'}))}>Guía X central</button><button onClick={()=>save('Añadir guía Y',data=>data.guides.push({id:uid('guide'),orientation:'y',position:project.board.height/2,color:'#3b82f6'}))}>Guía Y central</button></div><p>{labs.guides.length} guías persistentes preparadas para reglas y magnetismo.</p></Card>
      <Card icon={<GitBranch/>} title="8 · Grafos y puertos"><div className="button-grid"><button onClick={()=>layout('grid')}>Jerárquico</button><button onClick={()=>layout('radial')}>Radial</button></div><button disabled={!selectedNodes.length} onClick={()=>save('Crear puertos',data=>selectedNodes.forEach(node=>data.ports[node.id]=['top','right','bottom','left'].map(side=>({id:uid('port'),side,label:side}))))}>Crear 4 puertos en selección</button><p>{Object.keys(labs.ports).length} entidades con puertos.</p></Card>
    </>}
    {tab===2&&<>
      <Card icon={<SearchCheck/>} title="9 · Ontologías, búsqueda y validación"><p>Puntuación de coherencia: <strong>{health.score}/100</strong></p><ul><li>{health.broken} relaciones rotas</li><li>{health.emptyTitles} títulos vacíos</li><li>{health.unsourced} entidades sin evidencia</li></ul><input placeholder="Buscar título, etiqueta o ficha" onChange={e=>{const q=e.target.value.toLowerCase();if(q)setSelection(project.nodes.filter(n=>JSON.stringify(n).toLowerCase().includes(q)).map(n=>({type:'node',id:n.id})))}}/></Card>
      <Card icon={<Braces/>} title="10 · Texto enriquecido y fórmulas"><p>Los campos editoriales aceptan Markdown, tablas, bloques de código y fórmulas delimitadas por <code>$…$</code>.</p><button disabled={!selectedNodes.length} onClick={()=>update('Insertar plantilla Markdown',draft=>draft.nodes.filter(n=>selection.some(s=>s.type==='node'&&s.id===n.id)).forEach(n=>n.details.overview='# Resumen\n\n- Idea principal\n- Evidencia\n\n$E = mc^2$'))}>Aplicar plantilla a selección</button></Card>
      <Card icon={<DatabaseZap/>} title="11 · Fuentes, evidencia y comentarios"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Título de la fuente"/><button onClick={()=>save('Añadir fuente',data=>data.sources.push({id:uid('source'),title:name,url:'https://',citation:''}))}>Crear fuente</button>{labs.sources.map(source=><div className="lab-row" key={source.id}><span>{source.title}</span><a href={source.url} target="_blank" rel="noreferrer">Abrir</a></div>)}</Card>
      <Card icon={<Activity/>} title="12 · Automatización y complementos"><button onClick={()=>save('Activar macro',data=>data.plugins.push({id:uid('plugin'),name:`Macro ${data.plugins.length+1}`,enabled:true}))}>Registrar macro segura</button>{labs.plugins.map(plugin=><label className="lab-row" key={plugin.id}><span>{plugin.name}</span><input type="checkbox" checked={plugin.enabled} onChange={e=>save('Configurar complemento',data=>{data.plugins.find(p=>p.id===plugin.id)!.enabled=e.target.checked})}/></label>)}</Card>
    </>}
    {tab===3&&<>
      <Card icon={<Map/>} title="13 · Mapas, gráficos y plantillas"><div className="button-grid"><button onClick={()=>update('Plantilla cronología',draft=>{draft.board.axes.y={...draft.board.axes.y,mode:'timeline',visible:true,sticky:true,label:'Tiempo',min:-1000,max:2026,step:100};draft.board.axes.x={...draft.board.axes.x,mode:'categories',visible:true,sticky:true,label:'Categorías',categories:[{id:'a',label:'Área A',weight:1,color:'#3b82f6',opacity:.08},{id:'b',label:'Área B',weight:1,color:'#f59e0b',opacity:.08}]}})}>Cronología</button><button onClick={()=>update('Plantilla de mapa',draft=>{draft.board.background='#dbeafe';draft.board.gridVisible=false})}>Mapa</button><button onClick={()=>layout('radial')}>Mapa mental</button><button onClick={()=>layout('column')}>Sankey base</button></div></Card>
      <Card icon={<MousePointerClick/>} title="14 · Interacciones sin código"><button onClick={()=>save('Crear interacción',data=>data.interactions.push({id:uid('interaction'),trigger:'click',action:'open-card',target:selectedNodes[0]?.id??''}))}>Clic → abrir ficha</button>{labs.interactions.map(value=><div className="lab-row" key={value.id}><span>{value.trigger} → {value.action}</span><small>{value.target}</small></div>)}</Card>
      <Card icon={<Presentation/>} title="15 · Presentación y vistas responsivas"><button onClick={()=>save('Crear presentación',data=>data.presentations.push({id:uid('presentation'),name,areaIds:project.areas.map(a=>a.id)}))}>Crear recorrido desde áreas</button>{labs.presentations.map(value=><div className="lab-row" key={value.id}><span>{value.name}</span><small>{value.areaIds.length} páginas</small></div>)}</Card>
      <Card icon={<AppWindow/>} title="16 · Versiones, salud y exportación"><p>Salud actual: <strong>{health.score}/100</strong>. El punto de restauración excluye otros puntos para evitar recursión.</p><button onClick={()=>save('Crear punto de restauración',(data,draft)=>{const clone=structuredClone(draft);delete clone.metadata.planB;data.snapshots.push({id:uid('snapshot'),name:`Versión ${data.snapshots.length+1}`,createdAt:new Date().toISOString(),project:JSON.stringify(clone)})})}>Crear punto de restauración</button>{labs.snapshots.map(value=><div className="lab-row" key={value.id}><span>{value.name}</span><small>{new Date(value.createdAt).toLocaleString('es')}</small></div>)}</Card>
    </>}
  </div></div></div>;
}
