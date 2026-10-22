import { listar, crear } from "../services/db.js";
import { leer, guardarCarrito, vaciar } from "../services/carrito.js";
import { cargarNegocio, urlWA, METODOS } from "../services/negocio.js";
import { esc, table, toast, soles } from "../ui.js";
export async function render(root, yo) {
  const [prods, neg] = await Promise.all([listar("productos"), cargarNegocio()]);
  // Actualiza precios/stock y quita lo que ya no está disponible.
  let c = leer(yo.uid).map(i => { const p = prods.find(x => x.id === i.productoId); return p && p.stock > 0 && p.precio > 0 ? { ...i, producto: p.nombre, precio: p.precio, stock: p.stock, cantidad: Math.min(i.cantidad, p.stock) } : null; }).filter(Boolean);
  guardarCarrito(yo.uid, c);
  if (!c.length) { root.innerHTML = `<h1>Mi carrito</h1><div class="card"><p class="empty">Tu carrito está vacío.</p><p style="text-align:center"><a class="btn" href="#catalogo">Ir al catálogo</a></p></div>`; return; }
  const total = () => c.reduce((a, i) => a + i.precio * i.cantidad, 0);
  root.innerHTML = `<h1>Mi carrito</h1><div class="two"><div><div id="items"></div></div>
  <form class="card" id="f"><h3>Datos de entrega y pago</h3>
  <label>Nombre de contacto<input name="nombre" value="${esc(yo.nombre)}" required></label>
  <label>Teléfono / WhatsApp<input name="telefono" type="tel" required></label>
  <label>Dirección o punto de entrega<input name="direccion" required></label>
  <label>Método de pago<select name="metodoPago">${METODOS.map(m => `<option>${esc(m)}</option>`).join("")}</select></label>
  <div class="instr" id="instr"></div>
  <button class="btn" style="width:100%">Realizar pedido</button>
  <button type="button" class="btn out gbtn" id="wa" style="margin-top:8px">Pedir por WhatsApp</button></form></div>`;
  const f = root.querySelector("#f"), box = root.querySelector("#items"), ins = root.querySelector("#instr");
  const titular = neg.titular ? ` a nombre de ${neg.titular}` : "";
  const instrucciones = () => ({
    "Yape": neg.yape ? `Yapea ${soles(total())} al ${neg.yape}${titular}. Luego envía la captura por WhatsApp.` : "Coordina el pago por Yape escribiéndonos por WhatsApp.",
    "Plin": neg.yape ? `Plinea ${soles(total())} al ${neg.yape}${titular}. Luego envía la captura por WhatsApp.` : "Coordina el pago por Plin escribiéndonos por WhatsApp.",
    "Transferencia bancaria": neg.cuenta ? `Transfiere ${soles(total())} a ${neg.banco || "la cuenta"}: ${neg.cuenta}${titular}. Luego envía el comprobante por WhatsApp.` : "Pídenos los datos de la cuenta por WhatsApp.",
    "Contra entrega (efectivo)": "Pagas en efectivo cuando recibas tu pedido."
  })[f.metodoPago.value];
  const pintar = () => {
    guardarCarrito(yo.uid, c);
    if (!c.length) return render(root, yo);
    box.innerHTML = table(["Producto", "Precio", "Cantidad", "Subtotal", ""], c.map((i, k) => [esc(i.producto), soles(i.precio), `<span class="qty"><button class="mini" data-a="-" data-k="${k}">−</button>${i.cantidad}<button class="mini" data-a="+" data-k="${k}">+</button></span>`, soles(i.precio * i.cantidad), `<button class="mini red" data-a="x" data-k="${k}">Quitar</button>`])) + `<div class="total">Total: ${soles(total())}</div>`;
    ins.textContent = instrucciones();
  };
  pintar();
  box.onclick = e => {
    const b = e.target.closest("button"); if (!b) return; const i = c[+b.dataset.k];
    if (b.dataset.a === "x") c.splice(+b.dataset.k, 1);
    else if (b.dataset.a === "+") { if (i.cantidad >= i.stock) return toast("No hay más stock disponible", 1); i.cantidad++; }
    else if (i.cantidad > 1) i.cantidad--;
    pintar();
  };
  f.metodoPago.onchange = () => ins.textContent = instrucciones();

  const enviar = async canal => {
    if (!f.reportValidity()) return;
    if (canal === "WhatsApp" && !urlWA(neg.whatsapp, "")) return toast("El negocio aún no configuró su número de WhatsApp", 1);
    const d = Object.fromEntries(new FormData(f)), w = canal === "WhatsApp" ? window.open("", "_blank") : null, ahora = new Date().toISOString();
    try {
      const items = c.map(i => ({ productoId: i.productoId, producto: i.producto, precio: i.precio, cantidad: i.cantidad }));
      const r = await crear("pedidos", { uid: yo.uid, nombre: d.nombre, correo: yo.correo, telefono: d.telefono, direccion: d.direccion, metodoPago: d.metodoPago, canal, items, total: total(), estado: "Pendiente", fecha: ahora, historial: [{ estado: "Pendiente", fecha: ahora }] });
      if (w) {
        const lineas = items.map(i => `• ${i.cantidad} × ${i.producto} — ${soles(i.precio * i.cantidad)}`).join("\n");
        w.location.href = urlWA(neg.whatsapp, `Hola, quiero confirmar mi pedido N.º ${r.id.slice(0, 6).toUpperCase()}:\n${lineas}\nTotal: ${soles(total())}\nPago: ${d.metodoPago}\nEntrega: ${d.direccion}\nNombre: ${d.nombre} · Tel: ${d.telefono}`);
      }
      vaciar(yo.uid); toast("Pedido enviado. Aquí puedes seguirlo."); location.hash = "#mispedidos";
    } catch (er) { if (w) w.close(); toast("No se pudo enviar el pedido: " + (er.code || er.message), 1); }
  };
  f.onsubmit = e => { e.preventDefault(); enviar("Web"); };
  root.querySelector("#wa").onclick = () => enviar("WhatsApp");
}
