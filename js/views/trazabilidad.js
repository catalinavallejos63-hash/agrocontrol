import { listar } from "../services/db.js";
import { esc, badge, table, fecha } from "../ui.js";
const COL = { Aprobado: "g", Rechazado: "r", Observado: "a", Pendiente: "a" };
export async function render(root) {
  const lotes = (await listar("lotes")).sort((a, b) => (b.fechaIngreso || "").localeCompare(a.fechaIngreso || ""));
  if (!lotes.length) { root.innerHTML = `<h1>Trazabilidad de lotes</h1><div class="card"><p class="empty">Todavía no hay lotes. Cada lote se crea al registrar un insumo.</p><p style="text-align:center"><a class="btn" href="#registrar">Registrar producto</a></p></div>`; return; }
  root.innerHTML = `<h1>Trazabilidad de lotes</h1><p style="color:var(--m)">Sigue cada lote desde que ingresa al almacén hasta su evaluación de calidad.</p><input class="search" id="q" placeholder="Buscar lote o insumo..."><div id="t"></div><div id="d" style="margin-top:14px"></div>`;
  let sel = lotes[0].id;
  const tabla = (f = "") => root.querySelector("#t").innerHTML = table(["Lote", "Insumo", "Proveedor", "Ingreso", "Vence", "Cantidad", "Ubicación", "Calidad", ""], lotes.filter(l => ((l.codigo || "") + (l.nombre || "")).toLowerCase().includes(f.toLowerCase())).map(l => [esc(l.codigo), esc(l.nombre), esc(l.proveedor), esc(l.fechaIngreso), esc(l.fechaVencimiento), l.cantidad, esc(l.ubicacion), badge(l.estadoCalidad || "Pendiente", COL[l.estadoCalidad] || "a"), `<button class="mini" data-id="${l.id}">Ver historial</button>`]));
  const detalle = () => {
    const l = lotes.find(x => x.id === sel);
    root.querySelector("#d").innerHTML = l ? `<div class="card" style="padding:16px"><h3>Historial del lote ${esc(l.codigo)} · ${esc(l.nombre)}</h3><div class="tl">${(l.historial || []).map(h => `<div><small>${fecha(h.fecha)}</small><br><b>${esc(h.evento)}</b><br>${esc(h.detalle)}</div>`).join("")}<div><small>Estado actual</small><br><b>${esc(l.estadoCalidad || "Pendiente")}</b> · ${l.cantidad} unidades</div></div></div>` : "";
  };
  tabla(); detalle();
  root.querySelector("#q").oninput = e => tabla(e.target.value);
  root.querySelector("#t").onclick = e => { const b = e.target.closest("button"); if (b) { sel = b.dataset.id; detalle(); root.querySelector("#d").scrollIntoView({ behavior: "smooth" }); } };
}
