/* PeauBio — petits comportements du site (aucune librairie) */
(function () {
  'use strict';

  /* ===== RÉGLAGES ===== */
  var CONFIG = {
    // Délai de livraison affiché sur la page produit (en jours ouvrés)
    deliveryBusinessDays: 4
  };

  // Menu mobile
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // FAQ : une seule question ouverte à la fois
  document.querySelectorAll('[data-single-open]').forEach(function (list) {
    var items = list.querySelectorAll('details');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  });

  // Galerie produit : clic sur une miniature = grande image
  var mainImg = document.getElementById('gallery-main-img');
  var thumbs = document.querySelectorAll('.gallery-thumb');
  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      if (!mainImg) return;
      mainImg.src = thumb.dataset.src;
      mainImg.alt = thumb.dataset.alt || '';
      thumbs.forEach(function (t) { t.setAttribute('aria-pressed', t === thumb ? 'true' : 'false'); });
    });
  });

  // Visiteurs en direct : vrai compteur (fonction /api/viewers), badge affiché seulement à partir de 2
  var viewers = document.querySelector('[data-viewers]');
  if (viewers && window.fetch) {
    var vid = '';
    try {
      vid = sessionStorage.getItem('pb-vid') || '';
      if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('pb-vid', vid); }
    } catch (e) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); }
    var countEl = viewers.querySelector('[data-viewers-count]');
    var ping = function () {
      if (document.hidden) return;
      fetch('/api/viewers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: vid, page: 'le-kit' }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          var n = d && typeof d.count === 'number' ? d.count : 0;
          if (n >= 2) { countEl.textContent = n; viewers.hidden = false; } else { viewers.hidden = true; }
        })
        .catch(function () { viewers.hidden = true; });
    };
    ping();
    setInterval(ping, 25000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) ping(); });
  }

  // Flèche des miniatures : fait défiler la colonne (ou la ligne sur mobile), revient au début à la fin
  var more = document.querySelector('.gallery-more');
  var strip = document.querySelector('.gallery-thumbs');
  if (more && strip) {
    more.addEventListener('click', function () {
      var vertical = strip.scrollHeight > strip.clientHeight + 2;
      var atEnd = vertical
        ? strip.scrollTop + strip.clientHeight >= strip.scrollHeight - 2
        : strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
      var step = (strip.querySelector('.gallery-thumb') || {}).offsetHeight || 100;
      if (atEnd) strip.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      else if (vertical) strip.scrollBy({ top: step + 12, behavior: 'smooth' });
      else strip.scrollBy({ left: step + 12, behavior: 'smooth' });
    });
  }

  // Description : Lire la suite / Réduire
  var desc = document.querySelector('[data-collapsible]');
  var descToggle = document.querySelector('[data-collapse-toggle]');
  if (desc && descToggle) {
    descToggle.addEventListener('click', function () {
      var collapsed = desc.classList.toggle('is-collapsed');
      descToggle.textContent = collapsed ? 'Lire la suite' : 'Réduire';
      descToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }

  // Choix achat unique / abonnement : met à jour le prix du bouton
  var offers = document.querySelectorAll('[data-offer]');
  var ctaPrices = document.querySelectorAll('[data-cta-price]');
  var ctaLinks = document.querySelectorAll('#buy-main, .buybar .btn');
  function syncOffers() {
    offers.forEach(function (wrap) {
      var input = wrap.querySelector('input');
      wrap.classList.toggle('is-selected', input.checked);
      if (!input.checked) return;
      ctaPrices.forEach(function (el) { el.textContent = input.dataset.price; });
      if (input.dataset.href) ctaLinks.forEach(function (a) { a.href = input.dataset.href; });
    });
  }
  offers.forEach(function (wrap) { wrap.querySelector('input').addEventListener('change', syncOffers); });
  if (offers.length) syncOffers();

  // Avant / Après : le curseur découpe la photo « avant »
  document.querySelectorAll('.ba').forEach(function (ba) {
    var range = ba.querySelector('input');
    function update() {
      ba.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + ' % de la photo avant visible');
    }
    range.addEventListener('input', update);
    update();
  });

  // Date de livraison estimée (jours ouvrés, hors samedi et dimanche)
  var delivery = document.querySelector('[data-delivery]');
  if (delivery) {
    var date = new Date();
    var left = CONFIG.deliveryBusinessDays;
    while (left > 0) {
      date.setDate(date.getDate() + 1);
      var day = date.getDay();
      if (day !== 0 && day !== 6) left--;
    }
    delivery.textContent = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // Barre d'achat mobile : apparaît quand le bouton principal sort de l'écran
  var buybar = document.querySelector('.buybar');
  var mainBuy = document.getElementById('buy-main');
  if (buybar && mainBuy && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      buybar.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(mainBuy);
  }

  // Année du pied de page
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
