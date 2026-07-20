import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { normalizeProject, type AtlasProject } from '../model/project';

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;
const locateWasm=()=>typeof window==='undefined'?new URL('../../node_modules/sql.js/dist/sql-wasm.wasm',import.meta.url).pathname:wasmUrl;
const getSql = () => sqlPromise ??= initSqlJs({ locateFile: locateWasm });

function insertJson<T extends { id: string }>(db: Database, table: string, rows: T[]): void {
  const statement = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
  try { for (const row of rows) statement.run([row.id, JSON.stringify(row)]); }
  finally { statement.free(); }
}

export async function openProjectDatabase(project: AtlasProject): Promise<Database> {
  const SQL = await getSql();
  const db = new SQL.Database();
  db.run(`
    PRAGMA user_version = 6;
    CREATE TABLE project (id TEXT PRIMARY KEY, title TEXT NOT NULL, format TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE layers (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE areas (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE nodes (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE edges (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, target_id TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE texts (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE references_meta (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE entity_fields (id TEXT PRIMARY KEY, section_id TEXT NOT NULL, label TEXT NOT NULL, type TEXT NOT NULL, required INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE TABLE entity_field_values (node_id TEXT NOT NULL, field_id TEXT NOT NULL, value TEXT, PRIMARY KEY (node_id, field_id));
    CREATE TABLE catalog_items (catalog TEXT NOT NULL, id TEXT NOT NULL, label TEXT NOT NULL, color TEXT, PRIMARY KEY (catalog, id));
    CREATE TABLE custom_sql_history (position INTEGER PRIMARY KEY, sql TEXT NOT NULL);
    CREATE INDEX edges_source ON edges(source_id);
    CREATE INDEX edges_target ON edges(target_id);
    CREATE INDEX nodes_title ON nodes(title);
    CREATE INDEX entity_values_field ON entity_field_values(field_id);
  `);
  db.run('INSERT INTO project VALUES (?, ?, ?, ?, ?, ?)', [project.id, project.title, project.format, project.version, project.updatedAt, JSON.stringify(project)]);
  insertJson(db, 'layers', project.layers);
  insertJson(db, 'areas', project.areas);
  const nodeStatement=db.prepare('INSERT INTO nodes (id, title, subtitle, type, status, data) VALUES (?, ?, ?, ?, ?, ?)');
  try { for (const node of project.nodes) nodeStatement.run([node.id,node.title,node.subtitle,node.type,node.status,JSON.stringify(node)]); }
  finally { nodeStatement.free(); }
  const edgeStatement = db.prepare('INSERT INTO edges (id, source_id, target_id, data) VALUES (?, ?, ?, ?)');
  try { for (const edge of project.edges) edgeStatement.run([edge.id, edge.sourceId, edge.targetId, JSON.stringify(edge)]); }
  finally { edgeStatement.free(); }
  insertJson(db, 'events', project.events);
  insertJson(db, 'texts', project.texts);
  insertJson(db, 'references_meta', project.references.map(reference => ({ ...reference, dataUrl: reference.dataUrl ? '[embedded-in-project]' : '' })));
  const fieldStatement=db.prepare('INSERT INTO entity_fields VALUES (?, ?, ?, ?, ?, ?)');
  try { for(const field of project.entitySchema.fields) fieldStatement.run([field.id,field.sectionId,field.label,field.type,field.required?1:0,JSON.stringify(field)]); }
  finally { fieldStatement.free(); }
  const valueStatement=db.prepare('INSERT INTO entity_field_values VALUES (?, ?, ?)');
  try { for(const node of project.nodes) for(const [fieldId,value] of Object.entries(node.customFields??{})) valueStatement.run([node.id,fieldId,String(value)]); }
  finally { valueStatement.free(); }
  const catalogStatement=db.prepare('INSERT INTO catalog_items VALUES (?, ?, ?, ?)');
  try { for(const [catalog,items] of Object.entries(project.catalogs)) for(const item of items) catalogStatement.run([catalog,item.id,item.label,item.color??null]); }
  finally { catalogStatement.free(); }
  const historyStatement=db.prepare('INSERT INTO custom_sql_history VALUES (?, ?)');
  try { project.database.customSql.forEach((sql,index)=>historyStatement.run([index+1,sql])); }
  finally { historyStatement.free(); }
  for(const [index,sql] of project.database.customSql.entries()){
    try { db.run(sql); }
    catch(error){ db.close(); throw new Error(`La sentencia SQL personalizada ${index+1} no se puede reproducir: ${error instanceof Error?error.message:String(error)}`); }
  }
  return db;
}

export async function projectToDatabase(project: AtlasProject): Promise<Uint8Array> {
  const db=await openProjectDatabase(project);
  const bytes = db.export();
  db.close();
  return bytes;
}

export async function projectFromDatabase(bytes: Uint8Array): Promise<AtlasProject> {
  const SQL = await getSql();
  const db = new SQL.Database(bytes);
  try {
    const result = db.exec('SELECT data FROM project LIMIT 1');
    const value = result[0]?.values[0]?.[0];
    if (typeof value !== 'string') throw new Error('La base SQLite no contiene un proyecto Atlas Editor.');
    return normalizeProject(JSON.parse(value));
  } finally { db.close(); }
}
