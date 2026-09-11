import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { extractFile, listPackage } from '@electron/asar';
import { distributionNames } from './release-config.cjs';

const root = path.resolve('.');
const sourceMetadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const archive = path.join(root, 'dist', 'win-unpacked', 'resources', 'app.asar');
const files = listPackage(archive).map(file => file.replaceAll('\\', '/'));
assert.ok(files.every(file => !/\.pptx$|\/tests\/|\/node_modules\//i.test(file)), 'o pacote não deve incluir PowerPoint, testes ou ferramentas de desenvolvimento');
const sources = [
  'desktop/main.cjs', 'app/index.html', 'app/styles.css', 'app/renderer.mjs',
  'app/core/math.mjs', 'app/core/wheel.mjs', 'app/assets/escola.jpg',
  'app/assets/professor.png', 'app/assets/criancas.png', 'app/assets/estudantes.png',
  'app/assets/app.ico', 'app/assets/app-icon.svg'
];
for (const file of sources) {
  assert.deepEqual(extractFile(archive, path.normalize(file)), await readFile(path.join(root, file)), `versão empacotada desatualizada: ${file}`);
}
const metadata = JSON.parse(extractFile(archive, 'package.json').toString());
assert.equal(metadata.main, 'desktop/main.cjs');
assert.equal(metadata.version, sourceMetadata.version, 'versão empacotada desatualizada');
assert.deepEqual(await readFile(path.join(root, 'dist', 'win-unpacked', 'LEIA-ME.txt')),
  await readFile(path.join(root, 'LEIA-ME.txt')), 'guia de uso empacotado desatualizado');
const { installer, zip } = distributionNames(sourceMetadata.version);
const names = [installer, zip];
const checksums = [];
for (const name of names) {
  const data = await readFile(path.join(root, 'dist', name));
  assert.ok(data.length > 10_000_000, 'a distribuição deve conter o runtime completo');
  if (name === installer) assert.equal(data.subarray(0, 2).toString(), 'MZ', 'instalador Windows inválido');
  const hash = createHash('sha256').update(data).digest('hex');
  checksums.push(`${hash}  ${name}`);
  console.log(`${name}: ${(data.length / 1024 / 1024).toFixed(1)} MiB`);
}
await writeFile(path.join(root, 'dist', 'SHA256SUMS.txt'), checksums.join('\n') + '\n');
console.log('Código e recursos empacotados idênticos às fontes; SHA-256 das entregas registrado.');
