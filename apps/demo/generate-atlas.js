#!/usr/bin/env node

/**
 * Example script showing how to use react-component-atlas to analyze a project
 */

const { parseProjectSync, generateReport } = require('react-component-atlas');
const fs = require('fs');
const path = require('path');

// Parse the entire demo project
console.log('Analyzing demo project...\n');
const atlas = parseProjectSync(__dirname);

// Generate and display the report
const report = generateReport(atlas);
console.log(report);

// Optionally save to file
const outputPath = path.join(__dirname, atlas.config.output || 'component-atlas.json');
fs.writeFileSync(outputPath, JSON.stringify(atlas, null, 2));
console.log(`\n\nFull atlas data saved to: ${outputPath}`);
