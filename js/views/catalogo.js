import { listar } from "../services/db.js";
import { agregar } from "../services/carrito.js";
import { esc, estadoStock, toast, info, soles } from "../ui.js";
export async function render(root, yo) {
  const lista = (await listar("productos")).filter(p => p.stock > 0 && p.precio > 0);
  root.innerHTML = `<div class="head"><h1>Catálogo de insumos</h1><a class="btn" href="#carrito">Ver carrito</a></div><input class="search" id="q" placeholder="Buscar producto..."><div id="t" class="prods"></div>`;
  const t = root.querySelector("#t");
  const pintar = (f = "") => {
    const l = lista.filter(p => (p.nombre + p.codigo + (p.categoria || "")).toLowerCase().includes(f.toLowerCase()));
    t.innerHTML = l.length ? l.map(p => `<div class="card prod"><small>${esc(p.categoria)} · ${esc(p.codigo)}</small><h3>${esc(p.nombre)}</h3><div class="precio">${soles(p.precio)}</div><div>${estadoStock(p.stock)} <small>${p.stock} disponibles</small></div><div class="row" style="justify-content:flex-start;margin-top:12px"><button class="mini" data-a="d" data-id="${p.id}">Detalles</button><button class="btn" data-a="c" data-id="${p.id}" style="padding:6px 12px">Agregar al carrito</button></div></div>`).join("") : '<p class="empty">No hay productos disponibles por ahora.</p>';
  };
  pintar();
  const add = p => agregar(yo.uid, p) ? toast(`${p.nombre} agregado al carrito`) : toast("No hay más stock disponible de este producto", 1);
  root.querySelector("#q").oninput = e => pintar(e.target.value);
  t.onclick = e => {
    const b = e.target.closest("button"); if (!b) return; const p = lista.find(x => x.id === b.dataset.id);
    if (b.dataset.a === "c") return add(p);
    info(p.nombre, `<p>${esc(p.descripcion || "Sin descripción.")}</p><p><b>Categoría:</b> ${esc(p.categoria)}<br><b>Código:</b> ${esc(p.codigo)}<br><b>Precio:</b> ${soles(p.precio)}<br><b>Disponible:</b> ${p.stock} unidades</p>`, "Agregar al carrito", () => add(p));
  };
}
