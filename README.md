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
- Entidades con título, subtítulo y valor visible, ficha editorial completa, iconos y contenedor ocultable para que el SVG sustituya a la figura.
- Colocación libre o semántica mediante área, valor X, valor Y y correcciones manuales.
- Duraciones tipo histograma con inicio, final —vacío equivale al máximo/presente— y anchura editable.
- Conexiones dirigidas rectas, ortogonales o curvas, con origen/destino editables, rol, fuerza, confianza, puntos de paso, grosor, patrón y degradado multicolor.
- Acontecimientos libres o acotados a áreas y entidades concretas, textos, referencias y fondos múltiples.
- Capas editables, bloqueables y ocultables.
- Ejes X e Y generales independientes: inexistentes, numéricos, cronológicos o categóricos, con detalle adaptativo al zoom.
- Categorías libres, reordenables y con tamaño relativo configurable.
- Escalas numéricas por tramos: cada intervalo puede tener su propio paso y proporción visual para comprimir periodos dispersos y ampliar los densos.
- Áreas redimensionables con ocho tiradores, márgenes internos y cuatro modos por orientación: eje general, escala del proyecto local, eje propio o sin eje.
- Pan temporal con el botón central del ratón, independientemente de la herramienta activa.
- Separación automática de entidades coincidentes sin alterar sus valores semánticos.
- Separación de carriles temporales que considera toda la duración, no sólo el icono.
- Conexiones paralelas separadas automáticamente, con corrección manual, terminales, extremos planos/redondos/cuadrados y degradados de cualquier número de colores.
- Transparencia explícita en fondos, bordes, iconos, áreas, textos, acontecimientos, tablero, cuadrícula y colores de conexión.
- Migración directa de proyectos RELITree / Atlas Studio 4 y 5.
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
