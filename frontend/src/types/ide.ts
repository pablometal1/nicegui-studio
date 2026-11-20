export interface WidgetBinding {
  id: string;
  property: string; // visibility | enabled | value | text | source | content | icon
  mode: 'from_control' | 'two_way' | 'storage_user';
  sourceControl: string;
  sourceProperty: string;
  storageKey: string;
  transform: string;
}

export interface WidgetNode {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
  classes: string;
  style: string;
  quasarProps: string;
  events: Record<string, string>;
  bindings?: WidgetBinding[];
  children: WidgetNode[];
}

export interface FormSettings {
  title: string;
  route: string;
  dark: boolean | null;
  rootClasses: string;
  pageBackground?: string;
  pageBackgroundImage?: string;
}

export interface FormDocument {
  schemaVersion: string;
  formName: string;
  settings: FormSettings;
  root: WidgetNode;
}

export interface ProjectSummary {
  name: string;
  path: string;
  entryPoint: string;
  port: number;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  kind: 'form' | 'designer' | 'python' | 'json' | 'other';
  children?: FileTreeItem[];
}

export interface RunTargetItem {
  id: string;
  label: string;
  kind: 'project' | 'form' | 'script';
  entryFile: string;
  route: string;
  formPath?: string | null;
}

export interface RunnerStatus {
  running: boolean;
  projectName: string | null;
  pid: number | null;
  port: number | null;
  entryFile?: string | null;
  route?: string | null;
  url: string | null;
}

export interface ConsoleLogEntry {
  id: string;
  stream: 'stdout' | 'stderr' | 'system';
  text: string;
  timestamp: string;
}

export interface OpenTab {
  id: string; // relative path
  path: string;
  title: string;
  mode: 'designer' | 'code' | 'database' | 'docs';
  isReadOnly?: boolean;
  isDirty?: boolean;
  codeContent?: string;
  jumpToLine?: number;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface ForeignKeyRef {
  referredTable: string;
  referredColumn: string;
}

export interface ColumnSchema {
  name: string;
  sqlType: string;
  widgetType: string;
  nullable: boolean;
  primaryKey: boolean;
  autoincrement: boolean;
  foreignKey: ForeignKeyRef | null;
}

export interface TableSchema {
  name: string;
  primaryKey: string | null;
  columns: ColumnSchema[];
}

export interface DatabaseState {
  connectionUrl: string | null;
  connected: boolean;
  error: string | null;
  tables: TableSchema[];
}

export interface GenerateCrudResponse {
  formPath: string;
  designerPath: string;
  codeBehindPath: string;
  dbModulePath: string;
  route: string;
}

export interface ColumnDefinitionInput {
  name: string;
  sqlType: string;
  nullable: boolean;
  primaryKey: boolean;
  autoincrement: boolean;
  defaultValue?: string;
  foreignKey?: ForeignKeyRef | null;
}

export interface TableRowsResponse {
  tableName: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export interface WidgetMethodInfo {
  name: string;
  signature: string;
  doc: string;
  isOwn: boolean;
  isAsync: boolean;
  isProperty: boolean;
}
