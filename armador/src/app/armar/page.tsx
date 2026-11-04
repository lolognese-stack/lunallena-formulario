import { redirect } from "next/navigation";

// El quiz ahora está en la portada (/armador/). Esta ruta queda para los enlaces viejos.
export default function Armar() {
  redirect("/");
}
