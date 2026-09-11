import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkHelpInterface, checkHelpKeepsActivity } from './test-help.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const packaged = process.argv.includes('--packaged');
const output = path.join(root, 'test-results', packaged ? 'packaged' : 'desktop');
await mkdir(output, { recursive: true });
const userData = await mkdtemp(path.join(output, 'fresh-profile-'));
const env = { ...process.env, ROLETA_TEST: '1', ROLETA_TEST_OFFLINE: '1', ROLETA_TEST_USER_DATA: userData,
  PLAYWRIGHT_LEGACY_SCREENSHOT: '1' };
delete env.ELECTRON_RUN_AS_NODE;
const launchOptions = { env, offline: true, chromiumSandbox: true, timeout: 30000, ...(packaged
  ? { executablePath: path.join(root, 'dist', 'win-unpacked', 'Roleta de Operações.exe'), args: ['--disable-gpu'] }
  : { args: [root, '--disable-gpu'] }) };
let desktop;
let page;
const errors = [];
const externalRequests = [];
const checks = [];

async function launch() {
  desktop = await electron.launch(launchOptions);
  page = await desktop.firstWindow();
  // Hidden Electron windows otherwise throttle painting and animation frames.
  // This affects only the test window; the distributed app is unchanged.
  await desktop.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    window.webContents.setBackgroundThrottling(false);
    window.setContentSize(1280, 960);
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) externalRequests.push(request.url()); });
  await page.waitForFunction(() => document.querySelectorAll('.category').length === 4);
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  await page.waitForFunction(() => document.readyState === 'complete');
  console.log(`Janela ${packaged ? 'empacotada' : 'de desenvolvimento'} aberta com rede emulada offline.`);
}
async function capture(name) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  // Electron's native capture supports hidden windows explicitly. CDP's
  // full-page capture can wait indefinitely for a visible compositor surface.
  const data = await desktop.evaluate(async ({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    const image = await contents.capturePage(undefined, { stayHidden: true, stayAwake: true });
    return image.toPNG().toString('base64');
  });
  assert.ok(data.length > 1000, 'a captura da janela deve conter uma imagem');
  await writeFile(path.join(output, name), Buffer.from(data, 'base64'));
}
async function ids() { return page.locator('.sector title').allTextContents(); }
async function enter(operation) { await page.locator(`button[data-operation="${operation}"]`).click(); }
async function checkSpin() {
  await page.locator('#spin-button').click();
  assert.equal(await page.locator('#answer').isVisible(), false);
  for (const id of ['spin-button', 'answer-button', 'settings-button', 'new-round-button', 'back-button', 'help-button']) {
    assert.equal(await page.locator(`#${id}`).isDisabled(), true);
  }
  await page.waitForFunction(() => document.querySelector('#wheel').hasAttribute('data-selected-index'), undefined, { timeout: 10000 });
  const result = await page.evaluate(() => {
    const svg = document.querySelector('#wheel');
    const rotor = document.querySelector('#rotor');
    // Test the actual SVG geometry at the pointer tip, independently of the
    // application's sector-selection function (including viewport scaling).
    const screenTip = new DOMPoint(81, 320).matrixTransform(svg.getScreenCTM());
    const wheelTip = screenTip.matrixTransform(rotor.getScreenCTM().inverse());
    const pointed = [...rotor.querySelectorAll('.sector')].filter(shape => shape.isPointInFill(wheelTip));
    const label = rotor.querySelector(`.sector-label[data-index="${svg.dataset.selectedIndex}"]`);
    const labelMatrix = label.getScreenCTM();
    return {
      pointed: pointed.map(shape => Number(shape.dataset.index)),
      selected: Number(svg.dataset.selectedIndex),
      expression: document.querySelector('#expression').textContent,
      label: label.textContent,
      labelDirection: [labelMatrix.a, labelMatrix.b],
      id: document.querySelector('#selected-problem').dataset.problem
    };
  });
  assert.deepEqual(result.pointed, [result.selected], 'a ponta da seta deve estar dentro do setor selecionado');
  assert.equal(result.expression, result.label);
  assert.ok(result.labelDirection[0] > 0 && Math.abs(result.labelDirection[1]) < 1e-8, 'conta apontada deve estar horizontal e legível');
  const [operation, aValue, bValue] = result.id.split(':');
  const a = Number(aValue), b = Number(bValue);
  const expected = operation === 'addition' ? a + b : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
  await checkHelpKeepsActivity(page); // Keep the selected answer hidden.
  await page.locator('#answer-button').click();
  assert.equal(await page.locator('#answer').textContent(), String(expected));
  assert.equal(await page.locator('#answer').isVisible(), true);
  await checkHelpKeepsActivity(page); // Keep an already revealed answer visible.
  checks.push(`Seta, conta e resposta: ${result.expression} = ${expected}`);
  console.log(checks.at(-1));
}
async function fillSettings(values) {
  for (const [id, value] of Object.entries(values)) await page.locator(`#${id}`).fill(String(value));
}
async function applySettings() { await page.getByRole('button', { name: 'Aplicar e renovar' }).click(); }

try {
  await launch();
  const runtime = await desktop.evaluate(() => ({ electron: process.versions.electron, execPath: process.execPath, node: process.versions.node }));
  assert.equal(runtime.electron, '44.3.0');
  if (packaged) assert.equal(runtime.execPath, launchOptions.executablePath);
  checks.push(`Runtime próprio: Electron ${runtime.electron}, Node.js incorporado ${runtime.node}.`);
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  assert.equal(await page.evaluate(() => navigator.onLine), false, 'primeira abertura com rede emulada offline');
  await capture('01-menu.png');
  checks.push('Primeira abertura com perfil vazio e rede emulada offline; imagens locais carregadas.');
  await checkHelpInterface({ page, desktop, capture });
  checks.push('Ajuda offline: três seções, versão real, cópia fixa via IPC, teclado, foco, rolagem e Escape prioritário.');

  for (const operation of ['addition', 'subtraction', 'multiplication', 'division']) {
    await enter(operation);
    const first = await ids();
    assert.equal(first.length, 10);
    assert.equal(new Set(first).size, 10);
    await checkHelpKeepsActivity(page);
    await checkSpin();
    if (operation === 'addition') {
      await capture('02-roleta-resposta.png');
      await checkSpin(); // Another spin must hide the old answer immediately.
    }
    await page.locator('#new-round-button').click();
    const refreshed = await ids();
    assert.ok(refreshed.some(expression => !first.includes(expression)));
    assert.equal(await page.locator('#answer').isVisible(), false);
    assert.equal(await page.locator('#answer-button').isDisabled(), true);
    await page.locator('#back-button').click();
    await enter(operation);
    assert.ok((await ids()).some(expression => !refreshed.includes(expression)));
    await page.locator('#back-button').click();
  }
  checks.push('Quatro operações, dez setores únicos, novas rodadas e renovação ao reentrar.');

  await enter('division');
  await page.locator('#settings-button').click();
  await fillSettings({ 'a-min': 5, 'a-max': 5, 'b-min': 2, 'b-max': 2 });
  await applySettings();
  assert.match(await page.locator('#settings-error').textContent(), /nenhuma conta válida/);
  await fillSettings({ 'b-min': 0 });
  await applySettings();
  assert.match(await page.locator('#settings-error').textContent(), /divisor/i);
  await fillSettings({ 'a-min': 6, 'a-max': 12, 'b-min': 3, 'b-max': 3 });
  await applySettings();
  assert.equal(await page.locator('#settings-dialog').isVisible(), false);
  assert.deepEqual((await ids()).sort(), ['12 ÷ 3', '6 ÷ 3', '9 ÷ 3']);
  assert.equal(await page.locator('#limited-info').isVisible(), true);
  await checkSpin();
  await capture('03-tres-setores.png');

  await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(960, 680));
  await page.waitForFunction(() => innerWidth === 960);
  const layout = await page.evaluate(() => {
    const wheel = document.querySelector('.wheel-stage').getBoundingClientRect();
    const cast = document.querySelector('.classroom-cast').getBoundingClientRect();
    return { overlap: wheel.left < cast.right && wheel.right > cast.left && wheel.top < cast.bottom && wheel.bottom > cast.top,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.equal(layout.overlap, false);
  assert.equal(layout.horizontalOverflow, false);
  await capture('04-janela-menor.png');
  await page.locator('#settings-button').click();
  await fillSettings({ 'a-min': 12, 'a-max': 12 });
  await applySettings();
  assert.equal((await ids()).length, 1);
  await checkSpin();
  checks.push('Configurações inválidas tratadas; divisor fixo; roletas com três setores e um setor.');
  checks.push('Personagens e roleta sem sobreposição; sem rolagem horizontal em 960 × 680.');
  await desktop.close();
  desktop = null;
  await launch();
  await enter('division');
  assert.deepEqual(await ids(), ['12 ÷ 3']);
  checks.push('Configurações preservadas após fechar e reabrir o aplicativo.');
  assert.deepEqual(externalRequests, [], 'nenhuma requisição web na atividade');
  assert.deepEqual(errors, [], 'nenhum erro JavaScript na interface');
  await writeFile(path.join(output, 'resultado.json'), JSON.stringify({ packaged, checks, errors, externalRequests, rendering: 'software, hidden window' }, null, 2));
  console.log(checks.join('\n'));
  console.log(`Teste desktop ${packaged ? 'empacotado' : 'em desenvolvimento'} aprovado.`);
} catch (error) {
  if (desktop && page && !page.isClosed()) {
    console.error('Estado da janela:', await desktop.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      return { fullscreen: window.isFullScreen(), maximized: window.isMaximized(), content: window.getContentBounds() };
    }).catch(() => null));
    console.error('Viewport:', await page.evaluate(() => ({ width: innerWidth, height: innerHeight })).catch(() => null));
  }
  if (page && !page.isClosed()) await capture('falha.png').catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  if (desktop) await desktop.close();
}
