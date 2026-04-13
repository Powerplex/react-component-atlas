# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-04-13

### Added

- **Local component tracking** - Components used in a file but not imported are now tracked under a special `<local>` source
- This allows complete component usage analysis including locally-defined components
- Helps identify reusable components that could be extracted

### Tests

- Added 2 new Rust unit tests for local component scenarios
- Added 2 new integration tests verifying local component tracking

## [0.2.0] - 2026-04-13

### 💥 Breaking Changes

- **Restructured output format** to group components by import source
  - Old format had separate `imports[]` and `usages[]` arrays with no connection
  - New format uses `bySource[]` array where each entry contains its source and components
  - This solves the fundamental issue of linking imports to their usages

### Added

- Grouped output format: `{ filePath, bySource: [{ source, components: [{ name, importInfo, usages }] }] }`
- Helper function `toSourceMap()` - converts result to `Map<string, Map<string, ComponentData>>`
- Helper function `toSourceObject()` - converts result to plain object for JSON serialization
- Proper import analysis - now correctly extracts named, default, and namespace imports
- Support for detecting unused imports (components with 0 usages)
- Enhanced tests including test for same-name components from different sources

### Changed

- Import tracking now correctly identifies which component comes from which source
- Component usages are now nested under their import source
- All tests updated to use new format

### Fixed

- Fixed critical issue where same component name from different sources couldn't be distinguished
- Fixed import specifier extraction (was using placeholder, now extracts actual names)

## [0.1.0] - 2026-04-13

### Added

- Initial release
- Basic parsing of React/TypeScript/JSX files using oxc_parser
- Extraction of component imports and usages
- Prop extraction (name and value)
- NAPI-RS bindings for Node.js
- TypeScript type definitions
- Integration tests using demo app
- Rust unit tests
