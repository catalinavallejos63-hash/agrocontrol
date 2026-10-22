// Días que faltan para vencer: negativo = ya venció, 0 = vence hoy, null = el lote no tiene fecha válida.
export const diasPara = l => {
  const f = String(l?.fechaVencimiento || "").slice(0, 10);
  if (!f) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(f + "T00:00:00") - hoy) / 864e5);
  return Number.isNaN(d) ? null : d;
};
export const vencido = l => { const d = diasPara(l); return d !== null && d < 0; };
export const porVencer = (l, n = 30) => { const d = diasPara(l); return d !== null && d >= 0 && d <= n; };
export const plural = n => (n === 1 ? "día" : "días");
