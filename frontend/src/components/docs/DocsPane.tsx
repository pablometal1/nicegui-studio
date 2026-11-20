import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Search,
  Layers,
  Database,
  Link2,
  Palette,
  Play,
  Code2,
  Keyboard,
  FolderTree,
  LayoutTemplate,
  Navigation,
  Terminal,
  Package,
  HelpCircle,
} from 'lucide-react';
import {
  WIDGET_REGISTRY,
  getNiceGuiDocUrl,
  type WidgetCategory,
} from '../../registry/widgets';

const CATEGORIES: Array<'Todos' | WidgetCategory> = [
  'Todos',
  'Contenedores',
  'Básicos',
  'Entradas',
  'Datos',
  'Multimedia',
];

interface GuideChapter {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
}

const CHAPTERS: GuideChapter[] = [
  { id: 'arch', title: '1. Arquitectura Code-Behind', icon: Code2 },
  { id: 'projects', title: '2. Proyectos y Archivos', icon: FolderTree },
  { id: 'templates', title: '3. Formularios y Plantillas', icon: LayoutTemplate },
  { id: 'designer', title: '4. Diseñador Visual DnD', icon: Layers },
  { id: 'styles', title: '5. Estilos e Iconos', icon: Palette },
  { id: 'events', title: '6. Eventos e IntelliSense', icon: Code2 },
  { id: 'navigation', title: '7. Navegación y Menú App', icon: Navigation },
  { id: 'database', title: '8. Base de Datos y CRUD RAD', icon: Database },
  { id: 'db-binding', title: '9. Data Binding a BD', icon: Database },
  { id: 'reactive-bind', title: '10. Binding Properties (Bind)', icon: Link2 },
  { id: 'run-export', title: '11. Ejecutar, Terminal, Pip y Exportar', icon: Terminal },
  { id: 'shortcuts', title: '12. Atajos y Solución de Problemas', icon: Keyboard },
];

export const DocsPane: React.FC = () => {
  const [section, setSection] = useState<'guide' | 'widgets'>('guide');
  const [activeChapter, setActiveChapter] = useState<string>('arch');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'Todos' | WidgetCategory>('Todos');

  const q = query.trim().toLowerCase();
  const filteredWidgets = WIDGET_REGISTRY.filter((w) => {
    const matchesCat = catFilter === 'Todos' || w.category === catFilter;
    const matchesQ =
      !q ||
      w.label.toLowerCase().includes(q) ||
      w.type.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const scrollToChapter = (id: string) => {
    setActiveChapter(id);
    const el = document.getElementById(`doc-chapter-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden select-text">
      {/* Header */}
      <div className="px-5 py-3 bg-[#252526] border-b border-[#3e3e42] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#007acc]/20 border border-[#007acc] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#4fc1ff]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">
              Manual Completo de Quantum-RAD Studio
            </h1>
            <p className="text-[11px] text-[#9c9c9c]">
              Guía detallada paso a paso de cada herramienta del IDE y enlaces oficiales a los {WIDGET_REGISTRY.length} widgets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#1e1e1e] p-1 rounded border border-[#3e3e42]">
          <button
            type="button"
            onClick={() => setSection('guide')}
            className={`px-3 py-1 text-xs rounded transition ${
              section === 'guide'
                ? 'bg-[#007acc] text-white font-medium'
                : 'text-[#cccccc] hover:text-white'
            }`}
          >
            Guía Detallada del IDE
          </button>
          <button
            type="button"
            onClick={() => setSection('widgets')}
            className={`px-3 py-1 text-xs rounded transition ${
              section === 'widgets'
                ? 'bg-[#007acc] text-white font-medium'
                : 'text-[#cccccc] hover:text-white'
            }`}
          >
            Catálogo de Widgets ({WIDGET_REGISTRY.length})
          </button>
        </div>
      </div>

      {/* Body */}
      {section === 'guide' ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Index Sidebar */}
          <nav className="w-60 bg-[#222225] border-r border-[#3e3e42] overflow-y-auto p-2.5 space-y-0.5 shrink-0 hidden md:block">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8c8c8c] px-2 pb-1.5">
              Índice de Contenidos
            </div>
            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              const active = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => scrollToChapter(ch.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] transition ${
                    active
                      ? 'bg-[#094771] text-white font-medium'
                      : 'text-[#bbbbbb] hover:bg-[#2a2d2e] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#4fc1ff] shrink-0" />
                  <span className="truncate">{ch.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Detailed Guide Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6 pb-10">
              {/* 1. ARQUITECTURA CODE-BEHIND */}
              <section
                id="doc-chapter-arch"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#4fc1ff]" />
                  1. Arquitectura Code-Behind (al estilo Visual Studio)
                </h2>
                <p className="text-xs text-[#cccccc] leading-relaxed">
                  Quantum-RAD Studio separa el <strong>diseño visual</strong> de tu <strong>lógica en Python</strong> para que puedas modificar la interfaz arrastrando controles en cualquier momento sin perder nunca el código que escribiste. Cada formulario dentro de <code className="text-[#4fc1ff]">forms/</code> consta de 3 archivos:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded bg-[#1e1e1e] border border-[#3e3e42] space-y-1">
                    <div className="font-mono text-[#c586c0] font-semibold">mi_form.ngui.json</div>
                    <p className="text-[11px] text-[#a0a0a0]">
                      Guarda el árbol de controles, propiedades, estilos Tailwind/Quasar, eventos y bindings. Se edita desde el <strong>Diseñador Visual</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-[#1e1e1e] border border-[#3e3e42] space-y-1">
                    <div className="font-mono text-[#9c9c9c] font-semibold">mi_form_designer.py</div>
                    <p className="text-[11px] text-[#a0a0a0]">
                      <strong>Autogenerado (solo lectura)</strong> al guardar con <code className="text-[#4fc1ff]">Ctrl+S</code>. Crea la clase <code className="text-[#9cdcfe]">MiFormDesigner</code> y todos los controles como <code className="text-[#9cdcfe]">self.btn_...</code>.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-[#1e1e1e] border border-[#3e3e42] space-y-1">
                    <div className="font-mono text-[#4fc1ff] font-semibold">mi_form.py</div>
                    <p className="text-[11px] text-[#a0a0a0]">
                      <strong>Tu archivo editable</strong>. Hereda de <code className="text-[#9cdcfe]">MiFormDesigner</code> y contiene tus métodos de eventos y lógica. El IDE nunca sobrescribe tus cambios.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[#9c9c9c]">
                  En la esquina superior derecha del área central tienes 3 botones rápidos (<strong>Diseño</strong> | <strong>Código (.py)</strong> | <strong>Generado</strong>) para alternar instantáneamente entre los tres archivos del formulario activo.
                </p>
              </section>

              {/* 2. PROYECTOS Y ARCHIVOS */}
              <section
                id="doc-chapter-projects"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#dcb67a]" />
                  2. Gestión de Proyectos y Explorador de Soluciones
                </h2>
                <ul className="text-xs text-[#cccccc] list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Crear o cambiar proyecto</strong>: en la barra superior izquierda elige el proyecto activo desde el desplegable o pulsa <strong>+ Proyecto</strong> para generar uno nuevo en <code className="text-[#4fc1ff]">projects/&lt;nombre&gt;/</code> con <code className="text-[#9cdcfe]">main.py</code>, <code className="text-[#9cdcfe]">project.ngproj.json</code> y un formulario inicial.
                  </li>
                  <li>
                    <strong>Registro automático de páginas</strong>: <code className="text-[#9cdcfe]">main.py</code> importa automáticamente todos los archivos <code className="text-[#4fc1ff]">forms/*.py</code> que definan <code className="text-[#9cdcfe]">register_page()</code>, por lo que cada nuevo formulario queda disponible en su ruta sin configuración manual.
                  </li>
                  <li>
                    <strong>Operaciones de archivos</strong>: abre la pestaña <strong>Solución</strong> en el panel izquierdo. En la cabecera tienes botones para <strong>Nuevo archivo</strong>, <strong>Nueva carpeta</strong> y <strong>Recargar</strong>. Al pasar el cursor por cualquier archivo aparecen iconos para <strong>Renombrar</strong> y <strong>Eliminar</strong>.
                  </li>
                </ul>
              </section>

              {/* 3. FORMULARIOS Y PLANTILLAS */}
              <section
                id="doc-chapter-templates"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-[#c586c0]" />
                  3. Crear Formularios y Galería de Plantillas
                </h2>
                <p className="text-xs text-[#cccccc]">
                  Al pulsar <strong>+ Formulario</strong> en la barra superior se abre la galería con <strong>7 plantillas predefinidas</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    ['Formulario Común', 'Card con grid de 2 columnas, inputs, select, textarea, switch y botones Guardar/Limpiar con validación.'],
                    ['Tabla de Datos + CRUD', 'AG Grid o Table con botones Nuevo, Editar, Eliminar y Dialog Modal. Permite conectarse directo a una tabla de tu BD o usar datos en memoria.'],
                    ['Ventana Emergente (Modal)', 'Página con botón disparador y ui.dialog preconfigurado con campos y acciones Aceptar/Cancelar.'],
                    ['Dashboard KPIs + Gráfico', 'Grid de 3 tarjetas de métricas con badges, barra de progreso y gráfico Apache EChart.'],
                    ['Login / Acceso', 'Tarjeta centrada con avatar, usuario, contraseña con toggle de visibilidad, checkbox y validación.'],
                    ['Layout Header + Drawer', 'Barra superior con botón menú conectado a drawer.toggle(), menú lateral desplegable y footer.'],
                    ['Formulario en Blanco', 'Lienzo limpio (ui.column) listo para diseñar libremente desde cero.'],
                  ].map(([name, desc]) => (
                    <div key={name} className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                      <div className="font-semibold text-white">{name}</div>
                      <div className="text-[11px] text-[#9c9c9c] mt-0.5">{desc}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#9c9c9c]">
                  Define el <strong>Nombre de Clase</strong> (ej. <code className="text-[#9cdcfe]">ClientesForm</code>) y su <strong>Ruta</strong> (<code className="text-[#4fc1ff]">/clientes</code>). Luego podrás cambiar el título, ruta o modo oscuro seleccionando el fondo raíz del formulario en el diseñador.
                </p>
              </section>

              {/* 4. DISEÑADOR VISUAL */}
              <section
                id="doc-chapter-designer"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4fc1ff]" />
                  4. Diseñador Visual Drag & Drop
                </h2>
                <ul className="text-xs text-[#cccccc] list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Dos formas de agregar controles</strong>: (1) <strong>Arrastra</strong> desde el Toolbox y suelta sobre el lienzo o dentro de cualquier contenedor (<code className="text-[#9cdcfe]">grid</code>, <code className="text-[#9cdcfe]">card</code>, <code className="text-[#9cdcfe]">row</code>, <code className="text-[#9cdcfe]">column</code>, <code className="text-[#9cdcfe]">dialog</code>, <code className="text-[#9cdcfe]">expansion</code>, <code className="text-[#9cdcfe]">header</code>, <code className="text-[#9cdcfe]">left_drawer</code>); o (2) haz clic en el contenedor destino y pulsa el botón <strong>+</strong> al pasar por un widget en el Toolbox.
                  </li>
                  <li>
                    <strong>Barra flotante de selección</strong>: al seleccionar un control aparece una barra azul arriba con su nombre Python y botones para <strong>arrastrar a otro contenedor</strong>, <strong>Subir / Bajar</strong> orden, <strong>Duplicar</strong> y <strong>Eliminar</strong>.
                  </li>
                  <li>
                    <strong>Esquema del Documento (Outline)</strong>: en la parte inferior derecha muestra el árbol jerárquico completo del formulario. Es ideal para seleccionar contenedores anidados o controles dentro de un <code className="text-[#9cdcfe]">ui.dialog</code>.
                  </li>
                  <li>
                    <strong>Deshacer/Rehacer y Copiar/Pegar</strong>: historial de hasta 50 cambios con <code className="text-[#4fc1ff]">Ctrl+Z</code> / <code className="text-[#4fc1ff]">Ctrl+Y</code>, y clonado rápido de controles (o contenedores enteros con sus hijos) con <code className="text-[#4fc1ff]">Ctrl+C</code> / <code className="text-[#4fc1ff]">Ctrl+V</code>.
                  </li>
                  <li>
                    <strong>Vistas responsivas y paneles redimensionables</strong>: usa los iconos de Escritorio / Tablet / Móvil en la barra superior para previsualizar el diseño, y arrastra los bordes de los paneles laterales o del panel inferior para ajustar tu espacio de trabajo.
                  </li>
                </ul>
              </section>

              {/* 5. ESTILOS E ICONOS */}
              <section
                id="doc-chapter-styles"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  5. Inspector de Estilos (Tailwind, Quasar, CSS) y Selector de Iconos
                </h2>
                <ul className="text-xs text-[#cccccc] list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Sub-pestaña Tailwind (<code>.classes()</code>)</strong>: incluye buscador y 6 secciones desplegables (<em>Layout</em>, <em>Dimensiones</em>, <em>Espaciado</em>, <em>Tipografía</em>, <em>Fondo y Bordes</em>, <em>Efectos</em>). Al elegir un valor (ej. cambiar <code className="text-[#9cdcfe]">p-4</code> por <code className="text-[#9cdcfe]">p-6</code>), el editor reemplaza la clase anterior sin duplicarla. También puedes editar el texto crudo directamente.
                  </li>
                  <li>
                    <strong>Sub-pestaña Quasar (<code>.props()</code>)</strong>: adapta las opciones al tipo de control seleccionado. Por ejemplo, en botones ofrece <code className="text-[#9cdcfe]">outline</code>, <code className="text-[#9cdcfe]">flat</code>, <code className="text-[#9cdcfe]">unelevated</code>, <code className="text-[#9cdcfe]">rounded</code>, <code className="text-[#9cdcfe]">no-caps</code>, <code className="text-[#9cdcfe]">loading</code>; en inputs ofrece <code className="text-[#9cdcfe]">outlined</code>, <code className="text-[#9cdcfe]">filled</code>, <code className="text-[#9cdcfe]">dense</code>, <code className="text-[#9cdcfe]">clearable</code>, <code className="text-[#9cdcfe]">hint</code>, <code className="text-[#9cdcfe]">prefix</code> y <code className="text-[#9cdcfe]">suffix</code>.
                  </li>
                  <li>
                    <strong>Sub-pestaña CSS (<code>.style()</code>)</strong>: permite agregar reglas clave-valor (ej. <code className="text-[#ce9178]">min-height: 200px</code>) con autocompletado y vista previa inmediata en el lienzo.
                  </li>
                  <li>
                    <strong>Selector Visual de Iconos</strong>: en cualquier control con propiedad <strong>Icono</strong> (<code className="text-[#9cdcfe]">button</code>, <code className="text-[#9cdcfe]">icon</code>, <code className="text-[#9cdcfe]">avatar</code>, <code className="text-[#9cdcfe]">chip</code>, <code className="text-[#9cdcfe]">fab</code>, <code className="text-[#9cdcfe]">rating</code>, <code className="text-[#9cdcfe]">expansion</code>), haz clic en el selector para explorar y buscar visualmente entre +120 Material Icons.
                  </li>
                </ul>
              </section>

              {/* 6. EVENTOS E INTELLISENSE */}
              <section
                id="doc-chapter-events"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#4fc1ff]" />
                  6. Eventos, Código Python e IntelliSense en Monaco
                </h2>
                <ul className="text-xs text-[#cccccc] list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Crear un evento en 1 segundo</strong>: haz <strong>doble clic</strong> sobre un botón o control en el lienzo (o ve a la pestaña <strong>Eventos → Ir al código</strong>). El backend analiza tu archivo <code className="text-[#4fc1ff]">.py</code> con el parser AST de Python, crea el método si no existe (sin tocar tu resto de código) y posiciona el cursor en Monaco justo en esa línea.
                  </li>
                  <li>
                    <strong>IntelliSense contextual</strong>:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-[#a0a0a0]">
                      <li>Escribe <code className="text-[#9cdcfe]">self.</code> → lista todos los controles del formulario activo con su tipo NiceGUI.</li>
                      <li>Escribe <code className="text-[#9cdcfe]">self.mi_control.</code> → sugiere sus métodos específicos (<code className="text-[#9cdcfe]">.value</code>, <code className="text-[#9cdcfe]">.set_text()</code>, <code className="text-[#9cdcfe]">.open()</code>, <code className="text-[#9cdcfe]">.get_selected_row()</code>, <code className="text-[#9cdcfe]">.update()</code>).</li>
                      <li>Escribe <code className="text-[#9cdcfe]">ui.</code> → sugiere snippets de <code className="text-[#9cdcfe]">ui.notify</code>, <code className="text-[#9cdcfe]">ui.navigate.to</code>, <code className="text-[#9cdcfe]">ui.timer</code>, etc.</li>
                    </ul>
                  </li>
                </ul>
                <pre className="p-3 rounded bg-[#141416] border border-[#3e3e42] text-[11px] font-mono text-[#9cdcfe] overflow-x-auto">
{`def on_btn_saludar_click(self, e=None) -> None:
    nombre = (self.inp_nombre.value or "Mundo").strip()
    self.lbl_resultado.set_text(f"¡Hola, {nombre}!")
    ui.notify("Saludo enviado", type="positive")`}
                </pre>
              </section>

              {/* 7. NAVEGACIÓN Y MENÚ APP */}
              <section
                id="doc-chapter-navigation"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#4fc1ff]" />
                  7. Navegación sin Código y Menú Principal Multi-pantalla
                </h2>
                <ul className="text-xs text-[#cccccc] list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Acción Rápida en Botones</strong>: selecciona cualquier <code className="text-[#9cdcfe]">ui.button</code> y en <strong>Props → Acción al hacer clic</strong> elige:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-[#a0a0a0]">
                      <li><em>Abrir formulario (misma pestaña)</em> → genera <code className="text-[#9cdcfe]">ui.navigate.to('/ruta')</code>.</li>
                      <li><em>Abrir formulario (nueva pestaña)</em> → genera <code className="text-[#9cdcfe]">ui.navigate.to('/ruta', new_tab=True)</code>.</li>
                      <li><em>Abrir Ventana Emergente (Dialog)</em> → lista los <code className="text-[#9cdcfe]">ui.dialog</code> de la pantalla actual y genera <code className="text-[#9cdcfe]">self.dlg_....open()</code>.</li>
                      <li><em>Volver atrás</em> → genera <code className="text-[#9cdcfe]">ui.navigate.back</code>.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Generador Menú App</strong>: pulsa el botón <strong>Menú App</strong> en la barra superior. El IDE escanea todos tus formularios y genera <code className="text-[#4fc1ff]">forms/app_menu.ngui.json</code> (ruta <code className="text-[#4fc1ff]">/menu</code>) con header, menú lateral desplegable y tarjetas de acceso directo a cada pantalla.
                  </li>
                </ul>
              </section>

              {/* 8. BASE DE DATOS Y CRUD RAD */}
              <section
                id="doc-chapter-database"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  8. Base de Datos SQLite, Editor Visual ER y Generador CRUD RAD
                </h2>
                <ol className="text-xs text-[#cccccc] list-decimal pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Conectar o crear una BD</strong>: abre la pestaña <strong>Datos</strong> en el panel izquierdo. Puedes pulsar <strong>DB Demo</strong> (crea <code className="text-[#4fc1ff]">data/app.db</code> con <code className="text-[#9cdcfe]">categorias</code>, <code className="text-[#9cdcfe]">productos</code> y <code className="text-[#9cdcfe]">clientes</code>), pegar una URL SQLAlchemy (<code className="text-[#ce9178]">postgresql://...</code>, <code className="text-[#ce9178]">mysql+pymysql://...</code>), o abrir el <strong>Editor Visual de BD</strong> y pulsar <strong>Nueva SQLite</strong> para crear tu propia base desde cero.
                  </li>
                  <li>
                    <strong>Diseñar tablas y relaciones visualmente</strong>: en el Editor Visual de BD pulsa <strong>+ Nueva Tabla</strong>. Agrega campos, elige tipos SQL (<code className="text-[#9cdcfe]">INTEGER</code>, <code className="text-[#9cdcfe]">VARCHAR</code>, <code className="text-[#9cdcfe]">TEXT</code>, <code className="text-[#9cdcfe]">REAL</code>, <code className="text-[#9cdcfe]">BOOLEAN</code>, <code className="text-[#9cdcfe]">DATE</code>), marca <code className="text-amber-400">PK</code> / <code className="text-[#4fc1ff]">Auto</code> / <code className="text-[#f48771]">Not Null</code> y selecciona una <strong>Relación (Foreign Key)</strong> hacia otra tabla. Verás el SQL DDL en vivo antes de confirmar.
                  </li>
                  <li>
                    <strong>Evolucionar tablas existentes</strong>: desde cada tarjeta ER puedes pulsar <strong>+ Agregar Campo / Relación</strong> (<code className="text-[#9cdcfe]">ALTER TABLE</code>), <strong>Ver Datos</strong> (explorador de registros) o <strong>Eliminar Tabla</strong>.
                  </li>
                  <li>
                    <strong>Generar CRUD completo en 1 clic</strong>: pulsa <strong>CRUD AG Grid</strong> o <strong>Table</strong>. El motor RAD crea <code className="text-[#4fc1ff]">data/db.py</code>, el formulario visual con grilla y modal de edición (mapeando cada tipo SQL a su widget NiceGUI, incluyendo <code className="text-[#9cdcfe]">ui.select</code> automático para llaves foráneas) y toda la lógica CRUD en Python lista para ejecutar.
                  </li>
                </ol>
              </section>

              {/* 9. DATA BINDING A BD */}
              <section
                id="doc-chapter-db-binding"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#4fc1ff]" />
                  9. Data Binding Automático a Base de Datos (11 Controles)
                </h2>
                <p className="text-xs text-[#cccccc]">
                  Sin generar un CRUD completo, puedes arrastrar cualquiera de estos controles a <strong>cualquier formulario</strong> y vincularlo a tu base de datos desde <strong>Inspector → Props → Data Binding (BD)</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Tablas: ui.table y ui.aggrid</div>
                    <p className="text-[11px] text-[#a0a0a0] mt-0.5">
                      Elige la tabla → rellena columnas y previsualiza filas reales en el lienzo; al ejecutar (F5) carga automáticamente con <code className="text-[#9cdcfe]">db.fetch_all()</code>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Gráficos: echart, highchart, plotly, uplot</div>
                    <p className="text-[11px] text-[#a0a0a0] mt-0.5">
                      Elige tabla, columna X (etiqueta), columna Y (valor numérico) y tipo (<code className="text-[#9cdcfe]">bar</code>, <code className="text-[#9cdcfe]">line</code>, <code className="text-[#9cdcfe]">pie</code>).
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Selección y Árbol: select, radio, toggle, tree</div>
                    <p className="text-[11px] text-[#a0a0a0] mt-0.5">
                      Elige tabla, columna ID/Valor y columna Texto para poblar opciones o nodos dinámicamente desde la BD.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Mapas: ui.leaflet</div>
                    <p className="text-[11px] text-[#a0a0a0] mt-0.5">
                      Elige tabla y columnas Latitud / Longitud para colocar marcadores (<code className="text-[#9cdcfe]">marker()</code>) automáticamente en el mapa.
                    </p>
                  </div>
                </div>
              </section>

              {/* 10. BINDING PROPERTIES REACTIVOS */}
              <section
                id="doc-chapter-reactive-bind"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#4fc1ff]" />
                  10. Binding Properties Reactivos (Pestaña Bind)
                </h2>
                <p className="text-xs text-[#cccccc] leading-relaxed">
                  Basado en el motor nativo <code className="text-[#9cdcfe]">nicegui.binding</code>, te permite sincronizar propiedades entre controles en tiempo real sin escribir manejadores <code className="text-[#9cdcfe]">on_change</code>:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Ejemplo 1 — Mostrar/ocultar una Card con un Switch (1-way)</div>
                    <div className="text-[11px] text-[#a0a0a0]">
                      Selecciona la <code className="text-[#9cdcfe]">card</code> → pestaña <strong>Bind</strong> → Propiedad: <code className="text-[#4fc1ff]">visibility</code> → Modo: <em>Desde otro control</em> → Origen: <code className="text-[#9cdcfe]">self.sw_mostrar.value</code>.
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Ejemplo 2 — Habilitar botón solo si hay texto (1-way con transformación)</div>
                    <div className="text-[11px] text-[#a0a0a0]">
                      Selecciona el <code className="text-[#9cdcfe]">button</code> → Propiedad: <code className="text-[#4fc1ff]">enabled</code> → Origen: <code className="text-[#9cdcfe]">self.inp_nombre.value</code> → Transformación: <code className="text-[#ce9178]">bool(v)</code>.
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333337]">
                    <div className="font-semibold text-white">Ejemplo 3 — Sincronizar Slider ↔ Number (2-way) y Persistir en Sesión</div>
                    <div className="text-[11px] text-[#a0a0a0]">
                      Usa modo <strong>Bidireccional (2-way)</strong> entre <code className="text-[#9cdcfe]">num_1.value</code> y <code className="text-[#9cdcfe]">sld_1.value</code>. O elige modo <strong>Persistir en app.storage.user</strong> para que el valor sobreviva a recargas del navegador.
                    </div>
                  </div>
                </div>
              </section>

              {/* 11. EJECUTAR, TERMINAL, PIP Y EXPORTAR */}
              <section
                id="doc-chapter-run-export"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  11. Ejecución (F5), Vista Previa, Terminal, Pip y Exportación
                </h2>
                <ul className="text-xs text-[#cccccc] list-disc pl-5 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Selector de Target + Ejecutar (F5)</strong>: en modo <strong>Auto</strong> detecta qué formulario o script estás editando, guarda automáticamente todos tus cambios, arranca NiceGUI y abre la <strong>Vista Previa</strong> en la ruta exacta (ej. <code className="text-[#4fc1ff]">/productos</code>). También puedes fijar manualmente cualquier formulario o script desde el desplegable.
                  </li>
                  <li>
                    <strong>Vista Previa en Vivo</strong>: embebida en el panel inferior con barra de ruta editable (ej. cambiar entre <code className="text-[#4fc1ff]">/</code>, <code className="text-[#4fc1ff]">/menu</code>, <code className="text-[#4fc1ff]">/productos</code>), botón de recarga y botón para abrir en pestaña externa del navegador.
                  </li>
                  <li>
                    <strong>Terminal integrada</strong>: ejecuta comandos dentro de la carpeta de tu proyecto usando automáticamente el entorno Python del IDE.
                  </li>
                  <li>
                    <strong>Gestor de Paquetes (pip)</strong>: lista todas las librerías instaladas y permite instalar nuevas (<code className="text-[#4fc1ff]">pandas</code>, <code className="text-[#4fc1ff]">matplotlib</code>, <code className="text-[#4fc1ff]">openpyxl</code>, <code className="text-[#4fc1ff]">psycopg2-binary</code>) con 1 clic.
                  </li>
                  <li>
                    <strong>Exportar (.zip / Docker / .exe Desktop)</strong>: pulsa <strong>Exportar</strong> en la barra superior para descargar un <code className="text-[#9cdcfe]">.zip</code> que incluye tu proyecto completo, <code className="text-[#9cdcfe]">requirements.txt</code>, <code className="text-[#9cdcfe]">Dockerfile</code>, <code className="text-[#9cdcfe]">run_desktop.py</code> (ventana nativa de escritorio con <code className="text-[#9cdcfe]">native=True</code>) y <code className="text-[#9cdcfe]">build_exe.bat</code> para compilar un ejecutable Windows con <code className="text-[#9cdcfe]">nicegui-pack</code>.
                  </li>
                </ul>
              </section>

              {/* 12. ATAJOS Y SOLUCIÓN DE PROBLEMAS */}
              <section
                id="doc-chapter-shortcuts"
                className="p-5 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-3"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#dcdcaa]" />
                  12. Atajos de Teclado y Consejos Útiles
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    ['Ctrl + S', 'Guardar todo y regenerar *_designer.py'],
                    ['F5', 'Ejecutar formulario o proyecto activo'],
                    ['Ctrl + Z / Y', 'Deshacer / Rehacer en el Diseñador'],
                    ['Ctrl + C / V', 'Copiar / Pegar control seleccionado'],
                    ['Supr / Backspace', 'Eliminar control seleccionado'],
                    ['Doble clic', 'Crear o abrir handler en .py'],
                  ].map(([k, desc]) => (
                    <div key={k} className="p-2 rounded bg-[#1e1e1e] border border-[#333337]">
                      <div className="font-mono text-[#4fc1ff] font-semibold">{k}</div>
                      <div className="text-[11px] text-[#9c9c9c]">{desc}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded bg-[#1e1e1e] border border-[#3e3e42] text-xs space-y-1.5">
                  <div className="font-semibold text-[#dcdcaa]">Consejos rápidos</div>
                  <ul className="list-disc pl-5 text-[11px] text-[#a0a0a0] space-y-1">
                    <li>En gráficos conectados a BD (<code className="text-[#9cdcfe]">echart</code>, <code className="text-[#9cdcfe]">plotly</code>, <code className="text-[#9cdcfe]">highchart</code>), selecciona siempre una columna numérica en el <strong>Eje Y</strong>.</li>
                    <li>Si usas <code className="text-[#9cdcfe]">ui.matplotlib</code>, <code className="text-[#9cdcfe]">ui.pyplot</code> o <code className="text-[#9cdcfe]">ui.altair</code>, recuerda instalar <code className="text-[#4fc1ff]">matplotlib</code> o <code className="text-[#4fc1ff]">altair</code> desde la pestaña <strong>Paquetes (pip)</strong>.</li>
                    <li>Los componentes de layout superior (<code className="text-[#9cdcfe]">header</code>, <code className="text-[#9cdcfe]">footer</code>, <code className="text-[#9cdcfe]">left_drawer</code>, <code className="text-[#9cdcfe]">right_drawer</code>) se ubican automáticamente al nivel raíz de la página al generar el código.</li>
                  </ul>
                </div>
              </section>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#094771]/40 border border-[#007acc]">
                <div className="flex items-center gap-2 text-xs text-white">
                  <Package className="w-4 h-4 text-[#4fc1ff]" />
                  <span>Consulta los enlaces directos a la documentación oficial de cada control:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSection('widgets')}
                  className="px-3 py-1.5 text-xs rounded bg-[#007acc] hover:bg-[#1a8ad4] text-white font-medium shrink-0"
                >
                  Ir al Catálogo ({WIDGET_REGISTRY.length} Widgets) →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Search & Category filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-[#888] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar widget (ej: aggrid, leaflet, button, dialog)..."
                  className="w-full bg-[#252526] text-xs text-white pl-8 pr-3 py-2 rounded border border-[#3e3e42] focus:outline-none focus:border-[#007acc]"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatFilter(cat)}
                    className={`px-2.5 py-1 text-xs rounded border transition ${
                      catFilter === cat
                        ? 'bg-[#007acc] border-[#007acc] text-white'
                        : 'bg-[#252526] border-[#3e3e42] text-[#cccccc] hover:border-[#666]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Widgets Cards Grid with Direct Links to Official NiceGUI Docs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWidgets.map((w) => {
                const docUrl = getNiceGuiDocUrl(w.type);
                return (
                  <div
                    key={w.type}
                    className="p-3 rounded-lg bg-[#252526] border border-[#3e3e42] hover:border-[#007acc]/70 transition flex flex-col justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{w.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2d2d30] text-[#9c9c9c]">
                          {w.category}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#4fc1ff]">ui.{w.type}()</div>
                      {w.propSchemas.length > 0 && (
                        <div className="text-[10px] text-[#9c9c9c] truncate">
                          Props: {w.propSchemas.map((p) => p.key).join(', ')}
                        </div>
                      )}
                      {w.events.length > 0 && (
                        <div className="text-[10px] text-[#dcdcaa] truncate">
                          Eventos: {w.events.map((e) => e.key).join(', ')}
                        </div>
                      )}
                    </div>

                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center justify-between px-2.5 py-1.5 rounded bg-[#1e1e1e] hover:bg-[#094771] border border-[#3e3e42] hover:border-[#007acc] text-[11px] text-[#4fc1ff] hover:text-white transition"
                    >
                      <span>Documentación oficial NiceGUI</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
