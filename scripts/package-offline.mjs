import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const offline = resolve(root, 'dist-offline/index.html');
const downloads = resolve(root, 'dist/downloads');
await mkdir(downloads, { recursive: true });
await copyFile(offline, resolve(downloads, 'Atlas-Editor-offline.html'));
const zip = new JSZip();
zip.file('Atlas-Editor.html', await readFile(offline));
zip.file('LEEME.txt', 'Atlas Editor portable\n\nAbre Atlas-Editor.html con un navegador moderno. No necesita instalación ni conexión a Internet.\nLos proyectos se guardan como paquetes .atlas.zip que incluyen JSON, SQLite, SVG, visor web y SQL personalizado.\n');
zip.file('LICENSE.txt', await readFile(resolve(root, 'LICENSE'), 'utf8'));
await writeFile(resolve(downloads, 'Atlas-Editor-portable.zip'), await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }));
console.log('Distribución offline creada en dist/downloads/.');
