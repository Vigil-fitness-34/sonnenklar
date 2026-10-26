const pages = async () => (await (await fetch('http://127.0.0.1:9333/json/list')).json()).filter(x => x.type === 'page');
const conn = async t => { const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = {}; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) pend[m.id](m.result); }; await new Promise(r => ws.onopen = r); const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); }); return { ws, send, ev: async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value }; };
const ps = await pages();
const main = await conn(ps.find(p => !p.url.includes('widget'))), mini = await conn(ps.find(p => p.url.includes('widget')));
for (let k = 0; k < 3; k++) {
  await mini.ev(`document.querySelectorAll('.widget [data-act="toggleStep"]')[2].click()`);
  await new Promise(r => setTimeout(r, 1200));
  console.log('mini', await mini.ev(`document.querySelector('.widget .muted').textContent`), '| main', await main.ev(`document.querySelector('.prog b').textContent`));
}
await main.ev(`document.querySelectorAll('[data-act="toggleStep"]')[3].click()`);
await new Promise(r => setTimeout(r, 1200));
console.log('after main click: mini', await mini.ev(`document.querySelector('.widget .muted').textContent`), '| main', await main.ev(`document.querySelector('.prog b').textContent`));
main.ws.close(); mini.ws.close();
