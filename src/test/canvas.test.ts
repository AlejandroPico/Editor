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
});
