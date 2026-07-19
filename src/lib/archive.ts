import JSZip from 'jszip';
import { normalizeProject, type AtlasProject } from '../model/project';
import { projectToDatabase } from './sqlite';
import { interactiveViewerHtml } from './viewer';

export async function createProjectArchive(project: AtlasProject): Promise<Blob> {
  const zip = new JSZip();
  const sqlite = await projectToDatabase(project);
  zip.file('manifest.json', JSON.stringify({ format: project.format, version: project.version, title: project.title, entry: 'project.json', database: 'project.sqlite' }, null, 2));
  zip.file('project.json', JSON.stringify(project, null, 2));
  zip.file('project.sqlite', sqlite);
  zip.file('README.txt', 'Proyecto portable de Atlas Editor. Ábrelo desde Archivo > Abrir proyecto.\n');
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

export async function openProjectFile(file: File): Promise<AtlasProject> {
  if (file.name.toLowerCase().endsWith('.zip') || file.name.toLowerCase().endsWith('.atlas')) {
    const zip = await JSZip.loadAsync(file);
    const entry = zip.file('project.json');
    if (!entry) throw new Error('El paquete no contiene project.json.');
    return normalizeProject(JSON.parse(await entry.async('text')));
  }
  return normalizeProject(JSON.parse(await file.text()));
}

export async function createViewerArchive(project: AtlasProject): Promise<Blob> {
  const zip = new JSZip();
  zip.file('index.html', interactiveViewerHtml(project));
  zip.file('data/project.json', JSON.stringify(project, null, 2));
  zip.file('README.txt', 'Visor web autónomo generado por Atlas Editor. Publica esta carpeta en GitHub Pages o abre index.html.\n');
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
