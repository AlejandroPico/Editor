import { describe, expect, it } from 'vitest';
import { axisBands, axisChapterBands, axisValueRatio, edgePath, pointInRect, resolvedNodeRect, snap } from '../lib/geometry';
import { createBlankProject } from '../model/project';

describe('geometría vectorial', () => {
  it('ajusta coordenadas a cualquier paso', () => expect(snap(117, 40)).toBe(120));
  it('detecta puntos en selecciones dibujadas en ambos sentidos', () => expect(pointInRect({x:5,y:5},{x:10,y:10},{x:0,y:0})).toBe(true));
  it('genera rutas SVG válidas para conexiones', () => {
    const project = createBlankProject(), layerId = project.activeLayerId;
    const base = { title:'',subtitle:'',visibleValue:'',width:100,height:60,rotation:0,shape:'rounded' as const,fill:'#fff',stroke:'#000',strokeWidth:1,opacity:1,iconScale:1,containerVisible:true,layerId,type:'entity',status:'active',summary:'',details:{},customFields:{},tags:[],areaIds:[],placement:{mode:'free' as const,areaId:null,xValue:null,yValue:null,offsetX:0,offsetY:0,avoidOverlap:true,durationStart:null,durationEnd:null,durationWidth:4} };
    const source={...base,id:'a',x:0,y:0},target={...base,id:'b',x:300,y:200};
    const edge={id:'e',sourceId:'a',targetId:'b',label:'',kind:'connection',role:'primary',strength:80,confidence:'medium',note:'',route:'orthogonal' as const,directed:true,startMarker:'none' as const,endMarker:'arrow' as const,lineCap:'round' as const,avoidOverlap:true,parallelOffset:0,color:'#000',colors:[],width:2,dash:'',opacity:1,waypoints:[],layerId};
    expect(edgePath(edge,source,target)).toMatch(/^M .*L/);
  });
  it('asigna más espacio visual a los tramos densos',()=>{
    const axis={mode:'timeline' as const,label:'',min:-10000,max:2000,step:1000,categories:[],segments:[{id:'old',from:-10000,to:-1000,step:1000,weight:1},{id:'dense',from:-1000,to:2000,step:200,weight:3}],chapters:[],visible:true,reverse:false,sticky:true,labelSize:10,minLabelSpacing:44};
    expect(axisValueRatio(axis,-1000)).toBeCloseTo(.25);
    expect(axisValueRatio(axis,2000)).toBeCloseTo(1);
  });
  it('convierte categorías en bandas coloreables proporcionales',()=>{
    const axis={mode:'categories' as const,label:'',min:0,max:1,step:1,categories:[{id:'a',label:'A',weight:1,color:'#ff0000',opacity:.2},{id:'b',label:'B',weight:3,color:'transparent',opacity:0}],segments:[],chapters:[],visible:false,reverse:false,sticky:true,labelSize:10,minLabelSpacing:44};
    const bands=axisBands(axis,100,400);
    expect(bands[0]).toMatchObject({start:100,length:100,color:'#ff0000',opacity:.2});
    expect(bands[1].length).toBe(300);
  });
  it('convierte capítulos anidados en carriles jerárquicos',()=>{
    const project=createBlankProject(),axis={...project.board.axes.y,mode:'timeline' as const,visible:true,min:-300,max:0,reverse:false,chapters:[{id:'era',label:'Era',from:-300,to:0,parentId:null,color:'#334155',opacity:.8,labelColor:'#fff'},{id:'periodo',label:'Período',from:-200,to:-100,parentId:'era',color:'#475569',opacity:.8,labelColor:'#fff'}]};
    const bands=axisChapterBands(axis,0,600);
    expect(bands.find(item=>item.id==='era')).toMatchObject({start:0,length:600,depth:0});
    expect(bands.find(item=>item.id==='periodo')).toMatchObject({start:200,length:200,depth:1});
  });
  it('separa conexiones paralelas del mismo recorrido',()=>{
    const project=createBlankProject(),layerId=project.activeLayerId,base={title:'',subtitle:'',visibleValue:'',width:50,height:50,rotation:0,shape:'circle' as const,fill:'#fff',stroke:'#000',strokeWidth:1,opacity:1,iconScale:1,containerVisible:true,layerId,type:'entity',status:'active',summary:'',details:{},customFields:{},tags:[],areaIds:[],placement:{mode:'free' as const,areaId:null,xValue:null,yValue:null,offsetX:0,offsetY:0,avoidOverlap:true,durationStart:null,durationEnd:null,durationWidth:4}},a={...base,id:'a',x:0,y:0},b={...base,id:'b',x:300,y:0},edge={id:'e1',sourceId:'a',targetId:'b',label:'',kind:'connection',role:'primary',strength:80,confidence:'medium',note:'',route:'straight' as const,directed:true,startMarker:'none' as const,endMarker:'arrow' as const,lineCap:'round' as const,avoidOverlap:true,parallelOffset:0,color:'#000',colors:[],width:4,dash:'',opacity:1,waypoints:[],layerId};project.nodes=[a,b];project.edges=[edge,{...edge,id:'e2'}];
    expect(edgePath(project.edges[0],a,b,project)).not.toBe(edgePath(project.edges[1],a,b,project));
  });
});
