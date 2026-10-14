const REG = ['US','GB','PK','IN','CA','AU','AE','SA','DE','FR','KR','JP','TR','ES','IT','BR','MX'];
const sel = document.getElementById('region');
sel.innerHTML = REG.map(r => `<option>${r}</option>`).join('');
chrome.storage.sync.get(['tmdbKey', 'region'], v => { document.getElementById('key').value = v.tmdbKey || ''; sel.value = v.region || 'US'; });
document.getElementById('save').onclick = () => {
  chrome.storage.sync.set({ tmdbKey: document.getElementById('key').value.trim(), region: sel.value }, () => {
    const ok = document.getElementById('ok'); ok.textContent = 'Saved. Reload your Google tab.'; setTimeout(() => ok.textContent = '', 3500);
  });
};
