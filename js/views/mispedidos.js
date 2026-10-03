import { listarDe } from "../services/db.js";
import { cargarNegocio, urlWA, PASOS, ETQ, COLOR, itemsDe } from "../services/negocio.js";
import { esc, badge, fecha, soles } from "../ui.js";
export async function render(root, yo) {
  const [lista, neg] = await Promise.all([listarDe("pedidos", "uid", yo.uid), cargarNegocio()]);
  const ps = lista.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const tarjeta = p => {
    const idx = PASOS.indexOf(p.estado), num = p.id.slice(0, 6).toUpperCase();
    const pasos = p.estado === "Rechazado" ? '<p class="err">Este pedido fue rechazado. Escríbenos si tienes dudas.</p>'
      : `<div class="steps">${PASOS.map((s, i) => { const h = (p.historial || []).find(x => x.estado === s); return `<div class="step ${i < idx ? "ok" : i === idx ? "now" : ""}"><i></i><b>${ETQ[s]}</b><small>${h ? fecha(h.fecha) : ""}</small></div>`; }).join("")}</div>`;
    const wa = urlWA(neg.whatsapp, `Hola, soy ${p.nombre}. Consulto por mi pedido N.º ${num}.`);
    return `<div class="card pedido"><div class="head"><h3>Pedido N.º ${num}</h3>${badge(ETQ[p.estado] || p.estado, COLOR[p.estado] || "a")}</div>
    <small style="color:var(--m)">${fecha(p.fecha)} · Pago: ${esc(p.metodoPago || "—")} · Entrega: ${esc(p.direccion || "—")}</small>
    <p>${itemsDe(p).map(i => `${i.cantidad} × ${esc(i.producto)}${i.precio ? ` — ${soles(i.precio * i.cantidad)}` : ""}`).join("<br>")}</p>
    <p><b>Total: ${soles(p.total)}</b></p>${pasos}${wa ? `<a class="mini" target="_blank" rel="noopener" href="${wa}">Escribir por WhatsApp</a>` : ""}</div>`;
  };
  root.innerHTML = `<div class="head"><h1>Mis pedidos</h1><a class="btn" href="#catalogo">Ir al catálogo</a></div>${ps.length ? ps.map(tarjeta).join("") : '<div class="card"><p class="empty">Aún no tienes pedidos.</p></div>'}`;
}
