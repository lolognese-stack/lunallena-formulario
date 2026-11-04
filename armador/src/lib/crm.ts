import "server-only";
import { CRM_ARMADOR } from "@/lib/contacto";

/** Manda el lead o un evento al CRM (functions/api/armador.js). Nunca hace fallar al armador. */
export async function avisarCrm(cuerpo: Record<string, unknown>) {
  try {
    const res = await fetch(CRM_ARMADOR, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (!res.ok) console.error(`CRM ${res.status}: ${await res.text().catch(() => "")}`);
  } catch (e) {
    console.error("CRM:", e);
  }
}
