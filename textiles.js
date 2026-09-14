/* Original textile ornaments: scroll-drawn yarn and progressively knitted loops. */
(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const namespace = 'http://www.w3.org/2000/svg';
  const decorations = [];
  const visible = new Set();
  const make = (name, attributes = {}) => {
    const element = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };
  function register(element, anchor = element) {
    const item = { element, anchor, last: -1 };
    decorations.push(item);
    return item;
  }
  const trails = [
    'M150 -20 C35 35 50 100 124 108 C192 115 160 189 92 160 C20 130 20 246 105 257 C190 268 165 345 104 320 C31 290 8 380 75 417 C146 454 136 508 40 540',
    'M70 -20 C155 20 179 88 100 114 C30 137 18 207 92 226 C182 250 180 155 111 176 C35 198 26 306 117 341 C201 374 127 430 67 401 C7 371 9 483 135 540',
    'M160 -20 C140 69 25 55 44 139 C62 219 172 126 125 111 C76 95 50 210 133 263 C193 302 118 363 65 337 C4 307 9 413 91 449 C164 480 148 519 68 540'
  ];
  ['hero', 'about', 'vision', 'infrastructure', 'capability', 'products', 'output', 'quality', 'markets', 'contact'].forEach((id, index) => {
    const section = document.getElementById(id);
    if (!section) return;
    const svg = make('svg', { viewBox: '0 0 180 520', class: `thread-edge thread-edge-${index % 3}`, 'aria-hidden': 'true', focusable: 'false' });
    const path = trails[index % trails.length];
    svg.appendChild(make('path', { d: path, class: 'thread-guide', fill: 'none' }));
    svg.appendChild(make('path', { d: path, class: 'thread-yarn', pathLength: 1, fill: 'none' }));
    svg.appendChild(make('path', { d: path, class: 'thread-highlight', pathLength: 1, fill: 'none' }));
    section.classList.add('has-thread');
    section.appendChild(svg);
    register(svg);
  });

  // Each shape is a rounded knit loop, offset between courses like stockinette.
  function knittedRibbon(section) {
    const wrap = section.querySelector('.wrap');
    if (!wrap) return;
    const ribbon = document.createElement('div');
    ribbon.className = 'knit-ribbon';
    ribbon.setAttribute('aria-hidden', 'true');
    const svg = make('svg', { viewBox: '0 0 720 96', focusable: 'false' });
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 28; column++) {
        const x = 9 + column * 25 + (row % 2) * 12.5;
        const y = 10 + row * 23;
        const loop = make('path', {
          d: `M${x} ${y} C${x - 5} ${y - 10} ${x - 12} ${y - 4} ${x - 8} ${y + 7} C${x - 5} ${y + 14} ${x + 2} ${y + 19} ${x + 4} ${y + 23} C${x + 6} ${y + 17} ${x + 14} ${y + 12} ${x + 16} ${y + 4} C${x + 20} ${y - 8} ${x + 8} ${y - 10} ${x + 8} ${y}`,
          class: 'knit-loop', fill: 'none', pathLength: 1,
          style: `--stitch-index:${column + row * 8}`
        });
        svg.appendChild(loop);
      }
    }
    ribbon.appendChild(svg);
    wrap.appendChild(ribbon);
    register(ribbon);
  }
  ['about', 'products', 'contact'].forEach(id => {
    const section = document.getElementById(id);
    if (section) knittedRibbon(section);
  });

  // A small drawn pair of needles accompanies the brand statement.
  const foot = document.querySelector('.manifesto-foot');
  if (foot) {
    const needles = make('svg', { viewBox: '0 0 120 84', class: 'knitting-needles', 'aria-hidden': 'true', focusable: 'false' });
    needles.appendChild(make('path', { d: 'M12 18 Q60 100 105 17', class: 'needle-yarn', fill: 'none', pathLength: 1 }));
    ['M22 12 L91 73', 'M98 12 L29 73'].forEach((d, index) => {
      const group = make('g', { class: `needle needle-${index}` });
      group.appendChild(make('path', { d }));
      group.appendChild(make('circle', { cx: index ? 98 : 22, cy: 12, r: 4 }));
      needles.appendChild(group);
    });
    foot.parentNode.insertBefore(needles, foot);
    register(needles);
  }

  document.querySelectorAll('.thread-studio').forEach(element => register(element));
  let queued = false;
  function render() {
    queued = false;
    const viewport = window.innerHeight;
    visible.forEach(item => {
      const bounds = item.anchor.getBoundingClientRect();
      const distance = item.element.classList.contains('knit-ribbon') ? viewport * .65 : Math.min(bounds.height * .8, viewport * .75);
      const progress = preference.matches ? 1 : Math.max(0, Math.min(1, (viewport * .96 - bounds.top) / Math.max(1, distance)));
      if (Math.abs(progress - item.last) < .003) return;
      item.last = progress;
      item.element.style.setProperty('--thread-progress', progress.toFixed(3));
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }
  if ('IntersectionObserver' in window) {
    const lookup = new Map(decorations.map(item => [item.element, item]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const item = lookup.get(entry.target);
        entry.target.classList.toggle('thread-visible', entry.isIntersecting);
        if (entry.isIntersecting) visible.add(item);
        else visible.delete(item);
      });
      schedule();
    }, { rootMargin: '120px 0px' });
    decorations.forEach(item => observer.observe(item.element));
  } else decorations.forEach(item => {
    visible.add(item);
    item.element.classList.add('thread-visible');
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('thread-tab-hidden', document.hidden);
    if (!document.hidden) schedule();
  });
  preference.addEventListener('change', () => {
    decorations.forEach(item => {
      item.last = -1;
      if (preference.matches) item.element.style.setProperty('--thread-progress', '1');
    });
    schedule();
  });
  if (document.fonts) document.fonts.ready.then(schedule);
  schedule();
})();
