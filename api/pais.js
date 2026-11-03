// País y código telefónico de quien abre /cotizar/, por la IP (header de
// geolocalización de Vercel). El paso del WhatsApp arranca con ese código, y
// el formulario manda el ISO al CRM: detrás del rewrite de Vercel, el CRM
// (Cloudflare) ve la IP de Vercel y no la del viajero.
// Tabla copiada de luna-llena-viaje/functions/_lib/telefono.ts.
const PREFIJO_POR_PAIS = {
  AR: '54', BO: '591', BR: '55', CL: '56', CO: '57', CR: '506', CU: '53', DO: '1',
  EC: '593', SV: '503', GT: '502', HN: '504', MX: '52', NI: '505', PA: '507',
  PY: '595', PE: '51', PR: '1', UY: '598', VE: '58',
  US: '1', CA: '1',
  ES: '34', PT: '351', FR: '33', IT: '39', DE: '49', GB: '44', IE: '353', NL: '31',
  BE: '32', CH: '41', AT: '43', SE: '46', NO: '47', DK: '45', FI: '358', PL: '48',
  CZ: '420', GR: '30', RO: '40', HU: '36', RU: '7', UA: '380', TR: '90',
  IL: '972', AE: '971', SA: '966', ZA: '27', EG: '20', MA: '212', NG: '234',
  AU: '61', NZ: '64', JP: '81', KR: '82', CN: '86', IN: '91', ID: '62', PH: '63',
  TH: '66', VN: '84', MY: '60', SG: '65',
};

module.exports = function handler(req, res) {
  const iso = String(req.headers['x-vercel-ip-country'] || '').toUpperCase() || null;
  res.setHeader('cache-control', 'no-store');
  res.status(200).json({ iso, prefijo: iso ? PREFIJO_POR_PAIS[iso] || null : null });
}
