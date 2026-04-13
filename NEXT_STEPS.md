# Next Steps for React Component Atlas

## ✅ Completed

1. **NX Monorepo Setup**: Initialized with TypeScript preset
2. **Demo React App**: Created in `apps/demo` with MUI components and routing
   - Home page with navigation
   - Dashboard with stats, cards, and tables
   - Profile page with forms and switches
3. **Parser Package**: Created in `packages/react-component-atlas`
   - Rust native module using oxc_parser
   - TypeScript API wrapper
   - NAPI-RS bindings for Node.js
4. **Rust Code Structure**:
   - `types.rs`: Shared type definitions
   - `parser.rs`: oxc_parser integration and file parsing
   - `analyzer.rs`: AST visitor for extracting component usage
   - `lib.rs`: NAPI bindings and type conversions
5. **Tests**:
   - ✅ 4 Rust unit tests passing
   - ✅ 6 Integration tests passing (parsing demo app)
6. **Build System**: Working native build with napi-rs

## 🔨 Suggested Refinements

### ✅ 1. Import-Usage Linking (COMPLETED - v0.2.0)
**Fixed!** The output format now groups components by import source, solving the ambiguity problem.

**New Format**:
```typescript
{
  filePath: "App.tsx",
  bySource: [
    {
      source: "@mui/material",
      components: [
        {
          name: "Button",
          importInfo: { line: 1, isDefault: false },
          usages: [{ line: 10, col: 0, props: [...] }]
        }
      ]
    }
  ]
}
```

Benefits:
- ✅ Clear link between imports and usages
- ✅ No ambiguity with same-name components from different sources
- ✅ Easy to analyze by library/source
- ✅ Helper functions: `toSourceMap()`, `toSourceObject()`

### 2. Improve Import Analysis
Currently, imports are simplified. Enhance `analyzer.rs` to properly extract:
- Named imports
- Default imports
- Namespace imports

```rust
// In analyzer.rs, enhance visit_import_declaration to properly iterate specifiers
```

### 2. Add More Rust Modules
Split the Rust code further for better organization:
- `native/src/visitors/` - Separate visitors (imports, jsx, props)
- `native/src/models/` - Data models
- `native/src/utils/` - Helper functions

### 3. Implement Project-Wide Parsing
Currently `parse_project` is a stub. Implement it to:
- Walk directory tree
- Filter files based on config
- Parse all matching files
- Aggregate results

### 4. Add CLI Tool
Create a CLI for easy usage:
```bash
npx react-component-atlas analyze ./src --output atlas.json
```

### 5. Enhance Prop Analysis
- Extract prop types (string literal vs expression vs object)
- Detect spread props
- Track prop defaults

### 6. Add More Tests
- Test edge cases (fragments, HOCs, render props)
- Test with different component libraries
- Performance benchmarks

### 7. CI/CD Setup
- Add GitHub Actions for:
  - Running Rust and JS tests
  - Building for multiple platforms
  - Publishing to npm

### 8. Documentation
- Add API docs with examples
- Create tutorial for common use cases
- Document the Rust codebase

## 🚀 How to Continue Development

### Adding a New Rust Module

1. Create the file in `native/src/`:
   ```bash
   touch packages/react-component-atlas/native/src/visitors/import_visitor.rs
   ```

2. Add to `lib.rs`:
   ```rust
   mod visitors {
       pub mod import_visitor;
   }
   ```

3. Add unit tests in the same file

4. Rebuild:
   ```bash
   npm run build:native
   ```

### Running the Parser on Demo App

```typescript
import { parseFile } from './packages/react-component-atlas/src';
import * as fs from 'fs';

const source = fs.readFileSync('./apps/demo/src/pages/Home.tsx', 'utf-8');
const result = parseFile('./apps/demo/src/pages/Home.tsx', source);

console.log(JSON.stringify(result, null, 2));
```

### Testing Workflow

```bash
# 1. Make changes to Rust code
# 2. Run Rust tests
cargo test --manifest-path packages/react-component-atlas/native/Cargo.toml

# 3. Rebuild native module
cd packages/react-component-atlas && npm run build:native

# 4. Run integration tests
npm test
```

## 📝 Notes

- The Rust code uses the visitor pattern from oxc_ast
- Native bindings are platform-specific (.darwin-arm64.node on your Mac)
- Integration tests use the demo app as fixtures - add more complex examples there to test edge cases
