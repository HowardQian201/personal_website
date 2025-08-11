/* Personal site scripts — animations, rendering, and UX */
(function () {
  const root = document.documentElement;

  // Light-only: ensure any persisted theme is cleared
  document.body.removeAttribute('data-theme');
  try { localStorage.removeItem('theme'); } catch (_) {}

  // Smooth scroll with Lenis (fallback to default smooth behavior)
  let lenis;
  try {
    // eslint-disable-next-line no-undef
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  } catch (_) {}

  // Anchor navigation (supports #top and smooth scroll with Lenis)
  (function initAnchorNav() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        // Ignore just '#' without intention
        if (!href.startsWith('#')) return;
        const id = href.slice(1);
        if (href === '#' || id === '' || id === 'top') {
          e.preventDefault();
          if (lenis && typeof lenis.scrollTo === 'function') lenis.scrollTo(0, { offset: 0 });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          if (lenis && typeof lenis.scrollTo === 'function') lenis.scrollTo(target, { offset: 0 });
          else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  })();

  // GSAP animations
  try {
    // eslint-disable-next-line no-undef
    gsap.registerPlugin(ScrollTrigger);
    // Sync ScrollTrigger with Lenis if available
    try { if (lenis) lenis.on('scroll', () => ScrollTrigger.update()); } catch (_) {}
    // Sticky header: intro reveal and scroll progress
    // eslint-disable-next-line no-undef
    gsap.from('.nav', { y: -40, opacity: 0, duration: 0.6, ease: 'power2.out' });
    const progressEl = document.querySelector('.site-header .progress');
    if (progressEl) {
      // eslint-disable-next-line no-undef
      gsap.to(progressEl, {
        '--scroll-progress': 1,
        ease: 'none',
        scrollTrigger: { scrub: 0.2 }
      });
    }
    // Hero cascade
    // eslint-disable-next-line no-undef
    gsap.from('.hero .reveal', { y: 20, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1 });

    const animated = document.querySelectorAll('[data-animate]');
    animated.forEach((el) => {
      // eslint-disable-next-line no-undef
      gsap.fromTo(el,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          ease: 'power3.out',
          duration: 0.7,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }
      );
    });

    // Fancy parallax for orbs and avatar
    const parallaxTargets = ['.orb-a', '.orb-b', '.orb-c', '.avatar-wrap'];
    parallaxTargets.forEach((sel, i) => {
      // eslint-disable-next-line no-undef
      gsap.to(sel, {
        yPercent: (i % 2 === 0 ? -1 : 1) * 10,
        xPercent: (i % 2 === 0 ? 1 : -1) * 6,
        ease: 'none',
        scrollTrigger: { scrub: 0.4 },
      });
    });

    // Scroll stagger: cards, publications, gallery, timeline
    const staggerSel = ['.card', '.pub-card', '.gallery-item', '.timeline-item'];
    staggerSel.forEach((sel) => {
      // eslint-disable-next-line no-undef
      gsap.utils.toArray(sel).forEach((el) => {
        // eslint-disable-next-line no-undef
        gsap.fromTo(el,
          { y: 28, opacity: 0, rotateX: 8 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.9,
            ease: 'power3.out',
            transformPerspective: 800,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }
        );
      });
    });

    // Helper to initialize stagger animations within a container (for dynamic content)
    function initStaggersIn(root) {
      const targets = ['.card', '.pub-card', '.gallery-item', '.timeline-item'];
      targets.forEach((sel) => {
        gsap.utils.toArray(root.querySelectorAll(sel)).forEach((el) => {
          gsap.fromTo(el,
            { y: 28, opacity: 0, rotateX: 8 },
            {
              y: 0,
              opacity: 1,
              rotateX: 0,
              duration: 0.9,
              ease: 'power3.out',
              transformPerspective: 800,
              scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            }
          );
        });
      });
      ScrollTrigger.refresh();
    }

    // Section-based nav highlight with intersection-based approach
    const sections = gsap.utils.toArray('main section[id]');
    let currentActiveLink = null;
    
    function updateActiveNav() {
      const brandEl = document.querySelector('.site-header .brand');
      const heroEl = document.querySelector('main .hero');

      // If at (or very near) the top or hero is predominantly visible, highlight brand
      try {
        const doc = document.documentElement || document.body;
        const scrollPosTop = (window.pageYOffset || doc.scrollTop || 0) - (doc.clientTop || 0);
        let heroVisible = 0;
        if (heroEl) {
          const r = heroEl.getBoundingClientRect();
          const visibleHeight = Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top);
          heroVisible = Math.max(0, visibleHeight) / Math.min(r.height || 1, window.innerHeight || 1);
        }
        const nearTop = scrollPosTop <= 2 || heroVisible >= 0.5;
        if (nearTop) {
          // Clear nav link actives and set brand active
          document.querySelectorAll('.site-nav a').forEach((a) => a.classList.remove('active'));
          if (brandEl) brandEl.classList.add('active');
          currentActiveLink = null;
          return;
        }
      } catch (_) {}
      // If at (or within 2px of) the bottom of the page, force last section active (e.g., #contact)
      try {
        const doc = document.documentElement || document.body;
        const scrollPos = (window.pageYOffset || doc.scrollTop || 0) - (doc.clientTop || 0);
        const totalHeight = doc.scrollHeight || 0;
        const viewportHeight = window.innerHeight || 0;
        const atBottom = scrollPos + viewportHeight >= totalHeight - 2;
        if (atBottom && sections.length) {
          const lastSection = sections[sections.length - 1];
          const id = lastSection.getAttribute('id');
          const link = document.querySelector(`.site-nav a[href="#${id}"]`);
          if (link && link !== currentActiveLink) {
            document.querySelectorAll('.site-nav a').forEach((a) => a.classList.remove('active'));
            if (brandEl) brandEl.classList.remove('active');
            link.classList.add('active');
            currentActiveLink = link;
          }
          return;
        }
      } catch (_) {}

      let activeSection = null;
      let bestScore = -1;
      
      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionBottom = rect.bottom;
        const sectionHeight = rect.height;
        
        // Skip if section is completely out of view
        if (sectionBottom < 0 || sectionTop > window.innerHeight) return;
        
        // Calculate visibility score (0-1)
        const visibleHeight = Math.min(window.innerHeight, sectionBottom) - Math.max(0, sectionTop);
        const visibilityRatio = Math.max(0, visibleHeight) / Math.min(sectionHeight, window.innerHeight);
        
        // Bonus for sections in the upper half of viewport
        const centerY = sectionTop + sectionHeight / 2;
        const viewportCenter = window.innerHeight / 2;
        const centerBonus = centerY < viewportCenter ? 0.3 : 0;
        
        const score = visibilityRatio + centerBonus;
        
        if (score > bestScore) {
          bestScore = score;
          activeSection = sec;
        }
      });
      
      if (activeSection && bestScore > 0.1) {
        const id = activeSection.getAttribute('id');
        const link = document.querySelector(`.site-nav a[href="#${id}"]`);
        if (link && link !== currentActiveLink) {
          // Remove active from all nav links
          document.querySelectorAll('.site-nav a').forEach(a => a.classList.remove('active'));
          // Add active to current link
          if (brandEl) brandEl.classList.remove('active');
          link.classList.add('active');
          currentActiveLink = link;
        }
      }
    }
    
    // Update on scroll with throttling for better performance
    let scrollTimeout;
    function throttledUpdateNav() {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        updateActiveNav();
        scrollTimeout = null;
      }, 10);
    }
    
    window.addEventListener('scroll', throttledUpdateNav);
    ScrollTrigger.addEventListener('refresh', updateActiveNav);
    
    // Initial update
    updateActiveNav();

    // Section intro sequences for Experience, Projects, Gallery, Contact
    function sectionIntro(id, extraSelectors) {
      const targets = [
        `${id} .section-title`,
        `${id} .section-intro`,
        ...extraSelectors.map((s) => `${id} ${s}`),
      ].join(',');
      const els = Array.from(document.querySelectorAll(targets)).filter(Boolean);
      if (!els.length) return;
      // eslint-disable-next-line no-undef
      gsap.from(els, {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: id, start: 'top 78%', once: true },
      });
    }
    sectionIntro('#experience', ['.timeline']);
    sectionIntro('#projects', ['#project-grid']);
    sectionIntro('#gallery', ['#gallery-grid']);
    sectionIntro('#contact', ['p', '.cta']);

    // Scroll-driven background radial gradient centers
    const bodyEl = document.body;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const p = self.progress; // 0..1
        const x1 = -10 + 20 * p;   // -10% -> 10%
        const y1 = -10 + 30 * p;   // -10% -> 20%
        const x2 = 110 - 40 * p;   // 110% -> 70%
        const y2 = 0 + 30 * p;     // 0% -> 30%
        bodyEl.style.setProperty('--rg1x', x1 + '%');
        bodyEl.style.setProperty('--rg1y', y1 + '%');
        bodyEl.style.setProperty('--rg2x', x2 + '%');
        bodyEl.style.setProperty('--rg2y', y2 + '%');
      },
    });
  } catch (_) {
    // Fallback: reveal instantly
    document.querySelectorAll('[data-animate]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  // 3D tilt and spotlight
  function attachTilt(card) {
    const maxDeg = 6;
    function onMove(e) {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const rx = (-(dy / rect.height) * 2) * maxDeg;
      const ry = ((dx / rect.width) * 2) * maxDeg;
      card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    }
    function onLeave() {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    }
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  }
  document.querySelectorAll('.card-tilt').forEach(attachTilt);

  // Magnetic hover effect (nav links, buttons, social icons)
  const magneticTargets = document.querySelectorAll('[data-magnetic], .site-nav a');
  const magneticStrength = 24; // px
  const magneticRestMs = 120;
  magneticTargets.forEach((el) => {
    let rafId = 0;
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) - rect.width / 2;
      const relY = (e.clientY - rect.top) - rect.height / 2;
      const dx = Math.max(-magneticStrength, Math.min(magneticStrength, relX * 0.15));
      const dy = Math.max(-magneticStrength, Math.min(magneticStrength, relY * 0.15));
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    function onLeave() {
      if (rafId) cancelAnimationFrame(rafId);
      setTimeout(() => { el.style.transform = 'translate(0, 0)'; }, magneticRestMs);
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });

  // Render publications
  const pubList = document.getElementById('pub-list');
  fetch('data/publications.json')
    .then((r) => r.json())
    .then((items) => {
      if (!Array.isArray(items)) return;
    const html = items
          .sort((a, b) => (b.year || 0) - (a.year || 0))
          .map((p) => publicationItem(p))
          .join('');
      if (pubList) {
        pubList.innerHTML = html;
        pubList.querySelectorAll('.card-tilt').forEach(attachTilt);
        try { initStaggersIn(pubList); } catch (_) {}
      }
    })
    .catch(() => {
      if (pubList) pubList.innerHTML = '<p class="pub-meta">Add your publications to <code>data/publications.json</code>.</p>';
    });

  function publicationItem(p) {
    const img = p.image ? `<img class="thumb" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title || 'publication thumbnail')}"/>` : '';
    const links = linkBadge('PDF', p.links?.pdf)
      + linkBadge('arXiv', p.links?.arxiv)
      + linkBadge('DOI', p.links?.doi)
      + linkBadge('Scholar', p.links?.scholar) 
      + linkBadge('Code', p.links?.code)
      + linkBadge('Slides', p.links?.slides)
      + linkBadge('Video', p.links?.video);
    const authorsLine = p.authors ? `<div class="pub-authors">${formatAuthors(p.authors)}</div>` : '';
    const venueLine = p.venue ? `<div class="pub-venue"><em>${escapeHtml(p.venue)}</em></div>` : '';
    const yearLine = (p.year !== undefined && p.year !== null) ? `<div class="pub-year"><u>${escapeHtml(String(p.year))}</u></div>` : '';
    const tags = Array.isArray(p.tags) ? p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '';
    return `
      <article class="pub-card card-tilt">
        ${img}
        <div class="pub-body">
          <div class="pub-title">${escapeHtml(p.title || '')}</div>
          <div class="pub-meta">${authorsLine}${venueLine}${yearLine}</div>
          <div class="pub-actions">${links}</div>
          ${tags ? `<div class="pub-actions">${tags}</div>` : ''}
        </div>
      </article>
    `;
  }

  function formatAuthors(authors) {
    const safe = escapeHtml(String(authors));
    return safe.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  }

  // Render projects
  const projectGrid = document.getElementById('project-grid');
  if (projectGrid) {
    fetch('data/projects.json')
      .then((r) => r.json())
      .then((items) => {
        if (!Array.isArray(items)) {
          projectGrid.innerHTML = '';
          return;
        }
        let html = items
          .sort((a, b) => (b.year || 0) - (a.year || 0))
          .map((p) => projectItem(p))
          .join('');
        projectGrid.innerHTML = html;
        // Container is now visible by default (no data-animate)
        document.querySelectorAll('.card-tilt').forEach(attachTilt);
        try { initStaggersIn(projectGrid); } catch (_) {}
        // eslint-disable-next-line no-undef
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      })
      .catch(() => {
        projectGrid.innerHTML = '';
        // eslint-disable-next-line no-undef
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      });
  }

  function projectItem(p) {
    const imgSrc = p.image ? escapeHtml(p.image) : '';
    const media = imgSrc ? `<div class="media"><img src="${imgSrc}" alt="${escapeHtml(p.name || 'Project preview')}"/></div>` : '';
    const tech = Array.isArray(p.tech) ? p.tech.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '';
    const links = [
      p.links?.demo ? `<a class="badge" href="${p.links.demo}" target="_blank" rel="noopener">Demo</a>` : '',
      p.links?.github ? `<a class="badge" href="${p.links.github}" target="_blank" rel="noopener">GitHub</a>` : '',
      p.links?.paper ? `<a class="badge" href="${p.links.paper}" target="_blank" rel="noopener">Paper</a>` : '',
      p.links?.site ? `<a class="badge" href="${p.links.site}" target="_blank" rel="noopener">Site</a>` : '',
    ].join('');
    const kindLabelRaw = typeof p.kind === 'string' ? p.kind : (typeof p.type === 'string' ? p.type : '');
    const kindLabel = kindLabelRaw ? String(kindLabelRaw).toLowerCase() : '';
    const kindHtml = kindLabel ? `<span class=\"tag tag-compact\">${escapeHtml(kindLabel)}</span>` : '';
    return `
      <article class="card card-tilt">
        ${media}
        <div class="card-title project-card-title"><span class="title-text">${escapeHtml(p.name || '')}</span>${kindHtml}</div>
        <p class="pub-meta">${escapeHtml(p.description || '')}</p>
        ${links ? `<div class="pub-actions">${links}</div>` : ''}
        ${tech ? `<div class="pub-actions">${tech}</div>` : ''}
      </article>
    `;
  }

  function linkBadge(label, href) {
    return href ? `<a class="badge" href="${href}" target="_blank" rel="noopener">${label}</a>` : '';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Format Month Year for news items from either { month, year } or { date: 'YYYY-MM' | ISO }
  function monthNameFromValue(monthValue) {
    const months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    if (typeof monthValue === 'number') {
      const idx = Math.min(12, Math.max(1, monthValue)) - 1;
      return months[idx];
    }
    const s = String(monthValue || '').trim().toLowerCase();
    if (!s) return '';
    // Accept full or short names
    for (let i = 0; i < months.length; i++) {
      if (months[i].toLowerCase().startsWith(s)) return months[i];
    }
    // Accept numeric string
    const n = parseInt(s, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) return months[n - 1];
    return '';
  }

  function formatNewsMonthYear(item) {
    if (!item) return '';
    // Prefer explicit month/year fields if provided
    if (item.month && item.year) {
      const monthName = monthNameFromValue(item.month);
      const yearStr = String(item.year);
      if (monthName && yearStr) return `${monthName} ${yearStr}`;
    }
    // Fallback: parse from item.date like 'YYYY-MM' or full ISO date
    if (item.date) {
      const v = String(item.date);
      const m = v.match(/(\d{4})-(\d{1,2})/);
      if (m) {
        const yearStr = m[1];
        const monthName = monthNameFromValue(parseInt(m[2], 10));
        if (monthName) return `${monthName} ${yearStr}`;
      }
      // Last resort: Date parsing
      const d = new Date(v);
      if (!isNaN(d)) {
        const yearStr = String(d.getFullYear());
        const monthName = monthNameFromValue(d.getMonth() + 1);
        if (monthName) return `${monthName} ${yearStr}`;
      }
    }
    return '';
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Render gallery
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    fetch('data/news.json')
      .then((r) => r.json())
      .then((items) => {
        if (!Array.isArray(items)) {
          galleryGrid.innerHTML = '';
          return;
        }
        let html = items.map(galleryItem).filter(Boolean).join('');
        galleryGrid.innerHTML = html;
        // Container is now visible by default (no data-animate)
        try { initStaggersIn(galleryGrid); } catch (_) {}
        // eslint-disable-next-line no-undef
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      })
      .catch(() => {
        galleryGrid.innerHTML = '';
        // eslint-disable-next-line no-undef
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      });
  }

  function galleryItem(it) {
    const title = escapeHtml(it.title || '');
    const desc = escapeHtml(it.description || it.caption || '');
    const src = it.src ? escapeHtml(it.src) : '';
    const monthYear = formatNewsMonthYear(it);
    const dateLine = monthYear ? `<div class="gallery-date">${escapeHtml(monthYear)}</div>` : '';
    if (!title && !desc && !src && !dateLine) return '';
    const imgPart = src ? `<div class="img-wrap"><img src="${src}" alt="${title || desc}"/></div>` : '';
    return `<figure class="gallery-item">${imgPart}<figcaption><div class="gallery-title">${title}</div><div class="gallery-desc">${desc}</div>${dateLine}</figcaption></figure>`;
  }

  // All placeholder code removed
})();


