import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { createBlankProject } from '../model/project';
import { createProjectArchive } from '../lib/archive';

describe('paquete completo',()=>{
  it('incluye fuente, SQLite, SVG, visor y SQL personalizado',async()=>{
    const project=createBlankProject();
    project.database.customSql=['CREATE TABLE notes (text TEXT);'];
    const zip=await JSZip.loadAsync(await (await createProjectArchive(project)).arrayBuffer());
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['project.json','project.sqlite','project.svg','viewer/index.html','viewer/data/project.json','database/custom.sql']));
    expect(await zip.file('database/custom.sql')!.async('text')).toContain('CREATE TABLE notes');
  });
});
