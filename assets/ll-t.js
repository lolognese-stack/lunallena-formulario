/* Analítica propia de la web de Luna Llena.
 *
 * Junta lo que hace la gente en el sitio y lo manda en lotes a /api/evento-web
 * (Vercel lo reenvía al CRM, crm-plantilla.pages.dev), que lo guarda en
 * eventos_web + sesiones_web. Se ve en la pestaña Web del CRM. Sin cookies y
 * sin datos personales: la sesión y el visitante son ids al azar.
 *
 * Cada visita tiene un código LL-###### que viaja en todos los mensajes de
 * WhatsApp como "(ref LL-######)". Con ese código el CRM une la visita (de
 * qué post vino, qué paquete miró) con el lead y la venta.
 *
 * Automático: page_view, scroll, clics a WhatsApp (les suma la ref), clics en
 * botones, salidas a otros dominios, apertura del cotizador, vitals y errores.
 * Manual: window.VT.evento(VT.EV.LEAD_ENVIADO, {...}) desde app.js.
 *
 * ManyChat: los links que manda ManyChat llevan ?manychat_id={{contact id}}.
 * Se guarda en este navegador (las próximas visitas quedan a nombre de esa
 * persona aunque entren sin el parámetro) y se saca de la barra de
 * direcciones, para que un link copiado y reenviado no lo lleve.
 *
 * Equipo: abrir cualquier página con ?interno=1 marca este navegador y sus
 * visitas quedan fuera de los números. ?interno=0 lo desmarca.
 */
(function () {
  'use strict';
  if (window.VT) return;

  // Tiene que coincidir con TIPOS en plantilla-crm/functions/api/evento-web.js.
  var EV = {
    PAGE_VIEW: 'page_view',
    SCROLL: 'scroll',
    CLICK_WHATSAPP: 'click_whatsapp',
    CLICK_CTA: 'click_cta',
    SALIDA: 'salida',
    COTIZAR_ABIERTO: 'cotizar_abierto',
    LEAD_ENVIADO: 'lead_enviado',
    VITALS: 'vitals',
    ERROR_JS: 'error_js'
  };

  var ENDPOINT = '/api/evento-web/';   // con barra: trailingSlash de vercel.json redirige la otra forma
  var INACTIVIDAD_MS = 30 * 60 * 1000;   // sesión nueva tras 30 min sin actividad
  var CADA_MS = 4000;

  function guardado(store, clave, valor) {
    try {
      if (valor === undefined) return window[store].getItem(clave);
      if (valor === null) window[store].removeItem(clave);
      else window[store].setItem(clave, valor);
    } catch (e) {}
    return null;
  }
  function id() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function nuevoCodigo() {
    var n = 0;
    try { n = crypto.getRandomValues(new Uint32Array(1))[0]; } catch (e) { n = Math.floor(Math.random() * 4294967295); }
    return 'LL-' + String(100000 + (n % 900000));
  }

  // ---- interno ----
  var q = new URLSearchParams(location.search);
  if (q.get('interno') === '1') guardado('localStorage', 'vt_interno', '1');
  if (q.get('interno') === '0') guardado('localStorage', 'vt_interno', null);
  var interno = guardado('localStorage', 'vt_interno') === '1';

  // ---- ManyChat ----
  var mcUrl = (q.get('manychat_id') || '').trim();
  if (/^\d{1,20}$/.test(mcUrl)) guardado('localStorage', 'vt_mc', mcUrl);
  var manychatId = guardado('localStorage', 'vt_mc') || '';
  if (q.has('manychat_id')) {
    try {
      var limpia = new URL(location.href);
      limpia.searchParams.delete('manychat_id');
      history.replaceState(history.state, '', limpia.pathname + limpia.search + limpia.hash);
    } catch (e) {}
  }

  // ---- visitante y sesión ----
  var visitante = guardado('localStorage', 'vt_vis');
  if (!visitante) { visitante = id(); guardado('localStorage', 'vt_vis', visitante); }

  var ahora = Date.now();
  var ses = null;
  try { ses = JSON.parse(guardado('sessionStorage', 'vt_ses') || 'null'); } catch (e) {}
  if (!ses || ahora - ses.ult > INACTIVIDAD_MS) {
    ses = {
      id: id(),
      ini: ahora,
      ult: ahora,
      ctx: {
        visitante_id: visitante,
        codigo: nuevoCodigo(),
        manychat_id: manychatId,
        host: location.host,
        landing: location.pathname,
        referrer: document.referrer || '',
        utm_source: q.get('utm_source') || '',
        utm_medium: q.get('utm_medium') || '',
        utm_campaign: q.get('utm_campaign') || '',
        utm_content: q.get('utm_content') || '',
        idioma: navigator.language || '',
        zona: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })()
      }
    };
  }
  function tocarSesion() {
    ses.ult = Date.now();
    guardado('sessionStorage', 'vt_ses', JSON.stringify(ses));
  }
  // Llegó por un link de ManyChat a mitad de una sesión ya abierta.
  if (manychatId && ses.ctx.manychat_id !== manychatId) ses.ctx.manychat_id = manychatId;
  tocarSesion();

  // ---- cola y envío ----
  var cola = [];

  function ruta() { return location.pathname; }

  function evento(tipo, datos) {
    cola.push({ tipo: tipo, ruta: ruta(), t_ms: Date.now() - ses.ini, datos: datos || null });
    tocarSesion();
    if (cola.length >= 30) enviar(false);
  }

  function enviar(alCerrar) {
    if (!cola.length) return;
    var lote = cola.splice(0, 40);
    var ctx = Object.assign({}, ses.ctx, { interno: interno });
    var cuerpo = JSON.stringify({ sesion_id: ses.id, contexto: ctx, eventos: lote });
    try {
      if (alCerrar && navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, cuerpo)) return;
      fetch(ENDPOINT, { method: 'POST', body: cuerpo, keepalive: true, headers: { 'content-type': 'application/json' } })
        .catch(function () {});
    } catch (e) {}
  }
  setInterval(function () { enviar(false); }, CADA_MS);

  // ---- ficha actual (tour o paquete) ----
  var m = location.pathname.match(/^\/(tours|paquetes)\/([^/]+)\/?$/);
  var ficha = m ? {
    slug: m[2],
    tipo: m[1] === 'tours' ? 'tour' : 'paquete',
    nombre: ((document.querySelector('h1') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  } : null;

  // ---- page_view + scroll ----
  var marcas = {};
  function vistaDePagina() {
    evento(EV.PAGE_VIEW, {
      titulo: (document.title || '').slice(0, 120),
      paquete: ficha ? ficha.slug : undefined,
      nombre: ficha ? ficha.nombre : undefined
    });
  }

  function medirScroll() {
    var doc = document.documentElement;
    var alto = Math.max(doc.scrollHeight - window.innerHeight, 1);
    var pct = Math.min(100, Math.round((window.scrollY / alto) * 100));
    [25, 50, 75, 100].forEach(function (u) {
      if (pct >= u && !marcas[u]) { marcas[u] = 1; evento(EV.SCROLL, { pct: u }); }
    });
  }
  var scrollPendiente = false;
  window.addEventListener('scroll', function () {
    if (scrollPendiente) return;
    scrollPendiente = true;
    setTimeout(function () { scrollPendiente = false; medirScroll(); }, 400);
  }, { passive: true });

  // ---- WhatsApp: el código va en el mensaje ----
  function conRef(texto) {
    var ref = '(ref ' + ses.ctx.codigo + ')';
    return texto.indexOf(ref) >= 0 ? texto : (texto ? texto + ' ' : '') + ref;
  }
  // Devuelve el href de wa.me con la ref sumada al texto precargado.
  function waConRef(href) {
    try {
      var u = new URL(href, location.href);
      u.searchParams.set('text', conRef(u.searchParams.get('text') || ''));
      return u.toString();
    } catch (e) { return href; }
  }

  // ---- clics ----
  function ubicacion(el) {
    var n = el;
    while (n && n !== document.body) {
      if (n.dataset && n.dataset.ubic) return n.dataset.ubic;
      if (n.matches && n.matches('[data-quote]')) return 'cotizacion';
      var tag = n.tagName;
      if (tag === 'HEADER' || tag === 'FOOTER' || tag === 'NAV') return tag.toLowerCase();
      if (n.id && n.id !== 'top') return n.id;
      if (tag === 'SECTION' && n.classList.length) return n.classList[n.classList.length - 1].slice(0, 40);
      n = n.parentElement;
    }
    return 'pagina';
  }
  function textoDe(el) {
    return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (!el) return;
    var href = el.tagName === 'A' ? el.getAttribute('href') || '' : '';
    var datos = { ubicacion: ubicacion(el), texto: textoDe(el) };
    if (ficha) datos.paquete = ficha.slug;

    if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) {
      el.href = waConRef(el.href);
      datos.codigo = ses.ctx.codigo;
      evento(EV.CLICK_WHATSAPP, datos);
      enviar(false);
      return;
    }

    if (/^https?:\/\//i.test(href)) {
      try {
        var u = new URL(href);
        if (u.host !== location.host) { datos.destino = u.host + u.pathname.slice(0, 60); return evento(EV.SALIDA, datos); }
      } catch (err) {}
    }
    if (el.closest('[data-quote], [data-stepper]')) return;   // controles del cotizador
    if (el.tagName === 'BUTTON' || /\bbtn\b/.test(el.className || '')) {
      if (href) datos.destino = href.slice(0, 100);
      evento(EV.CLICK_CTA, datos);
    }
  }, true);

  // ---- cotizador de la ficha: una vez por página ----
  var cotizarContado = false;
  document.addEventListener('focusin', function (e) {
    if (cotizarContado || !e.target.closest || !e.target.closest('[data-quote]')) return;
    cotizarContado = true;
    evento(EV.COTIZAR_ABIERTO, { paquete: ficha ? ficha.slug : undefined });
  });

  // ---- errores de JS (máx. 5 por carga) ----
  var errores = 0;
  window.addEventListener('error', function (e) {
    if (errores++ >= 5) return;
    evento(EV.ERROR_JS, {
      mensaje: String(e.message || '').slice(0, 200),
      origen: String(e.filename || '').split('?')[0].slice(-80),
      linea: e.lineno || 0
    });
  });

  // ---- vitals (una vez por carga, al irse) ----
  var vit = { lcp: 0, cls: 0, inp: 0, ttfb: 0 };
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) vit.ttfb = Math.round(nav.responseStart);
  } catch (e) {}
  function observar(tipo, fn, extra) {
    try {
      var o = new PerformanceObserver(function (l) { l.getEntries().forEach(fn); });
      o.observe(Object.assign({ type: tipo, buffered: true }, extra || {}));
    } catch (e) {}
  }
  observar('largest-contentful-paint', function (en) { vit.lcp = Math.round(en.startTime); });
  observar('layout-shift', function (en) { if (!en.hadRecentInput) vit.cls += en.value; });
  observar('event', function (en) { if (en.interactionId && en.duration > vit.inp) vit.inp = Math.round(en.duration); }, { durationThreshold: 40 });

  var vitalsMandados = false;
  function alIrse() {
    if (!vitalsMandados && vit.lcp) {
      vitalsMandados = true;
      evento(EV.VITALS, { lcp: vit.lcp, cls: Math.round(vit.cls * 1000) / 1000, inp: vit.inp, ttfb: vit.ttfb });
    }
    enviar(true);
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') alIrse(); });
  window.addEventListener('pagehide', alIrse);

  window.VT = {
    EV: EV,
    evento: evento,
    enviar: function () { enviar(false); },
    sesion: function () { return ses.id; },
    codigo: function () { return ses.ctx.codigo; },
    manychatId: function () { return ses.ctx.manychat_id || ''; },
    conRef: conRef,
    ficha: function () { return ficha; },
    contexto: function () { return ses.ctx; },
    interno: function () { return interno; },
    inicio: ahora
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vistaDePagina);
  else vistaDePagina();
})();
