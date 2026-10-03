import { listar, borrar, actualizar } from "../services/db.js";
import { esc, table, estadoStock, toast, confirmar, formModal, soles } from "../ui.js";
const CATS = ["Semillas", "Fertilizantes", "Plaguicidas", "Herramientas", "Otros"];
const campos = [{ k: "nombre", l: "Nombre" }, { k: "categoria", l: "Categoría", type: "select", opts: CATS }, { k: "precio", l: "Precio de venta (S/)", type: "number", step: "0.01", min: "0.01" }, { k: "descripcion", l: "Descripción (la ve el comprador)", req: false }];
export async function render(root) {
  const lista = await listar("productos");
  root.innerHTML = `<div class="head"><h1>Productos</h1><a class="btn" href="#registrar">Registrar producto</a></div><p style="color:var(--m)">Los compradores solo ven productos con precio y stock disponible.</p><input class="search" id="q" placeholder="Buscar producto..."><div id="t"></div>`;
  const t = root.querySelector("#t");
  const pintar = (f = "") => t.innerHTML = table(["Código", "Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"], lista.filter(p => (p.nombre + p.codigo).toLowerCase().includes(f.toLowerCase())).map(p => [esc(p.codigo), esc(p.nombre), esc(p.categoria), p.precio ? soles(p.precio) : '<span class="err">Sin precio</span>', p.stock, estadoStock(p.stock), `<button class="mini" data-a="e" data-id="${p.id}">Editar</button> <a class="mini" href="#trazabilidad">Ver lotes</a> <button class="mini red" data-a="d" data-id="${p.id}">Eliminar</button>`]));
  pintar();
  root.querySelector("#q").oninput = e => pintar(e.target.value);
  t.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const p = lista.find(x => x.id === b.dataset.id);
    try {
      if (b.dataset.a === "e") { const d = await formModal("Editar producto", campos, p); if (d) { await actualizar("productos", p.id, { nombre: d.nombre, categoria: d.categoria, precio: +d.precio, descripcion: d.descripcion || "" }); toast("Producto actualizado"); render(root); } }
      else if (await confirmar("¿Eliminar producto?", "Se quitará del inventario.")) { await borrar("productos", p.id); toast("Producto eliminado"); render(root); }
    } catch (er) { toast(er.code || er.message, 1); }
  };
}
