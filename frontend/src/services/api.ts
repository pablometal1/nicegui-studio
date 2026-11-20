import type {
  ColumnDefinitionInput,
  DatabaseState,
  FileTreeItem,
  FormDocument,
  GenerateCrudResponse,
  ProjectSummary,
  RunnerStatus,
  RunTargetItem,
  TableRowsResponse,
  WidgetMethodInfo,
} from '../types/ide';

const widgetMethodsCache = new Map<string, WidgetMethodInfo[]>();

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<ProjectSummary[]>('/api/projects'),

  createProject: (name: string) =>
    request<ProjectSummary>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getProjectTree: (projectName: string) =>
    request<FileTreeItem[]>(`/api/projects/${encodeURIComponent(projectName)}/tree`),

  listRunTargets: (projectName: string) =>
    request<RunTargetItem[]>(`/api/projects/${encodeURIComponent(projectName)}/run-targets`),

  listFormTemplates: () =>
    request<
      Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        defaultRoute: string;
      }>
    >('/api/projects/form-templates'),

  createForm: (
    projectName: string,
    payload: {
      formName: string;
      route: string;
      template?: string;
      tableName?: string | null;
      gridType?: 'aggrid' | 'table';
    }
  ) =>
    request<{ formPath: string; designerPath: string; codeBehindPath: string; route?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/forms`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  readFile: (projectName: string, path: string) =>
    request<{ path: string; content: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files?path=${encodeURIComponent(path)}`
    ),

  saveFile: (projectName: string, relativePath: string, content: string) =>
    request<{ status: string; path: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files`,
      {
        method: 'PUT',
        body: JSON.stringify({ relativePath, content }),
      }
    ),

  createFile: (projectName: string, relativePath: string, content = '') =>
    request<{ status: string; path: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files`,
      {
        method: 'POST',
        body: JSON.stringify({ relativePath, content }),
      }
    ),

  deleteFile: (projectName: string, path: string) =>
    request<{ status: string; path: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files?path=${encodeURIComponent(path)}`,
      { method: 'DELETE' }
    ),

  renameFile: (projectName: string, oldPath: string, newPath: string) =>
    request<{ status: string; oldPath: string; newPath: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/rename`,
      {
        method: 'POST',
        body: JSON.stringify({ oldPath, newPath }),
      }
    ),

  createFolder: (projectName: string, relativePath: string) =>
    request<{ status: string; path: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/folder`,
      {
        method: 'POST',
        body: JSON.stringify({ relativePath }),
      }
    ),

  generateMasterMenu: (projectName: string, route = '/menu') =>
    request<{ formPath: string; designerPath: string; codeBehindPath: string; route: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/generate-menu?route=${encodeURIComponent(route)}`,
      { method: 'POST' }
    ),

  listPackages: () => request<Array<{ name: string; version: string }>>('/api/tools/packages'),

  installPackage: (pkg: string) =>
    request<{ ok: boolean; exitCode: number; stdout: string; stderr: string }>(
      '/api/tools/packages/install',
      {
        method: 'POST',
        body: JSON.stringify({ package: pkg }),
      }
    ),

  execTerminal: (projectName: string, command: string) =>
    request<{ exitCode: number; stdout: string; stderr: string }>('/api/tools/terminal/exec', {
      method: 'POST',
      body: JSON.stringify({ projectName, command }),
    }),

  getExportZipUrl: (projectName: string) =>
    `/api/tools/export/${encodeURIComponent(projectName)}/zip`,

  buildProjectExe: (payload: {
    projectName: string;
    appName: string;
    version: string;
    nativeWindow: boolean;
    windowWidth: number;
    windowHeight: number;
    oneFile: boolean;
    windowed: boolean;
    includeData: boolean;
  }) =>
    request<{
      ok: boolean;
      stdout: string;
      stderr: string;
      distDir: string;
      issPath: string;
      exePath: string | null;
    }>('/api/tools/package/build-exe', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  openFolder: (folderPath: string) =>
    request<{ status: string; path: string }>('/api/tools/package/open-folder', {
      method: 'POST',
      body: JSON.stringify({ folderPath }),
    }),

  getWidgetMethods: async (widgetType: string): Promise<WidgetMethodInfo[]> => {
    const cached = widgetMethodsCache.get(widgetType);
    if (cached) return cached;
    const data = await request<WidgetMethodInfo[]>(
      `/api/tools/widget-methods/${encodeURIComponent(widgetType)}`
    );
    widgetMethodsCache.set(widgetType, data);
    return data;
  },

  loadForm: (projectName: string, path: string) =>
    request<FormDocument>(
      `/api/projects/${encodeURIComponent(projectName)}/designer/form?path=${encodeURIComponent(path)}`
    ),

  saveForm: (projectName: string, relativePath: string, document: FormDocument) =>
    request<{
      formPath: string;
      designerPath: string;
      codeBehindPath: string;
      generatedCode: string;
    }>(`/api/projects/${encodeURIComponent(projectName)}/designer/form`, {
      method: 'PUT',
      body: JSON.stringify({ relativePath, document }),
    }),

  ensureEvent: (
    projectName: string,
    payload: {
      codeBehindPath: string;
      formName: string;
      handlerName: string;
      eventName: string;
    }
  ) =>
    request<{
      codeBehindPath: string;
      handlerName: string;
      lineNumber: number;
      created: boolean;
      content: string;
    }>(`/api/projects/${encodeURIComponent(projectName)}/designer/ensure-event`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  runnerStatus: () => request<RunnerStatus>('/api/runner/status'),

  runnerStart: (
    projectName: string,
    port?: number,
    entryFile?: string,
    route?: string,
    hotReload = true
  ) =>
    request<RunnerStatus>('/api/runner/start', {
      method: 'POST',
      body: JSON.stringify({ projectName, port, entryFile, route, hotReload }),
    }),

  runnerStop: () =>
    request<RunnerStatus>('/api/runner/stop', {
      method: 'POST',
    }),

  runnerRestart: () =>
    request<RunnerStatus>('/api/runner/restart', {
      method: 'POST',
    }),

  getDatabaseState: (projectName: string) =>
    request<DatabaseState>(`/api/projects/${encodeURIComponent(projectName)}/database`),

  connectDatabase: (projectName: string, connectionUrl: string) =>
    request<DatabaseState>(`/api/projects/${encodeURIComponent(projectName)}/database/connect`, {
      method: 'POST',
      body: JSON.stringify({ connectionUrl }),
    }),

  createSampleDatabase: (projectName: string) =>
    request<DatabaseState>(`/api/projects/${encodeURIComponent(projectName)}/database/sample`, {
      method: 'POST',
    }),

  createSqliteDatabase: (projectName: string, fileName: string, withSampleTables = false) =>
    request<DatabaseState>(
      `/api/projects/${encodeURIComponent(projectName)}/database/create-sqlite`,
      {
        method: 'POST',
        body: JSON.stringify({ fileName, withSampleTables }),
      }
    ),

  createTable: (projectName: string, tableName: string, columns: ColumnDefinitionInput[]) =>
    request<DatabaseState>(`/api/projects/${encodeURIComponent(projectName)}/database/tables`, {
      method: 'POST',
      body: JSON.stringify({ tableName, columns }),
    }),

  addColumn: (projectName: string, tableName: string, column: ColumnDefinitionInput) =>
    request<DatabaseState>(
      `/api/projects/${encodeURIComponent(projectName)}/database/tables/${encodeURIComponent(tableName)}/columns`,
      {
        method: 'POST',
        body: JSON.stringify({ column }),
      }
    ),

  dropTable: (projectName: string, tableName: string) =>
    request<DatabaseState>(
      `/api/projects/${encodeURIComponent(projectName)}/database/tables/${encodeURIComponent(tableName)}`,
      {
        method: 'DELETE',
      }
    ),

  getTableRows: (projectName: string, tableName: string, limit = 100) =>
    request<TableRowsResponse>(
      `/api/projects/${encodeURIComponent(projectName)}/database/tables/${encodeURIComponent(tableName)}/rows?limit=${limit}`
    ),

  generateCrud: (
    projectName: string,
    payload: { tableName: string; gridType: 'aggrid' | 'table'; formName?: string; route?: string }
  ) =>
    request<GenerateCrudResponse>(
      `/api/projects/${encodeURIComponent(projectName)}/database/generate-crud`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
};
