import { describe, expect, it } from 'vitest';
import { safeFileName, versionedFileName } from '../lib/download';

describe('nombres de guardado',()=>{
  it('normaliza títulos para archivos portables',()=>expect(safeFileName('Árbol de Religión 3')).toBe('arbol-de-religion-3'));
  it('incluye fecha y hora local para conservar versiones',()=>{
    const date=new Date(2026,6,24,9,8,7);
    expect(versionedFileName('Mi proyecto','atlas.zip',date)).toBe('mi-proyecto_2026-07-24_09-08-07.atlas.zip');
  });
});
