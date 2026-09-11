// Focused visual/resource check; does not replace the full regression suite.
import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';

const packaged = process.argv.includes('--packaged');
const root = path.resolve('.');
const output = path.join(root, 'test-results', packaged ? 'assets-packaged' : 'assets');
await mkdir(output, { recursive: true });
const env = { ...process.env, ROLETA_TEST: '1', ROLETA_TEST_OFFLINE: '1',
  ROLETA_TEST_USER_DATA: await mkdtemp(path.join(output, 'profile-')) };
delete env.ELECTRON_RUN_AS_NODE;
const desktop = await electron.launch({ env, offline: true, timeout: 30000,
  ...(packaged ? { executablePath: path.join(root, 'dist/win-unpacked/Roleta de Operações.exe'), args: ['--disable-gpu'] }
    : { args: [root, '--disable-gpu'] }) });
const errors = [], requests = [], checks = [];
try {
  const page = await desktop.firstWindow();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) requests.push(request.url()); });
  await desktop.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    window.webContents.setBackgroundThrottling(false);
    window.setContentSize(1280, 900);
  });
  await page.waitForFunction(() => document.querySelector('#help-button') && [...document.images].every(img => img.complete && img.naturalWidth));
  assert.equal(await page.evaluate(() => navigator.onLine), false);
  const loadedAssets = await page.evaluate(async () => {
    const url = getComputedStyle(document.querySelector('.school-scene')).backgroundImage.match(/url\("?([^"\)]+)"?\)/)[1];
    const background = new Image();
    background.src = url;
    await background.decode();
    return [...new Set([...document.images].map(img => new URL(img.src).pathname).concat(new URL(url).pathname))];
  });
  for (const name of ['cenario-escola.png', 'estudantes-sala.png', 'estudantes-roleta.png', 'professor-arnaldo.png']) {
    assert.ok(loadedAssets.includes(`/assets/${name}`), `recurso ausente: ${name}`);
  }
  async function capture(name) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const base64 = await desktop.evaluate(async ({ BrowserWindow }) => {
      const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true, stayAwake: true });
      return image.toPNG().toString('base64');
    });
    await writeFile(path.join(output, name), Buffer.from(base64, 'base64'));
  }
  await capture('menu-inicial.png');
  const operations = { addition: 'adicao', subtraction: 'subtracao', multiplication: 'multiplicacao', division: 'divisao' };
  for (const [operation, name] of Object.entries(operations)) {
    await page.locator(`button[data-operation="${operation}"]`).click();
    await capture(`${name}.png`);
    if (operation === 'addition') {
      await page.locator('#spin-button').click();
      await page.waitForFunction(() => document.querySelector('#wheel').hasAttribute('data-selected-index'));
      const selected = await page.evaluate(() => {
        const svg = document.querySelector('#wheel'), rotor = document.querySelector('#rotor');
        const tip = new DOMPoint(81, 320).matrixTransform(svg.getScreenCTM()).matrixTransform(rotor.getScreenCTM().inverse());
        const pointed = [...rotor.querySelectorAll('.sector')].filter(slice => slice.isPointInFill(tip));
        return { pointed: pointed.map(slice => Number(slice.dataset.index)), selected: Number(svg.dataset.selectedIndex), problem: document.querySelector('#selected-problem').dataset.problem };
      });
      assert.deepEqual(selected.pointed, [selected.selected]);
      const [, a, b] = selected.problem.split(':');
      await page.locator('#answer-button').click();
      assert.equal(await page.locator('#answer').textContent(), String(Number(a) + Number(b)));
      await capture('resposta-revelada.png');
      const snapshot = () => page.evaluate(() => ({ wheel: document.querySelector('#rotor').outerHTML,
        problem: document.querySelector('#selected-problem').innerHTML, settings: { ...localStorage } }));
      const before = await snapshot();
      await page.locator('#help-button').click();
      for (const section of ['about', 'privacy', 'usage', 'credits']) {
        await page.locator(`#help-tab-${section}`).click();
        assert.equal(await page.locator(`#help-${section}`).isVisible(), true);
      }
      assert.match(await page.locator('#help-credits').textContent(), /LICENSES.chromium.html/);
      await capture('creditos-licencas.png');
      await page.keyboard.press('Escape');
      assert.deepEqual(await snapshot(), before);
      checks.push('Um giro: geometria da seta, conta e resposta; ajuda preserva rodada e configurações.');
    }
    await page.locator('#back-button').click();
  }
  await page.locator('button[data-operation="division"]').click();
  await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(960, 680));
  await page.waitForFunction(() => innerWidth === 960);
  assert.equal(await page.evaluate(() => {
    const wheel = document.querySelector('.wheel-stage').getBoundingClientRect();
    const cast = document.querySelector('.classroom-cast').getBoundingClientRect();
    return document.documentElement.scrollWidth <= innerWidth &&
      !(wheel.left < cast.right && wheel.right > cast.left && wheel.top < cast.bottom && wheel.bottom > cast.top);
  }), true);
  await capture('janela-menor.png');
  await desktop.evaluate(({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    contents.sendInputEvent({ type: 'keyDown', keyCode: 'F11' });
    contents.sendInputEvent({ type: 'keyUp', keyCode: 'F11' });
  });
  assert.equal(await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), true);
  await page.locator('#help-button').click();
  await page.locator('#help-tab-usage').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#help-tab-credits').getAttribute('aria-selected'), 'true');
  await capture('creditos-tela-cheia.png');
  await page.keyboard.press('Escape');
  assert.equal(await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), true);
  checks.push('Novos assets carregados; quatro telas; créditos offline; janela menor e tela cheia.');
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(path.join(output, 'resultado.json'), JSON.stringify({ packaged, checks, loadedAssets, errors, requests, scope: 'verificação pontual; suíte completa não executada' }, null, 2));
  console.log(checks.join('\n'));
} finally { await desktop.close(); }
