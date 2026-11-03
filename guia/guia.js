/* Guía para viajar a Perú · interacciones (índice, lectura, pestañas, test, conversor, checklist).
   Sin dependencias. Respeta prefers-reduced-motion. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js-g");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- aparición (reserva por si app.js no lo marca) ---------- */
  var seen = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); seen.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -12% 0px" }) : null;
  $$(".g-open, .g-climas, .g-alt").forEach(function (el) { if (seen) seen.observe(el); else el.classList.add("is-in"); });

  /* ---------- barra de lectura + parallax + índice con progreso ---------- */
  var bar = $(".g-progress i");
  var secs = $$(".g-sec[data-title]");
  var links = $$("[data-spy]");
  var curN = $("[data-cur-n]"), curT = $("[data-cur-t]");
  var body = $(".g-body");
  var par = $$(".g-dest__hero img, .g-popen__bg");
  var hero = $("[data-parallax-hero]");
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = window.innerHeight, y = window.scrollY;
    if (bar && body) {
      var top = body.getBoundingClientRect().top + y;
      var total = body.offsetHeight - vh * 0.4;
      bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, (y - top + vh * 0.2) / total)).toFixed(4) + ")";
    }
    var active = null;
    secs.forEach(function (s) {
      var r = s.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (vh * 0.4 - r.top) / r.height));
      var a = $$('[data-spy="' + s.id + '"]');
      a.forEach(function (l) { l.style.setProperty("--p", p.toFixed(3)); });
      if (r.top < vh * 0.4 && r.bottom > vh * 0.4) active = s;
    });
    links.forEach(function (l) { l.setAttribute("aria-current", active && l.dataset.spy === active.id ? "true" : "false"); });
    if (curN) {
      curN.textContent = active ? active.dataset.n : "Guía";
      curT.textContent = active ? active.dataset.title : "Índice de la guía";
    }
    if (!reduce) {
      par.forEach(function (img) {
        var host = img.parentElement.getBoundingClientRect();
        if (host.bottom < -100 || host.top > vh + 100) return;
        var k = (host.top + host.height / 2 - vh / 2) / vh;
        img.style.transform = "translate3d(0," + (k * -8).toFixed(2) + "%,0)";
      });
      if (hero && y < vh * 1.2) hero.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();

  /* ---------- número que cuenta al aparecer ---------- */
  var counters = $$("[data-count]");
  function run(el) {
    var to = parseFloat(el.dataset.count);
    if (reduce) { el.textContent = to; return; }
    var t0 = null, dur = 1100;
    (function tick(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = "0"; co.observe(c); });
    window.addEventListener("beforeprint", function () { counters.forEach(function (c) { c.textContent = c.dataset.count; }); });
  }

  /* ---------- hoja de índice (móvil) ---------- */
  var sheet = $("#g-sheet"), openBtn = $("[data-open-sheet]");
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.body.style.overflow = "";
    if (openBtn) { openBtn.setAttribute("aria-expanded", "false"); openBtn.focus(); }
  }
  if (sheet && openBtn) {
    openBtn.addEventListener("click", function () {
      sheet.hidden = false;
      document.body.style.overflow = "hidden";
      openBtn.setAttribute("aria-expanded", "true");
      var f = $("a", sheet); if (f) f.focus();
    });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-close-sheet]")) closeSheet();
      else if (e.target.closest("a")) { sheet.hidden = true; document.body.style.overflow = ""; openBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
  }

  /* ---------- pestañas (clima, itinerarios) ---------- */
  function selectTab(box, i, focus) {
    var tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    tabs.forEach(function (t, n) {
      var on = n === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, n) { p.hidden = n !== i; });
    if (focus) tabs[i].focus();
    if (box.hasAttribute("data-iti")) $$(".g-days li", panels[i]).forEach(markDays);
  }
  $$("[data-tabs]").forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectTab(box, i); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = tabs.length;
        if (k === "ArrowRight") { e.preventDefault(); selectTab(box, (i + 1) % n, true); }
        else if (k === "ArrowLeft") { e.preventDefault(); selectTab(box, (i + n - 1) % n, true); }
        else if (k === "Home") { e.preventDefault(); selectTab(box, 0, true); }
        else if (k === "End") { e.preventDefault(); selectTab(box, n - 1, true); }
      });
    });
  });

  /* ---------- línea de días que se enciende ---------- */
  var dayIO = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-on"); dayIO.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -35% 0px" }) : null;
  function markDays(li) { if (dayIO) dayIO.observe(li); else li.classList.add("is-on"); }
  $$(".g-days li").forEach(markDays);

  /* ---------- mito → realidad ---------- */
  $$(".g-mito").forEach(function (m) {
    m.classList.add("is-closed");
    var b = document.createElement("button");
    b.type = "button"; b.className = "g-mito__go"; b.setAttribute("aria-expanded", "false");
    b.innerHTML = "<span>Ver la realidad</span>";
    b.addEventListener("click", function () { m.classList.remove("is-closed"); b.remove(); });
    m.appendChild(b);
  });

  /* ---------- test del viajero ---------- */
  var quiz = $("[data-quiz]");
  if (quiz) {
    var opts = $$(".g-opt", quiz), res = $(".g-quiz__res", quiz), out = $("[data-res]", quiz);
    var iti = $("[data-iti]");
    var pick = function (o) {
      opts.forEach(function (x) { x.setAttribute("aria-checked", String(x === o)); x.tabIndex = x === o ? 0 : -1; });
      out.textContent = o.dataset.name + " · " + o.dataset.days;
      res.hidden = false;
      quiz.dataset.tab = o.dataset.tab;
    };
    opts.forEach(function (o, i) {
      o.tabIndex = i === 0 ? 0 : -1;
      o.addEventListener("click", function () { pick(o); });
      o.addEventListener("keydown", function (e) {
        var n = opts.length, j = -1;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % n;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i + n - 1) % n;
        if (j > -1) { e.preventDefault(); opts[j].focus(); pick(opts[j]); }
      });
    });
    var go = $("[data-go-iti]", quiz);
    if (go) go.addEventListener("click", function () {
      if (iti && quiz.dataset.tab) selectTab(iti, parseInt(quiz.dataset.tab, 10));
    });
  }

  /* ---------- conversor ---------- */
  var conv = $("[data-conv]");
  if (conv) {
    var rb = $$("[data-rate]", conv), amt = $("input", conv), o = $("[data-out]", conv), lab = $("[data-cur-label]", conv);
    var rate = 3.43;
    var fmt = function (n) { return n.toLocaleString("es-AR", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 }); };
    var calc = function () { var v = parseFloat(String(amt.value).replace(",", ".")); o.textContent = (isFinite(v) && v > 0 ? fmt(v * rate) : "0") + " PEN"; };
    rb.forEach(function (b) {
      b.addEventListener("click", function () {
        rb.forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
        rate = parseFloat(b.dataset.rate); lab.textContent = b.dataset.cur; calc();
      });
    });
    amt.addEventListener("input", calc);
    calc();
  }

  /* ---------- boleto turístico ---------- */
  var bol = $("[data-boleto]");
  if (bol) {
    var cks = $$("input", bol), msg = $(".g-boleto__out", bol);
    var upd = function () {
      var n = cks.filter(function (c) { return c.checked; }).length, sum = n * 70;
      if (!n) msg.textContent = "Marcá los circuitos que te interesan.";
      else if (sum < 130) msg.innerHTML = "Te conviene el circuito suelto: <b>S/ " + sum + "</b>. El integral sale S/ 130.";
      else msg.innerHTML = "Te conviene el <b>integral: S/ 130</b>, ahorrás <b>S/ " + (sum - 130) + "</b> frente a comprar " + n + " circuitos sueltos (S/ " + sum + ") y te sobran días (vale 10).";
    };
    cks.forEach(function (c) { c.addEventListener("change", upd); });
  }

  /* ---------- checklist ---------- */
  var chk = $("[data-check]");
  if (chk) {
    var boxes = $$('input[type="checkbox"]', chk);
    var KEY = "ll-guia-checklist";
    var saved = {};
    try { saved = JSON.parse(store.get(KEY) || "{}"); } catch (e) { saved = {}; }
    var done = $("[data-done]", chk), total = $("[data-total]", chk), meter = $(".g-check__meter", chk), mi = $("i", meter);
    total.textContent = boxes.length;
    var paint = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      done.textContent = n;
      mi.style.transform = "scaleX(" + (n / boxes.length).toFixed(3) + ")";
      meter.setAttribute("aria-valuenow", String(Math.round(100 * n / boxes.length)));
    };
    boxes.forEach(function (b) {
      b.checked = !!saved[b.dataset.k];
      b.addEventListener("change", function () {
        saved[b.dataset.k] = b.checked ? 1 : 0;
        store.set(KEY, JSON.stringify(saved));
        paint();
      });
    });
    paint();
    $("[data-reset]", chk).addEventListener("click", function () {
      boxes.forEach(function (b) { b.checked = false; });
      saved = {}; store.set(KEY, "{}"); paint();
    });
    $("[data-print]", chk).addEventListener("click", function () {
      document.body.classList.add("g-print-check");
      window.print();
    });
    window.addEventListener("afterprint", function () { document.body.classList.remove("g-print-check"); });
  }

  /* ---------- glosario ---------- */
  var gl = $("[data-gl]");
  if (gl) {
    var rows = $$("tbody tr", gl), q = $("input", gl), empty = $(".g-gl__e", gl);
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    q.addEventListener("input", function () {
      var t = norm(q.value.trim()), vis = 0;
      rows.forEach(function (r) { var h = t && norm(r.textContent).indexOf(t) < 0; r.hidden = h; if (!h) vis++; });
      empty.hidden = vis > 0;
    });
  }
})();
