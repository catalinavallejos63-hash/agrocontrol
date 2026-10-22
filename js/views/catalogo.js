import { listar } from "../services/db.js";
import { agregar, leer } from "../services/carrito.js";
import { esc, estadoStock, toast, toastCentro, info, soles, imgTag, filtros, conectarFiltros, norm, unicos } from "../ui.js";
export async function render(root, yo) {
  const lista = (await listar("productos")).filter(p => p.stock > 0 && p.precio > 0);
  root.innerHTML = `<div class="head"><h1>Catálogo de insumos</h1><a class="btn" href="#carrito">Ver carrito</a></div>${filtros({ ph: "Buscar producto...", selects: [{ k: "cat", l: "Categoría", opts: unicos(lista.map(p => p.categoria)) }, { k: "est", l: "Disponibilidad", opts: ["Disponible", "Stock bajo"] }] })}<div id="t" class="prods"></div>`;
  const t = root.querySelector("#t"), cant = new Map(); // cantidad elegida por producto (se conserva al filtrar)
  const q = id => cant.get(id) || 0;
  const enCarrito = p => (leer(yo.uid).find(i => i.productoId === p.id) || { cantidad: 0 }).cantidad;
  conectarFiltros(root, f => {
    const l = lista.filter(p => norm((p.nombre || "") + (p.codigo || "") + (p.categoria || "")).includes(norm(f.q)) && (!f.cat || p.categoria === f.cat) && (!f.est || (f.est === "Stock bajo") === (p.stock < 10)));
    t.innerHTML = l.length ? l.map(p => `<div class="card prod">${imgTag(p.imagen, "foto")}<small>${esc(p.categoria)} · ${esc(p.codigo)}</small><h3>${esc(p.nombre)}</h3><div class="precio-fila"><div class="precio">${soles(p.precio)}</div><span class="qty sel" data-id="${p.id}"><button type="button" class="mini" data-a="-" data-id="${p.id}" aria-label="Menos">−</button><b data-n>${q(p.id)}</b><button type="button" class="mini" data-a="+" data-id="${p.id}" aria-label="Más">+</button></span></div><div>${estadoStock(p.stock)} <small>${p.stock} disponibles</small></div><div class="row" style="justify-content:flex-start;margin-top:12px"><button class="mini" data-a="d" data-id="${p.id}">Detalles</button><button class="btn" data-a="c" data-id="${p.id}" style="padding:6px 12px">Agregar al carrito</button></div></div>`).join("") : '<p class="empty">No hay productos disponibles con esos filtros.</p>';
  });
  const add = p => {
    const n = q(p.id), libres = p.stock - enCarrito(p);
    if (n < 1) return toast("Elige la cantidad con el signo + antes de agregar", 1);
    if (libres <= 0) return toast("Ya tienes todo el stock disponible de este producto en tu carrito", 1);
    if (n > libres) return toast(`Solo puedes agregar ${libres} más de este producto`, 1);
    if (!agregar(yo.uid, p, n)) return toast("No hay más stock disponible de este producto", 1);
    toastCentro("Producto añadido al carrito correctamente"); cant.delete(p.id);
    const b = t.querySelector(`.sel[data-id="${p.id}"] [data-n]`); if (b) b.textContent = 0;
  };
  t.onclick = e => {
    const b = e.target.closest("button"); if (!b) return; const p = lista.find(x => x.id === b.dataset.id);
    if (b.dataset.a === "+" || b.dataset.a === "-") {
      const n = q(p.id) + (b.dataset.a === "+" ? 1 : -1);
      if (n < 0) return;
      if (n > p.stock - enCarrito(p)) return toast("No hay más stock disponible de este producto", 1);
      cant.set(p.id, n); b.parentElement.querySelector("[data-n]").textContent = n; return;
    }
    if (b.dataset.a === "c") return add(p);
    info(p.nombre, `${imgTag(p.imagen, "foto")}<p>${esc(p.descripcion || "Sin descripción.")}</p><p><b>Categoría:</b> ${esc(p.categoria)}<br><b>Código:</b> ${esc(p.codigo)}<br><b>Precio:</b> ${soles(p.precio)}<br><b>Disponible:</b> ${p.stock} unidades</p>`, "Agregar al carrito", () => add(p));
  };
}
