# React Component Atlas - Examples

## Basic Usage

```typescript
import { parseFile, toSourceMap, toSourceObject } from 'react-component-atlas';
import * as fs from 'fs';

const sourceCode = fs.readFileSync('App.tsx', 'utf-8');
const result = parseFile('App.tsx', sourceCode);

console.log(result);
```

## Output Format

### Grouped by Import Source

```json
{
  "filePath": "src/App.tsx",
  "bySource": [
    {
      "source": "@mui/material",
      "components": [
        {
          "name": "Button",
          "importInfo": {
            "name": "Button",
            "isDefault": false,
            "line": 1
          },
          "usages": [
            {
              "line": 15,
              "col": 0,
              "props": [
                { "name": "variant", "value": "contained", "line": 15 },
                { "name": "color", "value": "primary", "line": 15 }
              ]
            },
            {
              "line": 20,
              "col": 0,
              "props": [
                { "name": "variant", "value": "outlined", "line": 20 }
              ]
            }
          ]
        },
        {
          "name": "TextField",
          "importInfo": {
            "name": "TextField",
            "isDefault": false,
            "line": 1
          },
          "usages": []
        }
      ]
    },
    {
      "source": "./components/CustomButton",
      "components": [
        {
          "name": "CustomButton",
          "importInfo": {
            "name": "CustomButton",
            "isDefault": true,
            "line": 2
          },
          "usages": [
            {
              "line": 25,
              "col": 0,
              "props": []
            }
          ]
        }
      ]
    }
  ]
}
```

## Working with the Data

### Access by Import Source

```typescript
const result = parseFile('App.tsx', sourceCode);

// Find MUI components
const muiSource = result.bySource.find(s => s.source === '@mui/material');

if (muiSource) {
  console.log(`Found ${muiSource.components.length} MUI components`);

  // Check Button usage
  const button = muiSource.components.find(c => c.name === 'Button');
  if (button) {
    console.log(`Button used ${button.usages.length} times`);

    button.usages.forEach((usage, i) => {
      console.log(`  Usage ${i + 1} at line ${usage.line}:`);
      usage.props.forEach(prop => {
        console.log(`    - ${prop.name}: ${prop.value}`);
      });
    });
  }
}
```

### Using Helper Functions

#### Convert to Map

```typescript
import { parseFile, toSourceMap } from 'react-component-atlas';

const result = parseFile('App.tsx', sourceCode);
const sourceMap = toSourceMap(result);

// Easy access via Map methods
const muiComponents = sourceMap.get('@mui/material');
const button = muiComponents?.get('Button');

if (button) {
  console.log(`Button import: line ${button.importInfo.line}`);
  console.log(`Button usages: ${button.usages.length}`);
}
```

#### Convert to Plain Object

```typescript
import { parseFile, toSourceObject } from 'react-component-atlas';

const result = parseFile('App.tsx', sourceCode);
const obj = toSourceObject(result);

// Direct property access
console.log(obj['@mui/material'].Button.usages.length);
console.log(obj['./components/CustomButton'].CustomButton.usages.length);

// Easy JSON serialization
fs.writeFileSync('component-atlas.json', JSON.stringify(obj, null, 2));
```

## Handling Name Collisions

The grouped format handles same-name components from different sources:

```typescript
const code = `
  import { Button } from '@mui/material';
  import { Button as CustomButton } from './components';

  function App() {
    return (
      <div>
        <Button>MUI</Button>
        <CustomButton>Custom</CustomButton>
      </div>
    );
  }
`;

const result = parseFile('test.tsx', code);

// MUI Button
const muiButton = result.bySource
  .find(s => s.source === '@mui/material')
  ?.components.find(c => c.name === 'Button');

console.log(`MUI Button usages: ${muiButton?.usages.length}`); // 1

// Custom Button
const customButton = result.bySource
  .find(s => s.source === './components')
  ?.components.find(c => c.name === 'CustomButton');

console.log(`Custom Button usages: ${customButton?.usages.length}`); // 1
```

## Working with Local Components

Local components (defined and used in the same file) are tracked under the `<local>` source:

```typescript
const code = `
  import { Box } from '@mui/material';

  function LocalCard() {
    return <div className="card">Card</div>;
  }

  function LocalButton({ children }) {
    return <button>{children}</button>;
  }

  function App() {
    return (
      <Box>
        <LocalCard />
        <LocalButton>Click</LocalButton>
      </Box>
    );
  }
`;

const result = parseFile('App.tsx', code);

// Find local components
const localSource = result.bySource.find(s => s.source === '<local>');

if (localSource) {
  console.log('Local components:');
  localSource.components.forEach(component => {
    console.log(`  - ${component.name}: ${component.usages.length} usage(s)`);
  });
}

// Identify reusable components (used multiple times)
const reusable = localSource?.components.filter(c => c.usages.length > 1) || [];
console.log(`\nComponents used multiple times (consider extracting):`);
reusable.forEach(c => console.log(`  - ${c.name}`));
```

## Analyzing Unused Imports

```typescript
const result = parseFile('App.tsx', sourceCode);

for (const source of result.bySource) {
  const unused = source.components.filter(c => c.usages.length === 0);

  if (unused.length > 0) {
    console.log(`\nUnused imports from ${source.source}:`);
    unused.forEach(c => {
      console.log(`  - ${c.name} (line ${c.importInfo.line})`);
    });
  }
}
```

## Generating Reports

```typescript
import { parseFile } from 'react-component-atlas';
import * as fs from 'fs';
import * as path from 'path';

function analyzeProject(srcDir: string) {
  const report: Record<string, any> = {};

  // Find all TSX/JSX files
  const files = findFiles(srcDir, ['.tsx', '.jsx']);

  for (const file of files) {
    const sourceCode = fs.readFileSync(file, 'utf-8');
    const result = parseFile(file, sourceCode);

    // Aggregate by component library
    for (const source of result.bySource) {
      if (!report[source.source]) {
        report[source.source] = {
          totalFiles: 0,
          components: {}
        };
      }

      report[source.source].totalFiles++;

      for (const component of source.components) {
        if (!report[source.source].components[component.name]) {
          report[source.source].components[component.name] = {
            files: [],
            totalUsages: 0
          };
        }

        report[source.source].components[component.name].files.push(file);
        report[source.source].components[component.name].totalUsages += component.usages.length;
      }
    }
  }

  return report;
}

// Example output:
// {
//   "@mui/material": {
//     "totalFiles": 12,
//     "components": {
//       "Button": { "files": ["Home.tsx", "Dashboard.tsx"], "totalUsages": 5 },
//       "TextField": { "files": ["Profile.tsx"], "totalUsages": 4 }
//     }
//   }
// }
```

## Integration with Build Tools

```typescript
// Example: Webpack plugin to analyze components during build
import { parseFile } from 'react-component-atlas';

class ComponentAtlasPlugin {
  apply(compiler: any) {
    compiler.hooks.emit.tap('ComponentAtlasPlugin', (compilation: any) => {
      const atlas: Record<string, any> = {};

      for (const filename in compilation.assets) {
        if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
          const source = compilation.assets[filename].source();
          const result = parseFile(filename, source);

          // Store result
          atlas[filename] = result;
        }
      }

      // Emit atlas as a build artifact
      compilation.assets['component-atlas.json'] = {
        source: () => JSON.stringify(atlas, null, 2),
        size: () => JSON.stringify(atlas).length
      };
    });
  }
}
```
