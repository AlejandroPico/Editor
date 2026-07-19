# Atlas Editor

Editor vectorial y portable para construir esquemas, lienzos, infografías, mapas, cronologías y redes interactivas. Es un producto independiente de ReliTree y puede servir como herramienta de autor para cualquier proyecto web.

## Arquitectura

- React 19 y TypeScript 6.
- SVG como superficie vectorial interactiva.
- Zustand para herramientas, selección e historial reversible.
- SQLite en WebAssembly mediante `sql.js`.
- ZIP como contenedor de proyectos y visores publicables.
- Vite para desarrollo, GitHub Pages y una compilación offline de un solo HTML.

No existe un servidor obligatorio. La aplicación completa puede ejecutarse desde GitHub Pages o descargarse para trabajar localmente sin conexión.

## Primera base funcional

- Lienzo completamente vacío, sin áreas, columnas ni fechas obligatorias.
- Zoom, desplazamiento, cuadrícula, ajuste y selección múltiple por recuadro.
- Entidades con título, subtítulo y valor visible, geometría, iconos y ficha interactiva.
- Conexiones dirigidas rectas, ortogonales o curvas, con grosor, patrón y gradiente.
- Acontecimientos, textos, áreas opcionales, referencias y fondos múltiples.
- Capas editables, bloqueables y ocultables.
- Eje Y inexistente, numérico, cronológico o categórico.
- Deshacer y rehacer hasta 80 estados.
- Catálogos de tipos y estados guardados dentro del proyecto.
- Confirmación antes de eliminaciones desde la interfaz.

## Formatos de salida

### Proyecto `.atlas.zip`

Incluye `manifest.json`, `project.json`, `project.sqlite` y los recursos incrustados. El mismo editor puede abrir el ZIP, el JSON o la base SQLite.

### Visor web

La opción **Visor web** genera un ZIP con un `index.html` autónomo y `data/project.json`. Puede publicarse directamente en GitHub Pages. Conserva zoom, desplazamiento y fichas interactivas sin incluir herramientas editoriales.

### Editor offline

Cada build produce `Atlas-Editor-offline.html`, con la aplicación completa en un solo archivo, y `Atlas-Editor-portable.zip`, acompañado de instrucciones y licencia.

## Desarrollo

Requiere Node.js 24 o posterior.

```bash
npm install
npm run dev
```

La validación completa se ejecuta con `npm run validate`: comprueba TypeScript, ejecuta las pruebas, genera la web, crea la versión offline y empaqueta la distribución portable.

## Publicación

La acción `.github/workflows/pages.yml` valida y publica automáticamente `main` en <https://alejandropico.github.io/Editor/>. También conserva la versión portable como artefacto descargable de GitHub Actions.
