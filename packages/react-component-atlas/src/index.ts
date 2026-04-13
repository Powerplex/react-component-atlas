import { parseFile as nativeParseFile, parseProject as nativeParseProject } from '../native/index';

// Re-export the native types
export interface ImportInfo {
  name: string;
  isDefault: boolean;
  line: number;
}

export interface PropUsage {
  name: string;
  value?: string;
  line: number;
}

export interface UsageLocation {
  line: number;
  col: number;
  props: PropUsage[];
}

export interface ComponentData {
  name: string;
  importInfo: ImportInfo;
  usages: UsageLocation[];
}

export interface ImportSourceData {
  source: string;
  components: ComponentData[];
}

export interface ParseResult {
  filePath: string;
  bySource: ImportSourceData[];
}

export interface AtlasConfig {
  include?: string[];
  exclude?: string[];
  components?: string[];
}

/**
 * Parse a single React file and extract component usage information
 *
 * @param filePath - Path to the file to parse
 * @param sourceCode - Source code content
 * @returns Parse result grouped by import source
 *
 * @example
 * ```typescript
 * const result = parseFile('App.tsx', sourceCode);
 *
 * // Access by import source
 * const muiSource = result.bySource.find(s => s.source === '@mui/material');
 * if (muiSource) {
 *   const button = muiSource.components.find(c => c.name === 'Button');
 *   console.log(`Button used ${button.usages.length} times`);
 * }
 * ```
 */
export function parseFile(filePath: string, sourceCode: string): ParseResult {
  return nativeParseFile(filePath, sourceCode);
}

/**
 * Convert ParseResult to a more convenient Map structure
 *
 * @param result - The parse result from parseFile
 * @returns A Map where keys are import sources and values are Maps of component names to ComponentData
 *
 * @example
 * ```typescript
 * const result = parseFile('App.tsx', sourceCode);
 * const map = toSourceMap(result);
 *
 * const muiButton = map.get('@mui/material')?.get('Button');
 * console.log(muiButton?.usages.length);
 * ```
 */
export function toSourceMap(
  result: ParseResult
): Map<string, Map<string, ComponentData>> {
  const sourceMap = new Map<string, Map<string, ComponentData>>();

  for (const sourceData of result.bySource) {
    const componentMap = new Map<string, ComponentData>();
    for (const component of sourceData.components) {
      componentMap.set(component.name, component);
    }
    sourceMap.set(sourceData.source, componentMap);
  }

  return sourceMap;
}

/**
 * Convert ParseResult to a plain object structure for easier JSON serialization
 *
 * @param result - The parse result from parseFile
 * @returns A plain object where keys are import sources
 *
 * @example
 * ```typescript
 * const result = parseFile('App.tsx', sourceCode);
 * const obj = toSourceObject(result);
 *
 * console.log(obj['@mui/material'].Button.usages.length);
 * ```
 */
export function toSourceObject(result: ParseResult): Record<string, Record<string, ComponentData>> {
  const obj: Record<string, Record<string, ComponentData>> = {};

  for (const sourceData of result.bySource) {
    const components: Record<string, ComponentData> = {};
    for (const component of sourceData.components) {
      components[component.name] = component;
    }
    obj[sourceData.source] = components;
  }

  return obj;
}

/**
 * Parse an entire React project and generate a component atlas
 *
 * @param projectRoot - Root directory of the project
 * @param config - Optional configuration
 * @returns JSON string containing the complete component atlas
 */
export function parseProject(projectRoot: string, _config?: AtlasConfig): string {
  // For now, just call the native function
  // Later we'll add config support and JSON parsing
  return nativeParseProject(projectRoot);
}

export { nativeParseFile, nativeParseProject };

// Re-export project parsing utilities
export { parseProjectSync, generateReport } from './project';
