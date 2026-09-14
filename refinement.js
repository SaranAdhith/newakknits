/* Additive enhancements. Content and links remain usable without this file. */
(() => {
  'use strict';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = motionPreference.matches;
  const animated = Boolean(window.gsap && window.ScrollTrigger);
  const body = document.body;
  const intro = document.getElementById('intro');
  if (intro) intro.classList.add('done');

  // Keep long-page navigation available without covering the content.
  const back = document.createElement('a');
  back.className = 'back-top';
  back.href = '#hero';
  back.setAttribute('aria-label', 'Back to top');
  back.innerHTML = '<span aria-hidden="true">↑</span>';
  body.appendChild(back);
  back.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'auto' : 'smooth' });
    document.querySelector('.brand').focus({ preventScroll: true });
  });

  // Scroll paints the sentence progressively; no wheel interception or pinning.
  const manifesto = document.querySelector('.manifesto');
  const sentence = document.getElementById('philosophy-title');
  let words = [];
  if (manifesto && sentence && !reduced) {
    const walker = document.createTreeWalker(sentence, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part.trim()) fragment.appendChild(document.createTextNode(part));
        else {
          const word = document.createElement('span');
          word.className = 'word';
          word.textContent = part;
          fragment.appendChild(word);
        }
      });
      node.replaceWith(fragment);
    });
    words = [...sentence.querySelectorAll('.word')];
    manifesto.classList.add('motion-ready');
  }

  // Blocks marked data-rise follow the scroll position directly: --rise runs
  // 0 to 1 as the block enters, and CSS staggers the children off that value.
  const risers = [...document.querySelectorAll('[data-rise]')].map(element => ({ element, last: -1 }));
  if (!reduced) risers.forEach(item => item.element.classList.add('rise-ready'));

  let queued = false;
  let lastCount = -1;
  function paintScroll() {
    queued = false;
    back.classList.toggle('visible', window.scrollY > window.innerHeight);
    if (motionPreference.matches) return;
    risers.forEach(item => {
      const rise = Math.max(0, Math.min(1, (window.innerHeight * .94 - item.element.getBoundingClientRect().top) / (window.innerHeight * .5)));
      if (Math.abs(rise - item.last) < .002) return;
      item.last = rise;
      item.element.style.setProperty('--rise', rise.toFixed(3));
    });
    if (!words.length) return;
    const rect = sentence.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight * .88 - rect.top) / (window.innerHeight * .5)));
    const count = Math.ceil(progress * words.length);
    if (count === lastCount) return;
    words.forEach((word, index) => word.classList.toggle('active', index < count));
    lastCount = count;
  }
  function queueScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paintScroll);
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  paintScroll();

  // CDN failure still gets lightweight reveals, without hiding the first screen.
  if (!animated && !reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('waiting');
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -35px 0px', threshold: 0 });
    document.querySelectorAll('[data-reveal], [data-tl]').forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('native-reveal', 'waiting');
      observer.observe(element);
    });
  }

  // Process motion uses native scrolling and Web Animations; photos never zoom in.
  (() => {
    const stage = document.querySelector('#capability .stage');
    if (!stage) return;
    const panel = document.getElementById('stagePanel');
    const nav = document.getElementById('stageNav');
    const controls = stage.querySelector('.stage-controls');
    const supportsAnimation = typeof panel.animate === 'function';
    const animations = new Set();
    const watched = new Set();
    const revealed = new WeakSet();
    const easing = 'cubic-bezier(.16,1,.3,1)';
    let observer;
    let scheduled = false;
    let lastProgress = -1;

    function animate(element, frames, delay = 0, duration = 850) {
      if (!element || !supportsAnimation || motionPreference.matches) return;
      const animation = element.animate(frames, { duration, delay, easing, fill: 'backwards' });
      animations.add(animation);
      const remove = () => animations.delete(animation);
      animation.finished.then(remove, remove);
    }
    function reveal(element, delay = 0) {
      element.classList.remove('process-pending');
      if (revealed.has(element)) return;
      revealed.add(element);
      if (element === nav) {
        nav.querySelectorAll('.sbtn').forEach((button, index) => {
          animate(button, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], index * 65, 700);
        });
      } else if (element.classList.contains('stage-photo')) {
        animate(element, [{ opacity: .15, transform: 'scale(.965)' }, { opacity: 1, transform: 'scale(1)' }], delay, 1100);
      } else {
        animate(element, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], delay);
      }
    }
    function observe(element, delay = 0) {
      if (!element) return;
      if (!observer || element.getBoundingClientRect().top < window.innerHeight * .94) {
        reveal(element, delay);
        return;
      }
      element.classList.add('process-pending');
      watched.add(element);
      observer.observe(element);
    }
    if (supportsAnimation && !motionPreference.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        let stagger = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal(entry.target, stagger++ * 65);
          observer.unobserve(entry.target);
          watched.delete(entry.target);
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    }
    function observePanel() {
      observe(panel.querySelector('.stage-photo'));
      observe(panel.querySelector('figcaption'), 100);
      panel.querySelectorAll('.stage-copy > :not(.kpis), .kpis > div').forEach((element, index) => observe(element, 90 + index * 65));
    }
    function updateScroll() {
      scheduled = false;
      if (motionPreference.matches) return;
      // Measure the untransformed wrapper so the animation cannot affect its input.
      const rect = stage.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight * .96 - rect.top) / (window.innerHeight * .62)));
      if (Math.abs(progress - lastProgress) < .002) return;
      lastProgress = progress;
      stage.style.setProperty('--process-entry', progress.toFixed(3));
    }
    function queueUpdate() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
    function updateSteps(index) {
      nav.style.setProperty('--step-progress', (index / 6).toFixed(3));
      nav.querySelectorAll('.sbtn').forEach((button, position) => button.classList.toggle('complete', position < index));
    }
    updateSteps([...nav.querySelectorAll('.sbtn')].findIndex(button => button.getAttribute('aria-selected') === 'true'));
    updateScroll();
    if (!motionPreference.matches) stage.classList.add('process-motion');
    observe(nav);
    observePanel();
    observe(controls);
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    if (document.fonts) document.fonts.ready.then(queueUpdate);

    panel.addEventListener('stagechange', event => {
      animations.forEach(animation => animation.cancel());
      animations.clear();
      watched.forEach(element => {
        // Keep the navigation/control observers when only the panel changes.
        if (!element.isConnected) { observer?.unobserve(element); watched.delete(element); }
      });
      updateSteps(event.detail.index);
      const rect = panel.getBoundingClientRect();
      if (motionPreference.matches || !supportsAnimation) return;
      if (rect.top >= window.innerHeight || rect.bottom <= 0) { observePanel(); return; }
      const offset = event.detail.direction * 14;
      // The incoming card swipes in from the side it is travelling from.
      animate(panel, [
        { opacity: 0, transform: `translateX(${event.detail.direction * 72}px)` }, { opacity: 1, transform: 'none' }
      ], 0, 640);
      animate(panel.querySelector('.stage-photo'), [
        { opacity: .15, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1)' }
      ], 0, 700);
      animate(panel.querySelector('figcaption'), [{ opacity: 0 }, { opacity: 1 }], 130, 600);
      panel.querySelectorAll('.stage-copy > :not(.kpis), .kpis > div').forEach((element, index) => {
        animate(element, [{ opacity: 0, transform: `translate(${offset}px, 12px)` }, { opacity: 1, transform: 'none' }], 45 + index * 45, 620);
      });
      animate(controls.querySelector('.stage-position'), [{ opacity: .2, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], 0, 400);
      queueUpdate();
    });
    // The outgoing card leaves as a copy, sliding out over the incoming one.
    panel.addEventListener('stageleave', event => {
      if (motionPreference.matches || !supportsAnimation) return;
      const rect = panel.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
      // Only one card leaves at a time; a fast scroll drops the previous copy.
      stage.querySelectorAll('.stage-ghost').forEach(element => element.remove());
      const ghost = panel.cloneNode(true);
      ['id', 'role', 'aria-live', 'aria-labelledby'].forEach(name => ghost.removeAttribute(name));
      ghost.setAttribute('aria-hidden', 'true');
      ghost.classList.add('stage-ghost');
      ghost.style.top = `${panel.offsetTop}px`;
      ghost.style.left = `${panel.offsetLeft}px`;
      ghost.style.width = `${panel.offsetWidth}px`;
      ghost.style.height = `${panel.offsetHeight}px`;
      stage.appendChild(ghost);
      const leave = ghost.animate([
        { opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-event.detail.direction * 72}px)` }
      ], { duration: 480, easing, fill: 'forwards' });
      const drop = () => ghost.remove();
      leave.finished.then(drop, drop);
    });
    panel.addEventListener('toggle', event => {
      if (!event.target.matches('.stage-details') || !event.target.open) return;
      event.target.querySelectorAll('li').forEach((item, index) => {
        animate(item, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], index * 45, 450);
      });
    }, true);
    // Keyboard users see a focused element immediately, even before its scroll reveal.
    stage.addEventListener('focusin', event => {
      const pending = event.target.closest('.process-pending');
      if (pending) { pending.classList.remove('process-pending'); observer?.unobserve(pending); watched.delete(pending); }
    });
    motionPreference.addEventListener('change', event => {
      stage.classList.toggle('process-motion', !event.matches);
      if (event.matches) {
        animations.forEach(animation => animation.cancel());
        animations.clear();
        watched.forEach(element => element.classList.remove('process-pending'));
        watched.clear();
        observer?.disconnect();
        observer = null;
      }
      lastProgress = -1;
      queueUpdate();
    });
  })();

  // Explicit control for continuous background motion, separate from scrolling.
  const motionButton = document.querySelector('.motion-toggle');
  const videos = [...document.querySelectorAll('video')];
  function pauseMotion(paused) {
    body.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Play background motion' : 'Pause background motion';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    videos.forEach(video => {
      if (paused) video.pause();
      else if (video.getAttribute('src') && !document.hidden) {
        const rect = video.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          video.play().then(() => video.classList.add('on')).catch(() => {});
        }
      }
    });
  }
  if (motionButton) {
    motionButton.hidden = reduced;
    motionButton.addEventListener('click', () => pauseMotion(!body.classList.contains('motion-paused')));
    // A late video readiness event must never override the pause control.
    videos.forEach(video => video.addEventListener('play', () => {
      if (body.classList.contains('motion-paused') || motionPreference.matches) video.pause();
    }));
    motionPreference.addEventListener('change', event => {
      motionButton.hidden = event.matches;
      if (event.matches) pauseMotion(true);
      manifesto?.classList.toggle('motion-ready', !event.matches);
      risers.forEach(item => {
        item.element.classList.toggle('rise-ready', !event.matches);
        item.last = -1;
      });
      queueScroll();
    });
  }

  // Accessible mobile menu: Escape, focus containment and return to its trigger.
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  function syncDrawer() {
    const open = drawer.classList.contains('open');
    drawer.inert = !open;
    main.inert = open;
    footer.inert = open;
    back.inert = open;
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) drawer.querySelector('a').focus({ preventScroll: true });
  }
  syncDrawer();
  burger.addEventListener('click', syncDrawer);
  drawer.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    syncDrawer();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (!drawer.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      burger.click();
      burger.focus();
    } else if (event.key === 'Tab') {
      const focusable = [burger, ...drawer.querySelectorAll('a')];
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && index === focusable.length - 1) {
        event.preventDefault();
        burger.focus();
      }
    }
  });
  window.matchMedia('(min-width:1000px)').addEventListener('change', event => {
    if (event.matches && drawer.classList.contains('open')) {
      burger.click();
      document.querySelector('.brand').focus({ preventScroll: true });
    }
  });

  // Tabs expose one keyboard stop, with arrows/Home/End to choose a panel.
  function wireTabs(container, selector, panelId) {
    if (!container) return;
    const tabs = [...container.querySelectorAll(selector)];
    if (!tabs.length) return;
    const panel = document.getElementById(panelId);
    const sync = () => tabs.forEach((tab, index) => {
      const selected = tab.getAttribute('aria-selected') === 'true';
      tab.id = tab.id || `${panelId}-tab-${index}`;
      tab.setAttribute('aria-controls', panelId);
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.setAttribute('aria-labelledby', tab.id);
    });
    sync();
    container.addEventListener('click', sync);
    const observer = new MutationObserver(sync);
    tabs.forEach(tab => observer.observe(tab, { attributes: true, attributeFilter: ['aria-selected'] }));
    container.addEventListener('keydown', event => {
      const index = tabs.indexOf(event.target);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus({ preventScroll: true });
    });
  }
  wireTabs(document.querySelector('.tabs'), '.tab', 'pgrid');
  wireTabs(document.getElementById('stageNav'), '.sbtn', 'stagePanel');

  // Retain the selected product and the visitor's own notes in the enquiry.
  document.getElementById('pgrid').addEventListener('click', event => {
    const link = event.target.closest('.style-enquiry');
    if (!link) return;
    event.preventDefault();
    const card = link.closest('.card');
    const name = card.querySelector('h3').textContent;
    const fabric = card.querySelector('dd').textContent;
    const details = document.getElementById('f-msg');
    const line = `I’m interested in ${name} (${fabric}).`;
    if (!details.value.includes(line)) details.value = line + (details.value ? '\n\n' + details.value : '');
    const category = document.getElementById('f-cat');
    const names = /polo|tee/i.test(name) ? 0 : /fleece|cardigan/i.test(name) ? 1 : /co-ord/i.test(name) ? 2 : /pyjama/i.test(name) ? 3 : 5;
    category.selectedIndex = card.dataset.category === 'kids' ? 5 : names;
    document.getElementById('formStatus').textContent = `${name} added to your enquiry. Tell us a little about your project.`;
    const contact = document.getElementById('contact');
    contact.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth' });
    document.getElementById('f-name').focus({ preventScroll: true });
  });

  // Changes in card count and loaded fonts alter every section below the gallery.
  if (document.fonts) document.fonts.ready.then(queueScroll);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => window.dispatchEvent(new Event('resize'))).observe(document.getElementById('pgrid'));
  }
})();
