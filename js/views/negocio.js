import { obtener, guardar } from "../services/db.js";
import { esc, toast, formModal } from "../ui.js";
const campos = [{ k: "whatsapp", l: "WhatsApp del negocio (ej. 987654321)", req: false }, { k: "yape", l: "Número de Yape / Plin", req: false }, { k: "titular", l: "Titular de la cuenta", req: false }, { k: "banco", l: "Banco", req: false }, { k: "cuenta", l: "N.º de cuenta / CCI", req: false }];
export async function render(root) {
  const n = (await obtener("config", "negocio")) || {};
  root.innerHTML = `<div class="head"><h1>Datos del negocio</h1><button class="btn" id="e">Editar</button></div><div class="card" style="padding:16px"><p style="color:var(--m);margin-top:0">Estos datos los ven los compradores al pagar y al pedir por WhatsApp.</p>${campos.map(c => `<p><b>${c.l}:</b> ${esc(n[c.k]) || '<span class="err">sin configurar</span>'}</p>`).join("")}</div>`;
  root.querySelector("#e").onclick = async () => { const d = await formModal("Datos del negocio", campos, n); if (d) { await guardar("config", "negocio", d); toast("Datos guardados"); render(root); } };
}
