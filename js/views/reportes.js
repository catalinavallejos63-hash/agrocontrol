import { listar } from "../services/db.js";
import { descargarCSV } from "../ui.js";
import { diasPara, vencido, porVencer } from "../services/vencimiento.js";
const lote = l => ({ lote: l.codigo, insumo: l.nombre, proveedor: l.proveedor, ingreso: l.fechaIngreso, vencimiento: l.fechaVencimiento, cantidad: l.cantidad, ubicacion: l.ubicacion, calidad: l.estadoCalidad });
const REP = [
  ["Reporte de stock", async () => (await listar("productos")).map(p => ({ codigo: p.codigo, producto: p.nombre, stock: p.stock }))],
  ["Reporte de productos", async () => (await listar("productos")).map(p => ({ codigo: p.codigo, producto: p.nombre, categoria: p.categoria, stock: p.stock }))],
  ["Reporte de lotes", async () => (await listar("lotes")).map(lote)],
  ["Productos próximos a vencer", async () => (await listar("lotes")).filter(l => porVencer(l)).map(lote)],
  ["Productos vencidos", async () => (await listar("lotes")).filter(vencido).map(l => ({ ...lote(l), dias_vencido: -diasPara(l) }))],
  ["Resultados de calidad", async () => (await listar("lotes")).map(l => ({ lote: l.codigo, insumo: l.nombre, resultado: l.estadoCalidad }))],
  ["Movimientos de inventario", async () => (await listar("movimientos")).map(m => ({ fecha: m.fecha, producto: m.producto, tipo: m.tipo, cantidad: m.cantidad, lote: m.lote || "" }))]
];
export async function render(root) {
  root.innerHTML = `<h1>Reportes</h1><div class="rep">${REP.map((r, i) => `<div class="card" data-i="${i}"><b>${r[0]}</b><br><span>Descargar CSV</span></div>`).join("")}</div>`;
  root.querySelector(".rep").onclick = async e => { const c = e.target.closest("[data-i]"); if (c) { const r = REP[c.dataset.i]; descargarCSV(r[0].toLowerCase().replace(/\s+/g, "-"), await r[1]()); } };
}
