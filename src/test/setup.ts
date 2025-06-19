// Vitest setup file
import { beforeEach, afterEach, vi } from 'vitest';

// Mock VS Code API for testing
const mockVSCode = {
  window: {
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn()
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showInputBox: vi.fn(),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    })),
    activeTextEditor: null,
    visibleTextEditors: [],
    onDidChangeActiveTextEditor: vi.fn(),
    createTerminal: vi.fn(() => ({
      sendText: vi.fn(),
      dispose: vi.fn()
    })),
    activeTerminal: null,
    onDidChangeActiveTerminal: vi.fn(),
    onDidCloseTerminal: vi.fn()
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue?: unknown) => defaultValue),
      update: vi.fn(),
      inspect: vi.fn(() => ({ key: 'test' }))
    })),
    onDidChangeConfiguration: vi.fn(),
    onDidChangeTextDocument: vi.fn(),
    createFileSystemWatcher: vi.fn(() => ({
      onDidChange: vi.fn(),
      onDidCreate: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn()
    })),
    openTextDocument: vi.fn(),
    textDocuments: []
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  },
  extensions: {
    getExtension: vi.fn(() => ({
      isActive: true,
      activate: vi.fn()
    }))
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  }
};

// Mock the vscode module
vi.mock('vscode', () => mockVSCode);

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
}); 