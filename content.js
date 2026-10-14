// Runs on Google results pages: detects "kdrama 2025", "best horror movies", etc. and injects the showcase.
(async () => {
  const p = new URLSearchParams(location.search);
  const q = p.get('q');
  if (!q || p.get('tbm')) return;              // ignore images/news/video tabs
  const r = await WTW.resolve(q).catch(() => null);
  if (!r) return;

  const host = await new Promise(res => {
    const find = () => document.querySelector('#center_col') || document.querySelector('#rcnt');
    if (find()) return res(find());
    const mo = new MutationObserver(() => { if (find()) { mo.disconnect(); res(find()); } });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { mo.disconnect(); res(find()); }, 6000);
  });
  if (!host || document.getElementById('wtw-host')) return;

  const box = document.createElement('div');
  box.id = 'wtw-host';
  host.prepend(box);
  WTW.mount(box, { compact: true, state: r, query: q });
})();
