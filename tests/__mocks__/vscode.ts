/* Minimal VS Code API mock for Jest.
 *
 * Keep this intentionally small—add only what tests need.
 */

export const window = {
  showErrorMessage: async (_message: string) => undefined,
  showWarningMessage: async (_message: string) => undefined,
  showInformationMessage: async (_message: string) => undefined,
  showInputBox: async (_options?: any) => undefined,
  activeTextEditor: undefined as any,
};

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/workspace', path: '/workspace' } }],
  fs: {
    stat: async (_uri: any) => ({ type: 0 }),
    readFile: async (_uri: any) => Buffer.from(''),
    readDirectory: async (_uri: any) => [],
    writeFile: async (_uri: any, _content: Uint8Array) => undefined,
    delete: async (_uri: any, _options?: any) => undefined,
    createDirectory: async (_uri: any) => undefined,
  },
  createFileSystemWatcher: (_globOrPattern: any) => ({
    onDidCreate: (_cb: any) => undefined,
    onDidDelete: (_cb: any) => undefined,
    onDidChange: (_cb: any) => undefined,
    dispose: () => undefined,
  }),
  findFiles: async (_include: any, _exclude?: any) => [],
  getConfiguration: (_section?: string) => ({
    get: <T>(_: string, defaultValue?: T) => defaultValue as T,
  }),
};

export class Uri {
  static file(path: string) {
    return { fsPath: path, path };
  }
}

const _registeredCommands = new Map<string, (...args: any[]) => any>();

export const commands = {
  registerCommand: (command: string, callback: (...args: any[]) => any) => {
    _registeredCommands.set(command, callback);
    return { dispose: () => _registeredCommands.delete(command) };
  },
  executeCommand: async (_command: string, ..._args: any[]) => undefined,
  // test helper
  __getRegisteredCommand: (command: string) => _registeredCommands.get(command),
};

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
} as const;


