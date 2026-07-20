import { describe, expect, it } from 'vitest';
import { createBlankProject, normalizeProject, PROJECT_FORMAT, PROJECT_VERSION } from '../model/project';

describe('formato de proyecto', () => {
  it('empieza realmente vacío y sin eje obligatorio', () => {
    const project = createBlankProject();
    expect(project.format).toBe(PROJECT_FORMAT);
    expect(project.version).toBe(PROJECT_VERSION);
    expect(project.nodes).toEqual([]);
    expect(project.edges).toEqual([]);
    expect(project.events).toEqual([]);
    expect(project.areas).toEqual([]);
    expect(project.references).toEqual([]);
    expect(project.board.axes.x.mode).toBe('none');
    expect(project.board.axes.y.mode).toBe('none');
    expect(project.board.axes.x.sticky).toBe(true);
    expect(project.board.axes.y.minLabelSpacing).toBe(44);
    expect(project.board.axes.y.chapters).toEqual([]);
  });
  it('normaliza colecciones opcionales sin perder el documento', () => {
    const project = createBlankProject();
    const normalized = normalizeProject({ ...project, texts: undefined, metadata: undefined });
    expect(normalized.texts).toEqual([]);
    expect(normalized.metadata).toEqual({});
    expect(normalized.id).toBe(project.id);
  });
  it('rechaza JSON ajeno al editor', () => expect(() => normalizeProject({ title: 'otro formato' })).toThrow(/Formato/));
  it('migra áreas antiguas a títulos visibles y jerarquía vacía',()=>{
    const project=createBlankProject();
    const normalized=normalizeProject({...project,areas:[{id:'era',name:'Mesozoico',x:0,y:0,width:500,height:500,fill:'#fff',fillOpacity:.1,stroke:'#000',strokeWidth:1,radius:0,padding:{top:10,right:10,bottom:10,left:10},axisBindings:{x:{mode:'none',visible:false,axis:project.board.axes.x},y:{mode:'none',visible:false,axis:project.board.axes.y}},layerId:project.activeLayerId}]});
    expect(normalized.areas[0]).toMatchObject({parentAreaId:null,showTitle:true,titleSize:16});
  });
  it('migra ejes anteriores sin perderlos y añade la colección de subejes',()=>{
    const project=createBlankProject();
    const legacy={...project,board:{...project.board,axes:{x:{...project.board.axes.x,chapters:undefined},y:{...project.board.axes.y,chapters:undefined}}}};
    const normalized=normalizeProject(legacy);
    expect(normalized.version).toBe(PROJECT_VERSION);
    expect(normalized.board.axes.x.chapters).toEqual([]);
  });
  it('migra proyectos RELITree/Atlas Studio con regiones, fichas y relaciones', () => {
    const migrated=normalizeProject({schemaVersion:4,application:'Atlas Studio',atlas:{metadata:{presentYear:2026,board:{title:'ReliTree',axisMode:'timeline'}},regions:[{id:'europa',name:'Europa',color:'#4fb26f',order:0,width:700}],traditions:[{id:'a',name:'Origen',regionId:'europa',startYear:-100,placement:{regionId:'europa',xPercent:20},details:{evidence:'fuente'}},{id:'b',name:'Rama',subtitle:'Occidental',regionId:'europa',parentId:'a',startYear:200,placement:{regionId:'europa',xPercent:70}}],relations:[],events:[]}});
    expect(migrated.areas[0].name).toBe('Europa');
    expect(migrated.nodes[0].placement.mode).toBe('semantic');
    expect(migrated.nodes[0].details.evidence).toBe('fuente');
    expect(migrated.edges.some(edge=>edge.sourceId==='a'&&edge.targetId==='b')).toBe(true);
    expect(migrated.metadata.importedFrom).toContain('Atlas Studio');
  });
});
