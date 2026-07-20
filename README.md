# Atlas Editor

Versión actual: **0.7.0**.

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
- Acontecimientos libres o vinculados a ejes, bandas, capítulos, áreas y entidades; trazo, remates, patrón y opacidad completamente editables.
- Textos vinculables a entidades, áreas, ejes y bandas, con anclaje que conserva la relación al mover o recalibrar el esquema.
- Inspector lateral ocultable mediante botón o `Mayús+I` para aprovechar todo el ancho del lienzo.
- Capas editables, bloqueables y ocultables.
- Ejes X e Y generales independientes: inexistentes, numéricos, cronológicos o categóricos, con detalle adaptativo al zoom.
- Capítulos y subcapítulos ilimitados dentro de cada eje: intervalos jerárquicos coloreables que funcionan como encabezados fijos de una hoja de cálculo (eón → era → período → época, por ejemplo).
- Los ejes propios de área también admiten subejes jerárquicos y el visor web conserva exactamente la navegación fija.
- Reglas X/Y permanentes y desactivables: permanecen pegadas al borde de la pantalla, reducen automáticamente valores solapados y permiten configurar tamaño y separación mínima.
- Categorías libres, reordenables, con tamaño relativo y banda de fondo coloreable/transparente en ambos ejes.
- Escalas numéricas por tramos: cada intervalo puede tener su propio paso, proporción visual, color y opacidad para comprimir periodos dispersos y ampliar los densos.
- Áreas redimensionables con ocho tiradores, márgenes internos y cuatro modos por orientación: eje general, escala del proyecto local, eje propio o sin eje.
- Áreas jerárquicas ilimitadas, con títulos configurables y migas de navegación; la regla visible cambia automáticamente al eje de la subárea más profunda.
- Pan temporal con el botón central del ratón, independientemente de la herramienta activa.
- Separación automática de entidades coincidentes sin alterar sus valores semánticos.
- Separación de carriles temporales que considera toda la duración, no sólo el icono.
- Conexiones paralelas separadas automáticamente, con corrección manual, terminales, extremos planos/redondos/cuadrados y degradados de cualquier número de colores.
- Transparencia explícita en fondos, bordes, iconos, áreas, textos, acontecimientos, tablero, cuadrícula y colores de conexión.
- Migración directa de proyectos RELITree / Atlas Studio 4 y 5.
- Deshacer y rehacer hasta 80 estados.
- Configuración del proyecto distribuida en pestañas, con edición y eliminación directa de áreas, orden/visibilidad/bloqueo de capas y ayuda contextual.
- Catálogos de tipos, estados, conexiones, roles, confianza y acontecimientos guardados dentro del proyecto.
- Esquema de entidades configurable: secciones y campos propios de texto, número, fecha, enlace, lista o sí/no; los valores aparecen en el inspector y en la ficha del visor.
- SQLite Studio interno con explorador de tablas y vistas, esquema, previsualización de filas, consola SQL y un historial de modificaciones reproducible.
- Confirmación antes de eliminaciones desde la interfaz.

## Formatos de salida

### Proyecto `.atlas.zip`

Incluye `manifest.json`, `project.json`, `project.sqlite`, `project.svg`, `database/custom.sql`, un visor web completo y los recursos incrustados. El mismo editor puede abrir el ZIP, el JSON o la base SQLite.

El botón **SQLite** abre el estudio de datos. Las consultas de lectura no alteran el proyecto; las sentencias de modificación validadas se guardan en orden y se reaplican al generar la base. Así se pueden mantener tablas, vistas, índices y datos auxiliares propios sin perderlos al volver a abrir el archivo.

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

Las ampliaciones candidatas y su prioridad están recogidas en [ROADMAP.md](ROADMAP.md).
