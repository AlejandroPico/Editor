import { describe, expect, it } from 'vitest';
import { edgePath, pointInRect, snap } from '../lib/geometry';
import { createBlankProject } from '../model/project';

describe('geometría vectorial', () => {
  it('ajusta coordenadas a cualquier paso', () => expect(snap(117, 40)).toBe(120));
  it('detecta puntos en selecciones dibujadas en ambos sentidos', () => expect(pointInRect({x:5,y:5},{x:10,y:10},{x:0,y:0})).toBe(true));
  it('genera rutas SVG válidas para conexiones', () => {
    const project = createBlankProject(), layerId = project.activeLayerId;
    const base = { title:'',subtitle:'',visibleValue:'',width:100,height:60,rotation:0,shape:'rounded' as const,fill:'#fff',stroke:'#000',strokeWidth:1,opacity:1,iconScale:1,containerVisible:true,layerId,type:'entity',status:'active',summary:'',details:{},tags:[],areaIds:[],placement:{mode:'free' as const,areaId:null,xValue:null,yValue:null,offsetX:0,offsetY:0,avoidOverlap:true,durationStart:null,durationEnd:null,durationWidth:4} };
    const source={...base,id:'a',x:0,y:0},target={...base,id:'b',x:300,y:200};
    const edge={id:'e',sourceId:'a',targetId:'b',label:'',kind:'connection',role:'primary',strength:80,confidence:'medium',note:'',route:'orthogonal' as const,directed:true,color:'#000',colors:[],width:2,dash:'',opacity:1,waypoints:[],layerId};
    expect(edgePath(edge,source,target)).toMatch(/^M .*L/);
  });
});
