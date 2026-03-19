export interface WindowInfo {
  windowId: string;
  pid?: number;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BridgeConfig {
  port: number;
  token: string;
}

export type DisplayServer = 'x11' | 'wayland' | 'darwin' | 'unknown';

export type ImageFormat = 'png' | 'jpg';

export interface PlatformAdapter {
  findWindow(title: string): Promise<string>;
  captureWindow(windowId: string, format: ImageFormat): Promise<Buffer>;
  getWindowGeometry(windowId: string): Promise<WindowInfo>;
  getWindowName(windowId: string): Promise<string>;
  listWindows(): Promise<WindowInfo[]>;
}

export interface WindowListEntry extends WindowInfo {
  tauri: boolean;
  bridge?: BridgeConfig;
}

export interface RustLogEntry {
  timestamp: number;   // ms since UNIX epoch
  level: string;       // "trace" | "debug" | "info" | "warn" | "error"
  target: string;      // Rust module path, e.g. "myapp::db"
  message: string;
  source: string;      // "rust" | "sidecar:<name>"
}
