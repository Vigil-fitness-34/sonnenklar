// Kopiert die Web-App (../sonnenklar) nach web/, außer Service Worker und Doku.
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', '..', 'sonnenklar');
const dst = path.join(__dirname, '..', 'web');
if (!fs.existsSync(src)) { console.log('Kein ../sonnenklar gefunden, web/ bleibt wie es ist.'); process.exit(0); }
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: f => !/README\.md$|sw\.js$/.test(f) });
console.log('Web-App nach web/ kopiert.');
