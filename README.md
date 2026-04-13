# React Component Atlas

A monorepo containing a Rust-powered React component analyzer and demo application.

## Project Structure

```
react-component-atlas/
├── apps/
│   └── demo/                          # Demo React app with MUI components
│       ├── src/
│       │   ├── pages/                 # Example pages
│       │   │   ├── Home.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   └── Profile.tsx
│       │   └── app/
│       │       └── app.tsx
│       └── package.json
├── packages/
│   └── react-component-atlas/         # The parser package
│       ├── src/                       # TypeScript API
│       │   └── index.ts
│       ├── native/                    # Rust source
│       │   ├── src/
│       │   │   ├── lib.rs            # NAPI bindings
│       │   │   ├── parser.rs         # oxc_parser integration
│       │   │   ├── analyzer.rs       # Component analysis logic
│       │   │   └── types.rs          # Shared type definitions
│       │   ├── Cargo.toml
│       │   └── tests/                # Rust unit tests
│       ├── __tests__/                # Integration tests
│       │   └── integration.test.ts
│       └── package.json
├── nx.json
├── package.json
└── README.md
```

## Architecture

### Why Rust + Node.js?

- **Rust**: Provides blazing-fast parsing using `oxc_parser` (from Oxide tools)
- **napi-rs**: Creates Node.js native bindings for seamless integration
- **TypeScript**: Provides a type-safe, ergonomic API for Node.js consumers

### How It Works

1. **Parse**: Rust code uses `oxc_parser` to parse JSX/TSX files into an AST
2. **Analyze**: Custom visitor pattern extracts component imports, usages, and props
3. **Export**: Results are serialized and exposed via napi-rs to Node.js
4. **Test**: Integration tests run against the demo app to prevent regressions

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Build the parser package
cd packages/react-component-atlas
npm run build
```

### Running the Demo App

```bash
# Start the demo React application
npx nx serve demo
```

### Running Tests

```bash
# Run Rust unit tests
cd packages/react-component-atlas
cargo test --manifest-path native/Cargo.toml

# Run integration tests
npm test
```

## Development Workflow

### Adding New Features

1. Update Rust code in `packages/react-component-atlas/native/src/`
2. Add unit tests in the same files
3. Build the native module: `npm run build:native`
4. Update TypeScript API in `packages/react-component-atlas/src/`
5. Add integration tests in `__tests__/`

### Testing Against Demo App

The demo app in `apps/demo/` serves two purposes:
1. Example React application using MUI components
2. Test fixture for integration tests

Integration tests parse the demo app files and verify the output, ensuring the parser works correctly on real-world code.

## Package Publishing

The `react-component-atlas` package can be published to npm:

```bash
cd packages/react-component-atlas
npm run build
npm publish
```

## Built With

- [NX](https://nx.dev/) - Monorepo tooling
- [oxc_parser](https://github.com/oxc-project/oxc) - Fast JavaScript/TypeScript parser
- [napi-rs](https://napi.rs/) - Rust bindings for Node.js
- [Material-UI](https://mui.com/) - Demo app components
- [React Router](https://reactrouter.com/) - Demo app routing

## License

MIT
