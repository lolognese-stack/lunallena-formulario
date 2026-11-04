// Catálogo fijo para los tests del motor y para la web mientras el catálogo real
// no esté cargado en Supabase (ver src/lib/datos/catalogo.ts).
// Cusco, Valle Sagrado y Machu Picchu salen de data/catalogo.csv (precios del sitio).
// Costa, Arequipa, Colca y Puno son INVENTADOS: el sitio no tiene esas experiencias sueltas.
import type { Catalogo, Destino, Estilo, Experiencia, TarifaHotel } from "./tipos";

const FOTOS_DESTINO: Record<string, string> = {
  cusco: "2023/11/plazadearmas.jpg",
  "valle-sagrado": "2024/01/ollanta.jpg",
  "machu-picchu": "2023/11/mapi2-1024x627.jpg",
  colca: "2023/11/79775-Colca-Canyon-1024x576.webp",
  puno: "2023/11/puno1.jpg",
};

const destino = (slug: string, nombre: string, altitudM: number, nochesMinimas: number, ordenRuta: number, esNucleo = false): Destino => ({
  id: slug,
  slug,
  nombre,
  altitudM,
  nochesMinimas,
  ordenRuta,
  esNucleo,
  imagenUrl: FOTOS_DESTINO[slug] ? `https://lunallenatravel.com/wp-content/uploads/${FOTOS_DESTINO[slug]}` : null,
});

type Datos = Partial<Experiencia> & Pick<Experiencia, "slug" | "destinoId" | "dificultad" | "precioDesde"> & { estilos: Estilo[] };

/** "laguna-humantay" → "Laguna humantay" (los nombres reales vienen de la base). */
const legible = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

const FOTOS = "https://lunallenatravel.com/wp-content/uploads/2023/11/";

/** Nombre y foto de las fichas del sitio (data/catalogo.csv), para que la página de prueba se vea real. */
const FICHAS: Record<string, [nombre: string, foto?: string]> = {
  "city-tour-cusco": ["City tour Cusco", "chicas-logo-1.jpg"],
  "valle-sur": ["Valle Sur", "piki-1.jpg"],
  "cusco-circuito-religioso": ["Circuito religioso de Cusco", "Circuito-Religioso.jpg"],
  "tour-cusco-mistico": ["Tour Cusco místico", "morada-dioses-cusco-figuras.jpg"],
  "pagos-a-la-pachamama": ["Pago a la Pachamama", "keros.jpg"],
  "montana-de-colores": ["Montaña de Colores", "vinicunca.jpg"],
  "laguna-humantay": ["Laguna Humantay", "lake-humantay.webp"],
  "huchuyqosqo-full-day": ["Huchuy Qosqo full day", "huchuy-qosqo-trek.jpg"],
  "puente-queswachaca": ["Puente Q'eswachaka", "PAJA-PUENTE.jpg"],
  "cooking-class": ["Clase de cocina peruana", "cooking-class.jpg"],
  "lares-hot-spring": ["Aguas termales de Lares", "tejedoras.jpg"],
  "cocalmayo-2d-hot-spring": ["Aguas termales de Cocalmayo 2D/1N", "cocalmayojpg-1.webp"],
  "trek-salkantay-4d": ["Trek Salkantay 4D/3N"],
  "valle-sagrado-tradicional": ["Valle Sagrado tradicional", "ponchos.jpg"],
  "valle-sagrado-vip-maras-moray": ["Valle Sagrado VIP + Maras y Moray", "marasmoray.webp"],
  "ruta-culinaria": ["Ruta culinaria del Valle", "RUTA.jpg"],
  "espiritu-vivencial": ["Espíritu vivencial", "NINOS-ANDINOS.jpg"],
  "mapi-full-day-tren-turistico": ["Machu Picchu full day en tren turístico", "espana-44.jpg"],
  "mapi-full-day-tren-local": ["Machu Picchu full day en tren local (peruanos)", "LIMPIA.jpg"],
  "mapi-y-montana-machupicchu": ["Machu Picchu + Montaña Machu Picchu", "huaynapichu_principal-1024x466-1.jpg"],
  "mapi-2d-1n-experiencia-total": ["Machu Picchu 2D/1N experiencia total", "espana-11.jpg"],
  "camino-inka-tradicional-4d": ["Camino Inka tradicional 4D/3N", "inca-trail-express-from-lima-by-andean-path-trek.jpg"],
  "inka-jungle-4d": ["Inka Jungle a Machu Picchu 4D/3N", "a4-scaled.jpg"],
  "ausangate-full-day": ["Ausangate full day (de prueba)", "montana-7-colores-2.jpg"],
};

const experiencia = ({ slug, dias = 1, ...resto }: Datos): Experiencia => ({
  id: slug,
  slug,
  nombre: FICHAS[slug]?.[0] ?? legible(slug),
  imagenUrl: FICHAS[slug]?.[1] ? FOTOS + FICHAS[slug][1] : null,
  duracion: dias > 1 ? "varios_dias" : "dia",
  dias,
  altitudMaxM: null,
  mesesCerrados: [],
  terminaEnId: null,
  esTrek: false,
  esIcono: false,
  alAireLibre: true,
  ...resto,
});

export const catalogoPrueba: Catalogo = {
  destinos: [
    destino("lima", "Lima", 154, 1, 1),
    destino("paracas", "Paracas e Ica", 5, 1, 2),
    destino("arequipa", "Arequipa", 2335, 1, 3),
    destino("colca", "Cañón del Colca", 3635, 1, 4),
    destino("puno", "Puno y Lago Titicaca", 3827, 1, 5),
    destino("cusco", "Cusco", 3399, 2, 6, true),
    destino("valle-sagrado", "Valle Sagrado", 2871, 1, 7, true),
    destino("machu-picchu", "Machu Picchu", 2040, 0, 8, true),
  ],
  experiencias: [
    // Cusco
    experiencia({ slug: "city-tour-cusco", destinoId: "cusco", dificultad: 2, estilos: ["clasico", "relax"], precioDesde: 45, esIcono: true }),
    experiencia({ slug: "valle-sur", destinoId: "cusco", dificultad: 2, estilos: ["clasico"], precioDesde: 65 }),
    experiencia({ slug: "cusco-circuito-religioso", destinoId: "cusco", dificultad: 2, estilos: ["clasico"], precioDesde: 75, alAireLibre: false }),
    experiencia({ slug: "tour-cusco-mistico", destinoId: "cusco", dificultad: 2, estilos: ["mistico"], precioDesde: 65 }),
    experiencia({ slug: "pagos-a-la-pachamama", destinoId: "cusco", dificultad: 2, estilos: ["mistico"], precioDesde: 450 }),
    experiencia({ slug: "montana-de-colores", destinoId: "cusco", dificultad: 4, estilos: ["aventura"], precioDesde: 115, esIcono: true, altitudMaxM: 5200 }),
    experiencia({ slug: "laguna-humantay", destinoId: "cusco", dificultad: 3, estilos: ["aventura"], precioDesde: 120, esIcono: true, altitudMaxM: 4200 }),
    experiencia({ slug: "huchuyqosqo-full-day", destinoId: "cusco", dificultad: 3, estilos: ["clasico"], precioDesde: 120 }),
    experiencia({ slug: "puente-queswachaca", destinoId: "cusco", dificultad: 3, estilos: ["clasico"], precioDesde: 120 }),
    experiencia({ slug: "cooking-class", destinoId: "cusco", dificultad: 1, estilos: ["relax"], precioDesde: 150, alAireLibre: false }),
    experiencia({ slug: "lares-hot-spring", destinoId: "cusco", dificultad: 2, estilos: ["relax"], precioDesde: 140 }),
    experiencia({ slug: "cocalmayo-2d-hot-spring", destinoId: "cusco", dias: 2, dificultad: 2, estilos: ["relax"], precioDesde: 330 }),
    experiencia({ slug: "trek-salkantay-4d", destinoId: "cusco", dias: 4, dificultad: 4, estilos: ["aventura"], precioDesde: 1200, esTrek: true, altitudMaxM: 4630 }),
    // Valle Sagrado
    experiencia({ slug: "valle-sagrado-tradicional", destinoId: "valle-sagrado", dificultad: 2, estilos: ["clasico", "relax"], precioDesde: 105, esIcono: true }),
    experiencia({ slug: "valle-sagrado-vip-maras-moray", destinoId: "valle-sagrado", dificultad: 2, estilos: ["clasico", "relax"], precioDesde: 115, esIcono: true }),
    experiencia({ slug: "ruta-culinaria", destinoId: "valle-sagrado", dificultad: 2, estilos: ["relax"], precioDesde: 550 }),
    experiencia({ slug: "espiritu-vivencial", destinoId: "valle-sagrado", dificultad: 2, estilos: ["mistico"], precioDesde: 290 }),
    // Machu Picchu: todas vuelven a Cusco
    experiencia({ slug: "mapi-full-day-tren-turistico", destinoId: "machu-picchu", dificultad: 2, estilos: ["clasico", "relax"], precioDesde: 950, esIcono: true, terminaEnId: "cusco" }),
    experiencia({ slug: "mapi-full-day-tren-local", destinoId: "machu-picchu", dificultad: 2, estilos: ["clasico", "relax"], precioDesde: 350, terminaEnId: "cusco" }),
    experiencia({ slug: "mapi-y-montana-machupicchu", destinoId: "machu-picchu", dificultad: 3, estilos: ["aventura", "clasico"], precioDesde: 1290, esIcono: true, terminaEnId: "cusco" }),
    experiencia({ slug: "mapi-2d-1n-experiencia-total", destinoId: "machu-picchu", dias: 2, dificultad: 2, estilos: ["clasico"], precioDesde: 950, terminaEnId: "cusco" }),
    experiencia({ slug: "camino-inka-tradicional-4d", destinoId: "machu-picchu", dias: 4, dificultad: 3, estilos: ["aventura", "clasico"], precioDesde: 2550, esTrek: true, esIcono: true, mesesCerrados: [2], terminaEnId: "cusco", altitudMaxM: 4215 }),
    experiencia({ slug: "inka-jungle-4d", destinoId: "machu-picchu", dias: 4, dificultad: 3, estilos: ["aventura"], precioDesde: 1000, esTrek: true, terminaEnId: "cusco", altitudMaxM: 4350 }),
    // Inventados para los tests
    // Exigente y barata: compite con Laguna Humantay el día después de Montaña de Colores.
    experiencia({ slug: "ausangate-full-day", destinoId: "cusco", dificultad: 4, estilos: ["aventura"], precioDesde: 100, esIcono: true, altitudMaxM: 4800 }),
    experiencia({ slug: "lima-centro-historico", destinoId: "lima", dificultad: 1, estilos: ["clasico", "relax"], precioDesde: 120, esIcono: true }),
    experiencia({ slug: "lima-gastronomica", destinoId: "lima", dificultad: 1, estilos: ["relax"], precioDesde: 250, alAireLibre: false }),
    experiencia({ slug: "islas-ballestas", destinoId: "paracas", dificultad: 1, estilos: ["clasico", "relax"], precioDesde: 90, esIcono: true }),
    experiencia({ slug: "huacachina-tubulares", destinoId: "paracas", dificultad: 2, estilos: ["aventura"], precioDesde: 120 }),
    experiencia({ slug: "monasterio-santa-catalina", destinoId: "arequipa", dificultad: 1, estilos: ["clasico", "relax"], precioDesde: 80, esIcono: true }),
    experiencia({ slug: "campina-arequipena", destinoId: "arequipa", dificultad: 1, estilos: ["relax"], precioDesde: 70 }),
    experiencia({ slug: "colca-cruz-del-condor", destinoId: "colca", dificultad: 2, estilos: ["clasico", "aventura"], precioDesde: 180, esIcono: true, altitudMaxM: 4900 }),
    experiencia({ slug: "colca-banos-termales", destinoId: "colca", dificultad: 1, estilos: ["relax"], precioDesde: 60 }),
    experiencia({ slug: "uros-taquile", destinoId: "puno", dificultad: 2, estilos: ["clasico", "relax"], precioDesde: 150, esIcono: true }),
    experiencia({ slug: "sillustani", destinoId: "puno", dificultad: 1, estilos: ["clasico", "mistico"], precioDesde: 80 }),
  ],
  traslados: [
    { desdeId: "lima", hastaId: "paracas", modo: "bus", horas: 4, ocupaDia: false },
    { desdeId: "paracas", hastaId: "arequipa", modo: "bus", horas: 12, ocupaDia: true },
    { desdeId: "lima", hastaId: "arequipa", modo: "vuelo", horas: 1.5, ocupaDia: false },
    { desdeId: "arequipa", hastaId: "colca", modo: "bus", horas: 3.5, ocupaDia: false },
    { desdeId: "colca", hastaId: "puno", modo: "bus", horas: 6, ocupaDia: true },
    { desdeId: "arequipa", hastaId: "puno", modo: "bus", horas: 6, ocupaDia: true },
    { desdeId: "puno", hastaId: "cusco", modo: "bus", horas: 7, ocupaDia: true },
    { desdeId: "cusco", hastaId: "puno", modo: "bus", horas: 7, ocupaDia: true },
    { desdeId: "lima", hastaId: "cusco", modo: "vuelo", horas: 1.5, ocupaDia: false },
    { desdeId: "paracas", hastaId: "cusco", modo: "vuelo", horas: 4, ocupaDia: true },
    { desdeId: "arequipa", hastaId: "cusco", modo: "vuelo", horas: 1, ocupaDia: false },
    { desdeId: "cusco", hastaId: "valle-sagrado", modo: "bus", horas: 1.5, ocupaDia: false },
    { desdeId: "valle-sagrado", hastaId: "machu-picchu", modo: "tren", horas: 1.5, ocupaDia: false },
    { desdeId: "cusco", hastaId: "machu-picchu", modo: "tren", horas: 3.5, ocupaDia: false },
  ],
  hoteles: ["lima", "paracas", "arequipa", "colca", "puno", "cusco", "valle-sagrado", "machu-picchu"].flatMap((destinoId): TarifaHotel[] => [
    { destinoId, categoria: "economico", precioNoche: 60 },
    { destinoId, categoria: "estandar", precioNoche: 110 },
    { destinoId, categoria: "superior", precioNoche: 220 },
  ]),
};
