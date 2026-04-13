# React Component Atlas

A high-performance Rust-powered parser for analyzing React component usage in codebases.

## Features

- 🚀 **Fast**: Built with Rust and oxc_parser for blazing-fast parsing
- 🔍 **Comprehensive**: Extracts component imports, locations, and prop usage
- 🎯 **Accurate**: Uses the same parser as many popular build tools
- 📊 **Detailed Output**: JSON format with all component usage information

## Installation

```bash
npm install react-component-atlas
```

## Usage

### Parse a Single File

```typescript
import { parseFile } from 'react-component-atlas';
import * as fs from 'fs';

const sourceCode = fs.readFileSync('src/App.tsx', 'utf-8');
const result = parseFile('src/App.tsx', sourceCode);

console.log(result);
// {
//   imports: [
//     { 
//       name: 'Button', 
//       source: '@mui/material', 
//       isDefault: false, 
//       line: 1 
//     }
//   ],
//   usages: [
//     {
//       componentName: 'Button',
//       importSource: '@mui/material',  // Links to the import
//       location: { 
//         name: 'Button', 
//         filePath: 'src/App.tsx', 
//         line: 10, 
//         col: 0 
//       },
//       props: [
//         { name: 'variant', value: 'contained', line: 10 },
//         { name: 'color', value: 'primary', line: 10 }
//       ]
//     }
//   ]
// }
```

### Local Components

Components declared and used within the same file are tracked under a special `<local>` source:

```json
{
  "filePath": "App.tsx",
  "bySource": [
    {
      "source": "@mui/material",
      "components": [
        { "name": "Button", "importInfo": {...}, "usages": [...] }
      ]
    },
    {
      "source": "<local>",
      "components": [
        { "name": "CustomCard", "importInfo": {...}, "usages": [...] },
        { "name": "LocalButton", "importInfo": {...}, "usages": [...] }
      ]
    }
  ]
}
```

This allows you to:
- Track all component usage, both imported and local
- Analyze which components are reused vs. single-use
- Identify candidates for extraction to separate files

### Better Output Format (Grouped by Import)

For a more intuitive structure, group by import source:

```json
{
  "@mui/material": {
    "Button": {
      "import": { "name": "Button", "isDefault": false, "line": 1 },
      "usages": [
        {
          "location": { "line": 10, "col": 5 },
          "props": [
            { "name": "variant", "value": "contained" }
          ]
        }
      ]
    }
  },
  "./components/CustomButton": {
    "Button": {
      "import": { "name": "Button", "isDefault": true, "line": 2 },
      "usages": [
        {
          "location": { "line": 15, "col": 5 },
          "props": []
        }
      ]
    }
  }
}
```

This format clearly shows:
- Each import source
- Which components come from that source
- All usages of each component
- No ambiguity when the same component name is imported from different sources

### Parse an Entire Project

```typescript
import { parseProject } from 'react-component-atlas';

const atlasJson = parseProject('./my-react-app');
console.log(atlasJson);
```

### Configuration

Create an `atlas.config.json` file in your project root:

```json
{
  "include": ["src/**/*.tsx", "src/**/*.jsx"],
  "exclude": ["**/*.test.*", "**/node_modules/**"],
  "components": ["@mui/material", "react-router-dom"],
  "output": "component-atlas.json"
}
```

## API

### `parseFile(filePath: string, sourceCode: string): ParseResult`

Parse a single React file and extract component usage information.

**Parameters:**
- `filePath`: Path to the file (used for error reporting)
- `sourceCode`: The source code to parse

**Returns:** `ParseResult` object containing imports and component usages

### `parseProject(projectRoot: string, config?: AtlasConfig): string`

Parse an entire React project and generate a component atlas.

**Parameters:**
- `projectRoot`: Root directory of the project
- `config`: Optional configuration object

**Returns:** JSON string containing the complete component atlas

## Output Format

### Current Format (Flat)

```typescript
interface ParseResult {
  imports: ComponentImport[];
  usages: ComponentUsage[];
}

interface ComponentImport {
  name: string;
  source: string;
  isDefault: boolean;
  line: number;
}

interface ComponentUsage {
  componentName: string;
  importSource: string;      // NEW: Links usage to import source
  location: ComponentInfo;
  props: PropUsage[];
}

interface ComponentInfo {
  name: string;
  filePath: string;
  line: number;
  col: number;
}

interface PropUsage {
  name: string;
  value?: string;
  line: number;
}
```

### Planned Format (Grouped - v0.2.0)

```typescript
interface AtlasResult {
  [importSource: string]: {
    [componentName: string]: {
      import: ComponentImport;
      usages: ComponentUsageLocation[];
    }
  }
}

interface ComponentUsageLocation {
  location: { line: number; col: number };
  props: PropUsage[];
}
```

## Roadmap

- ✅ v0.1.0: Basic parsing with flat output
- 🔄 v0.2.0: Grouped output format with import-usage linking
- 📋 v0.3.0: Project-wide parsing
- 📋 v0.4.0: Configuration file support
- 📋 v0.5.0: CLI tool

## Development

This project uses:
- **Rust** with oxc_parser for fast, accurate parsing
- **napi-rs** for Node.js native bindings
- **TypeScript** for type-safe API

### Building from Source

```bash
# Install dependencies
npm install

# Build native module and TypeScript
npm run build

# Run tests
npm test
```

### Running Tests

```bash
# Run all tests
npm test

# Run Rust unit tests
cargo test --manifest-path native/Cargo.toml
```

## License

MIT
