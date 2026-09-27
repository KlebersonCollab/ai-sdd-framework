/**
 * Test Suite & Sensor for Standalone Static Documentation Exporter
 * AI-SDD Framework | Tests zero-dependency single-file HTML compilation
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

let exporter;
try {
  exporter = require('../.agents/scripts/export-docs.js');
} catch (err) {
  exporter = null;
}

test('Exporter module existence', () => {
  assert.ok(exporter, 'Expected .agents/scripts/export-docs.js to exist and export functionality');
});

test('Exporter: exportDocs compiles standalone HTML document', () => {
  if (!exporter || !exporter.exportDocs) {
    assert.fail('exporter.exportDocs function is not defined');
  }

  const tmpOutDir = path.resolve(__dirname, '../docs');
  const outFile = path.join(tmpOutDir, 'index.html');

  const result = exporter.exportDocs({ outputDir: tmpOutDir });
  assert.ok(result, 'Must return export result metadata');
  assert.ok(fs.existsSync(outFile), 'Output docs/index.html must exist on disk');

  const html = fs.readFileSync(outFile, 'utf8');
  assert.ok(html.includes('<!DOCTYPE html>'), 'Must be valid HTML5 document');
  assert.ok(html.includes('#010102'), 'Must contain Linear Dark canvas token from DESIGN.md');
  assert.ok(html.includes('#5e6ad2'), 'Must contain Linear Dark primary token from DESIGN.md');
  assert.ok(html.includes('ADR 0004') || html.includes('ADR 0001'), 'Must include compiled ADRs');
  assert.ok(html.includes('Project Vision'), 'Must include Project Vision section');
  assert.ok(html.includes('Architecture'), 'Must include Architecture section');
  assert.ok(html.includes('Prohibitions') || html.includes('TIER1'), 'Must include Rules section');
});
