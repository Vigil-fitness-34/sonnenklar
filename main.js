// Sonnenklar für den Mac: Electron-Hülle um die Web-App in web/.
// Hauptfenster, schwebendes Mini-Widget und Routine-Stand in der Menüleiste.
const { app, BrowserWindow, protocol, net, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Eigenes Schema statt file://, damit localStorage dauerhaft und für beide Fenster gleich ist
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const WEB = path.join(__dirname, 'web');
const HOME = 'app://sonnenklar/';
let main = null, mini = null, tray = null;
let status = { text: '', tip: 'Sonnenklar' };

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => showMain());

function serve() {
  protocol.handle('app', req => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const file = path.join(WEB, path.normalize(p));
    if (!file.startsWith(WEB)) return new Response('Nicht gefunden', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

const webPrefs = () => ({ preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true });
function external(win) {
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith('app:')) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app:')) { e.preventDefault(); shell.openExternal(url); } });
}

function createMain() {
  main = new BrowserWindow({ width: 1180, height: 820, minWidth: 380, minHeight: 560, title: 'Sonnenklar', backgroundColor: '#eef0eb', show: false, webPreferences: webPrefs() });
  external(main);
  main.loadURL(HOME);
  main.once('ready-to-show', () => main.show());
  // Schließen versteckt nur, damit Menüleiste und Mini-Widget weiterlaufen
  main.on('close', e => { if (!app.isQuitting) { e.preventDefault(); main.hide(); } });
}
function showMain() {
  if (!main || main.isDestroyed()) createMain();
  if (main.isMinimized()) main.restore();
  main.show(); main.focus();
}
function toggleMini() {
  if (mini && !mini.isDestroyed()) { mini.close(); return; }
  mini = new BrowserWindow({ width: 340, height: 560, minWidth: 280, minHeight: 300, title: 'Sonnenklar Mini', alwaysOnTop: true, fullscreenable: false, minimizable: false, backgroundColor: '#eef0eb', webPreferences: webPrefs() });
  mini.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  external(mini);
  mini.loadURL(HOME + 'index.html?widget');
  mini.on('closed', () => { mini = null; buildMenu(); });
  buildMenu();
}
function command(cmd) { showMain(); main.webContents.send('command', cmd); }

function buildMenu() {
  const login = app.getLoginItemSettings().openAtLogin;
  const items = [
    { label: status.tip, enabled: false },
    { type: 'separator' },
    { label: 'Sonnenklar öffnen', click: showMain },
    { label: mini ? 'Mini-Widget schließen' : 'Mini-Widget öffnen', click: toggleMini },
    { type: 'separator' },
    { label: 'Morgenroutine starten', click: () => command('focus:m') },
    { label: 'Abendroutine starten', click: () => command('focus:e') },
    { label: 'Fokus-Timer', click: () => command('tab:aufgaben') },
    { type: 'separator' },
    { label: 'Beim Anmelden starten', type: 'checkbox', checked: login, click: i => { app.setLoginItemSettings({ openAtLogin: i.checked, openAsHidden: true }); } },
    { label: 'Beenden', click: () => { app.isQuitting = true; app.quit(); } }
  ];
  if (tray) tray.setContextMenu(Menu.buildFromTemplate(items));
  // Dock-Menü mit den wichtigsten Aktionen
  if (app.dock) app.dock.setMenu(Menu.buildFromTemplate(items.slice(2, 8)));
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'build', 'trayTemplate.png'));
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('Sonnenklar');
  buildMenu();
}

ipcMain.on('status', (e, s) => {
  if (!s || typeof s.text !== 'string') return;
  status = { text: s.text.slice(0, 12), tip: String(s.tip || 'Sonnenklar').slice(0, 80) };
  if (tray) { tray.setTitle(' ' + status.text); tray.setToolTip(status.tip); buildMenu(); }
});
ipcMain.on('mini', () => toggleMini());
ipcMain.on('focus', (e, w) => { if (w === 'm' || w === 'e') command('focus:' + w); });

app.whenReady().then(() => {
  serve();
  createMain();
  createTray();
  const appMenu = Menu.buildFromTemplate([
    { role: 'appMenu', label: 'Sonnenklar' },
    { role: 'editMenu', label: 'Bearbeiten' },
    { label: 'Fenster', submenu: [
      { label: 'Mini-Widget', accelerator: 'Cmd+Shift+M', click: toggleMini },
      { label: 'Morgenroutine starten', accelerator: 'Cmd+1', click: () => command('focus:m') },
      { label: 'Abendroutine starten', accelerator: 'Cmd+2', click: () => command('focus:e') },
      { type: 'separator' }, { role: 'minimize', label: 'Im Dock ablegen' }, { role: 'zoom', label: 'Zoomen' }, { role: 'reload', label: 'Neu laden' }
    ] }
  ]);
  Menu.setApplicationMenu(appMenu);
});
app.on('activate', showMain);
app.on('before-quit', () => { app.isQuitting = true; });
app.on('window-all-closed', e => e.preventDefault());
