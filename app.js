(async () => {
  const q0 = new URLSearchParams(location.search).get('q') || '';
  const input = document.getElementById('q');
  input.value = q0;
  const first = q0 ? await WTW.resolve(q0) : null;
  const ctl = await WTW.mount(document.getElementById('app'), { compact: false, state: first || {} });
  if (q0 && !first) ctl.searchText(q0);

  document.getElementById('f').addEventListener('submit', async e => {
    e.preventDefault();
    const q = input.value.trim(); if (!q) return;
    const r = await WTW.resolve(q);
    r ? ctl.apply(r) : ctl.searchText(q);   // list-style query → showcase, otherwise title search
  });
})();
