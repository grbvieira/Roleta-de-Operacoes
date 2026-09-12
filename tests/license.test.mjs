import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { licenseText } from '../app/license.mjs';

test('licença offline corresponde ao documento canônico e aos metadados', async () => {
  const root = new URL('../', import.meta.url);
  assert.equal(licenseText, (await readFile(new URL('LICENSE.txt', root), 'utf8')).replaceAll('\r\n', '\n'));
  const metadata = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
  assert.equal(metadata.license, 'SEE LICENSE IN LICENSE.txt');
  assert.equal(lock.packages[''].license, metadata.license);
});
