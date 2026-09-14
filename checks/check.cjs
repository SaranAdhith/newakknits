const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const cssom = require('cssom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const extra = fs.readFileSync(path.join(root, 'refinement.js'), 'utf8');
const textiles = fs.readFileSync(path.join(root, 'textiles.js'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const original = scripts.find(m => !m[1].includes('ld+json') && m[2].trim())[2];
new vm.Script(original);
new vm.Script(extra);
new vm.Script(textiles);
JSON.parse(scripts.find(m => m[1].includes('ld+json'))[2]);
const css = fs.readFileSync(path.join(root, 'refinement.css'), 'utf8');
assert(cssom.parse(css).cssRules.length > 200);
assert(cssom.parse(fs.readFileSync(path.join(root, 'textiles.css'), 'utf8')).cssRules.length > 20);
console.log('PASS: inline JavaScript, enhancement JavaScript, CSS and structured data parse.');

function boot(reduced) {
  const { window, document, HTMLElement, Element, Event, CustomEvent } = parseHTML(html);
  const motionCalls = [];
  HTMLElement.prototype.animate = function(frames, options) {
    const animation = { finished: Promise.resolve(), cancel() { this.cancelled = true; } };
    motionCalls.push({ element: this, frames, options, animation });
    return animation;
  };
  Object.defineProperty(Element.prototype, 'getBoundingClientRect', { configurable: true, value() {
    return { top: 100, bottom: 500, height: 400, left: 0, right: 1200, width: 1200 };
  }});
  HTMLElement.prototype.focus = function() { Object.defineProperty(document, 'activeElement', { configurable: true, value: this }); };
  HTMLElement.prototype.scrollIntoView = function() {};
  HTMLElement.prototype.pause = function() { this.paused = true; };
  HTMLElement.prototype.play = function() { this.paused = false; return Promise.resolve(); };
  HTMLElement.prototype.load = function() {};
  HTMLElement.prototype.reportValidity = function() { return true; };
  Element.prototype.getTotalLength = () => 100;
  Element.prototype.getPointAtLength = () => ({ x: 0, y: 0 });
  Object.assign(window, {
    innerWidth: 1440, innerHeight: 900, scrollY: 0,
    matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : false, addEventListener() {} }),
    scrollTo() {}, location: { href: '' }
  });
  const navigator = { connection: { saveData: true } };
  class IO { constructor(callback) { this.callback = callback; } observe(element) { this.callback([{ target: element, isIntersecting: true }]); } unobserve() {} disconnect() {} }
  window.IntersectionObserver = IO;
  const context = vm.createContext({
    window, document, navigator, console, NodeFilter: { SHOW_TEXT: 4 }, Event, CustomEvent,
    IntersectionObserver: IO, MutationObserver: window.MutationObserver,
    setTimeout() {}, clearTimeout() {}, requestAnimationFrame(fn) { fn(); }, cancelAnimationFrame() {},
    performance: { now: () => 0 }
  });
  vm.runInContext(original, context);
  vm.runInContext(extra, context);
  vm.runInContext(textiles, context);
  return { window, document, Event, motionCalls };
}

function check(reduced) {
  const { window, document, Event, motionCalls } = boot(reduced);
  const click = element => element.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
  const keyboard = (element, key) => { const event = new Event('keydown', { bubbles: true, cancelable: true }); event.key = key; element.dispatchEvent(event); };
  assert.equal(document.querySelectorAll('.card').length, 11);
  assert.equal(document.querySelectorAll('.sbtn').length, 7);
  assert(document.querySelector('#stageTrack > .stage + .stage-runway'), 'Stage sits in a pinned track with a runway');
  assert.equal(document.querySelectorAll('.thread-edge').length, 10);
  assert.equal(document.querySelectorAll('.knit-loop').length, 252);
  assert.equal(document.querySelectorAll('.knitting-needles .needle').length, 2);
  for (const decoration of document.querySelectorAll('.thread-edge, .knit-ribbon, .knitting-needles')) {
    assert.equal(decoration.getAttribute('aria-hidden'), 'true');
    if (reduced) assert.equal(decoration.style.getPropertyValue('--thread-progress'), '1.000');
  }
  if (!reduced) {
    const yarn = document.querySelector('.thread-edge');
    yarn.getBoundingClientRect = () => ({ top: 890, bottom: 1300, height: 410 });
    window.dispatchEvent(new Event('scroll'));
    const start = Number(yarn.style.getPropertyValue('--thread-progress'));
    yarn.getBoundingClientRect = () => ({ top: 100, bottom: 510, height: 410 });
    window.dispatchEvent(new Event('scroll'));
    assert(Number(yarn.style.getPropertyValue('--thread-progress')) > start, 'Thread drawing follows scrolling');
  }
  const manifesto = document.querySelector('.manifesto');
  assert.equal(manifesto.classList.contains('motion-ready'), !reduced);
  if (!reduced) {
    const wrap = manifesto.querySelector('.wrap');
    wrap.getBoundingClientRect = () => ({ top: 850, bottom: 1500, height: 650 });
    window.dispatchEvent(new Event('scroll'));
    const before = Number(wrap.style.getPropertyValue('--rise'));
    wrap.getBoundingClientRect = () => ({ top: 500, bottom: 1150, height: 650 });
    window.dispatchEvent(new Event('scroll'));
    assert(Number(wrap.style.getPropertyValue('--rise')) > before, 'Manifesto rise follows scrolling');
    const head = document.querySelector('#vision .shead');
    assert(head.classList.contains('rise-ready') && !head.querySelector('[data-reveal]'), 'Vision head is scroll-driven, not in the GSAP pool');
    head.getBoundingClientRect = () => ({ top: 400, bottom: 800, height: 400 });
    window.dispatchEvent(new Event('scroll'));
    assert(Number(head.style.getPropertyValue('--rise')) > 0, 'Section head rise follows scrolling');
  }
  const stage = document.querySelector('.stage');
  assert.equal(stage.classList.contains('process-motion'), !reduced);
  assert.equal(motionCalls.length > 0, !reduced, 'Only animate when motion is allowed');
  if (!reduced) {
    stage.getBoundingClientRect = () => ({ top: 900, bottom: 1700 });
    window.dispatchEvent(new Event('scroll'));
    const before = Number(stage.style.getPropertyValue('--process-entry'));
    stage.getBoundingClientRect = () => ({ top: 200, bottom: 1000 });
    window.dispatchEvent(new Event('scroll'));
    assert(Number(stage.style.getPropertyValue('--process-entry')) > before, 'Entrance advances with actual scroll geometry');
  }
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(ids.length, new Set(ids).size, 'Unique IDs');
  for (const a of document.querySelectorAll('a[href^="#"]')) {
    if (a.getAttribute('href') !== '#') assert(document.querySelector(a.getAttribute('href')), 'Anchor: ' + a.getAttribute('href'));
  }
  for (const el of document.querySelectorAll('[src], link[rel="stylesheet"]')) {
    const src = el.getAttribute('src') || el.getAttribute('href');
    if (src && !/^(https?:|data:)/.test(src)) assert(fs.existsSync(path.join(root, src)), 'Asset: ' + src);
  }
  const filters = { men: 3, women: 3, kids: 5, all: 11 };
  for (const [category, count] of Object.entries(filters)) {
    click(document.querySelector(`[data-filter="${category}"]`));
    assert.equal(document.querySelectorAll('.card').length, count, 'Product filter ' + category);
    assert.equal(document.querySelectorAll('.tab[tabindex="0"]').length, 1);
  }
  keyboard(document.querySelector('[data-filter="all"]'), 'ArrowRight');
  assert.equal(document.querySelector('[data-filter="men"]').getAttribute('aria-selected'), 'true');
  keyboard(document.querySelector('[data-filter="men"]'), 'End');
  assert.equal(document.querySelectorAll('.card').length, 5);
  for (const button of document.querySelectorAll('.sbtn')) {
    click(button);
    assert.equal(document.querySelector('#stagePanel h3').textContent, button.querySelector('.t').textContent);
    assert(fs.existsSync(path.join(root, document.querySelector('#stagePanel img').getAttribute('src'))));
  }
  keyboard(document.querySelector('.sbtn[aria-selected="true"]'), 'Home');
  assert.equal(document.querySelector('#stagePanel h3').textContent, 'Fabric in');
  const previousStage = document.querySelector('.stage-prev');
  const nextStage = document.querySelector('.stage-next');
  assert.equal(previousStage.disabled, true);
  assert.equal(nextStage.disabled, false);
  for (let i = 1; i < 7; i++) {
    click(nextStage);
    assert.equal(document.querySelector('.stage-position').textContent, `0${i + 1} / 07`);
    assert.equal(document.querySelector('#stagePanel').getAttribute('aria-labelledby'), `stage-tab-${i}`);
    assert.equal(document.querySelectorAll('#stagePanel .stage-details li').length, 4);
    assert(document.querySelectorAll('.stage-ghost').length <= 1, 'At most one outgoing card copy');
    assert(document.querySelector('.shot figcaption b').textContent.length > 0);
  }
  assert.equal(nextStage.disabled, true);
  assert.equal(document.querySelectorAll('.sbtn.complete').length, 6);
  assert.equal(document.getElementById('stageNav').style.getPropertyValue('--step-progress'), '1.000');
  for (let i = 5; i >= 0; i--) click(previousStage);
  assert.equal(previousStage.disabled, true);
  assert.equal(document.querySelector('#stagePanel h3').textContent, 'Fabric in');
  assert.equal(document.querySelectorAll('.sbtn.complete').length, 0);
  if (!reduced) {
    assert(motionCalls.some(call => call.element.classList.contains('stage-photo')), 'Photo entrances run locally');
    assert(motionCalls.some(call => call.animation.cancelled), 'Rapid stage changes cancel previous animations');
  }
  click(document.querySelector('[data-filter="women"]'));
  document.getElementById('f-msg').value = 'Please quote for 2,000 pieces.';
  click(document.querySelector('.style-enquiry'));
  assert(document.getElementById('f-msg').value.includes('Printed co-ord set'));
  assert(document.getElementById('f-msg').value.includes('Please quote for 2,000 pieces.'));
  assert.equal(document.getElementById('f-cat').selectedIndex, 2);
  click(document.querySelector('.style-enquiry'));
  assert.equal(document.getElementById('f-msg').value.match(/I’m interested/g).length, 1);
  click(document.getElementById('burger'));
  assert(document.getElementById('drawer').classList.contains('open'));
  assert.equal(document.querySelector('main').inert, true);
  keyboard(document, 'Escape');
  assert(!document.getElementById('drawer').classList.contains('open'));
  assert.equal(document.querySelector('main').inert, false);
  assert.equal(document.getElementById('burger').getAttribute('aria-expanded'), 'false');
  const toggle = document.querySelector('.motion-toggle');
  assert.equal(toggle.hidden, reduced);
  if (!reduced) {
    click(toggle);
    assert(document.body.classList.contains('motion-paused'));
    click(toggle);
    assert(!document.body.classList.contains('motion-paused'));
    assert(document.querySelectorAll('.manifesto .word').length > 10);
  } else assert.equal(document.querySelectorAll('.manifesto .word').length, 0);
  const tableButton = document.querySelector('[data-tbl]');
  click(tableButton);
  assert.equal(tableButton.getAttribute('aria-expanded'), 'true');
  click(tableButton);
  assert.equal(tableButton.getAttribute('aria-expanded'), 'false');
  console.log(`PASS: ${reduced ? 'reduced motion' : 'normal motion'}, CDN unavailable: initialization, 11 products, 4 filters, 7 stages, scroll progress, local animation calls/cancellation, 10 thread ornaments, 252 knit loops, needle decoration, keyboard tabs, enquiry prefilling, menu/Escape, motion control, chart tables, anchors and assets.`);
}
check(false);
check(true);
