const { app, BrowserWindow, Menu, protocol, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

// All content is shipped in app.asar. There is no web server or remote content.
const appRoot = path.join(__dirname, '..', 'app');
const testing = process.env.ROLETA_TEST === '1';
if (testing) console.log('[roleta] iniciando processo desktop');
if (testing && process.env.ROLETA_TEST_USER_DATA) {
  app.setPath('userData', process.env.ROLETA_TEST_USER_DATA);
}
app.commandLine.appendSwitch('disable-background-networking');
protocol.registerSchemesAsPrivileged([
  { scheme: 'roleta', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

async function serveLocal(request) {
  try {
    const url = new URL(request.url);
    if (url.hostname !== 'app' || request.method !== 'GET') return new Response(null, { status: 403 });
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(appRoot, '.' + relative);
    if (!file.startsWith(appRoot + path.sep) || !types[path.extname(file)]) {
      return new Response(null, { status: 403 });
    }
    return new Response(await fs.readFile(file), {
      headers: { 'Content-Type': types[path.extname(file)], 'X-Content-Type-Options': 'nosniff' }
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

function createWindow() {
  if (testing) console.log('[roleta] criando janela');
  const window = new BrowserWindow({
    width: 1360, height: 900, minWidth: 940, minHeight: 680,
    backgroundColor: '#f7f4ed', title: 'Roleta de Operações',
    icon: path.join(appRoot, 'assets', 'app.ico'),
    show: false, autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, spellcheck: false }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      event.preventDefault();
      window.setFullScreen(!window.isFullScreen());
    }
    if (input.type === 'keyDown' && input.key === 'Escape' && window.isFullScreen()) {
      window.setFullScreen(false);
    }
  });
  window.once('ready-to-show', () => { if (!testing) window.show(); });
  if (testing) {
    window.webContents.on('did-finish-load', () => console.log('[roleta] interface carregada'));
    window.webContents.on('did-fail-load', (_event, code, message) => console.error('[roleta] falha ao carregar', code, message));
  }
  window.loadURL('roleta://app/index.html');
}

app.whenReady().then(() => {
  if (testing) console.log('[roleta] Electron pronto');
  Menu.setApplicationMenu(null);
  protocol.handle('roleta', serveLocal);
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
    (_details, callback) => callback({ cancel: true })
  );
  if (testing && process.env.ROLETA_TEST_OFFLINE === '1') {
    session.defaultSession.enableNetworkEmulation({ offline: true });
  }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
