import * as fs from 'fs';
import * as path from 'path';
import { parseFile, ParseResult, AtlasConfig } from './index';

interface ProjectAtlas {
  config: AtlasConfig;
  files: {
    [filePath: string]: ParseResult;
  };
  summary: {
    totalFiles: number;
    totalComponents: number;
    bySource: {
      [source: string]: {
        components: string[];
        totalUsages: number;
        files: string[];
      };
    };
  };
}

/**
 * Find all files matching the given patterns
 */
function findFiles(
  dir: string,
  include: string[],
  exclude: string[]
): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);

      // Check exclusions
      if (exclude.some(pattern => matchesPattern(relativePath, pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Check inclusions
        if (include.some(pattern => matchesPattern(relativePath, pattern))) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Simple glob pattern matching (supports **, *, and file extensions)
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Normalize paths
  const normalizedPath = filePath.replace(/\\/g, '/');
  let normalizedPattern = pattern.replace(/\\/g, '/');

  // Convert glob pattern to regex
  // Important: escape literal dots FIRST, before we add regex dots
  let regexPattern = normalizedPattern
    .replace(/\./g, '\\.')
    // Handle **/ as a unit (matches zero or more path segments)
    // Use placeholder to protect the * quantifier from later replacements
    .replace(/\*\*\//g, '___GLOBSTAR_SLASH___')
    // Handle /** as a unit (matches optional path)
    .replace(/\/\*\*/g, '___SLASH_GLOBSTAR___')
    // Replace remaining single * (matches filename without slashes)
    .replace(/\*/g, '[^/]*')
    // Now replace placeholders with actual regex patterns
    .replace(/___GLOBSTAR_SLASH___/g, '(?:(?:[^/]+/)*)')
    .replace(/___SLASH_GLOBSTAR___/g, '(?:/.*)?');

  regexPattern = `^${regexPattern}$`;

  const regex = new RegExp(regexPattern);
  return regex.test(normalizedPath);
}

/**
 * Load atlas.config.json from project directory
 */
function loadConfig(projectRoot: string): AtlasConfig {
  const configPath = path.join(projectRoot, 'atlas.config.json');

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  }

  // Default config
  return {
    include: ['src/**/*.tsx', 'src/**/*.jsx'],
    exclude: ['**/*.test.*', '**/node_modules/**', '**/dist/**'],
    components: [],
  };
}

/**
 * Parse all files in a project and generate a comprehensive atlas
 */
export function parseProjectSync(
  projectRoot: string,
  configOverride?: Partial<AtlasConfig>
): ProjectAtlas {
  const config = { ...loadConfig(projectRoot), ...configOverride };

  const include = config.include || ['src/**/*.tsx', 'src/**/*.jsx'];
  const exclude = config.exclude || ['**/*.test.*', '**/node_modules/**'];

  // Find all matching files
  const files = findFiles(projectRoot, include, exclude);

  console.log(`Found ${files.length} files to parse`);

  // Parse each file
  const results: { [filePath: string]: ParseResult } = {};
  const summary: ProjectAtlas['summary'] = {
    totalFiles: files.length,
    totalComponents: 0,
    bySource: {},
  };

  for (const filePath of files) {
    try {
      const sourceCode = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(projectRoot, filePath);
      const result = parseFile(relativePath, sourceCode);

      results[relativePath] = result;

      // Update summary
      for (const sourceData of result.bySource) {
        if (!summary.bySource[sourceData.source]) {
          summary.bySource[sourceData.source] = {
            components: [],
            totalUsages: 0,
            files: [],
          };
        }

        const sourceSummary = summary.bySource[sourceData.source];

        for (const component of sourceData.components) {
          // Add component if not already tracked
          if (!sourceSummary.components.includes(component.name)) {
            sourceSummary.components.push(component.name);
            summary.totalComponents++;
          }

          // Count usages
          sourceSummary.totalUsages += component.usages.length;
        }

        // Add file if not already tracked
        if (!sourceSummary.files.includes(relativePath)) {
          sourceSummary.files.push(relativePath);
        }
      }
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
    }
  }

  return {
    config,
    files: results,
    summary,
  };
}

/**
 * Generate a report from the project atlas
 */
export function generateReport(atlas: ProjectAtlas): string {
  const lines: string[] = [];

  lines.push('# React Component Atlas Report\n');
  lines.push(`**Total Files Analyzed:** ${atlas.summary.totalFiles}`);
  lines.push(`**Total Unique Components:** ${atlas.summary.totalComponents}\n`);

  lines.push('## Components by Source\n');

  for (const [source, data] of Object.entries(atlas.summary.bySource)) {
    lines.push(`### ${source}`);
    lines.push(`- **Components:** ${data.components.length}`);
    lines.push(`- **Total Usages:** ${data.totalUsages}`);
    lines.push(`- **Files:** ${data.files.length}`);
    lines.push('');

    // List components
    lines.push('**Components:**');
    for (const component of data.components.sort()) {
      lines.push(`  - ${component}`);
    }
    lines.push('');
  }

  // Top 10 most used components
  lines.push('## Most Used Components\n');

  const componentUsages: { component: string; source: string; usages: number }[] = [];

  for (const [filePath, result] of Object.entries(atlas.files)) {
    for (const sourceData of result.bySource) {
      for (const component of sourceData.components) {
        componentUsages.push({
          component: component.name,
          source: sourceData.source,
          usages: component.usages.length,
        });
      }
    }
  }

  const topComponents = componentUsages
    .sort((a, b) => b.usages - a.usages)
    .slice(0, 10);

  for (const { component, source, usages } of topComponents) {
    lines.push(`- **${component}** (${source}): ${usages} usage(s)`);
  }

  return lines.join('\n');
}
