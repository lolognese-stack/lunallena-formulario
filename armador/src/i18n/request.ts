import { getRequestConfig } from "next-intl/server";

// v1 solo en español. Para sumar EN/FR: agregar messages/en.json y messages/fr.json
// y elegir el idioma aquí (cookie o prefijo de ruta).
export const idiomas = ["es"] as const;
export const idiomaPorDefecto = "es";

export default getRequestConfig(async () => {
  const locale = idiomaPorDefecto;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
