import { describe, expect, it } from 'vitest';
import { createBlankProject } from '../model/project';
import { openProjectDatabase, projectFromDatabase, projectToDatabase } from '../lib/sqlite';

describe('SQLite Studio',()=>{
  it('genera tablas normalizadas y reproduce SQL personalizado',async()=>{
    const project=createBlankProject();
    project.database.customSql=["CREATE TABLE private_notes (id INTEGER PRIMARY KEY, note TEXT); INSERT INTO private_notes(note) VALUES ('dato propio');"];
    const db=await openProjectDatabase(project);
    const result=db.exec('SELECT note FROM private_notes')[0];
    expect(result.values[0][0]).toBe('dato propio');
    expect(db.exec("SELECT count(*) FROM sqlite_master WHERE name='entity_fields'")[0].values[0][0]).toBe(1);
    db.close();
  });
  it('conserva el proyecto editable dentro del archivo',async()=>{
    const project=createBlankProject();project.title='Base portable';
    const restored=await projectFromDatabase(await projectToDatabase(project));
    expect(restored.title).toBe('Base portable');
    expect(restored.version).toBe(6);
  });
});
