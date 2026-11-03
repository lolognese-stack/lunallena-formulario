/* Formulario "Cuéntanos sobre tu viaje" (/cotizar/).
 *
 * Reconstruido a partir del formulario que estaba en luna-llena-viaje.vercel.app
 * (mismos pasos, mismo score). Cambios:
 * - "Quiero cotizar un paquete de la web" ya no pregunta nada: manda a /paquetes/,
 *   donde cada ficha tiene su propio cotizador.
 * - El lead va al CRM por /api/cotizar-web/ (vercel.json lo reenvía a
 *   crm-plantilla), con el código LL- de la visita y el manychat_id de ll-t.js.
 * - La pantalla final suma autoridad (años, agencia registrada, TripAdvisor,
 *   collage de viajeros, reseña, sellos) antes del beneficio de WhatsApp.
 *
 * Pasos: itinerario → (si: dias exactos + armar el itinerario) | (no: duracion + destinos guiados)
 *        → fecha → pasajes → personas → nombre → whatsapp → presupuesto
 *        [→ presupuestoRango] → notas → final.
 */
(function () {
  'use strict';

  var API_LEAD = '/api/cotizar-web/';
  var API_PAIS = '/api/pais/';
  var WHATSAPP = '51982360927';
  var URL_PAQUETES = '/paquetes/';
  var URL_TRIPADVISOR = 'https://www.tripadvisor.com.pe/Attraction_Review-g294314-d28259074-Reviews-Luna_Llena_Travel-Cusco_Cusco_Region.html';
  var CLAVE_ESTADO = 'll-cotizar-estado-v3';   // v3: días primero en las dos ramas
  var CLAVE_PENDIENTE = 'll-cotizar-pendiente';
  var DEBUG = new URLSearchParams(location.search).get('debug') === '1';

  // dias: lo que pide cada lugar para disfrutarlo sin correr (guía la rama
  // "todavía no tengo itinerario"; no es un dato de la agencia).
  var DESTINOS = [
    { id: 'lima', dias: 2, nombre: 'Lima', desc: 'Capital gastronómica frente al Pacífico' },
    { id: 'cusco', dias: 3, nombre: 'Cusco', desc: 'La antigua capital del Imperio inca' },
    { id: 'machu-picchu', dias: 2, nombre: 'Machu Picchu', desc: 'La ciudadela entre las nubes' },
    { id: 'valle-sagrado', dias: 1, nombre: 'Valle Sagrado', desc: 'Terrazas incas y pueblos andinos' },
    { id: 'arequipa', dias: 2, nombre: 'Arequipa', desc: 'La ciudad blanca al pie del Misti' },
    { id: 'colca', dias: 2, nombre: 'Cañón del Colca', desc: 'Cóndores sobre uno de los cañones más profundos' },
    { id: 'titicaca', dias: 2, nombre: 'Puno y Lago Titicaca', desc: 'Islas flotantes a casi 3.800 m' },
    { id: 'paracas-huacachina', dias: 2, nombre: 'Paracas y Huacachina', desc: 'Islas Ballestas y un oasis entre dunas' },
    { id: 'nazca', dias: 1, nombre: 'Nazca', desc: 'Las líneas que se ven desde el cielo' },
    { id: 'iquitos', dias: 3, nombre: 'Iquitos', desc: 'La Amazonía a bordo de un río' },
    { id: 'tambopata', dias: 3, nombre: 'Tambopata', desc: 'Selva, guacamayos y lagos' },
    { id: 'huaraz', dias: 3, nombre: 'Huaraz', desc: 'Nevados y lagunas turquesa' },
    { id: 'mancora', dias: 3, nombre: 'Máncora', desc: 'Sol y playa casi todo el año' },
    { id: 'trujillo-chiclayo', dias: 2, nombre: 'Trujillo y Chiclayo', desc: 'Chan Chan, huacas y cultura moche' }
  ];
  var FONDOS = ['machu-picchu', 'vinicunca', 'titicaca', 'colca', 'huacachina', 'ollantaytambo', 'laguna-69', 'amazonia']
    .map(function (n) { return '/cotizar/fondos/' + n + '.webp'; });
  // Collage de la pantalla final: [tira, foto 0..7, giro] de assets/viajeros.
  var COLLAGE = [
    [1, 2, -3], [4, 5, 2.4], [7, 3, -1.6], [2, 6, 3.2],
    [5, 1, 2.2], [8, 4, -2.8], [3, 0, 1.4], [6, 7, -3.4],
    [2, 2, -1.2], [7, 6, 2.8], [4, 0, -2.2], [1, 5, 1.8]
  ];
  // Paquetes de la web (/paquetes/) para sugerir según los días. Si cambia
  // el catálogo o un precio en paquetes/index.html, actualizar acá.
  var PAQUETES = [
    { url: "/paquetes/4d3n-cusco-tradicional/", img: "/assets/wp/2023/11/mapi2-1024x627.jpg", zona: "Cusco", nombre: "Cusco Tradicional", dias: 4, precio: "USD 371" },
    { url: "/paquetes/5d4n-cusco-intrepido/", img: "/assets/wp/2023/11/tour-7-lagunas-del-ausangate-cusco-870x555-1.jpg", zona: "Cusco", nombre: "Cusco Intrépido", dias: 5, precio: "USD 424" },
    { url: "/paquetes/6d5n-ruta-del-sol/", img: "/assets/wp/2023/11/puno1-1024x445.jpg", zona: "Cusco y Puno", nombre: "Cusco – Puno: Ruta del Sol", dias: 6, precio: "USD 505" },
    { url: "/paquetes/6d5n-wonder-travel/", img: "/assets/wp/2023/11/Camino-Inca-a-Machu-Picchu.webp", zona: "Cusco", nombre: "Wonder Travel", dias: 6, precio: "USD 467" },
    { url: "/paquetes/7d6n-cusco-legendario/", img: "/assets/wp/2023/11/huayna-picchu-girl-1024x538.jpg", zona: "Cusco", nombre: "Cusco Legendario", dias: 7, precio: "USD 513" },
    { url: "/paquetes/7d6n-full-aventura-por-cusco/", img: "/assets/wp/2023/11/lake-humantay.webp", zona: "Cusco", nombre: "Full Aventura por Cusco", dias: 7, precio: "USD 504" },
    { url: "/paquetes/8d7n-cusco-trequero/", img: "/assets/wp/2023/11/inca-trail-express-from-lima-by-andean-path-trek-1024x398.jpg", zona: "Cusco", nombre: "Cusco Trekero Inka", dias: 8, precio: "USD 513" },
    { url: "/paquetes/8d7n-desafio-tierra-inka/", img: "/assets/wp/2023/11/puno1-1024x445.jpg", zona: "Cusco y Puno", nombre: "Desafío Tierra Inka", dias: 8, precio: "USD 581" },
    { url: "/paquetes/9d8n-peru-profundo/", img: "/assets/wp/2023/11/cocalmayojpg-1-1024x576.webp", zona: "Cusco y Amazonía", nombre: "Perú Profundo", dias: 9, precio: "USD 583" },
    { url: "/paquetes/10d9n-peru-360-grados/", img: "/assets/wp/2023/11/79775-Colca-Canyon-1024x576.webp", zona: "Lima, Ica, Arequipa y Cusco", nombre: "Perú 360°", dias: 10, precio: "USD 655" },
    { url: "/paquetes/10d9n-peru-aire-mar-y-tierra/", img: "/assets/wp/2023/11/puno1-1024x445.jpg", zona: "Lima, Ica, Nazca, Cusco y Puno", nombre: "Perú Aire, Mar y Tierra", dias: 11, precio: "USD 639" },
    { url: "/paquetes/12d-9n-peru-magicosalar-de-uyuni/", img: "/assets/wp/2023/11/salar-uyuni-1024x512.jpg", zona: "Perú y Bolivia", nombre: "Perú Mágico + Salar de Uyuni", dias: 12, precio: "USD 719" }
  ];
  // Reseñas reales de TripAdvisor que eligió la agencia (las mismas del home y
  // de Nosotros). No inventar ni editar.
  var RESENAS = [
    { t: "Una experiencia que rompe esquemas", p: "Desde tours privados y un chofer dedicado hasta almuerzos gourmet servidos en medio de los Andes, estuvimos completamente consentidos. El itinerario también fue cuidadosamente diseñado para ayudar con la aclimatación de altitud. […] La compañía Luna llena Travel es de propiedad local, y se nota en el orgullo y cuidado de todos los que conocimos.", n: "Koyi K", f: "dic. 2025", src: "Traducida del inglés · Reseña en TripAdvisor" },
    { t: "Muchas gracias a todos los chicos de Luna Llena", p: "Me encantó el itinerario que me brindaron de principio a fin, el tour de 02 días a Machupicchu fue mágico, nuestro guía Cristian un señor profesional que nos enganchó a mis hijos y papás, que es difícil de lograr […] nos trataron de lujo. Muchas gracias Álvaro por tu paciencia y tu predisposición.", n: "Midori Carrillo", f: "Cali, Colombia · ago. 2024", src: "Reseña en TripAdvisor" },
    { t: "Entre montañas sagradas y sueños cumplidos", p: "La experiencia del itinerario Valle Sagrado y Machu Picchu fue simplemente increíble. Todo estuvo muy bien organizado, con guías profesionales, tiempos adecuados y una atención cálida en cada momento. Totalmente recomendada para conocer Cusco y Machu Picchu sin preocupaciones.", n: "victor O", f: "jun. 2025 · Amigos", src: "Reseña en TripAdvisor" },
    { t: "Caminata y aventura para llegar a Choquequirao", p: "La caminata fue desafiante pero preciosa. Estaba muy bien organizado y estamos contentos de haber reservado con Luna Llena: nuestro guía Álvaro nos cuidó muy bien, era amable, bien informado y servicial, ¡con mucha paciencia! […] La comida peruana que nos preparó nuestro cocinero Ernesto fue deliciosa y abundante. ¡Ha sido una gran aventura!", n: "Maria C", f: "dic. 2025 · Parejas", src: "Traducida del inglés · Reseña en TripAdvisor" },
    { t: "Desafío Inka 7 días: Salkantay y Camino Inka a Machu Picchu", p: "Hice el 7D/6N Salkantay + Inca Trail y ante todo recomendaría esta experiencia a cualquiera que tenga dudas o que esté explorando diferentes rutas o agencias. Esta ruta tiene todo lo necesario en términos de paisajes, desafíos y ecosistemas. […] La comida estaba fuera de este mundo.", n: "Mario E", f: "dic. 2025 · Amigos", src: "Traducida del inglés · Reseña en TripAdvisor" }
  ];
  // Equipo (nombres de /nosotros/#equipo). Álvaro va aparte, como dueño.
  var EQUIPO = [
    { foto: 2, nombre: 'Manuel Arbulu' },
    { foto: 3, nombre: 'Christian Pérez' },
    { foto: 4, nombre: 'Alexander Huamán' },
    { foto: 5, nombre: 'Leidy Canal' }
  ];
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var hoy = function () { return new Date().toISOString().slice(0, 10); };
  var nuevoId = function () {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return String(Date.now()) + Math.random().toString(16).slice(2);
  };
  var vt = function () { return window.VT || null; };
  var nombreDestino = function (id) {
    var d = DESTINOS.find(function (x) { return x.id === id; });
    return d ? d.nombre : id;
  };

  // Rama "si" (ya tiene itinerario): dias = total exacto y tramos = el
  // itinerario en orden ({ id, nombre, dias }; id null = destino escrito a mano,
  // el mismo destino puede repetirse). Rama "no": destinos + diasMin/diasMax.
  function datosVacios() {
    return {
      itinerario: null, dias: null, tramos: [], ordenNota: '', destinos: [], otros: '',
      diasMin: null, diasMax: null, fechaExacta: null, mes: null, pasajes: null,
      adultos: null, ninos: 0, edades: [], presupuesto: null, presupuestoRango: null,
      notas: '', nombre: '', whatsapp: ''
    };
  }

  var qs = new URLSearchParams(location.search);
  var st = {
    d: datosVacios(),
    idx: 0,
    id: nuevoId(),
    inicio: Date.now(),
    completado: false,
    envio: 'enviando',
    restaurado: false,
    rangoDias: false,
    prefijo: '+51 ',
    crmId: null,
    crmPromise: null,
    ctx: { origen: qs.get('origen'), utm_source: qs.get('utm_source'), utm_campaign: qs.get('utm_campaign') }
  };

  function pasos(d) {
    var p = ['itinerario'];
    if (d.itinerario === 'si') {
      p.push('dias', 'armar');
    } else if (d.itinerario === 'no') {
      p.push('duracion', 'destinos');
    }
    p.push('fecha', 'pasajes', 'personas', 'nombre', 'whatsapp', 'presupuesto');
    if (d.presupuesto === 'si') p.push('presupuestoRango');
    p.push('notas');
    return p;
  }
  var pasoActual = function () { return pasos(st.d)[st.idx]; };

  // ---- validaciones ----
  function validarAdultos(n) {
    if (n == null || isNaN(n)) return 'Dinos cuántos adultos viajan';
    return n < 1 || n > 20 ? 'Entre 1 y 20 adultos' : null;
  }
  function validarDias(min, max) {
    if (min == null || isNaN(min)) return 'Dinos cuántos días';
    if (min < 1 || min > 90) return 'Entre 1 y 90 días';
    if (max != null) {
      if (max < 1 || max > 90) return 'Entre 1 y 90 días';
      if (max <= min) return 'El máximo tiene que ser mayor que el mínimo';
    }
    return null;
  }
  function validarWhatsapp(v) {
    var dig = v.replace(/\D/g, '');
    return dig.length < 8 || dig.length > 18 || (!v.trim().startsWith('+') && dig.length < 10)
      ? 'Ese número no parece válido: pon el código de país'
      : null;
  }

  // ---- piezas de HTML ----
  function opcionesHtml(ops, sel, multi) {
    return ops.map(function (o, i) {
      var on = multi ? sel.indexOf(o.valor) >= 0 : sel === o.valor;
      if (o.href) {
        return '<a class="opcion opcion--sale" href="' + esc(o.href) + '" data-sale="' + esc(o.valor) + '">' +
          '<span class="num">' + (i + 1) + '</span>' +
          '<span class="txt">' + esc(o.etiqueta) + (o.desc ? '<span class="desc">' + esc(o.desc) + '</span>' : '') + '</span>' +
          '<span class="flecha" aria-hidden="true">↗</span></a>';
      }
      return '<button type="button" class="opcion ' + (on ? 'sel ' : '') + (multi ? 'check' : '') + '" data-v="' + esc(o.valor) +
        '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '">' +
        '<span class="num">' + (multi ? (on ? '✓' : '') : i + 1) + '</span>' +
        '<span class="txt">' + esc(o.etiqueta) + (o.desc ? '<span class="desc">' + esc(o.desc) + '</span>' : '') + '</span>' +
        (multi ? '' : '<span class="flecha" aria-hidden="true">→</span>') + '</button>';
    }).join('');
  }
  function stepperHtml(id, valor, o) {
    o = o || {};
    return '<div class="stepper ' + (o.mini ? 'mini' : '') + '" data-stepper="' + id + '" data-min="' + (o.min || 1) + '" data-max="' + (o.max || 999) + '">' +
      '<button type="button" data-delta="-1" aria-label="Restar">−</button>' +
      '<input class="campo" id="' + id + '" type="number" inputmode="numeric" pattern="[0-9]*" value="' + (valor == null ? '' : valor) +
      '" placeholder="' + esc(o.placeholder || '') + '" aria-label="' + esc(o.etiqueta || '') + '">' +
      '<button type="button" data-delta="1" aria-label="Sumar">+</button></div>';
  }
  var conEtiqueta = function (txt, html) { return '<div><label class="etiqueta">' + esc(txt) + '</label>' + html + '</div>'; };
  var textoMes = function (m) {
    if (!m) return '';
    var p = m.split('-').map(Number);
    return MESES[p[1] - 1] + ' ' + p[0];
  };
  var sumaTramos = function (d) { return d.tramos.reduce(function (a, t) { return a + (t.dias || 0); }, 0); };

  // Reordenar el itinerario arrastrando desde el ⠿ (dedo o mouse, Pointer
  // Events) o con las flechas del teclado sobre el ⠿. El bloque sigue al
  // dedo y cambia de lugar con el vecino al pasar su mitad.
  function arrastrable(grip, lista, d, repintar) {
    grip.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var i = Number(grip.closest('.tramo').dataset.i);
      var j = e.key === 'ArrowUp' ? i - 1 : i + 1;
      if (j < 0 || j >= d.tramos.length) return;
      var t = d.tramos.splice(i, 1)[0];
      d.tramos.splice(j, 0, t);
      guardar(); repintar();
      var nuevo = lista.querySelector('.tramo[data-i="' + j + '"] .tramo-grip');
      if (nuevo) nuevo.focus();
    });
    grip.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      var item = grip.closest('.tramo');
      var gap = parseFloat(getComputedStyle(lista).rowGap) || 0;
      var inicioY = e.clientY;
      try { grip.setPointerCapture(e.pointerId); } catch (err) {}
      item.classList.add('arrastrando');
      lista.classList.add('ordenando');

      // Solo se mueven los vecinos: sacar del DOM el bloque arrastrado le
      // quita la captura del puntero y se pierde el "soltar".
      function mover(ev) {
        if (ev.pointerId !== e.pointerId) return;
        var dy = ev.clientY - inicioY;
        var sig = item.nextElementSibling, ant = item.previousElementSibling;
        if (sig && dy > sig.offsetHeight / 2) {
          lista.insertBefore(sig, item);
          inicioY += sig.offsetHeight + gap;
        } else if (ant && dy < -ant.offsetHeight / 2) {
          lista.insertBefore(ant, item.nextElementSibling);
          inicioY -= ant.offsetHeight + gap;
        }
        item.style.transform = 'translateY(' + (ev.clientY - inicioY) + 'px)';
      }
      function soltar(ev) {
        if (ev.pointerId !== e.pointerId) return;
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        window.removeEventListener('pointercancel', soltar);
        d.tramos = Array.prototype.map.call(lista.querySelectorAll('.tramo'), function (el) { return d.tramos[Number(el.dataset.i)]; });
        guardar(); repintar();
      }
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', soltar);
    });
  }

  function campoTexto(clave, titulo, placeholder, tipo, autocomplete, validar) {
    return {
      titulo: function () { return titulo; },
      cta: 'Siguiente',
      body: function (d) {
        return '<input class="campo" id="' + clave + '" type="' + tipo + '" value="' + esc(d[clave]) + '" placeholder="' + esc(placeholder) +
          '" autocomplete="' + autocomplete + '" aria-label="' + esc(titulo) + '">';
      },
      validar: function (d) { return validar(d[clave]); },
      listo: function (d) { return d[clave].trim().length > 0; },
      mount: function (form, d, refrescar) {
        var input = $('#' + clave, form);
        if (clave === 'whatsapp' && !d.whatsapp.trim()) { input.value = d.whatsapp = st.prefijo; refrescar(); }
        input.addEventListener('input', function (e) { d[clave] = e.target.value; quitarError(); refrescar(); guardar(); });
        input.focus({ preventScroll: true });
        var fin = input.value.length;
        try { input.setSelectionRange(fin, fin); } catch (e) {}
      }
    };
  }

  function montarSteppers(form, setters, refrescar) {
    form.querySelectorAll('[data-stepper]').forEach(function (box) {
      var clave = box.dataset.stepper;
      var min = Number(box.dataset.min), max = Number(box.dataset.max);
      var input = $('input', box);
      var poner = function (v) {
        if (setters[clave]) setters[clave](v);
        quitarError(); if (refrescar) refrescar(); guardar();
      };
      input.addEventListener('input', function () { poner(input.value === '' ? null : Number(input.value)); });
      box.querySelectorAll('[data-delta]').forEach(function (b) {
        b.addEventListener('click', function () {
          var delta = Number(b.dataset.delta);
          var base = input.value === '' ? min - delta : Number(input.value);
          var n = Math.min(max, Math.max(min, base + delta));
          input.value = n; poner(n);
        });
      });
    });
  }

  // ---- los pasos ----
  var PASOS = {
    itinerario: {
      kicker: 'Cuéntanos sobre tu viaje a Perú',
      titulo: function () { return '¿Cómo quieres empezar?'; },
      opciones: function () {
        return [
          { valor: 'si', etiqueta: 'Ya tengo mi itinerario armado', desc: 'Nosotros lo cotizamos y lo ajustamos contigo' },
          { valor: 'no', etiqueta: 'Todavía no, quiero ayuda para armarlo', desc: 'Te armamos una propuesta a medida' },
          { valor: 'paquete', etiqueta: 'Quiero cotizar un paquete de la web', desc: 'Elige uno de nuestros viajes ya armados', href: URL_PAQUETES }
        ];
      },
      get: function (d) { return d.itinerario; },
      set: function (d, v) { d.itinerario = v; },
      back: false
    },
    dias: {
      titulo: function () { return '¿Cuántos días dura tu viaje por Perú?'; },
      sub: function () { return 'Del día que llegas al día que te vas. En el paso siguiente armas el itinerario.'; },
      cta: 'Armar mi itinerario',
      body: function (d) {
        return stepperHtml('dias-total', d.dias, { min: 1, max: 60, placeholder: 'Ej: 10', etiqueta: 'Días de viaje' });
      },
      validar: function (d) {
        if (d.dias == null || isNaN(d.dias)) return 'Dinos cuántos días';
        return d.dias < 1 || d.dias > 60 ? 'Entre 1 y 60 días' : null;
      },
      listo: function (d) { return d.dias != null; },
      mount: function (form, d, refrescar) {
        montarSteppers(form, { 'dias-total': function (v) { d.dias = v; } }, refrescar);
        $('#dias-total', form).focus({ preventScroll: true });
      }
    },
    armar: {
      titulo: function (d) { return 'Arma tu itinerario de ' + d.dias + ' días'; },
      sub: function () { return 'Toca los destinos en el orden en que los visitas y ajusta los días. Para cambiar el orden, arrastra desde ⠿.'; },
      cta: 'Continuar',
      body: function (d) {
        var chips = DESTINOS.map(function (x) {
          return '<button type="button" class="chip-dest" data-sumar="' + x.id + '"><span aria-hidden="true">+</span> ' + esc(x.nombre) + '</button>';
        }).join('');
        return '<div class="armado" id="armado">' +
            '<div class="armado__estado" id="armado-estado"></div>' +
            '<div class="tramos" id="tramos"></div>' +
          '</div>' +
          '<p class="etiqueta etiqueta--sep">Agregar destino</p>' +
          '<div class="chips-dest">' + chips + '</div>' +
          '<div class="otro-dest"><input class="campo" id="otro-dest" type="text" placeholder="¿Otro? Ej: Chachapoyas" aria-label="Otro destino">' +
          '<button type="button" class="otro-dest__btn" id="otro-dest-btn">Agregar</button></div>' +
          '<textarea id="orden-nota" class="mini" placeholder="(Opcional) ¿Algo más? Ej: llego a Lima de noche, el último día vuelo temprano, todavía dudo entre 2 o 3 días en Cusco…" aria-label="Comentario sobre el itinerario">' + esc(d.ordenNota) + '</textarea>';
      },
      validar: function (d) {
        if (!d.tramos.length) return 'Agrega al menos un destino';
        var suma = sumaTramos(d);
        if (suma !== d.dias) return suma < d.dias ? 'Te faltan ' + (d.dias - suma) + ' días por asignar' : 'Tu itinerario suma ' + suma + ' días y el viaje dura ' + d.dias;
        return null;
      },
      listo: function (d) { return d.tramos.length > 0; },
      mount: function (form, d, refrescar) {
        var lista = $('#tramos', form);
        var estado = $('#armado-estado', form);

        function pintar() {
          var dia = 1;
          lista.innerHTML = d.tramos.length ? d.tramos.map(function (t, i) {
            var rotulo = t.dias > 1 ? 'Días ' + dia + '–' + (dia + t.dias - 1) : 'Día ' + dia;
            dia += t.dias;
            return '<div class="tramo" data-i="' + i + '">' +
              '<button type="button" class="tramo-grip" aria-label="Mover ' + esc(t.nombre) + ' (flechas arriba y abajo)">' +
                '<svg viewBox="0 0 12 20" aria-hidden="true"><circle cx="3" cy="4" r="1.6"/><circle cx="9" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="9" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/><circle cx="9" cy="16" r="1.6"/></svg></button>' +
              '<div class="tramo-info"><span class="tramo-dia">' + rotulo + '</span><span class="tramo-nombre">' + esc(t.nombre) + '</span></div>' +
              '<button type="button" class="tramo-quitar" aria-label="Quitar ' + esc(t.nombre) + '">×</button>' +
              '<div class="tramo-dias">' + stepperHtml('td-' + i, t.dias, { min: 1, max: 60, mini: true, etiqueta: 'Días en ' + t.nombre }) +
                '<span>' + (t.dias > 1 ? 'días' : 'día') + '</span></div>' +
            '</div>';
          }).join('') : '<p class="tramos-vacio">Toca un destino de abajo para sumarlo a tu itinerario.</p>';
          var setters = {};
          d.tramos.forEach(function (t, i) {
            setters['td-' + i] = function (v) { t.dias = v == null || v < 1 ? 1 : v; rotulos(); };
          });
          montarSteppers(lista, setters, refrescar);
          lista.querySelectorAll('.tramo-quitar').forEach(function (b) {
            b.addEventListener('click', function () {
              d.tramos.splice(Number(b.closest('.tramo').dataset.i), 1);
              quitarError(); guardar(); pintar(); refrescar();
            });
          });
          lista.querySelectorAll('.tramo-grip').forEach(function (g) { arrastrable(g, lista, d, pintar); });
          rotulos();
        }

        // Rótulos "Días a–b" y el contador, sin volver a pintar (no pierde el foco).
        function rotulos() {
          var dia = 1;
          lista.querySelectorAll('.tramo').forEach(function (el) {
            var t = d.tramos[Number(el.dataset.i)];
            $('.tramo-dia', el).textContent = t.dias > 1 ? 'Días ' + dia + '–' + (dia + t.dias - 1) : 'Día ' + dia;
            $('.tramo-dias span', el).textContent = t.dias > 1 ? 'días' : 'día';
            dia += t.dias;
          });
          var suma = sumaTramos(d);
          var falta = d.dias - suma;
          estado.innerHTML =
            '<div class="armado__barra"><i style="width:' + Math.min(100, Math.round((suma / d.dias) * 100)) + '%"></i></div>' +
            '<p><b>' + suma + ' de ' + d.dias + ' días</b> · ' +
              (falta > 0 ? 'te faltan ' + falta : falta < 0 ? 'te pasaste por ' + (-falta) : 'listo, cuadra perfecto') + '</p>' +
            (falta !== 0 && d.tramos.length ? '<button type="button" class="enlace" id="ajustar-total">Mi viaje dura ' + suma + ' días</button>' : '');
          var ajustar = $('#ajustar-total', estado);
          if (ajustar) ajustar.addEventListener('click', function () { d.dias = suma; quitarError(); guardar(); render(false); });
          estado.classList.toggle('ok', falta === 0);
          estado.classList.toggle('pasado', falta < 0);
          guardar();
        }

        function sumar(id, nombre) {
          var resto = d.dias - sumaTramos(d);
          d.tramos.push({ id: id, nombre: nombre, dias: Math.max(1, Math.min(resto, 3)) });
          quitarError(); guardar(); pintar(); refrescar();
        }
        form.querySelectorAll('[data-sumar]').forEach(function (b) {
          b.addEventListener('click', function () { sumar(b.dataset.sumar, nombreDestino(b.dataset.sumar)); });
        });
        var otro = $('#otro-dest', form);
        var sumarOtro = function () {
          var n = otro.value.trim().slice(0, 60);
          if (!n) return otro.focus();
          otro.value = '';
          sumar(null, n);
        };
        $('#otro-dest-btn', form).addEventListener('click', sumarOtro);
        otro.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sumarOtro(); } });
        $('#orden-nota', form).addEventListener('input', function (e) { d.ordenNota = e.target.value; guardar(); });
        pintar();
      }
    },
    duracion: {
      titulo: function () { return '¿Cuántos días tienes para viajar por Perú?'; },
      sub: function () { return 'Con eso te mostramos qué entra cómodo y qué viajes ya armados te calzan.'; },
      cta: 'Continuar',
      body: function (d) {
        var rango = d.diasMax != null || st.rangoDias;
        return (rango
          ? '<p class="entre">Entre</p>' + stepperHtml('dmin', d.diasMin, { min: 1, max: 90, placeholder: 'Ej: 10', etiqueta: 'Días, mínimo' }) +
            '<p class="entre">y</p>' + stepperHtml('dmax', d.diasMax, { min: 1, max: 90, placeholder: 'Ej: 15', etiqueta: 'Días, máximo' })
          : stepperHtml('dmin', d.diasMin, { min: 1, max: 90, placeholder: 'Ej: 10', etiqueta: 'Días' })) +
          '<button type="button" class="enlace" id="alternar-rango">' + (rango ? 'Sé la cantidad exacta' : 'No sé la cantidad exacta: poner un rango') + '</button>';
      },
      validar: function (d) { return validarDias(d.diasMin, d.diasMax); },
      listo: function (d) { return d.diasMin != null && (!(d.diasMax != null || st.rangoDias) || d.diasMax != null); },
      mount: function (form, d, refrescar) {
        $('#alternar-rango', form).addEventListener('click', function () {
          var rango = !(d.diasMax != null || st.rangoDias);
          st.rangoDias = rango;
          if (!rango) d.diasMax = null;
          quitarError(); render(false);
        });
        montarSteppers(form, { dmin: function (v) { d.diasMin = v; }, dmax: function (v) { d.diasMax = v; } }, refrescar);
        $('#dmin', form).focus({ preventScroll: true });
      }
    },
    // Destinos guiados por los días: cada lugar muestra cuántos días pide, un
    // cupo va sumando y no deja elegir más de lo que entra (con 1 día de
    // tolerancia). Arriba, los paquetes de la web que calzan con esos días.
    destinos: {
      titulo: function (d) { return '¿Qué te gustaría conocer en ' + textoDias(d) + ' días?'; },
      sub: function () { return 'Al lado de cada lugar te marcamos los días que pide para disfrutarlo sin correr.'; },
      cta: 'Continuar',
      body: function (d) {
        var ids = d.destinos.map(function (x) { return x.id; });
        var paqs = paquetesPara(d);
        var sugeridos = paqs.length
          ? '<div class="sugeridos"><p class="etiqueta">Viajes ya armados de ' + textoDias(d) + ' días</p>' +
              paqs.map(function (p) {
                return '<a class="sug" href="' + p.url + '" data-sug="' + p.url + '">' +
                  '<span class="sug__img" style="background-image:url(' + p.img + ')"></span>' +
                  '<span class="sug__txt"><span class="sug__meta">' + p.dias + 'D / ' + (p.dias - 1) + 'N · ' + esc(p.zona) + '</span>' +
                  '<b>' + esc(p.nombre) + '</b><span class="sug__precio">Desde ' + esc(p.precio) + '</span></span>' +
                  '<span class="flecha" aria-hidden="true">→</span></a>';
              }).join('') +
              '<p class="sugeridos__o"><span>o elige tus destinos y te armamos uno a medida</span></p></div>'
          : '';
        var lista = DESTINOS.map(function (x) {
          var on = ids.indexOf(x.id) >= 0;
          return '<button type="button" class="opcion check dest-op' + (on ? ' sel' : '') + '" data-v="' + x.id + '" role="checkbox" aria-checked="' + on + '">' +
            '<span class="num">' + (on ? '✓' : '') + '</span>' +
            '<span class="txt">' + esc(x.nombre) + '<span class="desc">' + esc(x.desc) + '</span></span>' +
            '<span class="dest-dias">' + x.dias + (x.dias > 1 ? ' días' : ' día') + '</span></button>';
        }).join('');
        return sugeridos + '<div class="cupo" id="cupo"></div>' + lista +
          '<input class="campo" id="otros" type="text" value="' + esc(d.otros) + '" placeholder="¿Otro destino? ¿Cuál?" aria-label="Otro destino">';
      },
      validar: function (d) { return d.destinos.length || d.otros.trim() ? null : 'Elige al menos un destino'; },
      listo: function (d) { return d.destinos.length > 0 || d.otros.trim().length > 0; },
      mount: function (form, d, refrescar) {
        var tope = topeDias(d);
        var cupo = $('#cupo', form);
        var aviso = '';

        function pintarCupo() {
          var usados = diasElegidos(d);
          var resto = tope - usados;
          var pct = Math.min(100, Math.round((usados / tope) * 100));
          var estado = !usados ? 'Elige lo que más te llame: te vamos mostrando si entra en ' + textoDias(d) + ' días.'
            : resto >= 2 ? '<b>Usas ~' + usados + ' de ' + tope + ' días.</b> Te quedan ~' + resto + ' para sumar algo más.'
            : resto >= 0 ? '<b>Usas ~' + usados + ' de ' + tope + ' días.</b> Queda un viaje completo y sin correr.'
            : '<b>Usas ~' + usados + ' de ' + tope + ' días.</b> Queda justo: lo afinamos contigo.';
          cupo.className = 'cupo' + (resto < 0 ? ' justo' : usados && resto < 2 ? ' lleno' : '');
          cupo.innerHTML = '<div class="cupo__barra"><i style="width:' + pct + '%"></i></div><p>' + estado + '</p>' +
            (aviso ? '<p class="cupo__aviso" role="alert">' + aviso + '</p>' : '');
          var sumar = $('#sumar-dias', cupo);
          if (sumar) sumar.addEventListener('click', function () { st.idx--; guardar(); render(); });
          form.querySelectorAll('.dest-op').forEach(function (b) {
            var x = DESTINOS.find(function (y) { return y.id === b.dataset.v; });
            b.classList.toggle('no-entra', !b.classList.contains('sel') && x.dias > resto + 1);
          });
        }

        form.querySelectorAll('.dest-op').forEach(function (b) {
          b.addEventListener('click', function () {
            var x = DESTINOS.find(function (y) { return y.id === b.dataset.v; });
            var i = d.destinos.findIndex(function (y) { return y.id === x.id; });
            aviso = '';
            if (i >= 0) {
              d.destinos.splice(i, 1);
            } else if (diasElegidos(d) + x.dias > tope + 1) {
              aviso = '<b>' + esc(x.nombre) + ' no entra:</b> pide ~' + x.dias + ' días y te quedan ~' + Math.max(0, tope - diasElegidos(d)) +
                '. Saca un destino o <button type="button" class="enlace" id="sumar-dias">suma días</button>.';
              pintarCupo();
              return;
            } else {
              d.destinos.push({ id: x.id });
            }
            var on = i < 0;
            b.classList.toggle('sel', on);
            b.setAttribute('aria-checked', on);
            $('.num', b).textContent = on ? '✓' : '';
            quitarError(); pintarCupo(); refrescar(); guardar();
          });
        });
        var otros = $('#otros', form);
        otros.addEventListener('input', function () { d.otros = otros.value; quitarError(); pintarCupo(); refrescar(); guardar(); });
        form.querySelectorAll('[data-sug]').forEach(function (a) {
          a.addEventListener('click', function () {
            if (vt()) { vt().evento(vt().EV.CLICK_CTA, { ubicacion: 'cotizar-sugeridos', texto: a.querySelector('b').textContent, destino: a.dataset.sug }); vt().enviar(); }
          });
        });
        pintarCupo();
      }
    },
    fecha: {
      titulo: function (d) {
        var dias = textoDias(d);
        return dias ? '¿Cuándo quieres viajar esos ' + dias + ' días?' : '¿Cuándo quieres viajar?';
      },
      sub: function () { return 'Elige el día que llegas a Perú. Si todavía no lo sabes, un mes aproximado.'; },
      cta: 'Continuar',
      body: function (d) {
        var ahora = new Date();
        var ej = new Date(ahora.getFullYear(), ahora.getMonth() + 4, 15);
        var ejemplo = '15/' + String(ej.getMonth() + 1).padStart(2, '0') + '/' + ej.getFullYear();
        var meses = '<option value="">Elige un mes</option>';
        for (var n = 0; n < 15; n++) {
          var f = new Date(ahora.getFullYear(), ahora.getMonth() + n, 1);
          var valor = f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0');
          meses += '<option value="' + valor + '"' + (d.mes === valor ? ' selected' : '') + '>' + MESES[f.getMonth()] + ' ' + f.getFullYear() + '</option>';
        }
        // El ejemplo gris se superpone al campo vacío (Chrome y Safari);
        // Firefox ya muestra su propio dd/mm/aaaa.
        var conEjemplo = !/firefox/i.test(navigator.userAgent);
        return '<div><label class="etiqueta" for="fecha">Llegada a Perú</label>' +
            '<div class="fecha-wrap' + (d.fechaExacta ? ' lleno' : '') + (conEjemplo ? ' con-ej' : '') + '">' +
              '<input class="campo campo--fecha" id="fecha" type="date" min="' + hoy() + '" value="' + esc(d.fechaExacta || '') + '">' +
              (conEjemplo ? '<span class="fecha-ej" aria-hidden="true">Ej: ' + ejemplo + '</span>' : '') +
            '</div></div>' +
          '<p class="o-sep"><span>o, si todavía no lo sabes</span></p>' +
          '<div><label class="etiqueta" for="mes">Mes aproximado</label>' +
            '<select class="campo campo--select" id="mes">' + meses + '</select></div>';
      },
      validar: function (d) {
        if (!d.fechaExacta && !d.mes) return 'Elige una fecha o un mes aproximado';
        return d.fechaExacta && d.fechaExacta < hoy() ? 'La fecha no puede ser en el pasado' : null;
      },
      listo: function (d) { return !!(d.fechaExacta || d.mes); },
      mount: function (form, d, refrescar) {
        var input = $('#fecha', form);
        var caja = $('.fecha-wrap', form);
        var mes = $('#mes', form);
        input.addEventListener('change', function () {
          d.fechaExacta = input.value || null;
          caja.classList.toggle('lleno', !!d.fechaExacta);
          if (d.fechaExacta) { d.mes = null; mes.value = ''; }
          quitarError(); refrescar(); guardar();
        });
        mes.addEventListener('change', function () {
          d.mes = mes.value || null;
          if (d.mes) { d.fechaExacta = null; input.value = ''; caja.classList.remove('lleno'); }
          quitarError(); refrescar(); guardar();
        });
      }
    },
    pasajes: {
      titulo: function () { return '¿Ya tienes los pasajes internacionales a Perú?'; },
      opciones: function () { return [{ valor: 'comprados', etiqueta: 'Sí, ya los compré' }, { valor: 'pendientes', etiqueta: 'Todavía no' }]; },
      get: function (d) { return d.pasajes; },
      set: function (d, v) { d.pasajes = v; }
    },
    personas: {
      titulo: function () { return '¿Cuántos viajan?'; },
      sub: function () { return 'Cuéntanos cuántos son adultos y cuántos son menores.'; },
      cta: 'Siguiente',
      body: function (d) {
        return conEtiqueta('Adultos', stepperHtml('adultos', d.adultos, { min: 1, max: 20, placeholder: 'Ej: 2', etiqueta: 'Adultos' })) +
          conEtiqueta('Menores (0 a 17 años)', stepperHtml('ninos', d.ninos, { min: 0, max: 15, placeholder: 'Ej: 0', etiqueta: 'Menores' })) +
          '<div class="edades" id="edades"></div>';
      },
      validar: function (d) {
        var e = validarAdultos(d.adultos);
        if (e) return e;
        return d.edades.slice(0, d.ninos).some(function (x) { return x == null; })
          ? (d.ninos > 1 ? 'Dinos la edad de cada menor' : 'Dinos la edad del menor') : null;
      },
      listo: function (d) { return d.adultos != null; },
      mount: function (form, d, refrescar) {
        var caja = $('#edades', form);
        // Un selector de edad por menor; se rearma al cambiar la cantidad.
        function edades() {
          d.edades = d.edades.slice(0, d.ninos);
          while (d.edades.length < d.ninos) d.edades.push(null);
          if (!d.ninos) { caja.innerHTML = ''; return; }
          caja.innerHTML = '<label class="etiqueta">' + (d.ninos > 1 ? 'Edad de cada menor' : 'Edad del menor') + '</label><div class="edades__grid">' +
            d.edades.map(function (v, i) {
              var ops = '<option value="">' + (d.ninos > 1 ? 'Menor ' + (i + 1) : 'Edad') + '</option>';
              for (var a = 0; a <= 17; a++) ops += '<option value="' + a + '"' + (v === a ? ' selected' : '') + '>' + a + (a === 1 ? ' año' : ' años') + '</option>';
              return '<select class="campo" data-edad="' + i + '" aria-label="Edad del menor ' + (i + 1) + '">' + ops + '</select>';
            }).join('') + '</div>';
          caja.querySelectorAll('[data-edad]').forEach(function (s) {
            s.addEventListener('change', function () {
              d.edades[Number(s.dataset.edad)] = s.value === '' ? null : Number(s.value);
              quitarError(); guardar();
            });
          });
        }
        montarSteppers(form, {
          adultos: function (v) { d.adultos = v; },
          ninos: function (v) { d.ninos = v == null ? 0 : Math.min(15, v); edades(); }
        }, refrescar);
        edades();
      }
    },
    nombre: campoTexto('nombre', '¿Cómo te llamas?', 'Nombre completo', 'text', 'name', function (v) {
      return v.trim().length >= 3 ? null : 'Cuéntanos tu nombre completo';
    }),
    whatsapp: Object.assign(campoTexto('whatsapp', '¿Cuál es tu WhatsApp?', 'Ej: +51 912 345 678', 'tel', 'tel', validarWhatsapp), {
      sub: function () { return 'Con el código de país. Te escribimos ahí con tu propuesta; solo por eso, sin spam.'; }
    }),
    presupuesto: {
      titulo: function () { return '¿Tienes un presupuesto en mente para el viaje?'; },
      sub: function () { return 'Sin contar los vuelos internacionales.'; },
      opciones: function () { return [{ valor: 'si', etiqueta: 'Sí, tengo un presupuesto' }, { valor: 'no', etiqueta: 'No, me gustaría cotizar mi viaje' }]; },
      get: function (d) { return d.presupuesto; },
      set: function (d, v) { d.presupuesto = v; if (v === 'no') d.presupuestoRango = null; }
    },
    presupuestoRango: {
      titulo: function () { return '¿Cuál es tu presupuesto por persona?'; },
      sub: function () { return 'Aproximado y sin vuelos internacionales. Así te armamos una propuesta que te encaje.'; },
      opciones: function () { return window.LunaScoring.RANGOS_PRESUPUESTO.map(function (r) { return { valor: r.valor, etiqueta: r.etiqueta }; }); },
      get: function (d) { return d.presupuestoRango; },
      set: function (d, v) { d.presupuestoRango = v; }
    },
    notas: {
      titulo: function () { return 'Compártenos tu idea general del viaje y lo que debemos tener en cuenta'; },
      cta: 'Enviar',
      body: function (d) {
        return '<textarea id="notas" placeholder="(Opcional) Luna de miel, restricciones alimentarias, actividades que te interesan, necesidades especiales..." aria-label="Notas">' + esc(d.notas) + '</textarea>';
      },
      validar: function () { return null; },
      listo: function () { return true; },
      mount: function (form, d) { $('#notas', form).addEventListener('input', function (e) { d.notas = e.target.value; guardar(); }); }
    }
  };

  // Rama "no": días disponibles (el máximo si puso un rango), días que piden
  // los destinos elegidos (uno escrito a mano cuenta 2) y paquetes de la web
  // que calzan: hasta 3, del rango ±1 día, los más cercanos primero.
  function topeDias(d) { return d.diasMax || d.diasMin || 0; }
  function diasElegidos(d) {
    var otros = d.otros.split(',').filter(function (x) { return x.trim(); }).length;
    return d.destinos.reduce(function (a, x) {
      var y = DESTINOS.find(function (z) { return z.id === x.id; });
      return a + (y ? y.dias : 2);
    }, 0) + otros * 2;
  }
  function paquetesPara(d) {
    var min = (d.diasMin || 0) - 1, max = topeDias(d) + 1, centro = ((d.diasMin || 0) + topeDias(d)) / 2;
    return PAQUETES.filter(function (p) { return p.dias >= min && p.dias <= max; })
      .sort(function (a, b) { return Math.abs(a.dias - centro) - Math.abs(b.dias - centro); })
      .slice(0, 3);
  }

  // ---- errores ----
  var errorEl = null;
  function quitarError() { if (errorEl) { errorEl.remove(); errorEl = null; } }
  function mostrarError(msj) {
    quitarError();
    errorEl = document.createElement('p');
    errorEl.className = 'error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = msj;
    var cta = $('#paso .cta');
    if (cta) cta.insertAdjacentElement('beforebegin', errorEl); else $('#paso .cuerpo').appendChild(errorEl);
  }

  // ---- progreso ----
  function progreso(pct) {
    $('#progreso-texto').textContent = pct <= 55 ? 'Empecemos' : pct <= 90 ? 'Ya casi' : pct <= 99 ? 'Último paso' : 'Listo';
    $('#progreso-barra').style.width = pct + '%';
    $('.barra').setAttribute('aria-valuenow', Math.round(pct));
  }

  // ---- render de un paso ----
  function render(animar) {
    if (animar === undefined) animar = true;
    var cont = $('#paso');
    if (st.completado) return renderFinal();
    var lista = pasos(st.d);
    st.idx = Math.min(st.idx, lista.length - 1);
    var clave = lista[st.idx];
    var p = PASOS[clave];
    progreso(Math.round(8 + (st.idx / lista.length) * 88));
    var d = st.d;
    var conOpciones = !!p.opciones;
    var cuerpo = conOpciones ? opcionesHtml(p.opciones(d), p.get(d)) : p.body(d);
    cont.innerHTML =
      '<form class="tarjeta" novalidate style="' + (animar ? '' : 'animation:none') + '">' +
        (p.kicker ? '<p class="kicker">' + esc(p.kicker) + '</p>' : '') +
        '<h1>' + esc(p.titulo(d)) + '</h1>' +
        (p.sub ? '<p class="sub">' + esc(p.sub(d)) + '</p>' : '') +
        '<div class="cuerpo">' + cuerpo + '</div>' +
        (conOpciones ? '' : '<button type="submit" class="cta">' + esc(p.cta || 'Siguiente') + '</button>') +
      '</form>' +
      (p.back === false || st.idx === 0 ? '' : '<button type="button" class="atras" id="atras">← Atrás</button>');
    errorEl = null;
    $('#confianza').hidden = false;

    var form = $('form', cont);
    var cta = $('.cta', cont);
    var refrescar = function () { if (cta) cta.disabled = !p.listo(d); };

    if (conOpciones) {
      form.querySelectorAll('[data-v]').forEach(function (b) {
        b.addEventListener('click', function () {
          p.set(d, b.dataset.v);
          guardar();
          form.querySelectorAll('[data-v]').forEach(function (x) {
            x.classList.toggle('sel', x === b);
            x.setAttribute('aria-checked', x === b);
          });
          setTimeout(avanzar, 140);
        });
      });
      form.querySelectorAll('[data-sale]').forEach(function (a) {
        a.addEventListener('click', function () {
          if (vt()) { vt().evento(vt().EV.CLICK_CTA, { ubicacion: 'cotizar', texto: 'Cotizar un paquete de la web', destino: URL_PAQUETES }); vt().enviar(); }
        });
      });
    } else {
      refrescar();
      if (p.mount) p.mount(form, d, refrescar);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var err = p.validar(d);
        if (err) return mostrarError(err);
        avanzar();
      });
    }
    var atras = $('#atras');
    if (atras) atras.addEventListener('click', retroceder);
    if (animar) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (DEBUG) debug();
  }

  function avanzar() {
    var lista = pasos(st.d);
    // Al pasar el WhatsApp ya se guarda el contacto, por si abandona después.
    if (lista[st.idx] === 'whatsapp') enviarParcial();
    if (st.idx >= lista.length - 1) return terminar();
    st.idx++;
    guardar();
    render();
  }
  function retroceder() {
    if (st.idx === 0) return;
    st.idx--;
    guardar();
    render();
  }

  // ---- envío ----
  function payload(parcial) {
    var d = st.d;
    var s = window.LunaScoring.score(d);
    var tipo = d.itinerario === 'si' ? 'itinerario' : 'a_medida';
    var rango = window.LunaScoring.RANGOS_PRESUPUESTO.find(function (r) { return r.valor === d.presupuestoRango; });
    var v = vt();
    return {
      submission_id: st.id,
      crm_id: st.crmId,
      parcial: !!parcial,
      formulario: 'cotizar-web',
      submitted_at: new Date().toISOString(),
      duracion_segundos: Math.round((Date.now() - st.inicio) / 1000),
      contacto: { nombre: d.nombre.trim(), whatsapp: d.whatsapp.trim() },
      viaje: {
        tipo: tipo,
        destinos: d.itinerario === 'si'
          ? d.tramos.filter(function (t, i, a) { return a.findIndex(function (x) { return x.nombre === t.nombre; }) === i; })
              .map(function (t) { return { id: t.id, nombre: t.nombre }; })
          : d.destinos.map(function (x) { return { id: x.id, nombre: nombreDestino(x.id) }; }),
        orden: d.itinerario === 'si' && d.tramos.length ? ordenConDias(d.tramos) : null,
        nota_orden: d.itinerario === 'si' ? d.ordenNota.trim() || null : null,
        otros_destinos: d.itinerario === 'no' ? d.otros.trim() || null : null,
        dias_total: d.itinerario === 'si' ? d.dias : null,
        dias_min: d.itinerario === 'no' ? d.diasMin : null,
        dias_max: d.itinerario === 'no' ? d.diasMax : null,
        fecha_llegada: d.fechaExacta,
        mes_aproximado: d.mes,
        pasajes: d.pasajes,
        adultos: d.adultos,
        ninos: d.ninos,
        edades: d.edades.slice(0, d.ninos),
        tiene_presupuesto: d.presupuesto === 'si',
        presupuesto_pp_usd: d.presupuestoRango,
        presupuesto_etiqueta: rango ? rango.etiqueta : null,
        notas: d.notas.trim() || null
      },
      lead_score: { total: s.total, score10: s.score10, categoria: s.tier, accion_sugerida: s.accion, desglose: s.desglose },
      origen: st.ctx.origen,
      utm_source: st.ctx.utm_source,
      utm_campaign: st.ctx.utm_campaign,
      codigo: v ? v.codigo() : null,
      manychat_id: v ? v.manychatId() : null,
      sesion_id: v ? v.sesion() : null,
      interno: v ? v.interno() : false,
      pais_iso: st.iso || null,
      apellido_2: ($('#apellido_2') || {}).value || '',
      referer: document.referrer || null
    };
  }
  function ordenConDias(tramos) {
    var dia = 1;
    return tramos.map(function (t) {
      var r = { id: t.id, nombre: t.nombre, dias: t.dias, desde: dia, hasta: dia + t.dias - 1 };
      dia += t.dias;
      return r;
    });
  }

  function enviarParcial() {
    if (st.crmId || st.crmPromise) return;
    var body = payload(true);
    st.crmPromise = (async function () {
      for (var i = 0; i < 2; i++) {
        try {
          var r = await fetch(API_LEAD, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
          if (r.ok) {
            var j = await r.json().catch(function () { return null; });
            if (j && j.crm_id) { st.crmId = j.crm_id; guardar(); }
            break;
          }
        } catch (e) {}
      }
      st.crmPromise = null;
    })();
  }

  async function enviar(body) {
    for (var i = 0; i < 3; i++) {
      try {
        var r = await fetch(API_LEAD, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) {
          try { localStorage.removeItem(CLAVE_PENDIENTE); } catch (e) {}
          return true;
        }
      } catch (e) {}
      if (i < 2) await new Promise(function (res) { setTimeout(res, 800 * Math.pow(2, i)); });
    }
    try { localStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(body)); } catch (e) {}
    return false;
  }

  async function terminar() {
    st.completado = true;
    st.envio = 'enviando';
    guardar();
    progreso(100);
    renderFinal();
    if (st.crmPromise) await Promise.race([st.crmPromise, new Promise(function (res) { setTimeout(res, 4000); })]);
    var body = payload(false);
    st.envio = (await enviar(body)) ? 'ok' : 'error';
    var v = vt();
    if (v) { v.evento(v.EV.LEAD_ENVIADO, { origen: 'cotizar', codigo: v.codigo() }); v.enviar(); }
    if (DEBUG) debug();
    renderFinal();
  }

  // ---- pantalla final ----
  function destinosElegidos(d) {
    if (d.itinerario === 'si') return d.tramos.map(function (t) { return t.nombre + ' (' + t.dias + (t.dias > 1 ? ' días)' : ' día)'); });
    var base = d.destinos.map(function (x) { return nombreDestino(x.id); });
    d.otros.split(',').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) { base.push(x); });
    return base;
  }
  function textoDias(d) {
    if (d.itinerario === 'si') return d.dias || '';
    return d.diasMin ? d.diasMin + (d.diasMax ? '–' + d.diasMax : '') : '';
  }
  function mensajeWhatsapp() {
    var d = st.d;
    var nombre = d.nombre.trim().split(/\s+/)[0] || '';
    var personas = (d.adultos || 0) + (d.ninos || 0);
    var dias = textoDias(d);
    var cuando = d.fechaExacta ? ' desde el ' + d.fechaExacta.split('-').reverse().join('/') : d.mes ? ' en ' + textoMes(d.mes) : '';
    return 'Hola, soy ' + nombre + '! ' + (personas > 1 ? 'Somos ' + personas + ' y queremos' : 'Quiero') + ' viajar' +
      (dias ? ' ' + dias + ' días' : '') + ' por ' + destinosElegidos(d).join(', ') + cuando +
      '. Dejé mis datos en el formulario, quedo atento a tu respuesta!';
  }

  var ICONO_WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8A13 13 0 0 0 16 29c7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.8c-2 0-3.9-.6-5.5-1.6l-.4-.2-4 1 1.1-3.9-.3-.4A10.7 10.7 0 0 1 5.2 16c0-5.9 4.8-10.8 10.8-10.8S26.8 10.1 26.8 16 21.9 26.8 16 26.8zm5.9-8c-.3-.2-1.9-1-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.3 1.4 3.5 2.4 3.7 5.8 5.1c2.2.9 3 .9 4 .8.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5-.3-.2-.6-.3z"/></svg>';

  function renderFinal() {
    var d = st.d;
    var nombre = esc(d.nombre.trim().split(/\s+/)[0] || '');
    var wa = esc(d.whatsapp.trim());
    var href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensajeWhatsapp());

    var dest = destinosElegidos(d);
    var dias = textoDias(d);
    var fecha = d.fechaExacta ? d.fechaExacta.split('-').reverse().join('/') : textoMes(d.mes);
    var personas = (d.adultos || 0) + (d.ninos || 0);
    var resumen = [
      ['Destinos', dest.slice(0, 4).join(' · ') + (dest.length > 4 ? ' +' + (dest.length - 4) : '')],
      dias || fecha ? ['Fechas', (dias ? dias + ' días' : '') + (dias && fecha ? ' · ' : '') + (fecha || '')] : null,
      personas ? ['Viajeros', personas + ' viajero' + (personas > 1 ? 's' : '')] : null
    ].filter(Boolean).map(function (r) { return '<li><span>' + r[0] + '</span>' + esc(r[1]) + '</li>'; }).join('');

    var collage = COLLAGE.map(function (c) {
      return '<figure style="--r:' + c[2] + 'deg"><span style="background-image:url(/assets/viajeros/fila-' + c[0] +
        '.webp);background-position:' + (c[1] * 100 / 7).toFixed(2) + '% 0"></span></figure>';
    }).join('');

    $('#paso').innerHTML =
      '<div class="tarjeta final">' +
        '<p class="kicker">Recibimos tu viaje</p>' +
        '<h1>' + (nombre ? '¡Gracias, <em>' + nombre + '</em>!' : '¡Gracias!') + '</h1>' +
        '<p class="sub">Un agente de Luna Llena te escribe por WhatsApp' + (wa ? ' al <b>' + wa + '</b>' : '') + ' con tu propuesta y la cotización.</p>' +
        '<ul class="resumen">' + resumen + '</ul>' +

        '<section class="aut" aria-label="Por qué viajar con Luna Llena">' +
          '<h2 class="aut__t">Tu viaje queda en buenas manos</h2>' +
          '<div class="cifras">' +
            '<div><b>+8</b><span>años armando viajes por Perú</span></div>' +
            '<div><b class="cifras__ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></b><span>Agencia registrada en Perú</span></div>' +
            '<a href="' + URL_TRIPADVISOR + '" target="_blank" rel="noopener"><b>4,9<small>★</small></b><span>en TripAdvisor</span></a>' +
          '</div>' +
          '<div class="collage" role="img" aria-label="Fotos de grupos que viajaron con Luna Llena">' + collage + '</div>' +
          '<p class="collage__pie"><b>+1000 viajeros</b> ya confiaron en nosotros</p>' +
        '</section>' +

        '<div class="bonus">' +
          '<p class="bonus-tag">Beneficio extra · atención más rápida</p>' +
          '<p class="bonus-t">Escríbenos ahora y empezamos hoy</p>' +
          '<p class="bonus-txt">Si nos escribes ahora, empezamos a armar tu propuesta de inmediato, sin esperar a que te contactemos.</p>' +
          '<a class="cta-wa" id="wa" href="' + href + '" target="_blank" rel="noopener" data-ubic="cotizar-final">' + ICONO_WA + '<span>Quiero respuesta prioritaria</span></a>' +
          '<p class="micro">El mensaje ya está escrito: solo toca enviar.</p>' +
        '</div>' +

        // Prueba social después del botón: quien no escribe igual la ve.
        '<section class="resenas" aria-label="Reseñas en TripAdvisor">' +
          '<div class="resenas__pila">' +
            RESENAS.map(function (r, i) {
              return '<blockquote class="resena' + (i === 0 ? ' on' : '') + '" aria-hidden="' + (i !== 0) + '">' +
                '<div class="resena__stars" aria-label="5 de 5 estrellas">★★★★★</div>' +
                '<p class="resena__t">' + esc(r.t) + '</p>' +
                '<p>“' + esc(r.p) + '”</p>' +
                '<small>' + esc(r.n) + ' · ' + esc(r.f) + ' · ' + esc(r.src) + '</small>' +
              '</blockquote>';
            }).join('') +
          '</div>' +
          '<div class="resenas__puntos">' +
            RESENAS.map(function (r, i) {
              return '<button type="button" data-resena="' + i + '" aria-label="Reseña ' + (i + 1) + '"' + (i === 0 ? ' class="on"' : '') + '></button>';
            }).join('') +
          '</div>' +
        '</section>' +
        // Caras del equipo (fotos de Nosotros, recortadas en cotizar/equipo/).
        '<section class="equipo" aria-label="Equipo de Luna Llena">' +
          '<h2 class="equipo__t">Quiénes te van a atender</h2>' +
          '<p class="equipo__sub">Nuestros guías oficiales de turismo también responden tu WhatsApp: sabes con quién hablas desde el primer mensaje.</p>' +
          '<div class="equipo__lider"><img src="/cotizar/equipo/1.webp" alt="" width="120" height="120" loading="lazy">' +
            '<div><b>Álvaro Oblitas Mora</b><span>Dueño y guía principal</span></div></div>' +
          '<ul class="equipo__guias">' +
            EQUIPO.map(function (g) {
              return '<li><img src="/cotizar/equipo/' + g.foto + '.webp" alt="" width="120" height="120" loading="lazy"><b>' + esc(g.nombre) + '</b><span>Guía oficial</span></li>';
            }).join('') +
          '</ul>' +
        '</section>' +
        '<div class="sellos" aria-label="Reconocimientos">' +
          '<img src="/assets/logos/mincetur.webp" alt="MINCETUR" width="50" height="46" loading="lazy">' +
          '<img src="/assets/logos/travelers-choice.webp" alt="Tripadvisor Travelers’ Choice" width="51" height="46" loading="lazy">' +
          '<img src="/assets/logos/safe-travels.webp" alt="Safe Travels, WTTC" width="46" height="46" loading="lazy">' +
          '<img src="/assets/logos/promperu.webp" alt="PromPerú" width="107" height="46" loading="lazy">' +
        '</div>' +
        '<p class="nota">Si prefieres no escribir, no pasa nada: te contactamos nosotros. Respondemos en horario de Perú.</p>' +
        (st.envio === 'error' ? '<p class="fallback">No pudimos confirmar el envío por aquí, pero guardamos tus datos en este dispositivo. Escríbenos por WhatsApp para que no se pierda nada.</p>' : '') +
        '<a class="volver" href="/">Volver a la web</a>' +
      '</div>';
    $('#confianza').hidden = true;
    rotarResenas();

    var btn = $('#wa');
    if (btn) btn.addEventListener('click', function () {
      // ll-t.js ya suma la ref LL- al texto y cuenta el clic; acá se anota en el lead.
      fetch(API_LEAD, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tipo: 'click_whatsapp', submission_id: st.id }), keepalive: true
      }).catch(function () {});
      if (window.fbq) window.fbq('track', 'Contact');
      if (window.gtag) window.gtag('event', 'Contact');
    });
    progreso(100);
  }

  // Reseñas: cambian solas cada 7 s (no con movimiento reducido) y con los puntos.
  var rotador = null;
  function rotarResenas() {
    clearInterval(rotador);
    var items = $$('#paso .resena');
    var puntos = $$('#paso [data-resena]');
    if (items.length < 2) return;
    var actual = 0;
    var mostrar = function (n) {
      actual = n;
      items.forEach(function (el, i) { el.classList.toggle('on', i === n); el.setAttribute('aria-hidden', i !== n); });
      puntos.forEach(function (b, i) { b.classList.toggle('on', i === n); });
    };
    var auto = function () {
      clearInterval(rotador);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      rotador = setInterval(function () { mostrar((actual + 1) % items.length); }, 7000);
    };
    puntos.forEach(function (b) { b.addEventListener('click', function () { mostrar(Number(b.dataset.resena)); auto(); }); });
    auto();
  }

  // ---- estado guardado ----
  function guardar() {
    try {
      localStorage.setItem(CLAVE_ESTADO, JSON.stringify({
        d: st.d, idx: st.idx, id: st.id, completado: st.completado, rango: st.rangoDias, crm: st.crmId, t: Date.now()
      }));
    } catch (e) {}
  }
  function restaurar() {
    try {
      var g = JSON.parse(localStorage.getItem(CLAVE_ESTADO) || 'null');
      if (!g || Date.now() - g.t > 3 * 864e5) return;
      if (g.completado) return;   // terminado: arranca uno nuevo
      st.d = Object.assign(datosVacios(), g.d);
      if (st.d.itinerario === 'paquete') st.d.itinerario = null;
      st.idx = g.idx || 0;
      st.id = g.id || st.id;
      st.rangoDias = !!g.rango;
      st.crmId = g.crm || null;
      st.restaurado = st.idx > 0;
    } catch (e) {}
  }

  function debug() {
    var el = $('#debug');
    el.hidden = false;
    var s = window.LunaScoring.score(st.d);
    el.textContent = 'DEBUG · rama ' + (st.d.itinerario || '?') + ' · paso ' + (pasoActual() || 'final') +
      '\nSCORE ' + s.score10 + '/10 (' + s.total + '/100) · ' + s.tier.toUpperCase() +
      '\n' + JSON.stringify(s.desglose) + '\n\n' + JSON.stringify(st.d, null, 1);
  }

  function fondo() {
    var cont = $('#fondo');
    var capas = FONDOS.map(function (src) {
      var el = document.createElement('div');
      el.className = 'img';
      el.dataset.src = src;
      cont.appendChild(el);
      return el;
    });
    var i = Math.floor(Math.random() * capas.length);
    var mostrar = function (n) {
      var c = capas[n];
      if (!c.style.backgroundImage) c.style.backgroundImage = 'url(' + c.dataset.src + ')';
      capas.forEach(function (x, k) { x.classList.toggle('on', k === n); });
    };
    mostrar(i);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(function () { i = (i + 1) % capas.length; mostrar(i); }, 9800);
    }
  }

  // Teclas 1..9 eligen opción en los pasos de una sola respuesta.
  addEventListener('keydown', function (e) {
    if (e.target.matches && e.target.matches('input, textarea')) return;
    var n = Number(e.key);
    if (!Number.isInteger(n) || n < 1) return;
    if ($('#paso .meses') || $('#paso .check')) return;
    var op = $$('#paso .opcion')[n - 1];
    if (op) op.click();
  });

  fondo();
  restaurar();
  fetch(API_PAIS)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (j && j.iso) st.iso = j.iso;
      if (j && j.prefijo) st.prefijo = '+' + j.prefijo + ' ' + (j.iso === 'AR' ? '9 ' : '');
    })
    .catch(function () {});
  render(false);
  try {
    var pendiente = JSON.parse(localStorage.getItem(CLAVE_PENDIENTE) || 'null');
    if (pendiente) enviar(pendiente);
  } catch (e) {}
})();
