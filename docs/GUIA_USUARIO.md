# Guía de Usuario — NiceGUI Studio

**NiceGUI Studio** es un IDE visual para Python al estilo **Visual Studio** diseñado para crear aplicaciones web y de escritorio con **NiceGUI**, combinando un diseñador drag-and-drop, editor de código Monaco, editor visual de bases de datos SQLite/SQLAlchemy, generador RAD de CRUDs y Binding reactivo.

---

## 1. Arquitectura de Archivos (Patrón Code-Behind)

Cada formulario visual se guarda en `forms/` con 3 archivos sincronizados:

1. **`mi_form.ngui.json`** — Fuente de verdad del Diseñador Visual (árbol de controles, propiedades, estilos, eventos y bindings).
2. **`mi_form_designer.py`** — Código Python NiceGUI **autogenerado** cada vez que guardas (solo lectura). Define la clase base `MiFormDesigner` y crea cada control como atributo `self.btn_guardar`, `self.inp_nombre`, etc.
3. **`mi_form.py`** — Tu archivo Python editable (hereda de `MiFormDesigner`). Aquí escribes la lógica de negocio y los manejadores de eventos. El IDE **nunca sobrescribe** este archivo; al hacer **doble clic** sobre un control en el lienzo, crea automáticamente el método *stub* si no existe y abre Monaco en esa línea exacta.

---

## 2. Cómo usar las funciones principales del IDE

### Diseñador Visual y Plantillas
- **Arrastrar y soltar**: arrastra cualquier widget desde el **Toolbox** al lienzo o dentro de contenedores anidados (`card`, `grid`, `row`, `column`, `expansion`, `dialog`, `header`, `footer`, `left_drawer`, `right_drawer`). También puedes seleccionar un contenedor y pulsar **`+`** sobre cualquier widget del Toolbox.
- **Plantillas de Formularios**: pulsa **`+ Formulario`** en la barra superior para elegir entre 7 plantillas listas para ejecutar (*Formulario Común*, *Tabla de Datos + CRUD*, *Ventana Emergente Modal*, *Dashboard KPIs + Gráfico*, *Login*, *Layout Header + Drawer* o *En Blanco*).
- **Vistas responsivas**: cambia entre Escritorio, Tablet y Móvil desde la barra superior.
- **Menú Principal Multi-pantalla**: pulsa **Menú App** para generar automáticamente `/menu` con barra superior, menú lateral desplegable y tarjetas hacia todas las pantallas de tu proyecto.

### Inspector de Propiedades (4 pestañas)
1. **Props**: edita el nombre Python (`self.<nombre>`), propiedades del widget, **Selector Visual de Iconos** (+120 Material Icons), **Data Binding a BD** y **Acción Rápida en Botones** (abrir formulario en misma/nueva pestaña, abrir Dialog o volver atrás sin escribir código).
2. **Estilos**:
   - **Tailwind (`.classes()`)**: editor visual por secciones (Layout, Dimensiones, Espaciado, Tipografía, Fondo y Bordes, Efectos).
   - **Quasar (`.props()`)**: propiedades Quasar sensibles al widget seleccionado (`outlined`, `dense`, `flat`, `no-caps`, `clearable`, `hint`, etc.).
   - **CSS Inline (`.style()`)**: editor clave-valor con autocompletado.
3. **Eventos**: vincula `on_click`, `on_change`, `on_select`, etc. y pulsa **Ir al código** para generar/abrir el método en `*.py`.
4. **Bind (Binding Properties Reactivos)**:
   - **1-way (`← Desde otro control`)**: enlaza `visibility`, `enabled`, `value`, `text`, `source`, `content` o `icon` con transformación opcional (`not v`, `bool(v)`, `f'Valor: {v}'`, etc.).
   - **2-way (`↔ Bidireccional`)**: sincroniza dos controles en ambas direcciones (ej. `Slider` ↔ `Number`).
   - **Persistencia (`💾 app.storage.user`)**: guarda automáticamente el valor del control entre recargas de página.
- **Acceso rápido a Docs**: en la cabecera del Inspector, pulsa **`Docs ↗`** para abrir directamente la documentación oficial de NiceGUI del widget seleccionado.

### Base de Datos SQLite, Editor Visual ER y RAD CRUD
- Abre la pestaña **Datos** en el panel izquierdo:
  - Pulsa **DB Demo** para crear una SQLite con tablas relacionadas (`categorias`, `productos`, `clientes`), o conecta tu propia URL SQLAlchemy (`sqlite:///...`, `postgresql://...`, `mysql+pymysql://...`).
  - Pulsa **Abrir Editor Visual de BD** para crear bases SQLite nuevas, agregar tablas, columnas, tipos SQL, llaves primarias (`PK`), relaciones (`Foreign Keys`) y ver registros en vivo.
  - Pulsa **CRUD AG Grid** o **Table** en cualquier tabla para generar automáticamente el formulario visual + `data/db.py` + lógica completa de Crear/Editar/Eliminar.

### Data Binding Automático a Base de Datos
Los siguientes **11 widgets** pueden vincularse directamente a una tabla de tu BD desde **Inspector → Props**:
- **Tablas**: `ui.table`, `ui.aggrid`
- **Gráficos**: `ui.echart`, `ui.highchart`, `ui.plotly`, `ui.uplot`
- **Selección y Árbol**: `ui.select`, `ui.radio`, `ui.toggle`, `ui.tree`
- **Mapas**: `ui.leaflet` (marcadores automáticos desde columnas latitud/longitud)

### Ejecución, IntelliSense, Terminal, Pip y Exportación
- **Ejecutar (`F5`)**: el selector junto al botón **Ejecutar (F5)** en modo **Auto** detecta el formulario o script activo y abre la **Vista Previa en Vivo** directamente en su ruta.
- **IntelliSense en Monaco**: escribe `self.` para autocompletar todos los controles del formulario activo, `self.<control>.` para sus métodos NiceGUI y `ui.` para helpers.
- **Terminal y Paquetes (`pip`)**: en el panel inferior puedes ejecutar comandos dentro de tu proyecto e instalar librerías Python (`pandas`, `openpyxl`, `matplotlib`, `requests`, etc.).
- **Exportar (`.zip`)**: descarga tu proyecto listo para producción con `requirements.txt`, `Dockerfile`, `run_desktop.py` (app de escritorio `native=True`) y `build_exe.bat` (PyInstaller / `nicegui-pack`).

### Atajos de Teclado
| Atajo | Acción |
| :--- | :--- |
| `Ctrl + S` | Guardar todo y regenerar `*_designer.py` |
| `F5` | Ejecutar formulario o proyecto |
| `Ctrl + Z` / `Ctrl + Y` | Deshacer / Rehacer en el Diseñador |
| `Ctrl + C` / `Ctrl + V` | Copiar / Pegar control seleccionado |
| `Supr` / `Backspace` | Eliminar control seleccionado |
| `Doble clic` en control | Crear/abrir evento en el archivo `.py` |

---

## 3. Catálogo de Widgets y Enlaces a la Documentación Oficial de NiceGUI

### Contenedores y Layout (14)
| Widget | Constructor Python | Documentación Oficial |
| :--- | :--- | :--- |
| Column | `ui.column()` | https://nicegui.io/documentation/column |
| Row | `ui.row()` | https://nicegui.io/documentation/row |
| Card | `ui.card()` | https://nicegui.io/documentation/card |
| Grid | `ui.grid()` | https://nicegui.io/documentation/grid |
| Expansion | `ui.expansion()` | https://nicegui.io/documentation/expansion |
| Scroll Area | `ui.scroll_area()` | https://nicegui.io/documentation/scroll_area |
| Dialog (Modal) | `ui.dialog()` | https://nicegui.io/documentation/dialog |
| Header | `ui.header()` | https://nicegui.io/documentation/header |
| Footer | `ui.footer()` | https://nicegui.io/documentation/footer |
| Left Drawer | `ui.left_drawer()` | https://nicegui.io/documentation/left_drawer |
| Right Drawer | `ui.right_drawer()` | https://nicegui.io/documentation/right_drawer |
| Dropdown Button | `ui.dropdown_button()` | https://nicegui.io/documentation/dropdown_button |
| Button Group | `ui.button_group()` | https://nicegui.io/documentation/button_group |
| Floating Action Button (FAB) | `ui.fab()` | https://nicegui.io/documentation/fab |

### Básicos y Texto (12)
| Widget | Constructor Python | Documentación Oficial |
| :--- | :--- | :--- |
| Label | `ui.label()` | https://nicegui.io/documentation/label |
| Button | `ui.button()` | https://nicegui.io/documentation/button |
| Icon | `ui.icon()` | https://nicegui.io/documentation/icon |
| Badge | `ui.badge()` | https://nicegui.io/documentation/badge |
| Chip | `ui.chip()` | https://nicegui.io/documentation/chip |
| Link | `ui.link()` | https://nicegui.io/documentation/link |
| Avatar | `ui.avatar()` | https://nicegui.io/documentation/avatar |
| Markdown | `ui.markdown()` | https://nicegui.io/documentation/markdown |
| HTML | `ui.html()` | https://nicegui.io/documentation/html |
| Code Block | `ui.code()` | https://nicegui.io/documentation/code |
| Separator | `ui.separator()` | https://nicegui.io/documentation/separator |
| Space | `ui.space()` | https://nicegui.io/documentation/space |

### Entradas y Controles (24)
| Widget | Constructor Python | Documentación Oficial |
| :--- | :--- | :--- |
| Text Input | `ui.input()` | https://nicegui.io/documentation/input |
| Textarea | `ui.textarea()` | https://nicegui.io/documentation/textarea |
| Number | `ui.number()` | https://nicegui.io/documentation/number |
| Select | `ui.select()` | https://nicegui.io/documentation/select |
| Radio Group | `ui.radio()` | https://nicegui.io/documentation/radio |
| Toggle Buttons | `ui.toggle()` | https://nicegui.io/documentation/toggle |
| Checkbox | `ui.checkbox()` | https://nicegui.io/documentation/checkbox |
| Switch | `ui.switch()` | https://nicegui.io/documentation/switch |
| Slider | `ui.slider()` | https://nicegui.io/documentation/slider |
| Range Slider | `ui.range()` | https://nicegui.io/documentation/range |
| Knob | `ui.knob()` | https://nicegui.io/documentation/knob |
| Date Picker | `ui.date()` | https://nicegui.io/documentation/date |
| Time Picker | `ui.time()` | https://nicegui.io/documentation/time |
| Date Input | `ui.date_input()` | https://nicegui.io/documentation/date_input |
| Time Input | `ui.time_input()` | https://nicegui.io/documentation/time_input |
| Color Input | `ui.color_input()` | https://nicegui.io/documentation/color_input |
| Color Picker | `ui.color_picker()` | https://nicegui.io/documentation/color_picker |
| File Upload | `ui.upload()` | https://nicegui.io/documentation/upload |
| Rich Text Editor | `ui.editor()` | https://nicegui.io/documentation/editor |
| Input Chips | `ui.input_chips()` | https://nicegui.io/documentation/input_chips |
| Rating | `ui.rating()` | https://nicegui.io/documentation/rating |
| Joystick | `ui.joystick()` | https://nicegui.io/documentation/joystick |
| CodeMirror Editor | `ui.codemirror()` | https://nicegui.io/documentation/codemirror |
| Xterm Terminal | `ui.xterm()` | https://nicegui.io/documentation/xterm |

### Datos y Visualización (19)
| Widget | Constructor Python | Documentación Oficial |
| :--- | :--- | :--- |
| Table | `ui.table()` | https://nicegui.io/documentation/table |
| AG Grid | `ui.aggrid()` | https://nicegui.io/documentation/aggrid |
| Tree View | `ui.tree()` | https://nicegui.io/documentation/tree |
| JSON Editor | `ui.json_editor()` | https://nicegui.io/documentation/json_editor |
| Log Console | `ui.log()` | https://nicegui.io/documentation/log |
| Apache EChart | `ui.echart()` | https://nicegui.io/documentation/echart |
| Highcharts Chart | `ui.highchart()` | https://nicegui.io/documentation/highchart |
| uPlot | `ui.uplot()` | https://nicegui.io/documentation/uplot |
| Plotly Element | `ui.plotly()` | https://nicegui.io/documentation/plotly |
| Line Plot | `ui.line_plot()` | https://nicegui.io/documentation/line_plot |
| Pyplot Context | `ui.pyplot()` | https://nicegui.io/documentation/pyplot |
| Matplotlib | `ui.matplotlib()` | https://nicegui.io/documentation/matplotlib |
| Altair Chart | `ui.altair()` | https://nicegui.io/documentation/altair |
| AnyWidget | `ui.anywidget()` | https://nicegui.io/documentation/anywidget |
| Linear Progress | `ui.linear_progress()` | https://nicegui.io/documentation/linear_progress |
| Circular Progress | `ui.circular_progress()` | https://nicegui.io/documentation/circular_progress |
| Spinner | `ui.spinner()` | https://nicegui.io/documentation/spinner |
| 3D Scene (Three.js) | `ui.scene()` | https://nicegui.io/documentation/scene |
| Leaflet Map | `ui.leaflet()` | https://nicegui.io/documentation/leaflet |

### Multimedia y Navegación (7)
| Widget | Constructor Python | Documentación Oficial |
| :--- | :--- | :--- |
| Image | `ui.image()` | https://nicegui.io/documentation/image |
| Audio Player | `ui.audio()` | https://nicegui.io/documentation/audio |
| Video Player | `ui.video()` | https://nicegui.io/documentation/video |
| Carousel | `ui.carousel()` | https://nicegui.io/documentation/carousel |
| Pagination | `ui.pagination()` | https://nicegui.io/documentation/pagination |
| Timeline | `ui.timeline()` | https://nicegui.io/documentation/timeline |
| Chat Message | `ui.chat_message()` | https://nicegui.io/documentation/chat_message |
