// Formatos de presentación compartidos.
export const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 });

/** "Cusco, Valle Sagrado y Machu Picchu" */
export function listaNatural(items: string[], y: string) {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")}${y}${items.at(-1)}`;
}
