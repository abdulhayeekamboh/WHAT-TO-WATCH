/* Shared engine: query parser, TMDB data, showcase UI, details panel. Exposes window.WTW */
(() => {
  const IMG = 'https://image.tmdb.org/t/p/';
  const cache = new Map();
  const store = { get: k => new Promise(r => chrome.storage.sync.get(k, v => r(v[k]))) };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function api(path, params = {}) {
    const k = path + JSON.stringify(params);
    if (cache.has(k)) return cache.get(k);
    const p = new Promise((res, rej) => {
      try {
        chrome.runtime.sendMessage({ type: 'tmdb', path, params }, r => {
          if (chrome.runtime.lastError || !r || r.error) { cache.delete(k); rej(new Error(r?.error || 'EXT_ERROR')); }
          else res(r.data);
        });
      } catch (e) { cache.delete(k); rej(e); }
    });
    cache.set(k, p);
    return p;
  }

  const LANGS = {
    kdrama: 'ko', kdramas: 'ko', korean: 'ko', kmovie: 'ko', jdrama: 'ja', jdramas: 'ja', japanese: 'ja', anime: 'ja',
    cdrama: 'zh', cdramas: 'zh', chinese: 'zh', mandarin: 'zh', turkish: 'tr', thai: 'th', hindi: 'hi', bollywood: 'hi',
    indian: 'hi', tamil: 'ta', telugu: 'te', pakistani: 'ur', urdu: 'ur', spanish: 'es', french: 'fr', german: 'de',
    italian: 'it', arabic: 'ar', english: 'en', hollywood: 'en', russian: 'ru', filipino: 'tl', indonesian: 'id'
  };
  const LANG_OPTS = [['', 'Any language'], ['en', 'English'], ['ko', 'Korean'], ['ja', 'Japanese'], ['zh', 'Chinese'], ['hi', 'Hindi'],
    ['ur', 'Urdu'], ['tr', 'Turkish'], ['th', 'Thai'], ['ta', 'Tamil'], ['te', 'Telugu'], ['es', 'Spanish'], ['fr', 'French'],
    ['de', 'German'], ['it', 'Italian'], ['ar', 'Arabic'], ['ru', 'Russian']];
  const REGIONS = ['US', 'GB', 'PK', 'IN', 'CA', 'AU', 'AE', 'SA', 'DE', 'FR', 'KR', 'JP', 'TR', 'ES', 'IT', 'BR', 'MX'];
  const SYN = { romantic: 'romance', funny: 'comedy', scary: 'horror', 'sci-fi': 'science fiction', scifi: 'science fiction',
    cartoon: 'animation', anime: 'animation', kids: 'family', 'true crime': 'crime', historical: 'history' };
  const TV_W = ['drama', 'dramas', 'series', 'show', 'shows', 'kdrama', 'kdramas', 'cdrama', 'cdramas', 'jdrama', 'jdramas', 'anime', 'sitcom', 'tv'];
  const MV_W = ['movie', 'movies', 'film', 'films', 'kmovie'];
  const INTENT = ['best', 'top', 'new', 'latest', 'popular', 'list', 'upcoming', 'trending', 'recommended', 'must', 'watch', 'good', 'greatest'];
  const BLOCK = /\b(how|why|who|when|where|review|reviews|cast|trailer|ending|explained|episode|episodes|season|wiki|script|write|making|meaning|download)\b/;

  /** Turns a Google-style query into a discover state, or null when it isn't a "what to watch" query. */
  async function resolve(q) {
    const s = ' ' + q.toLowerCase().replace(/[^a-z0-9\s&-]/g, ' ').replace(/\s+/g, ' ') + ' ';
    const words = s.trim().split(' ');
    if (words.length > 8 || BLOCK.test(s)) return null;
    const w = new Set(words);
    const wtw = s.includes(' what to watch ');
    const isTv = TV_W.some(x => w.has(x)), isMv = MV_W.some(x => w.has(x));
    if (!isTv && !isMv && !wtw) return null;

    let lang = '';
    for (const [k, v] of Object.entries(LANGS)) if (w.has(k)) { lang = v; break; }
    const ym = s.match(/\b(19[5-9]\d|20[0-3]\d)\b/);
    const year = ym ? ym[1] : '';
    const type = isTv ? 'tv' : 'movie';
    let gs = s;
    for (const [k, v] of Object.entries(SYN)) if (s.includes(' ' + k + ' ')) gs += v + ' ';

    let genres = [];
    try {
      const list = (await api(`/genre/${type}/list`, { language: 'en' })).genres;
      genres = list.filter(g => g.name.toLowerCase().split(/\s*[&,]\s*/).some(n => gs.includes(' ' + n + ' '))).map(g => g.id);
    } catch (e) { /* no key yet: mount() will show the setup prompt */ }

    const intent = year || lang || wtw || INTENT.some(x => w.has(x)) || genres.some(id => id !== 18);
    if (!intent) return null;
    const sort = /\b(new|latest|upcoming|recent)\b/.test(s) ? 'date' : /\b(best|top|greatest|highest)\b/.test(s) ? 'rating' : 'popular';
    return { type, lang, year, genres, sort };
  }

  async function discover(st, page) {
    const dk = st.type === 'tv' ? 'first_air_date' : 'primary_release_date';
    const today = new Date().toISOString().slice(0, 10);
    const params = {
      page, language: 'en-US', include_adult: 'false', with_original_language: st.lang,
      with_genres: st.genres.join(','), watch_region: st.region,
      sort_by: st.sort === 'rating' ? 'vote_average.desc' : st.sort === 'date' ? dk + '.desc' : 'popularity.desc',
      'vote_count.gte': st.sort === 'rating' ? 300 : st.sort === 'date' ? 5 : 10
    };
    if (st.year) params[st.type === 'tv' ? 'first_air_date_year' : 'primary_release_year'] = st.year;
    if (st.sort === 'date' && !st.year) params[dk + '.lte'] = today;
    return api('/discover/' + st.type, params);
  }

  const card = (r, type) => {
    const t = r.media_type || type;
    const title = r.title || r.name || '';
    const yr = (r.release_date || r.first_air_date || '').slice(0, 4);
    return `<button class="wtw-card" data-id="${r.id}" data-type="${t}" title="${esc(title)}">
      <div class="wtw-poster">${r.poster_path ? `<img loading="lazy" src="${IMG}w342${r.poster_path}" alt="">` : '<span>No image</span>'}</div>
      <div class="wtw-ct">${esc(title)}</div>
      <div class="wtw-cs">${r.vote_average ? '<span class="wtw-star">★</span> ' + r.vote_average.toFixed(1) : ''}${r.vote_average && yr ? ' · ' : ''}${yr}</div>
    </button>`;
  };

  // ---------- Details panel (the "click a title, see everything" part) ----------
  function ensureOverlay() {
    let ov = document.querySelector('.wtw-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'wtw-overlay';
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.wtw-x')) ov.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ov.classList.remove('open'); });
    document.body.appendChild(ov);
    return ov;
  }

  async function openDetail(type, id, region) {
    const ov = ensureOverlay();
    ov.innerHTML = '<div class="wtw-panel"><button class="wtw-x" aria-label="Close">✕</button><div class="wtw-loading">Loading…</div></div>';
    ov.classList.add('open');
    let d;
    try {
      d = await api(`/${type}/${id}`, {
        language: 'en-US',
        append_to_response: 'credits,videos,watch/providers,recommendations,external_ids,' + (type === 'movie' ? 'release_dates' : 'content_ratings')
      });
    } catch (e) { ov.querySelector('.wtw-loading').textContent = 'Could not load details. ' + e.message; return; }

    const title = d.title || d.name, date = d.release_date || d.first_air_date || '', yr = date.slice(0, 4);
    let cert = '';
    if (type === 'movie') {
      const rs = d.release_dates?.results || [];
      const hit = rs.find(x => x.iso_3166_1 === region) || rs.find(x => x.iso_3166_1 === 'US');
      cert = hit?.release_dates?.find(x => x.certification)?.certification || '';
    } else {
      const rs = d.content_ratings?.results || [];
      cert = (rs.find(x => x.iso_3166_1 === region) || rs.find(x => x.iso_3166_1 === 'US'))?.rating || '';
    }
    const length = type === 'movie'
      ? (d.runtime ? Math.floor(d.runtime / 60) + 'h ' + (d.runtime % 60) + 'm' : '')
      : `${d.number_of_seasons} season${d.number_of_seasons === 1 ? '' : 's'} · ${d.number_of_episodes} episodes`;
    const meta = [yr, cert, length, (d.genres || []).map(g => g.name).join(', ')].filter(Boolean).map(esc).join(' · ');
    const trailer = (d.videos?.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer') || (d.videos?.results || []).find(v => v.site === 'YouTube');
    const crew = d.credits?.crew || [];
    const dirs = type === 'movie' ? crew.filter(c => c.job === 'Director').map(c => c.name) : (d.created_by || []).map(c => c.name);
    const wp = d['watch/providers']?.results?.[region];
    const prov = (label, arr) => arr?.length ? `<div class="wtw-prow"><span>${label}</span>${arr.map(p =>
      `<img class="wtw-logo" title="${esc(p.provider_name)}" alt="${esc(p.provider_name)}" src="${IMG}w92${p.logo_path}">`).join('')}</div>` : '';
    const where = wp ? (prov('Stream', wp.flatrate) + prov('Rent', wp.rent) + prov('Buy', wp.buy) + prov('Free', wp.free))
      : '';
    const cast = (d.credits?.cast || []).slice(0, 14).map(c => `<a class="wtw-person" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(c.name + ' actor')}">
      ${c.profile_path ? `<img loading="lazy" src="${IMG}w185${c.profile_path}" alt="">` : `<div class="wtw-noface">${esc(c.name[0])}</div>`}
      <b>${esc(c.name)}</b><small>${esc(c.character || '')}</small></a>`).join('');
    const recs = (d.recommendations?.results || []).filter(r => r.poster_path).slice(0, 12).map(r => card(r, type)).join('');
    const imdb = d.external_ids?.imdb_id;
    const back = d.backdrop_path ? `${IMG}w780${d.backdrop_path}` : '';

    ov.querySelector('.wtw-panel').innerHTML = `
      <button class="wtw-x" aria-label="Close">✕</button>
      <div class="wtw-hero" style="${back ? `background-image:linear-gradient(transparent 30%,var(--wtw-bg)),url(${back})` : ''}"></div>
      <div class="wtw-dbody">
        <div class="wtw-top">
          ${d.poster_path ? `<img class="wtw-dposter" src="${IMG}w342${d.poster_path}" alt="">` : ''}
          <div>
            <h2>${esc(title)}</h2>
            <div class="wtw-meta">${meta}</div>
            ${d.tagline ? `<div class="wtw-tag">${esc(d.tagline)}</div>` : ''}
            <div class="wtw-scores">
              <span class="wtw-badge"><span class="wtw-star">★</span> ${d.vote_average ? d.vote_average.toFixed(1) : '–'}/10 <small>TMDB · ${d.vote_count || 0} votes</small></span>
              ${d.status ? `<span class="wtw-badge">${esc(d.status)}</span>` : ''}
            </div>
            <div class="wtw-actions">
              ${trailer ? `<a class="wtw-btn wtw-primary" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${trailer.key}">▶ Trailer</a>` : ''}
              ${wp?.link ? `<a class="wtw-btn" target="_blank" rel="noopener" href="${wp.link}">Where to watch</a>` : ''}
              ${imdb ? `<a class="wtw-btn" target="_blank" rel="noopener" href="https://www.imdb.com/title/${imdb}/">IMDb</a>` : ''}
              <a class="wtw-btn" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(title + ' ' + yr)}">Search Google</a>
            </div>
          </div>
        </div>
        <h3>Where to watch <small>(${esc(region)})</small></h3>
        ${where || '<p class="wtw-muted">No streaming info for this region yet. Change region in the extension settings.</p>'}
        <h3>Overview</h3><p>${esc(d.overview || 'No overview available.')}</p>
        <div class="wtw-facts">
          ${dirs.length ? `<div><b>${type === 'movie' ? 'Director' : 'Created by'}</b> ${esc(dirs.join(', '))}</div>` : ''}
          <div><b>Original language</b> ${esc((LANG_OPTS.find(l => l[0] === d.original_language) || [0, d.original_language])[1])}</div>
          ${date ? `<div><b>${type === 'movie' ? 'Release date' : 'First aired'}</b> ${esc(date)}</div>` : ''}
          ${(d.networks || []).length ? `<div><b>Network</b> ${esc(d.networks.map(n => n.name).join(', '))}</div>` : ''}
          ${(d.production_companies || []).length ? `<div><b>Studio</b> ${esc(d.production_companies.slice(0, 3).map(n => n.name).join(', '))}</div>` : ''}
        </div>
        ${cast ? `<h3>Cast</h3><div class="wtw-strip">${cast}</div>` : ''}
        ${recs ? `<h3>More like this</h3><div class="wtw-strip wtw-recs">${recs}</div>` : ''}
      </div>`;
    ov.querySelector('.wtw-panel').scrollTop = 0;
    ov.querySelector('.wtw-recs')?.addEventListener('click', e => {
      const c = e.target.closest('.wtw-card'); if (c) openDetail(c.dataset.type, c.dataset.id, region);
    });
  }

  // ---------- Showcase (chips + filters + carousel/grid) ----------
  async function mount(el, opts = {}) {
    const compact = !!opts.compact;
    const st = Object.assign({ type: 'movie', lang: '', year: '', genres: [], sort: 'popular', region: 'US', page: 1, total: 1, loading: false, mode: 'discover', q: '' }, opts.state || {});
    st.region = (await store.get('region')) || 'US';
    const thisYear = new Date().getFullYear();
    const years = ['<option value="">Any year</option>'].concat(Array.from({ length: thisYear + 1 - 1979 }, (_, i) => thisYear + 1 - i).map(y => `<option>${y}</option>`)).join('');

    el.innerHTML = `<div class="wtw-root ${compact ? 'wtw-compact' : 'wtw-full'}">
      <div class="wtw-head">
        <div class="wtw-title"><b>What to watch</b><small class="wtw-sub"></small></div>
        <div class="wtw-tabs"><button data-t="movie">Movies</button><button data-t="tv">TV shows</button></div>
        ${compact ? '<a class="wtw-fullink" href="#">Open full page</a>' : ''}
      </div>
      <div class="wtw-chips"></div>
      <div class="wtw-filters">
        <select data-f="lang">${LANG_OPTS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select>
        <select data-f="year">${years}</select>
        <select data-f="sort"><option value="popular">Most popular</option><option value="rating">Top rated</option><option value="date">Newest</option></select>
      </div>
      <div class="wtw-body"><button class="wtw-arrow wtw-l" aria-label="Previous">‹</button><div class="wtw-track"></div><button class="wtw-arrow wtw-r" aria-label="Next">›</button></div>
      <div class="wtw-more"><button class="wtw-btn">Show more</button></div>
    </div>`;
    const $ = s => el.querySelector(s), track = $('.wtw-track'), chips = $('.wtw-chips'), root = $('.wtw-root');
    let genreList = [];

    const sync = async () => {
      el.querySelectorAll('.wtw-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === st.type));
      el.querySelectorAll('[data-f]').forEach(s => s.value = st[s.dataset.f]);
      root.classList.toggle('wtw-search', st.mode === 'search');
      try { genreList = (await api(`/genre/${st.type}/list`, { language: 'en' })).genres; } catch (e) { genreList = []; }
      chips.innerHTML = `<button class="wtw-chip ${st.genres.length ? '' : 'on'}" data-g="">All</button>` +
        genreList.map(g => `<button class="wtw-chip ${st.genres.includes(g.id) ? 'on' : ''}" data-g="${g.id}">${esc(g.name)}</button>`).join('');
      const bits = [(LANG_OPTS.find(l => l[0] === st.lang) || [])[1] && st.lang ? LANG_OPTS.find(l => l[0] === st.lang)[1] : '', st.year,
        ...st.genres.map(id => genreList.find(g => g.id === id)?.name)].filter(Boolean);
      $('.wtw-sub').textContent = st.mode === 'search' ? `Results for “${st.q}”` : bits.join(' · ');
    };

    const more = () => { $('.wtw-more').style.display = (!compact && st.page < st.total && !st.loading && st.mode === 'discover') ? 'flex' : 'none'; };

    async function load(reset) {
      if (st.loading) return;
      st.loading = true;
      if (reset) { st.page = 1; track.scrollLeft = 0; track.innerHTML = Array(10).fill('<div class="wtw-card wtw-skel"><div class="wtw-poster"></div></div>').join(''); }
      else st.page++;
      try {
        let data;
        if (st.mode === 'search') {
          data = await api('/search/multi', { query: st.q, page: st.page, include_adult: 'false', language: 'en-US' });
          data.results = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
        } else data = await discover(st, st.page);
        st.total = data.total_pages || 1;
        if (reset) track.innerHTML = '';
        track.insertAdjacentHTML('beforeend', data.results.filter(r => r.poster_path).map(r => card(r, st.type)).join(''));
        if (!track.children.length) track.innerHTML = '<div class="wtw-empty">Nothing found. Try another genre, year or language.</div>';
      } catch (e) {
        const setup = e.message === 'NO_KEY' || e.message === 'BAD_KEY';
        track.innerHTML = setup
          ? `<div class="wtw-empty">${e.message === 'BAD_KEY' ? 'Your TMDB key was rejected.' : 'One-time setup needed.'} <a href="#" class="wtw-setup">Add your free TMDB API key</a></div>`
          : `<div class="wtw-empty">Could not load titles (${esc(e.message)}).</div>`;
      }
      st.loading = false; more();
    }

    // events
    el.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('.wtw-setup')) { e.preventDefault(); chrome.runtime.sendMessage({ type: 'options' }); return; }
      if (t.closest('.wtw-fullink')) { e.preventDefault(); chrome.runtime.sendMessage({ type: 'open', q: opts.query || '' }); return; }
      const tab = t.closest('.wtw-tabs button');
      if (tab && tab.dataset.t !== st.type) { st.type = tab.dataset.t; st.genres = []; st.mode = 'discover'; sync().then(() => load(true)); return; }
      const chip = t.closest('.wtw-chip');
      if (chip) {
        const id = chip.dataset.g ? +chip.dataset.g : null;
        st.genres = id == null || (st.genres.length === 1 && st.genres[0] === id) ? [] : [id];
        st.mode = 'discover'; sync().then(() => load(true)); return;
      }
      const c = t.closest('.wtw-card');
      if (c && !c.classList.contains('wtw-skel')) return openDetail(c.dataset.type, c.dataset.id, st.region);
      if (t.closest('.wtw-r')) track.scrollBy({ left: track.clientWidth * 0.85, behavior: 'smooth' });
      if (t.closest('.wtw-l')) track.scrollBy({ left: -track.clientWidth * 0.85, behavior: 'smooth' });
      if (t.closest('.wtw-more button')) load(false);
    });
    el.querySelectorAll('[data-f]').forEach(s => s.addEventListener('change', () => { st[s.dataset.f] = s.value; st.mode = 'discover'; sync().then(() => load(true)); }));
    if (compact) track.addEventListener('scroll', () => {
      if (track.scrollLeft + track.clientWidth > track.scrollWidth - 500 && st.page < st.total && !st.loading) load(false);
    }, { passive: true });

    await sync(); await load(true);
    return {
      async apply(r) { Object.assign(st, r, { mode: 'discover' }); await sync(); await load(true); },
      async searchText(q) { st.mode = 'search'; st.q = q; await sync(); await load(true); }
    };
  }

  window.WTW = { resolve, mount, openDetail, api, LANG_OPTS, REGIONS };
})();
