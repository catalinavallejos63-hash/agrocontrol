export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const badge = (t, k) => `<span class="badge ${k}">${esc(t)}</span>`;
export const estadoStock = n => n < 10 ? badge("Stock bajo", "r") : badge("Disponible", "g");
export const table = (cols, rows) => `<div class="card"><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="empty">Sin registros</td></tr>`}</tbody></table></div>`;
export const toast = (m, e) => { const t = document.createElement("div"); t.className = "toast" + (e ? " err" : ""); t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2600); };
const modal = html => { const o = document.createElement("div"); o.className = "overlay"; o.innerHTML = html; document.body.append(o); return o; };
export const confirmar = (t, m) => new Promise(res => { const o = modal(`<div class="modal"><h3>${esc(t)}</h3><p>${esc(m)}</p><div class="row"><button class="btn out" data-n>Cancelar</button><button class="btn red" data-s>Confirmar</button></div></div>`); o.querySelector("[data-n]").onclick = () => { o.remove(); res(false); }; o.querySelector("[data-s]").onclick = () => { o.remove(); res(true); }; });
export const formModal = (t, campos, v = {}) => new Promise(res => {
  const o = modal(`<form class="modal"><h3>${esc(t)}</h3>${campos.map(c => `<label>${c.l}${c.type === "select" ? `<select name="${c.k}">${c.opts.map(x => `<option ${v[c.k] === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>` : `<input name="${c.k}" type="${c.type || "text"}" value="${esc(v[c.k] ?? "")}" ${c.req === false ? "" : "required"} ${c.step ? `step="${c.step}"` : ""} ${c.min != null ? `min="${c.min}"` : ""}>`}</label>`).join("")}<div class="row"><button type="button" class="btn out" data-x>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  o.querySelector("[data-x]").onclick = () => { o.remove(); res(null); };
  o.querySelector("form").onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); o.remove(); res(d); };
});
export const descargarCSV = (nombre, filas) => {
  if (!filas.length) return toast("No hay datos para exportar", 1);
  const k = Object.keys(filas[0]), q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["\ufeff" + [k.join(","), ...filas.map(f => k.map(x => q(f[x])).join(","))].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre + ".csv"; a.click();
};
export const fecha = d => d ? new Date(d).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "";
export const soles = n => "S/ " + Number(n || 0).toFixed(2);
// Ventana de información. `html` debe venir ya escapado por quien la llama.
export const info = (t, html, txt, fn) => {
  const o = modal(`<div class="modal"><h3>${esc(t)}</h3><div>${html}</div><div class="row" style="margin-top:14px"><button class="btn out" data-x>Cerrar</button>${txt ? `<button class="btn" data-ok>${esc(txt)}</button>` : ""}</div></div>`);
  o.querySelector("[data-x]").onclick = () => o.remove();
  const ok = o.querySelector("[data-ok]"); if (ok) ok.onclick = () => { o.remove(); fn(); };
};
