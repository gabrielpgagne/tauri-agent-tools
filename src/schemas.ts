/**
 * @deprecated Import from './schemas/bridge.js', './schemas/dom.js',
 * './schemas/commands.js', or './schemas/platform.js' instead.
 *
 * This file exists only for backward compatibility during migration
 * and will be removed once all consumers are updated.
 */

/** @deprecated Import from './schemas/bridge.js' instead. */
export {
  TokenFileSchema,
  type TokenFile,
  ElementRectSchema,
  type ElementRect,
  BridgeConfigSchema,
  type BridgeConfig,
  ViewportSizeSchema,
  type ViewportSize,
  RustLogLevelSchema,
  type RustLogLevel,
  RustLogEntrySchema,
  type RustLogEntry,
  BridgeEvalResponseSchema,
  BridgeLogsResponseSchema,
} from './schemas/bridge.js';

/** @deprecated Import from './schemas/dom.js' instead. */
export {
  DomNodeSchema,
  type DomNode,
  A11yNodeSchema,
  type A11yNode,
} from './schemas/dom.js';

/** @deprecated Import from './schemas/commands.js' instead. */
export {
  StorageEntrySchema,
  type StorageEntry,
  PageStateSchema,
  type PageState,
  ConsoleLevelSchema,
  type ConsoleLevel,
  ConsoleEntrySchema,
  type ConsoleEntry,
  MutationTypeSchema,
  type MutationType,
  MutationEntrySchema,
  type MutationEntry,
  IpcEntrySchema,
  type IpcEntry,
  SnapshotStorageResultSchema,
  type SnapshotStorageResult,
  ImageFormatSchema,
  type ImageFormat,
  StorageTypeSchema,
  type StorageType,
  DomModeSchema,
  type DomMode,
  PackageJsonSchema,
  type PackageJson,
} from './schemas/commands.js';

/** @deprecated Import from './schemas/platform.js' instead. */
export {
  WindowIdSchema,
  CGWindowInfoSchema,
  type CGWindowInfo,
  SwayNodeSchema,
  type SwayNode,
} from './schemas/platform.js';
