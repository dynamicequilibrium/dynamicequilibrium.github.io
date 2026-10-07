/* Dynamic Equilibrium — shared behaviour (theme, mobile menu, sticky CTA, contact form) */
(function () {
  'use strict';
  var root = document.documentElement;
  var body = document.body;

  // THEME — light by default, remembers the visitor's choice
  var logos = document.querySelectorAll('[data-logo]');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function setTheme(mode) {
    body.setAttribute('data-theme', mode);
    try { localStorage.setItem('de_theme', mode); } catch (e) {}
    if (metaTheme) metaTheme.setAttribute('content', mode === 'dark' ? '#0C0F10' : '#F5F4F0');
    logos.forEach(function (img) { img.src = mode === 'dark' ? '/images/logo-white.svg' : '/images/logo-black.svg'; });
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', mode === 'dark'); });
  }
  var saved = null;
  try { saved = localStorage.getItem('de_theme'); } catch (e) {}
  setTheme(saved === 'dark' ? 'dark' : 'light');
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
  });

  // MOBILE MENU
  var drawer = document.getElementById('drawer');
  var toggle = document.getElementById('menuToggle');
  if (drawer && toggle) {
    var open = function () { drawer.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); body.style.overflow = 'hidden'; var f = drawer.querySelector('a'); if (f) f.focus(); };
    var close = function () { drawer.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); body.style.overflow = ''; toggle.focus(); };
    toggle.addEventListener('click', function () { drawer.classList.contains('open') ? close() : open(); });
    drawer.addEventListener('click', function (e) { if (e.target.closest('[data-drawer-close]') || e.target.closest('a')) close(); });
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // STICKY CTA (mobile) — appears after the hero, hides once the contact section is on screen
  var sticky = document.getElementById('stickyCta');
  var contact = document.getElementById('contact');
  if (sticky) {
    var past = false, atContact = false;
    var update = function () { sticky.classList.toggle('show', past && !atContact); };
    window.addEventListener('scroll', function () { past = window.scrollY > 520; update(); }, { passive: true });
    if (contact && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { atContact = en[0].isIntersecting; update(); }).observe(contact);
    }
  }

  // PRE-SELECT the offer when a price card button is used
  document.querySelectorAll('[data-interest]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('interest');
      if (sel) sel.value = a.getAttribute('data-interest');
    });
  });

  // CONTACT FORM — posts to Formspree in the background; falls back to a normal submit
  var form = document.getElementById('contactForm');
  if (form && window.fetch) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = form.getAttribute('data-sending') || '…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset();
          status.className = 'form-status ok show';
          status.textContent = form.getAttribute('data-ok');
        })
        .catch(function () {
          status.className = 'form-status err show';
          status.textContent = form.getAttribute('data-err');
        })
        .then(function () { btn.disabled = false; btn.textContent = label; status.focus(); });
    });
  }

  // YEAR
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();
