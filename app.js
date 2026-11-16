(() => {
  const root = document.currentScript.dataset.root;
  const siteRoot = new URL(root || './', location.href);
  const withinSite = value => value.protocol === siteRoot.protocol && value.host === siteRoot.host && value.pathname.startsWith(siteRoot.pathname);
  // Preserve the route used to reach a resource, including its source section.
  try {
    const previous = JSON.parse(sessionStorage.getItem('rdm-navigation') || 'null');
    if (previous && previous.destination === location.pathname) {
      const origin = new URL(previous.source);
      if (withinSite(origin) && origin.pathname !== location.pathname) {
        const back = document.querySelector('#return-context');
        back.href = origin.href;
        back.textContent = '← Regressar a: ' + previous.title;
        back.hidden = false;
      }
    }
  } catch (_) { /* Direct-file browsers may disable browser storage. */ }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    if (!withinSite(destination) || destination.pathname === location.pathname || !destination.pathname.endsWith('.html')) return;
    let heading;
    if (link.closest('article')) {
      for (const candidate of document.querySelectorAll('article h2[id]')) {
        if (candidate.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING) heading = candidate;
      }
    }
    const source = new URL(location.href);
    if (heading) source.hash = heading.id;
    const title = document.querySelector('h1').textContent + (heading ? ' — ' + heading.textContent : '');
    try { sessionStorage.setItem('rdm-navigation', JSON.stringify({destination: destination.pathname, source: source.href, title})); } catch (_) {}
  });
  const current = document.querySelector('#sidebar a[aria-current="page"]');
  if (current) {
    const sidebar = document.querySelector('#sidebar');
    sidebar.scrollTop = Math.max(0, current.offsetTop - sidebar.clientHeight / 2);
  }
  const field = document.querySelector('#search');
  const results = document.querySelector('#results');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const data = (window.SEARCH_DATA || []).map(page => ({...page, normalized: normalize(page.title + ' ' + page.text)}));
  field.addEventListener('input', () => {
    const query = normalize(field.value.trim());
    results.replaceChildren();
    results.hidden = !query;
    if (!query) return;
    const words = query.split(/\s+/);
    const matches = data.filter(page => words.every(word => page.normalized.includes(word)))
      .sort((a, b) => Number(normalize(b.title).includes(query)) - Number(normalize(a.title).includes(query)));
    const count = document.createElement('p');
    count.setAttribute('role', 'status');
    count.textContent = matches.length ? `${matches.length} páginas encontradas` : 'Sem resultados. Experimente outro termo.';
    results.append(count);
    matches.slice(0, 30).forEach(page => {
      const link = document.createElement('a');
      link.href = root + page.url;
      link.textContent = page.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = page.url.startsWith('ferramentas/') ? 'Ficha de ferramenta ou recurso' : page.url.startsWith('perfis/') ? 'Perfil' : page.url.startsWith('fases-dados/') ? 'Fase do ciclo dos dados' : page.url.startsWith('fases-projeto/') ? 'Fase do ciclo do projeto' : 'Página da base de conhecimento';
      link.append(subtitle);
      results.append(link);
    });
  });
  field.addEventListener('keydown', e => {
    if (e.key === 'Escape') { results.hidden = true; field.blur(); }
    if (e.key === 'ArrowDown') { const first=results.querySelector('a'); if(first){e.preventDefault();first.focus();} }
    if (e.key === 'Enter') { const first=results.querySelector('a'); if(first) first.click(); }
  });
  results.addEventListener('keydown', e => {
    const links=[...results.querySelectorAll('a')];const i=links.indexOf(document.activeElement);
    if(e.key==='ArrowDown' && i<links.length-1){e.preventDefault();links[i+1].focus();}
    if(e.key==='ArrowUp'){e.preventDefault();i>0?links[i-1].focus():field.focus();}
    if(e.key==='Escape'){results.hidden=true;field.focus();}
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) results.hidden = true; });
  const menu = document.querySelector('#menu');
  menu.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar navegação' : 'Abrir navegação');
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && document.body.classList.contains('nav-open')){
      document.body.classList.remove('nav-open');
      menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label','Abrir navegação');
      menu.focus();
    }
  });
})();
