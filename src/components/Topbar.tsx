import { useRef, useState } from 'react';
import { Box, Database, Download, FileArchive, FileDown, FilePlus2, FolderOpen, PanelRightClose, PanelRightOpen, Redo2, Save, Settings2, Undo2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { createProjectArchive, createViewerArchive, openProjectFile } from '../lib/archive';
import { downloadBlob, downloadText, safeFileName } from '../lib/download';
import { projectFromDatabase } from '../lib/sqlite';
import { projectSvg } from '../lib/svgExport';

export function Topbar({ onSettings, onDatabase, inspectorOpen, onToggleInspector }: { onSettings: () => void; onDatabase: () => void; inspectorOpen: boolean; onToggleInspector: () => void }): React.JSX.Element {
  const input = useRef<HTMLInputElement>(null);
  const project = useEditorStore(state => state.project);
  const dirty = useEditorStore(state => state.dirty);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const past = useEditorStore(state => state.past.length);
  const future = useEditorStore(state => state.future.length);
  const replaceProject = useEditorStore(state => state.replaceProject);
  const newProject = useEditorStore(state => state.newProject);
  const markSaved = useEditorStore(state => state.markSaved);
  const [busy, setBusy] = useState('');
  const name = safeFileName(project.title);

  const execute = async (label: string, action: () => Promise<void>) => {
    try { setBusy(label); await action(); }
    catch (error) { window.alert(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(''); }
  };
  const open = async (file: File) => execute('Abriendo…', async () => {
    const next = file.name.endsWith('.sqlite') ? await projectFromDatabase(new Uint8Array(await file.arrayBuffer())) : await openProjectFile(file);
    replaceProject(next);
  });

  return <header className="topbar">
    <div className="brand"><Box size={22}/><div><strong>Atlas Editor</strong><small>{project.title}{dirty ? ' · sin guardar' : ''}</small></div></div>
    <div className="top-group">
      <button title="Proyecto nuevo" onClick={() => { if (!dirty || confirm('¿Descartar los cambios y crear un proyecto vacío?')) newProject(); }}><FilePlus2 size={17}/><span>Nuevo</span></button>
      <button title="Abrir JSON, SQLite o paquete ZIP" onClick={() => input.current?.click()}><FolderOpen size={17}/><span>Abrir</span></button>
      <button title="Guardar paquete completo con JSON y SQLite" onClick={() => execute('Empaquetando…', async () => { downloadBlob(await createProjectArchive(project), `${name}.atlas.zip`); markSaved(); })}><Save size={17}/><span>Guardar</span></button>
    </div>
    <div className="top-group compact">
      <button disabled={!past} title="Deshacer" onClick={undo}><Undo2 size={17}/></button>
      <button disabled={!future} title="Rehacer" onClick={redo}><Redo2 size={17}/></button>
    </div>
    <div className="top-group export-group">
      <button title="Exportar SVG vectorial" onClick={() => downloadText(projectSvg(project), `${name}.svg`, 'image/svg+xml')}><FileDown size={17}/><span>SVG</span></button>
      <button title="Abrir SQLite Studio: tablas, datos y consola SQL" onClick={onDatabase}><Database size={17}/><span>SQLite</span></button>
      <button title="Generar visor web interactivo listo para publicar" onClick={() => execute('Generando visor…', async () => downloadBlob(await createViewerArchive(project), `${name}-web.zip`))}><FileArchive size={17}/><span>Visor web</span></button>
      <a className="top-link" href="./downloads/Atlas-Editor-offline.html" download title="Descargar toda la aplicación en un solo HTML"><Download size={17}/><span>Editor offline</span></a>
    </div>
    <button title={inspectorOpen?'Ocultar inspector (Mayús+I)':'Mostrar inspector (Mayús+I)'} onClick={onToggleInspector}>{inspectorOpen?<PanelRightClose size={17}/>:<PanelRightOpen size={17}/>}<span>Inspector</span></button>
    <button className="settings-button" onClick={onSettings}><Settings2 size={17}/><span>Proyecto</span></button>
    {busy && <div className="busy">{busy}</div>}
    <input ref={input} type="file" hidden accept=".json,.zip,.atlas,.sqlite,application/json,application/zip" onChange={event => { const file = event.target.files?.[0]; if (file) void open(file); event.target.value = ''; }}/>
  </header>;
}
