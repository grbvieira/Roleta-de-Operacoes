const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { distributionNames } = require('./release-config.cjs');

module.exports = async function publishRelease({ github, context, core, tag, version, installerPath, expectedSha256 }) {
  const { installer } = distributionNames(version);
  assert.equal(tag, `v${version}`, 'Tag e versão não correspondem.');
  assert.equal(path.basename(installerPath), installer, 'Nome inesperado para o instalador.');
  const data = await readFile(installerPath);
  assert.ok(data.length > 10_000_000, 'O instalador completo está ausente ou incompleto.');
  assert.equal(data.subarray(0, 2).toString(), 'MZ', 'Arquivo não reconhecido como executável Windows.');
  const checksum = createHash('sha256').update(data).digest('hex');
  assert.equal(checksum, expectedSha256, 'O instalador difere do artefato verificado no job de build.');

  const repo = context.repo;
  // Listing also finds drafts. Authentication/network errors must stop the job.
  const releases = await github.paginate(github.rest.repos.listReleases, { ...repo, per_page: 100 });
  const existing = releases.find(release => release.tag_name === tag);
  if (existing) {
    throw new Error(`Já existe uma Release ${existing.draft ? 'em rascunho' : 'publicada'} para ${tag}. Nada foi alterado. Consulte docs/releases.md antes de reexecutar.`);
  }

  // Require the remote tag and resolve annotated tags to the tested commit.
  let { data: { object } } = await github.rest.git.getRef({ ...repo, ref: `tags/${tag}` });
  while (object.type === 'tag') {
    ({ data: { object } } = await github.rest.git.getTag({ ...repo, tag_sha: object.sha }));
  }
  assert.equal(object.type, 'commit');
  assert.equal(object.sha, context.sha, 'A tag foi movida depois do início desta execução.');

  const { data: draft } = await github.rest.repos.createRelease({
    ...repo, tag_name: tag, target_commitish: context.sha,
    name: `Roleta de Operações ${tag}`, draft: true, prerelease: false,
    generate_release_notes: true,
    body: `Instalador completo para Windows 10 e 11 x64. Funciona offline desde a primeira abertura.\n\nSHA-256 de ${installer}:\n\n\`${checksum}\`\n`
  });
  try {
    const { data: asset } = await github.rest.repos.uploadReleaseAsset({
      ...repo, release_id: draft.id, name: installer, data,
      headers: { 'content-type': 'application/octet-stream', 'content-length': data.length }
    });
    const { data: uploaded } = await github.rest.repos.getReleaseAsset({ ...repo, asset_id: asset.id });
    assert.equal(uploaded.state, 'uploaded', 'Upload do instalador não foi concluído.');
    assert.equal(uploaded.name, installer);
    assert.equal(uploaded.size, data.length, 'Tamanho incorreto do anexo.');
    const { data: published } = await github.rest.repos.updateRelease({
      ...repo, release_id: draft.id, draft: false, make_latest: 'legacy'
    });
    core.info(`Release publicada: ${published.html_url}`);
  } catch (error) {
    core.error(`A publicação não foi confirmada. Confira a Release ${tag} no GitHub antes de reexecutar; nenhum anexo será substituído automaticamente.`);
    throw error;
  }
};
