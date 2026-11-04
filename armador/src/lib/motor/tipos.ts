// Tipos del motor de armado. Son independientes de Supabase: la capa de datos
// convierte las filas de la base a estos tipos antes de llamar a buildItinerary.

export type Estilo = "clasico" | "aventura" | "mistico" | "relax";
export type CategoriaHotel = "economico" | "estandar" | "superior";
export type Duracion = "medio_dia" | "dia" | "varios_dias";
export type ModoTraslado = "bus" | "tren" | "vuelo";

export interface Destino {
  id: string;
  slug: string;
  nombre: string;
  altitudM: number;
  nochesMinimas: number;
  ordenRuta: number;
  esNucleo: boolean;
  /** Solo para la interfaz; el motor no la usa. */
  imagenUrl?: string | null;
}

export interface Experiencia {
  id: string;
  slug: string;
  nombre: string;
  destinoId: string;
  duracion: Duracion;
  dias: number;
  dificultad: number; // 1–5
  altitudMaxM: number | null;
  estilos: Estilo[];
  precioDesde: number; // soles, por persona
  mesesCerrados: number[]; // 1–12
  terminaEnId: string | null; // null = termina en su propio destino
  esTrek: boolean;
  esIcono: boolean;
  alAireLibre: boolean;
  imagenUrl: string | null;
}

export interface Traslado {
  desdeId: string;
  hastaId: string;
  modo: ModoTraslado;
  horas: number;
  ocupaDia: boolean;
}

export interface TarifaHotel {
  destinoId: string;
  categoria: CategoriaHotel;
  precioNoche: number; // soles, por persona
}

export interface Catalogo {
  destinos: Destino[];
  experiencias: Experiencia[];
  traslados: Traslado[];
  hoteles: TarifaHotel[];
}

/** Respuestas del flujo B (ya validadas: días 3–15, mes 1–12, viajeros ≥ 1). */
export interface Respuestas {
  dias: number;
  mes: number;
  destinos: string[]; // ids de destino
  estilo: Estilo;
  viajeros: number;
  hotel: CategoriaHotel;
}

/**
 * Día que cargó el cliente (flujo A o combinado). Con experiencia, texto o `libre`, queda
 * bloqueado tal cual. Con solo el destino, el destino queda fijo y el motor elige qué hacer.
 * Una experiencia de varios días ocupa también los días siguientes.
 */
export interface DiaFijo {
  dia: number; // 1 = primer día del viaje
  destinoId: string;
  experienciaId?: string;
  textoLibre?: string;
  libre?: boolean;
}

export type CodigoPorQue =
  | "fijo"
  | "traslado"
  | "continuacion"
  | "libre"
  | "libre_aclimatacion"
  | "aclimatacion_llegada"
  | "aclimatacion"
  | "trek_aclimatado"
  | "icono"
  | "estilo"
  | "recomendado";

export type CodigoAviso =
  | "base_agregada"
  | "destino_quitado"
  | "aclimatacion"
  | "lluvias"
  | "sin_traslado"
  | "precio_hotel_pendiente"
  | "precio_parcial"
  | "dia_fijo_invalido"
  | "fijo_cerrado";

/** Texto traducible: el código apunta a messages/*.json → motor.porQue / motor.avisos. */
export interface Mensaje<C extends string> {
  codigo: C;
  params: Record<string, string | number>;
}

export type TipoDia = "experiencia" | "continuacion" | "traslado" | "libre" | "texto_libre";

export interface DiaItinerario {
  numero: number;
  /** Dónde está el viajero ese día (en un traslado, el destino de llegada). */
  destinoId: string;
  tipo: TipoDia;
  experienciaId: string | null;
  textoLibre: string | null;
  traslado: { desdeId: string; hastaId: string; modo: ModoTraslado | null; horas: number | null } | null;
  fijo: boolean;
  porQue: Mensaje<CodigoPorQue>;
  /** Hasta 3 experiencias compatibles con la misma duración, para el botón "Cambiar". */
  alternativas: string[];
}

export interface Itinerario {
  dias: DiaItinerario[];
  /** Destinos en el orden en que se visitan. */
  ruta: string[];
  avisos: Mensaje<CodigoAviso>[];
  precio: {
    porPersona: number; // redondeado hacia arriba a S/ 50
    total: number; // porPersona × viajeros
    experiencias: number; // por persona, sin redondear
    hoteles: number; // por persona, sin redondear
  };
}
