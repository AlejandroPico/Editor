import { BoxSelect, CircleDot, GitBranch, Hand, Image, MousePointer2, Minus, Type } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import type { Tool } from '../model/project';

const tools: Array<{ id: Tool; label: string; key: string; icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Seleccionar y mover', key: 'V', icon: MousePointer2 },
  { id: 'pan', label: 'Desplazar lienzo', key: 'H', icon: Hand },
  { id: 'node', label: 'Añadir entidad', key: 'N', icon: CircleDot },
  { id: 'edge', label: 'Crear conexión', key: 'L', icon: GitBranch },
  { id: 'event', label: 'Añadir acontecimiento', key: 'E', icon: Minus },
  { id: 'text', label: 'Añadir texto', key: 'T', icon: Type },
  { id: 'reference', label: 'Transformar imágenes', key: 'R', icon: Image }
];

export function Toolbox(): React.JSX.Element {
  const active = useEditorStore(state => state.tool);
  const setTool = useEditorStore(state => state.setTool);
  const relationSource = useEditorStore(state => state.relationSourceId);
  return <aside className="toolbox" aria-label="Herramientas">
    {tools.map(tool => <button key={tool.id} className={active === tool.id ? 'active' : ''} onClick={() => setTool(tool.id)} title={`${tool.label} (${tool.key})`}>
      <tool.icon size={19}/><span>{tool.key}</span>
    </button>)}
    {relationSource && <div className="tool-hint"><BoxSelect size={14}/> Elige destino</div>}
  </aside>;
}
