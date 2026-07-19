import { useEffect, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { ProjectDialog } from './components/ProjectDialog';
import { Toolbox } from './components/Toolbox';
import { Topbar } from './components/Topbar';
import { useEditorStore } from './store/editorStore';
import type { Tool } from './model/project';

export function App(): React.JSX.Element {
  const [settings, setSettings] = useState(false);
  const project = useEditorStore(state => state.project);
  const setTool = useEditorStore(state => state.setTool);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const deleteSelection = useEditorStore(state => state.deleteSelection);
  const selection = useEditorStore(state => state.selection);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const editing = ['INPUT','TEXTAREA','SELECT'].includes((event.target as HTMLElement)?.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
      if (editing) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (selection.length && confirm(`¿Eliminar ${selection.length === 1 ? 'el objeto seleccionado' : `${selection.length} objetos seleccionados`}?`)) deleteSelection();
        return;
      }
      const shortcuts: Record<string, Tool> = { v:'select',h:'pan',n:'node',l:'edge',e:'event',t:'text',r:'reference' };
      const tool = shortcuts[event.key.toLowerCase()]; if (tool) setTool(tool);
      if (event.key === 'Escape') { setSettings(false); setTool('select'); }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [deleteSelection, redo, selection.length, setTool, undo]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (useEditorStore.getState().dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', beforeUnload); return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  return <div className="app">
    <Topbar onSettings={() => setSettings(true)}/>
    <Toolbox/>
    <Canvas/>
    <Inspector/>
    <footer className="statusbar"><span>Formato {project.format} v{project.version}</span><span>Supr: eliminar · Ctrl+Z/Y: historial · rueda: zoom</span><span>{project.board.width} × {project.board.height}</span></footer>
    {settings && <ProjectDialog onClose={() => setSettings(false)}/>} 
  </div>;
}
