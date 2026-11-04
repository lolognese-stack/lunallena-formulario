// Los 5 mails del armador. HTML con tablas y estilos en línea (lo que leen
// Gmail, Outlook y Apple Mail), en español neutro con "tú".
//
//   1 · +10 min  Tu itinerario está listo (WhatsApp solo si es caliente o tibio)
//   2 · día 1    Altura y aclimatación
//   3 · día 3    Cuánto cuesta realmente y qué incluye
//   4 · día 5    Hoteles y viajeros reales
//   5 · día 8    ¿Lo armamos juntos? (WhatsApp para todos)
//
// La secuencia se corta cuando la persona toca el botón de WhatsApp (/wa/[slug]).

export interface DatosCorreo {
  nombre: string;
  dias: number;
  ruta: string; // "Cusco, Valle Sagrado y Machu Picchu"
  urlItinerario: string;
  urlWhatsapp: string; // botón con registro de clic
  precioPorPersona: string; // "S/ 2.430"
  precioUsd: number;
  conWhatsapp: boolean; // caliente o tibio (mail 1 a 4)
}

export interface Correo {
  n: number;
  asunto: string;
  html: string;
  texto: string;
  minutos: number; // demora desde que terminó el quiz
}

// Paleta y tipografía del sitio (sección Paquetes, tema premium).
const NARANJA = "#FF7A00";
const TINTA = "#1E1B18";
const GRIS = "#6F665C";
const ARENA = "#F5EEDD"; // fondo crema
const HUESO = "#FBF8F3"; // tarjeta
const LINEA = "#E2D9CE";
const DORADO = "#8E6214";
const FUENTE = "Manrope,'Helvetica Neue',Arial,sans-serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function boton(texto: string, url: string, verde = false) {
  const fondo = verde ? "#25D366" : NARANJA;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="background:${fondo};border-radius:2px">
<a href="${esc(url)}" style="display:inline-block;padding:15px 24px;font:600 12px/1.2 ${FUENTE};letter-spacing:.18em;text-transform:uppercase;color:${verde ? "#0B3D20" : TINTA};text-decoration:none">${esc(texto)}</a></td></tr></table>`;
}

function marco(preheader: string, cuerpo: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luna Llena Travel</title><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:${ARENA};-webkit-text-size-adjust:100%">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ARENA}"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${HUESO};border:1px solid ${LINEA};border-top:3px solid ${DORADO};border-radius:2px">
<tr><td style="padding:22px 28px;border-bottom:1px solid ${LINEA};font:600 15px/1 ${FUENTE};color:${TINTA}">
<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${NARANJA};vertical-align:-2px;margin-right:8px"></span>Luna Llena Travel</td></tr>
<tr><td style="padding:28px;font:400 16px/1.6 ${FUENTE};color:${TINTA}">${cuerpo}</td></tr>
<tr><td style="padding:18px 28px 24px;border-top:1px solid ${LINEA};font:400 12px/1.5 ${FUENTE};color:${GRIS}">
Luna Llena Travel · Full Moon Travel Agency E.I.R.L. · RUC 20603319428 · Calle Chihuampata 543, San Blas, Cusco.<br>
Te escribimos porque armaste un viaje en nuestra web. Si no quieres recibir más mails, responde "baja" a este mensaje.</td></tr>
</table></td></tr></table></body></html>`;
}

const h1 = (t: string) => `<h1 style="margin:0 0 14px;font:300 30px/1.15 ${FUENTE};letter-spacing:-.02em;color:${TINTA}">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`;
const firma = `<p style="margin:22px 0 0;color:${GRIS}">Un abrazo desde Cusco,<br><b style="color:${TINTA}">El equipo de Luna Llena</b></p>`;

export function armarCorreos(d: DatosCorreo): Correo[] {
  const n = esc(d.nombre.split(" ")[0] || d.nombre);
  const ruta = esc(d.ruta);
  const wa = (texto: string) => boton(texto, d.urlWhatsapp, true);
  const verItinerario = boton("Ver mi itinerario", d.urlItinerario);

  const c1 = {
    n: 1,
    minutos: 10,
    asunto: `${d.nombre.split(" ")[0]}, tu viaje de ${d.dias} días a Cusco está listo`,
    html: marco(
      `Revisamos tu ruta por ${d.ruta}. Adentro, día por día y el precio desde.`,
      h1(`Tu viaje de ${d.dias} días ya tiene ruta`) +
        p(`Hola ${n}, revisamos lo que elegiste y ordenamos tu viaje por <b>${ruta}</b> respetando la altura, para que te aclimates sin perder días.`) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:${TINTA};border-radius:2px"><tr><td style="padding:20px 22px;font:400 14px/1.5 ${FUENTE};color:#D9D2C8">
Precio desde, por persona<br><b style="font:300 34px/1.2 ${FUENTE};color:#F6F1EA">${esc(d.precioPorPersona)}</b> <span style="color:#BDBDBD">(aprox. USD ${d.precioUsd})</span><br>
<span style="font-size:12.5px;color:#A9A9A9">Experiencias y hoteles. No incluye vuelos internacionales.</span></td></tr></table>` +
        verItinerario +
        (d.conWhatsapp
          ? p(`¿Quieres cambiar algo o cotizarlo con fechas exactas? Escríbenos y lo ajustamos contigo:`) + wa("Escribir por WhatsApp")
          : p(`En los próximos días te mandamos lo que más nos preguntan los viajeros antes de decidir: la altura, qué incluye el precio y dónde vas a dormir.`)) +
        firma,
    ),
    texto: `Hola ${d.nombre}, tu viaje de ${d.dias} días por ${d.ruta} está listo.\nPrecio desde ${d.precioPorPersona} por persona (aprox. USD ${d.precioUsd}).\nVer itinerario: ${d.urlItinerario}\n${d.conWhatsapp ? `Escríbenos por WhatsApp: ${d.urlWhatsapp}\n` : ""}`,
  };

  const c2 = {
    n: 2,
    minutos: 24 * 60,
    asunto: "Cómo evitar el mal de altura en Cusco",
    html: marco(
      "Lo que hacemos en tu ruta para que la altura no te arruine un día.",
      h1("La altura, sin miedo") +
        p(`Hola ${n}, es la duda número uno de quienes viajan a Cusco, sobre todo si van con padres mayores o es su primera vez a 3.400 metros.`) +
        p(`Por eso tu itinerario <b>empieza por lo más bajo y sube de a poco</b>. Tres cosas que recomendamos siempre:`) +
        `<ul style="margin:0 0 14px;padding-left:20px"><li style="margin:6px 0">El primer día, nada exigente: caminar lento, tomar mate de coca y dormir bien.</li><li style="margin:6px 0">Si tu ruta lo permite, dormir primero en el Valle Sagrado (2.800 m) y después en Cusco.</li><li style="margin:6px 0">Comidas livianas y mucha agua las primeras 48 horas.</li></ul>` +
        p(`Si alguien de tu grupo tiene una condición de salud, cuéntanos: ajustamos el ritmo y los traslados.`) +
        verItinerario +
        (d.conWhatsapp ? wa("Consultar por WhatsApp") : "") +
        firma,
    ),
    texto: `Hola ${d.nombre}, la altura sin miedo: tu itinerario empieza por lo más bajo y sube de a poco. Primer día tranquilo, Valle Sagrado antes que Cusco si se puede, comidas livianas y mucha agua.\nTu itinerario: ${d.urlItinerario}\n`,
  };

  const c3 = {
    n: 3,
    minutos: 3 * 24 * 60,
    asunto: "Cuánto cuesta realmente tu viaje (y qué incluye)",
    html: marco(
      "El precio desde, explicado sin letra chica.",
      h1("Qué hay detrás del precio") +
        p(`Hola ${n}, tu itinerario sale desde <b>${esc(d.precioPorPersona)}</b> por persona. Así se arma ese número:`) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;border:1px solid ${LINEA};border-radius:2px;font-size:15px">
<tr><td style="padding:12px 16px;border-bottom:1px solid ${LINEA}"><b>Incluye</b><br><span style="color:${GRIS}">Hoteles de la categoría que elegiste, experiencias y entradas, tren a Machu Picchu cuando la ruta lo lleva, traslados y guía.</span></td></tr>
<tr><td style="padding:12px 16px"><b>No incluye</b><br><span style="color:${GRIS}">Vuelos internacionales, comidas que no figuran en el itinerario y propinas.</span></td></tr></table>` +
        p(`Organizarlo por tu cuenta puede parecer más barato, pero los boletos de Machu Picchu y del tren se agotan en temporada. Nosotros los reservamos con anticipación y tú no pierdes tiempo organizando.`) +
        verItinerario +
        (d.conWhatsapp ? wa("Cotizar con fechas exactas") : "") +
        firma,
    ),
    texto: `Hola ${d.nombre}, tu viaje sale desde ${d.precioPorPersona} por persona. Incluye hoteles, experiencias, entradas, tren cuando corresponde, traslados y guía. No incluye vuelos internacionales.\nTu itinerario: ${d.urlItinerario}\n`,
  };

  const c4 = {
    n: 4,
    minutos: 5 * 24 * 60,
    asunto: "Dónde vas a dormir (y quiénes ya viajaron)",
    html: marco(
      "Hoteles céntricos y más de 1.000 viajeros que ya recorrieron Perú con nosotros.",
      h1("Dónde vas a dormir") +
        p(`Hola ${n}, otra pregunta que nos hacen siempre: <i>¿los hoteles son céntricos?</i> Sí. En Cusco elegimos hoteles a pocas cuadras de la Plaza de Armas o en San Blas, donde está nuestra oficina.`) +
        p(`Más de <b>1.000 viajeros</b> ya recorrieron Perú con nosotros, con 4,9 de 5 en TripAdvisor. Somos agencia formal (RUC 20603319428), con 8 años organizando viajes en Cusco.`) +
        verItinerario +
        (d.conWhatsapp ? wa("Preguntar por los hoteles") : "") +
        firma,
    ),
    texto: `Hola ${d.nombre}, en Cusco elegimos hoteles céntricos, cerca de la Plaza de Armas o en San Blas. Más de 1.000 viajeros ya viajaron con nosotros (4,9/5 en TripAdvisor).\nTu itinerario: ${d.urlItinerario}\n`,
  };

  const c5 = {
    n: 5,
    minutos: 8 * 24 * 60,
    asunto: `${d.nombre.split(" ")[0]}, ¿armamos tu viaje juntos?`,
    html: marco(
      "Te ayudamos a ajustar fechas, hoteles y presupuesto por WhatsApp.",
      h1("¿Lo armamos juntos?") +
        p(`Hola ${n}, hace unos días armaste tu viaje de ${d.dias} días por <b>${ruta}</b>. Si todavía lo estás pensando, podemos ajustarlo contigo: fechas, ritmo, hoteles o presupuesto.`) +
        p(`Escríbenos por WhatsApp y te responde una persona del equipo en Cusco.`) +
        wa("Escribir por WhatsApp") +
        p(`<a href="${esc(d.urlItinerario)}" style="color:${DORADO}">Volver a ver mi itinerario</a>`) +
        firma,
    ),
    texto: `Hola ${d.nombre}, ¿armamos tu viaje juntos? Escríbenos por WhatsApp: ${d.urlWhatsapp}\nTu itinerario: ${d.urlItinerario}\n`,
  };

  return [c1, c2, c3, c4, c5];
}
