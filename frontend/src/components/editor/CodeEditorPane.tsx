import React, { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Lock } from 'lucide-react';
import type { OpenTab, WidgetNode } from '../../types/ide';
import { api } from '../../services/api';
import { useIdeStore } from '../../store/ideStore';
import { useDesignerStore } from '../../store/designerStore';

interface CodeEditorPaneProps {
  tab: OpenTab;
}

function detectLanguage(path: string): string {
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  return 'plaintext';
}

function flattenWidgets(node: WidgetNode | null, out: WidgetNode[] = []): WidgetNode[] {
  if (!node) return out;
  out.push(node);
  for (const child of node.children) {
    flattenWidgets(child, out);
  }
  return out;
}

let providerRegistered = false;

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({ tab }) => {
  const { updateCodeTabContent, saveActiveTab } = useIdeStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void saveActiveTab();
    });

    // Register NiceGUI & Active Form IntelliSense once
    if (!providerRegistered) {
      providerRegistered = true;
      monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.'],
        provideCompletionItems: async (
          model: { getValueInRange: (r: Record<string, number>) => string; getWordUntilPosition: (p: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number } },
          position: { lineNumber: number; column: number }
        ) => {
          const lineUntil = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const doc = useDesignerStore.getState().document;
          const widgets = flattenWidgets(doc?.root ?? null);

          // 1. `self.<widget>.` -> Live introspected NiceGUI 4.0 methods & properties
          const widgetMemberMatch = lineUntil.match(/self\.([a-zA-Z0-9_]+)\.[a-zA-Z0-9_]*$/);
          if (widgetMemberMatch) {
            const wName = widgetMemberMatch[1];
            const found = widgets.find((w) => w.name === wName);
            if (found) {
              try {
                const liveMethods = await api.getWidgetMethods(found.type);
                if (liveMethods.length > 0) {
                  return {
                    suggestions: liveMethods.map((m) => ({
                      label: m.isProperty ? m.name : `${m.name}${m.signature}`,
                      kind: m.isProperty
                        ? monaco.languages.CompletionItemKind.Property
                        : monaco.languages.CompletionItemKind.Method,
                      insertText: m.isProperty ? m.name : `${m.name}($0)`,
                      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                      sortText: `${m.isOwn ? '0' : '1'}_${m.name}`,
                      detail: `${m.isAsync ? 'async ' : ''}ui.${found.type}.${m.name}${m.signature}`,
                      documentation: m.doc || `Método de ui.${found.type}`,
                      range,
                    })),
                  };
                }
              } catch {
                // fallback below if backend unreachable
              }
            }
            const fallbackMethods = [
              { label: 'value', insertText: 'value', detail: 'Valor actual del control' },
              { label: 'set_value', insertText: 'set_value(${1:valor})', detail: 'Establece el valor' },
              { label: 'set_text', insertText: 'set_text(${1:"texto"})', detail: 'Cambia el texto' },
              { label: 'update', insertText: 'update()', detail: 'Actualiza el componente' },
            ];
            return {
              suggestions: fallbackMethods.map((m) => ({
                label: m.label,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: m.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: m.detail,
                documentation: m.detail,
                range,
              })),
            };
          }

          // 2. `self.` -> All widgets from active form
          if (/self\.[a-zA-Z0-9_]*$/.test(lineUntil)) {
            return {
              suggestions: widgets.map((w) => ({
                label: w.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: w.name,
                detail: `ui.${w.type} (control del formulario)`,
                documentation: `Control visual ${w.name} de tipo ui.${w.type}`,
                range,
              })),
            };
          }

          // 3. `ui.` -> Common NiceGUI helpers
          if (/\bui\.[a-zA-Z0-9_]*$/.test(lineUntil)) {
            const helpers = [
              { label: 'notify', insertText: 'notify(${1:"Mensaje"}, type=${2:"positive"})', detail: 'Muestra notificación toast' },
              { label: 'navigate.to', insertText: 'navigate.to(${1:"/ruta"})', detail: 'Navega a otra página/formulario' },
              { label: 'navigate.back', insertText: 'navigate.back()', detail: 'Vuelve a la página anterior' },
              { label: 'timer', insertText: 'timer(${1:1.0}, ${2:callback})', detail: 'Ejecuta callback periódicamente' },
              { label: 'dark_mode', insertText: 'dark_mode().toggle()', detail: 'Controla modo oscuro' },
              { label: 'download', insertText: 'download(${1:path})', detail: 'Descarga un archivo al navegador' },
              { label: 'dialog', insertText: 'dialog()', detail: 'Crea un diálogo modal' },
              { label: 'label', insertText: 'label(${1:"Texto"})', detail: 'Crea una etiqueta' },
              { label: 'button', insertText: 'button(${1:"Click"}, on_click=${2:handler})', detail: 'Crea un botón' },
            ];
            return {
              suggestions: helpers.map((h) => ({
                label: h.label,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: h.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: `NiceGUI ui.${h.label}`,
                documentation: h.detail,
                range,
              })),
            };
          }

          return { suggestions: [] };
        },
      });
    }

    if (tab.jumpToLine) {
      editor.revealLineInCenter(tab.jumpToLine);
      editor.setPosition({ lineNumber: tab.jumpToLine, column: 1 });
      editor.focus();
    }
  };

  useEffect(() => {
    if (editorRef.current && tab.jumpToLine) {
      editorRef.current.revealLineInCenter(tab.jumpToLine);
      editorRef.current.setPosition({ lineNumber: tab.jumpToLine, column: 1 });
      editorRef.current.focus();
    }
  }, [tab.jumpToLine, tab.id]);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {tab.isReadOnly && (
        <div className="px-3 py-1.5 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center gap-2 text-xs text-[#ce9178]">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Archivo autogenerado por el Diseñador Visual (solo lectura). Edita tu lógica en el archivo{' '}
            <code className="text-[#4fc1ff]">.py</code> correspondiente.
          </span>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor
          path={tab.path}
          language={detectLanguage(tab.path)}
          theme="vs-dark"
          value={tab.codeContent ?? ''}
          onChange={(val) => {
            if (!tab.isReadOnly && val !== undefined) {
              updateCodeTabContent(tab.id, val);
            }
          }}
          onMount={handleMount}
          options={{
            readOnly: Boolean(tab.isReadOnly),
            fontSize: 13,
            minimap: { enabled: true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            quickSuggestions: true,
          }}
        />
      </div>
    </div>
  );
};
