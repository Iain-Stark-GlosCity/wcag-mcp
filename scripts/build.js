#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const submoduleDir = join(rootDir, 'data', 'wcag');
const wcagJson = join(rootDir, 'data', 'wcag.json');

function run(command, description, { optional = false } = {}) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✓ ${description} complete`);
    return true;
  } catch (error) {
    if (optional) {
      console.warn(`⚠ ${description} skipped: ${error.message}`);
      return false;
    }
    throw error;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Accessibility Advisor MCP Build Process');
  console.log('='.repeat(60));

  run(existsSync(submoduleDir) ? 'git submodule update --remote data/wcag' : 'git submodule update --init --recursive', 'Updating WCAG submodule', { optional: true });

  const fetched = run('node scripts/fetch-wcag-data.js', 'Fetching WCAG 2.2 JSON from W3C', { optional: existsSync(wcagJson) });
  if (!fetched && !existsSync(wcagJson)) throw new Error('data/wcag.json is missing and W3C fetch failed.');

  run('node scripts/parse-understanding-docs.js', 'Parsing Understanding documentation', { optional: true });
  run('npm run normalise', 'Normalising advisor data');
  run('npm run validate:data', 'Validating advisor data');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Build complete! Accessibility Advisor MCP is ready to use.');
  console.log('='.repeat(60));
}

main().catch(error => { console.error('\n❌ Build failed:', error.message); process.exit(1); });
