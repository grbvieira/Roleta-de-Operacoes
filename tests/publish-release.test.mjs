import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import publishRelease from '../scripts/publish-release.cjs';

const installer = 'Roleta-Operacoes-2.3.4-Windows-x64-Instalador.exe';
const bytes = Buffer.alloc(10_000_001);
bytes.write('MZ');
const checksum = createHash('sha256').update(bytes).digest('hex');
let directory;
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'roleta-release-test-'));
  await writeFile(path.join(directory, installer), bytes);
});
after(async () => { await rm(directory, { recursive: true, force: true }); });

function fixture(options = {}) {
  const calls = [];
  const endpoint = (name, result) => async args => {
    calls.push({ name, args });
    if (options.fail === name) throw new Error(`Falha simulada: ${name}`);
    return { data: result };
  };
  const github = {
    paginate: async () => {
      calls.push({ name: 'list' });
      if (options.fail === 'list') throw new Error('Falha simulada: list');
      return options.existing ? [options.existing] : [];
    },
    rest: {
      git: {
        getRef: endpoint('tag', { object: options.annotated
          ? { type: 'tag', sha: 'annotated-tag' }
          : { type: 'commit', sha: options.moved ? 'different-commit' : 'tested-commit' } }),
        getTag: endpoint('annotated', { object: { type: 'commit', sha: 'tested-commit' } })
      },
      repos: {
        listReleases() {},
        createRelease: endpoint('create', { id: 42 }),
        uploadReleaseAsset: endpoint('upload', { id: 55 }),
        getReleaseAsset: endpoint('asset', {
          name: installer, size: options.incomplete ? 100 : bytes.length, state: 'uploaded'
        }),
        updateRelease: endpoint('publish', { html_url: 'https://example.test/release' })
      }
    }
  };
  return {
    calls,
    args: {
      github, context: { repo: { owner: 'owner', repo: 'repo' }, sha: 'tested-commit' },
      core: { info() {}, error() {} }, tag: 'v2.3.4', version: '2.3.4',
      installerPath: path.join(directory, installer), expectedSha256: checksum,
      releaseNotes: 'Novidades desta versão: ajuda disponível offline.'
    }
  };
}

test('publica somente depois de criar rascunho e confirmar o anexo', async () => {
  const { args, calls } = fixture({ annotated: true });
  await publishRelease(args);
  assert.deepEqual(calls.map(call => call.name), ['list', 'tag', 'annotated', 'create', 'upload', 'asset', 'publish']);
  const create = calls.find(call => call.name === 'create').args;
  assert.equal(create.draft, true);
  assert.equal(create.generate_release_notes, true);
  assert.equal(create.tag_name, 'v2.3.4');
  assert.ok(create.body.startsWith(args.releaseNotes));
  assert.ok(create.body.includes(checksum));
  assert.equal(calls.find(call => call.name === 'upload').args.name, installer);
  assert.equal(calls.at(-1).args.draft, false);
  assert.equal(calls.at(-1).args.release_id, 42);
});

test('reexecução preserva tanto Release publicada quanto rascunho existente', async () => {
  for (const draft of [false, true]) {
    const { args, calls } = fixture({ existing: { tag_name: 'v2.3.4', draft } });
    await assert.rejects(publishRelease(args), /Já existe uma Release/);
    assert.deepEqual(calls.map(call => call.name), ['list']);
  }
});

test('instalador ausente ou adulterado impede qualquer chamada à API', async () => {
  for (const changes of [
    { installerPath: path.join(directory, 'missing', installer) },
    { expectedSha256: 'incorrect-hash' },
    { releaseNotes: '' },
    { tag: 'v2.3.5' }
  ]) {
    const { args, calls } = fixture();
    await assert.rejects(publishRelease({ ...args, ...changes }));
    assert.equal(calls.length, 0);
  }
});

test('tag movida e falha de consulta não permitem criar Release', async () => {
  for (const options of [{ moved: true }, { fail: 'list' }, { fail: 'tag' }]) {
    const { args, calls } = fixture(options);
    await assert.rejects(publishRelease(args));
    assert.ok(calls.every(call => !['create', 'upload', 'publish'].includes(call.name)));
  }
});

test('falha no upload ou anexo incompleto não publica o rascunho', async () => {
  for (const options of [{ fail: 'upload' }, { fail: 'asset' }, { incomplete: true }]) {
    const { args, calls } = fixture(options);
    await assert.rejects(publishRelease(args));
    assert.ok(calls.some(call => call.name === 'create'));
    assert.ok(calls.every(call => call.name !== 'publish'));
  }
});

test('falhas ao criar ou publicar são propagadas sem nova tentativa automática', async () => {
  for (const fail of ['create', 'publish']) {
    const { args, calls } = fixture({ fail });
    await assert.rejects(publishRelease(args), /Falha simulada/);
    assert.equal(calls.filter(call => call.name === fail).length, 1);
  }
});
