import { listar, crear, actualizar, increment } from "../services/db.js";
import { esc, toast } from "../ui.js";
const CATS = ["Semillas", "Fertilizantes", "Plaguicidas", "Herramientas", "Otros"];
export async function render(root) {
  const provs = (await listar("proveedores")).filter(p => p.estado === "Activo");
  const opt = a => a.map(x => `<option>${esc(x)}</option>`).join("");
  root.innerHTML = `<h1>Registrar producto / insumo</h1>${provs.length ? "" : '<p class="err">Primero registra un proveedor activo.</p>'}
  <form class="card grid" id="f">
  <label>Nombre del insumo *<input name="nombre" placeholder="Ej. Urea" required></label><label>Fecha de ingreso *<input type="date" name="fechaIngreso" required></label>
  <label>Categoría *<select name="categoria">${opt(CATS)}</select></label><label>Fecha de vencimiento *<input type="date" name="fechaVencimiento" required></label>
  <label>Proveedor *<select name="proveedor" required>${opt(provs.map(p => p.nombre))}</select></label><label>Cantidad *<input type="number" min="1" name="cantidad" placeholder="Ej. 100" required></label>
  <label>Código del lote *<input name="codigo" placeholder="Ej. FER-2026-001" required></label><label>Ubicación en almacén *<input name="ubicacion" placeholder="Ej. Almacén A-02" required></label>
  <label>Precio de venta (S/) *<input type="number" min="0.01" step="0.01" name="precio" placeholder="Ej. 45.50" required></label><label>Descripción (se muestra al comprador)<input name="descripcion" placeholder="Ej. Fertilizante nitrogenado, saco de 50 kg"></label>
  <div class="row full"><a class="btn out" href="#productos">Cancelar</a><button class="btn">Guardar</button></div></form>`;
  root.querySelector("#f").onsubmit = async e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.cantidad = +d.cantidad; d.precio = +d.precio; const ahora = new Date().toISOString();
    const ps = await listar("productos"); let p = ps.find(x => x.nombre.toLowerCase() === d.nombre.toLowerCase());
    if (p) await actualizar("productos", p.id, { stock: increment(d.cantidad), precio: d.precio, descripcion: d.descripcion || p.descripcion || "" });
    else { const r = await crear("productos", { codigo: "INS-" + String(ps.length + 1).padStart(3, "0"), nombre: d.nombre, categoria: d.categoria, stock: d.cantidad, precio: d.precio, descripcion: d.descripcion }); p = { id: r.id }; }
    await crear("lotes", { ...d, productoId: p.id, estadoCalidad: "Pendiente", historial: [{ fecha: ahora, evento: "Registro del lote", detalle: "Ingreso de insumo al sistema." }, { fecha: ahora, evento: "Almacenamiento", detalle: "Ubicación: " + d.ubicacion }] });
    await crear("movimientos", { productoId: p.id, producto: d.nombre, tipo: "entrada", cantidad: d.cantidad, lote: d.codigo, fecha: ahora });
    toast("Producto registrado"); location.hash = "#productos";
  };
}
