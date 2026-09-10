import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const expected = 'cf046654938448f25eab8de4d5d0c3f21a497e8edf0a5fe6159b1ae6281b48c2';
const original = await readFile(new URL('../roleta da adição.pptx', import.meta.url));
assert.equal(createHash('sha256').update(original).digest('hex'), expected, 'O PowerPoint original foi alterado.');
console.log('PowerPoint original preservado (SHA-256 conferido).');
