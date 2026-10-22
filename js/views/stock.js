import { listar, crear, actualizar, increment } from "../services/db.js";
import { esc, table, estadoStock, badge, toast, filtros, conectarFiltros, norm, unicos } from "../ui.js";
export async function render(root) {
  const [ps, mv] = await Promise.all([listar("productos"), listar("movimientos")]);
  const sum = (id, t) => mv.filter(m => m.productoId === id && m.tipo === t).reduce((a, m) => a + m.cantidad, 0);
  const bajo = ps.filter(p => p.stock < 10);
  root.innerHTML = `<h1>Control de stock</h1>${filtros({ ph: "Buscar producto o código...", selects: [{ k: "cat", l: "Categoría", opts: unicos(ps.map(p => p.categoria)) }, { k: "est", l: "Estado", opts: ["Disponible", "Stock bajo"] }] })}<div id="t"></div>
  <div class="card" style="margin-top:14px"><div class="head"><h3>Productos con stock bajo</h3><a href="#productos">Ver todos</a></div>${bajo.length ? bajo.map(p => badge(`${p.nombre} (${p.stock})`, "r")).join(" ") : '<span class="empty">Sin productos con stock bajo</span>'}</div>`;
  const t = root.querySelector("#t");
  conectarFiltros(root, f => {
    const l = ps.filter(p => norm((p.nombre || "") + (p.codigo || "")).includes(norm(f.q)) && (!f.cat || p.categoria === f.cat) && (!f.est || (f.est === "Stock bajo") === (p.stock < 10)));
    t.innerHTML = table(["Código", "Producto", "Stock actual", "Entradas", "Salidas", "Estado", "Acciones"], l.map(p => [esc(p.codigo), esc(p.nombre), p.stock, sum(p.id, "entrada"), sum(p.id, "salida"), estadoStock(p.stock), `<button class="mini" data-id="${p.id}">Registrar salida</button>`]));
  });
  t.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const p = ps.find(x => x.id === b.dataset.id);
    const n = +prompt(`Cantidad a retirar de ${p.nombre} (disponible: ${p.stock}):`);
    if (!(n > 0 && n <= p.stock)) return toast("Cantidad inválida", 1);
    await actualizar("productos", p.id, { stock: increment(-n) });
    await crear("movimientos", { productoId: p.id, producto: p.nombre, tipo: "salida", cantidad: n, fecha: new Date().toISOString() });
    toast("Salida registrada"); render(root);
  };
}
