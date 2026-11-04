// Conexión con el CRM. Por ahora fuera de alcance: la implementación por defecto no hace nada.
// Para conectarlo, implementar CrmSink y devolverla en crmSink().
// Nunca debe hacer fallar al armador: quien la llama atrapa los errores.

import type { Evento, Lead } from "@/lib/leads/tipos";

export interface CrmSink {
  upsertLead(lead: Lead): Promise<void>;
  logEvento(evento: Evento): Promise<void>;
}

export const crmNoop: CrmSink = {
  async upsertLead() {},
  async logEvento() {},
};

export function crmSink(): CrmSink {
  return crmNoop;
}
