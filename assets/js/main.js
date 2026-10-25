/* Villa 248 Canterbury — site interactions */
(function () {
  'use strict';

  var WHATSAPP = '94777320860';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Preloader ---------- */
  var loaded = false;
  function finishLoading() {
    if (loaded) return;
    loaded = true;
    document.body.classList.remove('is-loading');
    // the preloader locks scrolling, so honour deep links like #amenities once it is gone
    if (location.hash.length > 1) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }
  window.addEventListener('load', function () { setTimeout(finishLoading, reduceMotion ? 0 : 900); });
  setTimeout(finishLoading, 3500); // never block the page on a slow image

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  var lastY = window.pageYOffset;
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 40);
    var menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 500 && y > lastY + 4);
    if (y < lastY - 4 || y <= 500) header.classList.remove('is-hidden');
    toTop.classList.toggle('is-visible', y > 900);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Header logo: hidden while the big hero logo is on screen ---------- */
  var heroLogo = $('.hero__logo');
  if (heroLogo && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('show-brand', !entries[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(heroLogo);
  } else {
    header.classList.add('show-brand');
  }

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1024) setMenu(false); });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav__link');
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) {
      var s = $(l.getAttribute('href'));
      if (s) sectionObserver.observe(s);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = $$('.reveal', el.parentNode);
        el.style.transitionDelay = Math.min(Math.max(0, siblings.indexOf(el)), 5) * 80 + 'ms';
        el.classList.add('is-in');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Hero slideshow ---------- */
  var slides = $$('.hero__slide');
  var dots = $$('.hero__dots button');
  var heroIndex = 0;
  var heroTimer = null;
  function showSlide(i) {
    heroIndex = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === heroIndex); });
    dots.forEach(function (d, n) { d.classList.toggle('is-active', n === heroIndex); });
  }
  function startHero() {
    clearInterval(heroTimer);
    if (!reduceMotion) heroTimer = setInterval(function () { showSlide(heroIndex + 1); }, 6500);
  }
  dots.forEach(function (d, n) { d.addEventListener('click', function () { showSlide(n); startHero(); }); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearInterval(heroTimer); else startHero();
  });
  showSlide(0);
  startHero();

  /* ---------- Swipe helper ---------- */
  function onSwipe(el, cb) {
    var x0 = null, y0 = null;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });
  }

  /* ---------- Gallery tabs ---------- */
  var gItems = $$('.g-item');
  var tabs = $$('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var f = tab.getAttribute('data-tab');
      tabs.forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      gItems.forEach(function (item) {
        var show = f === 'all' || item.getAttribute('data-cat') === f;
        item.classList.toggle('is-hidden', !show);
        if (show) {
          item.classList.remove('is-entering');
          void item.offsetWidth; // restart animation
          item.classList.add('is-entering');
        }
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  var lbImg = $('img', lb);
  var lbCap = $('figcaption', lb);
  var lbList = [];
  var lbIndex = 0;
  var lastFocus = null;
  function lbShow(n) {
    lbIndex = (n + lbList.length) % lbList.length;
    var item = lbList[lbIndex];
    var img = $('img', item);
    var cap = $('figcaption', item);
    lbImg.style.animation = 'none';
    void lbImg.offsetWidth;
    lbImg.style.animation = '';
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = (cap ? cap.textContent : img.alt) + '  ·  ' + (lbIndex + 1) + ' / ' + lbList.length;
  }
  function lbOpen(item) {
    lbList = gItems.filter(function (g) { return !g.classList.contains('is-hidden'); });
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    lbShow(lbList.indexOf(item));
    $('.lightbox__close', lb).focus();
  }
  function lbClose() {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  }
  gItems.forEach(function (item) {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('click', function () { lbOpen(item); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(item); }
    });
  });
  $('.lightbox__close', lb).addEventListener('click', lbClose);
  $('.lightbox__nav--prev', lb).addEventListener('click', function () { lbShow(lbIndex - 1); });
  $('.lightbox__nav--next', lb).addEventListener('click', function () { lbShow(lbIndex + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
  onSwipe(lb, function (dir) { lbShow(lbIndex + dir); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
    if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
  });

  /* ---------- Booking form → WhatsApp ---------- */
  var bForm = $('#bookingForm');
  var bIn = $('#bkIn');
  var bOut = $('#bkOut');
  var bAdults = $('#bkAdults');
  var bKids = $('#bkKids');
  var bErr = $('#bookingError');

  function isoDate(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function parseIso(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(iso, n) { var d = parseIso(iso); d.setDate(d.getDate() + n); return isoDate(d); }
  function prettyDate(iso) { return parseIso(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  function nights(a, b) { return Math.round((parseIso(b) - parseIso(a)) / 86400000); }

  var today = isoDate(new Date());
  bIn.min = today;
  bOut.min = addDays(today, 1);
  bIn.value = addDays(today, 7);
  bOut.value = addDays(today, 9);
  bIn.addEventListener('change', function () {
    if (!bIn.value) return;
    bOut.min = addDays(bIn.value, 1);
    if (!bOut.value || bOut.value <= bIn.value) bOut.value = addDays(bIn.value, 1);
  });

  $$('.stepper').forEach(function (st) {
    var input = $('input', st);
    var min = parseInt(st.getAttribute('data-min'), 10);
    var max = parseInt(st.getAttribute('data-max'), 10);
    $$('button', st).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = (parseInt(input.value, 10) || 0) + parseInt(btn.getAttribute('data-step'), 10);
        input.value = Math.min(max, Math.max(min, v));
      });
    });
    input.addEventListener('change', function () {
      var v = parseInt(input.value, 10);
      input.value = isNaN(v) ? min : Math.min(max, Math.max(min, v));
    });
  });

  bForm.addEventListener('submit', function (e) {
    e.preventDefault();
    bErr.textContent = '';
    var adults = parseInt(bAdults.value, 10);
    var kids = parseInt(bKids.value, 10) || 0;
    if (!bIn.value) { bErr.textContent = 'Please choose a check-in date.'; bIn.focus(); return; }
    if (bIn.value < today) { bErr.textContent = 'Check-in must be today or later.'; bIn.focus(); return; }
    if (!bOut.value) { bErr.textContent = 'Please choose a check-out date.'; bOut.focus(); return; }
    if (bOut.value <= bIn.value) { bErr.textContent = 'Check-out must be after check-in.'; bOut.focus(); return; }
    if (!adults || adults < 1) { bErr.textContent = 'At least one adult is required.'; bAdults.focus(); return; }

    var n = nights(bIn.value, bOut.value);
    var lines = [
      'Hello! I would like to book Villa 248 Canterbury.',
      '',
      'Check-in: ' + prettyDate(bIn.value),
      'Check-out: ' + prettyDate(bOut.value) + ' (' + n + (n === 1 ? ' night' : ' nights') + ')',
      'Guests: ' + adults + (adults === 1 ? ' adult' : ' adults') + (kids ? ', ' + kids + (kids === 1 ? ' child' : ' children') : ''),
      '',
      'Could you please confirm availability and the rate? Thank you!'
    ];
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

  /* ---------- Contact form → WhatsApp ---------- */
  var cForm = $('#contactForm');
  var cErr = $('#contactError');
  cForm.addEventListener('submit', function (e) {
    e.preventDefault();
    cErr.textContent = '';
    var name = $('#cName'), phone = $('#cPhone'), msg = $('#cMsg');
    var fields = [name, phone, msg];
    fields.forEach(function (f) { f.parentNode.classList.remove('is-invalid'); });
    var bad = fields.filter(function (f) { return !f.value.trim(); });
    var phoneBad = phone.value.trim() && !/^[+\d][\d\s\-()]{6,}$/.test(phone.value.trim());
    if (phoneBad) bad.push(phone);
    if (bad.length) {
      bad.forEach(function (f) { f.parentNode.classList.add('is-invalid'); });
      cErr.textContent = phoneBad && bad.length === 1 ? 'Please enter a valid phone number.' : 'Please fill in all fields.';
      bad[0].focus();
      return;
    }
    var text = 'Hello! (Villa 248 Canterbury enquiry)\n\n' + msg.value.trim() + '\n\nName: ' + name.value.trim() + '\nPhone: ' + phone.value.trim();
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
})();
