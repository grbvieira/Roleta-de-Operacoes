export function initializeHelp({ canOpen }) {
  const dialog = document.getElementById('help-dialog');
  const opener = document.getElementById('help-button');
  const tabs = [...dialog.querySelectorAll('[role="tab"]')];
  const status = document.getElementById('copy-email-status');
  let returnFocus = opener;
  let copyPending = false;

  function selectTab(tab) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    }
    dialog.querySelector('.help-content').scrollTop = 0;
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  }

  opener.addEventListener('click', () => {
    if (!canOpen() || document.querySelector('dialog[open]')) return;
    returnFocus = opener;
    status.textContent = '';
    selectTab(tabs[0]);
    dialog.showModal();
    tabs[0].focus();
  });
  document.getElementById('close-help').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => returnFocus.focus({ preventScroll: true }));

  window.roletaDesktop.getVersion().then(version => {
    document.getElementById('app-version').textContent = `Versão ${version}`;
  }).catch(() => {
    document.getElementById('app-version').textContent = 'Não foi possível consultar a versão.';
  });

  document.getElementById('copy-email').addEventListener('click', async () => {
    if (copyPending) return;
    copyPending = true;
    status.textContent = 'Copiando e-mail…';
    try {
      await window.roletaDesktop.copyContactEmail();
      status.textContent = 'E-mail copiado.';
    } catch {
      status.textContent = 'Não foi possível copiar. Selecione o endereço e copie manualmente.';
    } finally {
      copyPending = false;
    }
  });

  // Handle Escape here, before the native dialog cancel action. One key press
  // closes only the dialog; holding it must not also leave fullscreen.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing) return;
    event.preventDefault();
    if (event.repeat) return;
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog) openDialog.close();
    else window.roletaDesktop.exitFullscreen().catch(() => {});
  });
}
