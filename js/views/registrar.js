import { listar, crear, actualizar, increment } from "../services/db.js";
import { categoriasDe, NUEVA } from "../services/categorias.js";
import { esc, toast, imgTag, safeUrl } from "../ui.js";
export async function render(root) {
  const [provsTodos, existentes] = await Promise.all([listar("proveedores"), listar("productos")]);
  const provs = provsTodos.filter(p => p.estado === "Activo");
  const opt = a => a.map(x => `<option>${esc(x)}</option>`).join("");
  root.innerHTML = `<h1>Registrar producto / insumo</h1>${provs.length ? "" : '<p class="err">Primero registra un proveedor activo.</p>'}
  <form class="card grid" id="f">
  <label>Nombre del insumo *<input name="nombre" placeholder="Ej. Urea" required></label><label>Fecha de ingreso *<input type="date" name="fechaIngreso" required></label>
  <label>Categoría *<select name="categoria" id="cat">${opt(categoriasDe(existentes))}<option value="${NUEVA}">➕ Nueva categoría...</option></select></label><label>Fecha de vencimiento *<input type="date" name="fechaVencimiento" required></label>
  <label id="lNueva" class="full" hidden>Nombre de la nueva categoría *<input name="categoriaNueva" id="catNueva" placeholder="Ej. Material de siembra" maxlength="40"></label>
  <label>Proveedor *<select name="proveedor" required>${opt(provs.map(p => p.nombre))}</select></label><label>Cantidad *<input type="number" min="1" name="cantidad" placeholder="Ej. 100" required></label>
  <label>Código del lote *<input name="codigo" placeholder="Ej. FER-2026-001" required></label><label>Ubicación en almacén *<input name="ubicacion" placeholder="Ej. Almacén A-02" required></label>
  <label>Precio de venta (S/) *<input type="number" min="0.01" step="0.01" name="precio" placeholder="Ej. 45.50" required></label><label>Descripción (se muestra al comprador)<input name="descripcion" placeholder="Ej. Fertilizante nitrogenado, saco de 50 kg"></label>
  <label class="full">Imagen referencial (enlace, opcional)<input type="url" name="imagen" id="img" placeholder="https://ejemplo.com/foto-del-producto.jpg"></label>
  <small class="ayuda full">Pega el enlace directo de la imagen (suele terminar en .jpg, .png o .webp). Se mostrará en Productos y en el catálogo del comprador.</small>
  <div class="prev full" id="prev"></div>
  <div class="row full"><a class="btn out" href="#productos">Cancelar</a><button class="btn">Guardar</button></div></form>`;
  const f = root.querySelector("#f"), cat = f.querySelector("#cat"), nueva = f.querySelector("#catNueva");
  cat.onchange = () => { const n = cat.value === NUEVA; f.querySelector("#lNueva").hidden = !n; nueva.required = n; if (n) nueva.focus(); };
  f.querySelector("#img").oninput = e => { const v = e.target.value.trim(); f.querySelector("#prev").innerHTML = safeUrl(v) ? imgTag(v, "foto") : ""; };
  f.onsubmit = async e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f));
    const { imagen = "", categoriaNueva = "", ...lote } = d;
    if (imagen && !safeUrl(imagen)) return toast("El enlace de la imagen debe empezar con http:// o https://", 1);
    if (lote.fechaVencimiento < lote.fechaIngreso) return toast("La fecha de vencimiento no puede ser anterior a la de ingreso", 1);
    if (lote.categoria === NUEVA) lote.categoria = categoriaNueva.trim().replace(/^./, c => c.toUpperCase());
    if (!lote.categoria) return toast("Escribe el nombre de la nueva categoría", 1);
    lote.cantidad = +lote.cantidad; lote.precio = +lote.precio; const ahora = new Date().toISOString(), img = imagen.trim();
    try {
      const ps = await listar("productos"); let p = ps.find(x => x.nombre.toLowerCase() === lote.nombre.toLowerCase());
      if (p) await actualizar("productos", p.id, { stock: increment(lote.cantidad), precio: lote.precio, descripcion: lote.descripcion || p.descripcion || "", ...(img ? { imagen: img } : {}) });
      else { const r = await crear("productos", { codigo: "INS-" + String(ps.length + 1).padStart(3, "0"), nombre: lote.nombre, categoria: lote.categoria, stock: lote.cantidad, precio: lote.precio, descripcion: lote.descripcion, imagen: img }); p = { id: r.id }; }
      await crear("lotes", { ...lote, productoId: p.id, estadoCalidad: "Pendiente", historial: [{ fecha: ahora, evento: "Registro del lote", detalle: "Ingreso de insumo al sistema." }, { fecha: ahora, evento: "Almacenamiento", detalle: "Ubicación: " + lote.ubicacion }] });
      await crear("movimientos", { productoId: p.id, producto: lote.nombre, tipo: "entrada", cantidad: lote.cantidad, lote: lote.codigo, fecha: ahora });
      toast("Producto registrado"); location.hash = "#productos";
    } catch (er) { toast(er.code || er.message, 1); }
  };
}
