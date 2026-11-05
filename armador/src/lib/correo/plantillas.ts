// Plantillas de los mails del armador v2. HTML con tablas y estilos en línea (lo que leen
// Gmail, Outlook y Apple Mail), paleta del sitio, español neutro con "tú".
//
// LOS TEXTOS VAN EN `TEXTOS` (abajo). Marcadores disponibles:
//   {nombre} {dias} {ruta} {precio} {codigo}
// Los que dicen [TEXTO PENDIENTE] son para reemplazar.
//
// Cuándo sale cada uno: src/lib/correo/secuencia.ts.
// Botón de WhatsApp: lo decide la cola (mail 5 siempre; cualquier mail si el lead es calificado).

import type { Plantilla } from "./secuencia";

export const TEXTOS: Record<Exclude<Plantilla, "alerta_sin_contacto" | "alerta_subio_score">, { asunto: string; preheader: string; titulo: string; parrafos: string[]; boton?: string }> = {
  itinerario: {
    asunto: "{nombre}, tu viaje de {dias} días ya tiene ruta",
    preheader: "Tu itinerario día por día y el precio desde.",
    titulo: "Tu viaje de {dias} días ya tiene ruta",
    parrafos: [
      "Hola {nombre}, ordenamos tu viaje por {ruta} respetando la altura, para que te aclimates sin perder días.",
      "Adentro tienes el día por día completo y el precio desde, por persona.",
    ],
    boton: "Ver mi itinerario",
  },
  mail_2: {
    asunto: "[TEXTO PENDIENTE] Asunto del mail 2",
    preheader: "[TEXTO PENDIENTE]",
    titulo: "[TEXTO PENDIENTE] Título del mail 2",
    parrafos: ["Hola {nombre}, [TEXTO PENDIENTE] cuerpo del mail 2."],
    boton: "Ver mi itinerario",
  },
  mail_3: {
    asunto: "[TEXTO PENDIENTE] Asunto del mail 3",
    preheader: "[TEXTO PENDIENTE]",
    titulo: "[TEXTO PENDIENTE] Título del mail 3",
    parrafos: ["Hola {nombre}, [TEXTO PENDIENTE] cuerpo del mail 3."],
    boton: "Ver mi itinerario",
  },
  mail_4: {
    asunto: "[TEXTO PENDIENTE] Asunto del mail 4",
    preheader: "[TEXTO PENDIENTE]",
    titulo: "[TEXTO PENDIENTE] Título del mail 4",
    parrafos: ["Hola {nombre}, [TEXTO PENDIENTE] cuerpo del mail 4."],
    boton: "Ver mi itinerario",
  },
  mail_5_whatsapp: {
    asunto: "{nombre}, ¿armamos tu viaje juntos?",
    preheader: "Te ayudamos a ajustar fechas, hoteles y presupuesto por WhatsApp.",
    titulo: "¿Lo armamos juntos?",
    parrafos: [
      "Hola {nombre}, hace unos días armaste tu viaje de {dias} días por {ruta}. Si todavía lo estás pensando, podemos ajustarlo contigo.",
      "[TEXTO PENDIENTE] Escríbenos por WhatsApp y te responde una persona del equipo en Cusco.",
    ],
    boton: "Ver mi itinerario",
  },
};

export const TEXTO_WHATSAPP = { intro: "¿Quieres cotizarlo con fechas exactas? Escríbenos:", boton: "Escribir por WhatsApp" };

export interface DatosMail {
  nombre: string;
  dias: string; // "8-10"
  ruta: string; // "Machu Picchu, Camino Inca"
  precioDesdeUsd: number | null;
  codigo: string;
  urlItinerario: string;
  /** Con URL, el mail lleva el botón de WhatsApp. */
  urlWhatsapp: string | null;
}

export interface DatosAlerta {
  motivo: "sin_contacto" | "subio_score";
  nombre: string;
  email: string;
  whatsapp: string | null;
  codigo: string;
  score: number;
  grupo: string;
  resumen: string; // "2 viajeros · 8-10 días · enero · Machu Picchu, Camino Inca"
  comentario: string;
  creadoEn: string;
}

export interface MailArmado {
  asunto: string;
  html: string;
  texto: string;
}

// ---------- Piezas ----------

const NARANJA = "#FF7A00";
const TINTA = "#1E1B18";
const GRIS = "#6F665C";
const ARENA = "#F5EEDD";
const HUESO = "#FBF8F3";
const LINEA = "#E2D9CE";
const DORADO = "#8E6214";
const FUENTE = "Manrope,'Helvetica Neue',Arial,sans-serif";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Reemplaza {marcadores}. Los valores se escapan para HTML si `html` es true. */
export function rellenar(texto: string, valores: Record<string, string>, html = false): string {
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (k in valores ? (html ? esc(valores[k]) : valores[k]) : m));
}

function boton(texto: string, url: string, verde = false) {
  const fondo = verde ? "#25D366" : NARANJA;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr><td style="background:${fondo};border-radius:2px">
<a href="${esc(url)}" style="display:inline-block;padding:15px 24px;font:600 12px/1.2 ${FUENTE};letter-spacing:.18em;text-transform:uppercase;color:${verde ? "#0B3D20" : TINTA};text-decoration:none">${esc(texto)}</a></td></tr></table>`;
}

function marco(preheader: string, cuerpo: string, interno = false) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luna Llena Travel</title><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:${ARENA};-webkit-text-size-adjust:100%">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ARENA}"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${HUESO};border:1px solid ${LINEA};border-top:3px solid ${DORADO};border-radius:2px">
<tr><td style="padding:22px 28px;border-bottom:1px solid ${LINEA};font:600 15px/1 ${FUENTE};color:${TINTA}">
<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${NARANJA};vertical-align:-2px;margin-right:8px"></span>Luna Llena Travel</td></tr>
<tr><td style="padding:28px;font:400 16px/1.6 ${FUENTE};color:${TINTA}">${cuerpo}</td></tr>
${interno ? "" : `<tr><td style="padding:18px 28px 24px;border-top:1px solid ${LINEA};font:400 12px/1.5 ${FUENTE};color:${GRIS}">
Luna Llena Travel · Full Moon Travel Agency E.I.R.L. · RUC 20603319428 · Calle Chihuampata 543, San Blas, Cusco.<br>
Te escribimos porque armaste un viaje en nuestra web. Si no quieres recibir más mails, responde "baja" a este mensaje.</td></tr>`}
</table></td></tr></table></body></html>`;
}

const h1 = (t: string) => `<h1 style="margin:0 0 14px;font:300 30px/1.15 ${FUENTE};letter-spacing:-.02em;color:${TINTA}">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`;
const firma = `<p style="margin:22px 0 0;color:${GRIS}">Un abrazo desde Cusco,<br><b style="color:${TINTA}">El equipo de Luna Llena</b></p>`;

// ---------- Mails a la persona ----------

export function armarMail(plantilla: keyof typeof TEXTOS, d: DatosMail): MailArmado {
  const tx = TEXTOS[plantilla];
  const primerNombre = d.nombre.trim().split(/\s+/)[0] || d.nombre;
  const valores = {
    nombre: primerNombre,
    dias: d.dias,
    ruta: d.ruta,
    precio: d.precioDesdeUsd ? `USD ${Math.round(d.precioDesdeUsd).toLocaleString("es-PE")}` : "",
    codigo: d.codigo,
  };
  const precio =
    plantilla === "itinerario" && d.precioDesdeUsd
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:${TINTA};border-radius:2px"><tr><td style="padding:20px 22px;font:400 14px/1.5 ${FUENTE};color:#D9D2C8">
Precio desde, por persona<br><b style="font:300 34px/1.2 ${FUENTE};color:#F6F1EA">${esc(valores.precio)}</b><br>
<span style="font-size:12.5px;color:#A9A9A9">Experiencias y hoteles. No incluye vuelos internacionales.</span></td></tr></table>`
      : "";
  const whatsapp = d.urlWhatsapp ? p(esc(TEXTO_WHATSAPP.intro)) + boton(TEXTO_WHATSAPP.boton, d.urlWhatsapp, true) : "";
  const html = marco(
    rellenar(tx.preheader, valores),
    h1(rellenar(tx.titulo, valores, true)) +
      tx.parrafos.map((x) => p(rellenar(x, valores, true))).join("") +
      precio +
      (tx.boton ? boton(tx.boton, d.urlItinerario) : "") +
      whatsapp +
      firma,
  );
  const texto = [
    rellenar(tx.titulo, valores),
    ...tx.parrafos.map((x) => rellenar(x, valores)),
    valores.precio && plantilla === "itinerario" ? `Precio desde: ${valores.precio} por persona.` : "",
    `Tu itinerario: ${d.urlItinerario}`,
    d.urlWhatsapp ? `WhatsApp: ${d.urlWhatsapp}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { asunto: rellenar(tx.asunto, valores), html, texto };
}

// ---------- Alertas internas (a ALERTAS_EMAIL) ----------

export function armarAlerta(a: DatosAlerta): MailArmado {
  const asunto =
    a.motivo === "sin_contacto"
      ? `[Alerta] ${a.nombre} (${a.codigo}) está calificado y nadie le escribió en 30 min`
      : `[Sube] ${a.nombre} (${a.codigo}) subió a ${a.score}: pasó a calificado`;
  const accion = a.motivo === "sin_contacto" ? "Escribirle ahora por WhatsApp." : "Volvió al itinerario o hizo clic en los mails. Escribirle por WhatsApp.";
  const waPersona = a.whatsapp ? `https://wa.me/${a.whatsapp.replace(/\D/g, "")}` : null;
  const filas: [string, string][] = [
    ["Código", a.codigo],
    ["Nombre", a.nombre],
    ["Mail", a.email],
    ["WhatsApp", a.whatsapp ?? "(no dejó o no es válido)"],
    ["Score", `${a.score} · ${a.grupo}`],
    ["Viaje", a.resumen],
    ["Comentario", a.comentario || "(vacío)"],
    ["Llegó", a.creadoEn],
  ];
  const html = marco(
    accion,
    h1(esc(accion)) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid ${LINEA}">${filas
        .map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid ${LINEA};color:${GRIS};width:110px">${esc(k)}</td><td style="padding:8px 12px;border-bottom:1px solid ${LINEA}">${esc(v)}</td></tr>`)
        .join("")}</table>` +
      (waPersona ? boton("Abrir su WhatsApp", waPersona, true) : ""),
    true,
  );
  const texto = [accion, ...filas.map(([k, v]) => `${k}: ${v}`), waPersona ? `WhatsApp: ${waPersona}` : ""].filter(Boolean).join("\n");
  return { asunto, html, texto };
}
