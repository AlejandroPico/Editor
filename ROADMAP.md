# Posibles ampliaciones de Atlas Editor

Este documento ordena las mejoras por impacto sobre el objetivo principal: convertir Atlas Editor en una herramienta general para esquemas, investigaciones, mapas, infografías y documentos interactivos.

## Prioridad recomendada

1. **Componentes reutilizables y estilos globales.** Convertir una entidad, grupo o composición en componente; sus instancias heredan cambios y pueden conservar excepciones locales. Añadir estilos de texto, color, borde y conexión reutilizables.
2. **Auto-layout y restricciones.** Filas, columnas, rejillas, espaciado uniforme, alineación, distribución, anclajes, tamaños mínimo/máximo y contenedores que se adapten al contenido.
3. **Vinculación de datos.** Importar CSV, JSON y SQLite; mapear columnas a campos visuales; generar entidades y relaciones; actualizar el lienzo sin reconstruirlo manualmente.
4. **Grupos, marcos y secciones.** Agrupar objetos, entrar y salir de grupos, bloquearlos, plegarlos, aislarlos y exportar cada marco como página o vista independiente.
5. **Biblioteca de recursos.** Iconos SVG, imágenes, plantillas, paletas, tipografías, componentes y fragmentos reutilizables dentro del proyecto.

## Edición vectorial

- Herramienta pluma con nodos Bézier, edición de curvas, operaciones booleanas y trazos convertibles en formas.
- Más figuras paramétricas: polígonos, estrellas, arcos, llamadas, llaves, tablas, cronogramas y contenedores inteligentes.
- Guías, reglas libres, medidas, distancias, alineación magnética y ajuste a nodos, bordes, centros y puntos de conexión.
- Máscaras, recortes, desenfoques, sombras, degradados radiales y patrones.
- Edición por lotes desde selección múltiple, incluido renombrado y transformación de propiedades.

## Diagramas y conocimiento

- Auto-layout de grafos jerárquicos, radiales, orgánicos, Sankey, árboles, mapas mentales y redes de dependencias.
- Puertos de conexión configurables por entidad y reglas para elegir automáticamente el mejor puerto.
- Relaciones hiperbólicas, bucles, buses compartidos y agrupación visual de conexiones.
- Entidades plegables con niveles de detalle según zoom.
- Ontologías y validadores: campos obligatorios, tipos de relación permitidos y avisos de incoherencia.
- Buscador global, filtros, etiquetas, vistas guardadas y resaltado de rutas entre entidades.

## Investigación y documentación

- Texto enriquecido con Markdown, listas, tablas, código, fórmulas matemáticas y notas al pie.
- Gestor de fuentes con URL, autor, fecha, cita, archivo adjunto y relación entre evidencia y entidad.
- Comentarios y anotaciones editoriales separadas del contenido publicable.
- Panel de referencias cruzadas, objetos sin fuente, enlaces rotos y datos pendientes.
- Índices y leyendas automáticas generados a partir de tipos, colores y conexiones existentes.

## Datos y automatización

- Importadores CSV/Excel/JSON/GeoJSON/SQLite con asistente de mapeo.
- Tablas de datos editables conectadas al lienzo, similares a una pequeña hoja de cálculo.
- Campos calculados, fórmulas, reglas condicionales y estilos dependientes del valor.
- Macros grabables y consola TypeScript/JavaScript para automatizar cambios seguros.
- API de complementos para herramientas, importadores, exportadores y paneles propios.

## Mapas, gráficos e infografías

- Capas cartográficas SVG/GeoJSON, coordenadas geográficas, rutas y proyecciones básicas.
- Gráficos vinculados a datos: barras, líneas, áreas, dispersión, radar, Sankey y mapas de calor.
- Escalas de color, leyendas automáticas y anotaciones estadísticas.
- Plantillas para cronologías, rutas metabólicas, genealogías, eras geológicas, mapas históricos y arquitecturas de software.

## Publicación e interacción

- Constructor de interacciones sin código: clic, hover, filtro, cambio de vista, abrir ficha, mostrar capa y seguir recorrido.
- Modo presentación con páginas, transiciones, notas y navegación guiada.
- Vistas responsivas para escritorio, tableta y móvil dentro del mismo proyecto.
- Exportación por página o selección a SVG, PNG, PDF, HTML interactivo y paquete web.
- Temas de visor y controles de accesibilidad, teclado, contraste y lectura de pantalla.

## Seguridad y evolución del proyecto

- Historial persistente, puntos de restauración, comparación entre versiones y recuperación automática.
- Migraciones verificadas entre versiones del formato `.atlas.zip`.
- Informe de salud del proyecto antes de exportar: recursos ausentes, ciclos, referencias rotas y campos inválidos.
- Firma o checksum de recursos para detectar archivos modificados o incompletos.

## Colaboración futura

- Comentarios por objeto, menciones y tareas.
- Revisión con cambios propuestos y aceptación selectiva.
- Sincronización opcional mediante un servidor externo, manteniendo el funcionamiento local como capacidad principal.
