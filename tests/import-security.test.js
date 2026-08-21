import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(repoRoot, 'script.js'), 'utf8');

assert.match(source, /const VALID_CATEGORIES = new Set\(\[/);
assert.match(source, /const VALID_PRIORITIES = new Set\(\[/);
assert.match(source, /function normalizeImportedTasks\(rawTasks\)/);
assert.match(source, /Number\.isSafeInteger\(candidate\.id\)/);
assert.match(source, /slice\(0, 100\)/);
assert.match(source, /VALID_CATEGORIES\.has\(candidate\.category\)/);
assert.match(source, /VALID_PRIORITIES\.has\(candidate\.priority\)/);
assert.match(source, /isValidIsoDate\(candidate\.dueDate\)/);
assert.match(source, /const normalizedTasks = normalizeImportedTasks\(importedTasks\)/);
assert.doesNotMatch(source, /tasks = \[\.\.\.importedTasks, \.\.\.tasks\]/);

console.log('Todo import security checks passed');
