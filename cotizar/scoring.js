/* Score de calificación del formulario /cotizar/ (1 a 10).
 *
 * Misma cuenta que el formulario anterior (luna-llena-viaje.vercel.app), sin
 * la rama "paquete": esa opción ahora manda a /paquetes/. El CRM guarda el
 * resultado en leads.score / score_detalle (plantilla-crm, migración 035).
 */
(function (global) {
  var RANGOS_PRESUPUESTO = [
    { valor: 'lt500', etiqueta: 'Menos de US$ 500', puntos: 0 },
    { valor: '500-1000', etiqueta: 'US$ 500 – 1.000', puntos: 2 },
    { valor: '1000-1500', etiqueta: 'US$ 1.000 – 1.500', puntos: 4 },
    { valor: '1500-2000', etiqueta: 'US$ 1.500 – 2.000', puntos: 6 },
    { valor: '2000-3000', etiqueta: 'US$ 2.000 – 3.000', puntos: 8 },
    { valor: 'gt3000', etiqueta: 'Más de US$ 3.000', puntos: 10 }
  ];
  var MAX = { itinerario: 15, pasajes: 15, fecha: 15, presupuesto: 25, grupo: 10, duracion: 10, destinos: 5, detalle: 5 };
  var MES_MS = 2630016e3;   // un mes promedio

  // Rama "si": días exactos del viaje y destinos del itinerario (tramos, sin
  // contar dos veces un destino que se repite). Rama "no": rango y lista.
  function diasTotales(d) {
    if (d.itinerario === 'si') return d.dias || 0;
    if (d.diasMin == null) return 0;
    return d.diasMax != null ? (d.diasMin + d.diasMax) / 2 : d.diasMin;
  }

  function cantidadDestinos(d) {
    if (d.itinerario === 'si') {
      var vistos = {};
      (d.tramos || []).forEach(function (t) { vistos[t.nombre] = 1; });
      return Object.keys(vistos).length;
    }
    var otros = (d.otros || '').split(',').filter(function (x) { return x.trim(); }).length;
    return (d.destinos || []).length + otros;
  }

  function mesesHasta(d, hoy) {
    if (d.fechaExacta) return (new Date(d.fechaExacta) - hoy) / MES_MS;
    if (d.mes) {
      var p = d.mes.split('-').map(Number);
      return (new Date(p[0], p[1] - 1, 1) - hoy) / MES_MS;
    }
    return null;
  }

  function score(d, hoy) {
    hoy = hoy || new Date();
    var s = {};
    s.itinerario = d.itinerario === 'si' ? 15 : 5;
    s.pasajes = d.pasajes === 'comprados' ? 15 : 0;

    var meses = mesesHasta(d, hoy);
    if (meses == null) s.fecha = 0;
    else if (d.fechaExacta) s.fecha = meses <= 6 ? 15 : 10;
    else s.fecha = meses <= 6 ? 9 : 4;

    if (d.presupuesto === 'si' && d.presupuestoRango) {
      var r = RANGOS_PRESUPUESTO.find(function (x) { return x.valor === d.presupuestoRango; });
      s.presupuesto = 15 + (r ? r.puntos : 0);
    } else s.presupuesto = 3;

    var personas = (d.adultos || 0) + (d.ninos || 0);
    s.grupo = personas >= 5 ? 10 : personas >= 3 ? 9 : personas === 2 ? 7 : personas === 1 ? 4 : 0;

    var dias = diasTotales(d);
    s.duracion = dias >= 15 ? 10 : dias >= 10 ? 8 : dias >= 5 ? 5 : dias > 0 ? 2 : 0;

    var n = cantidadDestinos(d);
    s.destinos = n >= 4 ? 5 : n >= 2 ? 4 : n === 1 ? 2 : 0;

    var largo = (d.notas || '').trim().length;
    s.detalle = largo >= 40 ? 5 : largo > 0 ? 2 : 0;

    var total = Object.keys(s).reduce(function (a, k) { return a + s[k]; }, 0);
    var score10 = Math.max(1, Math.min(10, Math.round(total / 10)));
    var tier = score10 >= 7 ? 'caliente' : score10 >= 5 ? 'tibio' : 'frio';
    return {
      total: total,
      score10: score10,
      tier: tier,
      accion: {
        caliente: 'Contactar por WhatsApp en menos de 1 hora y cotizar.',
        tibio: 'Contactar en el día para completar lo que falta (presupuesto / fechas).',
        frio: 'Nutrir: enviar inspiración e itinerarios modelo, retomar en 7 días.'
      }[tier],
      desglose: s,
      max: MAX,
      dias: dias,
      personas: personas
    };
  }

  global.LunaScoring = {
    score: score,
    diasTotales: diasTotales,
    cantidadDestinos: cantidadDestinos,
    RANGOS_PRESUPUESTO: RANGOS_PRESUPUESTO,
    MAX: MAX
  };
})(window);
