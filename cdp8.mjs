const pages = async () => (await (await fetch('http://127.0.0.1:9333/json/list')).json()).filter(x => x.type === 'page');
const conn = async t => { const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = {}; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) pend[m.id](m.result); }; await new Promise(r => ws.onopen = r); const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); }); return { ws, send, ev: async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value }; };
const ps = await pages();
const main = await conn(ps.find(p => !p.url.includes('widget'))), mini = await conn(ps.find(p => p.url.includes('widget')));
await mini.ev(`document.querySelector('.widget [data-act="focus"]').click()`);
await new Promise(r => setTimeout(r, 1500));
console.log('focus open in main:', await main.ev(`!document.getElementById('focus').hidden + ' ' + (document.querySelector('#focus .fstep')||{}).textContent`), '| mini focus:', await mini.ev(`!document.getElementById('focus').hidden`));
await main.ev(`document.querySelector('[data-act="fClose"]').click()`);
main.ws.close(); mini.ws.close();
