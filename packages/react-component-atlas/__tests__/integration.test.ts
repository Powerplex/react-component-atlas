import * as fs from 'fs';
import * as path from 'path';
import { parseFile, toSourceMap, parseProjectSync, generateReport } from '../src/index';

describe('Integration Tests - Demo App', () => {
  const demoAppPath = path.join(__dirname, '../../../apps/demo/src');

  test('Parse Home.tsx and detect MUI components', () => {
    const filePath = path.join(demoAppPath, 'pages/Home.tsx');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    const result = parseFile(filePath, sourceCode);

    // Should find imports from @mui/material
    const muiSource = result.bySource.find(s => s.source.includes('@mui/material'));
    expect(muiSource).toBeDefined();
    expect(muiSource!.components.length).toBeGreaterThan(0);

    // Should find MUI component usages
    const muiComponents = ['Container', 'Typography', 'Button', 'Box'];
    const foundComponents = muiSource!.components.map(c => c.name);

    for (const component of muiComponents) {
      expect(foundComponents).toContain(component);
    }

    // Check that Button has props
    const button = muiSource!.components.find(c => c.name === 'Button');
    expect(button).toBeDefined();
    expect(button!.usages.length).toBeGreaterThan(0);
    expect(button!.usages[0].props.length).toBeGreaterThan(0);
  });

  test('Parse Dashboard.tsx and detect complex MUI components', () => {
    const filePath = path.join(demoAppPath, 'pages/Dashboard.tsx');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    const result = parseFile(filePath, sourceCode);

    const muiSource = result.bySource.find(s => s.source.includes('@mui/material'));
    expect(muiSource).toBeDefined();

    // Should find Grid, Card, Table components
    const foundComponents = muiSource!.components.map(c => c.name);
    expect(foundComponents).toContain('Grid');
    expect(foundComponents).toContain('Card');
    expect(foundComponents).toContain('Table');

    // Should find multiple component usages
    const totalUsages = muiSource!.components.reduce((sum, c) => sum + c.usages.length, 0);
    expect(totalUsages).toBeGreaterThan(10);
  });

  test('Parse Profile.tsx and detect form components', () => {
    const filePath = path.join(demoAppPath, 'pages/Profile.tsx');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    const result = parseFile(filePath, sourceCode);

    const muiSource = result.bySource.find(s => s.source.includes('@mui/material'));
    expect(muiSource).toBeDefined();

    // Should find TextField components
    const textField = muiSource!.components.find(c => c.name === 'TextField');
    expect(textField).toBeDefined();
    expect(textField!.usages.length).toBeGreaterThan(0);

    // Should find Switch component
    const switchComp = muiSource!.components.find(c => c.name === 'Switch');
    expect(switchComp).toBeDefined();
  });

  test('Parse App.tsx and detect routing components', () => {
    const filePath = path.join(demoAppPath, 'app/app.tsx');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    const result = parseFile(filePath, sourceCode);

    // Should find react-router-dom imports
    const routerSource = result.bySource.find(s => s.source.includes('react-router-dom'));
    expect(routerSource).toBeDefined();

    // Should find MUI AppBar, Toolbar
    const muiSource = result.bySource.find(s => s.source.includes('@mui/material'));
    expect(muiSource).toBeDefined();

    const foundComponents = muiSource!.components.map(c => c.name);
    expect(foundComponents).toContain('AppBar');
    expect(foundComponents).toContain('Toolbar');
  });

  test('toSourceMap helper converts to Map structure', () => {
    const filePath = path.join(demoAppPath, 'pages/Home.tsx');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    const result = parseFile(filePath, sourceCode);
    const sourceMap = toSourceMap(result);

    // Can access via Map methods
    expect(sourceMap.size).toBeGreaterThan(0);

    const muiComponents = sourceMap.get('@mui/material');
    expect(muiComponents).toBeDefined();
    expect(muiComponents!.size).toBeGreaterThan(0);

    const button = muiComponents!.get('Button');
    expect(button).toBeDefined();
    expect(button!.usages.length).toBeGreaterThan(0);
  });

  test('Handles multiple imports from same component name', () => {
    const testCode = `
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

    const result = parseFile('test.tsx', testCode);

    // Should have two different sources
    expect(result.bySource.length).toBe(2);

    const muiButton = result.bySource.find(s => s.source === '@mui/material')?.components.find(c => c.name === 'Button');
    const customButton = result.bySource.find(s => s.source === './components')?.components.find(c => c.name === 'CustomButton');

    expect(muiButton).toBeDefined();
    expect(customButton).toBeDefined();
    expect(muiButton!.usages.length).toBe(1);
    expect(customButton!.usages.length).toBe(1);
  });

  test('Parser handles invalid syntax gracefully', () => {
    const invalidCode = 'const x = {';

    expect(() => {
      parseFile('test.tsx', invalidCode);
    }).toThrow();
  });

  test('Parser handles plain JavaScript (no JSX)', () => {
    const plainJS = `
      const x = 1;
      function add(a, b) {
        return a + b;
      }
    `;

    const result = parseFile('test.js', plainJS);
    expect(result.bySource.length).toBe(0);
  });

  test('Tracks local components with <local> source', () => {
    const testCode = `
      import { Box } from '@mui/material';

      function LocalCard() {
        return <div>Card</div>;
      }

      function LocalButton() {
        return <button>Button</button>;
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

    const result = parseFile('test.tsx', testCode);

    // Should have 2 sources: @mui/material and <local>
    expect(result.bySource.length).toBe(2);

    // Check MUI import
    const muiSource = result.bySource.find(s => s.source === '@mui/material');
    expect(muiSource).toBeDefined();
    expect(muiSource!.components[0].name).toBe('Box');
    expect(muiSource!.components[0].usages.length).toBe(1);

    // Check local components
    const localSource = result.bySource.find(s => s.source === '<local>');
    expect(localSource).toBeDefined();
    expect(localSource!.components.length).toBe(2);

    const localCard = localSource!.components.find(c => c.name === 'LocalCard');
    const localButton = localSource!.components.find(c => c.name === 'LocalButton');

    expect(localCard).toBeDefined();
    expect(localCard!.usages.length).toBe(1);

    expect(localButton).toBeDefined();
    expect(localButton!.usages.length).toBe(1);
  });

  test('Handles files with only local components', () => {
    const testCode = `
      function Header() {
        return <h1>Title</h1>;
      }

      function Footer() {
        return <footer>Footer</footer>;
      }

      function App() {
        return (
          <div>
            <Header />
            <Footer />
          </div>
        );
      }
    `;

    const result = parseFile('test.tsx', testCode);

    // Should have only <local> source
    expect(result.bySource.length).toBe(1);
    expect(result.bySource[0].source).toBe('<local>');

    const components = result.bySource[0].components;
    expect(components.length).toBe(2);

    const header = components.find(c => c.name === 'Header');
    const footer = components.find(c => c.name === 'Footer');

    expect(header).toBeDefined();
    expect(header!.usages.length).toBe(1);

    expect(footer).toBeDefined();
    expect(footer!.usages.length).toBe(1);
  });

  test('parseProjectSync analyzes entire demo app', () => {
    const demoPath = path.join(__dirname, '../../../apps/demo');
    const atlas = parseProjectSync(demoPath);

    // Should load config
    expect(atlas.config).toBeDefined();
    expect(atlas.config.include).toContain('src/**/*.tsx');

    // Should find multiple files
    expect(atlas.summary.totalFiles).toBeGreaterThan(0);
    expect(Object.keys(atlas.files).length).toBe(atlas.summary.totalFiles);

    // Should aggregate MUI components across files
    const muiSummary = atlas.summary.bySource['@mui/material'];
    expect(muiSummary).toBeDefined();
    expect(muiSummary.components.length).toBeGreaterThan(5);
    expect(muiSummary.totalUsages).toBeGreaterThan(10);
    expect(muiSummary.files.length).toBeGreaterThan(0);

    // Should track components like Button, Typography, Container
    expect(muiSummary.components).toContain('Button');
    expect(muiSummary.components).toContain('Typography');
    expect(muiSummary.components).toContain('Container');

    // Should find react-router-dom components
    const routerSummary = atlas.summary.bySource['react-router-dom'];
    expect(routerSummary).toBeDefined();
    expect(routerSummary.components.length).toBeGreaterThan(0);

    // Should find @mui/icons-material (icons use specific import paths)
    const iconSources = Object.keys(atlas.summary.bySource).filter(s =>
      s.startsWith('@mui/icons-material/')
    );
    expect(iconSources.length).toBeGreaterThan(0);
  });

  test('generateReport creates markdown summary', () => {
    const demoPath = path.join(__dirname, '../../../apps/demo');
    const atlas = parseProjectSync(demoPath);
    const report = generateReport(atlas);

    // Report should be markdown
    expect(report).toContain('# React Component Atlas Report');
    expect(report).toContain('## Components by Source');
    expect(report).toContain('## Most Used Components');

    // Should contain MUI section
    expect(report).toContain('@mui/material');
    expect(report).toContain('Button');

    // Should show statistics
    expect(report).toContain('Total Files Analyzed');
    expect(report).toContain('Total Unique Components');
  });
});
