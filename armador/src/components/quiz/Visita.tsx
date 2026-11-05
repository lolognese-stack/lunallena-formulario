"use client";

import { useEffect } from "react";
import { BASE } from "@/lib/contacto";

/**
 * Score vivo: si la página se abrió desde un link del mail (?l=<leadId>), avisa la visita.
 * El servidor suma +10 una vez por día. Después saca el parámetro de la URL, así un link
 * compartido no cuenta como visita del lead.
 */
export function Visita() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const lead = url.searchParams.get("l");
    if (!lead || !/^[0-9a-f-]{36}$/i.test(lead)) return;
    fetch(`${BASE}/api/lead/${lead}/visita/`, { method: "POST", keepalive: true }).catch(() => {});
    url.searchParams.delete("l");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, []);
  return null;
}
