import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { normalizeProject, type AtlasProject } from '../model/project';

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;
const getSql = () => sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl });

function insertJson<T extends { id: string }>(db: Database, table: string, rows: T[]): void {
  const statement = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
  try { for (const row of rows) statement.run([row.id, JSON.stringify(row)]); }
  finally { statement.free(); }
}

export async function projectToDatabase(project: AtlasProject): Promise<Uint8Array> {
  const SQL = await getSql();
  const db = new SQL.Database();
  db.run(`
    PRAGMA user_version = 1;
    CREATE TABLE project (id TEXT PRIMARY KEY, title TEXT NOT NULL, format TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE layers (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE areas (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE nodes (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE edges (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, target_id TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE texts (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE references_meta (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE INDEX edges_source ON edges(source_id);
    CREATE INDEX edges_target ON edges(target_id);
  `);
  db.run('INSERT INTO project VALUES (?, ?, ?, ?, ?, ?)', [project.id, project.title, project.format, project.version, project.updatedAt, JSON.stringify(project)]);
  insertJson(db, 'layers', project.layers);
  insertJson(db, 'areas', project.areas);
  insertJson(db, 'nodes', project.nodes);
  const edgeStatement = db.prepare('INSERT INTO edges (id, source_id, target_id, data) VALUES (?, ?, ?, ?)');
  try { for (const edge of project.edges) edgeStatement.run([edge.id, edge.sourceId, edge.targetId, JSON.stringify(edge)]); }
  finally { edgeStatement.free(); }
  insertJson(db, 'events', project.events);
  insertJson(db, 'texts', project.texts);
  insertJson(db, 'references_meta', project.references.map(reference => ({ ...reference, dataUrl: reference.dataUrl ? '[embedded-in-project]' : '' })));
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
