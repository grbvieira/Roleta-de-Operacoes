import assert from 'node:assert/strict';

async function activitySnapshot(page) {
  return page.evaluate(() => ({
    menu: document.querySelector('#menu-screen').hidden,
    game: document.querySelector('#game-screen').hidden,
    rotation: document.querySelector('#wheel').dataset.rotation,
    selected: document.querySelector('#wheel').dataset.selectedIndex,
    sectors: document.querySelector('#rotor').innerHTML,
    problem: document.querySelector('#selected-problem').innerHTML,
    problemId: document.querySelector('#selected-problem').dataset.problem,
    responseDisabled: document.querySelector('#answer-button').disabled,
    responseLabel: document.querySelector('#answer-button').textContent,
    summary: document.querySelector('#settings-summary').textContent,
    storage: { ...localStorage }
  }));
}

export async function checkHelpKeepsActivity(page) {
  const before = await activitySnapshot(page);
  await page.locator('#help-button').click();
  assert.equal(await page.locator('#help-dialog').isVisible(), true);
  for (const section of ['about', 'privacy', 'usage']) {
    await page.locator(`#help-tab-${section}`).click();
    assert.equal(await page.locator(`#help-${section}`).isVisible(), true);
  }
  await page.locator('#close-help').click();
  assert.equal(await page.locator('#help-dialog').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'help-button');
  assert.deepEqual(await activitySnapshot(page), before, 'ajuda não pode alterar contas, seleção, resposta ou configurações');
}

export async function checkHelpInterface({ page, desktop, capture }) {
  assert.equal(await page.locator('#help-button').isVisible(), true);
  const runtime = await desktop.evaluate(({ app, BrowserWindow }) => {
    const prefs = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { version: app.getVersion(), node: prefs.nodeIntegration, sandbox: prefs.sandbox, isolated: prefs.contextIsolation };
  });
  assert.equal(runtime.node, false);
  assert.equal(runtime.sandbox, true);
  assert.equal(runtime.isolated, true);
  assert.deepEqual(await page.evaluate(() => Object.keys(window.roletaDesktop).sort()), ['copyContactEmail', 'exitFullscreen', 'getVersion']);
  await page.locator('#help-button').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'help-tab-usage');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#help-tab-about').getAttribute('aria-selected'), 'true');
  await page.waitForFunction(version => document.querySelector('#app-version').textContent === `Versão ${version}`, runtime.version);
  assert.match(await page.locator('#help-about').textContent(), /Professor Arnaldo Macedo Vieira/);
  assert.match(await page.locator('#help-about').textContent(), /Desenvolvido por Gerson Vieira/);
  assert.equal(await page.locator('#contact-email').textContent(), 'gersonrbvieira@gmail.com');
  assert.equal(await page.locator('#contact-email').evaluate(element => getComputedStyle(element).userSelect), 'text');

  // Exercise the actual IPC without overwriting the user's Windows clipboard.
  await desktop.evaluate(({ clipboard }) => {
    globalThis.helpClipboardOriginal = clipboard.writeText;
    globalThis.helpClipboardWrites = [];
    clipboard.writeText = text => { globalThis.helpClipboardWrites.push(text); };
  });
  try {
    assert.deepEqual(await desktop.evaluate(() => globalThis.helpClipboardWrites), []);
    await page.locator('#copy-email').click();
    await page.waitForFunction(() => document.querySelector('#copy-email-status').textContent === 'E-mail copiado.');
    assert.deepEqual(await desktop.evaluate(() => globalThis.helpClipboardWrites), ['gersonrbvieira@gmail.com']);
    // No caller-supplied text is accepted by the bridge.
    await page.evaluate(() => window.roletaDesktop.copyContactEmail('outro-endereco@example.test'));
    assert.deepEqual(await desktop.evaluate(() => globalThis.helpClipboardWrites), ['gersonrbvieira@gmail.com', 'gersonrbvieira@gmail.com']);
    await capture('05-ajuda-sobre.png');
    await desktop.evaluate(({ clipboard }) => { clipboard.writeText = () => { throw new Error('Falha de cópia simulada'); }; });
    await page.locator('#copy-email').click();
    await page.waitForFunction(() => document.querySelector('#copy-email-status').textContent.includes('copie manualmente'));
  } finally {
    await desktop.evaluate(({ clipboard }) => {
      clipboard.writeText = globalThis.helpClipboardOriginal;
      delete globalThis.helpClipboardOriginal;
      delete globalThis.helpClipboardWrites;
    });
  }

  await page.locator('#help-tab-about').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#help-tab-privacy').getAttribute('aria-selected'), 'true');
  await capture('06-ajuda-privacidade.png');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#help-tab-usage').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#help-tab-privacy').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#help-tab-usage').getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('#help-tab-usage').evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
  for (const key of [...Array(8).fill('Tab'), ...Array(8).fill('Shift+Tab')]) {
    await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => document.querySelector('#help-dialog').contains(document.activeElement)), true, 'foco deve ficar no diálogo');
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#help-dialog').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'help-button');

  await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(960, 680));
  await page.waitForFunction(() => innerWidth === 960);
  await page.locator('#help-button').click();
  await capture('07-ajuda-como-usar.png');
  await page.locator('#help-usage').focus();
  await page.keyboard.press('PageDown');
  await page.waitForFunction(() => document.querySelector('.help-content').scrollTop > 0);
  const layout = await page.locator('#help-dialog').evaluate(dialog => {
    const rect = dialog.getBoundingClientRect();
    const close = document.querySelector('#close-help').getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth &&
      close.top >= 0 && close.bottom <= innerHeight && dialog.scrollWidth <= dialog.clientWidth;
  });
  assert.equal(layout, true, 'ajuda deve caber na janela e manter o botão fechar acessível');
  await page.keyboard.press('Escape');

  const fullscreen = () => desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen());
  // CDP keyboard events skip Electron's before-input-event. Use native input
  // for F11 so this exercises the production shortcut handler as well.
  const pressF11 = () => desktop.evaluate(({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    contents.sendInputEvent({ type: 'keyDown', keyCode: 'F11' });
    contents.sendInputEvent({ type: 'keyUp', keyCode: 'F11' });
  });
  async function waitFullscreen(expected) {
    let previousBounds;
    let stable = 0;
    for (let attempt = 0; attempt < 60; attempt++) {
      const bounds = await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getContentBounds());
      const serialized = JSON.stringify(bounds);
      stable = await fullscreen() === expected && serialized === previousBounds ? stable + 1 : 0;
      previousBounds = serialized;
      // Windows may finish restoring bounds after isFullScreen changes.
      if (stable >= 5) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(await fullscreen(), expected, 'estado de tela cheia incorreto');
  }
  await pressF11();
  await waitFullscreen(true);
  await page.locator('#help-button').click();
  await page.keyboard.down('Escape');
  await page.keyboard.down('Escape'); // auto-repeat must not exit fullscreen
  await page.keyboard.up('Escape');
  assert.equal(await page.locator('#help-dialog').isVisible(), false);
  assert.equal(await fullscreen(), true, 'Escape deve fechar apenas a ajuda');
  await page.keyboard.press('Escape');
  await waitFullscreen(false);
  await page.locator('button[data-operation="addition"]').click();
  await pressF11();
  await waitFullscreen(true);
  await page.locator('#settings-button').click();
  await page.evaluate(() => document.querySelector('#help-button').click());
  assert.equal(await page.locator('#help-dialog').isVisible(), false, 'não pode empilhar ajuda e ajustes');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#settings-dialog').isVisible(), false);
  assert.equal(await fullscreen(), true, 'Escape deve fechar apenas os ajustes');
  await page.locator('#help-button').click();
  await page.evaluate(() => document.querySelector('#settings-button').click());
  assert.equal(await page.locator('#settings-dialog').isVisible(), false);
  await page.locator('#close-help').click();
  await pressF11();
  await waitFullscreen(false);
  await page.locator('#back-button').click();
  await desktop.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1280, 960));
  await page.waitForFunction(() => innerWidth === 1280);
  await checkHelpKeepsActivity(page);
}
