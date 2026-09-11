const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function distributionNames(version) {
  assert.match(version, stableVersion, 'Use uma versão estável no formato X.Y.Z.');
  assert.equal(version.trim(), version, 'A versão não pode conter espaços ou quebras de linha.');
  const base = `Roleta-Operacoes-${version}-Windows-x64`;
  return { installer: `${base}-Instalador.exe`, zip: `${base}.zip` };
}

function validateReleaseVersion(metadata, lock, tag) {
  const names = distributionNames(metadata.version);
  assert.equal(tag, `v${metadata.version}`, 'A tag deve ser v seguida da versão exata de package.json.');
  assert.equal(lock.version, metadata.version, 'Atualize a versão no package-lock.json.');
  assert.equal(lock.packages?.['']?.version, metadata.version, 'A versão raiz do lock deve corresponder à do aplicativo.');
  return { version: metadata.version, ...names };
}

module.exports = { distributionNames, validateReleaseVersion };

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    const tag = process.argv[2] || process.env.GITHUB_REF_NAME;
    const result = validateReleaseVersion(metadata, lock, tag);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT,
        Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
    }
    console.log(`Versão ${result.version} e lock conferidos para ${tag}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
