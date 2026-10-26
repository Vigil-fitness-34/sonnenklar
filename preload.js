// Kleine, feste Brücke zwischen Web-App und Mac-Hülle. Mehr bekommt die Seite nicht.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonnenklarDesktop', {
  status: (text, tip) => ipcRenderer.send('status', { text: String(text), tip: String(tip) }),
  mini: () => ipcRenderer.send('mini'),
  focus: w => ipcRenderer.send('focus', w),
  onCommand: fn => ipcRenderer.on('command', (e, cmd) => fn(String(cmd)))
});
