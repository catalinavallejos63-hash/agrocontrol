import { listar } from "../services/db.js";
import { agregar } from "../services/carrito.js";
import { esc, estadoStock, toast, info, soles, imgTag, filtros, conectarFiltros, norm, unicos } from "../ui.js";
export async function render(root, yo) {
  const lista = (await listar("productos")).filter(p => p.stock > 0 && p.precio > 0);
  root.innerHTML = `<div class="head"><h1>Catálogo de insumos</h1><a class="btn" href="#carrito">Ver carrito</a></div>${filtros({ ph: "Buscar producto...", selects: [{ k: "cat", l: "Categoría", opts: unicos(lista.map(p => p.categoria)) }, { k: "est", l: "Disponibilidad", opts: ["Disponible", "Stock bajo"] }] })}<div id="t" class="prods"></div>`;
  const t = root.querySelector("#t");
  conectarFiltros(root, f => {
    const l = lista.filter(p => norm((p.nombre || "") + (p.codigo || "") + (p.categoria || "")).includes(norm(f.q)) && (!f.cat || p.categoria === f.cat) && (!f.est || (f.est === "Stock bajo") === (p.stock < 10)));
    t.innerHTML = l.length ? l.map(p => `<div class="card prod">${imgTag(p.imagen, "foto")}<small>${esc(p.categoria)} · ${esc(p.codigo)}</small><h3>${esc(p.nombre)}</h3><div class="precio">${soles(p.precio)}</div><div>${estadoStock(p.stock)} <small>${p.stock} disponibles</small></div><div class="row" style="justify-content:flex-start;margin-top:12px"><button class="mini" data-a="d" data-id="${p.id}">Detalles</button><button class="btn" data-a="c" data-id="${p.id}" style="padding:6px 12px">Agregar al carrito</button></div></div>`).join("") : '<p class="empty">No hay productos disponibles con esos filtros.</p>';
  });
  const add = p => agregar(yo.uid, p) ? toast(`${p.nombre} agregado al carrito`) : toast("No hay más stock disponible de este producto", 1);
  t.onclick = e => {
    const b = e.target.closest("button"); if (!b) return; const p = lista.find(x => x.id === b.dataset.id);
    if (b.dataset.a === "c") return add(p);
    info(p.nombre, `${imgTag(p.imagen, "foto")}<p>${esc(p.descripcion || "Sin descripción.")}</p><p><b>Categoría:</b> ${esc(p.categoria)}<br><b>Código:</b> ${esc(p.codigo)}<br><b>Precio:</b> ${soles(p.precio)}<br><b>Disponible:</b> ${p.stock} unidades</p>`, "Agregar al carrito", () => add(p));
  };
}
