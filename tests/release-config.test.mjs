import test from 'node:test';
import assert from 'node:assert/strict';
import { distributionNames, validateReleaseVersion } from '../scripts/release-config.cjs';

const metadata = { version: '2.3.4' };
const lock = { version: '2.3.4', packages: { '': { version: '2.3.4' } } };

test('nomes da distribuição acompanham a versão do aplicativo', () => {
  assert.deepEqual(validateReleaseVersion(metadata, lock, 'v2.3.4'), {
    version: '2.3.4',
    installer: 'Roleta-Operacoes-2.3.4-Windows-x64-Instalador.exe',
    zip: 'Roleta-Operacoes-2.3.4-Windows-x64.zip'
  });
});

test('release rejeita tags divergentes, ausentes ou fora do formato', () => {
  for (const tag of ['v2.3.5', '2.3.4', 'v2.3.4-beta.1', 'v02.3.4', 'v2.3.4\n', undefined]) {
    assert.throws(() => validateReleaseVersion(metadata, lock, tag));
  }
  for (const version of ['2.3', '02.3.4', '2.3.4-beta.1', '../2.3.4', '2.3.4\n']) {
    assert.throws(() => distributionNames(version));
  }
});

test('release exige as duas versões do lock atualizadas', () => {
  assert.throws(() => validateReleaseVersion(metadata, { ...lock, version: '1.0.0' }, 'v2.3.4'));
  assert.throws(() => validateReleaseVersion(metadata, { ...lock, packages: { '': { version: '1.0.0' } } }, 'v2.3.4'));
  assert.throws(() => validateReleaseVersion(metadata, { version: '2.3.4' }, 'v2.3.4'));
});
