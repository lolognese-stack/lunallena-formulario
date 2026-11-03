# lunallena-formulario

Sitio de Luna Llena Travel en Vercel: **lunallenatravel.vercel.app**
(proyecto `lunallenatravel`, cuenta lolognese-stack). Páginas estáticas,
sin build: Vercel publica la carpeta tal cual.

- **`main` publica a producción.** Cada push a `main` sale en vivo. Para
  probar, usar otra rama: Vercel arma una vista previa sin tocar producción.
- `cotizar/` es el formulario "Cuéntanos sobre tu viaje". Manda el lead a
  `/api/cotizar-web/` y el avance paso a paso a `/api/evento-form/`.
- `assets/ll-t.js` registra las visitas en `/api/evento-web/`.
- `vercel.json` reenvía esas rutas al CRM (`crm-plantilla.pages.dev`, repo
  `lolognese-stack/general`). `api/pais.js` es la única función de Vercel.
- Todo se ve en el CRM: secciones Web y Formulario.

Si producción se rompe: Vercel → Deployments → el último deploy bueno →
⋯ → Promote to Production.
