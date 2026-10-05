import { listar, borrar, actualizar } from "../services/db.js";
import { categoriasDe } from "../services/categorias.js";
import { vencido } from "../services/vencimiento.js";
import { esc, table, estadoStock, badge, toast, confirmar, formModal, soles, imgTag, safeUrl, filtros, conectarFiltros, norm, unicos } from "../ui.js";
export async function render(root) {
  const [lista, lotes] = await Promise.all([listar("productos"), listar("lotes")]);
  const venc = new Set(lotes.filter(vencido).map(l => l.productoId)); // productos con algún lote vencido
  const campos = [{ k: "nombre", l: "Nombre" }, { k: "categoria", l: "Categoría", type: "select", opts: categoriasDe(lista) }, { k: "precio", l: "Precio de venta (S/)", type: "number", step: "0.01", min: "0.01" }, { k: "imagen", l: "Imagen referencial (enlace https://...)", type: "url", req: false }, { k: "descripcion", l: "Descripción (la ve el comprador)", req: false }];
  root.innerHTML = `<div class="head"><h1>Productos</h1><a class="btn" href="#registrar">Registrar producto</a></div><p style="color:var(--m)">Los compradores solo ven productos con precio y stock disponible.</p>${filtros({ ph: "Buscar producto...", selects: [{ k: "cat", l: "Categoría", opts: unicos(lista.map(p => p.categoria)) }, { k: "est", l: "Estado", opts: ["Disponible", "Stock bajo", "Vencido", "Sin precio"] }] })}<div id="t"></div>`;
  const t = root.querySelector("#t");
  const okEst = (e, p) => !e || (e === "Disponible" ? p.stock >= 10 : e === "Stock bajo" ? p.stock < 10 : e === "Vencido" ? venc.has(p.id) : !p.precio);
  conectarFiltros(root, f => {
    const l = lista.filter(p => norm((p.nombre || "") + (p.codigo || "")).includes(norm(f.q)) && (!f.cat || p.categoria === f.cat) && okEst(f.est, p));
    t.innerHTML = table(["Imagen", "Código", "Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"], l.map(p => [imgTag(p.imagen), esc(p.codigo), esc(p.nombre), esc(p.categoria), p.precio ? soles(p.precio) : '<span class="err">Sin precio</span>', p.stock, estadoStock(p.stock) + (venc.has(p.id) ? " " + badge("Vencido", "r") : ""), `<button class="mini" data-a="e" data-id="${p.id}">Editar</button> <a class="mini" href="#trazabilidad">Ver lotes</a> <button class="mini red" data-a="d" data-id="${p.id}">Eliminar</button>`]));
  });
  t.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const p = lista.find(x => x.id === b.dataset.id);
    try {
      if (b.dataset.a === "e") {
        const d = await formModal("Editar producto", campos, p); if (!d) return;
        if (d.imagen && !safeUrl(d.imagen)) return toast("El enlace de la imagen debe empezar con http:// o https://", 1);
        await actualizar("productos", p.id, { nombre: d.nombre, categoria: d.categoria, precio: +d.precio, imagen: (d.imagen || "").trim(), descripcion: d.descripcion || "" }); toast("Producto actualizado"); render(root);
      } else if (await confirmar("¿Eliminar producto?", "Se quitará del inventario.")) { await borrar("productos", p.id); toast("Producto eliminado"); render(root); }
    } catch (er) { toast(er.code || er.message, 1); }
  };
}
