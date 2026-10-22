import { listar, actualizar } from "../services/db.js";
import { esc, table, toast, filtros, conectarFiltros, norm } from "../ui.js";
const PARAMS = ["Estado del empaque", "Fecha de vencimiento", "Apariencia", "Temperatura"], OPC = ["Conforme", "Observado", "No conforme"];
const resultado = v => v.includes("No conforme") ? "Rechazado" : v.includes("Observado") ? "Observado" : "Aprobado";
export async function render(root) {
  const lotes = await listar("lotes");
  if (!lotes.length) { root.innerHTML = `<h1>Evaluación de calidad</h1><div class="card"><p class="empty">Todavía no hay lotes para evaluar. Cada lote se crea al registrar un insumo.</p><p style="text-align:center"><a class="btn" href="#registrar">Registrar producto</a></p></div>`; return; }
  root.innerHTML = `<h1>Evaluación de calidad</h1>${filtros({ ph: "Buscar lote o insumo...", selects: [{ k: "est", l: "Estado actual", opts: ["Pendiente", "Aprobado", "Observado", "Rechazado"] }] })}<label>Seleccionar lote<select id="l"></select></label>
  ${table(["Parámetro", "Resultado"], PARAMS.map(p => [p, `<select class="p">${OPC.map(o => `<option>${o}</option>`).join("")}</select>`]))}
  <div class="card" style="margin:14px 0">Resultado final: <b id="r"></b></div><button class="btn" id="g">Guardar evaluación</button>`;
  const sels = [...root.querySelectorAll(".p")], r = root.querySelector("#r"), sl = root.querySelector("#l");
  const calc = () => r.textContent = resultado(sels.map(s => s.value)).toUpperCase();
  sels.forEach(s => s.onchange = calc); calc();
  conectarFiltros(root, f => {
    const l = lotes.filter(x => (!f.est || (x.estadoCalidad || "Pendiente") === f.est) && norm((x.codigo || "") + (x.nombre || "")).includes(norm(f.q)));
    sl.innerHTML = l.length ? l.map(x => `<option value="${x.id}">${esc(x.codigo)} - ${esc(x.nombre)} (${esc(x.estadoCalidad || "Pendiente")})</option>`).join("") : '<option value="">Sin resultados</option>';
  });
  root.querySelector("#g").onclick = async () => {
    const l = lotes.find(x => x.id === sl.value); if (!l) return toast("Selecciona un lote", 1);
    const res = resultado(sels.map(s => s.value));
    await actualizar("lotes", l.id, { estadoCalidad: res, historial: [...(l.historial || []), { fecha: new Date().toISOString(), evento: "Evaluación de calidad", detalle: "Resultado: " + res }] });
    toast("Evaluación guardada"); location.hash = "#trazabilidad";
  };
}
