/* Luna Llena Travel */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  const WA_NUMBER = "51982360927";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Iconos (trazos estilo Lucide) ---------- */
  const ICONS = {
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    star: '<path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.11a.56.56 0 0 0 .48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.18.56l1.28 5.39a.56.56 0 0 1-.84.61l-4.73-2.89a.56.56 0 0 0-.59 0l-4.73 2.89a.56.56 0 0 1-.84-.61l1.28-5.39a.56.56 0 0 0-.18-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.52-.44a.56.56 0 0 0 .48-.35z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    lang: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    train: '<rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8M8 19l-2 3M18 22l-2-3M8 15h0M16 15h0"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.5 6.5h.01"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    tiktok: '<path d="M16 2.5c.4 2.7 2.3 4.6 5 4.9v3.6c-1.9 0-3.6-.6-5-1.6V16a6 6 0 1 1-6-6v3.7a2.4 2.4 0 1 0 2.4 2.3V2.5z"/>',
    tripadvisor: '<circle cx="6.8" cy="13.5" r="4"/><circle cx="17.2" cy="13.5" r="4"/><circle cx="6.8" cy="13.5" r="1"/><circle cx="17.2" cy="13.5" r="1"/><path d="M2 9.5h3.2M18.8 9.5H22M5 9.5C7.2 7.4 9.5 6.6 12 6.6s4.8.8 7 2.9M10.6 17.4 12 19.6l1.4-2.2"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.910a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'
  };
  const WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.46 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.630l6.03-1.58a11.34 11.34 0 0 0 5.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.37 0-3.03-1.18-5.890-3.32-8.03"/></svg>';

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }
  document.querySelectorAll("i[data-i]").forEach((el) => { el.outerHTML = icon(el.dataset.i); });
  document.querySelectorAll("[data-wa-icon]").forEach((el) => { el.innerHTML = WA_SVG; });

  /* ---------- Cabecera y pie compartidos ---------- */
  const root = document.body.dataset.root || "";
  const page = document.body.dataset.page;
  /* Redes: las que no tienen enlace se muestran como pendientes */
  const SOCIAL = [
    ["Instagram", "instagram", "https://www.instagram.com/lunallenatours/"],
    ["TripAdvisor", "tripadvisor", "https://www.tripadvisor.com.pe/Attraction_Review-g294314-d28259074-Reviews-Luna_Llena_Travel-Cusco_Cusco_Region.html"],
    ["Facebook", "facebook", "https://www.facebook.com/AgenciadeviajesLunaLlena/"],
    ["TikTok", "tiktok", "https://www.tiktok.com/@luna.llena.travel"]
  ];
  const socialHTML = () => {
    const pend = SOCIAL.filter((s) => !s[2]).map((s) => s[0]);
    return '<div class="social">' + SOCIAL.map((s) => s[2]
      ? '<a class="social__a" href="' + s[2] + '" target="_blank" rel="noopener" aria-label="' + s[0] + ' de Luna Llena">' + icon(s[1]) + "</a>"
      : "").join("") +
      "</div>";
  };
  const waLink = (msg) => "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg || "Hola Luna Llena, quiero información sobre un viaje");

  document.documentElement.dataset.theme = "premium";

  const header = document.querySelector("[data-header]");
  if (header) {
    header.outerHTML =
      '<header class="header" id="top"><div class="wrap header__in">' +
      '<a class="brand brand--logo" href="' + root + '/"><img src="' + root + '/assets/logo.svg" alt="Luna Llena Travel, inicio" width="48" height="48"></a>' +
      '<nav class="nav" id="nav" aria-label="Principal">' +
      '<a href="' + root + '/"' + (page === "home" ? ' aria-current="page"' : "") + ">Inicio</a>" +
      '<a href="' + root + '/paquetes/"' + (page === "pkg" || page === "list" ? ' aria-current="page"' : "") + ">Paquetes</a>" +
      '<a href="' + root + '/nosotros/"' + (page === "about" ? ' aria-current="page"' : "") + ">Nosotros</a>" +
      '<a href="' + root + '/#contacto">Contacto</a>' +
      "</nav>" +
      '<div class="header__actions">' +
      '<a class="wa-ico" href="' + waLink() + '" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp" title="WhatsApp">' + WA_SVG + "</a>" +
      '<a class="btn btn--ghost btn--wa" href="' + waLink() + '" target="_blank" rel="noopener">' + WA_SVG + 'Consultar</a>' +
      '<button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav">' + icon("menu") + "</button>" +
      "</div></div></header>";
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.outerHTML =
      '<footer class="footer" id="contacto"><div class="wrap">' +
      '<div class="footer__grid">' +
      '<div><a class="brand" href="' + root + '/"><img src="' + root + '/assets/logo.svg" alt="" width="42" height="42"><span class="brand__name">Luna Llena<small>TRAVEL</small></span></a>' +
      '<p style="margin-top:16px;max-width:34ch">Agencia de viajes en Perú desde hace 8 años, con oficinas en Cusco y Lima. Machu Picchu, Valle Sagrado, treks y paquetes por todo Perú.</p>' + socialHTML() + "</div>" +
      '<div><h4>Viajes</h4><ul><li><a href="' + root + '/paquetes/#machu-picchu">Machu Picchu</a></li><li><a href="' + root + '/paquetes/#cusco">Tours en Cusco</a></li><li><a href="' + root + '/paquetes/#treks">Treks alternativos</a></li><li><a href="' + root + '/aventura/">Cusco Aventura</a></li><li><a href="' + root + '/paquetes/#paquetes">Paquetes por Perú</a></li><li><a href="' + root + '/paquetes/#retiros">Retiros y ceremonias</a></li><li><a href="' + root + '/entradas/">Boletos y entradas</a></li></ul></div>' +
      '<div><h4>Oficinas</h4><ul><li>Calle Chihuampata 543, San Blas, Cusco</li><li>Av. San Borja Sur 659-B, Lima</li></ul></div>' +
      '<div><h4>Contacto</h4><ul>' +
      '<li><a href="' + waLink() + '" target="_blank" rel="noopener">WhatsApp +51 982 360 927</a></li>' +
      '<li><a href="mailto:fullmoontravelagency@gmail.com">fullmoontravelagency@gmail.com</a></li>' +
      '<li><a href="mailto:lunallenatours@gmail.com">lunallenatours@gmail.com</a></li></ul></div>' +
      "</div>" +
      '<div class="footer__legal"><span>© 2026 Full Moon Travel Agency E.I.R.L. · RUC 20603319428</span><span>Términos y condiciones · Política de cancelación · Libro de reclamaciones</span></div>' +
      "</div></footer>";
  }

  /* Fotos que no cargan (la web actual está caída): recuadro neutro en vez de ícono roto */
  const PH_IMG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#F3E7DA"/><circle cx="300" cy="185" r="34" fill="#FF7A00" opacity=".35"/><path d="M200 260l60-50 40 30 50-45 50 65" fill="none" stroke="#B34D00" stroke-width="6" opacity=".35"/><text x="300" y="320" font-family="Inter,Arial,sans-serif" font-size="20" fill="#8A6A4C" text-anchor="middle">Foto pendiente</text></svg>');
  const imgOff = (img) => { if (img.dataset.off) return; img.dataset.off = "1"; img.removeAttribute("srcset"); img.src = PH_IMG; };
  document.addEventListener("error", (e) => { if (e.target.tagName === "IMG") imgOff(e.target); }, true);
  document.querySelectorAll("img").forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) imgOff(img); });

  document.querySelectorAll("[data-social]").forEach((el) => { el.innerHTML = socialHTML(); });

  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = waLink(a.dataset.wa);
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* Menú móvil */
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Scroll suave (Lenis) ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -84 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    history.pushState(null, "", url.hash);
  });

  /* Cabecera con sombra al hacer scroll */
  const headerEl = document.querySelector(".header");
  const onScroll = () => {
    const y = window.scrollY;
    if (headerEl) headerEl.classList.toggle("is-scrolled", y > 8);
    if (!reduceMotion) {
      document.querySelectorAll("[data-parallax]").forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        el.style.transform = "translate3d(0," + (r.top * -0.18).toFixed(1) + "px,0)";
      });
    }
    updateTimeline();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Aparición de secciones */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -10% 0px" }) : null;
  document.querySelectorAll(".reveal").forEach((el, i) => {
    if (io) io.observe(el); else el.classList.add("is-in");
  });

  /* Línea de tiempo del itinerario */
  const timeline = document.querySelector(".timeline");
  const progress = document.querySelector(".timeline__progress");
  function updateTimeline() {
    if (!timeline || !progress) return;
    const r = timeline.getBoundingClientRect();
    const mid = innerHeight * 0.55;
    const h = Math.max(0, Math.min(r.height - 20, mid - r.top));
    progress.style.height = h + "px";
    timeline.querySelectorAll(".day").forEach((d) => {
      d.classList.toggle("is-active", d.getBoundingClientRect().top < mid);
    });
  }
  onScroll();

  /* ---------- Reserva desde la ficha del paquete ---------- */
  const fmt = (n) => "USD " + Math.round(n).toLocaleString("en-US");
  document.querySelectorAll("[data-stepper]").forEach((st) => {
    const out = st.querySelector("output");
    const input = st.querySelector("input");
    const min = st.dataset.min ? +st.dataset.min : 1, max = +st.dataset.max || 12;
    const [minus, plus] = st.querySelectorAll("button");
    const set = (v) => {
      v = Math.max(min, Math.min(max, v));
      input.value = v; out.textContent = v;
      minus.disabled = v <= min; plus.disabled = v >= max;
      st.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    };
    minus.addEventListener("click", () => set(+input.value - 1));
    plus.addEventListener("click", () => set(+input.value + 1));
    st.setValue = set;
    set(+input.value);
  });

  /* Adultos y menores, con la edad de cada menor */
  let ageSeq = 0;
  function initTravelers(box, minAge, initAges) {
    const ages = box.querySelector("[data-ages]");
    const warn = box.querySelector("[data-age-warn]");
    const adults = box.querySelector('input[name="adultos"]');
    const minors = box.querySelector('input[name="menores"]');
    initAges = initAges || [];
    const selects = () => [...ages.querySelectorAll("select")];
    function draw() {
      const n = +minors.value;
      if (selects().length === n) return;
      const prev = selects().map((x) => x.value);
      let html = "";
      for (let i = 0; i < n; i++) {
        const id = "age-" + ++ageSeq;
        const val = prev[i] !== undefined ? prev[i] : (initAges[i] || "");
        let opts = '<option value="">Elige</option>';
        for (let a = 0; a <= 17; a++) opts += '<option value="' + a + '"' + (String(a) === val ? " selected" : "") + ">" + (a === 0 ? "Menos de 1 año" : a + (a === 1 ? " año" : " años")) + "</option>";
        html += '<div class="field"><label for="' + id + '">Edad del menor ' + (i + 1) + '</label><select id="' + id + '" name="edad" required>' + opts + '</select><span class="err">Indica la edad.</span></div>';
      }
      ages.innerHTML = html + (n ? '<p class="ages__note">La tarifa para menores la confirma la agencia. Por ahora el total los cuenta como adultos.</p>' : "");
      check();
    }
    function check() {
      const young = selects().filter((x) => x.value !== "" && +x.value < minAge);
      warn.hidden = !young.length;
      if (young.length) warn.innerHTML = "<b>Este paquete es para mayores de " + minAge + " años.</b> Escríbenos por WhatsApp y te proponemos una alternativa para viajar con niños más pequeños.";
      return !young.length;
    }
    box.addEventListener("change", (e) => { if (e.target.tagName === "SELECT") { e.target.closest(".field").classList.remove("is-invalid"); check(); } else draw(); });
    draw();
    return {
      count: () => +adults.value + +minors.value,
      adults: () => +adults.value,
      ages: () => selects().map((x) => x.value),
      setCounts: (a, m) => { adults.closest("[data-stepper]").setValue(a); minors.closest("[data-stepper]").setValue(m); },
      valid() {
        let ok = true;
        selects().forEach((x) => { const bad = x.value === ""; x.closest(".field").classList.toggle("is-invalid", bad); if (bad && ok) { ok = false; x.focus(); } });
        return check() && ok;
      },
      label() {
        const a = +adults.value, ag = selects().map((x) => x.value);
        let t = a + (a === 1 ? " adulto" : " adultos");
        if (ag.length) t += " · " + ag.length + (ag.length === 1 ? " menor" : " menores") + (ag.every((v) => v !== "") ? " (" + ag.map((v) => (v === "0" ? "<1" : v)).join(", ") + " años)" : "");
        return t;
      }
    };
  }

  const bookForm = document.querySelector("[data-book]");
  if (bookForm) {
    let price = +bookForm.dataset.price;
    /* Tarifa (extranjero/nacional o modalidad): cambia el precio por persona */
    const tarifaSel = bookForm.querySelector("[data-tarifa]");
    if (tarifaSel) tarifaSel.addEventListener("change", () => {
      price = +tarifaSel.selectedOptions[0].dataset.price;
      bookForm.querySelector('input[name="precio"]').value = price;
    });
    const totalEl = bookForm.querySelector("[data-book-total]");
    const dateInput = bookForm.querySelector('input[type="date"]');
    const today = new Date(); today.setDate(today.getDate() + 2);
    dateInput.min = today.toISOString().slice(0, 10);
    const trav = initTravelers(bookForm.querySelector("[data-travelers]"), +bookForm.dataset.minAge || 0);
    const update = () => { totalEl.textContent = fmt(price * trav.count()); };
    bookForm.addEventListener("change", update);
    update();
    bookForm.addEventListener("submit", (e) => {
      const field = dateInput.closest(".field");
      const okTrav = trav.valid();
      if (!dateInput.value) { e.preventDefault(); field.classList.add("is-invalid"); dateInput.focus(); }
      else if (!okTrav) e.preventDefault();
    });
    dateInput.addEventListener("input", () => dateInput.closest(".field").classList.remove("is-invalid"));
  }

  /* Carrusel de insignias: botón para pausar (también se detiene con el mouse encima) */
  document.querySelectorAll("[data-marquee-toggle]").forEach((b) => b.addEventListener("click", () => {
    const paused = b.closest(".logos").querySelector("[data-marquee]").classList.toggle("is-paused");
    b.setAttribute("aria-pressed", paused);
    b.textContent = paused ? "Reanudar" : "Pausar";
  }));
})();

/* Ronda 7: Luna de viajeros. Cada foto vuela desde una posición dispersa hasta su celda del mosaico según el avance del scroll. */
(() => {
  const sec = document.querySelector("[data-moon]");
  if (!sec || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const disc = sec.querySelector(".moon__disc"), num = sec.querySelector("[data-moon-n]");
  const tiles = [...disc.children];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const data = tiles.map((el, i) => {
    const c = i % 8 - 3.5, r = Math.floor(i / 8) - 3.5;
    return { el, c, r, ux: rnd() * 2 - 1, uy: rnd() * 2 - 1, rot: (rnd() * 2 - 1) * 26, dist: Math.hypot(c, r), jit: rnd() * 0.06 };
  });
  const maxDist = Math.hypot(3.5, 3.5);
  sec.classList.add("is-anim");
  let W = 0, H = 0, cell = 0, dy0 = 0;
  const measure = () => {
    W = innerWidth; H = sec.querySelector(".moon__sticky").clientHeight;
    const d = disc.getBoundingClientRect(), s = sec.querySelector(".moon__sticky").getBoundingClientRect();
    cell = d.width / 8;
    dy0 = (s.top + H / 2) - (d.top + d.height / 2);
  };
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let last = -1, done = false;
  const draw = () => {
    const rect = sec.getBoundingClientRect();
    const total = sec.offsetHeight - H;
    let p = clamp(-rect.top / total);
    if (done) p = 1; else if (p >= 0.92) done = true;
    if (Math.abs(p - last) < 0.0005) return;
    last = p;
    const scale0 = W < 700 ? 1.15 : 1.4;
    for (const t of data) {
      const k = ease(clamp((p - 0.04 - 0.34 * (t.dist / maxDist) - t.jit) / 0.36));
      const sx = t.ux * (W / 2 - cell), sy = dy0 + t.uy * (H / 2 - cell);
      const nx = t.c * cell, ny = t.r * cell;
      const x = (sx - nx) * (1 - k), y = (sy - ny) * (1 - k);
      const s = scale0 + (1.015 - scale0) * k;
      t.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) rotate(" + (t.rot * (1 - k)).toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
      t.el.style.setProperty("--f", (1 - k).toFixed(3));
    }
    const m = clamp((p - 0.8) / 0.12);
    disc.style.clipPath = p < 0.8 ? "none" : "circle(" + (71 - 21 * ease(m)).toFixed(2) + "% at 50% 50%)";
    disc.parentNode.style.setProperty("--glow", ease(m).toFixed(3));
    num.textContent = "+" + Math.round(1000 * ease(clamp(p / 0.82)));
  };
  let on = false;
  const loop = () => { if (!on) return; draw(); requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) { last = -1; requestAnimationFrame(loop); } }, { rootMargin: "100px 0px" }).observe(sec);
  addEventListener("resize", () => { measure(); last = -1; draw(); });
  measure(); draw();
})();

/* Ronda 8: en /paquetes/ primero se ven las categorías; al elegir una aparecen sus paquetes. */
(() => {
  const hub = document.querySelector("[data-hub]");
  if (!hub) return;
  const root = document.documentElement;
  const secs = [...document.querySelectorAll(".cat-section")];
  const tabs = [...document.querySelectorAll(".cat-tabs a")];
  const top = document.querySelector(".cat-tabs");
  root.classList.add("has-hub");
  const show = (id, scroll) => {
    const sec = secs.find((x) => x.id === id);
    secs.forEach((x) => x.classList.toggle("is-open", x === sec));
    tabs.forEach((a) => a.setAttribute("aria-current", sec && a.getAttribute("href") === "#" + id ? "true" : "false"));
    if (sec) root.dataset.cat = id; else delete root.dataset.cat;
    const cur = top.querySelector('[aria-current="true"]');
    if (cur) top.scrollLeft = cur.offsetLeft - top.offsetLeft - 16;
    if (sec) sec.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
    if (scroll) window.scrollTo({ top: sec ? 0 : Math.max(0, hub.getBoundingClientRect().top + scrollY - 110) });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !(hub.contains(a) || top.contains(a))) return;
    e.preventDefault();
    e.stopPropagation();
    const id = a.getAttribute("href").slice(1);
    history.pushState(null, "", id === "todas" ? location.pathname : "#" + id);
    show(id, true);
    if (id !== "todas") top.querySelector('[aria-current="true"]')?.focus({ preventScroll: true });
  }, true);
  addEventListener("popstate", () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), !!location.hash);
})();

/* Ronda 11: /nosotros/. Cifras animadas al aparecer y collage de viajeros con desplazamiento por columnas. */
(() => {
  const facts = document.querySelector("[data-facts]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (facts && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-facts");
    const num = facts.querySelector("[data-count]");
    const end = +num.dataset.count;
    if (!reduce) num.textContent = "+0";
    new IntersectionObserver((entries, io) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      facts.classList.add("is-on");
      if (reduce) return;
      const t0 = performance.now(), dur = 2000;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        num.textContent = "+" + Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.35 }).observe(facts);
  }
  const col = document.querySelector("[data-collage]");
  if (!col || reduce) return;
  const cols = [...col.children].map((el) => ({ el, v: +el.dataset.speed }));
  let on = false;
  const draw = () => {
    if (!on) return;
    const r = col.getBoundingClientRect();
    const d = r.top + r.height / 2 - innerHeight / 2;
    for (const c of cols) c.el.style.transform = "translate3d(0," + (d * c.v).toFixed(1) + "px,0)";
    requestAnimationFrame(draw);
  };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(draw); }, { rootMargin: "200px 0px" }).observe(col);
})();

/* Ronda 13: /paquetes/. Enlaces para cambiar de sección o volver al índice, y título de la pestaña según la sección. */
(() => {
  const hub = document.querySelector("[data-hub]");
  if (!hub) return;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-cat-go]");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    const id = a.dataset.catGo;
    history.pushState(null, "", id ? "#" + id : location.pathname);
    dispatchEvent(new PopStateEvent("popstate"));
  }, true);
  const base = document.title;
  const sync = () => {
    const id = document.documentElement.dataset.cat;
    const t = id && document.querySelector("#" + CSS.escape(id) + " .cat-hero__t");
    document.title = t ? t.textContent + " · Luna Llena Travel" : base;
    if (t) t.focus({ preventScroll: true });
  };
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-cat"] });
  sync();
})();

/* Ronda 14: home. El contador de viajeros arranca en 0 y llega a 1000 cuando aparece el collage. */
(() => {
  const num = document.querySelector("[data-vjx-count]");
  if (!num || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const end = +num.dataset.vjxCount;
  num.textContent = "+0";
  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 2000;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      num.textContent = "+" + Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.4 }).observe(num);
})();

/* Ronda 17: home. La foto de portada rota con fundido suave; muestra el crédito de las fotos de Unsplash. */
(() => {
  const box = document.querySelector("[data-hero-slides]");
  if (!box) return;
  const imgs = [...box.querySelectorAll("img")];
  const credit = document.querySelector("[data-hero-credit]");
  const utm = "?utm_source=luna_llena_travel&utm_medium=referral";
  let i = 0;
  const show = (n) => {
    imgs[i].classList.remove("is-on");
    i = n;
    imgs[i].classList.add("is-on");
    const c = imgs[i].dataset.credit;
    if (!credit) return;
    if (!c) { credit.hidden = true; return; }
    const [name, user] = c.split("|");
    credit.innerHTML = 'Foto: <a href="https://unsplash.com/@' + user + utm + '" target="_blank" rel="noopener">' + name + '</a> / <a href="https://unsplash.com/' + utm + '" target="_blank" rel="noopener">Unsplash</a>';
    credit.hidden = false;
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || imgs.length < 2) return;
  setInterval(() => {
    if (document.hidden || box.getBoundingClientRect().bottom < 0) return;
    const next = (i + 1) % imgs.length;
    if (!imgs[next].complete) { imgs[next].loading = "eager"; return; }
    show(next);
  }, 6500);
  imgs.slice(1).forEach((img) => { img.loading = "eager"; });
})();

/* Ronda 24: cotización por WhatsApp. El botón se habilita con nombre y teléfono; arma el mensaje con todo el pedido. */
(() => {
  const WA = "51982360927";
  const ok = (form) => [...form.querySelectorAll("[data-req]")].every((i) => i.value.trim() && i.checkValidity());
  document.querySelectorAll("[data-quote]").forEach((form) => {
    const btn = form.querySelector("[data-quote-btn]");
    const hint = form.querySelector("[data-quote-hint]");
    const sync = () => { const v = ok(form); btn.disabled = !v; hint.hidden = v; };
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    sync();
  });
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-quote]");
    if (!form) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!ok(form)) return;
    const val = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
    const tarifa = form.querySelector("[data-tarifa]");
    const fecha = val("fecha") ? new Date(val("fecha") + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : "a definir";
    const ad = +val("adultos") || 1, mi = +val("menores") || 0;
    const ages = [...form.querySelectorAll("[data-ages] select")].map((s) => s.value).filter((v) => v !== "");
    let pax = ad + (ad === 1 ? " adulto" : " adultos");
    if (mi) pax += ", " + mi + (mi === 1 ? " menor" : " menores") + (ages.length ? " (" + ages.join(", ") + " años)" : "");
    const total = form.querySelector("[data-book-total]");
    const VT = window.VT;
    const codigo = VT ? VT.codigo() : "";
    /* El pedido también queda como lead en el CRM, con el mismo código que va en el mensaje */
    if (VT) {
      const ficha = VT.ficha() || {};
      const ctx = VT.contexto();
      const body = {
        nombre: val("q_nombre"), telefono: val("q_tel"), detalles: val("q_detalles"),
        paquete_slug: ficha.slug, paquete_nombre: ficha.nombre || val("nombre"), tipo: ficha.tipo,
        tarifa: tarifa ? tarifa.value : "", fecha: val("fecha"), adultos: ad, menores: mi, edades: ages,
        total: total ? total.textContent : "", codigo, manychat_id: VT.manychatId(), sesion_id: VT.sesion(), pagina: location.pathname,
        utm_source: ctx.utm_source, utm_medium: ctx.utm_medium, utm_campaign: ctx.utm_campaign, utm_content: ctx.utm_content,
        referrer: ctx.referrer, interno: VT.interno(), tiempo_ms: Date.now() - VT.inicio
      };
      try { fetch("/api/cotizacion-web/", { method: "POST", body: JSON.stringify(body), keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {}); } catch (err) {}
      VT.evento(VT.EV.LEAD_ENVIADO, { paquete: ficha.slug, codigo });
      VT.enviar();
    }
    const lines = [
      "Hola Luna Llena, quiero cotizar: " + val("nombre"),
      tarifa ? "Tarifa: " + tarifa.value : "",
      "Fecha aproximada: " + fecha,
      "Viajeros: " + pax,
      total ? "Total aproximado: " + total.textContent : "",
      "",
      "Nombre: " + val("q_nombre"),
      "Teléfono: " + val("q_tel"),
      val("q_detalles") ? "Detalles: " + val("q_detalles") : "",
      codigo ? "(ref " + codigo + ")" : ""
    ].filter((l, i) => l || i === 5);
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  }, true);
})();
