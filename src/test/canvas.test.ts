import { describe, expect, it } from 'vitest';
import { axisTicks } from '../components/Canvas';
import { defaultAxis } from '../model/project';

describe('reglas adaptativas',()=>{
  it('reduce los rótulos cuando el zoom no deja espacio suficiente',()=>{
    const axis={...defaultAxis(),mode:'timeline' as const,visible:true,min:-1000,max:2000,step:10,minLabelSpacing:44};
    const far=axisTicks(axis,0,1000,.2).filter(tick=>tick.major).length;
    const near=axisTicks(axis,0,1000,2).filter(tick=>tick.major).length;
    expect(far).toBeLessThan(near);
    expect(far).toBeLessThanOrEqual(6);
  });
  it('no conserva dos marcas en la misma coordenada al unir tramos',()=>{
    const axis={...defaultAxis(),mode:'timeline' as const,visible:true,min:-1000,max:1000,segments:[{id:'a',from:-1000,to:0,step:100,weight:1},{id:'b',from:0,to:1000,step:100,weight:1}]};
    const positions=axisTicks(axis,0,1000,1).map(tick=>Math.round(tick.position*1e6));
    expect(new Set(positions).size).toBe(positions.length);
  });
});
