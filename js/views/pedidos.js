import { listar, obtener, actualizar, crear, increment } from "../services/db.js";
import { ETQ, COLOR, METODOS, itemsDe } from "../services/negocio.js";
import { esc, badge, table, toast, confirmar, fecha, soles, filtros, conectarFiltros, norm } from "../ui.js";
const SIG = { Pendiente: ["Confirmado", "Confirmar pago"], Confirmado: ["En preparación", "A preparación"], "En preparación": ["Entregado", "Marcar entregado"] };
export async function render(root) {
  const ps = (await listar("pedidos")).sort((a, b) => b.fecha.localeCompare(a.fecha));
  root.innerHTML = `<h1>Pedidos de clientes</h1>${filtros({ ph: "Buscar por cliente o producto...", selects: [{ k: "est", l: "Estado", opts: Object.keys(ETQ) }, { k: "pago", l: "Método de pago", opts: METODOS }] })}<div id="t"></div>`;
  const t = root.querySelector("#t");
  conectarFiltros(root, f => {
    const l = ps.filter(p => norm((p.nombre || "") + " " + itemsDe(p).map(i => i.producto).join(" ")).includes(norm(f.q)) && (!f.est || p.estado === f.est) && (!f.pago || p.metodoPago === f.pago));
    t.innerHTML = table(["Fecha", "Cliente", "Pedido", "Total", "Pago", "Estado", "Acciones"], l.map(p => [fecha(p.fecha), `${esc(p.nombre)}<br><small>${esc(p.telefono || "")} · ${esc(p.direccion || "")}</small>`, itemsDe(p).map(i => `${i.cantidad} × ${esc(i.producto)}`).join("<br>"), soles(p.total), `${esc(p.metodoPago || "—")}<br><small>${esc(p.canal || "")}</small>`, badge(ETQ[p.estado] || p.estado, COLOR[p.estado] || "a"), SIG[p.estado] ? `<button class="mini" data-a="s" data-id="${p.id}">${SIG[p.estado][1]}</button>${p.estado === "Pendiente" ? ` <button class="mini red" data-a="r" data-id="${p.id}">Rechazar</button>` : ""}` : ""]));
  });
  t.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const p = ps.find(x => x.id === b.dataset.id), ahora = new Date().toISOString();
    const hist = est => [...(p.historial || []), { estado: est, fecha: ahora }];
    try {
      if (b.dataset.a === "r") {
        if (await confirmar("¿Rechazar pedido?", `Pedido de ${p.nombre}`)) { await actualizar("pedidos", p.id, { estado: "Rechazado", historial: hist("Rechazado") }); toast("Pedido rechazado"); render(root); }
        return;
      }
      const sig = SIG[p.estado][0];
      if (sig !== "Confirmado") { await actualizar("pedidos", p.id, { estado: sig, historial: hist(sig) }); toast("Pedido actualizado"); return render(root); }
      // Al confirmar: se verifica stock y se recalculan los precios con los del sistema (el comprador no puede alterarlos).
      const its = itemsDe(p), prods = await Promise.all(its.map(i => obtener("productos", i.productoId)));
      for (let k = 0; k < its.length; k++) if (!prods[k] || prods[k].stock < its[k].cantidad) return toast(`Stock insuficiente de ${its[k].producto}`, 1);
      const nuevos = its.map((i, k) => ({ ...i, precio: prods[k].precio ?? i.precio })), total = nuevos.reduce((a, i) => a + i.precio * i.cantidad, 0);
      if (!(await confirmar("¿Confirmar pago y pedido?", `Total ${soles(total)}. Se descontará el stock de los productos.`))) return;
      for (const i of nuevos) {
        await actualizar("productos", i.productoId, { stock: increment(-i.cantidad) });
        await crear("movimientos", { productoId: i.productoId, producto: i.producto, tipo: "salida", cantidad: i.cantidad, fecha: ahora });
      }
      await actualizar("pedidos", p.id, { estado: "Confirmado", items: nuevos, total, historial: hist("Confirmado") });
      toast("Pedido confirmado"); render(root);
    } catch (er) { toast(er.code || er.message, 1); }
  };
}
