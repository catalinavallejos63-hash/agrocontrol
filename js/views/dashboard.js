import { listar } from "../services/db.js";
import { diasPara, vencido, porVencer, plural } from "../services/vencimiento.js";
import { esc, badge, filtros, conectarFiltros, norm } from "../ui.js";
const TIPOS = { Vencidos: "r", "Próximos a vencer": "a", "Stock bajo": "r", Rechazados: "r" };
export async function render(root) {
  const [pr, lo] = await Promise.all([listar("productos"), listar("lotes")]);
  const cnt = e => lo.filter(l => l.estadoCalidad === e).length;
  const ven = lo.filter(vencido), prox = lo.filter(l => porVencer(l)), bajo = pr.filter(p => p.stock < 10), rech = lo.filter(l => l.estadoCalidad === "Rechazado");
  const k = [["Total de insumos", pr.length], ["Total de lotes", lo.length], ["Lotes aprobados", cnt("Aprobado"), "g"], ["Lotes rechazados", cnt("Rechazado"), "r"], ["Vencidos", ven.length, "r"], ["Próximos a vencer", prox.length, "a"], ["Stock bajo", bajo.length, "r"]];
  const max = Math.max(1, cnt("Aprobado"), cnt("Rechazado"), cnt("Observado"));
  const barra = (l, n, c) => `<div class="bar"><b>${n}</b><i class="${c}" style="height:${n / max * 150 + 4}px"></i><span>${l}</span></div>`;
  const al = [
    ...ven.map(l => { const d = -diasPara(l); return ["Vencidos", `Lote ${l.codigo} (${l.nombre}) venció hace ${d} ${plural(d)}`]; }),
    ...prox.map(l => { const d = diasPara(l); return ["Próximos a vencer", `Lote ${l.codigo} (${l.nombre}) ${d === 0 ? "vence hoy" : `vence en ${d} ${plural(d)}`}`]; }),
    ...bajo.map(p => ["Stock bajo", `Stock bajo en ${p.nombre} (${p.stock} unidades)`]),
    ...rech.map(l => ["Rechazados", `Lote ${l.codigo} rechazado`])
  ];
  root.innerHTML = `<h1>Panel principal</h1><div class="kpis">${k.map(([l, v, c]) => `<div class="card kpi"><small>${l}</small><strong class="${c || ""}">${v}</strong></div>`).join("")}</div>
  <div class="two"><div class="card"><h3>Lotes por estado</h3><div class="bars">${barra("Aprobado", cnt("Aprobado"), "g")}${barra("Rechazado", cnt("Rechazado"), "r")}${barra("Observado", cnt("Observado"), "a")}</div></div>
  <div class="card"><h3>Alertas recientes</h3>${filtros({ ph: "Buscar alerta...", selects: [{ k: "tipo", l: "Tipo", opts: Object.keys(TIPOS) }] })}<div id="al"></div></div></div>`;
  const cont = root.querySelector("#al");
  conectarFiltros(root, f => {
    const l = al.filter(([t, x]) => (!f.tipo || t === f.tipo) && norm(x).includes(norm(f.q)));
    cont.innerHTML = l.length ? l.map(([t, x]) => `<p class="alert">${badge(t, TIPOS[t])}${esc(x)}</p>`).join("") : `<p class="empty">${al.length ? "Sin resultados" : "Sin alertas"}</p>`;
  });
}
