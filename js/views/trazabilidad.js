import { listar } from "../services/db.js";
import { vencido } from "../services/vencimiento.js";
import { esc, badge, table, fecha, filtros, conectarFiltros, norm, unicos } from "../ui.js";
const COL = { Aprobado: "g", Rechazado: "r", Observado: "a", Pendiente: "a" };
export async function render(root) {
  const lotes = (await listar("lotes")).sort((a, b) => (b.fechaIngreso || "").localeCompare(a.fechaIngreso || ""));
  if (!lotes.length) { root.innerHTML = `<h1>Trazabilidad de lotes</h1><div class="card"><p class="empty">Todavía no hay lotes. Cada lote se crea al registrar un insumo.</p><p style="text-align:center"><a class="btn" href="#registrar">Registrar producto</a></p></div>`; return; }
  root.innerHTML = `<h1>Trazabilidad de lotes</h1><p style="color:var(--m)">Sigue cada lote desde que ingresa al almacén hasta su evaluación de calidad.</p>${filtros({ ph: "Buscar lote por código, producto o proveedor...", selects: [{ k: "prod", l: "Producto", opts: unicos(lotes.map(l => l.nombre)) }, { k: "prov", l: "Proveedor", opts: unicos(lotes.map(l => l.proveedor)) }, { k: "est", l: "Estado", opts: ["Pendiente", "Aprobado", "Observado", "Rechazado", "Vencido"] }] })}<div id="t"></div><div id="d" style="margin-top:14px"></div>`;
  let sel = lotes[0].id;
  const okEst = (e, l) => !e || (e === "Vencido" ? vencido(l) : (l.estadoCalidad || "Pendiente") === e);
  const detalle = () => {
    const l = lotes.find(x => x.id === sel);
    root.querySelector("#d").innerHTML = l ? `<div class="card" style="padding:16px"><h3>Historial del lote ${esc(l.codigo)} · ${esc(l.nombre)}</h3><div class="tl">${(l.historial || []).map(h => `<div><small>${fecha(h.fecha)}</small><br><b>${esc(h.evento)}</b><br>${esc(h.detalle)}</div>`).join("")}<div><small>Estado actual</small><br><b>${esc(l.estadoCalidad || "Pendiente")}</b> · ${l.cantidad} unidades</div></div></div>` : "";
  };
  conectarFiltros(root, f => {
    const l = lotes.filter(x => norm((x.codigo || "") + (x.nombre || "") + (x.proveedor || "")).includes(norm(f.q)) && (!f.prod || x.nombre === f.prod) && (!f.prov || x.proveedor === f.prov) && okEst(f.est, x));
    root.querySelector("#t").innerHTML = table(["Lote", "Insumo", "Proveedor", "Ingreso", "Vence", "Cantidad", "Ubicación", "Calidad", ""], l.map(x => [esc(x.codigo), esc(x.nombre), esc(x.proveedor), esc(x.fechaIngreso), esc(x.fechaVencimiento) + (vencido(x) ? " " + badge("Vencido", "r") : ""), x.cantidad, esc(x.ubicacion), badge(x.estadoCalidad || "Pendiente", COL[x.estadoCalidad] || "a"), `<button class="mini" data-id="${x.id}">Ver historial</button>`]));
  });
  detalle();
  root.querySelector("#t").onclick = e => { const b = e.target.closest("button"); if (b) { sel = b.dataset.id; detalle(); root.querySelector("#d").scrollIntoView({ behavior: "smooth" }); } };
}
