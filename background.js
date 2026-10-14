const BASE = 'https://api.themoviedb.org/3';

chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: chrome.runtime.getURL('app.html') }));
chrome.runtime.onInstalled.addListener(d => { if (d.reason === 'install') chrome.runtime.openOptionsPage(); });

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (msg.type === 'open') {
    const q = msg.q ? '?q=' + encodeURIComponent(msg.q) : '';
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + q });
    return;
  }
  if (msg.type === 'options') { chrome.runtime.openOptionsPage(); return; }
  if (msg.type !== 'tmdb') return;

  (async () => {
    const { tmdbKey } = await chrome.storage.sync.get('tmdbKey');
    if (!tmdbKey) return send({ error: 'NO_KEY' });
    const url = new URL(BASE + msg.path);
    const headers = {};
    if (tmdbKey.length > 40) headers.Authorization = 'Bearer ' + tmdbKey;   // v4 token
    else url.searchParams.set('api_key', tmdbKey);                          // v3 key
    for (const [k, v] of Object.entries(msg.params || {}))
      if (v !== '' && v != null) url.searchParams.set(k, v);
    try {
      const r = await fetch(url, { headers });
      if (r.status === 401) return send({ error: 'BAD_KEY' });
      if (!r.ok) return send({ error: 'HTTP ' + r.status });
      send({ data: await r.json() });
    } catch (e) { send({ error: String(e) }); }
  })();
  return true; // async response
});
