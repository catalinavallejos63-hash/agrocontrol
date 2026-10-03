import { listar } from "../services/db.js";
import { esc } from "../ui.js";
export async function render(root) {
  const [pr, lo] = await Promise.all([listar("productos"), listar("lotes")]);
  const dias = l => Math.ceil((new Date(l.fechaVencimiento) - Date.now()) / 864e5);
  const cnt = e => lo.filter(l => l.estadoCalidad === e).length;
  const prox = lo.filter(l => l.fechaVencimiento && dias(l) >= 0 && dias(l) <= 30), bajo = pr.filter(p => p.stock < 10);
  const k = [["Total de insumos", pr.length], ["Total de lotes", lo.length], ["Lotes aprobados", cnt("Aprobado"), "g"], ["Lotes rechazados", cnt("Rechazado"), "r"], ["Próximos a vencer", prox.length, "a"], ["Stock bajo", bajo.length, "r"]];
  const max = Math.max(1, cnt("Aprobado"), cnt("Rechazado"), cnt("Observado"));
  const barra = (l, n, c) => `<div class="bar"><b>${n}</b><i class="${c}" style="height:${n / max * 150 + 4}px"></i><span>${l}</span></div>`;
  const al = [...prox.map(l => `Lote ${l.codigo} vence en ${dias(l)} días`), ...bajo.map(p => `Stock bajo en ${p.nombre} (${p.stock} unidades)`), ...lo.filter(l => l.estadoCalidad === "Rechazado").map(l => `Lote ${l.codigo} rechazado`)];
  root.innerHTML = `<h1>Panel principal</h1><div class="kpis">${k.map(([l, v, c]) => `<div class="card kpi"><small>${l}</small><strong class="${c || ""}">${v}</strong></div>`).join("")}</div>
  <div class="two"><div class="card"><h3>Lotes por estado</h3><div class="bars">${barra("Aprobado", cnt("Aprobado"), "g")}${barra("Rechazado", cnt("Rechazado"), "r")}${barra("Observado", cnt("Observado"), "a")}</div></div>
  <div class="card"><h3>Alertas recientes</h3>${al.length ? al.map(a => `<p class="alert">${esc(a)}</p>`).join("") : '<p class="empty">Sin alertas</p>'}</div></div>`;
}
